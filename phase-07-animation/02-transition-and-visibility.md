# 전환과 가시성 애니메이션

> **"요소가 나타나고 사라지는 방식이 곧 앱의 성격을 결정한다."**
>
> 리스트 아이템이 부드럽게 슬라이드되어 나타나고, 화면이 자연스럽게 전환되는 경험은
> 사용자에게 "이 앱은 잘 만들어졌다"는 인상을 줍니다.
> 이 문서에서는 Compose의 전환 및 가시성 애니메이션 API를 단계별로 배웁니다.

---

## 목차

1. [AnimatedVisibility 기초](#1-animatedvisibility-기초)
2. [EnterTransition: 진입 애니메이션](#2-entertransition-진입-애니메이션)
3. [ExitTransition: 종료 애니메이션](#3-exittransition-종료-애니메이션)
4. [전환 조합: + 연산자](#4-전환-조합--연산자)
5. [AnimatedContent: 컴포저블 간 전환](#5-animatedcontent-컴포저블-간-전환)
6. [Crossfade: 단순한 컨텐츠 전환](#6-crossfade-단순한-컨텐츠-전환)
7. [updateTransition: 여러 값 동시 애니메이션](#7-updatetransition-여러-값-동시-애니메이션)
8. [rememberInfiniteTransition: 무한 반복 애니메이션](#8-reminberinfinitetransition-무한-반복-애니메이션)
9. [정리](#9-정리)

---

## 1. AnimatedVisibility 기초

`AnimatedVisibility`는 컴포저블이 **나타나거나 사라질 때** 애니메이션을 자동으로 적용합니다. `visible` 매개변수의 값이 바뀌면 진입/종료 애니메이션이 실행됩니다.

> **성능 이점 (Compose 1.10.4)**: `AnimatedVisibility`는 종료 애니메이션이 완료된 후 내부 컴포저블을 **컴포지션에서 완전히 제거**합니다. 이는 단순히 투명도를 0으로 만드는 것과 달리, 해당 컴포저블의 상태와 리소스가 해제되어 메모리와 성능 면에서 이점이 있습니다.

### 기본 사용법

```kotlin [compose-playground]
@Composable
fun BasicVisibilityExample() {
    var isVisible by remember { mutableStateOf(true) }

    Column {
        Button(onClick = { isVisible = !isVisible }) {
            Text(if (isVisible) "숨기기" else "보이기")
        }

        // isVisible이 바뀌면 자동으로 페이드 + 확장 애니메이션
        AnimatedVisibility(visible = isVisible) {
            Card(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(16.dp)
            ) {
                Text(
                    text = "이 카드는 부드럽게 나타나고 사라집니다!",
                    modifier = Modifier.padding(16.dp)
                )
            }
        }
    }
}
```

```
AnimatedVisibility 동작 흐름

  visible = true → false
       │
       ▼
  ┌──────────────────────────────┐
  │  Exit 애니메이션 실행          │
  │  (fadeOut + shrinkVertically) │
  │                              │
  │  완전히 투명 & 크기 0 도달     │
  │         ↓                    │
  │  컴포저블이 트리에서 제거됨     │
  └──────────────────────────────┘

  visible = false → true
       │
       ▼
  ┌──────────────────────────────┐
  │  컴포저블이 트리에 추가됨      │
  │         ↓                    │
  │  Enter 애니메이션 실행         │
  │  (fadeIn + expandVertically)  │
  │                              │
  │  완전히 불투명 & 원래 크기 도달 │
  └──────────────────────────────┘
```

### 진입/종료 애니메이션 커스터마이징

```kotlin [compose-playground]
AnimatedVisibility(
    visible = isVisible,
    enter = slideInVertically() + fadeIn(),   // 아래에서 위로 슬라이드 + 페이드
    exit = slideOutVertically() + fadeOut()   // 위에서 아래로 슬라이드 + 페이드
) {
    // 컨텐츠
}
```

---

## 2. EnterTransition: 진입 애니메이션

컴포저블이 **나타날 때** 사용하는 전환 효과입니다.

| EnterTransition | 설명 | 시각적 효과 |
|-----------------|------|------------|
| `fadeIn()` | 투명 → 불투명 | 서서히 나타남 |
| `slideIn()` | 지정 위치에서 슬라이드 | 특정 방향에서 밀려 들어옴 |
| `slideInHorizontally()` | 수평 슬라이드 | 좌/우에서 들어옴 |
| `slideInVertically()` | 수직 슬라이드 | 위/아래에서 들어옴 |
| `expandIn()` | 크기 0 → 원래 크기 | 확대되며 나타남 |
| `expandHorizontally()` | 수평 확장 | 가로로 펼쳐짐 |
| `expandVertically()` | 수직 확장 | 세로로 펼쳐짐 |
| `scaleIn()` | 축소 → 원래 크기 | 스케일 업 |

### 코드 예제

```kotlin [compose-playground]
@Composable
fun EnterTransitionExamples() {
    var showItems by remember { mutableStateOf(false) }

    Column {
        Button(onClick = { showItems = !showItems }) {
            Text("전환 보기")
        }

        // 1. fadeIn: 투명 → 불투명
        AnimatedVisibility(
            visible = showItems,
            enter = fadeIn(animationSpec = tween(1000))
        ) {
            Text("fadeIn으로 나타남", modifier = Modifier.padding(8.dp))
        }

        // 2. slideInHorizontally: 왼쪽에서 들어옴
        AnimatedVisibility(
            visible = showItems,
            enter = slideInHorizontally(
                initialOffsetX = { fullWidth -> -fullWidth }  // 왼쪽 밖에서 시작
            )
        ) {
            Text("왼쪽에서 슬라이드", modifier = Modifier.padding(8.dp))
        }

        // 3. slideInVertically: 위에서 들어옴
        AnimatedVisibility(
            visible = showItems,
            enter = slideInVertically(
                initialOffsetY = { fullHeight -> -fullHeight }  // 위쪽 밖에서 시작
            )
        ) {
            Text("위에서 슬라이드", modifier = Modifier.padding(8.dp))
        }

        // 4. expandVertically: 위에서 아래로 펼쳐짐
        AnimatedVisibility(
            visible = showItems,
            enter = expandVertically(expandFrom = Alignment.Top)
        ) {
            Text("위에서 확장", modifier = Modifier.padding(8.dp))
        }

        // 5. scaleIn: 작은 크기에서 커짐
        AnimatedVisibility(
            visible = showItems,
            enter = scaleIn(initialScale = 0.3f)
        ) {
            Text("스케일 인", modifier = Modifier.padding(8.dp))
        }
    }
}
```

---

## 3. ExitTransition: 종료 애니메이션

컴포저블이 **사라질 때** 사용하는 전환 효과입니다.

| ExitTransition | 설명 | 시각적 효과 |
|----------------|------|------------|
| `fadeOut()` | 불투명 → 투명 | 서서히 사라짐 |
| `slideOut()` | 지정 위치로 슬라이드 | 특정 방향으로 밀려 나감 |
| `slideOutHorizontally()` | 수평 슬라이드 | 좌/우로 나감 |
| `slideOutVertically()` | 수직 슬라이드 | 위/아래로 나감 |
| `shrinkOut()` | 원래 크기 → 크기 0 | 축소되며 사라짐 |
| `shrinkHorizontally()` | 수평 축소 | 가로로 줄어듦 |
| `shrinkVertically()` | 수직 축소 | 세로로 줄어듦 |
| `scaleOut()` | 원래 크기 → 축소 | 스케일 다운 |

### 코드 예제

```kotlin [compose-playground]
@Composable
fun ExitTransitionExamples() {
    var isVisible by remember { mutableStateOf(true) }

    Column {
        Button(onClick = { isVisible = !isVisible }) {
            Text("전환 토글")
        }

        // 오른쪽으로 슬라이드하며 페이드 아웃
        AnimatedVisibility(
            visible = isVisible,
            exit = slideOutHorizontally(
                targetOffsetX = { fullWidth -> fullWidth }  // 오른쪽 밖으로
            ) + fadeOut()
        ) {
            Card(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(16.dp)
            ) {
                Text("스와이프처럼 사라짐", modifier = Modifier.padding(16.dp))
            }
        }

        // 아래로 축소되며 사라짐
        AnimatedVisibility(
            visible = isVisible,
            exit = shrinkVertically(shrinkTowards = Alignment.Top) + fadeOut()
        ) {
            Card(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(16.dp)
            ) {
                Text("접히듯 사라짐", modifier = Modifier.padding(16.dp))
            }
        }
    }
}
```

---

## 4. 전환 조합: + 연산자

`+` 연산자를 사용하면 여러 전환 효과를 **동시에 적용**할 수 있습니다. 이를 통해 복합적인 시각 효과를 만들 수 있습니다.

```
전환 조합 예시

fadeIn() + slideInVertically() + scaleIn()
   │              │                 │
   ▼              ▼                 ▼
 투명→불투명    아래→위로         작게→크게
              (동시에 실행)
```

### 실전 예제: 알림 카드

```kotlin [compose-playground]
@Composable
fun NotificationCard(isShown: Boolean) {
    AnimatedVisibility(
        visible = isShown,
        // 진입: 위에서 슬라이드 + 페이드인 + 스케일업
        enter = slideInVertically(
            initialOffsetY = { -it }
        ) + fadeIn(
            animationSpec = tween(300)
        ) + expandVertically(
            expandFrom = Alignment.Top
        ),
        // 종료: 오른쪽으로 슬라이드 + 페이드아웃 + 축소
        exit = slideOutHorizontally(
            targetOffsetX = { it }
        ) + fadeOut(
            animationSpec = tween(200)
        ) + shrinkVertically()
    ) {
        Card(
            modifier = Modifier
                .fillMaxWidth()
                .padding(16.dp),
            colors = CardDefaults.cardColors(
                containerColor = Color(0xFF2196F3)
            )
        ) {
            Row(
                modifier = Modifier.padding(16.dp),
                verticalAlignment = Alignment.CenterVertically
            ) {
                Icon(
                    Icons.Default.Notifications,
                    contentDescription = null,
                    tint = Color.White
                )
                Spacer(Modifier.width(12.dp))
                Text("새로운 알림이 있습니다!", color = Color.White)
            }
        }
    }
}
```

### 자주 사용하는 조합 패턴

| 패턴 | Enter | Exit | 용도 |
|------|-------|------|------|
| 페이드 + 슬라이드 | `fadeIn + slideInVertically` | `fadeOut + slideOutVertically` | 리스트 아이템 |
| 페이드 + 스케일 | `fadeIn + scaleIn` | `fadeOut + scaleOut` | 팝업, 다이얼로그 |
| 확장 + 페이드 | `expandVertically + fadeIn` | `shrinkVertically + fadeOut` | 접기/펼치기 |

---

## 5. AnimatedContent: 컴포저블 간 전환

`AnimatedContent`는 **타겟 상태가 바뀔 때** 이전 컨텐츠와 새 컨텐츠 사이에 전환 애니메이션을 적용합니다. `AnimatedVisibility`는 보이기/숨기기만 처리하지만, `AnimatedContent`는 **서로 다른 컨텐츠 간의 교체**를 처리합니다.

```
AnimatedVisibility vs AnimatedContent

AnimatedVisibility               AnimatedContent
┌──────────┐                     ┌──────────┐
│  컨텐츠 A │ ← 보이기/숨기기     │  컨텐츠 A │
└──────────┘                     └────┬─────┘
                                      │ 전환
                                 ┌────▼─────┐
                                 │  컨텐츠 B │
                                 └──────────┘
```

### 기본 사용법

```kotlin [compose-playground]
@Composable
fun AnimatedContentExample() {
    var count by remember { mutableIntStateOf(0) }

    Column(horizontalAlignment = Alignment.CenterHorizontally) {
        AnimatedContent(
            targetState = count,
            transitionSpec = {
                // 새 값이 더 크면: 위로 슬라이드하며 나타남 + 아래로 슬라이드하며 사라짐
                if (targetState > initialState) {
                    slideInVertically { height -> height } + fadeIn() togetherWith
                        slideOutVertically { height -> -height } + fadeOut()
                } else {
                    // 새 값이 더 작으면: 반대 방향
                    slideInVertically { height -> -height } + fadeIn() togetherWith
                        slideOutVertically { height -> height } + fadeOut()
                }.using(
                    SizeTransform(clip = false)
                )
            },
            label = "counter"
        ) { targetCount ->
            Text(
                text = "$targetCount",
                fontSize = 48.sp,
                fontWeight = FontWeight.Bold
            )
        }

        Row(horizontalArrangement = Arrangement.spacedBy(16.dp)) {
            Button(onClick = { count-- }) { Text("-") }
            Button(onClick = { count++ }) { Text("+") }
        }
    }
}
```

### 화면 상태 전환

```kotlin [compose-playground]
sealed class UiState {
    data object Loading : UiState()
    data class Success(val data: String) : UiState()
    data class Error(val message: String) : UiState()
}

@Composable
fun StatefulScreen(state: UiState) {
    AnimatedContent(
        targetState = state,
        transitionSpec = {
            fadeIn(animationSpec = tween(300)) togetherWith
                fadeOut(animationSpec = tween(300))
        },
        label = "screenState"
    ) { targetState ->
        when (targetState) {
            is UiState.Loading -> {
                Box(
                    modifier = Modifier.fillMaxSize(),
                    contentAlignment = Alignment.Center
                ) {
                    CircularProgressIndicator()
                }
            }
            is UiState.Success -> {
                Text(
                    text = targetState.data,
                    modifier = Modifier.padding(16.dp)
                )
            }
            is UiState.Error -> {
                Text(
                    text = targetState.message,
                    color = Color.Red,
                    modifier = Modifier.padding(16.dp)
                )
            }
        }
    }
}
```

### transitionSpec 핵심 키워드

| 키워드 | 설명 |
|--------|------|
| `togetherWith` | 진입 전환과 종료 전환을 결합 |
| `using` | `SizeTransform`을 지정하여 크기 변환 방식 제어 |
| `targetState` | 전환 후 새 상태 |
| `initialState` | 전환 전 이전 상태 |

---

## 6. Crossfade: 단순한 컨텐츠 전환

`Crossfade`는 `AnimatedContent`의 간소화 버전입니다. 두 컨텐츠 사이에 **크로스페이드(교차 페이드) 효과만** 적용합니다. 복잡한 `transitionSpec` 설정 없이 간단하게 사용할 수 있습니다.

> **언제 사용하나요?**: 컴포저블 간 전환에서 단순히 페이드만 필요하다면 `AnimatedContent` 대신 `Crossfade`를 사용하세요. 코드가 더 간결하고 불필요한 `transitionSpec` 설정이 필요 없습니다. 탭 전환, 화면 상태 교체 등 **슬라이드/스케일 없이 페이드만 원하는 모든 경우**에 적합합니다.

```kotlin [compose-playground]
@Composable
fun CrossfadeExample() {
    var currentTab by remember { mutableStateOf("home") }

    Column {
        // 탭 버튼
        Row {
            listOf("home", "search", "profile").forEach { tab ->
                Button(
                    onClick = { currentTab = tab },
                    colors = ButtonDefaults.buttonColors(
                        containerColor = if (currentTab == tab)
                            MaterialTheme.colorScheme.primary
                        else
                            MaterialTheme.colorScheme.secondary
                    ),
                    modifier = Modifier.padding(4.dp)
                ) {
                    Text(tab)
                }
            }
        }

        // 크로스페이드로 컨텐츠 전환
        Crossfade(
            targetState = currentTab,
            animationSpec = tween(500),
            label = "tabContent"
        ) { tab ->
            when (tab) {
                "home" -> HomeScreen()
                "search" -> SearchScreen()
                "profile" -> ProfileScreen()
            }
        }
    }
}
```

```
Crossfade 동작

Tab A (alpha: 1.0)          Tab B (alpha: 0.0)
       │                          │
       │ 전환 시작                  │
       ▼                          ▼
Tab A (alpha: 0.5)          Tab B (alpha: 0.5)
       │                          │
       │ 전환 완료                  │
       ▼                          ▼
Tab A (alpha: 0.0)          Tab B (alpha: 1.0)
```

> **Crossfade vs AnimatedContent 선택 기준**:
> - 단순히 교차 페이드만 원한다면 → `Crossfade` (더 간단)
> - 슬라이드, 스케일 등 다양한 전환이 필요하다면 → `AnimatedContent`

---

## 7. updateTransition: 여러 값 동시 애니메이션

`updateTransition`은 **하나의 상태 변경에 따라 여러 애니메이션 값을 동시에 관리**할 때 사용합니다. 색상, 크기, 테두리 등을 하나의 상태로 통합 관리할 수 있습니다.

### animate*AsState와의 차이

```
animate*AsState 방식 (개별 관리)
┌──────────┐  ┌──────────┐  ┌──────────┐
│ 색상 상태  │  │ 크기 상태  │  │ 테두리 상태│
│ (독립적)  │  │ (독립적)  │  │ (독립적)  │
└──────────┘  └──────────┘  └──────────┘
  각각 별도의 상태 → 동기화가 보장되지 않을 수 있음

updateTransition 방식 (통합 관리)
         ┌──────────┐
         │ 하나의    │
         │ Transition│
         │  상태     │
         └────┬─────┘
        ┌─────┼─────┐
        ▼     ▼     ▼
      색상   크기   테두리
  모든 값이 하나의 전환에 동기화됨
```

### 코드 예제: 선택 가능한 카드

```kotlin [compose-playground]
enum class CardState {
    Normal, Selected, Disabled
}

@Composable
fun SelectableCard(cardState: CardState) {
    // 하나의 Transition으로 여러 애니메이션 값을 관리
    val transition = updateTransition(
        targetState = cardState,
        label = "cardTransition"
    )

    // Transition에서 각 값을 파생
    val backgroundColor by transition.animateColor(label = "bgColor") { state ->
        when (state) {
            CardState.Normal -> Color.White
            CardState.Selected -> Color(0xFFE3F2FD)
            CardState.Disabled -> Color(0xFFF5F5F5)
        }
    }

    val borderColor by transition.animateColor(label = "borderColor") { state ->
        when (state) {
            CardState.Normal -> Color(0xFFE0E0E0)
            CardState.Selected -> Color(0xFF2196F3)
            CardState.Disabled -> Color(0xFFBDBDBD)
        }
    }

    val borderWidth by transition.animateDp(label = "borderWidth") { state ->
        when (state) {
            CardState.Normal -> 1.dp
            CardState.Selected -> 2.dp
            CardState.Disabled -> 1.dp
        }
    }

    val elevation by transition.animateDp(label = "elevation") { state ->
        when (state) {
            CardState.Normal -> 2.dp
            CardState.Selected -> 8.dp
            CardState.Disabled -> 0.dp
        }
    }

    val contentAlpha by transition.animateFloat(label = "contentAlpha") { state ->
        when (state) {
            CardState.Normal -> 1f
            CardState.Selected -> 1f
            CardState.Disabled -> 0.5f
        }
    }

    Card(
        modifier = Modifier
            .fillMaxWidth()
            .padding(8.dp)
            .border(borderWidth, borderColor, RoundedCornerShape(12.dp))
            .graphicsLayer { alpha = contentAlpha },
        colors = CardDefaults.cardColors(containerColor = backgroundColor),
        elevation = CardDefaults.cardElevation(defaultElevation = elevation)
    ) {
        Text(
            text = "카드 상태: $cardState",
            modifier = Modifier.padding(16.dp)
        )
    }
}
```

### 사용 예시

```kotlin [compose-playground]
@Composable
fun CardDemo() {
    var state by remember { mutableStateOf(CardState.Normal) }

    Column {
        Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
            CardState.entries.forEach { cardState ->
                Button(onClick = { state = cardState }) {
                    Text(cardState.name)
                }
            }
        }

        SelectableCard(cardState = state)
    }
}
```

### transition.animate* 함수들

| 함수 | 반환 타입 |
|------|-----------|
| `transition.animateColor` | `State<Color>` |
| `transition.animateDp` | `State<Dp>` |
| `transition.animateFloat` | `State<Float>` |
| `transition.animateInt` | `State<Int>` |
| `transition.animateOffset` | `State<Offset>` |
| `transition.animateSize` | `State<Size>` |
| `transition.animateRect` | `State<Rect>` |

---

## 8. rememberInfiniteTransition: 무한 반복 애니메이션

`rememberInfiniteTransition`은 **무한히 반복되는 애니메이션**을 만듭니다. 로딩 인디케이터, 맥박 효과, 깜빡임 등에 적합합니다.

### 펄스(맥박) 효과

```kotlin [compose-playground]
@Composable
fun PulsingDot() {
    val infiniteTransition = rememberInfiniteTransition(label = "pulse")

    val scale by infiniteTransition.animateFloat(
        initialValue = 0.8f,
        targetValue = 1.2f,
        animationSpec = infiniteRepeatable(
            animation = tween(800, easing = FastOutSlowInEasing),
            repeatMode = RepeatMode.Reverse
        ),
        label = "scale"
    )

    val alpha by infiniteTransition.animateFloat(
        initialValue = 0.5f,
        targetValue = 1f,
        animationSpec = infiniteRepeatable(
            animation = tween(800, easing = FastOutSlowInEasing),
            repeatMode = RepeatMode.Reverse
        ),
        label = "alpha"
    )

    Box(
        modifier = Modifier
            .size(24.dp)
            .graphicsLayer {
                scaleX = scale
                scaleY = scale
                this.alpha = alpha
            }
            .background(Color.Red, CircleShape)
    )
}
```

### 색상 순환 애니메이션

```kotlin [compose-playground]
@Composable
fun ColorCyclingBorder() {
    val infiniteTransition = rememberInfiniteTransition(label = "colorCycle")

    val color by infiniteTransition.animateColor(
        initialValue = Color.Red,
        targetValue = Color.Blue,
        animationSpec = infiniteRepeatable(
            animation = tween(2000, easing = LinearEasing),
            repeatMode = RepeatMode.Reverse
        ),
        label = "borderColor"
    )

    Card(
        modifier = Modifier
            .size(120.dp)
            .border(3.dp, color, RoundedCornerShape(16.dp)),
        shape = RoundedCornerShape(16.dp)
    ) {
        Box(
            modifier = Modifier.fillMaxSize(),
            contentAlignment = Alignment.Center
        ) {
            Text("로딩 중...")
        }
    }
}
```

### 로딩 스피너 (회전)

```kotlin [compose-playground]
@Composable
fun RotatingLoader() {
    val infiniteTransition = rememberInfiniteTransition(label = "rotate")

    val rotation by infiniteTransition.animateFloat(
        initialValue = 0f,
        targetValue = 360f,
        animationSpec = infiniteRepeatable(
            animation = tween(1000, easing = LinearEasing),
            repeatMode = RepeatMode.Restart  // 360도 → 다시 0도부터
        ),
        label = "rotation"
    )

    Icon(
        imageVector = Icons.Default.Refresh,
        contentDescription = "로딩 중",
        modifier = Modifier
            .size(48.dp)
            .graphicsLayer { rotationZ = rotation }
    )
}
```

> **주의**: `rememberInfiniteTransition`은 컴포저블이 컴포지션에 있는 동안 **계속** 실행됩니다.
> 화면에서 제거되면 자동으로 중지되므로 메모리 누수는 걱정하지 않아도 됩니다.

---

## 9. 정리

| 핵심 API | 용도 | 사용 시점 |
|----------|------|----------|
| `AnimatedVisibility` | 보이기/숨기기 애니메이션 | 요소의 등장/퇴장 |
| `EnterTransition` | 진입 효과 (fadeIn, slideIn 등) | AnimatedVisibility의 enter |
| `ExitTransition` | 종료 효과 (fadeOut, slideOut 등) | AnimatedVisibility의 exit |
| `AnimatedContent` | 컨텐츠 교체 전환 | 상태에 따라 다른 컨텐츠 표시 |
| `Crossfade` | 간단한 교차 페이드 | 탭 전환 등 단순 교체 |
| `updateTransition` | 여러 값 동시 애니메이션 | 복합 상태 변화 (색상 + 크기 + ...) |
| `rememberInfiniteTransition` | 무한 반복 애니메이션 | 로딩, 맥박, 깜빡임 |

### 어떤 API를 선택해야 할까?

```
요소를 보이기/숨기기?
├── YES → AnimatedVisibility
│
컨텐츠를 교체?
├── 단순 페이드만? → Crossfade
├── 다양한 전환? → AnimatedContent
│
여러 값을 동시에 애니메이션?
├── YES → updateTransition
│
무한 반복?
├── YES → rememberInfiniteTransition
│
단일 값만 애니메이션?
└── animate*AsState (이전 문서 참고)
```

### Navigation Compose 전환 애니메이션

Navigation Compose에서 화면 전환 애니메이션은 이제 **공식 API**로 지원됩니다. `composable<Route>()`에 `enterTransition`과 `exitTransition`을 직접 지정할 수 있습니다:

```kotlin [compose-playground]
NavHost(
    navController = navController,
    startDestination = HomeRoute
) {
    composable<HomeRoute>(
        enterTransition = { slideInHorizontally(initialOffsetX = { it }) + fadeIn() },
        exitTransition = { slideOutHorizontally(targetOffsetX = { -it }) + fadeOut() }
    ) {
        HomeScreen()
    }
    composable<DetailRoute>(
        enterTransition = { slideInHorizontally(initialOffsetX = { it }) + fadeIn() },
        exitTransition = { slideOutHorizontally(targetOffsetX = { it }) + fadeOut() }
    ) {
        DetailScreen()
    }
}
```

> 이전에는 Accompanist 라이브러리가 필요했지만, 이제는 Navigation Compose에 내장되어 별도 의존성 없이 사용 가능합니다.

### 다음 단계

다음 문서에서는 **Animatable**, **감쇠 애니메이션**, **공유 요소 전환** 등 더 정밀하고 고급적인 애니메이션 기법을 배웁니다.

> [다음: 03. 고급 애니메이션 기법 →](03-advanced-animation.md)
