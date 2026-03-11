# 고급 내비게이션 패턴

> **"좋은 내비게이션은 사용자가 의식하지 못하는 내비게이션이다."**
>
> 앱이 복잡해지면 단순한 화면 이동만으로는 부족합니다. 이 문서에서는 중첩 그래프, 딥 링크, 적응형 내비게이션 등 실무에서 필요한 고급 패턴을 다룹니다.

---

## 목차

1. [중첩 내비게이션 그래프](#1-중첩-내비게이션-그래프)
2. [딥 링크 설정](#2-딥-링크-설정)
3. [적응형 내비게이션: NavigationSuiteScaffold](#3-적응형-내비게이션-navigationsuiteescaffold)
4. [Navigation에서 ViewModel 공유](#4-navigation에서-viewmodel-공유)
5. [Navigation3와 ViewModel 스코핑](#5-navigation3와-viewmodel-스코핑)
6. [Kotlin Multiplatform 딥 링크: NavUri](#6-kotlin-multiplatform-딥-링크-navuri)
7. [테스트: TestNavHostController](#7-테스트-testnavhostcontroller)
8. [베스트 프랙티스: NavController를 컴포저블에 직접 전달하지 않기](#8-베스트-프랙티스-navcontroller를-컴포저블에-직접-전달하지-않기)

---

## 1. 중첩 내비게이션 그래프

앱의 규모가 커지면 모든 화면을 하나의 `NavHost`에 나열하기 어렵습니다. **중첩 내비게이션 그래프(Nested Navigation Graph)** 를 사용하면 관련된 화면들을 그룹으로 묶어 관리할 수 있습니다.

**사용 시나리오:**
- 인증(로그인/회원가입) 흐름을 별도 그래프로 분리
- 설정 화면 그룹을 별도 그래프로 관리
- 기능 모듈별로 내비게이션을 분리

```kotlin
import kotlinx.serialization.Serializable

// 중첩 그래프의 경로도 @Serializable로 정의
@Serializable object AuthGraph       // 인증 그래프의 경로
@Serializable object Login
@Serializable object Register
@Serializable object ForgotPassword

@Serializable object MainGraph       // 메인 그래프의 경로
@Serializable object Home
@Serializable object Settings
@Serializable object SettingsDetail
```

```kotlin
@Composable
fun AppNavHost(navController: NavHostController) {
    NavHost(
        navController = navController,
        startDestination = AuthGraph  // 시작은 인증 그래프
    ) {
        // 인증 관련 화면들을 그룹으로 묶기
        navigation<AuthGraph>(startDestination = Login) {
            composable<Login> {
                LoginScreen(
                    onLoginSuccess = {
                        navController.navigate(MainGraph) {
                            popUpTo<AuthGraph> { inclusive = true }
                        }
                    },
                    onRegister = { navController.navigate(Register) },
                    onForgotPassword = { navController.navigate(ForgotPassword) }
                )
            }
            composable<Register> {
                RegisterScreen(onBack = { navController.popBackStack() })
            }
            composable<ForgotPassword> {
                ForgotPasswordScreen(onBack = { navController.popBackStack() })
            }
        }

        // 메인 화면들을 그룹으로 묶기
        navigation<MainGraph>(startDestination = Home) {
            composable<Home> {
                HomeScreen(
                    onSettings = { navController.navigate(Settings) }
                )
            }
            composable<Settings> {
                SettingsScreen(
                    onDetail = { navController.navigate(SettingsDetail) }
                )
            }
            composable<SettingsDetail> {
                SettingsDetailScreen()
            }
        }
    }
}
```

> **핵심**: `navigation<Route>(startDestination = ...)` 블록이 중첩 그래프를 정의합니다. 중첩 그래프 자체도 하나의 경로로 취급되어 `navController.navigate(AuthGraph)`처럼 이동할 수 있습니다.

---

## 2. 딥 링크 설정

**딥 링크(Deep Link)** 는 외부에서 앱의 특정 화면으로 직접 이동할 수 있게 해주는 기능입니다. 알림 클릭, 웹 링크, 다른 앱에서의 호출 등에 사용됩니다.

### AndroidManifest.xml 설정

```xml
<activity
    android:name=".MainActivity"
    android:exported="true">
    <intent-filter>
        <action android:name="android.intent.action.VIEW" />
        <category android:name="android.intent.category.DEFAULT" />
        <category android:name="android.intent.category.BROWSABLE" />
        <!-- 딥 링크 URI 패턴 -->
        <data
            android:scheme="https"
            android:host="www.myapp.com" />
        <data
            android:scheme="myapp"
            android:host="detail" />
    </intent-filter>
</activity>
```

### Navigation에서 딥 링크 연결

```kotlin
import androidx.navigation.navDeepLink

@Serializable
data class Detail(val itemId: Int)

NavHost(
    navController = navController,
    startDestination = Home
) {
    composable<Home> {
        HomeScreen(/* ... */)
    }

    composable<Detail>(
        deepLinks = listOf(
            // https://www.myapp.com/detail/{itemId}
            navDeepLink<Detail>(
                basePath = "https://www.myapp.com/detail"
            ),
            // myapp://detail/{itemId}
            navDeepLink<Detail>(
                basePath = "myapp://detail"
            )
        )
    ) { backStackEntry ->
        val route = backStackEntry.toRoute<Detail>()
        DetailScreen(itemId = route.itemId)
    }
}
```

### 딥 링크 테스트

```bash
# adb 명령어로 딥 링크 테스트
adb shell am start -a android.intent.action.VIEW \
    -d "https://www.myapp.com/detail/42" \
    com.example.myapp

adb shell am start -a android.intent.action.VIEW \
    -d "myapp://detail/42" \
    com.example.myapp
```

> **팁**: Type-Safe Navigation에서 `navDeepLink<T>(basePath = ...)`를 사용하면, 경로 클래스의 프로퍼티가 자동으로 URI 파라미터에 매핑됩니다.

---

## 3. 적응형 내비게이션: NavigationSuiteScaffold

다양한 화면 크기(폰, 태블릿, 폴더블)에 대응하려면 내비게이션 UI도 적응적이어야 합니다. **NavigationSuiteScaffold**는 화면 크기에 따라 하단 내비게이션 바, 내비게이션 레일, 내비게이션 드로어를 **자동으로 전환**합니다.

### 종속성 추가

```kotlin
// build.gradle.kts
implementation("androidx.compose.material3:material3-adaptive-navigation-suite")
```

### NavigationSuiteScaffold 사용

```kotlin
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

```kotlin
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

## 4. Navigation에서 ViewModel 공유

같은 내비게이션 그래프 안의 여러 화면에서 **하나의 ViewModel을 공유**해야 할 때가 있습니다. 예를 들어, 주문 과정(상품 선택 → 배송지 입력 → 결제)에서 주문 데이터를 공유하는 경우입니다.

```kotlin
@Serializable object OrderGraph
@Serializable object ProductSelect
@Serializable object ShippingInfo
@Serializable object Payment

// 주문 과정에서 공유할 ViewModel
class OrderViewModel : ViewModel() {
    var selectedProduct by mutableStateOf<Product?>(null)
    var shippingAddress by mutableStateOf("")
    var paymentMethod by mutableStateOf("")
}
```

```kotlin
NavHost(
    navController = navController,
    startDestination = OrderGraph
) {
    navigation<OrderGraph>(startDestination = ProductSelect) {

        composable<ProductSelect> { backStackEntry ->
            // 부모 그래프(OrderGraph)에 스코프된 ViewModel 가져오기
            val parentEntry = remember(backStackEntry) {
                navController.getBackStackEntry<OrderGraph>()
            }
            val orderViewModel: OrderViewModel = viewModel(parentEntry)

            ProductSelectScreen(
                onProductSelected = { product ->
                    orderViewModel.selectedProduct = product
                    navController.navigate(ShippingInfo)
                }
            )
        }

        composable<ShippingInfo> { backStackEntry ->
            val parentEntry = remember(backStackEntry) {
                navController.getBackStackEntry<OrderGraph>()
            }
            val orderViewModel: OrderViewModel = viewModel(parentEntry)

            ShippingInfoScreen(
                onNext = { address ->
                    orderViewModel.shippingAddress = address
                    navController.navigate(Payment)
                }
            )
        }

        composable<Payment> { backStackEntry ->
            val parentEntry = remember(backStackEntry) {
                navController.getBackStackEntry<OrderGraph>()
            }
            val orderViewModel: OrderViewModel = viewModel(parentEntry)

            PaymentScreen(
                product = orderViewModel.selectedProduct,
                address = orderViewModel.shippingAddress,
                onComplete = {
                    // 주문 완료 후 그래프 전체를 빠져나감
                    navController.popBackStack<OrderGraph>(inclusive = true)
                }
            )
        }
    }
}
```

> **핵심**: `navController.getBackStackEntry<OrderGraph>()`로 부모 그래프의 `BackStackEntry`를 얻고, 여기에 ViewModel을 스코프하면 그래프 내 모든 화면에서 같은 인스턴스를 공유합니다. 그래프를 벗어나면 ViewModel도 자동으로 해제됩니다.

---

## 5. Navigation3와 ViewModel 스코핑

**Navigation3**는 차세대 Navigation 라이브러리로, 더 유연한 화면 관리를 지원합니다. Navigation3에서 ViewModel을 화면 단위로 스코핑하려면 `lifecycle-viewmodel-navigation3` 아티팩트를 사용합니다.

### 종속성 추가

```kotlin
// build.gradle.kts
implementation("androidx.lifecycle:lifecycle-viewmodel-navigation3:1.0.0-alpha01")
```

### rememberViewModelStoreNavEntryDecorator

`rememberViewModelStoreNavEntryDecorator()`를 사용하면 각 NavEntry(화면)에 ViewModel 스토어를 자동으로 연결할 수 있습니다. 화면이 백 스택에서 제거되면 해당 ViewModel도 함께 해제됩니다.

```kotlin
import androidx.lifecycle.viewmodel.navigation3.rememberViewModelStoreNavEntryDecorator

NavDisplay(
    backStack = backStack,
    entryDecorators = listOf(
        rememberViewModelStoreNavEntryDecorator(),  // ViewModel을 화면 단위로 스코핑
        // 기타 데코레이터...
    ),
    entryProvider = entryProvider { /* ... */ }
)
```

> **팁**: Navigation3는 아직 초기 알파 단계이므로 실험적인 프로젝트에서 먼저 사용해 보는 것을 권장합니다. 기존 Navigation Compose(2.9.x)는 안정적으로 계속 지원됩니다.

---

## 6. Kotlin Multiplatform 딥 링크: NavUri

Kotlin Multiplatform 프로젝트에서 딥 링크를 처리할 때는 `NavUri` 파서 함수를 사용합니다. 플랫폼에 독립적인 URI 파싱을 제공하여 Android, iOS, Desktop 등에서 동일한 딥 링크 로직을 공유할 수 있습니다.

```kotlin
import androidx.navigation.NavUri

// URI 문자열을 플랫폼 독립적으로 파싱
val uri = NavUri("https://www.myapp.com/profile/123")

// NavController에서 딥 링크 처리
navController.navigate(uri)
```

> **참고**: `NavUri`는 Navigation Compose의 KMP(Kotlin Multiplatform) 지원의 일부입니다. Android 전용 프로젝트에서는 기존 `android.net.Uri`를 그대로 사용할 수 있습니다.

---

## 7. 테스트: TestNavHostController

Navigation 로직을 테스트할 때는 `TestNavHostController`를 사용합니다. 실제 화면을 렌더링하지 않고도 내비게이션 동작을 검증할 수 있습니다.

### 종속성 추가

```kotlin
// build.gradle.kts
androidTestImplementation("androidx.navigation:navigation-testing:2.9.7")
```

### 테스트 작성

```kotlin
import androidx.navigation.testing.TestNavHostController
import androidx.compose.ui.test.junit4.createComposeRule
import androidx.compose.ui.test.onNodeWithText
import androidx.compose.ui.test.performClick
import org.junit.Rule
import org.junit.Test

class NavigationTest {

    @get:Rule
    val composeTestRule = createComposeRule()

    private lateinit var navController: TestNavHostController

    @Test
    fun testNavigateToDetail() {
        composeTestRule.setContent {
            navController = TestNavHostController(LocalContext.current).apply {
                navigatorProvider.addNavigator(ComposeNavigator())
            }
            MyNavHost(navController = navController)
        }

        // 시작 화면 확인
        composeTestRule
            .onNodeWithText("홈 화면")
            .assertIsDisplayed()

        // 아이템 클릭하여 상세 화면으로 이동
        composeTestRule
            .onNodeWithText("아이템 #42 상세 보기")
            .performClick()

        // 현재 경로 확인
        val currentRoute = navController.currentBackStackEntry
            ?.toRoute<Detail>()
        assert(currentRoute?.itemId == 42)
    }

    @Test
    fun testBackNavigation() {
        composeTestRule.setContent {
            navController = TestNavHostController(LocalContext.current).apply {
                navigatorProvider.addNavigator(ComposeNavigator())
            }
            MyNavHost(navController = navController)
        }

        // 상세 화면으로 이동
        composeTestRule
            .onNodeWithText("아이템 #42 상세 보기")
            .performClick()

        // 뒤로 가기 버튼 클릭
        composeTestRule
            .onNodeWithContentDescription("뒤로 가기")
            .performClick()

        // 홈 화면으로 복귀 확인
        composeTestRule
            .onNodeWithText("홈 화면")
            .assertIsDisplayed()
    }
}
```

> **팁**: `TestNavHostController`를 사용하면 `navController.currentBackStackEntry`를 통해 현재 경로를 프로그래밍 방식으로 검증할 수 있습니다.

---

## 6. 베스트 프랙티스: NavController를 컴포저블에 직접 전달하지 않기

Navigation을 사용할 때 가장 중요한 원칙 중 하나는 **화면 컴포저블에 `NavController`를 직접 전달하지 않는 것**입니다.

### 잘못된 예 (NavController 직접 전달)

```kotlin
// 나쁜 예: NavController를 화면에 직접 전달
@Composable
fun HomeScreen(navController: NavController) {
    Button(onClick = {
        navController.navigate(Detail(itemId = 42))
    }) {
        Text("상세 보기")
    }
}
```

**문제점:**
- `@Preview`에서 사용할 수 없음 (NavController를 생성할 수 없음)
- 단위 테스트가 어려움
- 화면이 Navigation에 강하게 결합됨

### 올바른 예 (이벤트 콜백 전달)

```kotlin
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

// NavHost에서 연결
composable<Home> {
    HomeScreen(
        onItemClick = { itemId ->
            navController.navigate(Detail(itemId = itemId))
        },
        onProfileClick = {
            navController.navigate(Profile)
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

### 추가 베스트 프랙티스

```kotlin
// 1. NavController는 가능한 한 높은 레벨에서 생성
@Composable
fun MyApp() {
    val navController = rememberNavController()
    MyNavHost(navController = navController)
}

// 2. 내비게이션 이벤트 정의를 sealed interface로 관리 (대규모 앱)
sealed interface NavigationEvent {
    data class ToDetail(val itemId: Int) : NavigationEvent
    data object ToProfile : NavigationEvent
    data object Back : NavigationEvent
}

// 3. 확장 함수로 내비게이션 로직 분리
fun NavController.navigateToDetail(itemId: Int) {
    navigate(Detail(itemId = itemId))
}

fun NavController.navigateToHome() {
    navigate(Home) {
        popUpTo(graph.findStartDestination().id) {
            saveState = true
        }
        launchSingleTop = true
        restoreState = true
    }
}
```

> **핵심 원칙**: 화면 컴포저블은 "어디로 갈지"를 모르는 것이 좋습니다. 화면은 "이벤트가 발생했다"는 것만 알리고, "어디로 이동할지"는 NavHost가 결정하도록 분리하세요.

---

> **다음 단계**: [Phase 6: Material Design](../phase-06-material-design/01-material3-theming.md)에서는 앱의 시각적 디자인 시스템을 구축하는 방법을 학습합니다.
