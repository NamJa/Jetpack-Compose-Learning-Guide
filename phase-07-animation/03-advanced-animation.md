# 고급 애니메이션 기법

> **"좋은 애니메이션은 눈에 띄지 않는다. 나쁜 애니메이션만 눈에 띈다."**
>
> 기본 API로 충분하지 않을 때, Compose는 더 세밀한 제어를 위한 도구를 제공합니다.
> 이 문서에서는 Animatable, 감쇠 애니메이션, 공유 요소 전환, 그리고 성능 최적화 기법을 다룹니다.

---

## 목차

1. [Animatable: 세밀한 애니메이션 제어](#1-animatable-세밀한-애니메이션-제어)
2. [animateTo, snapTo, animateDecay](#2-animateto-snapto-animatedecay)
3. [타겟 기반 vs 감쇠(Decay) 애니메이션](#3-타겟-기반-vs-감쇠decay-애니메이션)
4. [공유 요소 전환 (Shared Element Transition)](#4-공유-요소-전환-shared-element-transition)
5. [커스텀 keyframes 애니메이션](#5-커스텀-keyframes-애니메이션)
6. [애니메이션 테스트](#6-애니메이션-테스트)
7. [Android Studio 애니메이션 미리보기 도구](#7-android-studio-애니메이션-미리보기-도구)
8. [MotionScheme (Material3 1.4.0)](#8-motionscheme-material3-140)
9. [성능 팁: 리컴포지션 최소화](#9-성능-팁-리컴포지션-최소화)
10. [정리](#10-정리)

---

## 1. Animatable: 세밀한 애니메이션 제어

`Animatable`은 `animate*AsState`보다 **더 세밀한 제어**를 제공하는 저수준 API입니다. 애니메이션 중간에 타겟을 변경하거나, 즉시 값을 바꾸거나, 감쇠 애니메이션을 적용할 수 있습니다.

```
animate*AsState vs Animatable

animate*AsState (고수준)
┌─────────────────────────────┐
│  targetValue만 지정하면 끝   │
│  자동으로 애니메이션 실행     │
│  간단하지만 제어 제한적       │
└─────────────────────────────┘

Animatable (저수준)
┌─────────────────────────────────┐
│  animateTo() — 애니메이션 이동   │
│  snapTo()    — 즉시 이동         │
│  animateDecay() — 감쇠 이동      │
│  stop()      — 애니메이션 중지    │
│  value       — 현재 값 읽기      │
│  velocity    — 현재 속도 읽기     │
│                                 │
│  → 완전한 제어, 코루틴 기반       │
└─────────────────────────────────┘
```

| 비교 | `animate*AsState` | `Animatable` |
|------|-------------------|-------------|
| 사용 난이도 | 쉬움 | 보통 |
| 제어 수준 | 타겟 값만 설정 | animateTo, snapTo, stop 등 |
| 코루틴 필요 | 불필요 | 필요 (suspend 함수) |
| 중간 타겟 변경 | 자동 처리 | 수동 제어 가능 |
| 감쇠 애니메이션 | 불가 | animateDecay로 가능 |
| 바운더리(경계) 설정 | 불가 | updateBounds로 가능 |

---

## 2. animateTo, snapTo, animateDecay

### animateTo: 타겟까지 애니메이션

```kotlin
@Composable
fun AnimatableExample() {
    val offsetX = remember { Animatable(0f) }
    val scope = rememberCoroutineScope()

    Box(
        modifier = Modifier
            .offset { IntOffset(offsetX.value.roundToInt(), 0) }
            .size(60.dp)
            .background(Color.Blue, CircleShape)
            .clickable {
                scope.launch {
                    // 300f까지 애니메이션으로 이동
                    offsetX.animateTo(
                        targetValue = 300f,
                        animationSpec = spring(
                            dampingRatio = Spring.DampingRatioMediumBouncy,
                            stiffness = Spring.StiffnessLow
                        )
                    )
                }
            }
    )
}
```

### snapTo: 즉시 값 변경 (애니메이션 없음)

```kotlin
scope.launch {
    // 애니메이션 없이 즉시 0f로 이동 (리셋)
    offsetX.snapTo(0f)
}
```

### stop: 진행 중인 애니메이션 중지

```kotlin
scope.launch {
    offsetX.stop()  // 현재 위치에서 즉시 멈춤
}
```

### 종합 예제: 드래그 가능한 카드

```kotlin
@Composable
fun DraggableCard() {
    val offsetX = remember { Animatable(0f) }
    val scope = rememberCoroutineScope()

    Card(
        modifier = Modifier
            .offset { IntOffset(offsetX.value.roundToInt(), 0) }
            .fillMaxWidth(0.8f)
            .padding(16.dp)
            .pointerInput(Unit) {
                detectHorizontalDragGestures(
                    onDragEnd = {
                        scope.launch {
                            // 드래그 끝나면 원래 위치로 돌아감
                            offsetX.animateTo(
                                targetValue = 0f,
                                animationSpec = spring(
                                    dampingRatio = Spring.DampingRatioMediumBouncy
                                )
                            )
                        }
                    },
                    onHorizontalDrag = { _, dragAmount ->
                        scope.launch {
                            // 드래그 중에는 즉시 따라감
                            offsetX.snapTo(offsetX.value + dragAmount)
                        }
                    }
                )
            }
    ) {
        Text("드래그 해보세요!", modifier = Modifier.padding(24.dp))
    }
}
```

---

## 3. 타겟 기반 vs 감쇠(Decay) 애니메이션

### 타겟 기반 애니메이션

정해진 **목표 값**으로 이동합니다. 지금까지 배운 대부분의 애니메이션이 이 방식입니다.

```
타겟 기반: "300f까지 가라"

시작 ──────────────→ 300f (타겟)
      속도가 조절됨
```

### 감쇠(Decay) 애니메이션

목표 값 없이 **초기 속도로 시작하여 마찰에 의해 점점 느려지다가 멈춥니다**. 플링(fling) 제스처에 적합합니다.

```
감쇠(Decay): "현재 속도로 굴러가다가 멈춰라"

시작 ──→──→──→──→─→─→─→→→→ 멈춤
  빠름              점점 느려짐
                    (마찰에 의해)
```

### animateDecay 코드 예제

```kotlin
@Composable
fun FlingExample() {
    val offsetX = remember { Animatable(0f) }
    val scope = rememberCoroutineScope()

    // 감쇠 애니메이션 스펙 (마찰 계수)
    val decay = rememberSplineBasedDecay<Float>()

    Box(
        modifier = Modifier
            .offset { IntOffset(offsetX.value.roundToInt(), 0) }
            .size(60.dp)
            .background(Color.Red, CircleShape)
            .pointerInput(Unit) {
                detectHorizontalDragGestures(
                    onDragEnd = { velocity ->
                        scope.launch {
                            // 드래그가 끝났을 때의 속도로 감쇠 애니메이션 시작
                            offsetX.animateDecay(
                                initialVelocity = velocity,
                                animationSpec = decay
                            )
                        }
                    },
                    onHorizontalDrag = { _, dragAmount ->
                        scope.launch {
                            offsetX.snapTo(offsetX.value + dragAmount)
                        }
                    }
                )
            }
    )
}
```

### 바운더리(경계) 설정

`Animatable`은 `updateBounds`로 값의 범위를 제한할 수 있습니다. 감쇠 애니메이션이 화면 밖으로 나가지 않도록 합니다.

```kotlin
val offsetX = remember { Animatable(0f) }

// 0f ~ 500f 범위로 제한
LaunchedEffect(Unit) {
    offsetX.updateBounds(
        lowerBound = 0f,
        upperBound = 500f
    )
}
```

---

## 4. 공유 요소 전환 (Shared Element Transition)

공유 요소 전환은 **화면 전환 시 동일한 요소가 한 위치에서 다른 위치로 자연스럽게 이동**하는 효과입니다. 예를 들어, 리스트의 이미지가 상세 화면의 큰 이미지로 변환되는 것입니다.

```
공유 요소 전환 시각화

  리스트 화면                    상세 화면
┌──────────────┐           ┌──────────────┐
│ ┌────┐       │           │              │
│ │ 🖼 │ 제목  │           │   ┌──────┐   │
│ └────┘       │  ───→     │   │  🖼  │   │
│              │  전환      │   │      │   │
│ ┌────┐       │           │   └──────┘   │
│ │ 🖼 │ 제목  │           │   제목        │
│ └────┘       │           │   본문 ...    │
└──────────────┘           └──────────────┘

  작은 이미지가 큰 이미지로 자연스럽게 이동+확대
```

### Compose에서의 구현 (Compose 1.8+)

```kotlin
@Composable
fun SharedElementExample() {
    var showDetails by remember { mutableStateOf(false) }

    SharedTransitionLayout {
        AnimatedContent(
            targetState = showDetails,
            label = "sharedElement"
        ) { isDetails ->
            if (!isDetails) {
                // 리스트 아이템
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .clickable { showDetails = true }
                        .padding(16.dp)
                ) {
                    Image(
                        painter = painterResource(R.drawable.sample),
                        contentDescription = null,
                        modifier = Modifier
                            .size(60.dp)
                            .sharedElement(
                                state = rememberSharedContentState(key = "image"),
                                animatedVisibilityScope = this@AnimatedContent
                            )
                    )
                    Spacer(Modifier.width(16.dp))
                    Text(
                        text = "아이템 제목",
                        modifier = Modifier.sharedBounds(
                            sharedContentState = rememberSharedContentState(key = "title"),
                            animatedVisibilityScope = this@AnimatedContent
                        )
                    )
                }
            } else {
                // 상세 화면
                Column(
                    modifier = Modifier
                        .fillMaxSize()
                        .clickable { showDetails = false }
                        .padding(16.dp)
                ) {
                    Image(
                        painter = painterResource(R.drawable.sample),
                        contentDescription = null,
                        modifier = Modifier
                            .fillMaxWidth()
                            .height(200.dp)
                            .sharedElement(
                                state = rememberSharedContentState(key = "image"),
                                animatedVisibilityScope = this@AnimatedContent
                            )
                    )
                    Spacer(Modifier.height(16.dp))
                    Text(
                        text = "아이템 제목",
                        style = MaterialTheme.typography.headlineMedium,
                        modifier = Modifier.sharedBounds(
                            sharedContentState = rememberSharedContentState(key = "title"),
                            animatedVisibilityScope = this@AnimatedContent
                        )
                    )
                    Text("상세 설명이 여기에 들어갑니다...")
                }
            }
        }
    }
}
```

### 핵심 컴포넌트

| 컴포넌트 | 역할 |
|---------|------|
| `SharedTransitionLayout` | 공유 요소 전환의 범위를 정의하는 레이아웃 |
| `sharedElement` | 동일한 요소로 매칭 (크기와 위치가 정확히 전환) |
| `sharedBounds` | 영역 단위로 매칭 (내용이 바뀌어도 영역이 전환) |
| `rememberSharedContentState(key)` | 공유 요소를 식별하는 키 |

> **sharedElement vs sharedBounds**:
> - `sharedElement`: 이미지처럼 **같은 콘텐츠**가 크기/위치만 바뀔 때
> - `sharedBounds`: 텍스트처럼 **콘텐츠가 바뀌지만 같은 역할**을 할 때

### Navigation Compose와 SharedTransitionLayout 통합

실제 앱에서는 `AnimatedContent` 대신 Navigation Compose의 `NavHost`와 함께 사용하는 패턴이 일반적입니다:

```kotlin
SharedTransitionLayout {
    NavHost(navController, startDestination = ListRoute) {
        composable<ListRoute> {
            SharedTransitionScope { animatedVisibilityScope ->
                ListScreen(
                    onItemClick = { itemId -> navController.navigate(DetailRoute(itemId)) },
                    sharedTransitionScope = this@SharedTransitionLayout,
                    animatedVisibilityScope = animatedVisibilityScope
                )
            }
        }
        composable<DetailRoute> {
            SharedTransitionScope { animatedVisibilityScope ->
                DetailScreen(
                    sharedTransitionScope = this@SharedTransitionLayout,
                    animatedVisibilityScope = animatedVisibilityScope
                )
            }
        }
    }
}
```

이 패턴을 사용하면 실제 네비게이션 전환에서 리스트 아이템이 상세 화면으로 자연스럽게 이동하는 효과를 구현할 수 있습니다.

---

## 5. 커스텀 keyframes 애니메이션

`keyframes`를 활용하면 시간축 위에서 구간별로 다른 값과 이징을 적용하여 복잡한 애니메이션을 만들 수 있습니다.

### 통통 튀는 효과 (Bounce)

```kotlin
@Composable
fun BounceEffect() {
    var isBouncing by remember { mutableStateOf(false) }

    val offsetY by animateDpAsState(
        targetValue = 0.dp,
        animationSpec = if (isBouncing) {
            keyframes {
                durationMillis = 600
                0.dp at 0                              // 시작
                (-40).dp at 150 using FastOutSlowInEasing  // 위로 점프
                0.dp at 300                              // 원위치
                (-20).dp at 400 using FastOutSlowInEasing  // 작은 점프
                0.dp at 500                              // 원위치
                (-5).dp at 550                            // 아주 작은 점프
                0.dp at 600                              // 최종 원위치
            }
        } else {
            snap()
        },
        label = "bounce",
        finishedListener = { isBouncing = false }
    )

    Box(
        modifier = Modifier
            .offset(y = offsetY)
            .size(80.dp)
            .background(Color(0xFF4CAF50), CircleShape)
            .clickable { isBouncing = true },
        contentAlignment = Alignment.Center
    ) {
        Text("탭!", color = Color.White, fontWeight = FontWeight.Bold)
    }
}
```

```
Bounce keyframes 시각화 (시간 → Y 오프셋)

  0dp ┤●─────────●─────────●──────●──●
      │          │         │      │
-5dp  ┤          │         │      ●
      │          │         │
-20dp ┤          │         ●
      │          │
-40dp ┤          ●
      └──────────────────────────────
      0    150   300  400  500 550 600ms
```

### 주의를 끄는 벨 흔들기

```kotlin
@Composable
fun ShakeBell() {
    var isShaking by remember { mutableStateOf(false) }

    val rotation by animateFloatAsState(
        targetValue = 0f,
        animationSpec = if (isShaking) {
            keyframes {
                durationMillis = 500
                0f at 0
                15f at 50
                (-15f) at 100
                10f at 200
                (-10f) at 300
                5f at 400
                0f at 500
            }
        } else {
            snap()
        },
        label = "shake",
        finishedListener = { isBouncing -> isShaking = false }
    )

    Icon(
        imageVector = Icons.Default.Notifications,
        contentDescription = "알림",
        modifier = Modifier
            .size(48.dp)
            .graphicsLayer { rotationZ = rotation }
            .clickable { isShaking = true }
    )
}
```

---

## 6. 애니메이션 테스트

Compose의 테스트 프레임워크는 애니메이션을 제어하고 검증할 수 있는 도구를 제공합니다.

### ComposeTestRule로 애니메이션 테스트

```kotlin
@get:Rule
val composeTestRule = createComposeRule()

@Test
fun animatedVisibility_hidesContent_whenToggled() {
    var isVisible by mutableStateOf(true)

    composeTestRule.setContent {
        AnimatedVisibility(visible = isVisible) {
            Text("Hello", modifier = Modifier.testTag("greeting"))
        }
    }

    // 1. 처음에는 보여야 함
    composeTestRule.onNodeWithTag("greeting").assertIsDisplayed()

    // 2. 상태 변경
    isVisible = false

    // 3. 애니메이션 시계를 끝까지 진행
    composeTestRule.mainClock.advanceTimeBy(500L)

    // 4. 사라졌는지 확인
    composeTestRule.onNodeWithTag("greeting").assertDoesNotExist()
}
```

### 시간 제어 API

| API | 설명 |
|-----|------|
| `mainClock.advanceTimeBy(ms)` | 지정 밀리초만큼 시간을 진행 |
| `mainClock.advanceTimeByFrame()` | 한 프레임(16ms)만큼 진행 |
| `mainClock.autoAdvance = false` | 자동 시간 진행 비활성화 (수동 제어) |

### 프레임 단위 검증

```kotlin
@Test
fun animateFloat_reachesTarget_after300ms() {
    var isActive by mutableStateOf(false)
    lateinit var currentAlpha: State<Float>

    composeTestRule.mainClock.autoAdvance = false  // 수동 제어 모드

    composeTestRule.setContent {
        currentAlpha = animateFloatAsState(
            targetValue = if (isActive) 1f else 0f,
            animationSpec = tween(durationMillis = 300),
            label = "alpha"
        )
        Box(Modifier.graphicsLayer { alpha = currentAlpha.value })
    }

    // 상태 변경
    isActive = true
    composeTestRule.mainClock.advanceTimeByFrame()  // 변경 반영

    // 150ms 지점: 중간값 확인
    composeTestRule.mainClock.advanceTimeBy(150L)
    assert(currentAlpha.value > 0f && currentAlpha.value < 1f) {
        "150ms 지점에서 alpha는 0과 1 사이여야 합니다: ${currentAlpha.value}"
    }

    // 300ms 이후: 최종값 확인
    composeTestRule.mainClock.advanceTimeBy(200L)
    assert(currentAlpha.value == 1f) {
        "300ms 이후 alpha는 1이어야 합니다: ${currentAlpha.value}"
    }
}
```

> **팁**: `mainClock.autoAdvance = false`로 설정하면 시간이 자동으로 흐르지 않아,
> 애니메이션의 중간 상태를 프레임 단위로 검증할 수 있습니다.

---

## 7. Android Studio 애니메이션 미리보기 도구

Android Studio는 Compose 애니메이션을 시각적으로 확인할 수 있는 **Animation Preview** 도구를 제공합니다.

### 애니메이션 미리보기 사용법

```kotlin
// 1. @Preview를 가진 Composable에서 updateTransition을 사용
@Preview
@Composable
fun AnimationPreviewExample() {
    var state by remember { mutableStateOf(false) }

    val transition = updateTransition(targetState = state, label = "preview")

    val color by transition.animateColor(label = "color") { isActive ->
        if (isActive) Color.Green else Color.Gray
    }

    val size by transition.animateDp(label = "size") { isActive ->
        if (isActive) 100.dp else 50.dp
    }

    Box(
        modifier = Modifier
            .size(size)
            .background(color, CircleShape)
            .clickable { state = !state }
    )
}
```

### Animation Preview 패널 기능

```
Android Studio → @Preview 위에 마우스 → "Start Animation Preview" 클릭

┌─────────────────────────────────────────┐
│  Animation Preview 패널                  │
│                                         │
│  [▶ 재생] [⏸ 일시정지] [⏪ 처음으로]      │
│                                         │
│  타임라인: ─────●──────────────          │
│              150ms                       │
│                                         │
│  ┌─ color ─────────────────────┐        │
│  │  Gray ───→ Green            │        │
│  └────────────────────────────┘        │
│                                         │
│  ┌─ size ──────────────────────┐        │
│  │  50dp ───→ 100dp            │        │
│  └────────────────────────────┘        │
│                                         │
│  각 값의 곡선 그래프와 현재 값 표시       │
└─────────────────────────────────────────┘
```

| 기능 | 설명 |
|------|------|
| 타임라인 스크러빙 | 슬라이더로 원하는 시점의 애니메이션 상태 확인 |
| 상태 전환 | 시작 상태와 종료 상태 사이를 왔다 갔다 전환 |
| 속도 조절 | 느리게/빠르게 재생하여 세부 동작 확인 |
| 값 그래프 | 각 애니메이션 값의 변화 곡선 시각화 |

> **팁**: `updateTransition`에 `label`을 잘 지정하면 Animation Preview에서 각 값을 구분하기 쉽습니다.

---

## 8. MotionScheme (Material3 1.4.0)

Material3 1.4.0에서 **MotionScheme**이 실험적 API에서 **안정 API**로 승격되었습니다. MotionScheme은 앱 전체에서 일관된 모션을 보장하는 Material Design의 애니메이션 체계입니다.

### MotionScheme이란?

Material3의 모든 컴포넌트(BottomSheet, NavigationDrawer, FAB 등)는 내부적으로 MotionScheme을 사용하여 일관된 애니메이션을 적용합니다. 별도 설정 없이도 Material3 컴포넌트는 자동으로 적절한 모션이 적용됩니다.

### 커스텀 MotionScheme 제공

앱 전체의 모션 특성을 커스터마이징하려면 `MaterialTheme`을 통해 커스텀 MotionScheme을 제공할 수 있습니다:

```kotlin
MaterialTheme(
    motionScheme = MotionScheme(
        defaultSpatialSpec = { spring(stiffness = Spring.StiffnessMediumLow) },
        fastSpatialSpec = { spring(stiffness = Spring.StiffnessMedium) },
        slowSpatialSpec = { spring(stiffness = Spring.StiffnessLow) },
        defaultEffectsSpec = { spring(stiffness = Spring.StiffnessMediumLow) },
        fastEffectsSpec = { spring(stiffness = Spring.StiffnessMedium) },
        slowEffectsSpec = { spring(stiffness = Spring.StiffnessLow) }
    )
) {
    // 앱 컨텐츠 - 모든 Material3 컴포넌트가 이 MotionScheme을 사용
}
```

### MotionScheme 값 참조

직접 애니메이션을 구현할 때도 MotionScheme의 값을 참조하면 앱 전체에서 일관된 모션을 유지할 수 있습니다:

```kotlin
val animatedValue by animateDpAsState(
    targetValue = targetDp,
    animationSpec = MaterialTheme.motionScheme.defaultSpatialSpec(),
    label = "consistent-motion"
)
```

> **요약**: MotionScheme은 앱의 ColorScheme이나 Typography처럼, 모션에 대한 **디자인 토큰 시스템**입니다. Material3 컴포넌트는 자동으로 적용되며, 커스텀 애니메이션에서도 참조하여 일관성을 유지하세요.

---

## 9. 성능 팁: 리컴포지션 최소화

애니메이션은 매 프레임(약 16ms)마다 값을 업데이트합니다. 잘못 구현하면 **매 프레임마다 불필요한 리컴포지션**이 발생하여 프레임 드롭(버벅거림)이 생깁니다.

### Compose의 세 단계 이해

```
Compose 렌더링 파이프라인

┌──────────────┐   ┌──────────────┐   ┌──────────────┐
│  Composition │──→│    Layout    │──→│   Drawing    │
│  (리컴포지션)  │   │  (크기/위치)  │   │   (그리기)    │
└──────────────┘   └──────────────┘   └──────────────┘
     비용: 높음          비용: 중간          비용: 낮음

목표: 가능한 한 뒤쪽 단계에서만 변경이 일어나도록 만든다!
```

### 나쁜 예: 매 프레임마다 리컴포지션

```kotlin
// 나쁜 예 — 매 프레임마다 리컴포지션 발생!
@Composable
fun BadAnimation() {
    val alpha by animateFloatAsState(targetValue = 1f, label = "alpha")

    // alpha 값이 바뀔 때마다 Modifier.alpha()가 변경되고
    // 전체 컴포저블이 리컴포지션됩니다
    Box(
        modifier = Modifier
            .size(100.dp)
            .alpha(alpha)  // Composition 단계에서 읽힘 → 리컴포지션!
            .background(Color.Blue)
    )
}
```

### 좋은 예: Drawing 단계에서만 변경

```kotlin
// 좋은 예 — Drawing 단계에서만 업데이트, 리컴포지션 없음!
@Composable
fun GoodAnimation() {
    val alpha by animateFloatAsState(targetValue = 1f, label = "alpha")

    Box(
        modifier = Modifier
            .size(100.dp)
            .graphicsLayer { this.alpha = alpha }  // Drawing 단계에서 읽힘
            .background(Color.Blue)
    )
}
```

### 핵심 원칙: 상태 읽기를 최대한 늦춰라

| 방법 | 단계 | 리컴포지션 | 성능 |
|------|------|-----------|------|
| `Modifier.alpha(alpha)` | Composition | 매 프레임 | 느림 |
| `Modifier.graphicsLayer { this.alpha = alpha }` | Drawing | 없음 | 빠름 |
| `Modifier.offset(x, y)` | Composition | 매 프레임 | 느림 |
| `Modifier.offset { IntOffset(x, y) }` | Layout | 없음 | 빠름 |
| `Modifier.graphicsLayer { translationX = x }` | Drawing | 없음 | 가장 빠름 |

### 자주 쓰는 최적화 패턴

```kotlin
// 1. offset: 람다 버전 사용 (Layout 단계에서 읽기)
Box(
    modifier = Modifier.offset {
        IntOffset(animatedX.value.roundToInt(), 0)
    }
)

// 2. graphicsLayer: 회전, 투명도, 스케일 등 (Drawing 단계에서 읽기)
Box(
    modifier = Modifier.graphicsLayer {
        rotationZ = animatedRotation.value
        scaleX = animatedScale.value
        scaleY = animatedScale.value
        alpha = animatedAlpha.value
    }
)

// 3. drawBehind: 배경색 변경 (Drawing 단계에서 읽기)
Box(
    modifier = Modifier.drawBehind {
        drawRect(color = animatedColor.value)
    }
)
```

### 성능 체크리스트

```
애니메이션 성능 최적화 순서

1. graphicsLayer{} 안에서 값을 읽을 수 있는가?
   ├── YES → graphicsLayer 사용 (alpha, rotation, scale, translation)
   └── NO  → 다음 확인

2. offset{} 람다 버전을 사용할 수 있는가?
   ├── YES → offset {} 사용
   └── NO  → 다음 확인

3. drawBehind{} 안에서 처리할 수 있는가?
   ├── YES → drawBehind 사용
   └── NO  → Composition 단계에서 읽기 (불가피)
```

---

## 9. 정리

| 핵심 개념 | 설명 |
|-----------|------|
| `Animatable` | 코루틴 기반 저수준 애니메이션 (animateTo, snapTo, animateDecay) |
| `animateDecay` | 초기 속도로 시작하여 마찰에 의해 감속하는 물리 기반 애니메이션 |
| `updateBounds` | Animatable의 값 범위를 제한 |
| `SharedTransitionLayout` | 공유 요소 전환의 범위를 정의 |
| `sharedElement` / `sharedBounds` | 화면 간 동일 요소의 연속적 전환 |
| `keyframes` | 시간축 위에서 구간별 세밀한 값 제어 |
| `graphicsLayer` | Drawing 단계에서 값을 읽어 리컴포지션 방지 |
| Animation Preview | Android Studio에서 애니메이션을 시각적으로 디버깅 |

### 전체 애니메이션 API 선택 가이드

```
단일 값 애니메이션?
├── 간단한 경우 → animate*AsState
├── 세밀한 제어 필요 → Animatable
└── 감쇠(플링) → Animatable.animateDecay

보이기/숨기기?
└── AnimatedVisibility (+ Enter/ExitTransition)

컨텐츠 교체?
├── 페이드만 → Crossfade
└── 다양한 전환 → AnimatedContent

여러 값 동시 제어?
└── updateTransition

무한 반복?
└── rememberInfiniteTransition

화면 간 공유 요소?
└── SharedTransitionLayout + sharedElement/sharedBounds
```

### 다음 단계

애니메이션 파트를 마쳤습니다! 다음 Phase에서는 **터치와 제스처**를 배웁니다. 클릭, 스크롤, 드래그 등 사용자 입력을 처리하는 방법을 단계별로 익힙니다.

> [다음: Phase 8 - 01. 클릭과 탭 처리 →](../phase-08-touch-and-gestures/01-click-and-tap.md)
