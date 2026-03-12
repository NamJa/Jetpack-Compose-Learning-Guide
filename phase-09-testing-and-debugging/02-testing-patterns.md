# 테스트 패턴과 모범 사례

> **"좋은 테스트는 버그를 잡는 것이 아니라, 버그가 생기지 않도록 설계를 강제한다."**
>
> UI 테스트 기초를 배웠다면, 이제 실전에서 바로 쓸 수 있는 테스트 패턴과 모범 사례를 익힐 차례입니다.
> 이 문서에서는 시맨틱 트리 깊이 이해하기, 비동기 테스트, Navigation 테스트까지 다룹니다.

---

## 목차

1. [시맨틱(Semantics) 기반 테스트](#1-시맨틱semantics-기반-테스트)
2. [시맨틱 트리와 병합/비병합 트리](#2-시맨틱-트리와-병합비병합-트리)
3. [커스텀 시맨틱 속성 추가](#3-커스텀-시맨틱-속성-추가)
4. [테스트 동기화](#4-테스트-동기화)
5. [스크린샷 테스트 기초](#5-스크린샷-테스트-기초)
6. [상태별 UI 테스트: Loading, Success, Error](#6-상태별-ui-테스트-loading-success-error)
7. [Navigation 테스트](#7-navigation-테스트)
8. [테스트 가능한 코드 작성 팁](#8-테스트-가능한-코드-작성-팁)
9. [정리](#9-정리)

---

## 1. 시맨틱(Semantics) 기반 테스트

Compose의 테스트는 **시맨틱(Semantics)** 을 기반으로 동작합니다. 시맨틱이란, 컴포저블이 "나는 이런 의미를 가진 요소야"라고 선언하는 **메타데이터**입니다.

### 시맨틱이 중요한 이유

```
┌───────────────────────────────────────────────────┐
│                시맨틱의 3가지 역할                     │
│                                                   │
│  1. 접근성(Accessibility)                           │
│     → TalkBack이 "로그인 버튼"이라고 읽어줌            │
│                                                   │
│  2. 테스트(Testing)                                 │
│     → onNodeWithText("로그인")으로 노드 찾기           │
│                                                   │
│  3. 자동화(Automation)                              │
│     → UI 자동화 도구가 요소를 식별                     │
└───────────────────────────────────────────────────┘
```

### 시맨틱 정보 확인하기

테스트에서 `printToLog()`를 사용하면 시맨틱 트리를 로그로 출력할 수 있습니다.

```kotlin [compose-playground]
@Test
fun debugSemantics() {
    composeTestRule.setContent {
        Button(onClick = { }) {
            Text("로그인")
        }
    }

    // 전체 시맨틱 트리 출력
    composeTestRule.onRoot().printToLog("SEMANTICS")

    // 특정 노드의 시맨틱 출력
    composeTestRule
        .onNodeWithText("로그인")
        .printToLog("LOGIN_BUTTON")
}
```

출력 예시:
```
SEMANTICS:
  Node #1 at (l=0, t=0, r=1080, b=2340)
   |-Node #2 at (l=411, t=1116, r=669, b=1224)
      Role = 'Button'
      Text = '[로그인]'
      Actions = [OnClick]
      MergeDescendants = 'true'
```

---

## 2. 시맨틱 트리와 병합/비병합 트리

Compose는 두 가지 시맨틱 트리를 유지합니다.

### 병합 트리(Merged Tree) vs 비병합 트리(Unmerged Tree)

```
┌─────────────────────────────────────────────────┐
│  실제 컴포저블 구조                                │
│                                                 │
│  Button (onClick = { ... })                      │
│  ├── Icon(Icons.Default.Send)                    │
│  └── Text("전송")                                │
│                                                 │
├─────────────────────────────────────────────────┤
│  병합 트리 (Merged) — 기본값                       │
│                                                 │
│  [Button]                                        │
│     Text = "전송"          ← 자식이 부모에 병합됨   │
│     Role = Button                                │
│     ContentDescription = null                    │
│                                                 │
├─────────────────────────────────────────────────┤
│  비병합 트리 (Unmerged)                            │
│                                                 │
│  [Button]                                        │
│  ├── [Icon]                                      │
│  │    ContentDescription = null                  │
│  └── [Text]                                      │
│       Text = "전송"        ← 각 노드가 개별 유지    │
└─────────────────────────────────────────────────┘
```

### 사용 방법

```kotlin [compose-playground]
@Test
fun mergedTree_findsButtonWithMergedText() {
    composeTestRule.setContent {
        Button(onClick = { }) {
            Icon(Icons.Default.Send, contentDescription = null)
            Spacer(modifier = Modifier.width(8.dp))
            Text("전송")
        }
    }

    // 병합 트리 (기본) — Button 노드에서 "전송" 텍스트를 찾음
    composeTestRule
        .onNodeWithText("전송")
        .assertHasClickAction()  // Button이므로 클릭 가능
}

@Test
fun unmergedTree_findsIndividualNodes() {
    composeTestRule.setContent {
        Button(onClick = { }) {
            Icon(Icons.Default.Send, contentDescription = "전송 아이콘")
            Spacer(modifier = Modifier.width(8.dp))
            Text("전송")
        }
    }

    // 비병합 트리 — useUnmergedTree = true
    composeTestRule
        .onNodeWithText("전송", useUnmergedTree = true)
        .assertHasNoClickAction()  // Text 노드 자체는 클릭 불가
}
```

### 언제 비병합 트리를 사용할까?

```kotlin [compose-playground]
// 시나리오: Row 안에 여러 텍스트가 있는 경우
@Composable
fun PriceRow() {
    Row(modifier = Modifier.semantics(mergeDescendants = true) { }) {
        Text("가격: ")
        Text("₩10,000", modifier = Modifier.testTag("price_value"))
    }
}

// ❌ 병합 트리에서는 개별 Text를 찾을 수 없음
composeTestRule
    .onNodeWithTag("price_value")  // 병합되어 찾을 수 없음!
    .assertIsDisplayed()

// ✅ 비병합 트리에서 개별 노드 접근
composeTestRule
    .onNodeWithTag("price_value", useUnmergedTree = true)
    .assertTextEquals("₩10,000")
```

---

## 3. 커스텀 시맨틱 속성 추가

기본 시맨틱 속성 외에, 테스트를 위한 **커스텀 속성**을 만들 수 있습니다.

### 커스텀 시맨틱 속성 정의

```kotlin [kotlin-playground]
import androidx.compose.ui.semantics.SemanticsPropertyKey
import androidx.compose.ui.semantics.SemanticsPropertyReceiver

// 1. 커스텀 시맨틱 키 정의
val DrawerStateKey = SemanticsPropertyKey<String>("DrawerState")
var SemanticsPropertyReceiver.drawerState by DrawerStateKey

val ItemCountKey = SemanticsPropertyKey<Int>("ItemCount")
var SemanticsPropertyReceiver.itemCount by ItemCountKey
```

### 컴포저블에 커스텀 시맨틱 적용

```kotlin [compose-playground]
@Composable
fun ShoppingCart(items: List<CartItem>) {
    Column(
        modifier = Modifier.semantics {
            itemCount = items.size  // 커스텀 속성 설정
        }
    ) {
        Text("장바구니 (${items.size})")
        items.forEach { item ->
            CartItemRow(item)
        }
    }
}
```

### 테스트에서 커스텀 시맨틱 활용

```kotlin [compose-playground]
import androidx.compose.ui.test.SemanticsMatcher

@Test
fun shoppingCart_showsCorrectItemCount() {
    val testItems = listOf(
        CartItem("사과", 1000),
        CartItem("바나나", 2000),
        CartItem("포도", 3000)
    )

    composeTestRule.setContent {
        ShoppingCart(items = testItems)
    }

    // 커스텀 시맨틱 매처 사용
    composeTestRule
        .onNode(SemanticsMatcher.expectValue(ItemCountKey, 3))
        .assertIsDisplayed()
}
```

---

## 4. 테스트 동기화

Compose UI 테스트는 기본적으로 **자동 동기화**됩니다. 하지만 비동기 작업이나 애니메이션이 있을 때는 수동으로 동기화를 처리해야 합니다.

### 자동 동기화가 처리하는 것

```
┌─────────────────────────────────────────────────┐
│  자동 동기화 대상                                  │
│                                                 │
│  ✓ 리컴포지션 (Recomposition)                     │
│  ✓ 보류 중인 레이아웃/드로잉                        │
│  ✓ Compose 애니메이션 (animate*AsState)            │
│  ✓ 메인 스레드 유휴 상태 대기                       │
│                                                 │
│  자동 동기화가 처리하지 않는 것                      │
│                                                 │
│  ✗ 네트워크 요청 결과 대기                          │
│  ✗ 코루틴 delay() 기반 로직                         │
│  ✗ 커스텀 무한 애니메이션                            │
│  ✗ Handler.postDelayed() 콜백                      │
└─────────────────────────────────────────────────┘
```

### waitForIdle

모든 보류 중인 컴포지션과 레이아웃이 완료될 때까지 기다립니다.

```kotlin [compose-playground]
@Test
fun test_afterStateChange_uiUpdates() {
    var showDialog by mutableStateOf(false)

    composeTestRule.setContent {
        if (showDialog) {
            AlertDialog(
                onDismissRequest = { },
                title = { Text("확인") },
                confirmButton = { Button(onClick = { }) { Text("OK") } }
            )
        }
        Button(onClick = { showDialog = true }) { Text("다이얼로그 열기") }
    }

    composeTestRule
        .onNodeWithText("다이얼로그 열기")
        .performClick()

    // 리컴포지션 완료까지 대기
    composeTestRule.waitForIdle()

    composeTestRule
        .onNodeWithText("확인")
        .assertIsDisplayed()
}
```

### waitUntil

특정 조건이 만족될 때까지 기다립니다. 비동기 데이터 로딩 등에 유용합니다.

```kotlin [compose-playground]
@Test
fun dataLoading_showsResultAfterLoading() {
    composeTestRule.setContent {
        DataScreen()  // 내부에서 비동기로 데이터 로딩
    }

    // 로딩 인디케이터가 사라질 때까지 최대 5초 대기
    composeTestRule.waitUntil(timeoutMillis = 5_000) {
        composeTestRule
            .onAllNodesWithTag("loading_indicator")
            .fetchSemanticsNodes()
            .isEmpty()
    }

    // 데이터가 표시되었는지 확인
    composeTestRule
        .onNodeWithTag("data_list")
        .assertIsDisplayed()
}
```

### MainTestClock으로 시간 제어

애니메이션이나 시간 기반 로직을 테스트할 때, 테스트 클럭을 수동으로 제어할 수 있습니다.

```kotlin [compose-playground]
@Test
fun animation_advanceClock() {
    composeTestRule.mainClock.autoAdvance = false  // 자동 시간 진행 중지

    composeTestRule.setContent {
        AnimatedVisibility(visible = true) {
            Text("애니메이션 대상")
        }
    }

    // 시간을 수동으로 진행
    composeTestRule.mainClock.advanceTimeBy(500L)  // 500ms 진행

    composeTestRule
        .onNodeWithText("애니메이션 대상")
        .assertIsDisplayed()

    // 프레임 단위로 진행
    composeTestRule.mainClock.advanceTimeByFrame()
}
```

---

## 5. 스크린샷 테스트 기초

스크린샷 테스트는 UI의 **시각적 결과물**을 이미지로 캡처하고, 기준 이미지와 비교하는 테스트입니다.

### 스크린샷 테스트가 필요한 이유

```
시맨틱 테스트만으로는 부족한 경우:
  - 색상이 올바른지
  - 레이아웃이 깨지지 않았는지
  - 폰트 크기가 정확한지
  - 그림자, 테두리 등 시각적 요소
```

### Compose Preview 스크린샷 테스트 (공식 지원)

```kotlin [compose-playground]
// build.gradle.kts
plugins {
    id("com.android.compose.screenshot") version "0.0.1-alpha07"
}

android {
    experimentalProperties["android.experimental.enableScreenshotTest"] = true
}
```

```kotlin [compose-playground]
// 스크린샷 테스트 대상 Preview 정의
// 위치: screenshotTest/java/.../Previews.kt

@Preview(showBackground = true)
@Composable
fun LoginButton_Default_Preview() {
    MyTheme {
        LoginButton(enabled = true)
    }
}

@Preview(showBackground = true)
@Composable
fun LoginButton_Disabled_Preview() {
    MyTheme {
        LoginButton(enabled = false)
    }
}
```

```bash
# 기준 이미지 생성
./gradlew updateDebugScreenshotTest

# 스크린샷 비교 테스트 실행
./gradlew validateDebugScreenshotTest
```

### 수동 스크린샷 캡처 (테스트 내에서)

```kotlin [compose-playground]
@Test
fun captureScreenshot() {
    composeTestRule.setContent {
        MyTheme {
            LoginScreen()
        }
    }

    // 특정 노드 캡처
    composeTestRule
        .onNodeWithTag("login_form")
        .captureToImage()
        .asAndroidBitmap()
        .let { bitmap ->
            // bitmap을 파일로 저장하거나 비교
        }
}
```

---

## 6. 상태별 UI 테스트: Loading, Success, Error

실제 앱에서는 화면이 여러 상태를 가집니다. 각 상태별로 테스트를 작성하는 패턴을 알아봅니다.

### UI 상태 모델

```kotlin [compose-playground]
// UI 상태 정의
sealed interface UserListUiState {
    data object Loading : UserListUiState
    data class Success(val users: List<User>) : UserListUiState
    data class Error(val message: String) : UserListUiState
}

// 컴포저블
@Composable
fun UserListScreen(uiState: UserListUiState) {
    when (uiState) {
        is UserListUiState.Loading -> {
            CircularProgressIndicator(
                modifier = Modifier.testTag("loading_indicator")
            )
        }
        is UserListUiState.Success -> {
            LazyColumn(modifier = Modifier.testTag("user_list")) {
                items(uiState.users) { user ->
                    Text(
                        text = user.name,
                        modifier = Modifier.testTag("user_item")
                    )
                }
            }
        }
        is UserListUiState.Error -> {
            Column(modifier = Modifier.testTag("error_view")) {
                Text(
                    text = uiState.message,
                    modifier = Modifier.testTag("error_message")
                )
                Button(
                    onClick = { /* 재시도 */ },
                    modifier = Modifier.testTag("retry_button")
                ) {
                    Text("다시 시도")
                }
            }
        }
    }
}
```

### 상태별 테스트 작성

```kotlin [compose-playground]
class UserListScreenTest {

    @get:Rule
    val composeTestRule = createComposeRule()

    // ── Loading 상태 테스트 ──

    @Test
    fun loadingState_showsProgressIndicator() {
        composeTestRule.setContent {
            UserListScreen(uiState = UserListUiState.Loading)
        }

        composeTestRule
            .onNodeWithTag("loading_indicator")
            .assertIsDisplayed()

        composeTestRule
            .onNodeWithTag("user_list")
            .assertDoesNotExist()

        composeTestRule
            .onNodeWithTag("error_view")
            .assertDoesNotExist()
    }

    // ── Success 상태 테스트 ──

    @Test
    fun successState_showsUserList() {
        val users = listOf(
            User(id = 1, name = "김철수"),
            User(id = 2, name = "이영희"),
            User(id = 3, name = "박민수")
        )

        composeTestRule.setContent {
            UserListScreen(uiState = UserListUiState.Success(users))
        }

        composeTestRule
            .onNodeWithTag("user_list")
            .assertIsDisplayed()

        composeTestRule
            .onNodeWithTag("loading_indicator")
            .assertDoesNotExist()

        // 모든 사용자가 표시되는지 확인
        composeTestRule
            .onAllNodesWithTag("user_item")
            .assertCountEquals(3)

        composeTestRule
            .onNodeWithText("김철수")
            .assertIsDisplayed()
    }

    @Test
    fun successState_emptyList_showsEmptyMessage() {
        composeTestRule.setContent {
            UserListScreen(uiState = UserListUiState.Success(emptyList()))
        }

        composeTestRule
            .onAllNodesWithTag("user_item")
            .assertCountEquals(0)
    }

    // ── Error 상태 테스트 ──

    @Test
    fun errorState_showsErrorMessageAndRetryButton() {
        composeTestRule.setContent {
            UserListScreen(
                uiState = UserListUiState.Error("네트워크 오류가 발생했습니다")
            )
        }

        composeTestRule
            .onNodeWithTag("error_view")
            .assertIsDisplayed()

        composeTestRule
            .onNodeWithTag("error_message")
            .assertTextEquals("네트워크 오류가 발생했습니다")

        composeTestRule
            .onNodeWithTag("retry_button")
            .assertIsDisplayed()
            .assertHasClickAction()
    }
}
```

### 상태 전환 테스트

```kotlin [compose-playground]
@Test
fun stateTransition_loadingToSuccess() {
    var uiState by mutableStateOf<UserListUiState>(UserListUiState.Loading)

    composeTestRule.setContent {
        UserListScreen(uiState = uiState)
    }

    // 처음에는 로딩 상태
    composeTestRule
        .onNodeWithTag("loading_indicator")
        .assertIsDisplayed()

    // 상태를 Success로 변경
    uiState = UserListUiState.Success(
        listOf(User(id = 1, name = "김철수"))
    )

    // 로딩 인디케이터 사라짐
    composeTestRule
        .onNodeWithTag("loading_indicator")
        .assertDoesNotExist()

    // 사용자 리스트 표시됨
    composeTestRule
        .onNodeWithText("김철수")
        .assertIsDisplayed()
}
```

---

## 7. Navigation3 테스트

Navigation3에서는 백 스택이 단순한 `SnapshotStateList`이므로, 별도의 `TestNavHostController` 없이 **백 스택을 직접 검증**할 수 있습니다.

### Navigation3 테스트 종속성

```kotlin [compose-playground]
// build.gradle.kts — Navigation3는 별도의 테스트 아티팩트가 필요 없음
// navigation3-runtime과 navigation3-ui만 있으면 테스트 가능
androidTestImplementation("androidx.navigation3:navigation3-runtime:1.0.1")
androidTestImplementation("androidx.navigation3:navigation3-ui:1.0.1")
```

### NavKey를 사용한 Navigation3 테스트

Navigation3에서는 `NavKey` 타입의 백 스택을 직접 검증하므로, 문자열 비교 대신 **타입 안전한 검증**이 가능합니다.

```kotlin [compose-playground]
// NavKey 정의
@Serializable data object HomeRoute : NavKey
@Serializable data class DetailRoute(val id: Int) : NavKey
@Serializable data object SettingsRoute : NavKey

class NavigationTest {

    @get:Rule
    val composeTestRule = createComposeRule()

    @Test
    fun navigation_startDestination_isHomeScreen() {
        val backStack = mutableStateListOf<NavKey>(HomeRoute)

        composeTestRule.setContent {
            NavDisplay(
                backStack = backStack,
                onBack = { backStack.removeLastOrNull() },
                entryProvider = entryProvider {
                    entry<HomeRoute> { HomeScreen(/* ... */) }
                    entry<DetailRoute> { key -> DetailScreen(id = key.id) }
                    entry<SettingsRoute> { SettingsScreen() }
                }
            )
        }

        // 시작 화면이 HomeRoute인지 타입으로 확인
        assert(backStack.last() is HomeRoute)
    }

    @Test
    fun navigation_clickItem_navigatesToDetail() {
        val backStack = mutableStateListOf<NavKey>(HomeRoute)

        composeTestRule.setContent {
            NavDisplay(
                backStack = backStack,
                onBack = { backStack.removeLastOrNull() },
                entryProvider = entryProvider {
                    entry<HomeRoute> {
                        HomeScreen(
                            onItemClick = { id -> backStack.add(DetailRoute(id)) }
                        )
                    }
                    entry<DetailRoute> { key -> DetailScreen(id = key.id) }
                }
            )
        }

        // 홈 화면에서 아이템 클릭
        composeTestRule
            .onNodeWithText("아이템 1")
            .performClick()

        // 백 스택을 타입 안전하게 검증
        assert(backStack.size == 2)
        assert(backStack.last() is DetailRoute)
        assert((backStack.last() as DetailRoute).id == 1)
    }

    @Test
    fun navigation_backButton_returnsToHome() {
        val backStack = mutableStateListOf<NavKey>(HomeRoute)

        composeTestRule.setContent {
            NavDisplay(
                backStack = backStack,
                onBack = { backStack.removeLastOrNull() },
                entryProvider = entryProvider {
                    entry<HomeRoute> {
                        HomeScreen(
                            onSettings = { backStack.add(SettingsRoute) }
                        )
                    }
                    entry<SettingsRoute> {
                        SettingsScreen(
                            onBack = { backStack.removeLastOrNull() }
                        )
                    }
                }
            )
        }

        // 설정 화면으로 이동
        composeTestRule
            .onNodeWithText("설정")
            .performClick()

        // 뒤로 가기
        composeTestRule
            .onNodeWithContentDescription("뒤로 가기")
            .performClick()

        // 백 스택에 Home만 남았는지 확인
        assert(backStack.size == 1)
        assert(backStack.last() is HomeRoute)
    }
}
```

### 백 스택 이력 확인

```kotlin [compose-playground]
@Test
fun navigation_backStack_isCorrect() {
    val backStack = mutableStateListOf<NavKey>(HomeRoute)

    composeTestRule.setContent {
        NavDisplay(
            backStack = backStack,
            onBack = { backStack.removeLastOrNull() },
            entryProvider = entryProvider {
                entry<HomeRoute> {
                    HomeScreen(onNavigate = { backStack.add(it) })
                }
                entry<CategoryRoute> { key ->
                    CategoryScreen(onNavigate = { backStack.add(it) })
                }
                entry<DetailRoute> { key ->
                    DetailScreen(id = key.id)
                }
            }
        )
    }

    // 여러 화면을 이동
    composeTestRule.onNodeWithText("카테고리").performClick()
    composeTestRule.onNodeWithText("전자기기").performClick()
    composeTestRule.onNodeWithText("스마트폰").performClick()

    // 백 스택을 타입으로 직접 검증 — 문자열 비교 불필요!
    assert(backStack[0] is HomeRoute)
    assert(backStack.any { it is CategoryRoute })
    assert(backStack.last() is DetailRoute)
}
```

> **Navigation 2.x와의 차이**: 2.x에서는 `TestNavHostController`를 설정하고 `destination.route` 문자열을 비교했습니다. Navigation3에서는 백 스택이 일반 리스트이므로, `is` 키워드로 타입 검증하고 프로퍼티에 직접 접근할 수 있습니다. 테스트가 훨씬 간결하고 안전합니다.

---

## 8. 테스트 가능한 코드 작성 팁

### 핵심 원칙: 컴포저블에서 비즈니스 로직 분리

```kotlin [compose-playground]
// ❌ 잘못된 예: 컴포저블 안에 비즈니스 로직이 섞여 있음
@Composable
fun OrderScreen(viewModel: OrderViewModel = viewModel()) {
    val items = viewModel.items.collectAsState()
    val total = items.value.sumOf { it.price * it.quantity }  // 로직이 UI에!
    val discount = if (total > 50000) total * 0.1 else 0.0   // 로직이 UI에!

    Column {
        Text("총 금액: ₩${total - discount}")
        // ... 직접 ViewModel에 의존하여 테스트하기 어려움
    }
}

// ✅ 올바른 예: 비즈니스 로직 분리
// 1. UI 상태를 명확히 정의
data class OrderUiState(
    val items: List<OrderItem> = emptyList(),
    val totalPrice: Long = 0,
    val discountPrice: Long = 0,
    val finalPrice: Long = 0
)

// 2. ViewModel에서 로직 처리
class OrderViewModel : ViewModel() {
    private val _uiState = MutableStateFlow(OrderUiState())
    val uiState = _uiState.asStateFlow()

    fun calculateTotal(items: List<OrderItem>) {
        val total = items.sumOf { it.price * it.quantity }
        val discount = if (total > 50000) (total * 0.1).toLong() else 0L
        _uiState.update {
            it.copy(
                items = items,
                totalPrice = total,
                discountPrice = discount,
                finalPrice = total - discount
            )
        }
    }
}

// 3. 컴포저블은 상태만 표시 (ViewModel 없이도 테스트 가능)
@Composable
fun OrderScreen(uiState: OrderUiState) {
    Column {
        Text("총 금액: ₩${uiState.finalPrice}")
    }
}
```

### TextFieldState 기반 TextField 테스트

Compose의 새로운 `TextField` API는 `TextFieldState`를 사용하여 상태를 관리합니다. 이 API를 사용할 때는 노드의 텍스트를 `assertTextEquals`로 검증하는 대신, `TextFieldState` 객체에서 직접 텍스트 값을 읽어 검증하는 것이 더 안정적입니다.

```kotlin [compose-playground]
@Test
fun textField_withTextFieldState_readsTextDirectly() {
    val textFieldState = TextFieldState()

    composeTestRule.setContent {
        TextField(
            state = textFieldState,
            modifier = Modifier.testTag("name_input")
        )
    }

    composeTestRule
        .onNodeWithTag("name_input")
        .performTextInput("홍길동")

    // ✅ TextFieldState에서 직접 텍스트를 읽어 검증
    assert(textFieldState.text.toString() == "홍길동")

    // 참고: assertTextEquals도 사용할 수 있지만,
    // TextFieldState를 사용할 경우 state 객체에서 직접 읽는 것이 더 명확합니다.
}
```

> **참고 (Smart Selection)**: Android의 텍스트 분류(Smart Text Selection) 기능이 활성화된 환경에서는, 텍스트 선택/복사 동작 관련 테스트 결과가 디바이스마다 다를 수 있습니다. Smart Selection은 ML 모델을 사용하여 전화번호, 주소 등을 자동 인식하므로, 텍스트 선택 범위에 의존하는 테스트를 작성할 때는 이 점을 고려하세요.

### 상태 호이스팅으로 테스트 용이성 확보

```kotlin [compose-playground]
// ❌ 잘못된 예: 내부 상태를 가진 컴포저블
@Composable
fun SearchBar() {
    var query by remember { mutableStateOf("") }
    var isActive by remember { mutableStateOf(false) }

    TextField(
        value = query,
        onValueChange = { query = it },
        // 내부 상태를 외부에서 제어할 수 없음 → 테스트 어려움
    )
}

// ✅ 올바른 예: 상태 호이스팅
@Composable
fun SearchBar(
    query: String,              // 상태를 외부에서 주입
    onQueryChange: (String) -> Unit,  // 이벤트를 외부로 전달
    isActive: Boolean = false,
    onActiveChange: (Boolean) -> Unit = {}
) {
    TextField(
        value = query,
        onValueChange = onQueryChange,
        modifier = Modifier.testTag("search_input")
    )
}
```

```kotlin [compose-playground]
// 호이스팅된 컴포저블 테스트 — 매우 간단!
@Test
fun searchBar_onTextInput_callsOnQueryChange() {
    var capturedQuery = ""

    composeTestRule.setContent {
        SearchBar(
            query = "",
            onQueryChange = { capturedQuery = it }
        )
    }

    composeTestRule
        .onNodeWithTag("search_input")
        .performTextInput("Compose")

    assert(capturedQuery == "Compose")
}
```

### 이벤트 콜백 검증 패턴

```kotlin [compose-playground]
@Test
fun loginForm_onSubmit_passesCredentials() {
    var submittedEmail = ""
    var submittedPassword = ""

    composeTestRule.setContent {
        LoginForm(
            onLogin = { email, password ->
                submittedEmail = email
                submittedPassword = password
            }
        )
    }

    composeTestRule
        .onNodeWithTag("email_input")
        .performTextInput("user@test.com")

    composeTestRule
        .onNodeWithTag("password_input")
        .performTextInput("password123")

    composeTestRule
        .onNodeWithText("로그인")
        .performClick()

    assert(submittedEmail == "user@test.com")
    assert(submittedPassword == "password123")
}
```

### 테스트 가능한 코드 체크리스트

```
┌─────────────────────────────────────────────────────┐
│            테스트 가능한 코드 체크리스트                 │
│                                                     │
│  ✓ 컴포저블에 비즈니스 로직이 없는가?                    │
│  ✓ 상태가 호이스팅되어 있는가?                          │
│  ✓ ViewModel 없이 컴포저블을 테스트할 수 있는가?         │
│  ✓ 이벤트가 콜백 함수로 전달되는가?                      │
│  ✓ Preview에서 컴포저블이 정상 렌더링되는가?              │
│  ✓ 테스트에 필요한 testTag가 추가되어 있는가?            │
│  ✓ 접근성 정보(contentDescription)가 적절한가?          │
└─────────────────────────────────────────────────────┘
```

---

## 9. 정리

### 핵심 패턴 요약

| 패턴 | 설명 | 사용 시점 |
|------|------|-----------|
| 시맨틱 기반 테스트 | 의미 정보로 노드 탐색/검증 | 모든 UI 테스트 |
| 병합/비병합 트리 | 자식 노드 개별 접근 | 복합 컴포저블 내부 요소 검증 |
| 커스텀 시맨틱 | 테스트용 메타데이터 추가 | 복잡한 상태 검증 |
| waitUntil | 비동기 작업 완료 대기 | 네트워크 로딩, 지연 작업 |
| MainTestClock | 시간 수동 제어 | 애니메이션 테스트 |
| 상태별 테스트 | Loading/Success/Error 분리 | 데이터 로딩 화면 |
| Navigation 테스트 | TestNavHostController | 화면 전환 검증 |
| 상태 호이스팅 | 외부 주입으로 테스트 용이 | 모든 컴포저블 설계 |

### 다음 단계

테스트 패턴을 익혔다면, 다음 문서에서 디버깅 도구와 성능 프로파일링을 배워봅니다:

- Layout Inspector로 Compose 트리 시각화
- Recomposition 카운터로 성능 문제 추적
- Compose Compiler Metrics로 안정성 분석
