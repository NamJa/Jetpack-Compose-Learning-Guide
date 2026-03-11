# Modifier 완전 정복

> **"Modifier는 컴포저블의 '옷'이다. 같은 컴포저블이라도 어떤 Modifier를 입히느냐에 따라 완전히 달라진다."**
> Compose에서 가장 자주 사용하고, 가장 중요한 개념인 Modifier를 깊이 있게 이해해봅시다.

---

## 목차

1. [Modifier란 무엇인가](#1-modifier란-무엇인가)
2. [주요 Modifier 총정리](#2-주요-modifier-총정리)
3. [Modifier 순서의 중요성](#3-modifier-순서의-중요성)
4. [크기 관련 Modifier 상세](#4-크기-관련-modifier-상세)
5. [범위 지정 수정자 (Scope Modifier)](#5-범위-지정-수정자-scope-modifier)
6. [Modifier 추출과 재사용](#6-modifier-추출과-재사용)
7. [모든 컴포저블이 modifier를 받아야 하는 이유](#7-모든-컴포저블이-modifier를-받아야-하는-이유)
8. [XML View와의 비교](#8-xml-view와의-비교)
9. [실전 예제 모음](#9-실전-예제-모음)
10. [정리 및 다음 단계](#10-정리-및-다음-단계)

---

## 1. Modifier란 무엇인가

`Modifier`는 컴포저블을 **장식(decorate)** 하거나 **강화(augment)** 하는 체이닝 가능한 객체입니다. XML View 시스템에서 `android:layout_width`, `android:padding`, `android:clickable` 등의 속성을 각각 설정하던 것을, Compose에서는 **Modifier 하나로 체이닝**하여 표현합니다.

### Modifier의 핵심 특징

```kotlin [compose-playground]
// Modifier는 체이닝(chaining) 방식으로 사용합니다
Text(
    text = "안녕하세요",
    modifier = Modifier
        .fillMaxWidth()       // 가로 전체 채움
        .padding(16.dp)       // 내부 여백
        .background(Color.Yellow)  // 배경색
        .clickable { }        // 클릭 가능
)
```

```
Modifier 체이닝 개념:

Modifier ──→ .fillMaxWidth() ──→ .padding() ──→ .background() ──→ .clickable()
   │              │                  │                │                │
   │              │                  │                │                │
   ▼              ▼                  ▼                ▼                ▼
 빈 시작       가로 전체          여백 추가        배경 적용        클릭 처리
```

**핵심 원리:**
- Modifier는 **불변(immutable)** 입니다. `.padding(16.dp)`을 호출하면 새로운 Modifier가 반환됩니다.
- 체이닝 순서대로 **바깥에서 안쪽으로** 적용됩니다.
- `Modifier` (대문자 M)는 비어있는 기본 Modifier 컴패니언 객체입니다.

---

## 2. 주요 Modifier 총정리

### 크기 (Size)

| Modifier | 설명 | 예시 |
|----------|------|------|
| `size(dp)` | 가로/세로 동일 크기 | `Modifier.size(100.dp)` |
| `size(width, height)` | 가로/세로 각각 지정 | `Modifier.size(200.dp, 100.dp)` |
| `width(dp)` | 가로 크기만 지정 | `Modifier.width(200.dp)` |
| `height(dp)` | 세로 크기만 지정 | `Modifier.height(100.dp)` |
| `fillMaxWidth(fraction)` | 부모 가로의 비율만큼 채움 | `Modifier.fillMaxWidth(0.8f)` |
| `fillMaxHeight(fraction)` | 부모 세로의 비율만큼 채움 | `Modifier.fillMaxHeight()` |
| `fillMaxSize(fraction)` | 부모 전체를 비율만큼 채움 | `Modifier.fillMaxSize()` |
| `wrapContentWidth()` | 콘텐츠 가로 크기에 맞춤 | `Modifier.wrapContentWidth()` |
| `wrapContentHeight()` | 콘텐츠 세로 크기에 맞춤 | `Modifier.wrapContentHeight()` |
| `requiredSize(dp)` | 부모 제약 무시, 강제 크기 | `Modifier.requiredSize(300.dp)` |

```kotlin [compose-playground]
@Composable
fun SizeModifiers() {
    Column(modifier = Modifier.fillMaxWidth().padding(16.dp)) {
        // 고정 크기
        Box(modifier = Modifier.size(100.dp).background(Color.Red))

        Spacer(modifier = Modifier.height(8.dp))

        // 가로 전체, 세로 50dp
        Box(modifier = Modifier.fillMaxWidth().height(50.dp).background(Color.Blue))

        Spacer(modifier = Modifier.height(8.dp))

        // 가로 80%만 채움
        Box(modifier = Modifier.fillMaxWidth(0.8f).height(50.dp).background(Color.Green))
    }
}
```

### 여백 (Padding)

```kotlin [compose-playground]
@Composable
fun PaddingModifiers() {
    // 모든 방향 동일
    Text("패딩 16dp", modifier = Modifier.padding(16.dp))

    // 가로/세로 따로
    Text("패딩", modifier = Modifier.padding(horizontal = 16.dp, vertical = 8.dp))

    // 각 방향 개별 지정
    Text("패딩", modifier = Modifier.padding(start = 16.dp, top = 8.dp, end = 16.dp, bottom = 8.dp))
}
```

```
padding의 각 방향:

              top
         ┌───────────┐
         │           │
  start  │  콘텐츠   │  end
         │           │
         └───────────┘
             bottom
```

> **주의**: Compose에는 `margin` 이 없습니다. XML에서 margin과 padding을 구분하던 것과 달리, Compose에서는 **padding만 사용**합니다. 외부 여백이 필요하면 바깥쪽에 padding을 추가하면 됩니다.

### 배경과 테두리 (Background & Border)

```kotlin [compose-playground]
@Composable
fun BackgroundAndBorder() {
    // 단색 배경
    Text(
        "배경",
        modifier = Modifier
            .background(Color.Yellow)
            .padding(16.dp)
    )

    // 둥근 모서리 배경
    Text(
        "둥근 배경",
        modifier = Modifier
            .background(Color.Cyan, RoundedCornerShape(8.dp))
            .padding(16.dp)
    )

    // 테두리
    Text(
        "테두리",
        modifier = Modifier
            .border(2.dp, Color.Red, RoundedCornerShape(8.dp))
            .padding(16.dp)
    )

    // 그래디언트 배경
    Text(
        "그래디언트",
        modifier = Modifier
            .background(
                brush = Brush.horizontalGradient(
                    colors = listOf(Color.Blue, Color.Cyan)
                )
            )
            .padding(16.dp),
        color = Color.White
    )
}
```

### 모양 자르기 (Clip)

```kotlin [compose-playground]
@Composable
fun ClipModifiers() {
    // 원형 자르기
    Image(
        painter = painterResource(R.drawable.profile),
        contentDescription = "프로필",
        modifier = Modifier
            .size(100.dp)
            .clip(CircleShape)  // 원형으로 자르기
    )

    // 둥근 사각형 자르기
    Image(
        painter = painterResource(R.drawable.photo),
        contentDescription = "사진",
        modifier = Modifier
            .size(200.dp)
            .clip(RoundedCornerShape(16.dp))  // 둥근 사각형
    )
}
```

### 클릭과 상호작용 (Clickable)

```kotlin [compose-playground]
@Composable
fun InteractionModifiers() {
    // 기본 클릭
    Text(
        "클릭 가능",
        modifier = Modifier
            .clickable { /* 클릭 처리 */ }
            .padding(16.dp)
    )

    // 리플(ripple) 효과 없는 클릭
    Text(
        "리플 없음",
        modifier = Modifier
            .clickable(
                indication = null,
                interactionSource = remember { MutableInteractionSource() }
            ) { /* 클릭 처리 */ }
            .padding(16.dp)
    )

    // 스크롤 가능
    Column(
        modifier = Modifier.verticalScroll(rememberScrollState())
    ) {
        // 긴 콘텐츠...
    }
}
```

### 가시성 제어 (Visibility)

Compose Foundation 1.10 (BOM `2026.02.01`)에서 추가된 `Modifier.visible`과 1.9에서 추가된 `Modifier.onVisibilityChanged()`를 사용하면 가시성을 세밀하게 제어할 수 있습니다.

```kotlin [compose-playground]
@Composable
fun VisibilityModifiers() {
    // Modifier.visible (Foundation 1.10+)
    // 레이아웃 공간은 유지하면서 그리기만 건너뛴다 (XML의 INVISIBLE과 동일)
    // Modifier.alpha(0f)와 달리 실제로 draw를 건너뛰어 더 효율적
    Text(
        "보이지 않지만 공간은 차지",
        modifier = Modifier.visible(false)
    )

    // Modifier.onVisibilityChanged (Foundation 1.9+)
    // 컴포저블이 화면에 보이거나 사라질 때 콜백을 받을 수 있다
    // (deprecated된 onFirstVisible()을 대체)
    Text(
        "가시성 추적",
        modifier = Modifier.onVisibilityChanged { isVisible ->
            // isVisible: 화면에 보이는지 여부
            Log.d("Visibility", "isVisible: $isVisible")
        }
    )
}
```

```
visible(false) vs alpha(0f) vs 조건부 렌더링:

Modifier.visible(false):          Modifier.alpha(0f):           조건부 (if문):
┌──────────────────────┐         ┌──────────────────────┐      ┌──────────────────────┐
│ [A]                  │         │ [A]                  │      │ [A]                  │
│ [   빈 공간(B)    ]  │         │ [   빈 공간(B)    ]  │      │ [C] ← B 자리 없음     │
│ [C]                  │         │ [C]                  │      │                      │
└──────────────────────┘         └──────────────────────┘      └──────────────────────┘
  공간 유지, draw 건너뜀            공간 유지, draw 수행           공간도 사라짐
  (XML INVISIBLE과 동일)           (투명하게 그림)               (XML GONE과 동일)
```

### 오프셋 (Offset)

```kotlin [compose-playground]
@Composable
fun OffsetModifier() {
    Box(modifier = Modifier.size(200.dp)) {
        // offset은 레이아웃에 영향을 주지 않고 위치만 이동
        Text(
            "이동된 텍스트",
            modifier = Modifier.offset(x = 20.dp, y = 30.dp)
        )
    }
}
```

```
offset의 개념:

┌──────────────────────┐
│ 원래 위치             │
│  ·                   │
│     ↘ (x=20, y=30)  │
│       ┌─────────┐   │
│       │이동된    │   │
│       │텍스트    │   │
│       └─────────┘   │
└──────────────────────┘
```

---

## 3. Modifier 순서의 중요성

Modifier에서 **가장 중요한 개념**은 **순서(order)** 입니다. Modifier는 체이닝 순서대로 **바깥에서 안쪽으로** 적용됩니다. 같은 Modifier라도 순서가 다르면 결과가 완전히 달라집니다.

### padding -> background vs background -> padding

```kotlin [compose-playground]
@Composable
fun ModifierOrderExample() {
    Row(modifier = Modifier.padding(16.dp)) {
        // 경우 1: padding 먼저 → background 나중
        Text(
            "Case 1",
            modifier = Modifier
                .padding(16.dp)          // 1) 바깥 여백 먼저
                .background(Color.Yellow) // 2) 그 안쪽에 배경
                .padding(16.dp)          // 3) 텍스트 주변 안쪽 여백
        )

        Spacer(modifier = Modifier.width(16.dp))

        // 경우 2: background 먼저 → padding 나중
        Text(
            "Case 2",
            modifier = Modifier
                .background(Color.Yellow) // 1) 바깥에 배경
                .padding(16.dp)          // 2) 배경 안쪽에 여백
        )
    }
}
```

```
Case 1: padding → background → padding

┌──────────────────────────┐
│     16dp 투명 여백        │
│   ┌──────────────────┐   │
│   │■■■ 노란 배경 ■■■■│   │
│   │■ ┌──────────┐ ■■│   │
│   │■ │ Case 1   │ ■■│   │
│   │■ └──────────┘ ■■│   │
│   │■■■■■■■■■■■■■■■■│   │
│   └──────────────────┘   │
│                          │
└──────────────────────────┘

Case 2: background → padding

┌──────────────────────┐
│■■■■ 노란 배경 ■■■■■│
│■■ ┌──────────┐ ■■■■│
│■■ │ Case 2   │ ■■■■│
│■■ └──────────┘ ■■■■│
│■■■■■■■■■■■■■■■■■■■│
└──────────────────────┘
```

### clickable -> padding vs padding -> clickable

이 순서 차이는 **사용자 경험에 직접 영향**을 줍니다.

```kotlin [compose-playground]
@Composable
fun ClickableOrderExample() {
    Column(modifier = Modifier.padding(16.dp)) {
        // 나쁜 예: clickable → padding
        // 클릭 영역이 패딩을 포함하지 않아 작음
        Text(
            "클릭 영역 좁음",
            modifier = Modifier
                .clickable { /* 클릭 */ }    // 1) 클릭 영역 설정
                .padding(16.dp)              // 2) 안쪽에 여백 (클릭 영역 밖)
        )

        Spacer(modifier = Modifier.height(16.dp))

        // 좋은 예: padding → clickable (또는 clickable 후 padding)
        // 전체 영역이 클릭 가능
        Text(
            "클릭 영역 넓음",
            modifier = Modifier
                .padding(16.dp)              // 1) 바깥 여백 (비클릭)
                .clickable { /* 클릭 */ }    // 2) 클릭 영역 = 여백 안쪽 전체
                .padding(16.dp)              // 3) 안쪽 여백 (클릭 영역 포함)
        )
    }
}
```

```
clickable → padding (나쁜 예):

┌─────────────────────────┐
│     비클릭 영역 (padding) │
│   ┌─────────────────┐   │
│   │ 클릭 영역 (좁음)  │   │
│   │ "클릭 영역 좁음"  │   │
│   └─────────────────┘   │
│                         │
└─────────────────────────┘

padding → clickable → padding (좋은 예):

┌─────────────────────────┐
│  비클릭 (바깥 padding)    │
│  ╔═══════════════════╗   │
│  ║ 클릭 영역 (넓음)   ║   │
│  ║                   ║   │
│  ║  "클릭 영역 넓음"  ║   │
│  ║                   ║   │
│  ╚═══════════════════╝   │
└─────────────────────────┘
```

### Modifier 순서 기억하는 법

```
바깥쪽부터 안쪽으로 적용된다고 생각하세요:

Modifier
  .padding(외부 여백)        ← 1. 가장 바깥
  .background(배경색)        ← 2. 배경 칠하기
  .border(테두리)            ← 3. 테두리
  .clip(모양)                ← 4. 모양 자르기
  .clickable { }             ← 5. 클릭 영역
  .padding(내부 여백)        ← 6. 가장 안쪽 (콘텐츠와 가장 가까움)
```

---

## 4. 크기 관련 Modifier 상세

### size vs requiredSize

`size`는 부모의 제약 조건(constraints)을 존중하지만, `requiredSize`는 **부모의 제약을 무시**하고 강제로 크기를 설정합니다.

```kotlin [compose-playground]
@Composable
fun SizeVsRequiredSize() {
    // 부모가 최대 100dp만 허용
    Box(modifier = Modifier.size(100.dp)) {
        // size: 부모 제약 내에서 최대한 → 100dp (200dp를 원하지만 100dp로 제한)
        Box(
            modifier = Modifier
                .size(200.dp)
                .background(Color.Red)
        )
    }

    Spacer(modifier = Modifier.height(16.dp))

    Box(modifier = Modifier.size(100.dp)) {
        // requiredSize: 부모 제약 무시 → 200dp (부모를 넘어감!)
        Box(
            modifier = Modifier
                .requiredSize(200.dp)
                .background(Color.Blue)
        )
    }
}
```

```
size(200.dp) in 100dp parent:      requiredSize(200.dp) in 100dp parent:

┌──────────┐                        ┌──────────┬─────────────┐
│██████████│ ← 100dp로 제한됨       │██████████│█████████████│
│██████████│                        │██████████│█████████████│
│██████████│                        ├──────────┤█████████████│
└──────────┘                        │██████████│█████████████│
  100dp                             └──────────┴─────────────┘
                                       100dp     ← 200dp로 넘침
```

### fillMaxWidth의 fraction 매개변수

```kotlin [compose-playground]
@Composable
fun FillMaxWidthFraction() {
    Column(modifier = Modifier.fillMaxWidth().padding(16.dp)) {
        Box(modifier = Modifier.fillMaxWidth(1.0f).height(40.dp).background(Color.Red))
        Spacer(modifier = Modifier.height(4.dp))
        Box(modifier = Modifier.fillMaxWidth(0.8f).height(40.dp).background(Color.Orange))
        Spacer(modifier = Modifier.height(4.dp))
        Box(modifier = Modifier.fillMaxWidth(0.6f).height(40.dp).background(Color.Yellow))
        Spacer(modifier = Modifier.height(4.dp))
        Box(modifier = Modifier.fillMaxWidth(0.4f).height(40.dp).background(Color.Green))
    }
}
```

```
┌─────────────────────────────────────┐
│ ████████████████████████████████████│  100%
│ ████████████████████████████        │   80%
│ ██████████████████████              │   60%
│ ██████████████                      │   40%
└─────────────────────────────────────┘
```

### defaultMinSize

`defaultMinSize`는 콘텐츠가 비어있거나 작을 때의 **최소 크기**를 보장합니다. 다만 외부에서 더 큰 제약을 주면 그 제약을 따릅니다.

```kotlin [compose-playground]
@Composable
fun DefaultMinSizeExample() {
    // 콘텐츠가 비어있어도 최소 48dp x 48dp 보장
    Box(
        modifier = Modifier
            .defaultMinSize(minWidth = 48.dp, minHeight = 48.dp)
            .background(Color.LightGray),
        contentAlignment = Alignment.Center
    ) {
        // 콘텐츠가 작아도 48dp x 48dp가 최소 크기
    }
}
```

---

## 5. 범위 지정 수정자 (Scope Modifier)

일부 Modifier는 **특정 레이아웃 안에서만 사용**할 수 있습니다. 이를 **범위 지정 수정자(Scope Modifier)** 라고 합니다.

### RowScope의 weight

`Modifier.weight()`는 `Row` 또는 `Column` 내부에서만 사용할 수 있습니다.

```kotlin [compose-playground]
@Composable
fun WeightExample() {
    Row(modifier = Modifier.fillMaxWidth()) {
        // weight(1f): 남은 공간의 1/3 차지
        Text(
            "1",
            modifier = Modifier
                .weight(1f)
                .background(Color.Red)
                .padding(8.dp),
            textAlign = TextAlign.Center
        )
        // weight(2f): 남은 공간의 2/3 차지
        Text(
            "2",
            modifier = Modifier
                .weight(2f)
                .background(Color.Green)
                .padding(8.dp),
            textAlign = TextAlign.Center
        )
        // weight(1f): 남은 공간의 1/3 차지
        Text(
            "3",
            modifier = Modifier
                .weight(1f)
                .background(Color.Blue)
                .padding(8.dp),
            textAlign = TextAlign.Center,
            color = Color.White
        )
    }
}
```

```
weight 계산:

전체 = 1f + 2f + 1f = 4f

┌────────┬────────────────┬────────┐
│   1    │       2        │   3    │
│  1/4   │      2/4       │  1/4   │
│  25%   │      50%       │  25%   │
└────────┴────────────────┴────────┘
```

### ColumnScope의 weight

Column에서도 동일하게 `weight`를 사용하여 세로 공간을 비율로 나눌 수 있습니다.

```kotlin [compose-playground]
@Composable
fun ColumnWeightExample() {
    Column(modifier = Modifier.fillMaxSize()) {
        // 상단 헤더: 고정 크기
        Box(
            modifier = Modifier
                .fillMaxWidth()
                .height(56.dp)
                .background(Color.Blue)
        )

        // 중앙 콘텐츠: 남은 공간 모두 차지
        Box(
            modifier = Modifier
                .fillMaxWidth()
                .weight(1f)
                .background(Color.White)
        )

        // 하단 네비게이션: 고정 크기
        Box(
            modifier = Modifier
                .fillMaxWidth()
                .height(56.dp)
                .background(Color.Gray)
        )
    }
}
```

```
┌─────────────────────────┐
│ 헤더 (56dp 고정)         │
├─────────────────────────┤
│                         │
│ 콘텐츠 (weight(1f))     │
│ → 나머지 공간 모두 차지   │
│                         │
│                         │
├─────────────────────────┤
│ 네비게이션 (56dp 고정)    │
└─────────────────────────┘
```

### BoxScope의 matchParentSize와 align

`BoxScope`에서만 사용 가능한 수정자들입니다.

```kotlin [compose-playground]
@Composable
fun BoxScopeModifiers() {
    Box(modifier = Modifier.size(200.dp)) {
        // matchParentSize: Box의 크기에 영향을 주지 않으면서 부모 크기에 맞춤
        // fillMaxSize와 달리, 이 자식이 Box의 크기 측정에 참여하지 않음
        Box(
            modifier = Modifier
                .matchParentSize()       // BoxScope 전용!
                .background(Color.LightGray)
        )

        // align: 개별 자식의 위치 지정
        Text(
            "중앙",
            modifier = Modifier.align(Alignment.Center)  // BoxScope 전용!
        )
    }
}
```

### matchParentSize vs fillMaxSize

```kotlin [compose-playground]
@Composable
fun MatchParentSizeVsFillMaxSize() {
    // matchParentSize: 다른 자식이 Box 크기를 결정
    Box {
        Text("이 텍스트가 Box 크기를 결정합니다")
        Box(
            modifier = Modifier
                .matchParentSize()    // Text 크기에 맞춰짐
                .background(Color.Yellow.copy(alpha = 0.3f))
        )
    }

    // fillMaxSize: 이 자식이 부모를 최대한 채움 → Box도 커짐
    Box {
        Text("이 텍스트의 크기는 무시됨")
        Box(
            modifier = Modifier
                .fillMaxSize()        // 부모를 최대 크기로 만듦
                .background(Color.Yellow.copy(alpha = 0.3f))
        )
    }
}
```

```
matchParentSize:                    fillMaxSize:

Box 크기 = Text 크기에 맞춤         Box 크기 = 부모가 허용하는 최대 크기
┌──────────────────────┐           ┌──────────────────────────────┐
│ 이 텍스트가 Box 크기를 │           │ 이 텍스트의 크기는 무시됨      │
│ 결정합니다             │           │                              │
│ (배경이 텍스트 크기)    │           │                              │
└──────────────────────┘           │   (배경이 화면 전체)           │
                                   │                              │
                                   └──────────────────────────────┘
```

---

## 6. Modifier 추출과 재사용

반복되는 Modifier 조합은 변수로 **추출하여 재사용**할 수 있습니다.

### 지역 변수로 추출

```kotlin [compose-playground]
@Composable
fun ExtractedModifierExample() {
    // 공통 Modifier를 변수로 추출
    val cardModifier = Modifier
        .fillMaxWidth()
        .padding(horizontal = 16.dp, vertical = 8.dp)

    val textModifier = Modifier.padding(8.dp)

    Column {
        Card(modifier = cardModifier) {
            Text("카드 1", modifier = textModifier)
        }
        Card(modifier = cardModifier) {
            Text("카드 2", modifier = textModifier)
        }
        Card(modifier = cardModifier) {
            Text("카드 3", modifier = textModifier)
        }
    }
}
```

### 함수로 추출 (조건부 Modifier)

```kotlin [compose-playground]
// 조건에 따라 Modifier를 적용하는 확장 함수
fun Modifier.conditional(
    condition: Boolean,
    modifier: Modifier.() -> Modifier
): Modifier {
    return if (condition) {
        then(modifier(Modifier))
    } else {
        this
    }
}

// 사용 예시
@Composable
fun ConditionalModifierExample(isSelected: Boolean) {
    Box(
        modifier = Modifier
            .size(100.dp)
            .conditional(isSelected) {
                background(Color.Blue)
                    .border(2.dp, Color.White)
            }
    )
}
```

### then을 사용한 Modifier 합성

```kotlin [compose-playground]
@Composable
fun ModifierCompositionExample() {
    val baseModifier = Modifier
        .fillMaxWidth()
        .padding(16.dp)

    val clickableModifier = Modifier.clickable { /* 클릭 */ }

    // then으로 두 Modifier를 합침
    Text(
        "합성된 Modifier",
        modifier = baseModifier.then(clickableModifier)
    )
}
```

> **주의**: Modifier를 `remember`로 캐싱하지 마세요. Modifier 자체는 가볍고, `remember`로 캐싱하면 오히려 리컴포지션에서 올바르게 갱신되지 않을 수 있습니다.

---

## 7. 모든 컴포저블이 modifier를 받아야 하는 이유

커스텀 컴포저블을 만들 때, **반드시 `modifier` 매개변수를 제공**해야 합니다. 이것은 Compose의 **공식 권장 사항**입니다.

### 나쁜 예

```kotlin [compose-playground]
// 나쁜 예: modifier 매개변수가 없음
@Composable
fun BadGreeting(name: String) {
    Text(
        text = "안녕하세요, $name!",
        modifier = Modifier.padding(16.dp)  // 내부에서 고정
    )
}

// 호출하는 쪽에서 레이아웃을 조정할 수 없음!
BadGreeting("홍길동")  // padding을 바꾸고 싶은데 방법이 없음
```

### 좋은 예

```kotlin [compose-playground]
// 좋은 예: modifier 매개변수를 받고, 첫 번째 자식에 적용
@Composable
fun GoodGreeting(
    name: String,
    modifier: Modifier = Modifier  // 기본값은 빈 Modifier
) {
    Text(
        text = "안녕하세요, $name!",
        modifier = modifier.padding(16.dp)  // 외부 modifier에 내부 modifier를 추가
    )
}

// 호출하는 쪽에서 자유롭게 커스터마이징 가능!
GoodGreeting(
    name = "홍길동",
    modifier = Modifier
        .fillMaxWidth()
        .background(Color.Yellow)
)
```

### modifier 매개변수 규칙

```kotlin [compose-playground]
@Composable
fun MyComponent(
    // 1. 필수 매개변수들
    title: String,
    subtitle: String,
    // 2. modifier는 첫 번째 선택적 매개변수
    modifier: Modifier = Modifier,
    // 3. 기타 선택적 매개변수들
    onClick: () -> Unit = {},
    // 4. 마지막에 content 람다 (있는 경우)
    content: @Composable () -> Unit = {}
) {
    Column(modifier = modifier) {  // modifier를 최상위 컴포저블에 적용
        Text(title)
        Text(subtitle)
        content()
    }
}
```

**규칙 요약:**
1. `modifier` 매개변수 이름은 반드시 `modifier`여야 합니다.
2. 기본값은 `Modifier` (빈 Modifier)입니다.
3. 매개변수 순서에서 **첫 번째 선택적 매개변수**여야 합니다.
4. 최상위(루트) 컴포저블에 적용합니다.
5. 내부에서 추가할 Modifier는 `modifier` 뒤에 체이닝합니다.

---

## 8. XML View와의 비교

### 속성 대응 테이블

| XML View 속성 | Compose Modifier | 설명 |
|----------------|-----------------|------|
| `android:layout_width="match_parent"` | `Modifier.fillMaxWidth()` | 가로 전체 |
| `android:layout_width="wrap_content"` | `Modifier.wrapContentWidth()` | 콘텐츠 크기 (기본값) |
| `android:layout_width="100dp"` | `Modifier.width(100.dp)` | 고정 너비 |
| `android:layout_height="match_parent"` | `Modifier.fillMaxHeight()` | 세로 전체 |
| `android:padding="16dp"` | `Modifier.padding(16.dp)` | 내부 여백 |
| `android:layout_margin="16dp"` | `Modifier.padding(16.dp)` (바깥에) | 외부 여백 |
| `android:background="@color/blue"` | `Modifier.background(Color.Blue)` | 배경색 |
| `android:clickable="true"` | `Modifier.clickable { }` | 클릭 가능 |
| `android:elevation="4dp"` | `Modifier.shadow(4.dp)` | 그림자 |
| `android:layout_weight="1"` | `Modifier.weight(1f)` | 가중치 |
| `android:visibility="gone"` | 조건부 렌더링 (if문) | 표시/숨김 |
| `android:visibility="invisible"` | `Modifier.visible(false)` | 보이지 않지만 공간 차지 (Foundation 1.10+) |
| `android:alpha="0.5"` | `Modifier.alpha(0.5f)` | 투명도 |
| `android:rotation="45"` | `Modifier.rotate(45f)` | 회전 |
| `android:scaleX="1.5"` | `Modifier.scale(1.5f)` | 확대/축소 |

### 핵심 차이점

| 항목 | XML View | Compose Modifier |
|------|----------|-----------------|
| 여백 | margin (외부) + padding (내부) 분리 | **padding만 사용** (순서로 구분) |
| 표시/숨김 | `visibility = GONE/INVISIBLE/VISIBLE` | GONE → **조건문** (`if`), INVISIBLE → **`Modifier.visible(false)`** (Foundation 1.10+) |
| 속성 적용 | 순서 무관 (XML 속성은 독립적) | **순서가 중요** (체이닝 순서) |
| 재사용 | 스타일(style) 리소스 | Modifier 변수 추출 |
| 타입 안전성 | 런타임 에러 가능 | **컴파일 타임** 타입 체크 |

---

## 9. 실전 예제 모음

### 예제 1: 알림 배너

```kotlin [compose-playground]
@Composable
fun NotificationBanner(
    message: String,
    modifier: Modifier = Modifier
) {
    Row(
        modifier = modifier
            .fillMaxWidth()
            .background(Color(0xFFFFF3CD), RoundedCornerShape(8.dp))
            .border(1.dp, Color(0xFFFFD700), RoundedCornerShape(8.dp))
            .padding(12.dp),
        verticalAlignment = Alignment.CenterVertically
    ) {
        Icon(
            imageVector = Icons.Default.Warning,
            contentDescription = null,
            tint = Color(0xFFFF8C00),
            modifier = Modifier.size(24.dp)
        )
        Spacer(modifier = Modifier.width(12.dp))
        Text(
            text = message,
            modifier = Modifier.weight(1f),
            color = Color(0xFF856404)
        )
        Icon(
            imageVector = Icons.Default.Close,
            contentDescription = "닫기",
            modifier = Modifier
                .size(20.dp)
                .clickable { /* 닫기 처리 */ }
        )
    }
}
```

### 예제 2: 원형 아바타 + 상태 배지

```kotlin [compose-playground]
@Composable
fun AvatarWithBadge(
    initial: String,
    isOnline: Boolean,
    modifier: Modifier = Modifier
) {
    Box(modifier = modifier.size(56.dp)) {
        // 아바타 원형 배경
        Box(
            modifier = Modifier
                .fillMaxSize()
                .clip(CircleShape)
                .background(MaterialTheme.colorScheme.primary),
            contentAlignment = Alignment.Center
        ) {
            Text(
                text = initial,
                color = Color.White,
                fontSize = 20.sp,
                fontWeight = FontWeight.Bold
            )
        }

        // 온라인 상태 배지
        if (isOnline) {
            Box(
                modifier = Modifier
                    .size(14.dp)
                    .align(Alignment.BottomEnd)
                    .offset(x = (-2).dp, y = (-2).dp)
                    .border(2.dp, Color.White, CircleShape)
                    .background(Color.Green, CircleShape)
            )
        }
    }
}
```

```
아바타 + 배지 구조:

    ┌──────────┐
    │          │
    │    홍    │
    │          │
    │        🟢│ ← 온라인 배지 (BottomEnd)
    └──────────┘
```

### 예제 3: 다단 Modifier 적용

```kotlin [compose-playground]
@Composable
fun LayeredModifierExample() {
    Text(
        text = "겹겹이 쌓인 Modifier",
        color = Color.White,
        modifier = Modifier
            .padding(8.dp)                                    // 1. 바깥 투명 여백
            .shadow(8.dp, RoundedCornerShape(16.dp))          // 2. 그림자
            .background(Color.Blue, RoundedCornerShape(16.dp)) // 3. 파란 배경
            .border(2.dp, Color.White, RoundedCornerShape(16.dp)) // 4. 흰 테두리
            .padding(horizontal = 24.dp, vertical = 12.dp)    // 5. 안쪽 여백
    )
}
```

```
겹겹이 쌓인 구조 (단면도):

  ┌─ 1. 바깥 투명 여백 (8dp) ────────────────┐
  │  ░░░ 2. 그림자 (8dp) ░░░░░░░░░░░░░░░░░░ │
  │  ░╔═══════════════════════════════════╗░ │
  │  ░║ 3. 파란 배경                       ║░ │
  │  ░║ ┌─ 4. 흰 테두리 (2dp) ─────────┐  ║░ │
  │  ░║ │                               │  ║░ │
  │  ░║ │  5. 안쪽 여백 (24x12)         │  ║░ │
  │  ░║ │  [겹겹이 쌓인 Modifier]       │  ║░ │
  │  ░║ │                               │  ║░ │
  │  ░║ └───────────────────────────────┘  ║░ │
  │  ░╚═══════════════════════════════════╝░ │
  │  ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░ │
  └──────────────────────────────────────────┘
```

---

## 10. 정리 및 다음 단계

### 핵심 요약

| 개념 | 설명 |
|------|------|
| Modifier 체이닝 | `.`으로 연결, 바깥에서 안쪽 순서로 적용 |
| 순서가 중요 | `padding → background` vs `background → padding` 결과가 다름 |
| size vs requiredSize | size는 제약 존중, requiredSize는 제약 무시 |
| Scope Modifier | `weight` (Row/Column), `align`/`matchParentSize` (Box) |
| modifier 매개변수 | 모든 커스텀 컴포저블은 `modifier: Modifier = Modifier`를 받아야 함 |
| Modifier 추출 | 반복되는 Modifier는 변수로 추출하여 재사용 |

### 자주 하는 실수

1. **Modifier 순서를 무시**하고 아무렇게나 체이닝하기
2. 커스텀 컴포저블에서 **modifier 매개변수를 빠뜨리기**
3. `fillMaxSize()`를 남용하여 **의도치 않게 화면 전체를 차지**하기
4. `weight`를 Row/Column 밖에서 사용하려고 하기 (컴파일 에러 발생)
5. Modifier를 `remember`로 캐싱하기 (불필요하고 위험)
6. `Modifier.alpha(0f)`로 숨기기 - Foundation 1.10+에서는 `Modifier.visible(false)`가 draw를 완전히 건너뛰므로 더 효율적입니다

### 다음 학습

- [03. Arrangement와 Alignment](03-arrangement-and-alignment.md) - Modifier와 함께 사용하는 정밀한 배치와 정렬을 마스터합니다.
- [04. 제약 조건과 반응형 레이아웃](04-constraints-and-responsive.md) - Modifier의 크기 제약이 어떻게 작동하는지 깊이 이해합니다.
