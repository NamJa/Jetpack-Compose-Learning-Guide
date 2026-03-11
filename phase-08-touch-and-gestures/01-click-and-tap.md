# 클릭과 탭 처리

> **"사용자의 첫 번째 상호작용은 탭이다. 탭 하나를 제대로 처리하지 못하면 나머지는 의미가 없다."**
>
> 모바일 앱에서 가장 기본적인 입력은 화면을 터치하는 것입니다.
> Compose는 클릭, 더블 탭, 롱 프레스 등을 처리하기 위한 세 가지 추상화 수준을 제공합니다.
> 이 문서에서는 각 수준의 차이를 이해하고, 상황에 맞는 API를 선택하는 법을 배웁니다.

---

## 목차

1. [세 가지 추상화 수준 개요](#1-세-가지-추상화-수준-개요)
2. [clickable 수정자: 단일 탭](#2-clickable-수정자-단일-탭)
3. [combinedClickable: 다중 클릭 처리](#3-combinedclickable-다중-클릭-처리)
4. [pointerInput + detectTapGestures](#4-pointerinput--detecttapgestures)
5. [리플 효과 (Indication)](#5-리플-효과-indication)
6. [접근성 고려: 터치 영역 최소 크기](#6-접근성-고려-터치-영역-최소-크기)
7. [정리](#7-정리)

---

## 1. 세 가지 추상화 수준 개요

Compose에서 터치 입력을 처리하는 방법은 세 단계로 나뉩니다. 위쪽일수록 사용이 쉽고, 아래쪽일수록 세밀한 제어가 가능합니다.

```
추상화 수준 (높은 순)

┌─────────────────────────────────────┐
│  Level 3: 컴포넌트 (Button, Switch) │  ← 가장 쉬움
│  클릭 처리가 이미 내장되어 있음       │
├─────────────────────────────────────┤
│  Level 2: 수정자 (clickable)        │  ← 중간
│  모든 컴포저블에 클릭 기능 추가       │
├─────────────────────────────────────┤
│  Level 1: pointerInput              │  ← 가장 세밀
│  원시 터치 이벤트 직접 처리           │
└─────────────────────────────────────┘
```

| 수준 | API | 특징 | 사용 시점 |
|------|-----|------|----------|
| 컴포넌트 | `Button`, `IconButton`, `Switch` | 클릭, 리플, 접근성 자동 제공 | 표준 UI 요소 사용 시 |
| 수정자 | `clickable`, `combinedClickable` | 모든 컴포저블에 클릭 기능 추가 | 커스텀 클릭 영역이 필요할 때 |
| pointerInput | `detectTapGestures` | 원시 터치 좌표와 이벤트 직접 제어 | 고도로 맞춤화된 제스처 필요 시 |

### 코드 비교

```kotlin [compose-playground]
// Level 3: 컴포넌트 — 가장 쉬움
Button(onClick = { /* 처리 */ }) {
    Text("클릭하세요")
}

// Level 2: 수정자 — 모든 컴포저블에 적용 가능
Text(
    text = "클릭하세요",
    modifier = Modifier.clickable { /* 처리 */ }
)

// Level 1: pointerInput — 가장 세밀한 제어
Box(
    modifier = Modifier.pointerInput(Unit) {
        detectTapGestures(
            onTap = { offset -> /* 탭 좌표까지 알 수 있음 */ }
        )
    }
)
```

---

## 2. clickable 수정자: 단일 탭

`clickable`은 모든 컴포저블에 **단일 클릭(탭)** 기능을 추가하는 Modifier입니다. 리플 효과와 접근성(시맨틱) 지원이 자동으로 포함됩니다.

> **Foundation 1.9+ 변경사항**: `clickable`과 `combinedClickable`은 **non-suspending pointer input** 기반으로 재작성되어 성능이 최적화되었습니다.
> 이 변경으로 명시적 `Indication` 파라미터 없이 사용할 경우, 기존 `Indication` 인터페이스가 아닌 **`IndicationNodeFactory`** 만 지원됩니다.
> 기존 `Indication` 인터페이스를 계속 사용해야 하는 경우, 아래와 같이 opt-out할 수 있습니다:
>
> ```kotlin
> ComposeFoundationFlags.isNonComposedClickableEnabled = false
> ```

### 기본 사용법

```kotlin [compose-playground]
@Composable
fun ClickableExample() {
    var count by remember { mutableIntStateOf(0) }

    Card(
        modifier = Modifier
            .fillMaxWidth()
            .padding(16.dp)
            .clickable { count++ }  // 탭하면 count 증가
    ) {
        Text(
            text = "클릭 횟수: $count",
            modifier = Modifier.padding(24.dp),
            style = MaterialTheme.typography.headlineMedium
        )
    }
}
```

### 활성화/비활성화

```kotlin [compose-playground]
@Composable
fun ConditionalClickable(isEnabled: Boolean) {
    Box(
        modifier = Modifier
            .size(100.dp)
            .background(
                if (isEnabled) Color.Blue else Color.Gray,
                RoundedCornerShape(8.dp)
            )
            .clickable(
                enabled = isEnabled,  // false이면 클릭 불가
                onClick = { /* 처리 */ }
            ),
        contentAlignment = Alignment.Center
    ) {
        Text(
            text = if (isEnabled) "활성" else "비활성",
            color = Color.White
        )
    }
}
```

### 리플과 시맨틱 커스터마이징

```kotlin [compose-playground]
Box(
    modifier = Modifier
        .clickable(
            enabled = true,
            onClickLabel = "항목 열기",    // 접근성: TalkBack이 읽어줌
            role = Role.Button,           // 접근성: 요소의 역할 지정
            onClick = { /* 처리 */ }
        )
)
```

---

## 3. combinedClickable: 다중 클릭 처리

`combinedClickable`은 **단일 클릭, 더블 클릭, 롱 클릭**을 모두 처리할 수 있습니다.

```kotlin [compose-playground]
@Composable
fun CombinedClickableExample() {
    var message by remember { mutableStateOf("아래 카드를 터치해보세요") }

    Column(modifier = Modifier.padding(16.dp)) {
        Text(
            text = message,
            style = MaterialTheme.typography.bodyLarge,
            modifier = Modifier.padding(bottom = 16.dp)
        )

        Card(
            modifier = Modifier
                .fillMaxWidth()
                .combinedClickable(
                    onClick = {
                        message = "단일 클릭!"
                    },
                    onDoubleClick = {
                        message = "더블 클릭!"
                    },
                    onLongClick = {
                        message = "롱 클릭!"
                    },
                    onClickLabel = "열기",         // 접근성
                    onLongClickLabel = "메뉴 열기"  // 접근성
                )
        ) {
            Text(
                text = "여기를 터치하세요",
                modifier = Modifier.padding(32.dp),
                style = MaterialTheme.typography.titleMedium,
                textAlign = TextAlign.Center
            )
        }
    }
}
```

```
combinedClickable 동작 흐름

사용자가 터치 ──→ 프레스(누름) 감지
                    │
                    ├── 짧게 떼면?
                    │   ├── 또 한 번 탭? (짧은 시간 내) → onDoubleClick
                    │   └── 아니면 → onClick (약간의 지연 후 호출)
                    │
                    └── 오래 누르면? → onLongClick
```

> **주의**: `onDoubleClick`을 정의하면 `onClick`에 약간의 **지연(약 200ms)** 이 생깁니다.
> 프레임워크가 더블 클릭인지 단일 클릭인지 판별하는 시간이 필요하기 때문입니다.
> 더블 클릭이 불필요하다면 `clickable`만 사용하는 것이 반응이 더 빠릅니다.

---

## 4. pointerInput + detectTapGestures

가장 저수준의 API로, **터치 좌표**, **프레스 상태**, **제스처 유형**을 직접 제어할 수 있습니다.

### detectTapGestures의 콜백들

```kotlin [compose-playground]
@Composable
fun TapGestureExample() {
    var gestureInfo by remember { mutableStateOf("터치해보세요") }

    Box(
        modifier = Modifier
            .size(200.dp)
            .background(Color(0xFFF5F5F5), RoundedCornerShape(16.dp))
            .pointerInput(Unit) {
                detectTapGestures(
                    onTap = { offset ->
                        gestureInfo = "탭: (${offset.x.toInt()}, ${offset.y.toInt()})"
                    },
                    onDoubleTap = { offset ->
                        gestureInfo = "더블탭: (${offset.x.toInt()}, ${offset.y.toInt()})"
                    },
                    onLongPress = { offset ->
                        gestureInfo = "롱프레스: (${offset.x.toInt()}, ${offset.y.toInt()})"
                    },
                    onPress = { offset ->
                        // 프레스 시작 — 시각적 피드백 시작
                        gestureInfo = "누르는 중: (${offset.x.toInt()}, ${offset.y.toInt()})"

                        // tryAwaitRelease(): 손가락을 뗄 때까지 대기
                        val released = tryAwaitRelease()
                        if (released) {
                            gestureInfo = "릴리스됨"
                        } else {
                            gestureInfo = "취소됨 (드래그로 벗어남)"
                        }
                    }
                )
            },
        contentAlignment = Alignment.Center
    ) {
        Text(gestureInfo, textAlign = TextAlign.Center)
    }
}
```

### 콜백 설명

| 콜백 | 호출 시점 | 매개변수 |
|------|----------|---------|
| `onPress` | 손가락이 닿는 즉시 | `Offset` (터치 좌표) |
| `onTap` | 짧게 탭 후 손가락을 뗐을 때 | `Offset` |
| `onDoubleTap` | 더블 탭 감지 시 | `Offset` |
| `onLongPress` | 길게 누를 때 (약 400ms) | `Offset` |

### onPress의 특별함

`onPress`는 **suspend 함수**입니다. `tryAwaitRelease()` 또는 `awaitRelease()`를 호출하여 사용자가 손가락을 뗄 때까지 대기할 수 있습니다.

```kotlin [compose-playground]
fun main() {
//sampleStart
onPress = { offset ->
    // 1. 프레스 시작 → 시각적 피드백 시작 (예: 하이라이트)
    isPressed = true

    try {
        // 2. 손가락을 뗄 때까지 대기
        awaitRelease()
        // 3. 정상적으로 릴리스됨
        isPressed = false
    } catch (e: GestureCancelledException) {
        // 4. 제스처가 취소됨 (예: 드래그로 전환)
        isPressed = false
    }
}
//sampleEnd
}
```

### 프레스 상태를 활용한 시각적 피드백

```kotlin [compose-playground]
@Composable
fun PressHighlightBox() {
    var isPressed by remember { mutableStateOf(false) }

    val backgroundColor by animateColorAsState(
        targetValue = if (isPressed) Color(0xFFBBDEFB) else Color.White,
        label = "pressColor"
    )

    Box(
        modifier = Modifier
            .size(150.dp)
            .background(backgroundColor, RoundedCornerShape(12.dp))
            .border(1.dp, Color.Gray, RoundedCornerShape(12.dp))
            .pointerInput(Unit) {
                detectTapGestures(
                    onPress = {
                        isPressed = true
                        tryAwaitRelease()
                        isPressed = false
                    },
                    onTap = { /* 탭 처리 */ }
                )
            },
        contentAlignment = Alignment.Center
    ) {
        Text(if (isPressed) "누르는 중..." else "탭하세요")
    }
}
```

---

## 5. 리플 효과 (Indication)

리플(Ripple)은 사용자가 터치했을 때 **물결 모양의 시각적 피드백**을 제공합니다. Material Design의 핵심 상호작용 패턴입니다.

```
리플 효과 시각화

  ① 터치 시작         ② 리플 확장         ③ 리플 완료
┌──────────┐      ┌──────────┐      ┌──────────┐
│          │      │   ╱──╲   │      │ ╱──────╲ │
│    ●     │  →   │  │    │  │  →   │ │      │ │
│  (터치점) │      │   ╲──╱   │      │ ╲──────╱ │
└──────────┘      └──────────┘      └──────────┘
```

### 기본 리플 (자동 적용)

`clickable`, `combinedClickable`, `Button` 등을 사용하면 **리플이 자동으로 적용**됩니다.

```kotlin [compose-playground]
// 리플이 자동 적용됨
Box(
    modifier = Modifier
        .size(100.dp)
        .clickable { /* 처리 */ }
)
```

### IndicationNodeFactory (Foundation 1.9+)

Foundation 1.9부터 `clickable`/`combinedClickable`이 non-suspending pointer input으로 재작성되면서, 명시적 `Indication` 파라미터 없이 사용하는 경우 `IndicationNodeFactory`만 지원됩니다. `IndicationNodeFactory`는 기존 `Indication` 인터페이스보다 노드 기반으로 효율적이며, Modifier 체인에서 불필요한 코루틴 오버헤드를 줄여줍니다.

```kotlin [compose-playground]
// IndicationNodeFactory 기반 커스텀 인디케이션 예시
object MyIndicationNodeFactory : IndicationNodeFactory {
    override fun create(interactionSource: InteractionSource): DelegatableNode {
        return MyIndicationNode(interactionSource)
    }
}
```

### 리플 비활성화

경우에 따라 리플 효과 없이 클릭만 처리하고 싶을 수 있습니다.

```kotlin [compose-playground]
Box(
    modifier = Modifier
        .size(100.dp)
        .clickable(
            interactionSource = remember { MutableInteractionSource() },
            indication = null,  // 리플 비활성화
            onClick = { /* 처리 */ }
        )
)
```

### 커스텀 리플 색상

```kotlin [compose-playground]
@Composable
fun CustomRippleExample() {
    // 리플 색상을 빨간색으로 변경
    CompositionLocalProvider(
        LocalRippleConfiguration provides RippleConfiguration(
            color = Color.Red
        )
    ) {
        Box(
            modifier = Modifier
                .size(100.dp)
                .background(Color.White)
                .clickable { /* 처리 */ },
            contentAlignment = Alignment.Center
        ) {
            Text("빨간 리플")
        }
    }
}
```

### 리플 경계(Bounded vs Unbounded)

| 유형 | 설명 | 사용 예 |
|------|------|--------|
| Bounded (경계 있음) | 컴포저블 영역 내에서만 리플이 퍼짐 | 버튼, 카드 |
| Unbounded (경계 없음) | 컴포저블 영역 밖으로도 리플이 퍼짐 | 아이콘 버튼 |

---

## 6. 접근성 고려: 터치 영역 최소 크기

Material Design 가이드라인에 따르면, **터치 가능한 요소의 최소 크기는 48dp x 48dp** 여야 합니다. 이는 모든 사용자가 실수 없이 터치할 수 있도록 보장하기 위함입니다.

```
터치 영역 가이드라인

  최소 48dp
  ←─────────→
  ┌──────────┐  ↑
  │          │  │
  │  아이콘   │  48dp (최소)
  │   24dp   │  │
  │          │  │
  └──────────┘  ↓

  아이콘이 24dp여도 터치 영역은 48dp 이상이어야 합니다.
```

### Compose의 자동 처리

`clickable` 또는 `combinedClickable`을 사용하면 Compose가 시맨틱 정보에 기반하여 **터치 영역을 자동으로 최소 48dp로 확장**합니다 (Material 라이브러리 사용 시). 이 48dp 최소 터치 타겟 크기는 접근성(Accessibility) 가이드라인을 충족하기 위해 Foundation 레벨에서 강제됩니다.

```kotlin [compose-playground]
// 시각적으로는 24dp이지만, 터치 영역은 48dp로 자동 확장됨
Icon(
    imageVector = Icons.Default.Close,
    contentDescription = "닫기",
    modifier = Modifier
        .size(24.dp)
        .clickable { /* 처리 */ }
)
```

### 수동으로 터치 영역 확장

자동 확장이 적용되지 않는 경우, 수동으로 설정할 수 있습니다.

```kotlin [compose-playground]
// 방법 1: sizeIn으로 최소 크기 보장
Icon(
    imageVector = Icons.Default.Star,
    contentDescription = "즐겨찾기",
    modifier = Modifier
        .sizeIn(minWidth = 48.dp, minHeight = 48.dp)
        .clickable { /* 처리 */ }
)

// 방법 2: padding으로 터치 영역 확장
Icon(
    imageVector = Icons.Default.Star,
    contentDescription = "즐겨찾기",
    modifier = Modifier
        .clickable { /* 처리 */ }
        .padding(12.dp)  // 24dp 아이콘 + 12dp*2 패딩 = 48dp
        .size(24.dp)
)
```

### 접근성 체크리스트

| 항목 | 설명 |
|------|------|
| 최소 크기 48dp | 모든 터치 가능한 요소에 적용 |
| `contentDescription` | 이미지, 아이콘에 대한 설명 (TalkBack용) |
| `onClickLabel` | 클릭 동작에 대한 설명 ("삭제", "열기" 등) |
| `role` | 요소의 역할 (`Role.Button`, `Role.Checkbox` 등) |
| 충분한 간격 | 터치 영역이 겹치지 않도록 최소 8dp 간격 |

---

## 7. 정리

| 핵심 개념 | 설명 |
|-----------|------|
| 세 가지 추상화 수준 | 컴포넌트(Button) > 수정자(clickable) > pointerInput |
| `clickable` | 단일 클릭 + 리플 + 접근성 자동 제공 |
| `combinedClickable` | 단일 클릭 + 더블 클릭 + 롱 클릭 |
| Non-suspending pointer input (1.9+) | `clickable`/`combinedClickable`이 성능 최적화를 위해 재작성됨 |
| `IndicationNodeFactory` (1.9+) | 기존 `Indication` 인터페이스를 대체하는 노드 기반 인디케이션 팩토리 |
| `detectTapGestures` | 탭 좌표, 프레스 상태 등 세밀한 제어 |
| `onPress` + `tryAwaitRelease` | 누르는 동안의 시각적 피드백 구현 |
| 리플 (Indication) | 터치 시 물결 모양 피드백 (Material Design) |
| 최소 48dp | 접근성을 위한 터치 영역 최소 크기 (Foundation 레벨에서 강제) |

### 어떤 API를 선택해야 할까?

```
터치를 처리해야 하는가?
│
├── 표준 버튼/스위치? → Button, IconButton, Switch (Level 3)
│
├── 모든 컴포저블에 클릭 추가?
│   ├── 단일 클릭만? → clickable (Level 2)
│   └── 더블/롱 클릭도? → combinedClickable (Level 2)
│
└── 터치 좌표, 프레스 상태 등 세밀한 제어?
    └── pointerInput + detectTapGestures (Level 1)
```

### 다음 단계

다음 문서에서는 **스크롤과 중첩 스크롤**을 배웁니다. 수직/수평 스크롤부터 중첩 스크롤 처리까지 단계별로 알아봅니다.

> [다음: 02. 스크롤과 중첩 스크롤 →](02-scroll-and-nested-scroll.md)
