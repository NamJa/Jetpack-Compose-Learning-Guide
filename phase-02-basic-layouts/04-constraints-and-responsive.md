# 제약 조건과 반응형 레이아웃

> **"좋은 앱은 어떤 화면에서든 자연스럽게 보인다."**
> Compose의 레이아웃 측정 모델을 이해하고, 다양한 화면 크기에 대응하는 반응형 UI를 만들어 봅시다.

---

## 목차

1. [Compose 레이아웃 측정 모델](#1-compose-레이아웃-측정-모델)
2. [제약 조건(Constraints) 이해하기](#2-제약-조건constraints-이해하기)
3. [제약 조건의 전파 흐름](#3-제약-조건의-전파-흐름)
4. [BoxWithConstraints](#4-boxwithconstraints)
5. [WindowSizeClass로 화면 크기 분류](#5-windowsizeclass로-화면-크기-분류)
6. [Intrinsic Measurements (내장 측정)](#6-intrinsic-measurements-내장-측정)
7. [XML View와의 비교](#7-xml-view와의-비교)
8. [실전 예제: 반응형 레이아웃](#8-실전-예제-반응형-레이아웃)
9. [실전 예제: 적응형 화면 설계](#9-실전-예제-적응형-화면-설계)
10. [정리 및 다음 단계](#10-정리-및-다음-단계)

---

## 1. Compose 레이아웃 측정 모델

### 단일 패스(Single Pass) 측정

Compose의 레이아웃 시스템은 **단일 패스(Single Pass)** 로 작동합니다. 즉, 각 자식은 **단 한 번만 측정**됩니다. 이것은 XML View 시스템과의 가장 큰 차이점 중 하나입니다.

```
XML View 시스템 (다중 패스):

부모 → 자식 측정 (1차) → 부모 계산 → 자식 재측정 (2차) → 배치
                    ↑                              │
                    └──────── 재측정 반복 ─────────┘
                    (깊게 중첩될수록 성능 저하)

Compose 시스템 (단일 패스):

부모 → 자식 측정 (1번만!) → 배치
       (재측정 불가)
```

**왜 단일 패스인가?**
- XML View에서 `RelativeLayout`이나 `ConstraintLayout`을 깊게 중첩하면, 측정이 기하급수적으로 늘어나 성능이 떨어집니다.
- Compose는 **자식을 한 번만 측정**하도록 강제하여 이 문제를 근본적으로 해결합니다.

### 레이아웃의 세 단계

Compose의 레이아웃 처리는 세 단계로 이루어집니다:

```
┌─────────────────────────────────────────────────────────┐
│ 1단계: 측정 (Measure)                                    │
│    부모가 자식에게 제약 조건을 전달                         │
│    자식이 자신의 크기를 결정하여 반환                       │
│                                                         │
│ 2단계: 크기 결정 (Size)                                   │
│    부모가 모든 자식의 측정 결과를 바탕으로                   │
│    자신의 크기를 결정                                      │
│                                                         │
│ 3단계: 배치 (Place)                                      │
│    부모가 자식들의 위치(x, y 좌표)를 결정                   │
└─────────────────────────────────────────────────────────┘
```

```kotlin
// 이 과정은 내부적으로 자동 수행됩니다.
// 개발자는 Column, Row, Box 등을 사용하면 됩니다.

Column(modifier = Modifier.fillMaxSize()) {   // 1. 부모(Column)가 화면 전체 제약을 받음
    Text("첫 번째")                            // 2. Text가 제약 내에서 측정됨
    Text("두 번째")                            // 3. Text가 제약 내에서 측정됨
    // Column이 자식들의 크기를 합산하여 자신의 크기를 결정하고
    // 자식들을 세로로 배치
}
```

---

## 2. 제약 조건(Constraints) 이해하기

`Constraints`는 부모가 자식에게 전달하는 **크기 허용 범위**입니다. 네 개의 값으로 구성됩니다:

```kotlin
data class Constraints(
    val minWidth: Int,    // 최소 너비 (px)
    val maxWidth: Int,    // 최대 너비 (px)
    val minHeight: Int,   // 최소 높이 (px)
    val maxHeight: Int    // 최대 높이 (px)
)
```

### 제약 조건의 종류

```
1. 제한 있음 (Bounded):
   minWidth ≤ 실제 크기 ≤ maxWidth
   ┌─────────────────────────────────┐
   │   min          max              │
   │    ├────────────┤               │
   │    [  이 범위 안에서 크기 결정  ]  │
   └─────────────────────────────────┘

2. 제한 없음 (Unbounded):
   maxWidth = Infinity
   ┌─────────────────────────────────┐
   │   min                  ∞        │
   │    ├───────────────────→        │
   │    [  원하는 만큼 커질 수 있음  ]  │
   └─────────────────────────────────┘
   예: 스크롤 가능한 영역의 자식

3. 정확한 크기 (Exact):
   minWidth = maxWidth (선택의 여지 없음)
   ┌─────────────────────────────────┐
   │           min=max               │
   │              ┃                  │
   │    [정확히 이 크기만 가능]       │
   └─────────────────────────────────┘
   예: fillMaxWidth()가 적용된 경우
```

### Modifier가 제약 조건에 미치는 영향

```kotlin
// 예시: 화면 너비가 400dp인 경우

Box(modifier = Modifier.fillMaxWidth()) {           // Constraints(min=400, max=400, ...)
    Box(modifier = Modifier.padding(16.dp)) {       // Constraints(min=0, max=368, ...)  → 양쪽 16dp 빼기
        Box(modifier = Modifier.fillMaxWidth()) {   // Constraints(min=368, max=368, ...)
            Text("텍스트")                           // 368dp 내에서 측정
        }
    }
}
```

```
제약 조건 전파 과정:

화면 (400dp)
┌──────────────────────────────────────────┐
│ fillMaxWidth → Constraints(400, 400)     │
│ ┌──────────────────────────────────────┐ │
│ │ padding(16dp) → Constraints(0, 368)  │ │
│ │ ┌──────────────────────────────────┐ │ │
│ │ │ fillMaxWidth → Constraints(368)  │ │ │
│ │ │ ┌──────────────────────────────┐ │ │ │
│ │ │ │ Text("텍스트") → 368dp 안에서 │ │ │ │
│ │ │ └──────────────────────────────┘ │ │ │
│ │ └──────────────────────────────────┘ │ │
│ └──────────────────────────────────────┘ │
└──────────────────────────────────────────┘
    ↑16dp↑                            ↑16dp↑
```

---

## 3. 제약 조건의 전파 흐름

### 위에서 아래로: 제약 조건 전달

```
부모 (화면: 400 x 800)
│
├── Constraints(minW=0, maxW=400, minH=0, maxH=800)
│
├── Column(fillMaxSize)
│   │   → 자체 Constraints: (400, 400, 800, 800) ← 정확한 크기
│   │
│   ├── Text("첫 번째")
│   │   → Constraints: (0, 400, 0, 800) ← Column이 전달
│   │   → 측정 결과: 80 x 20
│   │
│   ├── Text("두 번째")
│   │   → Constraints: (0, 400, 0, 780) ← 남은 높이
│   │   → 측정 결과: 80 x 20
│   │
│   └── Box(fillMaxSize)
│       → Constraints: (0, 400, 0, 760) ← 남은 높이
│       → 측정 결과: 400 x 760
```

### 아래에서 위로: 크기 보고

```
부모 (화면)
│
└── Column (자식들의 크기 합산 → 자기 크기 결정)
    │   ← 너비: max(80, 80, 400) = 400
    │   ← 높이: 20 + 20 + 760 = 800
    │
    ├── Text → "나는 80 x 20이야"
    ├── Text → "나는 80 x 20이야"
    └── Box  → "나는 400 x 760이야"
```

### size와 requiredSize의 제약 조건 차이

```kotlin
// size(200.dp): 부모가 허용하는 범위 내에서 200dp
// 부모가 max=100dp이면 → 100dp (부모 제약 존중)
Box(modifier = Modifier.size(100.dp)) {
    Box(modifier = Modifier.size(200.dp).background(Color.Red))
    // 결과: 100dp (부모 제약에 의해 잘림)
}

// requiredSize(200.dp): 부모 제약을 무시하고 강제로 200dp
Box(modifier = Modifier.size(100.dp)) {
    Box(modifier = Modifier.requiredSize(200.dp).background(Color.Blue))
    // 결과: 200dp (부모 밖으로 넘침)
}
```

---

## 4. BoxWithConstraints

`BoxWithConstraints`는 **현재 제약 조건을 읽을 수 있는 Box**입니다. 이를 통해 사용 가능한 크기에 따라 **조건부로 다른 레이아웃**을 표시할 수 있습니다.

### 기본 사용법

```kotlin
@Composable
fun AdaptiveLayout() {
    BoxWithConstraints(
        modifier = Modifier.fillMaxSize()
    ) {
        // BoxWithConstraintsScope 내에서 제약 조건에 접근 가능
        // this.maxWidth, this.maxHeight, this.minWidth, this.minHeight

        if (maxWidth < 600.dp) {
            // 좁은 화면: 세로 레이아웃
            NarrowLayout()
        } else {
            // 넓은 화면: 가로 레이아웃
            WideLayout()
        }
    }
}
```

### BoxWithConstraintsScope에서 사용 가능한 값

| 속성 | 타입 | 설명 |
|------|------|------|
| `maxWidth` | `Dp` | 최대 허용 너비 |
| `maxHeight` | `Dp` | 최대 허용 높이 |
| `minWidth` | `Dp` | 최소 요구 너비 |
| `minHeight` | `Dp` | 최소 요구 높이 |
| `constraints` | `Constraints` | 원시 Constraints 객체 (px 단위) |

### 화면 크기에 따른 분기 예제

```kotlin
@Composable
fun ResponsiveContent() {
    BoxWithConstraints(modifier = Modifier.fillMaxSize()) {
        when {
            maxWidth < 360.dp -> {
                // 매우 작은 화면 (작은 폰)
                CompactContent()
            }
            maxWidth < 600.dp -> {
                // 일반 폰
                PhoneContent()
            }
            maxWidth < 840.dp -> {
                // 작은 태블릿 / 폴더블
                TabletContent()
            }
            else -> {
                // 큰 태블릿 / 데스크탑
                LargeScreenContent()
            }
        }
    }
}
```

```
화면 크기별 레이아웃:

< 360dp (소형 폰):          360~600dp (일반 폰):
┌──────────┐                ┌───────────────┐
│ [컴팩트]  │                │   [일반 폰]    │
│ [레이아웃]│                │   [레이아웃]   │
│          │                │              │
└──────────┘                └───────────────┘

600~840dp (태블릿):          > 840dp (대형 화면):
┌─────────────────────┐     ┌─────────────────────────────┐
│ [사이드]│  [메인]    │     │ [사이드]│     [메인]         │
│ [패널] │  [콘텐츠]  │     │ [패널] │     [콘텐츠]       │
│        │            │     │        │                    │
└─────────────────────┘     └─────────────────────────────┘
```

### BoxWithConstraints 주의사항

```kotlin
@Composable
fun BoxWithConstraintsWarning() {
    // 주의: BoxWithConstraints는 서브컴포지션을 생성합니다.
    // 이는 일반 Box보다 비용이 더 높습니다.
    // 제약 조건을 읽을 필요가 없다면 일반 Box를 사용하세요.

    // 좋은 예: 제약 조건에 따라 다른 레이아웃을 표시할 때
    BoxWithConstraints {
        if (maxWidth > 600.dp) {
            TwoColumnLayout()
        } else {
            SingleColumnLayout()
        }
    }

    // 나쁜 예: 제약 조건을 사용하지 않으면서 BoxWithConstraints를 쓰는 경우
    // → 일반 Box를 사용하세요
    BoxWithConstraints {  // 불필요!
        Text("제약 조건을 쓰지 않음")
    }
}
```

---

## 5. WindowSizeClass로 화면 크기 분류

`WindowSizeClass`는 화면 크기를 **Compact, Medium, Expanded** 세 가지로 분류하는 공식 API입니다. Google에서 권장하는 반응형 디자인 기준입니다.

### WindowSizeClass 분류 기준

```
너비 기준:
├── Compact (< 600dp) ──── 일반 폰 세로 모드
├── Medium  (600~840dp) ── 폰 가로 모드, 작은 태블릿
└── Expanded (> 840dp) ── 태블릿, 데스크탑

높이 기준:
├── Compact (< 480dp) ──── 폰 가로 모드
├── Medium  (480~900dp) ── 일반 폰 세로 모드
└── Expanded (> 900dp) ── 태블릿 세로 모드

        Compact        Medium         Expanded
Width   < 600dp        600~840dp      > 840dp
┌──────────────┬─────────────────┬──────────────────┐
│              │                 │                  │
│   ┌──────┐   │  ┌──────────┐   │  ┌────┬────────┐  │
│   │      │   │  │          │   │  │    │        │  │
│   │ 폰   │   │  │ 폴더블   │   │  │사이│  메인  │  │
│   │ 세로  │   │  │ /태블릿  │   │  │드  │        │  │
│   │      │   │  │          │   │  │    │        │  │
│   └──────┘   │  └──────────┘   │  └────┴────────┘  │
│              │                 │                  │
└──────────────┴─────────────────┴──────────────────┘
```

### 설정 방법

```kotlin
// build.gradle.kts (app 수준)
// Compose BOM 2026.02.01 기준
dependencies {
    implementation(platform("androidx.compose:compose-bom:2026.02.01"))
    implementation("androidx.compose.material3.adaptive:adaptive")
    implementation("androidx.compose.material3.adaptive:adaptive-layout")
    implementation("androidx.compose.material3.adaptive:adaptive-navigation")
}
```

### Activity에서 WindowSizeClass 사용 (최신 breakpoint 기반 API)

기존의 `WindowWidthSizeClass.Compact` / `Medium` / `Expanded` 열거형 방식 대신, 최신 API는 **breakpoint 기반**으로 화면 크기를 판별합니다. `currentWindowAdaptiveInfo()`를 사용하여 현재 창의 적응형 정보를 가져올 수 있습니다.

```kotlin
import androidx.compose.material3.adaptive.currentWindowAdaptiveInfo
import androidx.compose.material3.adaptive.WindowAdaptiveInfo
import androidx.compose.material3.adaptive.navigationsuite.NavigationSuiteScaffold
import androidx.compose.material3.windowsizeclass.WindowSizeClass
import androidx.compose.material3.windowsizeclass.WindowSizeClass.Companion.WIDTH_DP_EXPANDED_LOWER_BOUND
import androidx.compose.material3.windowsizeclass.WindowSizeClass.Companion.WIDTH_DP_MEDIUM_LOWER_BOUND

class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContent {
            MyApp()
        }
    }
}

@Composable
fun MyApp() {
    // currentWindowAdaptiveInfo()로 현재 창의 적응형 정보를 가져옴
    val adaptiveInfo = currentWindowAdaptiveInfo()
    val windowSizeClass = adaptiveInfo.windowSizeClass

    // breakpoint 기반 API로 화면 크기 판별
    when {
        windowSizeClass.isWidthAtLeastBreakpoint(WIDTH_DP_EXPANDED_LOWER_BOUND) -> {
            // 태블릿: 리스트-디테일 확장형 (너비 >= 840dp)
            ExpandedLayout()
        }
        windowSizeClass.isWidthAtLeastBreakpoint(WIDTH_DP_MEDIUM_LOWER_BOUND) -> {
            // 중간: 리스트-디테일 축약형 (너비 >= 600dp)
            MediumLayout()
        }
        else -> {
            // 폰: 단일 패널 레이아웃 (너비 < 600dp)
            PhoneLayout()
        }
    }
}
```

### WindowSizeClass 활용 패턴 (NavigationSuiteScaffold)

Material3 adaptive 라이브러리에서 제공하는 `NavigationSuiteScaffold`를 사용하면, 화면 크기에 따라 **하단 바 / 레일 / 드로어** 네비게이션을 자동으로 전환할 수 있습니다. 기존처럼 수동으로 `when` 분기를 작성할 필요가 없습니다.

```kotlin
@Composable
fun AdaptiveNavigationLayout(
    content: @Composable () -> Unit
) {
    // NavigationSuiteScaffold는 currentWindowAdaptiveInfo()를 내부적으로 사용하여
    // 화면 크기에 따라 적절한 네비게이션 UI를 자동 선택합니다.
    // - Compact: 하단 네비게이션 바
    // - Medium: 네비게이션 레일
    // - Expanded: 네비게이션 드로어
    var selectedItem by remember { mutableIntStateOf(0) }
    val navItems = listOf("홈", "검색", "알림", "프로필")
    val navIcons = listOf(
        Icons.Default.Home, Icons.Default.Search,
        Icons.Default.Notifications, Icons.Default.Person
    )

    NavigationSuiteScaffold(
        navigationSuiteItems = {
            navItems.forEachIndexed { index, label ->
                item(
                    selected = selectedItem == index,
                    onClick = { selectedItem = index },
                    icon = { Icon(navIcons[index], contentDescription = label) },
                    label = { Text(label) }
                )
            }
        }
    ) {
        content()
    }
}

// 기존 방식: 수동 분기 (여전히 사용 가능)
@Composable
fun ManualAdaptiveNavigationLayout(
    content: @Composable () -> Unit
) {
    val adaptiveInfo = currentWindowAdaptiveInfo()
    val windowSizeClass = adaptiveInfo.windowSizeClass

    when {
        windowSizeClass.isWidthAtLeastBreakpoint(WIDTH_DP_EXPANDED_LOWER_BOUND) -> {
            // 넓음: 네비게이션 드로어
            PermanentNavigationDrawer(
                drawerContent = { NavigationDrawerContent() }
            ) {
                content()
            }
        }
        windowSizeClass.isWidthAtLeastBreakpoint(WIDTH_DP_MEDIUM_LOWER_BOUND) -> {
            // 중간: 네비게이션 레일
            Row {
                NavigationRail()
                Box(modifier = Modifier.weight(1f)) {
                    content()
                }
            }
        }
        else -> {
            // 폰: 하단 네비게이션 바
            Scaffold(
                bottomBar = { BottomNavigationBar() }
            ) { padding ->
                Box(modifier = Modifier.padding(padding)) {
                    content()
                }
            }
        }
    }
}
```

```
NavigationSuiteScaffold가 자동으로 전환하는 네비게이션 UI:

Compact (폰):           Medium (중간):          Expanded (태블릿):
┌──────────────┐       ┌──┬───────────┐       ┌─────────┬────────────┐
│              │       │  │           │       │         │            │
│   콘텐츠     │       │레│  콘텐츠   │       │ 네비    │            │
│              │       │일│           │       │ 게이션  │  콘텐츠    │
│              │       │  │           │       │ 드로어  │            │
│              │       │  │           │       │         │            │
├──────────────┤       │  │           │       │         │            │
│ 하단 네비바   │       └──┴───────────┘       └─────────┴────────────┘
└──────────────┘
```

---

## 6. Intrinsic Measurements (내장 측정)

### 문제 상황

Compose의 단일 패스 규칙 때문에, **자식을 먼저 측정하고 그 결과로 다른 자식의 크기를 결정**하는 것이 불가능합니다. 하지만 실제로는 이런 요구가 자주 있습니다.

**예시: 두 텍스트 사이에 구분선을 넣고, 구분선 높이를 더 높은 텍스트에 맞추고 싶은 경우**

```
원하는 결과:                    단일 패스의 문제:
┌───────┬──┬──────────┐       구분선의 높이를 알려면
│ 짧은   │ ││  긴 텍스트 │       텍스트 높이를 먼저 알아야 하는데,
│ 텍스트  │ ││  여러 줄   │       아직 측정하지 않았으므로 알 수 없음!
│        │ ││  가능     │
└───────┴──┴──────────┘
            ↑ 구분선
```

### Intrinsic으로 해결

`IntrinsicSize`를 사용하면 **자식을 실제로 측정하지 않고도** 자식이 "이 정도 크기가 필요할 것"이라는 정보를 미리 얻을 수 있습니다.

```kotlin
@Composable
fun IntrinsicExample() {
    Row(
        modifier = Modifier
            .height(IntrinsicSize.Min)  // 자식 중 최소 고유 높이에 맞춤
            .fillMaxWidth()
            .padding(16.dp)
    ) {
        Text(
            text = "짧은 텍스트",
            modifier = Modifier.weight(1f)
        )
        Divider(
            modifier = Modifier
                .fillMaxHeight()    // Row의 높이(=IntrinsicSize.Min)에 맞춤
                .width(1.dp),
            color = Color.Gray
        )
        Text(
            text = "긴 텍스트가 여러 줄에 걸쳐서 표시됩니다. 이 텍스트가 높이를 결정합니다.",
            modifier = Modifier
                .weight(1f)
                .padding(start = 8.dp)
        )
    }
}
```

```
IntrinsicSize.Min 동작 과정:

1단계: Row가 자식들에게 "최소한 얼마나 높아야 해?" 물어봄
  - Text1: "한 줄이면 20dp"
  - Divider: "0dp"
  - Text2: "세 줄이면 60dp"
  → Row 높이 = max(20, 0, 60) = 60dp

2단계: Row 높이 60dp로 확정, 이제 실제 측정
  - Text1: 높이 60dp 중 20dp만 사용
  - Divider: fillMaxHeight → 60dp
  - Text2: 60dp 사용

결과:
┌──────────┬─┬──────────────────┐
│ 짧은     │ │ 긴 텍스트가 여러  │
│ 텍스트   │ │ 줄에 걸쳐서      │
│          │ │ 표시됩니다.      │
└──────────┴─┴──────────────────┘
             ↑ Divider (60dp)
```

### IntrinsicSize.Min vs IntrinsicSize.Max

| IntrinsicSize | 의미 | 사용 시나리오 |
|---------------|------|-------------|
| `Min` | 콘텐츠를 올바르게 표시하기 위한 **최소** 크기 | 대부분의 경우 사용 |
| `Max` | 콘텐츠가 차지할 수 있는 **최대** 크기 | 특수한 경우 |

```kotlin
// width(IntrinsicSize.Min) 예제: 자식 중 가장 좁은 고유 너비에 맞춤
Column(modifier = Modifier.width(IntrinsicSize.Min)) {
    Text("Short")           // 이 너비에 맞춰짐
    Divider()               // Short 텍스트 너비와 동일
    Text("A longer text")   // 줄바꿈될 수 있음
}

// width(IntrinsicSize.Max) 예제: 자식 중 가장 넓은 고유 너비에 맞춤
Column(modifier = Modifier.width(IntrinsicSize.Max)) {
    Text("Short")           // 넓어진 공간에서 표시
    Divider()               // "A longer text" 너비와 동일
    Text("A longer text")   // 이 너비에 맞춰짐
}
```

```
IntrinsicSize.Min:          IntrinsicSize.Max:
┌──────────┐                ┌──────────────────┐
│ Short    │                │ Short             │
├──────────┤                ├──────────────────┤
│ A longer │                │ A longer text     │
│ text     │                │                   │
└──────────┘                └──────────────────┘
  ↑ Short 기준               ↑ "A longer text" 기준
```

---

## 7. XML View와의 비교

### 레이아웃 측정 모델 비교

| 항목 | XML View | Compose |
|------|----------|---------|
| 측정 방식 | 다중 패스 (여러 번 측정 가능) | **단일 패스** (한 번만 측정) |
| 중첩 성능 | 깊어질수록 O(2^n) 측정 | 깊어져도 O(n) 측정 |
| 반응형 대응 | `ConstraintLayout`, 리소스 한정자 | `BoxWithConstraints`, `WindowSizeClass` |
| 화면 크기 분기 | `res/layout-sw600dp/` 등 | 코드 내 조건문 |
| Intrinsic | `android:layout_width="wrap_content"` 시 자동 | `IntrinsicSize.Min`/`Max` 명시 |

### 반응형 레이아웃 접근법 비교

**XML View 방식: 리소스 한정자**

```
res/
├── layout/
│   └── activity_main.xml          ← 기본 (폰)
├── layout-sw600dp/
│   └── activity_main.xml          ← 태블릿
├── layout-land/
│   └── activity_main.xml          ← 가로 모드
└── layout-sw840dp/
    └── activity_main.xml          ← 대형 태블릿
```

**Compose 방식: 코드 내 조건 분기 (breakpoint 기반 API)**

```kotlin
@Composable
fun MainScreen() {
    val windowSizeClass = currentWindowAdaptiveInfo().windowSizeClass

    when {
        windowSizeClass.isWidthAtLeastBreakpoint(WIDTH_DP_EXPANDED_LOWER_BOUND) -> DesktopLayout()
        windowSizeClass.isWidthAtLeastBreakpoint(WIDTH_DP_MEDIUM_LOWER_BOUND) -> TabletLayout()
        else -> PhoneLayout()
    }
}
```

| 비교 항목 | XML View (리소스 한정자) | Compose (코드 분기) |
|-----------|------------------------|--------------------|
| 파일 수 | 화면 크기별 별도 XML 파일 필요 | **하나의 Composable 파일** |
| 유지보수 | 여러 XML 파일 동기화 필요 | 조건문 하나로 관리 |
| 유연성 | 미리 정의된 한정자만 사용 | **어떤 조건이든 자유롭게** |
| 미리보기 | 각 XML 별도 미리보기 | `@Preview`로 여러 크기 미리보기 |
| 상태 공유 | Fragment/Activity 간 통신 필요 | **같은 함수 내에서 자연스럽게** |

---

## 8. 실전 예제: 반응형 레이아웃

### 예제 1: BoxWithConstraints로 적응형 카드 그리드

```kotlin
@Composable
fun AdaptiveCardGrid(
    items: List<String>,
    modifier: Modifier = Modifier
) {
    BoxWithConstraints(modifier = modifier.fillMaxWidth()) {
        // 화면 너비에 따라 열 수 결정
        val columns = when {
            maxWidth < 400.dp -> 1
            maxWidth < 700.dp -> 2
            maxWidth < 1000.dp -> 3
            else -> 4
        }

        // 카드 너비 계산
        val cardWidth = (maxWidth - (16.dp * (columns + 1))) / columns

        Column(
            modifier = Modifier.padding(16.dp),
            verticalArrangement = Arrangement.spacedBy(16.dp)
        ) {
            items.chunked(columns).forEach { rowItems ->
                Row(
                    horizontalArrangement = Arrangement.spacedBy(16.dp)
                ) {
                    rowItems.forEach { item ->
                        Card(
                            modifier = Modifier.width(cardWidth)
                        ) {
                            Text(
                                text = item,
                                modifier = Modifier.padding(16.dp)
                            )
                        }
                    }
                    // 마지막 행이 부족하면 빈 Spacer로 채움
                    repeat(columns - rowItems.size) {
                        Spacer(modifier = Modifier.width(cardWidth))
                    }
                }
            }
        }
    }
}
```

```
1열 (< 400dp):     2열 (400~700dp):      3열 (700~1000dp):
┌──────────┐       ┌──────┬──────┐       ┌────┬────┬────┐
│ Card 1   │       │Card1 │Card2 │       │ C1 │ C2 │ C3 │
├──────────┤       ├──────┼──────┤       ├────┼────┼────┤
│ Card 2   │       │Card3 │Card4 │       │ C4 │ C5 │ C6 │
├──────────┤       ├──────┼──────┤       ├────┼────┼────┤
│ Card 3   │       │Card5 │Card6 │       │ C7 │ C8 │ C9 │
└──────────┘       └──────┴──────┘       └────┴────┴────┘
```

### 예제 2: Foundation 1.10 Grid 레이아웃으로 카드 그리드

Foundation 1.10 (BOM `2026.02.01`)에서는 비-Lazy 2D 그리드 레이아웃인 `Grid`가 새로 추가되었습니다. `@OptIn(ExperimentalGridApi::class)` 어노테이션이 필요하며, `Modifier.gridItem()`으로 각 셀의 span을 제어할 수 있습니다.

```kotlin
@OptIn(ExperimentalGridApi::class)
@Composable
fun GridCardExample(
    items: List<String>,
    modifier: Modifier = Modifier
) {
    // Grid는 비-Lazy 2D 레이아웃으로, 소규모 아이템 집합에 적합
    // 대량 아이템의 경우 LazyVerticalGrid를 사용하세요
    Grid(
        columns = GridCells.Adaptive(minSize = 150.dp),
        modifier = modifier
            .fillMaxWidth()
            .padding(16.dp),
        horizontalArrangement = Arrangement.spacedBy(16.dp),
        verticalArrangement = Arrangement.spacedBy(16.dp)
    ) {
        items.forEach { item ->
            Card(
                modifier = Modifier.gridItem()  // Grid 셀로 배치
            ) {
                Text(
                    text = item,
                    modifier = Modifier.padding(16.dp)
                )
            }
        }
    }
}
```

> **Grid vs LazyVerticalGrid**: `Grid`는 모든 아이템을 한 번에 컴포즈하므로 소규모 데이터에 적합합니다. 대량 데이터에는 여전히 `LazyVerticalGrid`를 사용하세요.

### 예제 3: 폰/태블릿 네비게이션 분기 (기존 수동 방식)

> **참고**: 아래는 기존 수동 분기 방식의 예제입니다. 새 프로젝트에서는 위의 `NavigationSuiteScaffold`를 사용하는 것이 더 간단합니다.

```kotlin
@Composable
fun AdaptiveNavigation(
    selectedTab: Int,
    onTabSelected: (Int) -> Unit,
    content: @Composable () -> Unit
) {
    val navItems = listOf(
        "홈" to Icons.Default.Home,
        "검색" to Icons.Default.Search,
        "알림" to Icons.Default.Notifications,
        "프로필" to Icons.Default.Person
    )
    val windowSizeClass = currentWindowAdaptiveInfo().windowSizeClass

    when {
        windowSizeClass.isWidthAtLeastBreakpoint(WIDTH_DP_MEDIUM_LOWER_BOUND) -> {
            // 태블릿/데스크탑: 네비게이션 레일 (왼쪽 세로 바)
            Row(modifier = Modifier.fillMaxSize()) {
                NavigationRail {
                    navItems.forEachIndexed { index, (label, icon) ->
                        NavigationRailItem(
                            selected = selectedTab == index,
                            onClick = { onTabSelected(index) },
                            icon = { Icon(icon, contentDescription = label) },
                            label = { Text(label) }
                        )
                    }
                }
                Box(modifier = Modifier.weight(1f)) {
                    content()
                }
            }
        }

        else -> {
            // 폰: 하단 네비게이션 바
            Scaffold(
                bottomBar = {
                    NavigationBar {
                        navItems.forEachIndexed { index, (label, icon) ->
                            NavigationBarItem(
                                selected = selectedTab == index,
                                onClick = { onTabSelected(index) },
                                icon = { Icon(icon, contentDescription = label) },
                                label = { Text(label) }
                            )
                        }
                    }
                }
            ) { padding ->
                Box(modifier = Modifier.padding(padding)) {
                    content()
                }
            }
        }
    }
}
```

---

## 9. 실전 예제: 적응형 화면 설계

### 리스트-디테일 패턴

가장 대표적인 반응형 패턴입니다. 폰에서는 리스트와 디테일을 **별도 화면**으로, 태블릿에서는 **나란히** 표시합니다.

```kotlin
@Composable
fun ListDetailLayout(
    items: List<String>,
    selectedItem: String?,
    onItemSelected: (String) -> Unit,
    modifier: Modifier = Modifier
) {
    val windowSizeClass = currentWindowAdaptiveInfo().windowSizeClass
    val isExpanded = windowSizeClass.isWidthAtLeastBreakpoint(WIDTH_DP_MEDIUM_LOWER_BOUND)

    if (!isExpanded) {
        // 폰: 선택된 아이템이 없으면 리스트, 있으면 디테일
        if (selectedItem == null) {
            ItemList(
                items = items,
                onItemClick = onItemSelected,
                modifier = modifier
            )
        } else {
            ItemDetail(
                item = selectedItem,
                modifier = modifier
            )
        }
    } else {
        // 태블릿: 리스트와 디테일 나란히
        Row(modifier = modifier.fillMaxSize()) {
            ItemList(
                items = items,
                onItemClick = onItemSelected,
                modifier = Modifier.weight(1f)
            )
            // 구분선
            Divider(
                modifier = Modifier
                    .fillMaxHeight()
                    .width(1.dp)
            )
            // 디테일 (더 넓은 공간)
            if (selectedItem != null) {
                ItemDetail(
                    item = selectedItem,
                    modifier = Modifier.weight(2f)
                )
            } else {
                Box(
                    modifier = Modifier.weight(2f),
                    contentAlignment = Alignment.Center
                ) {
                    Text("항목을 선택하세요")
                }
            }
        }
    }
}

@Composable
private fun ItemList(
    items: List<String>,
    onItemClick: (String) -> Unit,
    modifier: Modifier = Modifier
) {
    LazyColumn(modifier = modifier) {
        items(items) { item ->
            Text(
                text = item,
                modifier = Modifier
                    .fillMaxWidth()
                    .clickable { onItemClick(item) }
                    .padding(16.dp)
            )
            Divider()
        }
    }
}

@Composable
private fun ItemDetail(
    item: String,
    modifier: Modifier = Modifier
) {
    Column(
        modifier = modifier.padding(16.dp),
        verticalArrangement = Arrangement.spacedBy(8.dp)
    ) {
        Text(
            text = item,
            fontSize = 24.sp,
            fontWeight = FontWeight.Bold
        )
        Text("이 항목의 상세 내용이 여기에 표시됩니다.")
    }
}
```

```
폰 (Compact) - 리스트:        폰 (Compact) - 디테일:
┌──────────────────┐          ┌──────────────────┐
│ 항목 1            │          │ 항목 1            │
├──────────────────┤          │                  │
│ 항목 2            │ →tap→   │ 상세 내용이       │
├──────────────────┤          │ 여기에 표시       │
│ 항목 3            │          │ 됩니다.           │
├──────────────────┤          │                  │
│ 항목 4            │          │                  │
└──────────────────┘          └──────────────────┘

태블릿 (Expanded):
┌──────────────┬─┬─────────────────────────┐
│ 항목 1        │ │ 항목 2                   │
├──────────────┤ │                         │
│ ▶ 항목 2     │ │ 상세 내용이 여기에        │
├──────────────┤ │ 표시됩니다.              │
│ 항목 3        │ │                         │
├──────────────┤ │                         │
│ 항목 4        │ │                         │
└──────────────┴─┴─────────────────────────┘
   weight(1f)       weight(2f)
```

### 여러 크기에서 미리보기 확인

```kotlin
@Preview(
    name = "폰 세로",
    widthDp = 360,
    heightDp = 720
)
@Preview(
    name = "폰 가로",
    widthDp = 720,
    heightDp = 360
)
@Preview(
    name = "태블릿",
    widthDp = 840,
    heightDp = 1200
)
@Composable
fun ResponsivePreview() {
    BoxWithConstraints {
        if (maxWidth < 600.dp) {
            Text("폰 레이아웃 (${maxWidth})")
        } else {
            Text("태블릿 레이아웃 (${maxWidth})")
        }
    }
}
```

> **팁**: `@Preview`의 `widthDp`와 `heightDp`를 다르게 설정하여, Android Studio에서 여러 화면 크기를 동시에 미리볼 수 있습니다.

---

## 10. 정리 및 다음 단계

### 핵심 요약

| 개념 | 설명 |
|------|------|
| 단일 패스 측정 | 각 자식은 한 번만 측정 → 성능 보장 |
| Constraints | 부모가 자식에게 전달하는 크기 허용 범위 (min/max Width/Height) |
| BoxWithConstraints | 현재 제약 조건을 읽어서 조건부 레이아웃 구현 |
| WindowSizeClass | breakpoint 기반 API (`isWidthAtLeastBreakpoint`)로 화면 크기 판별 |
| currentWindowAdaptiveInfo() | 현재 창의 적응형 정보 (WindowSizeClass 포함)를 가져오는 API |
| NavigationSuiteScaffold | 화면 크기에 따라 하단 바/레일/드로어를 자동 전환하는 적응형 네비게이션 |
| Grid 레이아웃 | Foundation 1.10의 비-Lazy 2D 그리드 (`@OptIn(ExperimentalGridApi::class)`) |
| IntrinsicSize | 자식의 고유 크기를 미리 파악하여 레이아웃 결정 |
| requiredSize | 부모 제약을 무시하는 강제 크기 지정 |

### 반응형 설계 체크리스트

| 체크 항목 | 방법 |
|-----------|------|
| 폰 세로/가로 대응 | `BoxWithConstraints` 또는 `WindowSizeClass` |
| 폰/태블릿 분기 | `currentWindowAdaptiveInfo().windowSizeClass.isWidthAtLeastBreakpoint()` |
| 네비게이션 적응 | `NavigationSuiteScaffold` (자동 전환) 또는 수동 분기 |
| 그리드 열 수 조절 | `BoxWithConstraints`로 너비 확인 후 열 수 계산, 또는 Foundation 1.10의 `Grid` 레이아웃 사용 |
| 리스트-디테일 패턴 | Compact: 별도 화면 / Expanded: 나란히 |
| 고유 크기 맞춤 | `IntrinsicSize.Min` / `IntrinsicSize.Max` |

### 자주 하는 실수

1. **BoxWithConstraints를 남용**하기 - 제약 조건을 읽지 않는다면 일반 Box를 사용하세요.
2. 폰에서만 테스트하고 **태블릿/가로 모드를 무시**하기 - `@Preview`를 다양한 크기로 설정하세요.
3. 하드코딩된 dp 값으로 레이아웃을 구성하기 - `fillMaxWidth()`, `weight()` 등 **유연한 크기**를 사용하세요.
4. IntrinsicSize를 이해하지 않고 **커스텀 레이아웃**을 만들기 - 먼저 IntrinsicSize로 해결할 수 있는지 확인하세요.
5. 더 이상 사용되지 않는 `WindowWidthSizeClass.Compact` / `Medium` / `Expanded` 열거형을 사용하기 - 최신 breakpoint 기반 API(`isWidthAtLeastBreakpoint`)를 사용하세요.

### 다음 학습

Phase 2 (기본 레이아웃)를 완료했습니다! 다음은 Phase 3로 넘어갑니다:

- [Phase 3-01. Text와 TextField](../phase-03-core-components/01-text-and-textfield.md) - 텍스트 표시와 입력을 처리하는 핵심 컴포넌트를 배웁니다.
- [Phase 3-02. Button과 아이콘](../phase-03-core-components/02-button-and-icon.md) - 사용자 상호작용의 시작점인 버튼을 마스터합니다.
