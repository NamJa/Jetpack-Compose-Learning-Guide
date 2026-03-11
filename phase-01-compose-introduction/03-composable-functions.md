# Composable 함수 이해하기

> **"Compose에서 UI의 기본 단위는 함수다."**
>
> Composable 함수는 Jetpack Compose의 핵심 빌딩 블록입니다.
> 이 문서에서는 `@Composable` 어노테이션의 의미부터 실전 활용까지 단계별로 알아봅니다.

---

## 목차

1. [@Composable 어노테이션의 의미](#1-composable-어노테이션의-의미)
2. [Composable 함수의 특성](#2-composable-함수의-특성)
3. [기본 Composable 작성하기](#3-기본-composable-작성하기)
4. [매개변수로 데이터 전달하기](#4-매개변수로-데이터-전달하기)
5. [동적 콘텐츠: 조건문과 반복문](#5-동적-콘텐츠-조건문과-반복문)
6. [@Preview 어노테이션으로 미리보기](#6-preview-어노테이션으로-미리보기)
7. [정리](#7-정리)

---

## 1. @Composable 어노테이션의 의미

### @Composable이란?

`@Composable`은 "이 함수는 UI를 구성하는 함수입니다"라고 Compose 컴파일러에게 알려주는 어노테이션입니다.

```kotlin
@Composable
fun Greeting(name: String) {
    Text(text = "안녕하세요, $name!")
}
```

> `@Composable`이 붙은 함수만 다른 `@Composable` 함수를 호출할 수 있습니다.

### 일반 함수와의 차이

```kotlin
// 일반 Kotlin 함수 — 값을 계산하고 반환
fun add(a: Int, b: Int): Int {
    return a + b
}

// Composable 함수 — UI를 "방출(emit)"
@Composable
fun NumberDisplay(value: Int) {
    Text(text = "결과: $value")  // UI 요소를 방출
}
```

```
┌────────────────────────────────────────────────────────┐
│          일반 함수 vs Composable 함수                    │
│                                                        │
│  일반 함수                    Composable 함수            │
│  ┌──────────────┐           ┌──────────────┐           │
│  │ 입력 → 계산   │           │ 입력 → UI    │           │
│  │      → 반환   │           │      → 방출   │          │
│  └──────────────┘           └──────────────┘           │
│                                                        │
│  • 값을 반환(return)          • UI 요소를 방출(emit)      │
│  • 어디서든 호출 가능          • @Composable 안에서만 호출  │
│  • 한 번 실행                 • 상태 변경 시 재실행 가능    │
└────────────────────────────────────────────────────────┘
```

### 호출 규칙

```kotlin
@Composable
fun ParentComposable() {
    // ✅ Composable 안에서 Composable 호출 — OK
    Greeting("World")
    NumberDisplay(42)
}

fun regularFunction() {
    // ❌ 일반 함수에서 Composable 호출 — 컴파일 에러!
    // Greeting("World")  // @Composable invocations can only happen from the context of a @Composable function
}
```

> **규칙**: `@Composable` 함수는 반드시 다른 `@Composable` 함수 내부에서만 호출할 수 있습니다.
> 이는 Compose 컴파일러가 **컴파일 타임**에 강제합니다.

---

## 2. Composable 함수의 특성

Composable 함수에는 세 가지 핵심 특성이 있습니다.

### 특성 1: 반환값이 없다 (Unit)

Composable 함수는 값을 반환하지 않습니다. 대신 UI를 **방출(emit)** 합니다.

```kotlin
// ❌ 잘못된 생각: UI를 반환한다
// fun makeText(): Text { ... }

// ✅ 올바른 방식: UI를 방출한다
@Composable
fun DisplayMessage(message: String) {  // 반환 타입: Unit (생략됨)
    Text(text = message)  // Text를 반환하는 게 아니라, UI 트리에 추가(방출)하는 것
}
```

```
┌────────────────────────────────────────────────────────┐
│          "방출"의 의미                                   │
│                                                        │
│  @Composable                                           │
│  fun MyScreen() {                                      │
│      Text("첫 번째")    ──→ UI 트리에 Text 노드 추가     │
│      Text("두 번째")    ──→ UI 트리에 Text 노드 추가     │
│      Button(...)       ──→ UI 트리에 Button 노드 추가   │
│  }                                                     │
│                                                        │
│  결과 UI 트리:                                           │
│       MyScreen                                         │
│       ├── Text("첫 번째")                                │
│       ├── Text("두 번째")                                │
│       └── Button(...)                                  │
└────────────────────────────────────────────────────────┘
```

### 특성 2: 멱등성 (Idempotent)

같은 입력(매개변수)으로 호출하면 항상 **같은 UI**를 생성해야 합니다.

```kotlin
// ✅ 멱등성 보장 — 같은 name이면 항상 같은 UI
@Composable
fun Greeting(name: String) {
    Text(text = "안녕하세요, $name!")
}

// ❌ 멱등성 위반 — 호출할 때마다 다른 결과
@Composable
fun RandomGreeting(name: String) {
    val random = Random.nextInt(100)  // 호출마다 다른 값!
    Text(text = "안녕하세요 #$random, $name!")
}
```

> **왜 중요할까?** Compose는 성능 최적화를 위해 Composable 함수를 **언제든 다시 호출**할 수 있습니다.
> 같은 입력에 다른 결과가 나오면 UI가 예측 불가능해집니다.

### 특성 3: 부수 효과 금지 (No Side Effects)

Composable 함수 안에서 UI 방출 외의 작업(부수 효과)을 해서는 안 됩니다.

```kotlin
// ❌ 부수 효과 — Composable 안에서 하면 안 되는 것들
@Composable
fun BadExample() {
    // 공유 변수 수정 — 리컴포지션 시 중복 실행될 수 있음
    sharedCounter++

    // 네트워크 요청 — 리컴포지션마다 반복 호출됨
    fetchDataFromServer()

    // 파일 쓰기 — 예측 불가능한 타이밍에 실행됨
    writeToFile("log.txt", "called")

    Text("결과")
}

// ✅ 부수 효과가 없는 순수한 Composable
@Composable
fun GoodExample(data: String) {
    Text(text = data)  // 오직 UI 방출만!
}
```

> **부수 효과가 필요할 때는?** `LaunchedEffect`, `DisposableEffect` 등
> Compose가 제공하는 **Side Effect API**를 사용합니다. (Phase 4에서 상세히 다룹니다)

### 세 가지 특성 요약

| 특성 | 설명 | 이유 |
|------|------|------|
| Unit 반환 | 값을 반환하지 않고 UI를 방출 | UI 트리 구조를 선언적으로 구성 |
| 멱등성 | 같은 입력 → 같은 UI | 리컴포지션 최적화를 위해 |
| 부수 효과 금지 | UI 방출 외의 작업 금지 | 예측 가능하고 안전한 실행 보장 |

---

## 3. 기본 Composable 작성하기

### 첫 번째 Composable: Greeting

```kotlin
@Composable
fun Greeting(name: String) {
    Text(
        text = "안녕하세요, $name!",
        fontSize = 24.sp,
        color = Color.DarkGray
    )
}
```

**사용 방법:**

```kotlin
class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContent {
            Greeting(name = "Compose 초보자")
        }
    }
}
```

### Composable 조합하기

Composable의 진짜 힘은 **조합(Composition)** 에 있습니다.
작은 Composable을 레고 블록처럼 조합해서 복잡한 UI를 만듭니다.

```kotlin
@Composable
fun ProfileImage(imageUrl: String) {
    // 프로필 이미지 표시
    Image(
        painter = painterResource(id = R.drawable.profile),
        contentDescription = "프로필 사진",
        modifier = Modifier.size(80.dp)
    )
}

@Composable
fun UserName(name: String) {
    Text(
        text = name,
        fontSize = 20.sp,
        fontWeight = FontWeight.Bold
    )
}

@Composable
fun UserBio(bio: String) {
    Text(
        text = bio,
        fontSize = 14.sp,
        color = Color.Gray
    )
}

// 작은 Composable들을 조합하여 큰 UI를 구성
@Composable
fun UserProfileCard(name: String, bio: String) {
    Row(
        modifier = Modifier.padding(16.dp),
        verticalAlignment = Alignment.CenterVertically
    ) {
        ProfileImage(imageUrl = "https://example.com/photo.jpg")
        Spacer(modifier = Modifier.width(16.dp))
        Column {
            UserName(name = name)
            UserBio(bio = bio)
        }
    }
}
```

```
┌────────────────────────────────────────────────────────┐
│          Composable 조합 구조                            │
│                                                        │
│  UserProfileCard                                       │
│  ├── Row                                               │
│  │   ├── ProfileImage        ┌──────┬──────────────┐  │
│  │   ├── Spacer              │ 🖼️   │ 김개발        │  │
│  │   └── Column              │      │ Android 개발자│  │
│  │       ├── UserName        └──────┴──────────────┘  │
│  │       └── UserBio                                   │
│  │                                                     │
│  └── 작은 조각을 조합해서 완성!                            │
└────────────────────────────────────────────────────────┘
```

### XML 방식과의 비교

| 항목 | XML View | Compose |
|------|----------|---------|
| 재사용 단위 | Custom View 클래스 (수십 줄) | Composable 함수 (몇 줄) |
| 조합 방식 | XML include 또는 ViewGroup | 함수 호출 |
| 데이터 전달 | Custom attribute 정의 필요 | 함수 매개변수 |
| 파일 구조 | XML + Kotlin 분리 | Kotlin 하나에 통합 |

---

## 4. 매개변수로 데이터 전달하기

### 기본 매개변수

```kotlin
@Composable
fun WelcomeMessage(
    userName: String,          // 필수 매개변수
    fontSize: TextUnit = 16.sp // 기본값이 있는 매개변수
) {
    Text(
        text = "환영합니다, $userName 님!",
        fontSize = fontSize
    )
}

// 사용
@Composable
fun App() {
    WelcomeMessage(userName = "김개발")           // 기본 폰트 크기
    WelcomeMessage(userName = "이코딩", fontSize = 24.sp) // 큰 폰트 크기
}
```

### Modifier 매개변수 (Compose 컨벤션)

Compose에서는 **Modifier를 매개변수로 받는 것**이 표준 패턴입니다.

```kotlin
// ✅ Compose 컨벤션: modifier 매개변수를 첫 번째 선택적 매개변수로 배치
@Composable
fun CustomCard(
    title: String,                              // 필수 매개변수
    modifier: Modifier = Modifier,              // Modifier (기본값: 빈 Modifier)
    subtitle: String = ""                       // 기타 선택적 매개변수
) {
    Column(modifier = modifier.padding(16.dp)) {
        Text(text = title, fontWeight = FontWeight.Bold)
        if (subtitle.isNotEmpty()) {
            Text(text = subtitle, color = Color.Gray)
        }
    }
}

// 사용하는 쪽에서 Modifier를 전달
@Composable
fun App() {
    CustomCard(
        title = "Compose 학습",
        modifier = Modifier
            .fillMaxWidth()
            .padding(8.dp),
        subtitle = "Phase 1 진행 중"
    )
}
```

> **왜 Modifier를 매개변수로 받을까?**
> 호출하는 쪽에서 크기, 패딩, 클릭 등을 자유롭게 조절할 수 있게 하기 위해서입니다.
> 이렇게 하면 Composable의 **재사용성**이 크게 높아집니다.

### 이벤트 핸들러 전달 (람다 매개변수)

```kotlin
@Composable
fun CounterButton(
    count: Int,
    onIncrement: () -> Unit  // 클릭 시 실행할 함수를 매개변수로 받음
) {
    Button(onClick = onIncrement) {
        Text("카운트: $count")
    }
}

// 사용
@Composable
fun CounterScreen() {
    var count by remember { mutableStateOf(0) }

    CounterButton(
        count = count,
        onIncrement = { count++ }  // 이벤트 핸들러 전달
    )
}
```

### 콘텐츠 슬롯 (content 람다)

Compose에서는 **다른 Composable을 매개변수로** 받을 수도 있습니다.

```kotlin
@Composable
fun SimpleCard(
    modifier: Modifier = Modifier,
    content: @Composable () -> Unit  // Composable 람다를 받는 슬롯
) {
    Surface(
        modifier = modifier,
        shape = RoundedCornerShape(8.dp),
        shadowElevation = 4.dp
    ) {
        Box(modifier = Modifier.padding(16.dp)) {
            content()  // 전달받은 Composable을 여기에 배치
        }
    }
}

// 사용 — 트레일링 람다 문법으로 내용을 전달
@Composable
fun App() {
    SimpleCard {
        Text("이 텍스트는 카드 안에 표시됩니다")
    }

    SimpleCard {
        Column {
            Text("제목", fontWeight = FontWeight.Bold)
            Text("설명 텍스트")
        }
    }
}
```

```
┌────────────────────────────────────────────────────────┐
│          매개변수 종류 정리                               │
│                                                        │
│  @Composable                                           │
│  fun MyComponent(                                      │
│      text: String,              ← 데이터 (필수)          │
│      modifier: Modifier = ..., ← 외부 스타일링 (선택)     │
│      fontSize: TextUnit = ..., ← 설정값 (선택)           │
│      onClick: () -> Unit,      ← 이벤트 핸들러           │
│      content: @Composable () -> Unit  ← 자식 콘텐츠     │
│  )                                                     │
└────────────────────────────────────────────────────────┘
```

---

## 5. 동적 콘텐츠: 조건문과 반복문

Compose의 큰 장점 중 하나는 **Kotlin의 제어 구문을 그대로 UI에 사용**할 수 있다는 것입니다.

### 조건문 (if / when)

```kotlin
@Composable
fun LoginScreen(isLoggedIn: Boolean, userName: String) {
    Column(
        modifier = Modifier
            .fillMaxSize()
            .padding(16.dp),
        verticalArrangement = Arrangement.Center,
        horizontalAlignment = Alignment.CenterHorizontally
    ) {
        // if 조건문으로 UI를 동적으로 결정
        if (isLoggedIn) {
            Text("환영합니다, $userName 님!", fontSize = 24.sp)
            Button(onClick = { /* 로그아웃 */ }) {
                Text("로그아웃")
            }
        } else {
            Text("로그인이 필요합니다", fontSize = 24.sp)
            Button(onClick = { /* 로그인 */ }) {
                Text("로그인")
            }
        }
    }
}
```

```kotlin
// when 표현식 활용
@Composable
fun StatusIndicator(status: Status) {
    val (text, color) = when (status) {
        Status.LOADING -> "로딩 중..." to Color.Gray
        Status.SUCCESS -> "성공!" to Color.Green
        Status.ERROR   -> "오류 발생" to Color.Red
    }

    Text(text = text, color = color, fontWeight = FontWeight.Bold)
}

enum class Status { LOADING, SUCCESS, ERROR }
```

### XML 방식과의 비교 (조건부 UI)

```xml
<!-- XML 방식: visibility를 수동으로 제어 -->
<LinearLayout ...>
    <TextView
        android:id="@+id/welcomeText"
        android:visibility="gone" />
    <Button
        android:id="@+id/logoutButton"
        android:visibility="gone" />
    <TextView
        android:id="@+id/loginPrompt"
        android:visibility="visible" />
    <Button
        android:id="@+id/loginButton"
        android:visibility="visible" />
</LinearLayout>
```

```kotlin
// XML 방식의 Kotlin 코드
if (isLoggedIn) {
    welcomeText.visibility = View.VISIBLE
    logoutButton.visibility = View.VISIBLE
    loginPrompt.visibility = View.GONE
    loginButton.visibility = View.GONE
    welcomeText.text = "환영합니다, $userName 님!"
} else {
    welcomeText.visibility = View.GONE
    logoutButton.visibility = View.GONE
    loginPrompt.visibility = View.VISIBLE
    loginButton.visibility = View.VISIBLE
}
```

> **Compose는 조건에 해당하지 않는 UI를 아예 생성하지 않습니다.**
> XML 방식은 모든 뷰를 미리 만들어 놓고 visibility를 토글하지만,
> Compose는 필요한 UI만 방출합니다.

### 반복문 (for)

```kotlin
@Composable
fun FruitList(fruits: List<String>) {
    Column(modifier = Modifier.padding(16.dp)) {
        Text("과일 목록", fontSize = 20.sp, fontWeight = FontWeight.Bold)
        Spacer(modifier = Modifier.height(8.dp))

        // for 반복문으로 리스트 UI 생성
        for (fruit in fruits) {
            FruitItem(name = fruit)
        }
    }
}

@Composable
fun FruitItem(name: String) {
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .padding(vertical = 4.dp),
        verticalAlignment = Alignment.CenterVertically
    ) {
        Text(text = "•", fontSize = 20.sp)
        Spacer(modifier = Modifier.width(8.dp))
        Text(text = name, fontSize = 16.sp)
    }
}

// 사용
@Composable
fun App() {
    FruitList(fruits = listOf("사과", "바나나", "체리", "포도"))
}
```

### 인덱스와 함께 반복

```kotlin
@Composable
fun NumberedList(items: List<String>) {
    Column {
        items.forEachIndexed { index, item ->
            Text(
                text = "${index + 1}. $item",
                modifier = Modifier.padding(4.dp)
            )
        }
    }
}
```

> **주의**: 많은 항목(수십~수백 개)을 표시할 때는 `for`/`forEach` 대신
> `LazyColumn`을 사용해야 합니다. (Phase 3에서 다룹니다)
> `for` 반복문은 모든 항목을 한 번에 생성하지만,
> `LazyColumn`은 **화면에 보이는 항목만** 생성합니다.

---

## 6. @Preview 어노테이션으로 미리보기

### 기본 미리보기 작성법

```kotlin
// 1. 미리보기 전용 Composable 함수를 만든다
// 2. @Preview와 @Composable을 모두 붙인다
// 3. 함수 안에서 확인하고 싶은 Composable을 호출한다

@Preview(showBackground = true)
@Composable
fun GreetingPreview() {
    Greeting(name = "Preview 테스트")
}
```

> **규칙**: `@Preview`가 붙은 함수는 **매개변수가 없어야** 합니다.
> (미리보기 시스템이 자동으로 호출하기 때문)

### 다양한 상태를 미리보기

```kotlin
@Preview(name = "로그인 상태", showBackground = true)
@Composable
fun LoginScreenLoggedInPreview() {
    LoginScreen(isLoggedIn = true, userName = "김개발")
}

@Preview(name = "비로그인 상태", showBackground = true)
@Composable
fun LoginScreenLoggedOutPreview() {
    LoginScreen(isLoggedIn = false, userName = "")
}
```

```
┌────────────────────────────────────────────────────────┐
│          Preview로 여러 상태를 동시에 확인                 │
│                                                        │
│  ┌─────────────────┐    ┌─────────────────┐            │
│  │  로그인 상태     │    │  비로그인 상태   │             │
│  │                 │    │                 │            │
│  │  환영합니다,     │    │  로그인이       │            │
│  │  김개발 님!     │    │  필요합니다      │            │
│  │                 │    │                 │            │
│  │  [로그아웃]     │    │  [로그인]        │            │
│  └─────────────────┘    └─────────────────┘            │
│                                                        │
│  → 앱을 실행하지 않고 두 가지 상태를 동시에 확인!           │
└────────────────────────────────────────────────────────┘
```

### Preview 전용 데이터 제공

```kotlin
// 미리보기용 샘플 데이터
@Preview(showBackground = true)
@Composable
fun UserProfileCardPreview() {
    UserProfileCard(
        name = "김개발",
        bio = "Android 개발자 | Compose 학습 중"
    )
}

// 리스트 미리보기
@Preview(showBackground = true)
@Composable
fun FruitListPreview() {
    FruitList(
        fruits = listOf("사과", "바나나", "체리", "포도", "수박")
    )
}
```

### Preview 함수 네이밍 컨벤션

```kotlin
// 컨벤션: [Composable이름] + Preview
// 여러 상태가 있으면 상태를 뒤에 추가

@Preview @Composable
fun GreetingPreview() { ... }

@Preview @Composable
fun LoginScreenLoggedInPreview() { ... }

@Preview @Composable
fun LoginScreenLoggedOutPreview() { ... }

@Preview @Composable
fun UserProfileCardPreview() { ... }
```

---

## 7. 정리

| 핵심 개념 | 설명 |
|-----------|------|
| @Composable | 이 함수가 UI를 구성하는 함수임을 선언하는 어노테이션 |
| UI 방출 (emit) | 값을 반환하는 게 아니라 UI 트리에 노드를 추가하는 것 |
| 멱등성 | 같은 입력이면 항상 같은 UI를 생성해야 한다 |
| 부수 효과 금지 | Composable 안에서 네트워크 요청, 파일 쓰기 등을 하면 안 된다 |
| Modifier 매개변수 | 외부에서 스타일을 조절할 수 있게 하는 Compose 표준 패턴 |
| content 슬롯 | @Composable 람다를 매개변수로 받아 유연한 구조를 만드는 패턴 |
| @Preview | 앱 실행 없이 Composable의 모습을 미리 확인하는 어노테이션 |

### Composable 함수 작성 체크리스트

- [ ] `@Composable` 어노테이션을 붙였는가?
- [ ] 함수 이름이 **PascalCase**인가? (예: `UserProfile`, `LoginScreen`)
- [ ] `modifier: Modifier = Modifier`를 매개변수로 받는가?
- [ ] 부수 효과 없이 **순수하게** UI만 방출하는가?
- [ ] `@Preview` 함수를 작성하여 미리보기를 확인했는가?

### 다음 단계

다음 문서에서는 Compose의 **수명주기와 리컴포지션** 메커니즘을 깊이 있게 알아봅니다.
상태가 변경되면 Compose가 어떻게 UI를 다시 그리는지, 그리고 이 과정을 어떻게 최적화하는지 배웁니다.

> [다음: 04. Compose 수명주기와 리컴포지션 →](04-lifecycle-and-recomposition.md)
