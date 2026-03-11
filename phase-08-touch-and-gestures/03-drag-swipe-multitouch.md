# 드래그, 스와이프, 멀티 터치

> **"제스처는 사용자의 의도를 물리적으로 표현하는 방법이다."**
>
> 드래그로 카드를 옮기고, 스와이프로 메시지를 삭제하고, 핀치로 사진을 확대하는 동작은
> 모바일 앱의 핵심 상호작용입니다.
> 이 문서에서는 Compose에서 드래그, 스와이프, 멀티 터치 제스처를 구현하는 방법을 배웁니다.

---

## 목차

1. [draggable 수정자: 단일 축 드래그](#1-draggable-수정자-단일-축-드래그)
2. [pointerInput + detectDragGestures: 2D 드래그](#2-pointerinput--detectdraggestures-2d-드래그)
3. [anchoredDraggable: 스와이프 동작](#3-anchoreddraggable-스와이프-동작)
4. [transformable 수정자: 이동, 회전, 확대/축소](#4-transformable-수정자-이동-회전-확대축소)
5. [멀티 터치: detectTransformGestures](#5-멀티-터치-detecttransformgestures)
6. [이벤트 소비와 전파](#6-이벤트-소비와-전파)
7. [이벤트 전달 흐름: Initial, Main, Final Pass](#7-이벤트-전달-흐름-initial-main-final-pass)
8. [테스트: performTouchInput](#8-테스트-performtouchinput)
9. [정리](#9-정리)

---

## 1. draggable 수정자: 단일 축 드래그

`draggable`은 **한 축 방향(수평 또는 수직)** 으로만 드래그를 처리하는 수정자입니다. 슬라이더, 드로어, 진행 표시줄 등에 적합합니다.

```
draggable 동작

  수평 드래그 (Orientation.Horizontal)
  ←───────●───────→

  수직 드래그 (Orientation.Vertical)
       ↑
       │
       ●
       │
       ↓
```

### 기본 사용법

```kotlin [compose-playground]
@Composable
fun HorizontalDragExample() {
    var offsetX by remember { mutableFloatStateOf(0f) }

    Box(
        modifier = Modifier
            .offset { IntOffset(offsetX.roundToInt(), 0) }
            .size(60.dp)
            .background(Color.Blue, CircleShape)
            .draggable(
                orientation = Orientation.Horizontal,
                state = rememberDraggableState { delta ->
                    // delta: 이전 프레임 대비 이동량 (픽셀)
                    offsetX += delta
                }
            )
    )
}
```

### 드래그 콜백

```kotlin [compose-playground]
Box(
    modifier = Modifier.draggable(
        orientation = Orientation.Horizontal,
        state = rememberDraggableState { delta ->
            offsetX += delta  // 드래그 중 매 프레임 호출
        },
        onDragStarted = { startOffset ->
            // 드래그 시작 시 (suspend 함수)
            println("드래그 시작: $startOffset")
        },
        onDragStopped = { velocity ->
            // 드래그 종료 시 (suspend 함수)
            // velocity: 마지막 속도 (플링 처리에 활용 가능)
            println("드래그 종료, 속도: $velocity")
        }
    )
)
```

### 범위 제한이 있는 드래그

```kotlin [compose-playground]
@Composable
fun BoundedDragExample() {
    var offsetX by remember { mutableFloatStateOf(0f) }
    val maxOffset = with(LocalDensity.current) { 200.dp.toPx() }

    Box(
        modifier = Modifier
            .offset { IntOffset(offsetX.roundToInt(), 0) }
            .size(60.dp)
            .background(Color.Green, CircleShape)
            .draggable(
                orientation = Orientation.Horizontal,
                state = rememberDraggableState { delta ->
                    // 0 ~ maxOffset 범위로 제한
                    offsetX = (offsetX + delta).coerceIn(0f, maxOffset)
                }
            )
    )
}
```

---

## 2. pointerInput + detectDragGestures: 2D 드래그

`draggable`은 한 축만 지원합니다. **자유로운 2D 드래그**가 필요하다면 `pointerInput` + `detectDragGestures`를 사용합니다.

### 기본 2D 드래그

```kotlin [compose-playground]
@Composable
fun FreeDragExample() {
    var offsetX by remember { mutableFloatStateOf(0f) }
    var offsetY by remember { mutableFloatStateOf(0f) }

    Box(
        modifier = Modifier
            .offset { IntOffset(offsetX.roundToInt(), offsetY.roundToInt()) }
            .size(80.dp)
            .background(Color.Red, RoundedCornerShape(12.dp))
            .pointerInput(Unit) {
                detectDragGestures { change, dragAmount ->
                    change.consume()  // 이벤트 소비
                    offsetX += dragAmount.x
                    offsetY += dragAmount.y
                }
            },
        contentAlignment = Alignment.Center
    ) {
        Text("드래그", color = Color.White, fontWeight = FontWeight.Bold)
    }
}
```

### detectDragGestures의 콜백

```kotlin [compose-playground]
Modifier.pointerInput(Unit) {
    detectDragGestures(
        onDragStart = { offset ->
            // 드래그 시작 좌표
            println("시작: $offset")
        },
        onDragEnd = {
            // 드래그 종료
            println("종료")
        },
        onDragCancel = {
            // 드래그 취소 (다른 제스처가 가로챈 경우)
            println("취소")
        },
        onDrag = { change, dragAmount ->
            // 매 프레임 호출
            // change: PointerInputChange (좌표, 시간, 압력 등)
            // dragAmount: Offset (x, y 이동량)
            change.consume()
            offsetX += dragAmount.x
            offsetY += dragAmount.y
        }
    )
}
```

### 수평/수직 드래그 전용

```kotlin [compose-playground]
// 수평 드래그만 감지
Modifier.pointerInput(Unit) {
    detectHorizontalDragGestures { change, dragAmount ->
        change.consume()
        offsetX += dragAmount
    }
}

// 수직 드래그만 감지
Modifier.pointerInput(Unit) {
    detectVerticalDragGestures { change, dragAmount ->
        change.consume()
        offsetY += dragAmount
    }
}
```

---

## 3. anchoredDraggable: 스와이프 동작

`anchoredDraggable`은 **정해진 앵커(Anchor) 지점 사이에서 드래그**할 수 있는 수정자입니다. "스와이프하여 삭제", "스와이프하여 열기" 같은 패턴에 사용됩니다.

```
anchoredDraggable 앵커 개념

  ● ─────────── ● ─────────── ●
  닫힘(0dp)     반열림(100dp)   열림(200dp)
  (Start)       (Middle)       (End)

  드래그 후 손을 떼면 → 가장 가까운 앵커로 자동 이동
```

### 스와이프하여 삭제

```kotlin [compose-playground]
enum class SwipeState {
    Default,   // 기본 상태
    Dismissed  // 삭제됨
}

@OptIn(ExperimentalFoundationApi::class)
@Composable
fun SwipeToDismissItem(
    onDismiss: () -> Unit,
    content: @Composable () -> Unit
) {
    val density = LocalDensity.current

    val anchors = DraggableAnchors {
        SwipeState.Default at 0f
        SwipeState.Dismissed at with(density) { 300.dp.toPx() }
    }

    val anchoredDraggableState = remember {
        AnchoredDraggableState(
            initialValue = SwipeState.Default,
            positionalThreshold = { distance -> distance * 0.5f }, // 50% 이상 드래그하면 전환
            velocityThreshold = { with(density) { 125.dp.toPx() } }, // 빠르게 스와이프해도 전환
            snapAnimationSpec = spring(),
            decayAnimationSpec = exponentialDecay()
        )
    }

    // 앵커 설정
    LaunchedEffect(anchors) {
        anchoredDraggableState.updateAnchors(anchors)
    }

    // 삭제 상태 감지
    LaunchedEffect(anchoredDraggableState.currentValue) {
        if (anchoredDraggableState.currentValue == SwipeState.Dismissed) {
            onDismiss()
        }
    }

    Box(
        modifier = Modifier
            .fillMaxWidth()
            .height(80.dp)
    ) {
        // 뒤에 보이는 삭제 배경
        Box(
            modifier = Modifier
                .fillMaxSize()
                .background(Color.Red),
            contentAlignment = Alignment.CenterEnd
        ) {
            Icon(
                Icons.Default.Delete,
                contentDescription = "삭제",
                tint = Color.White,
                modifier = Modifier.padding(end = 24.dp)
            )
        }

        // 드래그 가능한 콘텐츠
        Box(
            modifier = Modifier
                .fillMaxSize()
                .offset {
                    IntOffset(
                        x = anchoredDraggableState.requireOffset().roundToInt(),
                        y = 0
                    )
                }
                .anchoredDraggable(
                    state = anchoredDraggableState,
                    orientation = Orientation.Horizontal
                )
                .background(MaterialTheme.colorScheme.surface)
        ) {
            content()
        }
    }
}
```

### 핵심 매개변수

| 매개변수 | 설명 |
|---------|------|
| `positionalThreshold` | 드래그 거리가 이 비율 이상이면 다음 앵커로 전환 |
| `velocityThreshold` | 드래그 속도가 이 값 이상이면 즉시 전환 |
| `snapAnimationSpec` | 앵커로 스냅될 때의 애니메이션 |
| `decayAnimationSpec` | 플링(빠른 드래그) 시의 감쇠 애니메이션 |

---

## 4. transformable 수정자: 이동, 회전, 확대/축소

`transformable`은 **이동(pan), 회전(rotation), 확대/축소(zoom)** 를 하나의 수정자로 처리합니다. 이미지 뷰어, 지도 등에 사용됩니다.

### 기본 사용법

```kotlin [compose-playground]
@Composable
fun TransformableExample() {
    var scale by remember { mutableFloatStateOf(1f) }
    var rotation by remember { mutableFloatStateOf(0f) }
    var offset by remember { mutableStateOf(Offset.Zero) }

    val transformState = rememberTransformableState { zoomChange, panChange, rotationChange ->
        scale = (scale * zoomChange).coerceIn(0.5f, 3f)  // 0.5x ~ 3x
        rotation += rotationChange
        offset += panChange
    }

    Box(
        modifier = Modifier
            .fillMaxSize()
            .background(Color(0xFFF5F5F5)),
        contentAlignment = Alignment.Center
    ) {
        Image(
            painter = painterResource(R.drawable.sample),
            contentDescription = "변환 가능한 이미지",
            modifier = Modifier
                .graphicsLayer {
                    scaleX = scale
                    scaleY = scale
                    rotationZ = rotation
                    translationX = offset.x
                    translationY = offset.y
                }
                .transformable(state = transformState)
                .size(200.dp)
        )
    }
}
```

```
transformable 동작

  이동 (Pan)              회전 (Rotation)         확대/축소 (Zoom)
  ┌──────┐               ┌──────┐               ┌──────┐
  │  →   │               │  ↻   │               │ ↗  ↙ │
  │ 한 손가락│             │ 두 손가락│             │ 두 손가락│
  │ 드래그  │             │  회전  │             │ 벌리기/│
  └──────┘               └──────┘               │ 오므리기│
                                                └──────┘
```

### TransformableState 콜백 매개변수

| 매개변수 | 타입 | 설명 |
|---------|------|------|
| `zoomChange` | Float | 확대/축소 비율 (1.0 = 변화 없음, > 1 확대, < 1 축소) |
| `panChange` | Offset | 이동량 (x, y 픽셀) |
| `rotationChange` | Float | 회전 각도 변화 (도) |

---

## 5. 멀티 터치: detectTransformGestures

`detectTransformGestures`는 `transformable`보다 **더 세밀한 제어**를 제공합니다. `pointerInput` 안에서 사용합니다.

### 코드 예제: 이미지 뷰어

```kotlin [compose-playground]
@Composable
fun ImageViewer() {
    var scale by remember { mutableFloatStateOf(1f) }
    var rotation by remember { mutableFloatStateOf(0f) }
    var offset by remember { mutableStateOf(Offset.Zero) }

    Box(
        modifier = Modifier
            .fillMaxSize()
            .background(Color.Black),
        contentAlignment = Alignment.Center
    ) {
        Image(
            painter = painterResource(R.drawable.sample),
            contentDescription = "이미지",
            modifier = Modifier
                .graphicsLayer {
                    scaleX = scale
                    scaleY = scale
                    rotationZ = rotation
                    translationX = offset.x
                    translationY = offset.y
                }
                .pointerInput(Unit) {
                    detectTransformGestures(
                        panZoomLock = false  // true이면 팬+줌만 (회전 비활성)
                    ) { centroid, pan, zoom, rotationDelta ->
                        // centroid: 제스처의 중심점 좌표
                        // pan: 이동량
                        // zoom: 확대/축소 비율
                        // rotationDelta: 회전 각도

                        scale = (scale * zoom).coerceIn(0.5f, 5f)
                        rotation += rotationDelta
                        offset += pan
                    }
                }
                .size(300.dp)
        )
    }
}
```

### detectTransformGestures 매개변수

| 매개변수 | 타입 | 설명 |
|---------|------|------|
| `centroid` | Offset | 두 손가락의 중심점 좌표 |
| `pan` | Offset | 이동량 |
| `zoom` | Float | 확대/축소 비율 |
| `rotation` | Float | 회전 각도 (도) |
| `panZoomLock` | Boolean | true이면 회전 비활성화 (팬+줌만) |

### 더블 탭으로 줌 + 핀치 줌 결합

```kotlin [compose-playground]
@Composable
fun DoubleTapZoomImage() {
    var scale by remember { mutableFloatStateOf(1f) }
    var offset by remember { mutableStateOf(Offset.Zero) }
    val scope = rememberCoroutineScope()
    val animatedScale = remember { Animatable(1f) }

    Image(
        painter = painterResource(R.drawable.sample),
        contentDescription = "이미지",
        modifier = Modifier
            .graphicsLayer {
                scaleX = animatedScale.value
                scaleY = animatedScale.value
                translationX = offset.x
                translationY = offset.y
            }
            .pointerInput(Unit) {
                detectTapGestures(
                    onDoubleTap = {
                        // 더블 탭: 확대/축소 토글
                        scope.launch {
                            val targetScale = if (animatedScale.value > 1.5f) 1f else 3f
                            animatedScale.animateTo(
                                targetValue = targetScale,
                                animationSpec = spring()
                            )
                            if (targetScale == 1f) offset = Offset.Zero
                        }
                    }
                )
            }
            .pointerInput(Unit) {
                detectTransformGestures { _, pan, zoom, _ ->
                    scale = (animatedScale.value * zoom).coerceIn(1f, 5f)
                    scope.launch { animatedScale.snapTo(scale) }
                    if (scale > 1f) {
                        offset += pan
                    }
                }
            }
            .fillMaxSize()
    )
}
```

---

## 6. 이벤트 소비와 전파

터치 이벤트는 여러 컴포저블을 통과하며 전달됩니다. **이벤트를 소비(consume)** 하면 다른 제스처 핸들러에 전달되지 않습니다.

```
이벤트 소비 흐름

  터치 발생
      │
      ▼
  ┌─────────────┐
  │  부모 제스처  │ ← 이벤트 확인 (소비하지 않으면 통과)
  └──────┬──────┘
         │
         ▼
  ┌─────────────┐
  │  자식 제스처  │ ← change.consume()으로 소비
  └──────┬──────┘
         │
         ▼
  ┌─────────────┐
  │  다른 핸들러  │ ← 이미 소비됨 → change.isConsumed == true
  └─────────────┘
```

### consume() 사용법

```kotlin [compose-playground]
Modifier.pointerInput(Unit) {
    detectDragGestures { change, dragAmount ->
        // 이 이벤트를 소비하여 부모의 스크롤이 동작하지 않도록 함
        change.consume()

        offsetX += dragAmount.x
        offsetY += dragAmount.y
    }
}
```

### isConsumed 확인

```kotlin [compose-playground]
Modifier.pointerInput(Unit) {
    awaitPointerEventScope {
        while (true) {
            val event = awaitPointerEvent()
            event.changes.forEach { change ->
                if (!change.isConsumed) {
                    // 아직 소비되지 않은 이벤트만 처리
                    println("처리: ${change.position}")
                    change.consume()
                }
            }
        }
    }
}
```

> **주의**: `consume()`을 호출하지 않으면 부모 컴포저블의 스크롤, 드래그 등이 동시에 반응할 수 있습니다.
> 반대로, 불필요하게 소비하면 부모의 정상적인 제스처가 작동하지 않을 수 있습니다.

---

## 7. 이벤트 전달 흐름: Initial, Main, Final Pass

Compose의 포인터 이벤트는 **세 단계**를 거쳐 전달됩니다.

```
이벤트 전달 3단계

  ┌─────────────────────────────────────────┐
  │  1. Initial Pass (초기 패스)              │
  │     부모 → 자식 방향                      │
  │     부모가 먼저 이벤트를 확인              │
  │     (주로 이벤트를 가로채기 위해)           │
  ├─────────────────────────────────────────┤
  │  2. Main Pass (메인 패스)                 │
  │     자식 → 부모 방향                      │
  │     자식이 먼저 이벤트를 처리              │
  │     (실제 제스처 처리가 여기서 일어남)      │
  ├─────────────────────────────────────────┤
  │  3. Final Pass (최종 패스)                │
  │     부모 → 자식 방향                      │
  │     이벤트가 소비되었는지 최종 확인         │
  │     (정리 작업)                           │
  └─────────────────────────────────────────┘
```

### 코드로 보는 이벤트 패스

```kotlin [compose-playground]
// 부모
Box(
    modifier = Modifier
        .fillMaxSize()
        .pointerInput(Unit) {
            awaitPointerEventScope {
                while (true) {
                    // Main Pass에서 이벤트 수신 (기본값)
                    val event = awaitPointerEvent(PointerEventPass.Main)
                    println("부모 Main: ${event.changes.first().position}")
                }
            }
        }
) {
    // 자식
    Box(
        modifier = Modifier
            .size(100.dp)
            .pointerInput(Unit) {
                awaitPointerEventScope {
                    while (true) {
                        val event = awaitPointerEvent(PointerEventPass.Main)
                        println("자식 Main: ${event.changes.first().position}")
                        // 자식이 먼저 처리 (Main은 자식 → 부모 순)
                    }
                }
            }
    )
}
```

### 각 패스의 전달 방향과 용도

| 패스 | 방향 | 용도 | 예시 |
|------|------|------|------|
| Initial | 부모 → 자식 | 이벤트 가로채기 | 부모 스크롤이 자식 클릭보다 우선 |
| Main | 자식 → 부모 | 실제 제스처 처리 | 버튼 클릭, 드래그 등 |
| Final | 부모 → 자식 | 소비 여부 확인 | 이벤트 정리 |

### 실전 예시: 부모가 이벤트를 가로채는 경우

```kotlin [compose-playground]
// Initial Pass에서 이벤트를 가로채면
// 자식의 Main Pass에서 이미 소비된 상태로 전달됨
Box(
    modifier = Modifier.pointerInput(Unit) {
        awaitPointerEventScope {
            while (true) {
                val event = awaitPointerEvent(PointerEventPass.Initial)
                // 특정 조건에서 이벤트 가로채기
                if (shouldIntercept) {
                    event.changes.forEach { it.consume() }
                }
            }
        }
    }
) {
    // 자식의 Main Pass에서는 이미 소비된 이벤트를 받음
    Button(onClick = { /* shouldIntercept가 true이면 호출되지 않음 */ }) {
        Text("클릭")
    }
}
```

---

## 8. 테스트: performTouchInput

Compose 테스트 프레임워크는 다양한 터치 제스처를 프로그래밍 방식으로 시뮬레이션할 수 있습니다.

### 기본 클릭 테스트

```kotlin [compose-playground]
@get:Rule
val composeTestRule = createComposeRule()

@Test
fun button_incrementsCounter_onTap() {
    composeTestRule.setContent {
        CounterScreen()
    }

    // 클릭 수행
    composeTestRule
        .onNodeWithText("증가")
        .performClick()

    // 결과 검증
    composeTestRule
        .onNodeWithText("1")
        .assertIsDisplayed()
}
```

### 스와이프 테스트

```kotlin [compose-playground]
@Test
fun swipeToDismiss_removesItem() {
    composeTestRule.setContent {
        SwipeToDismissItem(
            onDismiss = { /* 검증 */ },
            content = {
                Text("삭제할 아이템", modifier = Modifier.testTag("item"))
            }
        )
    }

    composeTestRule
        .onNodeWithTag("item")
        .performTouchInput {
            swipeRight(
                startX = left,
                endX = right,
                durationMillis = 200
            )
        }
}
```

### performTouchInput 제스처 함수들

| 함수 | 설명 |
|------|------|
| `click()` | 중앙을 탭 |
| `click(position)` | 지정 좌표를 탭 |
| `doubleClick()` | 더블 탭 |
| `longClick()` | 롱 프레스 |
| `swipeUp()` | 위로 스와이프 |
| `swipeDown()` | 아래로 스와이프 |
| `swipeLeft()` | 왼쪽으로 스와이프 |
| `swipeRight()` | 오른쪽으로 스와이프 |
| `pinch()` | 핀치 (확대/축소) |

### 드래그 테스트

```kotlin [compose-playground]
@Test
fun draggableBox_movesCorrectly() {
    composeTestRule.setContent {
        FreeDragExample()
    }

    composeTestRule
        .onNodeWithText("드래그")
        .performTouchInput {
            // 수동 드래그 시뮬레이션
            down(center)                    // 터치 다운
            moveBy(Offset(200f, 100f))      // 200px 오른쪽, 100px 아래로 이동
            up()                            // 터치 업
        }
}
```

### 복잡한 제스처 시퀀스

```kotlin [compose-playground]
@Test
fun multiTouchGesture_scalesImage() {
    composeTestRule.setContent {
        TransformableExample()
    }

    composeTestRule
        .onNodeWithContentDescription("변환 가능한 이미지")
        .performTouchInput {
            // 핀치 아웃 (확대)
            pinch(
                start0 = center - Offset(50f, 0f),
                end0 = center - Offset(150f, 0f),
                start1 = center + Offset(50f, 0f),
                end1 = center + Offset(150f, 0f),
                durationMillis = 500
            )
        }
}
```

### 커스텀 터치 시퀀스

```kotlin [compose-playground]
@Test
fun customGesture_swipeAndHold() {
    composeTestRule
        .onNodeWithTag("target")
        .performTouchInput {
            down(centerLeft)              // 왼쪽 중앙에서 터치 다운
            moveTo(center)                // 중앙으로 이동
            advanceEventTime(500)         // 500ms 대기 (롱 프레스 효과)
            moveTo(centerRight)           // 오른쪽으로 이동
            up()                          // 터치 업
        }
}
```

---

## 9. 2026 업데이트 (Foundation 1.10.4)

### 트랙패드 제스처 지원

Foundation 1.10에서 트랙패드 전용 포인터 이벤트 타입이 추가되었습니다:

```kotlin [compose-playground]
Modifier.pointerInput(Unit) {
    awaitPointerEventScope {
        while (true) {
            val event = awaitPointerEvent()
            when (event.type) {
                PointerEventType.Pan -> {
                    // 트랙패드 두 손가락 스크롤/팬
                    val pan = event.changes.first().scrollDelta
                    // pan.x, pan.y 처리
                }
                PointerEventType.Scale -> {
                    // 트랙패드 핀치 줌
                }
            }
        }
    }
}
```

### 중첩 드래그 충돌 해결

`isNestedDraggablesTouchConflictFixEnabled` 플래그로 중첩된 드래그 가능한 컴포넌트 간 충돌을 해결할 수 있습니다 (수직 드래그 우선).

### AnchoredDraggable 개선

`AnchoredDraggableState.targetValue`가 동일한 오프셋에 여러 앵커가 있을 때 올바르게 동작하도록 수정되었습니다.

---

## 10. 정리

| 핵심 개념 | 설명 |
|-----------|------|
| `draggable` | 단일 축 드래그 (수평 또는 수직) |
| `detectDragGestures` | 자유로운 2D 드래그 (pointerInput 내) |
| `anchoredDraggable` | 앵커 지점 사이의 드래그 (스와이프 삭제 등) |
| `transformable` | 이동 + 회전 + 확대/축소 (멀티 터치) |
| `detectTransformGestures` | 멀티 터치의 세밀한 제어 |
| `consume()` | 이벤트를 소비하여 다른 핸들러로 전파 차단 |
| Initial/Main/Final Pass | 이벤트 전달의 세 단계 |
| `PointerEventType.Pan/Scale` | 트랙패드 제스처 (Foundation 1.10) |
| `performTouchInput` | 테스트에서 터치 제스처 시뮬레이션 |

### 제스처 API 선택 가이드

```
어떤 제스처가 필요한가?
│
├── 한 축 방향 드래그?
│   └── draggable (간단) 또는 detectHorizontalDragGestures/detectVerticalDragGestures
│
├── 자유로운 2D 드래그?
│   └── pointerInput + detectDragGestures
│
├── 앵커 기반 스와이프? (삭제, 열기/닫기)
│   └── anchoredDraggable
│
├── 이동 + 회전 + 확대/축소?
│   ├── 간단한 경우 → transformable
│   └── 세밀한 제어 → pointerInput + detectTransformGestures
│
└── 원시 포인터 이벤트?
    └── pointerInput + awaitPointerEventScope
```

### Phase 8 완료!

터치와 제스처 파트를 마쳤습니다! 클릭부터 멀티 터치까지, Compose에서 사용자 입력을 처리하는 모든 방법을 배웠습니다. 다음 Phase에서는 **테스팅과 디버깅**을 배워 안정적인 앱을 만드는 방법을 익힙니다.

> [다음: Phase 9 - 01. UI 테스트 기초 →](../phase-09-testing-and-debugging/01-ui-testing-basics.md)
