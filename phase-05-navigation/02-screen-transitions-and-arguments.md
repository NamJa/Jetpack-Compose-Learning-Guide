# 화면 전환과 인수 전달

> **"화면 사이에 데이터를 주고받는 것은, 앱의 기능을 연결하는 다리를 놓는 것이다."**
>
> 내비게이션에서 가장 실용적인 부분은 화면 간 데이터 전달입니다. 이 문서에서는 Navigation3에서의 타입 안전한 인수 전달, ViewModel 연동, 화면 전환 애니메이션, 그리고 다이얼로그 패턴까지 다룹니다.

---

## 목차

1. [인수 전달: NavKey data class에 프로퍼티 추가](#1-인수-전달-navkey-data-class에-프로퍼티-추가)
2. [entry\<T\> { key -> }에서 인수 읽기](#2-entryt--key--에서-인수-읽기)
3. [복잡한 데이터: ID만 전달하고 ViewModel에서 로드](#3-복잡한-데이터-id만-전달하고-viewmodel에서-로드)
4. [ViewModel 스코핑: NavEntryDecorator](#4-viewmodel-스코핑-naventrydecorator)
5. [화면 전환 애니메이션: transitionSpec](#5-화면-전환-애니메이션-transitionspec)
6. [다이얼로그: DialogSceneStrategy](#6-다이얼로그-dialogscenestrategy)

---

## 1. 인수 전달: NavKey data class에 프로퍼티 추가

Navigation3에서 인수를 전달하려면, **NavKey data class에 프로퍼티를 추가**하기만 하면 됩니다. `@Serializable`과 `NavKey` 인터페이스 덕분에 직렬화/역직렬화가 자동으로 처리됩니다.

```kotlin [compose-playground]
import kotlinx.serialization.Serializable
import androidx.navigation3.runtime.NavKey

// 인수 없는 경로
@Serializable
data object Home : NavKey

// 필수 인수가 있는 경로
@Serializable
data class Detail(
    val itemId: Int
) : NavKey

// 여러 인수 + 선택적(optional) 인수
@Serializable
data class Search(
    val query: String,
    val category: String = "all",  // 기본값이 있으면 선택적 인수
    val page: Int = 1
) : NavKey

// Nullable 인수
@Serializable
data class UserProfile(
    val userId: String,
    val tab: String? = null  // null 허용
) : NavKey
```

**지원되는 인수 타입:**
- 기본 타입: `Int`, `Long`, `Float`, `Boolean`, `String`
- Nullable 버전: `Int?`, `String?` 등
- Enum 클래스 (`@Serializable` 필요)
- Value class: `@JvmInline value class UserId(val value: String)` 등
- 커스텀 타입 (Kotlin Serialization의 `@Serializable`이면 가능)

---

## 2. entry\<T\> { key -> }에서 인수 읽기

Navigation3에서 인수를 읽는 방법은 매우 직관적입니다. `entry<T> { key -> }` 람다에서 **`key` 파라미터가 이미 해당 NavKey 타입으로 전달**되므로, `toRoute<T>()`같은 변환이 필요 없습니다.

```kotlin [compose-playground]
import androidx.navigation3.ui.NavDisplay
import androidx.navigation3.runtime.entryProvider
import androidx.navigation3.runtime.rememberNavBackStack

@Composable
fun MyApp() {
    val backStack = rememberNavBackStack(Home)

    NavDisplay(
        backStack = backStack,
        onBack = { backStack.removeLastOrNull() },
        entryProvider = entryProvider {
            entry<Home> {
                HomeScreen(
                    onItemClick = { itemId ->
                        // 인수를 담아 이동
                        backStack.add(Detail(itemId = itemId))
                    },
                    onSearch = { query ->
                        // 선택적 인수는 기본값 사용 가능
                        backStack.add(Search(query = query))
                    }
                )
            }

            entry<Detail> { key ->
                // key는 이미 Detail 타입 — 바로 프로퍼티 접근
                DetailScreen(
                    itemId = key.itemId,
                    onBack = { backStack.removeLastOrNull() }
                )
            }

            entry<Search> { key ->
                // key는 이미 Search 타입
                SearchScreen(
                    query = key.query,
                    category = key.category,  // 전달하지 않으면 "all"
                    page = key.page           // 전달하지 않으면 1
                )
            }
        }
    )
}
```

**사용 흐름 요약:**
1. `@Serializable data class ... : NavKey`에 프로퍼티 정의
2. `backStack.add(Route(arg1, arg2))`로 이동
3. `entry<Route> { key -> key.arg1 }` 로 인수 읽기

**Navigation 2.x와의 비교:**

| 단계 | Navigation 2.x | Navigation3 |
|------|---------------|-------------|
| 이동 | `navController.navigate(Detail(itemId = 42))` | `backStack.add(Detail(itemId = 42))` |
| 인수 읽기 | `backStackEntry.toRoute<Detail>().itemId` | `key.itemId` (람다 파라미터) |

---

## 3. 복잡한 데이터: ID만 전달하고 ViewModel에서 로드

Navigation으로 전달하는 데이터는 **가능한 한 최소화**해야 합니다. 복잡한 객체(예: 상품 전체 정보)를 직접 전달하는 대신, **ID만 전달하고 ViewModel에서 데이터를 로드**하는 패턴이 권장됩니다. 이 원칙은 Navigation3에서도 동일합니다.

**왜 ID만 전달하는가?**
- Navigation 인수는 직렬화되므로 크기에 제한이 있음
- 데이터의 단일 진실 공급원(Single Source of Truth) 유지
- 프로세스 재시작 시에도 ID로 데이터를 다시 로드할 수 있음

```kotlin [compose-playground]
// 경로: ID만 정의
@Serializable
data class ProductDetail(val productId: Long) : NavKey

// ViewModel: ID를 받아 데이터 로드
class ProductDetailViewModel(
    private val productId: Long,
    private val repository: ProductRepository
) : ViewModel() {

    private val _product = MutableStateFlow<Product?>(null)
    val product: StateFlow<Product?> = _product.asStateFlow()

    init {
        loadProduct()
    }

    private fun loadProduct() {
        viewModelScope.launch {
            _product.value = repository.getProduct(productId)
        }
    }
}

// NavDisplay에서 사용
entry<ProductDetail> { key ->
    // key에서 productId를 꺼내 ViewModel에 전달
    val viewModel: ProductDetailViewModel = viewModel(
        factory = ProductDetailViewModelFactory(
            productId = key.productId
        )
    )
    val product by viewModel.product.collectAsStateWithLifecycle()

    product?.let { item ->
        Column(modifier = Modifier.padding(16.dp)) {
            Text(text = item.name, style = MaterialTheme.typography.headlineMedium)
            Text(text = "${item.price}원", style = MaterialTheme.typography.bodyLarge)
            Text(text = item.description)
        }
    } ?: Box(
        modifier = Modifier.fillMaxSize(),
        contentAlignment = Alignment.Center
    ) {
        CircularProgressIndicator()
    }
}
```

> **Navigation 2.x와의 차이**: 2.x에서는 `SavedStateHandle.toRoute<T>()`로 ViewModel 안에서 인수를 읽었습니다. Navigation3에서는 `entry` 블록의 `key` 파라미터에서 인수를 꺼내 ViewModel 팩토리에 전달하는 패턴이 더 명확합니다.

---

## 4. ViewModel 스코핑: NavEntryDecorator

Navigation3에서 ViewModel을 화면(NavEntry) 단위로 스코핑하려면 **`NavEntryDecorator`**를 사용합니다. 데코레이터는 NavEntry에 추가적인 기능을 래핑하는 패턴입니다.

### 핵심 데코레이터 두 가지

```kotlin [compose-playground]
import androidx.navigation3.runtime.rememberSaveableStateHolderNavEntryDecorator
import androidx.lifecycle.viewmodel.navigation3.rememberViewModelStoreNavEntryDecorator

NavDisplay(
    backStack = backStack,
    onBack = { backStack.removeLastOrNull() },
    entryDecorators = listOf(
        // 1. 화면 상태를 저장/복원 (구성 변경, 프로세스 종료 시)
        rememberSaveableStateHolderNavEntryDecorator(),
        // 2. ViewModel을 NavEntry 단위로 스코핑
        rememberViewModelStoreNavEntryDecorator()
    ),
    entryProvider = entryProvider {
        entry<Home> { HomeScreen(/* ... */) }
        entry<Detail> { key -> DetailScreen(key.itemId) }
    }
)
```

**데코레이터 동작 원리:**

| 데코레이터 | 역할 | 생명주기 |
|-----------|------|---------|
| `rememberSaveableStateHolderNavEntryDecorator` | `remember`/`rememberSaveable` 상태 보존 | NavEntry가 백 스택에 있는 동안 유지 |
| `rememberViewModelStoreNavEntryDecorator` | ViewModel을 NavEntry에 스코핑 | NavEntry가 백 스택에서 제거되면 ViewModel도 해제 |

> **핵심**: `rememberViewModelStoreNavEntryDecorator`를 추가하면, `entry` 블록 안에서 `viewModel()`을 호출했을 때 해당 NavEntry에 스코핑된 ViewModel이 생성됩니다. 화면이 백 스택에서 제거되면 ViewModel도 함께 정리됩니다.

---

## 5. 화면 전환 애니메이션: transitionSpec

Navigation3에서는 `NavDisplay`에 직접 전환 애니메이션을 설정합니다. 전역 애니메이션과 화면별 커스텀 애니메이션 두 가지 방식을 지원합니다.

### 전역 애니메이션 설정

```kotlin [compose-playground]
import androidx.compose.animation.*
import androidx.compose.animation.core.tween

NavDisplay(
    backStack = backStack,
    onBack = { backStack.removeLastOrNull() },
    // 앞으로 이동할 때 (화면이 백 스택에 추가)
    transitionSpec = {
        slideInHorizontally(initialOffsetX = { it }) togetherWith
            slideOutHorizontally(targetOffsetX = { -it })
    },
    // 뒤로 갈 때 (화면이 백 스택에서 제거)
    popTransitionSpec = {
        slideInHorizontally(initialOffsetX = { -it }) togetherWith
            slideOutHorizontally(targetOffsetX = { it })
    },
    // 예측형 뒤로 가기 제스처
    predictivePopTransitionSpec = {
        slideInHorizontally(initialOffsetX = { -it }) togetherWith
            slideOutHorizontally(targetOffsetX = { it })
    },
    entryProvider = entryProvider {
        entry<Home> { HomeScreen(/* ... */) }
        entry<Detail> { key -> DetailScreen(key.itemId) }
    }
)
```

### 특정 화면에만 커스텀 애니메이션 적용

`entry`의 `metadata` 파라미터로 화면별 애니메이션을 오버라이드할 수 있습니다.

```kotlin [compose-playground]
entryProvider = entryProvider {
    entry<Home> {
        HomeScreen(/* ... */)
    }

    // Detail 화면: 아래에서 위로 슬라이드
    entry<Detail>(
        metadata = NavDisplay.transitionSpec {
            slideInVertically(
                initialOffsetY = { it },
                animationSpec = tween(300)
            ) togetherWith ExitTransition.KeepUntilTransitionsFinished
        } + NavDisplay.popTransitionSpec {
            EnterTransition.None togetherWith
                slideOutVertically(
                    targetOffsetY = { it },
                    animationSpec = tween(300)
                )
        } + NavDisplay.predictivePopTransitionSpec {
            EnterTransition.None togetherWith
                slideOutVertically(
                    targetOffsetY = { it },
                    animationSpec = tween(300)
                )
        }
    ) { key ->
        DetailScreen(itemId = key.itemId)
    }
}
```

**Navigation 2.x와의 비교:**

| Navigation 2.x | Navigation3 |
|----------------|-------------|
| `composable<T>(enterTransition = { ... })` | `entry<T>(metadata = NavDisplay.transitionSpec { ... })` |
| `NavHost(enterTransition = { ... })` | `NavDisplay(transitionSpec = { ... })` |
| `enterTransition` + `exitTransition` (개별 설정) | `ContentTransformSpec` (`togetherWith`로 enter/exit 한 번에 정의) |
| `popEnterTransition` + `popExitTransition` | `popTransitionSpec` |

> **`togetherWith` 연산자**: Navigation3에서는 enter 애니메이션과 exit 애니메이션을 `togetherWith`로 **하나의 ContentTransform으로 결합**합니다. `slideInHorizontally() togetherWith slideOutHorizontally()`는 새 화면이 슬라이드 인하면서 기존 화면이 슬라이드 아웃하는 효과입니다.

---

## 6. 다이얼로그: DialogSceneStrategy

Navigation3에서 다이얼로그를 표시하려면 `DialogSceneStrategy`를 사용합니다. 다이얼로그는 기존 화면 위에 오버레이로 표시됩니다.

```kotlin [compose-playground]
import androidx.navigation3.scene.DialogSceneStrategy

@Serializable
data object ConfirmDialog : NavKey

@Composable
fun MyApp() {
    val backStack = rememberNavBackStack(Home)

    NavDisplay(
        backStack = backStack,
        onBack = { backStack.removeLastOrNull() },
        // DialogSceneStrategy를 sceneStrategy에 설정
        sceneStrategy = remember { DialogSceneStrategy() },
        entryDecorators = listOf(
            rememberSaveableStateHolderNavEntryDecorator(),
            rememberViewModelStoreNavEntryDecorator()
        ),
        entryProvider = entryProvider {
            entry<Home> {
                HomeScreen(
                    onShowConfirm = { backStack.add(ConfirmDialog) }
                )
            }

            // 다이얼로그로 표시할 항목: metadata에 dialog() 설정
            entry<ConfirmDialog>(
                metadata = DialogSceneStrategy.dialog()
            ) {
                AlertDialog(
                    onDismissRequest = { backStack.removeLastOrNull() },
                    title = { Text("확인") },
                    text = { Text("정말 삭제하시겠습니까?") },
                    confirmButton = {
                        TextButton(onClick = {
                            // 삭제 처리
                            backStack.removeLastOrNull()
                        }) {
                            Text("삭제")
                        }
                    },
                    dismissButton = {
                        TextButton(onClick = { backStack.removeLastOrNull() }) {
                            Text("취소")
                        }
                    }
                )
            }
        }
    )
}
```

**Navigation 2.x와의 비교:**

| Navigation 2.x | Navigation3 |
|----------------|-------------|
| `dialog<Route> { }` (NavGraphBuilder) | `entry<Route>(metadata = DialogSceneStrategy.dialog()) { }` |
| 자동으로 다이얼로그로 렌더링 | `sceneStrategy`에 `DialogSceneStrategy()` 설정 필요 |

> **팁**: 다이얼로그를 닫으려면 `backStack.removeLastOrNull()`을 호출하면 됩니다. 일반 화면의 뒤로 가기와 동일한 패턴입니다.

---

> **다음 문서**: [03. 고급 내비게이션 패턴](03-advanced-navigation.md)에서는 모듈화, 적응형 내비게이션, ViewModel 공유, 상태 관리 등 더 복잡한 패턴을 학습합니다.
