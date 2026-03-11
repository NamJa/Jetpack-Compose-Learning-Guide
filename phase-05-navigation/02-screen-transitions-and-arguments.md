# 화면 전환과 인수 전달

> **"화면 사이에 데이터를 주고받는 것은, 앱의 기능을 연결하는 다리를 놓는 것이다."**
>
> 내비게이션에서 가장 실용적인 부분은 화면 간 데이터 전달입니다. 이 문서에서는 Type-Safe한 인수 전달, ViewModel 연동, 화면 전환 애니메이션, 그리고 결과 반환 패턴까지 다룹니다.

---

## 목차

1. [인수 전달: @Serializable data class에 프로퍼티 추가](#1-인수-전달-serializable-data-class에-프로퍼티-추가)
2. [backStackEntry.toRoute\<T\>()로 인수 읽기](#2-backstackentrytoroute로-인수-읽기)
3. [복잡한 데이터: ID만 전달하고 ViewModel에서 로드](#3-복잡한-데이터-id만-전달하고-viewmodel에서-로드)
4. [SavedStateHandle.toRoute\<T\>()](#4-savedstatehandletoroute)
5. [딥 링크와 Type-Safe 경로](#5-딥-링크와-type-safe-경로)
6. [화면 전환 애니메이션: enterTransition, exitTransition](#6-화면-전환-애니메이션-entertransition-exittransition)
7. [Navigation에서 결과 반환: savedStateHandle](#7-navigation에서-결과-반환-savedstatehandle)

---

## 1. 인수 전달: @Serializable data class에 프로퍼티 추가

Type-Safe Navigation에서 인수를 전달하려면, **경로(Route) data class에 프로퍼티를 추가**하기만 하면 됩니다. Navigation 라이브러리가 자동으로 직렬화/역직렬화를 처리합니다.

```kotlin
import kotlinx.serialization.Serializable

// 인수 없는 경로
@Serializable
object Home

// 필수 인수가 있는 경로
@Serializable
data class Detail(
    val itemId: Int
)

// 여러 인수 + 선택적(optional) 인수
@Serializable
data class Search(
    val query: String,
    val category: String = "all",  // 기본값이 있으면 선택적 인수
    val page: Int = 1
)

// Nullable 인수
@Serializable
data class UserProfile(
    val userId: String,
    val tab: String? = null  // null 허용
)
```

**지원되는 인수 타입:**
- 기본 타입: `Int`, `Long`, `Float`, `Boolean`, `String`
- Nullable 버전: `Int?`, `String?` 등
- Enum 클래스 (`@Serializable` 필요)
- Value class: `@JvmInline value class UserId(val value: String)` 등 (Navigation 2.9+)
- 커스텀 타입 (커스텀 `NavType` 필요, 고급 주제)

---

## 2. backStackEntry.toRoute\<T\>()로 인수 읽기

화면에서 전달받은 인수를 읽으려면, `composable<Route>` 블록에서 `backStackEntry.toRoute<T>()`를 호출합니다.

```kotlin
import androidx.navigation.toRoute

@Composable
fun MyNavHost(navController: NavHostController) {
    NavHost(
        navController = navController,
        startDestination = Home
    ) {
        composable<Home> {
            HomeScreen(
                onItemClick = { itemId ->
                    // 인수를 담아 이동
                    navController.navigate(Detail(itemId = itemId))
                },
                onSearch = { query ->
                    // 선택적 인수는 기본값 사용 가능
                    navController.navigate(Search(query = query))
                }
            )
        }

        composable<Detail> { backStackEntry ->
            // toRoute<T>()로 타입 안전하게 인수 추출
            val route = backStackEntry.toRoute<Detail>()

            DetailScreen(
                itemId = route.itemId,
                onBack = { navController.popBackStack() }
            )
        }

        composable<Search> { backStackEntry ->
            val route = backStackEntry.toRoute<Search>()

            SearchScreen(
                query = route.query,
                category = route.category,  // 전달하지 않으면 "all"
                page = route.page           // 전달하지 않으면 1
            )
        }
    }
}
```

**사용 흐름 요약:**
1. `@Serializable data class`에 프로퍼티 정의
2. `navController.navigate(Route(arg1, arg2))`로 이동
3. `backStackEntry.toRoute<Route>()`로 인수 읽기

---

## 3. 복잡한 데이터: ID만 전달하고 ViewModel에서 로드

Navigation으로 전달하는 데이터는 **가능한 한 최소화**해야 합니다. 복잡한 객체(예: 상품 전체 정보)를 직접 전달하는 대신, **ID만 전달하고 ViewModel에서 데이터를 로드**하는 패턴이 권장됩니다.

**왜 ID만 전달하는가?**
- Navigation 인수는 URL 파라미터처럼 직렬화되므로 크기에 제한이 있음
- 딥 링크에서도 동일한 경로를 사용할 수 있음
- 데이터의 단일 진실 공급원(Single Source of Truth) 유지

```kotlin
// 경로: ID만 정의
@Serializable
data class ProductDetail(val productId: Long)

// ViewModel: ID를 받아 데이터 로드
class ProductDetailViewModel(
    savedStateHandle: SavedStateHandle
) : ViewModel() {

    // SavedStateHandle에서 경로의 인수를 자동으로 읽기
    private val route = savedStateHandle.toRoute<ProductDetail>()
    private val productId = route.productId

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

// 화면 컴포저블
@Composable
fun ProductDetailScreen(
    viewModel: ProductDetailViewModel = viewModel()
) {
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

---

## 4. SavedStateHandle.toRoute\<T\>()

ViewModel에서 Navigation 인수를 읽을 때는 `SavedStateHandle.toRoute<T>()`를 사용합니다. Navigation 라이브러리가 자동으로 경로 인수를 `SavedStateHandle`에 저장해주기 때문입니다.

```kotlin
import androidx.lifecycle.SavedStateHandle
import androidx.lifecycle.ViewModel
import androidx.navigation.toRoute

class DetailViewModel(
    savedStateHandle: SavedStateHandle
) : ViewModel() {

    // SavedStateHandle에서 타입 안전하게 경로 추출
    private val route = savedStateHandle.toRoute<Detail>()

    val itemId: Int = route.itemId

    // itemId를 사용해 데이터 로드
    private val _uiState = MutableStateFlow(DetailUiState())
    val uiState: StateFlow<DetailUiState> = _uiState.asStateFlow()

    init {
        loadDetail(itemId)
    }

    private fun loadDetail(id: Int) {
        viewModelScope.launch {
            val item = repository.getItem(id)
            _uiState.update { it.copy(item = item, isLoading = false) }
        }
    }
}

// NavHost에서 사용
composable<Detail> {
    // ViewModel이 자동으로 SavedStateHandle에서 인수를 읽음
    val viewModel: DetailViewModel = viewModel()
    val uiState by viewModel.uiState.collectAsStateWithLifecycle()

    DetailScreen(uiState = uiState)
}
```

> **팁**: `SavedStateHandle.toRoute<T>()`는 프로세스 종료 후 복원 시에도 인수를 올바르게 복원합니다. 이는 앱이 백그라운드에서 시스템에 의해 종료된 후에도 상태를 유지하는 데 중요합니다.

---

## 5. 딥 링크와 Type-Safe 경로

Type-Safe Navigation에서 딥 링크를 설정할 때, `navDeepLink<T>(basePath = ...)`를 사용하면 경로 클래스의 프로퍼티가 자동으로 URI 파라미터에 매핑됩니다.

```kotlin
import androidx.navigation.navDeepLink

val uri = "https://www.myapp.com"

@Serializable
data class Profile(val id: String)

NavHost(
    navController = navController,
    startDestination = Home
) {
    composable<Home> {
        HomeScreen(/* ... */)
    }

    composable<Profile>(
        deepLinks = listOf(
            // https://www.myapp.com/profile/{id}
            navDeepLink<Profile>(basePath = "$uri/profile")
        )
    ) { backStackEntry ->
        val profile = backStackEntry.toRoute<Profile>()
        ProfileScreen(profileId = profile.id)
    }
}
```

> **팁**: `navDeepLink<T>(basePath = ...)`는 `@Serializable` 클래스의 프로퍼티명을 URI 경로 파라미터로 자동 매핑합니다. 위 예제에서 `Profile(val id: String)`은 `basePath/profile/{id}` 패턴으로 매핑됩니다.

---

## 6. 화면 전환 애니메이션: enterTransition, exitTransition

화면 전환 시 애니메이션을 추가하면 사용자 경험이 크게 향상됩니다. `composable` 블록에 전환 애니메이션을 지정할 수 있습니다.

### 기본 전환 애니메이션

```kotlin
import androidx.compose.animation.*
import androidx.compose.animation.core.tween

NavHost(
    navController = navController,
    startDestination = Home
) {
    composable<Home>(
        // 이 화면으로 들어올 때
        enterTransition = {
            fadeIn(animationSpec = tween(300))
        },
        // 이 화면에서 나갈 때
        exitTransition = {
            fadeOut(animationSpec = tween(300))
        },
        // 뒤로 가기로 이 화면에 돌아올 때
        popEnterTransition = {
            fadeIn(animationSpec = tween(300))
        },
        // 뒤로 가기로 이 화면을 떠날 때
        popExitTransition = {
            fadeOut(animationSpec = tween(300))
        }
    ) {
        HomeScreen(/* ... */)
    }
}
```

### 슬라이드 전환 애니메이션

```kotlin
composable<Detail>(
    enterTransition = {
        slideInHorizontally(
            initialOffsetX = { fullWidth -> fullWidth },  // 오른쪽에서 들어옴
            animationSpec = tween(300)
        )
    },
    exitTransition = {
        slideOutHorizontally(
            targetOffsetX = { fullWidth -> -fullWidth },  // 왼쪽으로 나감
            animationSpec = tween(300)
        )
    },
    popEnterTransition = {
        slideInHorizontally(
            initialOffsetX = { fullWidth -> -fullWidth },  // 왼쪽에서 들어옴 (뒤로 가기)
            animationSpec = tween(300)
        )
    },
    popExitTransition = {
        slideOutHorizontally(
            targetOffsetX = { fullWidth -> fullWidth },  // 오른쪽으로 나감 (뒤로 가기)
            animationSpec = tween(300)
        )
    }
) { backStackEntry ->
    val route = backStackEntry.toRoute<Detail>()
    DetailScreen(itemId = route.itemId)
}
```

### NavHost 전체에 기본 애니메이션 설정

```kotlin
NavHost(
    navController = navController,
    startDestination = Home,
    // 모든 화면에 기본 적용
    enterTransition = {
        slideInHorizontally(initialOffsetX = { it }) + fadeIn()
    },
    exitTransition = {
        slideOutHorizontally(targetOffsetX = { -it }) + fadeOut()
    },
    popEnterTransition = {
        slideInHorizontally(initialOffsetX = { -it }) + fadeIn()
    },
    popExitTransition = {
        slideOutHorizontally(targetOffsetX = { it }) + fadeOut()
    }
) {
    composable<Home> { HomeScreen(/* ... */) }
    composable<Detail> { DetailScreen(/* ... */) }
}
```

> **`+` 연산자**: 여러 애니메이션을 조합할 수 있습니다. `slideInHorizontally() + fadeIn()`은 슬라이드와 페이드를 동시에 적용합니다.

---

## 7. Navigation에서 결과 반환: savedStateHandle

어떤 화면(B)에서 작업한 결과를 이전 화면(A)으로 돌려줘야 할 때, `savedStateHandle`을 활용합니다.

**사용 시나리오**: 필터 선택 화면에서 선택한 필터를 목록 화면으로 반환

### 결과를 보내는 쪽 (B 화면)

```kotlin
@Serializable
object FilterScreen

@Composable
fun FilterScreen(
    onApplyFilter: (String) -> Unit
) {
    var selectedFilter by remember { mutableStateOf("latest") }

    Column(modifier = Modifier.padding(16.dp)) {
        Text("필터 선택", style = MaterialTheme.typography.headlineSmall)

        listOf("latest", "popular", "price_low", "price_high").forEach { filter ->
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .clickable { selectedFilter = filter }
                    .padding(12.dp),
                verticalAlignment = Alignment.CenterVertically
            ) {
                RadioButton(
                    selected = selectedFilter == filter,
                    onClick = { selectedFilter = filter }
                )
                Spacer(modifier = Modifier.width(8.dp))
                Text(text = filter)
            }
        }

        Button(onClick = { onApplyFilter(selectedFilter) }) {
            Text("적용")
        }
    }
}
```

### 결과를 받는 쪽 (A 화면)

```kotlin
composable<Home> { backStackEntry ->
    // 이전 화면(B)이 savedStateHandle에 저장한 결과를 관찰
    val savedStateHandle = backStackEntry.savedStateHandle
    val filterResult by savedStateHandle
        .getStateFlow("filter_key", "latest")
        .collectAsStateWithLifecycle()

    HomeScreen(
        currentFilter = filterResult,
        onOpenFilter = { navController.navigate(FilterScreen) }
    )
}

composable<FilterScreen> {
    FilterScreen(
        onApplyFilter = { selectedFilter ->
            // 이전 화면의 savedStateHandle에 결과 저장
            navController.previousBackStackEntry
                ?.savedStateHandle
                ?.set("filter_key", selectedFilter)
            // 현재 화면을 닫고 이전 화면으로 돌아감
            navController.popBackStack()
        }
    )
}
```

**흐름 정리:**
1. A 화면 → B 화면으로 이동
2. B 화면에서 작업 완료
3. B 화면이 `previousBackStackEntry.savedStateHandle`에 결과 저장
4. B 화면이 `popBackStack()`으로 종료
5. A 화면이 자신의 `savedStateHandle`에서 결과를 관찰하여 UI 업데이트

> **주의**: 결과 반환은 간단한 값(문자열, 숫자 등)에만 사용하세요. 복잡한 데이터는 공유 ViewModel이나 Repository 패턴을 사용하는 것이 낫습니다.

---

> **다음 문서**: [03. 고급 내비게이션 패턴](03-advanced-navigation.md)에서는 중첩 그래프, 딥 링크, 적응형 내비게이션 등 더 복잡한 패턴을 학습합니다.
