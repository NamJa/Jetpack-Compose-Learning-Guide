# UI 테스트 기초

> **"테스트 없는 코드는 작동하는 것처럼 보일 뿐, 정말 작동하는 것은 아니다."**
>
> Jetpack Compose는 처음부터 테스트를 염두에 두고 설계되었습니다.
> 이 문서에서는 Compose UI 테스트의 기본 개념부터 첫 번째 테스트 작성까지 단계별로 알아봅니다.

---

## 목차

1. [UI 테스트란?](#1-ui-테스트란)
2. [종속성 추가](#2-종속성-추가)
3. [ComposeTestRule 이해하기](#3-composetestrule-이해하기)
4. [기본 테스트 구조: setContent → 액션 → 어설션](#4-기본-테스트-구조-setcontent--액션--어설션)
5. [노드 찾기(Finder)](#5-노드-찾기finder)
6. [액션 수행](#6-액션-수행)
7. [어설션(Assertion)](#7-어설션assertion)
8. [testTag와 Modifier.semantics](#8-testtag와-modifiersemantics)
9. [첫 번째 UI 테스트 작성 실전](#9-첫-번째-ui-테스트-작성-실전)
10. [정리](#10-정리)

---

## 1. UI 테스트란?

UI 테스트는 **사용자 관점에서 앱이 올바르게 동작하는지** 검증하는 테스트입니다.

```
┌───────────────────────────────────────────────────┐
│                  테스트 피라미드                      │
│                                                   │
│                    /  E2E  \       ← 적게, 느림     │
│                   /─────────\                      │
│                  / 통합 테스트 \    ← 중간            │
│                 /─────────────\                    │
│                / 단위 테스트(Unit)\  ← 많이, 빠름     │
│               /─────────────────\                  │
└───────────────────────────────────────────────────┘
```

| 테스트 종류 | 대상 | 속도 | 예시 |
|------------|------|------|------|
| **단위 테스트** | 함수, 클래스 | 빠름 | ViewModel 로직 테스트 |
| **UI 테스트** | 화면, 컴포넌트 | 중간 | 버튼 클릭 시 텍스트 변경 확인 |
| **E2E 테스트** | 전체 앱 흐름 | 느림 | 로그인 → 메인 화면 → 상세 화면 |

Compose의 UI 테스트는 **시맨틱 트리(Semantics Tree)** 를 기반으로 동작합니다. 실제 화면에 그려진 픽셀이 아니라, 컴포저블이 제공하는 **의미 정보(텍스트, 역할, 상태 등)** 를 통해 노드를 찾고 검증합니다.

```
┌─────────────────────────────────────┐
│           시맨틱 트리                  │
│                                     │
│  Screen                             │
│  ├── Text("안녕하세요")              │
│  ├── TextField(value="")            │
│  └── Button                         │
│       └── Text("클릭")              │
│                                     │
│  → 테스트는 이 트리를 탐색합니다       │
└─────────────────────────────────────┘
```

---

## 2. 종속성 추가

Compose UI 테스트를 위해 `build.gradle.kts`에 다음 종속성을 추가합니다.

```kotlin [compose-playground]
// build.gradle.kts (Module :app)

// Compose BOM으로 버전 통합 관리 (Compose UI Test 1.10.4, Material3 1.4.0 포함)
val composeBom = platform("androidx.compose:compose-bom:2026.02.01")

dependencies {
    // 프로덕션 코드
    implementation(composeBom)
    implementation("androidx.compose.ui:ui")
    implementation("androidx.compose.material3:material3")

    // ── 테스트 종속성 ──

    // UI 테스트 프레임워크 (JUnit4 기반) — 버전은 BOM이 관리
    androidTestImplementation(composeBom)
    androidTestImplementation("androidx.compose.ui:ui-test-junit4")

    // 테스트에서 Activity 없이 Compose를 렌더링하기 위한 매니페스트 — 버전은 BOM이 관리
    debugImplementation("androidx.compose.ui:ui-test-manifest")

    // 단위 테스트
    testImplementation("junit:junit:4.13.2")
}
```

### 각 종속성의 역할

| 종속성 | 용도 |
|--------|------|
| `ui-test-junit4` | `ComposeTestRule`, Finder, Action, Assertion 등 테스트 API 제공 |
| `ui-test-manifest` | 테스트 전용 `ComponentActivity`를 매니페스트에 등록 (debug 빌드에만 포함) |

> **주의**: `ui-test-manifest`는 `debugImplementation`으로 추가합니다. 릴리스 빌드에 포함되면 안 됩니다.

> **참고 (v2 Testing APIs)**: Compose UI Test 1.10.x부터 일부 Testing API의 v2 마이그레이션이 진행 중입니다. 현재는 기존 `ui-test-junit4` API가 완전히 호환되지만, 향후 v2 API가 안정화되면 `ComposeTestRule` 생성 방식이나 Finder/Assertion의 시그니처가 변경될 수 있습니다. 마이그레이션 안내가 공식 릴리스 노트에 게시되면 점진적으로 전환하는 것을 권장합니다.

---

## 3. ComposeTestRule 이해하기

`ComposeTestRule`은 Compose UI 테스트의 **진입점**입니다. 테스트 환경에서 컴포저블을 렌더링하고, 노드를 찾고, 액션을 수행하고, 결과를 검증할 수 있게 해줍니다.

### createComposeRule()

가장 기본적인 테스트 룰입니다. **Activity 없이** 컴포저블을 테스트할 때 사용합니다.

```kotlin [compose-playground]
import androidx.compose.ui.test.junit4.createComposeRule
import org.junit.Rule
import org.junit.Test

class GreetingTest {

    @get:Rule
    val composeTestRule = createComposeRule()

    @Test
    fun greeting_displaysHello() {
        // 테스트할 컴포저블 설정
        composeTestRule.setContent {
            Text("안녕하세요")
        }

        // 검증
        composeTestRule
            .onNodeWithText("안녕하세요")
            .assertIsDisplayed()
    }
}
```

### createAndroidComposeRule()

특정 Activity의 컨텍스트가 필요할 때 사용합니다. 테마, 리소스, Intent 등에 접근할 수 있습니다.

```kotlin [compose-playground]
import androidx.compose.ui.test.junit4.createAndroidComposeRule
import org.junit.Rule
import org.junit.Test

class MainScreenTest {

    @get:Rule
    val composeTestRule = createAndroidComposeRule<MainActivity>()

    @Test
    fun mainScreen_showsTitle() {
        // MainActivity가 자동으로 실행됨
        // Activity의 setContent에서 설정한 UI가 표시됨

        composeTestRule
            .onNodeWithText("메인 화면")
            .assertIsDisplayed()
    }

    @Test
    fun mainScreen_accessStringResource() {
        // Activity의 리소스에 접근 가능
        val title = composeTestRule.activity.getString(R.string.app_name)

        composeTestRule
            .onNodeWithText(title)
            .assertIsDisplayed()
    }
}
```

### 두 룰의 비교

| 항목 | `createComposeRule()` | `createAndroidComposeRule()` |
|------|----------------------|------------------------------|
| Activity 생성 | 내부적으로 빈 Activity 사용 | 지정한 Activity 사용 |
| 사용 시점 | 개별 컴포저블 테스트 | Activity 컨텍스트 필요 시 |
| 속도 | 더 빠름 | 약간 느림 |
| 추천 | **대부분의 경우** | 테마/리소스 필요 시 |

---

## 4. 기본 테스트 구조: setContent → 액션 → 어설션

모든 Compose UI 테스트는 세 단계로 구성됩니다.

```
┌─────────────────────────────────────────┐
│           테스트의 3단계                   │
│                                         │
│  1️⃣ setContent  →  UI를 렌더링한다       │
│          ↓                              │
│  2️⃣ Action      →  사용자 동작을 흉내낸다  │
│          ↓                              │
│  3️⃣ Assertion   →  결과를 검증한다        │
└─────────────────────────────────────────┘
```

```kotlin [compose-playground]
@Test
fun counter_incrementsOnClick() {
    // 1단계: setContent — 테스트할 UI 설정
    composeTestRule.setContent {
        CounterScreen()
    }

    // 2단계: Action — 버튼 클릭
    composeTestRule
        .onNodeWithText("+1")
        .performClick()

    // 3단계: Assertion — 결과 확인
    composeTestRule
        .onNodeWithText("카운트: 1")
        .assertIsDisplayed()
}
```

> **팁**: 테스트 이름은 `대상_조건_기대결과` 형식으로 작성하면 읽기 좋습니다.
> 예: `counter_whenPlusButtonClicked_showsIncrementedValue`

---

## 5. 노드 찾기(Finder)

테스트에서 가장 먼저 할 일은 **검증할 노드를 찾는 것**입니다. Compose는 시맨틱 트리에서 노드를 찾는 다양한 Finder를 제공합니다.

### onNodeWithText

**텍스트로 노드를 찾습니다.** 가장 흔하게 사용됩니다.

```kotlin [compose-playground]
// 정확히 일치하는 텍스트 찾기
composeTestRule
    .onNodeWithText("로그인")
    .assertIsDisplayed()

// 부분 일치 (substring = true)
composeTestRule
    .onNodeWithText("로그", substring = true)
    .assertIsDisplayed()

// 대소문자 무시
composeTestRule
    .onNodeWithText("login", ignoreCase = true)
    .assertIsDisplayed()
```

### onNodeWithTag

**testTag로 노드를 찾습니다.** 텍스트가 변경될 수 있거나, 동일한 텍스트가 여러 개 있을 때 유용합니다.

```kotlin [compose-playground]
// 컴포저블에 testTag 지정
TextField(
    value = text,
    onValueChange = { text = it },
    modifier = Modifier.testTag("email_input")
)

// 테스트에서 testTag로 찾기
composeTestRule
    .onNodeWithTag("email_input")
    .performTextInput("user@example.com")
```

### onNodeWithContentDescription

**접근성 설명(Content Description)으로 노드를 찾습니다.** 이미지나 아이콘 버튼에 유용합니다.

```kotlin [compose-playground]
// 컴포저블에 contentDescription 지정
Icon(
    imageVector = Icons.Default.Search,
    contentDescription = "검색"
)

// 테스트에서 찾기
composeTestRule
    .onNodeWithContentDescription("검색")
    .performClick()
```

### onNode(matcher)

**커스텀 매처를 조합해서 노드를 찾습니다.** 복잡한 조건이 필요할 때 사용합니다.

```kotlin [compose-playground]
import androidx.compose.ui.test.hasText
import androidx.compose.ui.test.hasClickAction
import androidx.compose.ui.test.hasTestTag

// 텍스트가 "확인"이면서 클릭 가능한 노드
composeTestRule
    .onNode(hasText("확인") and hasClickAction())
    .performClick()

// 특정 testTag를 가진 텍스트 노드
composeTestRule
    .onNode(hasTestTag("title") and hasText("제목"))
    .assertIsDisplayed()
```

### 여러 노드 찾기

동일한 조건에 매칭되는 노드가 여러 개일 때 사용합니다.

```kotlin [compose-playground]
// 모든 매칭 노드 가져오기
composeTestRule
    .onAllNodesWithText("항목")
    .assertCountEquals(5)

// 첫 번째 매칭 노드
composeTestRule
    .onAllNodesWithTag("list_item")
    .onFirst()
    .assertIsDisplayed()

// 특정 인덱스의 노드
composeTestRule
    .onAllNodesWithTag("list_item")[2]
    .assertIsDisplayed()
```

### Finder 선택 가이드

```
어떤 Finder를 사용할까?

텍스트가 고정적이고 유일한가? ──→ onNodeWithText
   │ (아니오)
   ↓
접근성 설명이 있는가? ──→ onNodeWithContentDescription
   │ (아니오)
   ↓
testTag를 추가할 수 있는가? ──→ onNodeWithTag
   │ (아니오)
   ↓
여러 조건을 조합해야 하는가? ──→ onNode(matcher)
```

---

## 6. 액션 수행

노드를 찾은 후, 사용자의 동작을 시뮬레이션합니다.

### performClick

가장 기본적인 클릭 액션입니다.

```kotlin [compose-playground]
// 버튼 클릭
composeTestRule
    .onNodeWithText("저장")
    .performClick()
```

### performScrollTo

화면에 보이지 않는 노드까지 스크롤합니다. `LazyColumn`이 아닌 일반 스크롤 가능한 컨테이너에서 사용합니다.

```kotlin [compose-playground]
// 스크롤해서 노드가 보이도록 한 후 클릭
composeTestRule
    .onNodeWithText("맨 아래 항목")
    .performScrollTo()
    .performClick()
```

### performTextInput

텍스트 필드에 텍스트를 입력합니다.

```kotlin [compose-playground]
// 텍스트 입력
composeTestRule
    .onNodeWithTag("email_input")
    .performTextInput("user@example.com")

// 기존 텍스트 지우고 새로 입력
composeTestRule
    .onNodeWithTag("email_input")
    .performTextClearance()

composeTestRule
    .onNodeWithTag("email_input")
    .performTextInput("new@example.com")
```

### performImeAction

소프트 키보드의 IME 액션(완료, 검색, 다음 등)을 수행합니다.

```kotlin [compose-playground]
// 키보드의 "검색" 버튼 누르기
composeTestRule
    .onNodeWithTag("search_input")
    .performTextInput("Compose")

composeTestRule
    .onNodeWithTag("search_input")
    .performImeAction()  // KeyboardOptions의 imeAction 실행
```

### 자주 사용하는 액션 정리

| 액션 | 설명 | 사용 예 |
|------|------|---------|
| `performClick()` | 클릭 | 버튼, 체크박스 |
| `performScrollTo()` | 스크롤하여 노드 표시 | 긴 폼의 하단 버튼 |
| `performTextInput("text")` | 텍스트 입력 | TextField |
| `performTextClearance()` | 텍스트 지우기 | TextField 초기화 |
| `performImeAction()` | IME 액션 실행 | 키보드 검색/완료 |
| `performTouchInput { swipeUp() }` | 터치 제스처 | 스와이프, 드래그 |

---

## 7. 어설션(Assertion)

액션을 수행한 후, 기대하는 결과를 검증합니다.

### assertIsDisplayed / assertIsNotDisplayed

노드가 화면에 표시되는지 확인합니다.

```kotlin [compose-playground]
// 표시 확인
composeTestRule
    .onNodeWithText("환영합니다")
    .assertIsDisplayed()

// 비표시 확인
composeTestRule
    .onNodeWithText("에러 메시지")
    .assertIsNotDisplayed()
```

### assertExists / assertDoesNotExist

노드가 시맨틱 트리에 **존재하는지** 확인합니다. `assertIsDisplayed`와 다르게, 화면에 보이지 않더라도 트리에 있으면 통과합니다.

```kotlin [compose-playground]
// 트리에 존재 확인 (보이지 않아도 OK)
composeTestRule
    .onNodeWithTag("hidden_element")
    .assertExists()

// 트리에서 완전히 제거 확인
composeTestRule
    .onNodeWithTag("deleted_item")
    .assertDoesNotExist()
```

### assertHasClickAction

노드가 클릭 가능한지 확인합니다.

```kotlin [compose-playground]
composeTestRule
    .onNodeWithText("제출")
    .assertHasClickAction()
```

### assertTextEquals

노드의 텍스트가 정확히 일치하는지 확인합니다.

```kotlin [compose-playground]
composeTestRule
    .onNodeWithTag("greeting")
    .assertTextEquals("안녕하세요")
```

### assertIsEnabled / assertIsNotEnabled

노드가 활성화/비활성화 상태인지 확인합니다.

```kotlin [compose-playground]
// 입력 전: 버튼 비활성화
composeTestRule
    .onNodeWithText("로그인")
    .assertIsNotEnabled()

// 입력 후: 버튼 활성화
composeTestRule
    .onNodeWithTag("email_input")
    .performTextInput("user@example.com")

composeTestRule
    .onNodeWithText("로그인")
    .assertIsEnabled()
```

### 자주 사용하는 어설션 정리

| 어설션 | 설명 |
|--------|------|
| `assertIsDisplayed()` | 화면에 표시됨 |
| `assertIsNotDisplayed()` | 화면에 표시되지 않음 |
| `assertExists()` | 시맨틱 트리에 존재 |
| `assertDoesNotExist()` | 시맨틱 트리에 없음 |
| `assertHasClickAction()` | 클릭 가능 |
| `assertHasNoClickAction()` | 클릭 불가 |
| `assertTextEquals("text")` | 텍스트 일치 |
| `assertTextContains("text")` | 텍스트 포함 |
| `assertIsEnabled()` | 활성화 상태 |
| `assertIsNotEnabled()` | 비활성화 상태 |
| `assertIsToggleable()` | 토글 가능 (체크박스 등) |
| `assertIsOn()` / `assertIsOff()` | 체크 상태 |

---

## 8. testTag와 Modifier.semantics

### testTag 수정자

`testTag`는 테스트에서 노드를 식별하기 위한 **테스트 전용 태그**입니다.

```kotlin [compose-playground]
@Composable
fun LoginForm() {
    Column {
        TextField(
            value = email,
            onValueChange = { email = it },
            label = { Text("이메일") },
            modifier = Modifier.testTag("email_input")   // 테스트용 태그
        )

        TextField(
            value = password,
            onValueChange = { password = it },
            label = { Text("비밀번호") },
            modifier = Modifier.testTag("password_input") // 테스트용 태그
        )

        Button(
            onClick = { onLogin() },
            modifier = Modifier.testTag("login_button")   // 테스트용 태그
        ) {
            Text("로그인")
        }
    }
}
```

### 언제 testTag를 사용해야 할까?

```kotlin [compose-playground]
// ❌ 잘못된 예: 변경 가능한 텍스트로 노드 찾기
composeTestRule
    .onNodeWithText("3개의 알림이 있습니다")  // 숫자가 바뀌면 테스트 실패!
    .assertIsDisplayed()

// ✅ 올바른 예: testTag로 안정적으로 찾기
// 프로덕션 코드
Text(
    text = "${count}개의 알림이 있습니다",
    modifier = Modifier.testTag("notification_count")
)

// 테스트 코드
composeTestRule
    .onNodeWithTag("notification_count")
    .assertTextContains("3개")
```

### Modifier.semantics

`semantics` 수정자를 사용하면 테스트에서 활용할 수 있는 **커스텀 시맨틱 정보**를 추가할 수 있습니다.

```kotlin [compose-playground]
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.semantics.semantics

@Composable
fun UserCard(user: User) {
    Card(
        modifier = Modifier.semantics {
            contentDescription = "${user.name}의 프로필 카드"
        }
    ) {
        Text(user.name)
        Text(user.email)
    }
}

// 테스트에서 접근성 설명으로 찾기
composeTestRule
    .onNodeWithContentDescription("홍길동의 프로필 카드")
    .assertIsDisplayed()
```

### testTag 네이밍 규칙

팀에서 일관된 네이밍 규칙을 정하면 유지보수가 쉬워집니다.

```kotlin [kotlin-playground]
// 추천: 화면이름_요소타입_용도
object TestTags {
    // 로그인 화면
    const val LOGIN_EMAIL_INPUT = "login_email_input"
    const val LOGIN_PASSWORD_INPUT = "login_password_input"
    const val LOGIN_SUBMIT_BUTTON = "login_submit_button"
    const val LOGIN_ERROR_TEXT = "login_error_text"

    // 메인 화면
    const val MAIN_ITEM_LIST = "main_item_list"
    const val MAIN_FAB = "main_fab"
}
```

### 시맨틱 트리 변경 사항 (Compose 1.10+)

> **주의**: Compose UI 1.10.x부터 `background`와 `border` Modifier가 `SemanticsModifierNode`를 구현하도록 변경되었습니다. 이로 인해 이전에는 시맨틱 트리에 나타나지 않던 `background`/`border` 노드가 트리에 추가될 수 있습니다.
>
> 기존 테스트에서 `onAllNodes`, `assertCountEquals` 등 **노드 수에 의존하는 어설션**을 사용하고 있다면, 업그레이드 후 예상치 못한 노드 증가로 테스트가 실패할 수 있습니다. 이 경우 `useUnmergedTree = true`로 트리 구조를 확인하고, 필요하다면 매처 조건을 보다 구체적으로 지정하여 해결하세요.

---

## 9. 첫 번째 UI 테스트 작성 실전

간단한 카운터 앱을 만들고 테스트해 봅시다.

### Step 1: 프로덕션 코드 작성

```kotlin [compose-playground]
// CounterScreen.kt
@Composable
fun CounterScreen() {
    var count by remember { mutableIntStateOf(0) }

    Column(
        modifier = Modifier
            .fillMaxSize()
            .padding(16.dp),
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.Center
    ) {
        Text(
            text = "카운트: $count",
            style = MaterialTheme.typography.headlineMedium,
            modifier = Modifier.testTag("count_text")
        )

        Spacer(modifier = Modifier.height(16.dp))

        Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
            Button(
                onClick = { count-- },
                modifier = Modifier.testTag("decrement_button")
            ) {
                Text("-1")
            }

            Button(
                onClick = { count = 0 },
                modifier = Modifier.testTag("reset_button")
            ) {
                Text("초기화")
            }

            Button(
                onClick = { count++ },
                modifier = Modifier.testTag("increment_button")
            ) {
                Text("+1")
            }
        }
    }
}
```

### Step 2: 테스트 코드 작성

```kotlin [compose-playground]
// CounterScreenTest.kt
// 위치: app/src/androidTest/java/com/example/app/CounterScreenTest.kt

import androidx.compose.ui.test.*
import androidx.compose.ui.test.junit4.createComposeRule
import org.junit.Rule
import org.junit.Test

class CounterScreenTest {

    @get:Rule
    val composeTestRule = createComposeRule()

    @Test
    fun counterScreen_initialState_showsZero() {
        // Given: 카운터 화면이 표시됨
        composeTestRule.setContent {
            CounterScreen()
        }

        // Then: 초기값은 0
        composeTestRule
            .onNodeWithTag("count_text")
            .assertTextEquals("카운트: 0")
    }

    @Test
    fun counterScreen_incrementButton_increasesCount() {
        composeTestRule.setContent {
            CounterScreen()
        }

        // When: +1 버튼 클릭
        composeTestRule
            .onNodeWithText("+1")
            .performClick()

        // Then: 카운트가 1이 됨
        composeTestRule
            .onNodeWithTag("count_text")
            .assertTextEquals("카운트: 1")
    }

    @Test
    fun counterScreen_decrementButton_decreasesCount() {
        composeTestRule.setContent {
            CounterScreen()
        }

        // When: -1 버튼 클릭
        composeTestRule
            .onNodeWithText("-1")
            .performClick()

        // Then: 카운트가 -1이 됨
        composeTestRule
            .onNodeWithTag("count_text")
            .assertTextEquals("카운트: -1")
    }

    @Test
    fun counterScreen_resetButton_resetsToZero() {
        composeTestRule.setContent {
            CounterScreen()
        }

        // Given: +1을 3번 클릭하여 카운트를 3으로 만듦
        repeat(3) {
            composeTestRule
                .onNodeWithText("+1")
                .performClick()
        }

        // When: 초기화 버튼 클릭
        composeTestRule
            .onNodeWithText("초기화")
            .performClick()

        // Then: 카운트가 0으로 돌아감
        composeTestRule
            .onNodeWithTag("count_text")
            .assertTextEquals("카운트: 0")
    }

    @Test
    fun counterScreen_multipleClicks_showsCorrectCount() {
        composeTestRule.setContent {
            CounterScreen()
        }

        // +1을 5번, -1을 2번 → 결과는 3
        repeat(5) {
            composeTestRule
                .onNodeWithText("+1")
                .performClick()
        }
        repeat(2) {
            composeTestRule
                .onNodeWithText("-1")
                .performClick()
        }

        composeTestRule
            .onNodeWithTag("count_text")
            .assertTextEquals("카운트: 3")
    }

    @Test
    fun counterScreen_allButtonsAreClickable() {
        composeTestRule.setContent {
            CounterScreen()
        }

        // 모든 버튼이 클릭 가능한지 확인
        composeTestRule
            .onNodeWithTag("increment_button")
            .assertHasClickAction()

        composeTestRule
            .onNodeWithTag("decrement_button")
            .assertHasClickAction()

        composeTestRule
            .onNodeWithTag("reset_button")
            .assertHasClickAction()
    }
}
```

### Step 3: 테스트 실행

```
┌─────────────────────────────────────────────┐
│  테스트 실행 방법                              │
│                                             │
│  1. Android Studio에서:                      │
│     - 테스트 클래스 옆의 ▶ 버튼 클릭            │
│     - 또는 개별 테스트 메서드 옆의 ▶ 클릭        │
│                                             │
│  2. 터미널에서:                               │
│     ./gradlew connectedAndroidTest           │
│                                             │
│  3. 특정 테스트만 실행:                         │
│     ./gradlew connectedAndroidTest           │
│       --tests "*.CounterScreenTest"          │
└─────────────────────────────────────────────┘
```

---

## 10. 정리

### 핵심 개념 요약

```
┌─────────────────────────────────────────────────────┐
│               Compose UI 테스트 흐름                   │
│                                                     │
│  종속성 추가                                          │
│     └→ ui-test-junit4 + ui-test-manifest             │
│                                                     │
│  ComposeTestRule 생성                                 │
│     └→ createComposeRule() 또는                       │
│        createAndroidComposeRule<Activity>()           │
│                                                     │
│  테스트 작성 (3단계)                                    │
│     1. setContent { ... }     ← UI 렌더링             │
│     2. onNode...().perform... ← 액션 수행              │
│     3. onNode...().assert...  ← 결과 검증              │
│                                                     │
│  노드 찾기 (Finder)                                    │
│     └→ onNodeWithText / onNodeWithTag /               │
│        onNodeWithContentDescription / onNode(matcher) │
└─────────────────────────────────────────────────────┘
```

### 다음 단계

이 문서에서는 Compose UI 테스트의 기초를 배웠습니다. 다음 문서에서는 더 고급 테스트 패턴을 알아봅니다:

- 시맨틱 트리의 병합/비병합 트리
- 비동기 작업 테스트 (waitForIdle, waitUntil)
- Navigation 테스트
- 상태별 UI 테스트 패턴
