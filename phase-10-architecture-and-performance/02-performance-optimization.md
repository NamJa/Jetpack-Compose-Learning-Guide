# 성능 최적화

> **"성능은 기능이다. 느린 앱은 사용자를 떠나게 만든다."**
>
> Compose는 선언형 UI라서 성능 문제를 인지하기 어려울 수 있습니다.
> 이 문서에서는 Compose의 동작 원리를 이해하고, 실전에서 바로 적용할 수 있는 최적화 기법을 알아봅니다.

---

## 목차

1. [Compose의 3단계: Composition → Layout → Drawing](#1-compose의-3단계-composition--layout--drawing)
2. [릴리스 모드 + R8 필수](#2-릴리스-모드--r8-필수)
3. [remember로 비용 큰 계산 캐시](#3-remember로-비용-큰-계산-캐시)
4. [LazyLayout에 안정적 key 제공](#4-lazylayout에-안정적-key-제공)
5. [derivedStateOf로 불필요한 리컴포지션 제한](#5-derivedstateof로-불필요한-리컴포지션-제한)
6. [상태 읽기 연기 (람다 기반 수정자)](#6-상태-읽기-연기-람다-기반-수정자)
7. [안정성(Stability): @Stable, @Immutable](#7-안정성stability-stable-immutable)
8. [안정성 문제 진단과 해결](#8-안정성-문제-진단과-해결)
9. [Strong Skipping Mode](#9-strong-skipping-mode)
10. [기준 프로필(Baseline Profiles)로 앱 시작 속도 향상](#10-기준-프로필baseline-profiles로-앱-시작-속도-향상)
11. [역방향 쓰기(Backward Write) 피하기](#11-역방향-쓰기backward-write-피하기)
12. [정리](#12-정리)

---

## 1. Compose의 3단계: Composition → Layout → Drawing

Compose는 UI를 렌더링할 때 **3단계**를 거칩니다. 각 단계를 이해하면 어디서 최적화해야 하는지 알 수 있습니다.

### 3단계 다이어그램

```
┌─────────────────────────────────────────────────────┐
│             Compose 렌더링 3단계                      │
│                                                     │
│  1. Composition (컴포지션)                           │
│     ┌──────────────────────────────┐                │
│     │ 무엇을 그릴지 결정             │                │
│     │ @Composable 함수 실행         │                │
│     │ UI 트리 생성/업데이트          │                │
│     └──────────┬───────────────────┘                │
│                ↓                                    │
│  2. Layout (레이아웃)                                │
│     ┌──────────────────────────────┐                │
│     │ 어디에 배치할지 결정           │                │
│     │ 각 노드의 크기 측정(Measure)   │                │
│     │ 위치 배치(Place)              │                │
│     └──────────┬───────────────────┘                │
│                ↓                                    │
│  3. Drawing (드로잉)                                 │
│     ┌──────────────────────────────┐                │
│     │ 화면에 실제로 그리기           │                │
│     │ Canvas에 픽셀 렌더링          │                │
│     └──────────────────────────────┘                │
└─────────────────────────────────────────────────────┘
```

### 각 단계에서 수행하는 작업

| 단계 | 하는 일 | 트리거 |
|------|---------|--------|
| **Composition** | @Composable 함수 실행, UI 트리 구성 | State 변경 |
| **Layout** | 크기 측정(measure), 위치 배치(place) | 크기/위치 관련 State 변경 |
| **Drawing** | Canvas에 실제 픽셀 그리기 | 색상/투명도 등 시각 속성 변경 |

### 최적화 핵심: 가능한 늦은 단계에서 상태 읽기

```kotlin [compose-playground]
// ❌ Composition 단계에서 상태 읽기 (3단계 모두 실행)
@Composable
fun AnimatedBox(offset: State<Float>) {
    Box(
        modifier = Modifier.offset(x = offset.value.dp)  // Composition에서 읽음
    )
}

// ✅ Layout 단계에서 상태 읽기 (Layout + Drawing만 실행)
@Composable
fun AnimatedBox(offset: State<Float>) {
    Box(
        modifier = Modifier.offset {
            IntOffset(x = offset.value.toInt(), y = 0)  // Layout에서 읽음
        }
    )
}

// ✅✅ Drawing 단계에서 상태 읽기 (Drawing만 실행)
@Composable
fun AnimatedBox(color: State<Color>) {
    Box(
        modifier = Modifier.drawBehind {
            drawRect(color = color.value)  // Drawing에서만 읽음
        }
    )
}
```

---

## 2. 릴리스 모드 + R8 필수

**성능 측정은 반드시 릴리스 빌드에서 해야 합니다.** 디버그 빌드는 최적화가 적용되지 않아 실제보다 5~10배 느릴 수 있습니다.

### 디버그 vs 릴리스 차이

```
┌─────────────────────────────────────────────────────┐
│  디버그 빌드                                         │
│  - Compose 컴파일러 최적화 OFF                        │
│  - R8/ProGuard 없음                                  │
│  - 디버깅 심볼 포함                                   │
│  - Strict Mode 활성화                                │
│  → 성능 측정 의미 없음!                               │
│                                                     │
│  릴리스 빌드                                         │
│  - Compose 컴파일러 최적화 ON                         │
│  - R8 코드 축소/최적화                                │
│  - 불필요한 코드 제거                                  │
│  - 인라이닝 최적화                                    │
│  → 이것이 사용자가 체감하는 실제 성능                    │
└─────────────────────────────────────────────────────┘
```

### 릴리스 빌드 설정

```kotlin
// build.gradle.kts
android {
    buildTypes {
        release {
            isMinifyEnabled = true     // R8 코드 축소 활성화
            isShrinkResources = true   // 미사용 리소스 제거
            proguardFiles(
                getDefaultProguardFile("proguard-android-optimize.txt"),
                "proguard-rules.pro"
            )
        }
        // 성능 테스트용 빌드 타입 (선택)
        create("benchmark") {
            initWith(getByName("release"))
            signingConfig = signingConfigs.getByName("debug")
            isDebuggable = false
        }
    }
}
```

### 성능 측정 체크리스트

```
성능 측정 전 확인:
  ✓ 릴리스 빌드인가?
  ✓ R8이 활성화되어 있는가?
  ✓ 실제 디바이스에서 측정하는가? (에뮬레이터는 부정확)
  ✓ 디바이스가 충전 중이 아닌가? (열 관리 영향)
  ✓ 다른 앱이 백그라운드에서 실행 중이 아닌가?
```

---

## 3. remember로 비용 큰 계산 캐시

`remember`를 사용하면 **리컴포지션 시 비용이 큰 계산을 반복하지 않습니다.**

### 기본 사용

```kotlin [compose-playground]
// ❌ 잘못된 예: 매 리컴포지션마다 정렬 수행
@Composable
fun SortedList(items: List<Item>) {
    val sortedItems = items.sortedBy { it.name }  // 매번 실행!

    LazyColumn {
        items(sortedItems) { item ->
            ItemRow(item)
        }
    }
}

// ✅ 올바른 예: remember로 캐싱
@Composable
fun SortedList(items: List<Item>) {
    val sortedItems = remember(items) {  // items가 바뀔 때만 재계산
        items.sortedBy { it.name }
    }

    LazyColumn {
        items(sortedItems) { item ->
            ItemRow(item)
        }
    }
}
```

### 비용 큰 객체 생성 캐싱

```kotlin [compose-playground]
// ❌ 잘못된 예: 매 리컴포지션마다 정규식 컴파일
@Composable
fun EmailField(email: String, onEmailChange: (String) -> Unit) {
    val isValid = Regex("[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}")
        .matches(email)  // 매번 Regex 객체 생성!

    TextField(
        value = email,
        onValueChange = onEmailChange,
        isError = !isValid
    )
}

// ✅ 올바른 예: Regex 객체를 remember로 캐싱
@Composable
fun EmailField(email: String, onEmailChange: (String) -> Unit) {
    val emailRegex = remember {
        Regex("[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}")
    }
    val isValid = emailRegex.matches(email)

    TextField(
        value = email,
        onValueChange = onEmailChange,
        isError = !isValid
    )
}
```

### remember의 key 활용

```kotlin [compose-playground]
// key가 없으면: 최초 1회만 계산
val expensiveResult = remember { heavyComputation() }

// key가 있으면: key가 바뀔 때마다 재계산
val filteredList = remember(query, filter) {
    items.filter { matchesQuery(it, query) && matchesFilter(it, filter) }
}
```

---

## 4. LazyLayout에 안정적 key 제공

`LazyColumn`/`LazyRow`에 **안정적인 key를 제공**하면 아이템이 변경될 때 불필요한 리컴포지션을 방지합니다.

### key가 없을 때의 문제

```kotlin [compose-playground]
// ❌ key 없음: 아이템 위치 기반으로 관리
LazyColumn {
    items(tasks) { task ->  // 인덱스 기반
        TaskRow(task)
    }
}

// 문제 시나리오:
// 원래: [A, B, C, D, E]
// 삭제: [A, C, D, E]     ← B 삭제
//
// key 없이 인덱스 기반이면:
// index 0: A → A (동일)
// index 1: B → C (변경됨! → 리컴포지션)
// index 2: C → D (변경됨! → 리컴포지션)
// index 3: D → E (변경됨! → 리컴포지션)
// → B만 삭제했는데 3개 아이템이 리컴포지션!
```

### key를 제공하면

```kotlin [compose-playground]
// ✅ 안정적인 key 제공: 고유 ID 기반으로 관리
LazyColumn {
    items(
        items = tasks,
        key = { task -> task.id }  // 고유 ID를 key로
    ) { task ->
        TaskRow(task)
    }
}

// key가 있으면:
// key=A: A → A (동일, 건너뜀)
// key=B: 삭제됨
// key=C: C → C (동일, 건너뜀)
// key=D: D → D (동일, 건너뜀)
// key=E: E → E (동일, 건너뜀)
// → 삭제된 B만 처리! 나머지는 건너뜀
```

### key 선택 가이드

```kotlin [compose-playground]
// 좋은 key 예시
items(users, key = { it.id })           // DB ID
items(products, key = { it.sku })       // 고유 코드
items(messages, key = { it.messageId }) // 서버 ID

// ❌ 나쁜 key 예시
items(users, key = { it.name })    // 이름은 중복 가능!
items(users, key = { it.hashCode() })  // 해시 충돌 가능!
```

### contentType으로 추가 최적화

```kotlin [compose-playground]
LazyColumn {
    item(contentType = "header") {
        HeaderSection()
    }

    items(
        items = tasks,
        key = { it.id },
        contentType = { "task_item" }  // 같은 타입끼리 재활용
    ) { task ->
        TaskRow(task)
    }

    item(contentType = "footer") {
        FooterSection()
    }
}
```

---

## 5. derivedStateOf로 불필요한 리컴포지션 제한

`derivedStateOf`는 **다른 상태로부터 파생된 상태**를 만들 때 사용합니다. 원본 상태가 변해도 파생 값이 같으면 리컴포지션을 건너뜁니다.

### 기본 개념

```
원본 상태가 자주 변하지만, 파생 값은 드물게 변할 때:

  scrollOffset: 0 → 1 → 2 → 3 → ... → 99 → 100  (100번 변경)
  showButton:   false → false → ... → false → true (1번 변경)

  derivedStateOf를 쓰면 showButton이 바뀔 때만 리컴포지션!
```

### 실전 예시: 스크롤 위치에 따른 버튼 표시

```kotlin [compose-playground]
// ❌ 잘못된 예: 스크롤할 때마다 리컴포지션
@Composable
fun ScrollableList(items: List<Item>) {
    val listState = rememberLazyListState()

    // 스크롤할 때마다 showButton을 다시 계산 → 리컴포지션
    val showButton = listState.firstVisibleItemIndex > 0

    Box {
        LazyColumn(state = listState) {
            items(items) { ItemRow(it) }
        }
        if (showButton) {
            ScrollToTopButton()
        }
    }
}

// ✅ 올바른 예: derivedStateOf로 변환점에서만 리컴포지션
@Composable
fun ScrollableList(items: List<Item>) {
    val listState = rememberLazyListState()

    // showButton 값이 false → true 또는 true → false로 바뀔 때만 리컴포지션
    val showButton by remember {
        derivedStateOf { listState.firstVisibleItemIndex > 0 }
    }

    Box {
        LazyColumn(state = listState) {
            items(items) { ItemRow(it) }
        }
        if (showButton) {
            ScrollToTopButton()
        }
    }
}
```

### 또 다른 예시: 검색 필터링

```kotlin [compose-playground]
@Composable
fun FilteredList(
    items: List<Item>,
    searchQuery: String
) {
    // searchQuery가 바뀔 때마다 필터링하지만,
    // 결과 리스트가 같으면 리컴포지션하지 않음
    val hasResults by remember(items, searchQuery) {
        derivedStateOf {
            if (searchQuery.isBlank()) true
            else items.any { it.name.contains(searchQuery, ignoreCase = true) }
        }
    }

    if (!hasResults) {
        EmptySearchResult(query = searchQuery)
    }
}
```

### derivedStateOf를 사용해야 하는 경우

```
사용해야 하는 경우:
  ✓ 상태가 자주 변하지만, 파생 값은 드물게 변할 때
  ✓ 스크롤 위치 → 버튼 표시 여부
  ✓ 텍스트 입력 → 유효성 상태 (유효/무효)
  ✓ 리스트 크기 → 비어있음 여부

사용하지 않아도 되는 경우:
  ✗ 상태와 파생 값이 1:1로 대응할 때
  ✗ 단순한 변환 (remember로 충분)
```

---

## 6. 상태 읽기 연기 (람다 기반 수정자)

**상태를 가능한 늦게 읽으면** Compose가 더 효율적으로 업데이트할 수 있습니다.

### 값 기반 vs 람다 기반 Modifier

```kotlin [compose-playground]
// ❌ 값 기반: Composition 단계에서 상태 읽기
@Composable
fun AnimatedBox(offsetY: Float) {
    Box(
        modifier = Modifier
            .offset(y = offsetY.dp)  // offsetY를 읽는 순간 = Composition
            .background(Color.Red)
            .size(100.dp)
    )
    // offsetY가 바뀔 때마다: Composition → Layout → Drawing (3단계 모두)
}

// ✅ 람다 기반: Layout 단계에서 상태 읽기
@Composable
fun AnimatedBox(offsetY: () -> Float) {
    Box(
        modifier = Modifier
            .offset { IntOffset(0, offsetY().toInt()) }  // Layout에서 읽음
            .background(Color.Red)
            .size(100.dp)
    )
    // offsetY가 바뀔 때마다: Layout → Drawing (2단계만)
}
```

### Modifier.graphicsLayer로 Drawing 단계 최적화

```kotlin [compose-playground]
// ✅✅ Drawing 단계에서만 업데이트
@Composable
fun FadingBox(alpha: () -> Float) {
    Box(
        modifier = Modifier
            .size(100.dp)
            .graphicsLayer {
                this.alpha = alpha()  // Drawing 단계에서 읽음
            }
            .background(Color.Blue)
    )
    // alpha가 바뀔 때마다: Drawing만 실행 (가장 효율적!)
}

// 활용: 스크롤에 따른 배경 투명도 변경
@Composable
fun ScrollHeader(scrollState: ScrollState) {
    TopAppBar(
        title = { Text("제목") },
        modifier = Modifier.graphicsLayer {
            // scrollState 읽기를 Drawing 단계로 연기
            alpha = 1f - (scrollState.value / 600f).coerceIn(0f, 1f)
        }
    )
}
```

### 자주 사용하는 람다 기반 Modifier

| 값 기반 (Composition) | 람다 기반 (Layout/Drawing) |
|-----------------------|---------------------------|
| `Modifier.offset(x, y)` | `Modifier.offset { IntOffset(x, y) }` |
| `Modifier.padding(p)` | `Modifier.padding { PaddingValues(p) }` |
| `Modifier.alpha(a)` | `Modifier.graphicsLayer { alpha = a }` |
| `Modifier.rotate(d)` | `Modifier.graphicsLayer { rotationZ = d }` |
| `Modifier.scale(s)` | `Modifier.graphicsLayer { scaleX = s; scaleY = s }` |

---

## 7. 안정성(Stability): @Stable, @Immutable

Compose 컴파일러는 **안정적(Stable)인 매개변수**를 가진 컴포저블을 건너뛸 수(Skip) 있습니다.

### 안정성이란?

```
안정적(Stable)인 타입:
  → 값이 같으면 equals()가 true를 반환
  → 값이 바뀌면 Compose에 알림 (State 통해)
  → 공개 프로퍼티도 모두 안정적

안정적인 타입 예시:
  ✓ 기본 타입: Int, String, Float, Boolean
  ✓ 함수 타입: () -> Unit, (String) -> Unit
  ✓ MutableState<T>
  ✓ @Stable 또는 @Immutable이 붙은 클래스

불안정한(Unstable) 타입 예시:
  ✗ List<T>, Set<T>, Map<K, V> (인터페이스라서)
  ✗ 외부 모듈의 클래스 (Compose 컴파일러가 분석 불가)
  ✗ var 프로퍼티를 가진 클래스
```

### @Immutable

객체가 생성된 후 **절대 변경되지 않음**을 선언합니다.

```kotlin [kotlin-playground]
fun main() {
//sampleStart
// List<T>를 프로퍼티로 가져서 기본적으로 불안정
data class CartState(
    val items: List<CartItem>,
    val totalPrice: Long
)

// @Immutable로 안정성 보장
@Immutable
data class CartState(
    val items: List<CartItem>,  // 이제 안정적으로 취급
    val totalPrice: Long
)
//sampleEnd
}
```

### @Stable

객체가 **변경될 수 있지만, 변경 시 Compose에 알림**을 선언합니다.

```kotlin [kotlin-playground]
fun main() {
//sampleStart
@Stable
class AnimationConfig(
    val duration: Int,
    val easing: Easing
)

// @Stable은 아래 계약을 지키겠다는 약속:
// 1. 같은 입력 → 같은 equals() 결과
// 2. 프로퍼티가 바뀌면 Compose에 통지됨
// 3. 모든 공개 프로퍼티도 안정적
//sampleEnd
}
```

### @Immutable vs @Stable

| 어노테이션 | 의미 | 사용 시점 |
|-----------|------|-----------|
| `@Immutable` | 생성 후 절대 변하지 않음 | data class, 값 객체 |
| `@Stable` | 변할 수 있지만 Compose에 알림 | 설정 객체, 변경 추적 필요한 객체 |

---

## 8. 안정성 문제 진단과 해결

### Compose Compiler Report로 진단

```bash
# 보고서 생성
./gradlew assembleRelease

# classes.txt에서 확인
# unstable로 표시된 클래스가 문제!
```

```
// classes.txt 출력 예시
unstable class TodoState {
  unstable val items: List<Todo>    ← 원인!
  stable val isLoading: Boolean
  stable val error: String?
}
```

### 해결 방법 1: @Immutable 사용

```kotlin [kotlin-playground]
fun main() {
//sampleStart
// 문제: List<Todo>가 불안정
data class TodoState(
    val items: List<Todo>,
    val isLoading: Boolean
)

// 해결: @Immutable 어노테이션 추가
@Immutable
data class TodoState(
    val items: List<Todo>,
    val isLoading: Boolean
)
//sampleEnd
}
```

### 해결 방법 2: kotlinx.collections.immutable 사용

```kotlin
// build.gradle.kts
dependencies {
    implementation("org.jetbrains.kotlinx:kotlinx-collections-immutable:0.3.8")
}
```

```kotlin [kotlin-playground]
fun main() {
//sampleStart
import kotlinx.collections.immutable.ImmutableList
import kotlinx.collections.immutable.persistentListOf
import kotlinx.collections.immutable.toImmutableList

// ImmutableList는 Compose 컴파일러가 안정적으로 인식
data class TodoState(
    val items: ImmutableList<Todo> = persistentListOf(),
    val isLoading: Boolean = false
)

// 사용
val state = TodoState(
    items = todos.toImmutableList()
)
//sampleEnd
}
```

### 해결 방법 3: 안정성 설정 파일

```
// stability_config.txt
// 특정 클래스를 안정적으로 간주하도록 설정
java.time.LocalDate
java.time.LocalDateTime
kotlinx.datetime.Instant
com.example.app.model.*
```

```kotlin
// build.gradle.kts
composeCompiler {
    stabilityConfigurationFile =
        rootProject.layout.projectDirectory.file("stability_config.txt")
}
```

---

## 9. Strong Skipping Mode (기본 활성화)

> **2026 업데이트**: Strong Skipping Mode는 Kotlin 2.0+ / Compose Compiler 2.0+ 이후 **기본(DEFAULT)으로 활성화**되어 있습니다. 별도의 opt-in이 필요 없으며, 모든 컴포저블이 자동으로 혜택을 받습니다.

Strong Skipping Mode는 Compose 컴파일러의 **핵심 최적화 기능**입니다. 불안정한 매개변수가 있어도 참조가 같으면 리컴포지션을 건너뛸 수 있게 합니다.

### Strong Skipping 동작 방식

```
Strong Skipping (기본 활성화):
  - 안정적 매개변수: equals()로 비교 (기존과 동일)
  - 불안정한 매개변수: 참조 동등성(===)으로 비교
  - 참조가 같으면 Skip!

이전 동작 (Strong Skipping 이전):
  - 모든 매개변수가 안정적이어야 Skip 가능
  - 하나라도 불안정하면 항상 리컴포지션
```

### Strong Skipping의 효과

```kotlin [compose-playground]
// List<T>는 불안정한 타입이지만, Strong Skipping 덕분에
// 참조가 같으면 (같은 리스트 객체) 리컴포지션을 건너뜀!
@Composable
fun UserList(users: List<User>) {  // List는 불안정하지만 === 비교로 Skip 가능
    LazyColumn {
        items(users) { UserCard(it) }
    }
}

// ViewModel에서 같은 리스트를 다시 emit해도 Skip됨
```

### 람다 자동 remember

Strong Skipping Mode에서는 **컴포저블에 전달되는 람다도 자동으로 remember**됩니다.

```kotlin [compose-playground]
// Strong Skipping 덕분에 람다가 자동으로 remember됨
@Composable
fun Parent() {
    var count by remember { mutableIntStateOf(0) }

    // 캡처하는 값(count)이 같으면 같은 람다 인스턴스 재사용
    // 별도의 remember { } 래핑이 필요 없음!
    Child(
        onClick = { count++ }
    )
}
```

### Compose Compiler 설정 (Kotlin 2.0+ 통합)

Compose Compiler는 이제 Kotlin 플러그인에 통합되었습니다. `composeOptions { kotlinCompilerExtensionVersion }` 설정은 더 이상 필요 없습니다.

```kotlin
// build.gradle.kts
plugins {
    id("org.jetbrains.kotlin.plugin.compose") version "2.3.10"
}

// Compose Compiler 리포트 생성 및 안정성 설정
composeCompiler {
    reportsDestination = layout.buildDirectory.dir("compose_compiler")
    stabilityConfigurationFile = rootProject.layout.projectDirectory.file("stability_config.conf")
}
// Strong Skipping은 기본 활성화 — 별도 설정 불필요!
```

---

## 10. 기준 프로필(Baseline Profiles)로 앱 시작 속도 향상

Baseline Profiles는 **앱의 핵심 코드를 미리 AOT(Ahead-Of-Time) 컴파일**하여 시작 속도를 향상시킵니다.

### Baseline Profiles가 필요한 이유

```
┌─────────────────────────────────────────────────────┐
│  앱 시작 과정                                        │
│                                                     │
│  Baseline Profile 없이:                              │
│  ┌────────────────────────────────────┐              │
│  │ APK 설치 → DEX → JIT 컴파일(느림)  │              │
│  │            실행 중 자주 쓰는 코드를  │              │
│  │            하나씩 컴파일            │              │
│  └────────────────────────────────────┘              │
│                                                     │
│  Baseline Profile 있으면:                            │
│  ┌────────────────────────────────────┐              │
│  │ APK 설치 → Profile 기반 AOT 컴파일  │              │
│  │         → 핵심 코드가 이미 네이티브! │              │
│  │         → 시작부터 빠름              │              │
│  └────────────────────────────────────┘              │
│                                                     │
│  결과: 앱 시작 시간 15~40% 향상 (Google 공식 수치)     │
└─────────────────────────────────────────────────────┘
```

### 설정 방법

```kotlin [compose-playground]
// 1. build.gradle.kts (프로젝트 수준)
plugins {
    id("com.android.test") version "8.7.0" apply false
    id("androidx.baselineprofile") version "1.3.3" apply false
}

// 2. 새 모듈 생성: baselineprofile
// build.gradle.kts (:baselineprofile)
plugins {
    id("com.android.test")
    id("androidx.baselineprofile")
}

android {
    namespace = "com.example.baselineprofile"
    targetProjectPath = ":app"
}

baselineProfile {
    managedDevices += "pixel6Api34"
}

// 3. app 모듈에 플러그인 추가
// build.gradle.kts (:app)
plugins {
    id("androidx.baselineprofile")
}

dependencies {
    baselineProfile(project(":baselineprofile"))
}
```

### 프로필 생성기 작성

```kotlin [compose-playground]
// baselineprofile/src/main/java/.../BaselineProfileGenerator.kt
@RunWith(AndroidJUnit4::class)
class BaselineProfileGenerator {

    @get:Rule
    val rule = BaselineProfileRule()

    @Test
    fun generateBaselineProfile() {
        rule.collect(
            packageName = "com.example.myapp"
        ) {
            // 앱의 핵심 사용자 흐름을 자동화
            pressHome()
            startActivityAndWait()

            // 메인 화면 로딩 대기
            device.wait(Until.hasObject(By.text("홈")), 5_000)

            // 스크롤
            device.findObject(By.scrollable(true))
                .scroll(Direction.DOWN, 1f)

            // 상세 화면 이동
            device.findObject(By.text("첫 번째 항목")).click()
            device.wait(Until.hasObject(By.text("상세")), 3_000)
        }
    }
}
```

### 프로필 생성 및 적용

```bash
# 프로필 생성
./gradlew :app:generateBaselineProfile

# 생성된 파일 위치
# app/src/main/baseline-prof.txt
```

---

## 11. 역방향 쓰기(Backward Write) 피하기

역방향 쓰기란 **이미 읽힌 상태를 같은 컴포지션 내에서 다시 쓰는 것**입니다. 이는 추가 리컴포지션을 유발합니다.

### 역방향 쓰기 예시

```kotlin [compose-playground]
// ❌ 역방향 쓰기: 컴포지션 중에 상태를 읽은 후 다시 씀
@Composable
fun BadExample() {
    var count by remember { mutableIntStateOf(0) }

    Text("카운트: $count")  // count 읽기

    // 이미 count를 읽었는데, 같은 컴포지션에서 다시 씀!
    count = calculateNewCount()  // 역방향 쓰기 → 추가 리컴포지션!

    Button(onClick = { count++ }) {
        Text("증가")
    }
}
```

```
┌─────────────────────────────────────────────────────┐
│  역방향 쓰기의 문제                                    │
│                                                     │
│  컴포지션 1회차:                                     │
│    Text가 count = 0을 읽음                           │
│    count = 5로 변경 (역방향 쓰기)                      │
│    → count가 바뀌었으므로 리컴포지션 필요!              │
│                                                     │
│  컴포지션 2회차:                                     │
│    Text가 count = 5를 읽음                           │
│    count = 5로 변경 (같은 값)                          │
│    → 안정됨 (더 이상 변경 없음)                        │
│                                                     │
│  결과: 불필요한 추가 리컴포지션 1회 발생!               │
└─────────────────────────────────────────────────────┘
```

### 올바른 해결 방법

```kotlin [compose-playground]
// ✅ 해결 1: LaunchedEffect 사용 (Side Effect로 분리)
@Composable
fun GoodExample1() {
    var count by remember { mutableIntStateOf(0) }

    LaunchedEffect(Unit) {
        count = calculateNewCount()  // Side Effect에서 상태 변경
    }

    Text("카운트: $count")
    Button(onClick = { count++ }) {
        Text("증가")
    }
}

// ✅ 해결 2: 초기값을 remember에서 계산
@Composable
fun GoodExample2() {
    var count by remember { mutableIntStateOf(calculateNewCount()) }

    Text("카운트: $count")
    Button(onClick = { count++ }) {
        Text("증가")
    }
}

// ✅ 해결 3: 상태를 읽기 전에 쓰기
@Composable
fun GoodExample3(newValue: Int) {
    var count by remember { mutableIntStateOf(0) }

    // 쓰기가 읽기보다 먼저! (순방향 쓰기 → OK)
    count = newValue

    Text("카운트: $count")
}
```

---

## 12. 정리

### 최적화 기법 요약

```
┌─────────────────────────────────────────────────────┐
│           성능 최적화 체크리스트                        │
│                                                     │
│  기본:                                              │
│  □ 릴리스 빌드 + R8에서 성능 측정                     │
│  □ remember로 비용 큰 계산 캐싱                       │
│  □ LazyLayout에 안정적 key 제공                      │
│                                                     │
│  중급:                                              │
│  □ derivedStateOf로 파생 상태 최적화                  │
│  □ 람다 기반 Modifier로 상태 읽기 연기                 │
│  □ @Stable/@Immutable로 안정성 보장                   │
│                                                     │
│  고급:                                              │
│  □ Compose Compiler Report로 안정성 진단              │
│  □ Strong Skipping Mode 활용                         │
│  □ Baseline Profiles로 시작 속도 향상                 │
│  □ 역방향 쓰기 방지                                   │
└─────────────────────────────────────────────────────┘
```

### 최적화 우선순위

| 우선순위 | 기법 | 효과 |
|---------|------|------|
| 1 | 릴리스 빌드에서 측정 | 정확한 기준선 확보 |
| 2 | LazyLayout key 제공 | 리스트 성능 대폭 향상 |
| 3 | remember 캐싱 | 불필요한 재계산 방지 |
| 4 | 안정성 문제 해결 | 불필요한 리컴포지션 제거 |
| 5 | 상태 읽기 연기 | 애니메이션/스크롤 성능 |
| 6 | Baseline Profiles | 앱 시작 속도 15~40% 향상 |

### 다음 단계

성능 최적화를 이해했다면, 다음 문서에서 실전 프로젝트 설계를 배워봅니다:

- feature 기반 모듈화
- 추천 라이브러리 조합
- 테스트 전략
- 배포와 CI/CD
