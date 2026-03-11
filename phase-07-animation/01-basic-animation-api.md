# 기본 애니메이션 API

> **"애니메이션은 장식이 아니라, 사용자에게 변화의 맥락을 전달하는 언어다."**
>
> 버튼 색상이 부드럽게 바뀌고, 카드가 자연스럽게 펼쳐지는 경험은 앱의 품질을 결정합니다.
> 이 문서에서는 Compose가 제공하는 가장 기본적인 애니메이션 API를 하나씩 익혀봅니다.

---

## 목차

1. [왜 애니메이션이 중요한가](#1-왜-애니메이션이-중요한가)
2. [animate*AsState 개요](#2-animateasstate-개요)
3. [animateFloatAsState](#3-animatefloatasstate)
4. [animateColorAsState](#4-animatecolorasstate)
5. [animateDpAsState](#5-animatedpasstate)
6. [animateIntAsState](#6-animateintasstate)
7. [animateContentSize()](#7-animatecontentsize)
8. [AnimationSpec 소개](#8-animationspec-소개)
9. [spring: 물리 기반 애니메이션](#9-spring-물리-기반-애니메이션)
10. [tween: 시간 기반 애니메이션](#10-tween-시간-기반-애니메이션)
11. [keyframes, repeatable, snap](#11-keyframes-repeatable-snap)
12. [정리](#12-정리)

---

## 1. 왜 애니메이션이 중요한가

애니메이션이 없는 앱과 있는 앱의 차이를 생각해 봅시다.

```
애니메이션 없음                      애니메이션 있음
┌──────────────┐                 ┌──────────────┐
│  버튼 클릭    │                 │  버튼 클릭    │
│      ↓       │                 │      ↓       │
│  화면 즉시 변경│                 │  부드럽게 전환 │
│  (깜빡!)     │                 │  (자연스럽게~) │
└──────────────┘                 └──────────────┘
   ❌ 어색함                         ✅ 자연스러움
   ❌ 변화를 놓침                     ✅ 변화를 인지
   ❌ 저품질 느낌                     ✅ 고품질 느낌
```

애니메이션이 중요한 세 가지 이유:

| 이유 | 설명 | 예시 |
|------|------|------|
| **맥락 전달** | 요소가 어디서 와서 어디로 가는지 보여줌 | 리스트 아이템이 위로 슬라이드하며 사라짐 |
| **주의 유도** | 중요한 변화에 시선을 끌어줌 | 알림 뱃지가 살짝 튀어오름 |
| **피드백 제공** | 사용자 행동에 반응하고 있음을 알려줌 | 버튼 누를 때 색상이 바뀜 |

> Compose는 애니메이션을 **매우 쉽게** 구현할 수 있도록 설계되었습니다.
> 대부분의 경우 **한두 줄의 코드**로 충분합니다.

---

## 2. animate*AsState 개요

`animate*AsState`는 Compose에서 가장 간단한 애니메이션 API입니다. **타겟 값이 바뀌면 현재 값에서 새 값으로 자동으로 애니메이션**됩니다.

```
animate*AsState 동작 원리

  상태 변경: false → true
       │
       ▼
  타겟 값 변경: 0f → 1f
       │
       ▼
  ┌─────────────────────────────────┐
  │  0f ──→ 0.2f ──→ 0.5f ──→ 0.8f ──→ 1f  │
  │         (매 프레임 자동 보간)              │
  └─────────────────────────────────┘
       │
       ▼
  UI가 매 프레임마다 중간 값으로 리컴포지션
```

Compose가 제공하는 `animate*AsState` 함수들:

| 함수 | 애니메이션 대상 | 반환 타입 |
|------|---------------|-----------|
| `animateFloatAsState` | 소수점 숫자 (투명도, 크기 비율 등) | `State<Float>` |
| `animateColorAsState` | 색상 | `State<Color>` |
| `animateDpAsState` | Dp 단위 값 (패딩, 크기, 오프셋 등) | `State<Dp>` |
| `animateIntAsState` | 정수 | `State<Int>` |
| `animateIntOffsetAsState` | IntOffset | `State<IntOffset>` |
| `animateSizeAsState` | Size | `State<Size>` |
| `animateRectAsState` | Rect | `State<Rect>` |

---

## 3. animateFloatAsState

투명도, 회전 각도, 크기 비율 등 `Float` 값을 애니메이션할 때 사용합니다.

### 투명도 애니메이션

```kotlin
@Composable
fun FadeExample() {
    var isVisible by remember { mutableStateOf(true) }

    // isVisible이 바뀌면 alpha 값이 부드럽게 전환됩니다
    val alpha by animateFloatAsState(
        targetValue = if (isVisible) 1f else 0f,
        label = "alpha"  // 디버깅용 라벨
    )

    Column(horizontalAlignment = Alignment.CenterHorizontally) {
        Button(onClick = { isVisible = !isVisible }) {
            Text("토글")
        }

        Box(
            modifier = Modifier
                .size(100.dp)
                .graphicsLayer { this.alpha = alpha }  // alpha 적용
                .background(Color.Blue)
        )
    }
}
```

### 회전 애니메이션

```kotlin
@Composable
fun RotationExample() {
    var isRotated by remember { mutableStateOf(false) }

    val rotation by animateFloatAsState(
        targetValue = if (isRotated) 360f else 0f,
        label = "rotation"
    )

    Image(
        painter = painterResource(id = R.drawable.ic_star),
        contentDescription = "별",
        modifier = Modifier
            .size(64.dp)
            .graphicsLayer { rotationZ = rotation }
            .clickable { isRotated = !isRotated }
    )
}
```

> **팁**: `graphicsLayer`를 사용하면 리컴포지션 없이 렌더링 단계에서만 변경이 일어나 성능이 좋습니다.

### 성능 Best Practice: 람다 기반 Modifier 사용 (Compose 1.10.4)

애니메이션 값을 Modifier에 적용할 때는 반드시 **람다 기반 Modifier**를 사용하세요. 람다 버전은 Drawing 단계에서만 실행되어 리컴포지션을 건너뜁니다.

```kotlin
// ✅ Good - 애니메이션이 Draw 단계에서 실행, 리컴포지션 스킵
Modifier.graphicsLayer { alpha = animatedAlpha }

// ❌ Avoid - 매 프레임 리컴포지션 발생
Modifier.alpha(animatedAlpha)
```

색상 애니메이션의 경우 `Modifier.drawBehind { }`가 `Modifier.background()`보다 효율적입니다:

```kotlin
// ✅ Good - Draw 단계에서만 실행
Modifier.drawBehind { drawRect(color = animatedColor) }

// ❌ Avoid - 리컴포지션 발생
Modifier.background(animatedColor)
```

---

## 4. animateColorAsState

색상 전환을 부드럽게 처리합니다. 버튼 상태, 테마 변경, 선택 상태 표시 등에 유용합니다.

### 버튼 색상 변경

```kotlin
@Composable
fun ColorChangeButton() {
    var isSelected by remember { mutableStateOf(false) }

    // 색상이 부드럽게 전환됩니다
    val backgroundColor by animateColorAsState(
        targetValue = if (isSelected) Color(0xFF4CAF50) else Color(0xFFE0E0E0),
        label = "buttonColor"
    )

    val textColor by animateColorAsState(
        targetValue = if (isSelected) Color.White else Color.Black,
        label = "textColor"
    )

    Button(
        onClick = { isSelected = !isSelected },
        colors = ButtonDefaults.buttonColors(
            containerColor = backgroundColor
        )
    ) {
        Text(
            text = if (isSelected) "선택됨" else "선택하기",
            color = textColor
        )
    }
}
```

### 카드 배경색 전환

```kotlin
@Composable
fun StatusCard(isOnline: Boolean) {
    val cardColor by animateColorAsState(
        targetValue = if (isOnline) Color(0xFFE8F5E9) else Color(0xFFFFEBEE),
        label = "cardColor"
    )

    Card(
        colors = CardDefaults.cardColors(containerColor = cardColor),
        modifier = Modifier
            .fillMaxWidth()
            .padding(16.dp)
    ) {
        Text(
            text = if (isOnline) "온라인" else "오프라인",
            modifier = Modifier.padding(16.dp)
        )
    }
}
```

---

## 5. animateDpAsState

패딩, 크기, 오프셋 등 `Dp` 값을 애니메이션할 때 사용합니다.

### 크기 변경 애니메이션

```kotlin
@Composable
fun SizeAnimationExample() {
    var isExpanded by remember { mutableStateOf(false) }

    val size by animateDpAsState(
        targetValue = if (isExpanded) 200.dp else 100.dp,
        label = "size"
    )

    Box(
        modifier = Modifier
            .size(size)  // 크기가 부드럽게 변합니다
            .background(Color.Cyan, RoundedCornerShape(16.dp))
            .clickable { isExpanded = !isExpanded },
        contentAlignment = Alignment.Center
    ) {
        Text(if (isExpanded) "크게" else "작게")
    }
}
```

### 패딩 변경 애니메이션

```kotlin
@Composable
fun PaddingAnimationExample() {
    var isIndented by remember { mutableStateOf(false) }

    val startPadding by animateDpAsState(
        targetValue = if (isIndented) 48.dp else 16.dp,
        label = "padding"
    )

    Text(
        text = "들여쓰기 텍스트",
        modifier = Modifier
            .fillMaxWidth()
            .padding(start = startPadding)
            .clickable { isIndented = !isIndented }
    )
}
```

---

## 6. animateIntAsState

정수 값을 애니메이션합니다. 카운터, 진행률 숫자 등에 활용할 수 있습니다.

```kotlin
@Composable
fun AnimatedCounter() {
    var targetCount by remember { mutableIntStateOf(0) }

    // 숫자가 부드럽게 카운팅됩니다
    val animatedCount by animateIntAsState(
        targetValue = targetCount,
        animationSpec = tween(durationMillis = 1000),
        label = "counter"
    )

    Column(horizontalAlignment = Alignment.CenterHorizontally) {
        Text(
            text = "$animatedCount",
            fontSize = 48.sp,
            fontWeight = FontWeight.Bold
        )

        Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
            Button(onClick = { targetCount += 100 }) {
                Text("+100")
            }
            Button(onClick = { targetCount = 0 }) {
                Text("리셋")
            }
        }
    }
}
```

---

## 7. animateContentSize()

`animateContentSize()`는 **Modifier**로 사용하며, 컴포저블의 콘텐츠 크기가 변할 때 자동으로 애니메이션을 적용합니다. 별도의 상태 관리 없이도 크기 변경이 부드럽게 처리됩니다.

> **중요**: `animateContentSize()`는 **size modifier보다 앞에** 배치해야 합니다. `Modifier.animateContentSize().fillMaxWidth()`처럼 사용하면 올바르게 동작하지만, `Modifier.fillMaxWidth().animateContentSize()`는 기대와 다르게 동작할 수 있습니다.

### 펼치기/접기 카드

```kotlin
@Composable
fun ExpandableCard() {
    var isExpanded by remember { mutableStateOf(false) }

    Card(
        modifier = Modifier
            .fillMaxWidth()
            .padding(16.dp)
            .animateContentSize(  // 이 한 줄이 핵심!
                animationSpec = spring(
                    dampingRatio = Spring.DampingRatioMediumBouncy,
                    stiffness = Spring.StiffnessLow
                )
            )
            .clickable { isExpanded = !isExpanded }
    ) {
        Column(modifier = Modifier.padding(16.dp)) {
            Text(
                text = "Jetpack Compose 애니메이션",
                style = MaterialTheme.typography.titleMedium
            )
            if (isExpanded) {
                Spacer(modifier = Modifier.height(8.dp))
                Text(
                    text = "Compose는 다양한 애니메이션 API를 제공합니다. " +
                           "animate*AsState, AnimatedVisibility, Transition 등을 " +
                           "활용하여 풍부한 사용자 경험을 만들 수 있습니다. " +
                           "이 카드는 animateContentSize()를 사용하여 " +
                           "콘텐츠 크기 변경을 자동으로 애니메이션합니다.",
                    style = MaterialTheme.typography.bodyMedium
                )
            }
        }
    }
}
```

```
animateContentSize() 동작 흐름

  접힌 상태                      펼쳐진 상태
┌──────────────────┐         ┌──────────────────┐
│ 제목 텍스트       │         │ 제목 텍스트       │
│                  │  ───→   │                  │
│  높이: 56dp      │  부드럽게│ 본문 텍스트 ...   │
└──────────────────┘  전환    │                  │
                              │  높이: 160dp     │
                              └──────────────────┘
```

> **animateContentSize() vs animateDpAsState**:
> - `animateContentSize()`: 콘텐츠의 실제 크기 변화를 자동 감지하여 애니메이션
> - `animateDpAsState`: 개발자가 명시적으로 크기 값을 지정하여 애니메이션
>
> 콘텐츠가 동적으로 변하는 경우 `animateContentSize()`가 훨씬 편리합니다.

---

## 8. AnimationSpec 소개

`AnimationSpec`은 **애니메이션이 어떻게 진행될지** 를 정의합니다. 속도, 곡선, 반복 여부 등을 제어할 수 있습니다.

```
AnimationSpec 계층 구조

AnimationSpec<T>
├── spring()          ← 물리 기반 (기본값)
├── tween()           ← 시간 기반 (이징 곡선)
├── keyframes()       ← 키프레임 (구간별 제어)
├── repeatable()      ← 유한 반복
├── infiniteRepeatable()  ← 무한 반복
└── snap()            ← 즉시 전환 (애니메이션 없음)
```

| AnimationSpec | 특징 | 언제 사용? |
|---------------|------|-----------|
| `spring` | 물리 기반, 자연스러운 움직임 | **기본값**, 대부분의 상황에 적합 |
| `tween` | 시간 기반, 정해진 시간에 완료 | 정확한 시간 제어가 필요할 때 |
| `keyframes` | 구간별 세밀한 제어 | 복잡한 애니메이션 곡선이 필요할 때 |
| `repeatable` | 지정 횟수만큼 반복 | 주의 환기 애니메이션 |
| `infiniteRepeatable` | 무한 반복 | 로딩, 대기 상태 표시 |
| `snap` | 즉시 전환 | 애니메이션을 건너뛰고 싶을 때 |

사용 방법은 간단합니다. `animate*AsState`의 `animationSpec` 매개변수에 전달하면 됩니다.

```kotlin
val alpha by animateFloatAsState(
    targetValue = if (isVisible) 1f else 0f,
    animationSpec = tween(durationMillis = 500),  // 500ms 동안 전환
    label = "alpha"
)
```

---

## 9. spring: 물리 기반 애니메이션 (권장 기본값)

`spring()`은 Compose 애니메이션의 **기본이자 권장 AnimationSpec**입니다. 스프링(용수철) 물리학을 시뮬레이션하여 자연스러운 움직임을 만듭니다.

> **Compose 1.10.4 권장사항**: `spring()`은 `tween()`보다 **권장되는 기본 선택**입니다. 그 이유는:
> - **물리 기반**이므로 더 자연스러운 움직임을 제공합니다
> - **중단 가능(interruptible)**: 애니메이션 중 타겟이 변경되면 현재 속도를 유지한 채 새 타겟으로 자연스럽게 전환됩니다
> - `tween()`은 중단 시 속도 불연속이 발생할 수 있지만, `spring()`은 항상 부드럽습니다
> - 특별히 정확한 시간 제어가 필요한 경우에만 `tween()`을 사용하세요

### 두 가지 핵심 매개변수

```
dampingRatio (감쇠 비율)
━━━━━━━━━━━━━━━━━━━━━
NoBouncy (1.0)      ────────────── 목표
                                   바운스 없이 도착

LowBouncy (0.75)    ──────~─────── 목표
                           약간 바운스

MediumBouncy (0.5)  ────~──~────── 목표
                        적당히 바운스

HighBouncy (0.2)    ──~──~──~───── 목표
                      많이 바운스


stiffness (강성)
━━━━━━━━━━━━━━━━━━━━━
High      ──→ 빠르게 도달 (딱딱한 용수철)
Medium    ───→ 보통 속도
Low       ────→ 느리게 도달
VeryLow   ─────→ 아주 느리게 도달 (부드러운 용수철)
```

| 매개변수 | 설명 | 값이 클수록 |
|---------|------|-----------|
| `dampingRatio` | 진동 감쇠 정도 (0~1+) | 바운스가 줄어듦 |
| `stiffness` | 스프링의 뻣뻣함 | 빨리 목표에 도달 |

### 코드 예제

```kotlin
@Composable
fun SpringExamples() {
    var isActive by remember { mutableStateOf(false) }

    // 1. 바운스 없는 부드러운 전환
    val noBounce by animateDpAsState(
        targetValue = if (isActive) 200.dp else 48.dp,
        animationSpec = spring(
            dampingRatio = Spring.DampingRatioNoBouncy,  // 1.0
            stiffness = Spring.StiffnessMedium            // 1500
        ),
        label = "noBounce"
    )

    // 2. 탄력 있는 바운스 효과
    val bouncy by animateDpAsState(
        targetValue = if (isActive) 200.dp else 48.dp,
        animationSpec = spring(
            dampingRatio = Spring.DampingRatioMediumBouncy,  // 0.5
            stiffness = Spring.StiffnessLow                   // 200
        ),
        label = "bouncy"
    )

    // 3. 격렬한 바운스
    val highBounce by animateDpAsState(
        targetValue = if (isActive) 200.dp else 48.dp,
        animationSpec = spring(
            dampingRatio = Spring.DampingRatioHighBouncy,  // 0.2
            stiffness = Spring.StiffnessVeryLow             // 50
        ),
        label = "highBounce"
    )

    Column {
        Button(onClick = { isActive = !isActive }) {
            Text("애니메이션 시작")
        }

        // 각각의 Box에 애니메이션 적용
        Box(Modifier.width(noBounce).height(48.dp).background(Color.Blue))
        Box(Modifier.width(bouncy).height(48.dp).background(Color.Green))
        Box(Modifier.width(highBounce).height(48.dp).background(Color.Red))
    }
}
```

### Spring 상수 정리

| 상수 | 값 | 설명 |
|------|-----|------|
| `DampingRatioHighBouncy` | 0.2f | 많이 바운스 |
| `DampingRatioMediumBouncy` | 0.5f | 적당히 바운스 |
| `DampingRatioLowBouncy` | 0.75f | 약간 바운스 |
| `DampingRatioNoBouncy` | 1.0f | 바운스 없음 |
| `StiffnessHigh` | 10000f | 매우 빠름 |
| `StiffnessMedium` | 1500f | 보통 |
| `StiffnessMediumLow` | 400f | 약간 느림 |
| `StiffnessLow` | 200f | 느림 |
| `StiffnessVeryLow` | 50f | 매우 느림 |

---

## 10. tween: 시간 기반 애니메이션

`tween()`은 정해진 시간 동안 시작 값에서 끝 값으로 전환합니다. **정확한 타이밍 제어**가 필요할 때 사용합니다.

> **참고**: 대부분의 경우 `spring()`이 권장됩니다. `tween()`은 "정확히 500ms 동안 실행"처럼 시간 제어가 중요하거나, 디자인 시스템에서 정해진 duration을 따라야 할 때 선택하세요.

### 매개변수

| 매개변수 | 타입 | 기본값 | 설명 |
|---------|------|-------|------|
| `durationMillis` | Int | 300 | 애니메이션 지속 시간 (밀리초) |
| `delayMillis` | Int | 0 | 시작 전 지연 시간 (밀리초) |
| `easing` | Easing | FastOutSlowInEasing | 속도 곡선 |

### Easing 종류

```
Easing 곡선 비교 (가로: 시간, 세로: 진행률)

LinearEasing (등속)
│    ╱
│   ╱
│  ╱
│ ╱
└──────

FastOutSlowInEasing (빠르게 시작, 느리게 끝)   ← Material 기본값
│      ╱──
│    ╱
│  ╱
│╱
└──────

LinearOutSlowInEasing (등속 시작, 느리게 끝)   ← 화면 진입 시
│     ╱───
│   ╱
│  ╱
│ ╱
└──────

FastOutLinearInEasing (빠르게 시작, 등속 끝)   ← 화면 퇴장 시
│        ╱
│      ╱
│   ╱
│╱
└──────

EaseInOutCubic (느리게 시작, 느리게 끝)
│      ╱──
│    ╱
│   │
│╱
└──────
```

### 코드 예제

```kotlin
@Composable
fun TweenExample() {
    var isExpanded by remember { mutableStateOf(false) }

    // 500ms 동안 FastOutSlowInEasing으로 전환
    val width by animateDpAsState(
        targetValue = if (isExpanded) 300.dp else 100.dp,
        animationSpec = tween(
            durationMillis = 500,
            delayMillis = 0,
            easing = FastOutSlowInEasing
        ),
        label = "width"
    )

    Box(
        modifier = Modifier
            .width(width)
            .height(60.dp)
            .background(Color.Magenta, RoundedCornerShape(12.dp))
            .clickable { isExpanded = !isExpanded },
        contentAlignment = Alignment.Center
    ) {
        Text("탭하세요", color = Color.White)
    }
}
```

### 진입/퇴장에 적합한 Easing 선택 가이드

| 상황 | 권장 Easing | 이유 |
|------|------------|------|
| 화면 진입 | `LinearOutSlowInEasing` | 빠르게 등장, 제자리에 부드럽게 안착 |
| 화면 퇴장 | `FastOutLinearInEasing` | 빠르게 가속하며 사라짐 |
| 화면 내 전환 | `FastOutSlowInEasing` | 자연스러운 시작과 끝 |
| 등속이 필요할 때 | `LinearEasing` | 프로그레스 바 등 |

---

## 11. keyframes, repeatable, snap

### keyframes: 구간별 세밀한 제어

`keyframes`를 사용하면 특정 시간에 특정 값을 지정할 수 있습니다.

```kotlin
@Composable
fun KeyframesExample() {
    var isBig by remember { mutableStateOf(false) }

    val size by animateDpAsState(
        targetValue = if (isBig) 200.dp else 50.dp,
        animationSpec = keyframes {
            durationMillis = 1000
            // 0ms: 시작 값
            100.dp at 200 using LinearEasing      // 200ms에 100dp
            150.dp at 400 using FastOutSlowInEasing // 400ms에 150dp
            120.dp at 700                          // 700ms에 120dp (기본 easing)
            // 1000ms: targetValue에 도달
        },
        label = "keyframe"
    )

    Box(
        modifier = Modifier
            .size(size)
            .background(Color.Red, CircleShape)
            .clickable { isBig = !isBig }
    )
}
```

```
keyframes 시각화 (시간 → 크기)

200dp ┤
150dp ┤            ●
120dp ┤                    ●
100dp ┤      ●                       ●(또는 200dp)
 50dp ┤●
      └──────────────────────────────
      0ms   200ms  400ms  700ms  1000ms
```

### repeatable: 유한 반복

```kotlin
@Composable
fun RepeatableExample() {
    var isShaking by remember { mutableStateOf(false) }

    val offsetX by animateFloatAsState(
        targetValue = if (isShaking) 0f else 0f,
        animationSpec = if (isShaking) {
            repeatable(
                iterations = 3,                     // 3번 반복
                animation = tween(durationMillis = 100),
                repeatMode = RepeatMode.Reverse     // 왕복
            )
        } else {
            snap()
        },
        label = "shake"
    )

    // 실제 흔들림 효과는 Animatable로 더 정밀하게 구현 가능
    // 여기서는 repeatable의 개념만 보여줍니다
}
```

| RepeatMode | 설명 |
|------------|------|
| `RepeatMode.Restart` | 처음부터 다시 시작 (0 → 1, 0 → 1, 0 → 1) |
| `RepeatMode.Reverse` | 왕복 (0 → 1, 1 → 0, 0 → 1) |

### snap: 즉시 전환

```kotlin
val alpha by animateFloatAsState(
    targetValue = if (isVisible) 1f else 0f,
    animationSpec = snap(delayMillis = 200),  // 200ms 후 즉시 전환
    label = "snap"
)
```

> `snap()`은 애니메이션 없이 즉시 값을 변경합니다. 지연 시간만 선택적으로 줄 수 있습니다.
> 테스트 환경이나 접근성 설정에서 애니메이션을 비활성화할 때 유용합니다.

---

## 12. 정리

| 핵심 개념 | 설명 |
|-----------|------|
| `animate*AsState` | 타겟 값 변경 시 자동으로 애니메이션되는 상태 |
| `animateContentSize()` | 콘텐츠 크기 변화를 자동 감지하여 애니메이션하는 Modifier |
| `spring()` | 물리 기반 애니메이션 (**권장 기본값**, 자연스럽고 중단 가능) |
| `tween()` | 시간 기반 애니메이션 (정확한 타이밍 제어가 필요할 때) |
| `keyframes` | 구간별 세밀한 값 제어 |
| `repeatable` | 유한 반복 애니메이션 |
| `snap` | 즉시 전환 (애니메이션 없음) |

### 어떤 API를 선택해야 할까?

```
간단한 값 변경?
├── YES → animate*AsState + spring() (권장 기본값, 중단 가능)
│         ├── 정확한 시간 제어 필요? → tween()
│         ├── 구간별 제어 필요? → keyframes
│         └── 반복 필요? → repeatable / infiniteRepeatable
│
└── 콘텐츠 크기 변경? → animateContentSize() (size modifier보다 먼저 배치)

성능 최적화: 항상 람다 기반 Modifier 사용
├── 투명도/회전/스케일 → Modifier.graphicsLayer { ... }
├── 배경색 → Modifier.drawBehind { ... }
└── 오프셋 → Modifier.offset { ... }
```

### 다음 단계

다음 문서에서는 **AnimatedVisibility**, **AnimatedContent**, **Transition API** 등 더 풍부한 전환 애니메이션을 배웁니다.

> [다음: 02. 전환과 가시성 애니메이션 →](02-transition-and-visibility.md)
