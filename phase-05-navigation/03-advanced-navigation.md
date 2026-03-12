# 고급 내비게이션 패턴

> **"좋은 내비게이션은 사용자가 의식하지 못하는 내비게이션이다."**
>
> 앱이 복잡해지면 단순한 화면 이동만으로는 부족합니다. 이 문서에서는 Navigation3의 모듈화, 적응형 내비게이션, ViewModel 공유, 상태 저장, 테스트 패턴 등 실무에서 필요한 고급 패턴을 다룹니다.

---

## 목차

1. [모듈화: EntryProviderScope 확장 함수](#1-모듈화-entryproviderscope-확장-함수)
2. [적응형 내비게이션: NavigationSuiteScaffold](#2-적응형-내비게이션-navigationsuiteescaffold)
3. [Navigation3에서 ViewModel 공유](#3-navigation3에서-viewmodel-공유)
4. [상태 저장과 복원](#4-상태-저장과-복원)
5. [테스트 패턴](#5-테스트-패턴)
6. [베스트 프랙티스](#6-베스트-프랙티스)

---

## 1. 모듈화: EntryProviderScope 확장 함수

앱의 규모가 커지면 모든 화면을 하나의 `entryProvider`에 나열하기 어렵습니다. Navigation3에서는 **`EntryProviderScope` 확장 함수**를 사용하여 기능별로 내비게이션을 분리합니다.

**사용 시나리오:**
- 인증(로그인/회원가입) 흐름을 별도 모듈로 분리
- 설정 화면 그룹을 별도 모듈로 관리
- 기능 모듈별로 내비게이션을 분리

### 기능 모듈에서 경로와 엔트리 정의

```kotlin [compose-playground]
import kotlinx.serialization.Serializable
import androidx.navigation3.runtime.NavKey
import androidx.navigation3.runtime.EntryProviderScope

// feature-auth 모듈
@Serializable data object Login : NavKey
@Serializable data object Register : NavKey
@Serializable data object ForgotPassword : NavKey

// 확장 함수로 인증 관련 화면들을 그룹화
fun EntryProviderScope<NavKey>.authSection(
    onLoginSuccess: () -> Unit,
    onNavigate: (NavKey) -> Unit,
    onBack: () -> Unit
) {
    entry<Login> {
        LoginScreen(
            onLoginSuccess = onLoginSuccess,
            onRegister = { onNavigate(Register) },
            onForgotPassword = { onNavigate(ForgotPassword) }
        )
    }
    entry<Register> {
        RegisterScreen(onBack = onBack)
    }
    entry<ForgotPassword> {
        ForgotPasswordScreen(onBack = onBack)
    }
}

// feature-settings 모듈
@Serializable data object Settings : NavKey
@Serializable data object SettingsDetail : NavKey

fun EntryProviderScope<NavKey>.settingsSection(
    onNavigate: (NavKey) -> Unit,
    onBack: () -> Unit
) {
    entry<Settings> {
        SettingsScreen(
            onDetail = { onNavigate(SettingsDetail) }
        )
    }
    entry<SettingsDetail> {
        SettingsDetailScreen(onBack = onBack)
    }
}
```

### 앱 모듈에서 통합

```kotlin [compose-playground]
// app 모듈
@Serializable data object Home : NavKey

@Composable
fun AppNavDisplay() {
    val backStack = rememberNavBackStack(Home)

    NavDisplay(
        backStack = backStack,
        onBack = { backStack.removeLastOrNull() },
        entryDecorators = listOf(
            rememberSaveableStateHolderNavEntryDecorator(),
            rememberViewModelStoreNavEntryDecorator()
        ),
        entryProvider = entryProvider {
            // 앱 모듈의 화면
            entry<Home> {
                HomeScreen(
                    onSettings = { backStack.add(Settings) }
                )
            }

            // 기능 모듈의 화면들을 확장 함수로 등록
            authSection(
                onLoginSuccess = {
                    // 로그인 성공 시 백 스택 정리 후 홈으로
                    backStack.clear()
                    backStack.add(Home)
                },
                onNavigate = { backStack.add(it) },
                onBack = { backStack.removeLastOrNull() }
            )

            settingsSection(
                onNavigate = { backStack.add(it) },
                onBack = { backStack.removeLastOrNull() }
            )
        }
    )
}
```

> **Navigation 2.x와의 차이**: 2.x에서는 `navigation<Route>(startDestination = ...)` 블록으로 중첩 그래프를 만들었지만, Navigation3에서는 `EntryProviderScope` 확장 함수로 모듈화합니다. 중첩 그래프 개념 자체가 사라지고, 모든 화면이 하나의 플랫한 엔트리 목록으로 관리됩니다.

---

## 2. 적응형 내비게이션: NavigationSuiteScaffold

다양한 화면 크기(폰, 태블릿, 폴더블)에 대응하려면 내비게이션 UI도 적응적이어야 합니다. **NavigationSuiteScaffold**는 화면 크기에 따라 하단 내비게이션 바, 내비게이션 레일, 내비게이션 드로어를 **자동으로 전환**합니다.

### 종속성 추가

```kotlin [compose-playground]
// build.gradle.kts
implementation("androidx.compose.material3:material3-adaptive-navigation-suite")
```

### NavigationSuiteScaffold 사용

```kotlin [compose-playground]
import androidx.compose.material3.adaptive.navigationsuite.NavigationSuiteScaffold

enum class Destination(val icon: ImageVector, val label: String) {
    Home(Icons.Default.Home, "홈"),
    Search(Icons.Default.Search, "검색"),
    Profile(Icons.Default.Person, "프로필")
}

@Composable
fun AdaptiveApp() {
    var currentDestination by remember { mutableStateOf(Destination.Home) }

    NavigationSuiteScaffold(
        navigationSuiteItems = {
            Destination.entries.forEach { destination ->
                item(
                    icon = { Icon(destination.icon, contentDescription = null) },
                    label = { Text(destination.label) },
                    selected = destination == currentDestination,
                    onClick = { currentDestination = destination }
                )
            }
        }
    ) {
        // 선택된 destination에 따라 콘텐츠 표시
        when (currentDestination) {
            Destination.Home -> HomeScreen()
            Destination.Search -> SearchScreen()
            Destination.Profile -> ProfileScreen()
        }
    }
}
```

### 커스텀 내비게이션 타입: 윈도우 크기 기반 제어

`NavigationSuiteScaffold`는 기본적으로 화면 크기에 따라 자동으로 내비게이션 UI를 전환하지만, `currentWindowAdaptiveInfo()`와 `windowSizeClass.isWidthAtLeastBreakpoint()`를 사용하여 직접 제어할 수도 있습니다.

```kotlin [compose-playground]
import androidx.compose.material3.adaptive.currentWindowAdaptiveInfo
import androidx.window.core.layout.WindowSizeClass.Companion.WIDTH_DP_MEDIUM_LOWER_BOUND
import androidx.compose.material3.adaptive.navigationsuite.NavigationSuiteScaffoldDefaults
import androidx.compose.material3.adaptive.navigationsuite.NavigationSuiteType

@Composable
fun AdaptiveAppWithCustomNavType() {
    val adaptiveInfo = currentWindowAdaptiveInfo()
    val windowSizeClass = adaptiveInfo.windowSizeClass

    // 윈도우 크기에 따라 내비게이션 타입을 커스텀 결정
    val navSuiteType = if (windowSizeClass.isWidthAtLeastBreakpoint(WIDTH_DP_MEDIUM_LOWER_BOUND)) {
        NavigationSuiteType.NavigationRail
    } else {
        NavigationSuiteScaffoldDefaults.calculateFromAdaptiveInfo(adaptiveInfo)
    }

    NavigationSuiteScaffold(
        navigationSuiteItems = { /* ... */ },
        layoutType = navSuiteType
    ) {
        /* content */
    }
}
```

**자동 전환 규칙:**
| 화면 너비 | 내비게이션 UI |
|-----------|-------------|
| Compact (< 600dp) | 하단 내비게이션 바 (Bottom Navigation) |
| Medium (600-840dp) | 내비게이션 레일 (Navigation Rail) |
| Expanded (> 840dp) | 내비게이션 드로어 (Navigation Drawer) |

---

## 3. Navigation3에서 ViewModel 공유

같은 흐름의 여러 화면에서 **하나의 ViewModel을 공유**해야 할 때가 있습니다. 예를 들어, 주문 과정(상품 선택 → 배송지 입력 → 결제)에서 주문 데이터를 공유하는 경우입니다.

Navigation3에서는 Compose의 `CompositionLocal`이나 상위 스코프 ViewModel 패턴을 활용합니다.

```kotlin [compose-playground]
@Serializable data object ProductSelect : NavKey
@Serializable data object ShippingInfo : NavKey
@Serializable data object Payment : NavKey

// 주문 과정에서 공유할 ViewModel
class OrderViewModel : ViewModel() {
    var selectedProduct by mutableStateOf<Product?>(null)
    var shippingAddress by mutableStateOf("")
    var paymentMethod by mutableStateOf("")
}
```

```kotlin [compose-playground]
@Composable
fun OrderFlow() {
    val backStack = rememberNavBackStack(ProductSelect)

    // ViewModel을 NavDisplay 바깥에서 생성 — 모든 화면에서 공유
    val orderViewModel: OrderViewModel = viewModel()

    NavDisplay(
        backStack = backStack,
        onBack = { backStack.removeLastOrNull() },
        entryDecorators = listOf(
            rememberSaveableStateHolderNavEntryDecorator(),
            rememberViewModelStoreNavEntryDecorator()
        ),
        entryProvider = entryProvider {
            entry<ProductSelect> {
                ProductSelectScreen(
                    onProductSelected = { product ->
                        orderViewModel.selectedProduct = product
                        backStack.add(ShippingInfo)
                    }
                )
            }

            entry<ShippingInfo> {
                ShippingInfoScreen(
                    onNext = { address ->
                        orderViewModel.shippingAddress = address
                        backStack.add(Payment)
                    }
                )
            }

            entry<Payment> {
                PaymentScreen(
                    product = orderViewModel.selectedProduct,
                    address = orderViewModel.shippingAddress,
                    onComplete = {
                        // 주문 완료 후 전체 흐름을 빠져나감
                        backStack.clear()
                        backStack.add(Home)
                    }
                )
            }
        }
    )
}
```

> **Navigation 2.x와의 차이**: 2.x에서는 `navController.getBackStackEntry<OrderGraph>()`로 부모 그래프의 ViewModel을 공유했습니다. Navigation3에서는 공유 ViewModel을 `NavDisplay` 바깥의 적절한 컴포저블 스코프에서 생성하면 됩니다. 더 명확하고 Compose 관용적인 접근 방식입니다.

---

## 4. 상태 저장과 복원

Navigation3에서 상태를 올바르게 저장하려면 `NavEntryDecorator`와 `rememberNavBackStack`을 적절히 조합해야 합니다.

### rememberNavBackStack — 백 스택 자체의 저장

`rememberNavBackStack`은 **구성 변경과 프로세스 종료 시 백 스택을 자동으로 저장/복원**합니다. NavKey가 `@Serializable`이므로 가능합니다.

```kotlin [compose-playground]
// 앱을 재시작해도 사용자가 마지막으로 보던 화면으로 복원됨
val backStack = rememberNavBackStack(Home)
```

### NavEntryDecorator — 개별 화면 상태 저장

```kotlin [compose-playground]
NavDisplay(
    backStack = backStack,
    onBack = { backStack.removeLastOrNull() },
    entryDecorators = listOf(
        // 1. rememberSaveable 등의 상태를 NavEntry 단위로 보존
        //    (다른 화면으로 갔다 돌아와도 스크롤 위치 등 유지)
        rememberSaveableStateHolderNavEntryDecorator(),

        // 2. ViewModel을 NavEntry 단위로 스코핑
        //    (백 스택에서 제거되면 ViewModel도 해제)
        rememberViewModelStoreNavEntryDecorator()
    ),
    entryProvider = entryProvider { /* ... */ }
)
```

**상태 보존 동작:**

| 시나리오 | rememberSaveableState | ViewModel |
|---------|----------------------|-----------|
| 다른 화면으로 이동 후 뒤로 | 유지 | 유지 |
| 구성 변경 (화면 회전) | 유지 | 유지 |
| 프로세스 종료 후 복원 | 유지 (rememberSaveable) | 재생성 |
| 백 스택에서 제거 (뒤로 가기) | 해제 | 해제 |

---

## 5. 테스트 패턴

Navigation3에서는 백 스택이 단순한 리스트이므로, **테스트가 매우 직관적**입니다. Navigation 2.x의 `TestNavHostController`가 필요 없습니다.

### 백 스택 상태를 직접 검증

```kotlin [compose-playground]
import androidx.compose.ui.test.junit4.createComposeRule
import androidx.compose.ui.test.onNodeWithText
import androidx.compose.ui.test.performClick
import org.junit.Rule
import org.junit.Test

class NavigationTest {

    @get:Rule
    val composeTestRule = createComposeRule()

    @Test
    fun testNavigateToDetail() {
        // 테스트용 백 스택을 직접 생성
        val backStack = mutableStateListOf<NavKey>(Home)

        composeTestRule.setContent {
            NavDisplay(
                backStack = backStack,
                onBack = { backStack.removeLastOrNull() },
                entryProvider = entryProvider {
                    entry<Home> {
                        HomeScreen(
                            onItemClick = { backStack.add(Detail(itemId = it)) }
                        )
                    }
                    entry<Detail> { key ->
                        DetailScreen(itemId = key.itemId)
                    }
                }
            )
        }

        // 시작 화면 확인
        composeTestRule
            .onNodeWithText("홈 화면")
            .assertIsDisplayed()

        // 아이템 클릭
        composeTestRule
            .onNodeWithText("아이템 #42 상세 보기")
            .performClick()

        // 백 스택을 직접 검증!
        assert(backStack.size == 2)
        assert(backStack.last() is Detail)
        assert((backStack.last() as Detail).itemId == 42)
    }

    @Test
    fun testBackNavigation() {
        val backStack = mutableStateListOf<NavKey>(Home)

        composeTestRule.setContent {
            NavDisplay(
                backStack = backStack,
                onBack = { backStack.removeLastOrNull() },
                entryProvider = entryProvider {
                    entry<Home> {
                        HomeScreen(
                            onItemClick = { backStack.add(Detail(itemId = it)) }
                        )
                    }
                    entry<Detail> { key ->
                        DetailScreen(
                            itemId = key.itemId,
                            onBack = { backStack.removeLastOrNull() }
                        )
                    }
                }
            )
        }

        // 상세 화면으로 이동
        composeTestRule
            .onNodeWithText("아이템 #42 상세 보기")
            .performClick()

        // 뒤로 가기
        composeTestRule
            .onNodeWithContentDescription("뒤로 가기")
            .performClick()

        // 백 스택에 Home만 남았는지 확인
        assert(backStack.size == 1)
        assert(backStack.last() is Home)

        // 홈 화면 복귀 확인
        composeTestRule
            .onNodeWithText("홈 화면")
            .assertIsDisplayed()
    }
}
```

> **Navigation 2.x와의 차이**: 2.x에서는 `TestNavHostController`를 설정하고 `currentBackStackEntry?.destination?.route`를 문자열로 비교했습니다. Navigation3에서는 백 스택이 일반 리스트이므로, `backStack.last() is Detail`처럼 **타입 안전하게 직접 검증**할 수 있습니다.

---

## 6. 베스트 프랙티스

### 화면 컴포저블에 backStack을 직접 전달하지 않기

Navigation 2.x에서 `NavController`를 직접 전달하지 않는 것과 같은 원칙입니다.

```kotlin [compose-playground]
// 나쁜 예: backStack을 화면에 직접 전달
@Composable
fun HomeScreen(backStack: SnapshotStateList<NavKey>) {
    Button(onClick = {
        backStack.add(Detail(itemId = 42))
    }) {
        Text("상세 보기")
    }
}
```

**문제점:**
- `@Preview`에서 사용할 수 없음
- 단위 테스트가 어려움
- 화면이 Navigation에 강하게 결합됨

```kotlin [compose-playground]
// 좋은 예: 이벤트 콜백으로 분리
@Composable
fun HomeScreen(
    onItemClick: (Int) -> Unit,
    onProfileClick: () -> Unit
) {
    Button(onClick = { onItemClick(42) }) {
        Text("상세 보기")
    }
    Button(onClick = onProfileClick) {
        Text("프로필")
    }
}

// NavDisplay에서 연결
entry<Home> {
    HomeScreen(
        onItemClick = { itemId ->
            backStack.add(Detail(itemId = itemId))
        },
        onProfileClick = {
            backStack.add(Profile)
        }
    )
}

// Preview에서 자유롭게 사용 가능!
@Preview
@Composable
fun HomeScreenPreview() {
    HomeScreen(
        onItemClick = {},
        onProfileClick = {}
    )
}
```

### 내비게이션 이벤트 정의를 sealed interface로 관리 (대규모 앱)

```kotlin [compose-playground]
sealed interface NavigationEvent {
    data class ToDetail(val itemId: Int) : NavigationEvent
    data object ToProfile : NavigationEvent
    data object Back : NavigationEvent
}

// NavDisplay에서 이벤트 핸들러
fun handleNavEvent(
    event: NavigationEvent,
    backStack: SnapshotStateList<NavKey>
) {
    when (event) {
        is NavigationEvent.ToDetail -> backStack.add(Detail(itemId = event.itemId))
        is NavigationEvent.ToProfile -> backStack.add(Profile)
        is NavigationEvent.Back -> backStack.removeLastOrNull()
    }
}
```

### 확장 함수로 내비게이션 로직 분리

```kotlin [compose-playground]
// 백 스택 확장 함수
fun SnapshotStateList<NavKey>.navigateToDetail(itemId: Int) {
    add(Detail(itemId = itemId))
}

fun SnapshotStateList<NavKey>.navigateToHome() {
    clear()
    add(Home)
}

fun SnapshotStateList<NavKey>.navigateIfNotOnTop(destination: NavKey) {
    if (lastOrNull() != destination) {
        add(destination)
    }
}
```

> **핵심 원칙**: 화면 컴포저블은 "어디로 갈지"를 모르는 것이 좋습니다. 화면은 "이벤트가 발생했다"는 것만 알리고, "어디로 이동할지"는 `entryProvider` 블록이 결정하도록 분리하세요.

---

> **다음 단계**: [Phase 6: Material Design](../phase-06-material-design/01-material3-theming.md)에서는 앱의 시각적 디자인 시스템을 구축하는 방법을 학습합니다.
