# Arrangement와 Alignment 완전 가이드

> **"레이아웃은 '어떤 컴포넌트를 쓸까'가 아니라, '어디에 어떻게 배치할까'에서 완성된다."**
> Column, Row, Box의 자식들을 정확한 위치에 배치하는 Arrangement와 Alignment를 마스터합시다.

---

## 목차

1. [주축과 교차축 이해하기](#1-주축과-교차축-이해하기)
2. [Column의 Arrangement와 Alignment](#2-column의-arrangement와-alignment)
3. [Row의 Arrangement와 Alignment](#3-row의-arrangement와-alignment)
4. [Box의 contentAlignment](#4-box의-contentalignment)
5. [Arrangement 옵션 상세](#5-arrangement-옵션-상세)
6. [Alignment 옵션 상세](#6-alignment-옵션-상세)
7. [개별 자식 정렬 (align)](#7-개별-자식-정렬-align)
8. [XML View와의 비교](#8-xml-view와의-비교)
9. [실전 예제](#9-실전-예제)
10. [정리 및 다음 단계](#10-정리-및-다음-단계)

---

## 1. 주축과 교차축 이해하기

Arrangement와 Alignment를 이해하려면 먼저 **주축(Main Axis)** 과 **교차축(Cross Axis)** 의 개념을 알아야 합니다.

```
Column의 축:                    Row의 축:

  교차축 (가로)                    주축 (가로)
  ←─────────→                    ←─────────────→
  ┌──────────┐ ↑                 ┌──────────────┐ ↑
  │ [Child1] │ │                 │ [A] [B] [C]  │ │ 교차축
  │ [Child2] │ │ 주축 (세로)      │              │ │ (세로)
  │ [Child3] │ │                 └──────────────┘ ↓
  └──────────┘ ↓
```

| 레이아웃 | 주축 (Arrangement) | 교차축 (Alignment) |
|----------|-------------------|-------------------|
| `Column` | 세로 (`verticalArrangement`) | 가로 (`horizontalAlignment`) |
| `Row` | 가로 (`horizontalArrangement`) | 세로 (`verticalAlignment`) |
| `Box` | 없음 | `contentAlignment` (2D 정렬) |

**핵심 기억법:**
- **Arrangement** = 자식들이 **나열되는 방향**(주축)으로 어떻게 분배할 것인가
- **Alignment** = 자식들이 나열되는 방향과 **수직인 방향**(교차축)으로 어디에 맞출 것인가

---

## 2. Column의 Arrangement와 Alignment

Column은 자식을 **세로로** 나열하므로:
- `verticalArrangement`: 세로 방향(주축)으로 자식들의 **분배**
- `horizontalAlignment`: 가로 방향(교차축)으로 자식들의 **정렬**

### verticalArrangement 옵션

```kotlin
@Composable
fun ColumnArrangementExamples() {
    // 각 예시는 Column(modifier = Modifier.fillMaxSize()) 안에 세 개의 Box를 배치
    val boxModifier = Modifier.size(50.dp).background(Color.Blue)

    // Arrangement.Top (기본값)
    Column(
        modifier = Modifier.fillMaxSize(),
        verticalArrangement = Arrangement.Top
    ) {
        Box(modifier = boxModifier)
        Box(modifier = boxModifier)
        Box(modifier = boxModifier)
    }
}
```

**verticalArrangement 시각화:**

```
Top (기본)        Center          Bottom
┌──────────┐    ┌──────────┐    ┌──────────┐
│ [■■■■]   │    │          │    │          │
│ [■■■■]   │    │ [■■■■]   │    │          │
│ [■■■■]   │    │ [■■■■]   │    │          │
│          │    │ [■■■■]   │    │          │
│          │    │          │    │ [■■■■]   │
│          │    │          │    │ [■■■■]   │
│          │    │          │    │ [■■■■]   │
└──────────┘    └──────────┘    └──────────┘

SpaceBetween     SpaceAround     SpaceEvenly
┌──────────┐    ┌──────────┐    ┌──────────┐
│ [■■■■]   │    │          │    │          │
│          │    │ [■■■■]   │    │ [■■■■]   │
│          │    │          │    │          │
│ [■■■■]   │    │ [■■■■]   │    │ [■■■■]   │
│          │    │          │    │          │
│          │    │ [■■■■]   │    │ [■■■■]   │
│ [■■■■]   │    │          │    │          │
└──────────┘    └──────────┘    └──────────┘
```

### horizontalAlignment 옵션

```kotlin
@Composable
fun ColumnAlignmentExamples() {
    val boxModifier = Modifier.size(width = 80.dp, height = 40.dp).background(Color.Blue)

    Column(
        modifier = Modifier.fillMaxWidth().height(200.dp),
        horizontalAlignment = Alignment.CenterHorizontally
    ) {
        Box(modifier = boxModifier)
        Box(modifier = Modifier.size(width = 120.dp, height = 40.dp).background(Color.Red))
        Box(modifier = Modifier.size(width = 60.dp, height = 40.dp).background(Color.Green))
    }
}
```

**horizontalAlignment 시각화:**

```
Start (기본)            CenterHorizontally          End
┌──────────────────┐   ┌──────────────────┐   ┌──────────────────┐
│ [■■■■]           │   │     [■■■■]       │   │           [■■■■] │
│ [■■■■■■■]        │   │   [■■■■■■■]     │   │        [■■■■■■■] │
│ [■■■]            │   │      [■■■]       │   │            [■■■] │
└──────────────────┘   └──────────────────┘   └──────────────────┘
```

### Column 전체 예제

```kotlin
@Composable
fun ColumnFullExample() {
    Column(
        modifier = Modifier
            .fillMaxSize()
            .padding(16.dp),
        verticalArrangement = Arrangement.SpaceEvenly,
        horizontalAlignment = Alignment.CenterHorizontally
    ) {
        Text("첫 번째", fontSize = 18.sp)
        Text("두 번째", fontSize = 18.sp)
        Text("세 번째", fontSize = 18.sp)
    }
}
```

---

## 3. Row의 Arrangement와 Alignment

Row는 자식을 **가로로** 나열하므로:
- `horizontalArrangement`: 가로 방향(주축)으로 자식들의 **분배**
- `verticalAlignment`: 세로 방향(교차축)으로 자식들의 **정렬**

### horizontalArrangement 옵션

```kotlin
@Composable
fun RowArrangementExamples() {
    val boxModifier = Modifier.size(50.dp).background(Color.Blue)

    Row(
        modifier = Modifier.fillMaxWidth(),
        horizontalArrangement = Arrangement.SpaceBetween
    ) {
        Box(modifier = boxModifier)
        Box(modifier = boxModifier)
        Box(modifier = boxModifier)
    }
}
```

**horizontalArrangement 시각화:**

```
Start (기본):
┌──────────────────────────────────┐
│ [■] [■] [■]                     │
└──────────────────────────────────┘

Center:
┌──────────────────────────────────┐
│           [■] [■] [■]           │
└──────────────────────────────────┘

End:
┌──────────────────────────────────┐
│                     [■] [■] [■] │
└──────────────────────────────────┘

SpaceBetween:
┌──────────────────────────────────┐
│ [■]            [■]           [■] │
└──────────────────────────────────┘

SpaceAround:
┌──────────────────────────────────┐
│   [■]        [■]        [■]     │
└──────────────────────────────────┘
  a    2a       2a        2a    a   (a = 바깥 간격, 2a = 안쪽 간격)

SpaceEvenly:
┌──────────────────────────────────┐
│    [■]       [■]       [■]      │
└──────────────────────────────────┘
  a      a       a       a      a   (모든 간격 동일)
```

### verticalAlignment 옵션

```kotlin
@Composable
fun RowAlignmentExamples() {
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .height(100.dp)
            .background(Color.LightGray),
        verticalAlignment = Alignment.CenterVertically
    ) {
        Text("작은 텍스트", fontSize = 12.sp)
        Text("중간 텍스트", fontSize = 18.sp)
        Text("큰 텍스트", fontSize = 24.sp)
    }
}
```

**verticalAlignment 시각화:**

```
Top (기본):                  CenterVertically:              Bottom:
┌─────────────────────┐    ┌─────────────────────┐    ┌─────────────────────┐
│ [작] [중간] [큰]     │    │                     │    │                     │
│      [텍스] [텍스트]  │    │ [작] [중간] [큰]    │    │                     │
│            [  트  ]  │    │      [텍스] [텍스트] │    │ [작] [중간] [큰]    │
│                     │    │            [  트  ]  │    │      [텍스] [텍스트] │
│                     │    │                     │    │            [  트  ] │
└─────────────────────┘    └─────────────────────┘    └─────────────────────┘
```

---

## 4. Box의 contentAlignment

Box는 자식을 겹쳐 배치하므로, **2차원 정렬**을 `contentAlignment`로 지정합니다.

### contentAlignment 옵션

```kotlin
@Composable
fun BoxContentAlignmentExample() {
    Box(
        modifier = Modifier
            .size(200.dp)
            .background(Color.LightGray),
        contentAlignment = Alignment.Center  // 모든 자식의 기본 정렬
    ) {
        Text("가운데 정렬")
    }
}
```

**contentAlignment의 9가지 위치:**

```
┌──────────────────────────────────┐
│ TopStart    TopCenter    TopEnd   │
│                                  │
│ CenterStart  Center  CenterEnd   │
│                                  │
│ BottomStart BottomCenter BottomEnd│
└──────────────────────────────────┘
```

### 코드로 보는 9가지 위치

```kotlin
@Composable
fun AllBoxAlignments() {
    val alignments = listOf(
        "TopStart" to Alignment.TopStart,
        "TopCenter" to Alignment.TopCenter,
        "TopEnd" to Alignment.TopEnd,
        "CenterStart" to Alignment.CenterStart,
        "Center" to Alignment.Center,
        "CenterEnd" to Alignment.CenterEnd,
        "BottomStart" to Alignment.BottomStart,
        "BottomCenter" to Alignment.BottomCenter,
        "BottomEnd" to Alignment.BottomEnd
    )

    // 3x3 그리드로 시각화
    Column {
        for (row in alignments.chunked(3)) {
            Row(modifier = Modifier.fillMaxWidth()) {
                for ((name, alignment) in row) {
                    Box(
                        modifier = Modifier
                            .weight(1f)
                            .height(100.dp)
                            .padding(4.dp)
                            .background(Color.LightGray),
                        contentAlignment = alignment
                    ) {
                        Text(name, fontSize = 10.sp)
                    }
                }
            }
        }
    }
}
```

---

## 5. Arrangement 옵션 상세

### Arrangement.spacedBy()

`spacedBy`는 자식들 사이에 **균일한 고정 간격**을 넣습니다. Spacer를 일일이 추가하지 않아도 됩니다.

```kotlin
@Composable
fun SpacedByExample() {
    // Column에서 세로 간격
    Column(
        verticalArrangement = Arrangement.spacedBy(12.dp)
    ) {
        Text("항목 1")
        Text("항목 2")
        Text("항목 3")
    }

    // Row에서 가로 간격
    Row(
        horizontalArrangement = Arrangement.spacedBy(8.dp)
    ) {
        Chip("Kotlin")
        Chip("Compose")
        Chip("Android")
    }
}
```

**spacedBy 시각화:**

```
spacedBy(12.dp) in Column:        spacedBy(8.dp) in Row:

┌──────────────────┐             ┌──────────────────────────┐
│ [항목 1]          │             │ [Kotlin] 8dp [Compose]   │
│     12dp          │             │    8dp [Android]         │
│ [항목 2]          │             └──────────────────────────┘
│     12dp          │
│ [항목 3]          │
└──────────────────┘
```

> **팁**: `spacedBy()`와 다른 Arrangement를 **함께** 사용할 수도 있습니다. 예를 들어 `Arrangement.spacedBy(8.dp, Alignment.CenterVertically)`는 간격을 넣으면서 정렬도 지정합니다.

### 각 Arrangement의 간격 분배 원리

세 개의 자식 `[A]`, `[B]`, `[C]`가 있고, 남은 여유 공간이 `S`일 때:

```
SpaceBetween:  자식 사이에만 균등 분배
┌───────────────────────────────┐
│[A]      S/2      [B]      S/2      [C]│
└───────────────────────────────┘
  양 끝에 간격 없음

SpaceAround:  자식 양쪽에 균등 분배 (바깥은 안쪽의 절반)
┌───────────────────────────────┐
│ S/6 [A] S/3  [B] S/3  [C] S/6│
└───────────────────────────────┘
  바깥 간격 = 안쪽 간격 / 2

SpaceEvenly:  모든 공간을 균등 분배 (바깥 포함)
┌───────────────────────────────┐
│ S/4 [A] S/4  [B] S/4  [C] S/4│
└───────────────────────────────┘
  모든 간격 동일
```

### Arrangement 비교 테이블

| Arrangement | 시작 간격 | 자식 사이 간격 | 끝 간격 | 사용 시나리오 |
|-------------|----------|---------------|---------|-------------|
| `Top` / `Start` | 0 | 0 | 나머지 | 기본값, 왼쪽/위 정렬 |
| `Bottom` / `End` | 나머지 | 0 | 0 | 오른쪽/아래 정렬 |
| `Center` | 균등 | 0 | 균등 | 가운데 정렬 |
| `SpaceBetween` | 0 | 균등 | 0 | 양 끝 배치 |
| `SpaceAround` | 1x | 2x | 1x | 균형 잡힌 간격 |
| `SpaceEvenly` | 균등 | 균등 | 균등 | 완전 균등 분배 |
| `spacedBy(n.dp)` | 0 | n.dp | 0 | 고정 간격 |

---

## 6. Alignment 옵션 상세

### 1차원 Alignment (Column, Row에서 사용)

**가로(Horizontal) 정렬:**
- `Alignment.Start` - 시작점 (LTR: 왼쪽)
- `Alignment.CenterHorizontally` - 가로 중앙
- `Alignment.End` - 끝점 (LTR: 오른쪽)

**세로(Vertical) 정렬:**
- `Alignment.Top` - 위쪽
- `Alignment.CenterVertically` - 세로 중앙
- `Alignment.Bottom` - 아래쪽

### 2차원 Alignment (Box의 contentAlignment에서 사용)

```
Alignment.TopStart       Alignment.TopCenter       Alignment.TopEnd
Alignment.CenterStart    Alignment.Center          Alignment.CenterEnd
Alignment.BottomStart    Alignment.BottomCenter    Alignment.BottomEnd
```

### Alignment 사용 위치 정리

| 위치 | 매개변수명 | 사용 가능한 Alignment |
|------|-----------|---------------------|
| Column의 교차축 | `horizontalAlignment` | `Start`, `CenterHorizontally`, `End` |
| Row의 교차축 | `verticalAlignment` | `Top`, `CenterVertically`, `Bottom` |
| Box의 콘텐츠 | `contentAlignment` | 9가지 2D Alignment |
| Column 자식의 개별 정렬 | `Modifier.align()` | `Start`, `CenterHorizontally`, `End` |
| Row 자식의 개별 정렬 | `Modifier.align()` | `Top`, `CenterVertically`, `Bottom` |
| Box 자식의 개별 정렬 | `Modifier.align()` | 9가지 2D Alignment |

---

## 7. 개별 자식 정렬 (align)

레이아웃의 `Alignment`은 **모든 자식**에 적용됩니다. 하지만 **특정 자식만 다르게 정렬**하고 싶다면 `Modifier.align()`을 사용합니다.

### Column에서 개별 정렬

```kotlin
@Composable
fun ColumnIndividualAlignment() {
    Column(
        modifier = Modifier
            .fillMaxWidth()
            .padding(16.dp),
        horizontalAlignment = Alignment.Start  // 기본: 왼쪽 정렬
    ) {
        Text("왼쪽 정렬 (기본)")
        Text(
            "가운데 정렬",
            modifier = Modifier.align(Alignment.CenterHorizontally)  // 개별 오버라이드
        )
        Text(
            "오른쪽 정렬",
            modifier = Modifier.align(Alignment.End)  // 개별 오버라이드
        )
    }
}
```

```
┌────────────────────────────────┐
│ 왼쪽 정렬 (기본)                │  ← Start (Column 기본값)
│         가운데 정렬             │  ← CenterHorizontally (개별)
│                   오른쪽 정렬   │  ← End (개별)
└────────────────────────────────┘
```

### Row에서 개별 정렬

```kotlin
@Composable
fun RowIndividualAlignment() {
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .height(100.dp)
            .background(Color.LightGray),
        verticalAlignment = Alignment.CenterVertically  // 기본: 세로 중앙
    ) {
        Text("중앙")  // 기본 정렬 따름
        Text(
            "위",
            modifier = Modifier.align(Alignment.Top)  // 개별: 위
        )
        Text(
            "아래",
            modifier = Modifier.align(Alignment.Bottom)  // 개별: 아래
        )
    }
}
```

```
┌────────────────────────────────┐
│          [위]                   │
│ [중앙]                          │
│                    [아래]       │
└────────────────────────────────┘
```

### Box에서 개별 정렬

```kotlin
@Composable
fun BoxIndividualAlignment() {
    Box(
        modifier = Modifier
            .fillMaxWidth()
            .height(200.dp)
            .background(Color.LightGray),
        contentAlignment = Alignment.Center  // 기본: 가운데
    ) {
        Text("가운데 (기본)")
        Text(
            "왼쪽 위",
            modifier = Modifier.align(Alignment.TopStart)
        )
        Text(
            "오른쪽 아래",
            modifier = Modifier.align(Alignment.BottomEnd)
        )
    }
}
```

```
┌────────────────────────────────┐
│ 왼쪽 위                        │
│                                │
│           가운데 (기본)          │
│                                │
│                    오른쪽 아래   │
└────────────────────────────────┘
```

---

## 8. XML View와의 비교

### gravity 대응 테이블

| XML View | Compose | 적용 대상 |
|----------|---------|----------|
| `android:gravity="center"` | `contentAlignment = Alignment.Center` (Box) | 컨테이너의 모든 자식 |
| `android:gravity="center_vertical"` | `verticalAlignment = Alignment.CenterVertically` (Row) | Row의 모든 자식 |
| `android:gravity="center_horizontal"` | `horizontalAlignment = Alignment.CenterHorizontally` (Column) | Column의 모든 자식 |
| `android:layout_gravity="center"` | `Modifier.align(Alignment.Center)` (BoxScope) | 개별 자식 |
| `android:layout_gravity="end"` | `Modifier.align(Alignment.End)` (ColumnScope) | 개별 자식 |

### 핵심 차이점

| 항목 | XML View | Compose |
|------|----------|---------|
| 정렬 지정 | `gravity` 하나로 통합 | `Arrangement`(분배) + `Alignment`(정렬) 분리 |
| 적용 범위 | `gravity` (컨테이너) / `layout_gravity` (자식) | 레이아웃 매개변수 (전체) / `Modifier.align()` (개별) |
| 간격 분배 | `layout_weight` + 수동 설정 | `SpaceBetween`, `SpaceEvenly`, `SpaceAround`, `spacedBy` |
| 기본 방향 | `orientation` 속성 | Column/Row **선택 자체가 방향 결정** |

### XML vs Compose 코드 비교

**XML: 가운데 정렬된 세로 레이아웃**

```xml
<LinearLayout
    android:layout_width="match_parent"
    android:layout_height="match_parent"
    android:orientation="vertical"
    android:gravity="center">

    <TextView
        android:layout_width="wrap_content"
        android:layout_height="wrap_content"
        android:text="가운데 정렬" />

    <TextView
        android:layout_width="wrap_content"
        android:layout_height="wrap_content"
        android:text="가운데 정렬" />
</LinearLayout>
```

**Compose: 동일한 레이아웃**

```kotlin
@Composable
fun CenteredColumn() {
    Column(
        modifier = Modifier.fillMaxSize(),
        verticalArrangement = Arrangement.Center,
        horizontalAlignment = Alignment.CenterHorizontally
    ) {
        Text("가운데 정렬")
        Text("가운데 정렬")
    }
}
```

---

## 9. 실전 예제

### 예제 1: 카드 레이아웃

```kotlin
@Composable
fun InfoCard(
    title: String,
    description: String,
    actionText: String,
    onAction: () -> Unit,
    modifier: Modifier = Modifier
) {
    Card(
        modifier = modifier
            .fillMaxWidth()
            .padding(horizontal = 16.dp, vertical = 8.dp),
        elevation = CardDefaults.cardElevation(defaultElevation = 2.dp)
    ) {
        Column(
            modifier = Modifier.padding(16.dp),
            verticalArrangement = Arrangement.spacedBy(8.dp)  // 자식 사이 8dp 간격
        ) {
            // 상단: 제목 + 아이콘
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Text(
                    text = title,
                    fontSize = 18.sp,
                    fontWeight = FontWeight.Bold
                )
                Icon(
                    imageVector = Icons.Default.MoreVert,
                    contentDescription = "더보기"
                )
            }

            // 설명
            Text(
                text = description,
                color = MaterialTheme.colorScheme.onSurfaceVariant,
                lineHeight = 20.sp
            )

            // 하단: 액션 버튼 오른쪽 정렬
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.End
            ) {
                TextButton(onClick = onAction) {
                    Text(actionText)
                }
            }
        }
    }
}
```

**구조:**

```
╭─────────────────────────────────╮
│ [제목 텍스트]              [⋮]   │  ← SpaceBetween
│                                 │
│ 설명 텍스트가 여기에              │
│ 표시됩니다.                      │
│                                 │
│                    [액션 버튼]   │  ← Arrangement.End
╰─────────────────────────────────╯
```

### 예제 2: 리스트 아이템

```kotlin
@Composable
fun MessageItem(
    senderName: String,
    message: String,
    time: String,
    unreadCount: Int,
    modifier: Modifier = Modifier
) {
    Row(
        modifier = modifier
            .fillMaxWidth()
            .clickable { /* 클릭 처리 */ }
            .padding(horizontal = 16.dp, vertical = 12.dp),
        verticalAlignment = Alignment.CenterVertically,
        horizontalArrangement = Arrangement.spacedBy(12.dp)
    ) {
        // 아바타
        Box(
            modifier = Modifier
                .size(48.dp)
                .background(
                    MaterialTheme.colorScheme.primaryContainer,
                    CircleShape
                ),
            contentAlignment = Alignment.Center
        ) {
            Text(
                text = senderName.first().toString(),
                fontWeight = FontWeight.Bold,
                color = MaterialTheme.colorScheme.onPrimaryContainer
            )
        }

        // 이름 + 메시지 (세로 배치, 남은 공간 차지)
        Column(
            modifier = Modifier.weight(1f),
            verticalArrangement = Arrangement.spacedBy(4.dp)
        ) {
            Text(
                text = senderName,
                fontWeight = FontWeight.SemiBold
            )
            Text(
                text = message,
                maxLines = 1,
                overflow = TextOverflow.Ellipsis,
                color = MaterialTheme.colorScheme.onSurfaceVariant,
                fontSize = 14.sp
            )
        }

        // 시간 + 읽지 않은 수 (세로 배치, 오른쪽 정렬)
        Column(
            horizontalAlignment = Alignment.End,
            verticalArrangement = Arrangement.spacedBy(4.dp)
        ) {
            Text(
                text = time,
                fontSize = 12.sp,
                color = MaterialTheme.colorScheme.onSurfaceVariant
            )
            if (unreadCount > 0) {
                Box(
                    modifier = Modifier
                        .size(20.dp)
                        .background(
                            MaterialTheme.colorScheme.primary,
                            CircleShape
                        ),
                    contentAlignment = Alignment.Center
                ) {
                    Text(
                        text = unreadCount.toString(),
                        color = Color.White,
                        fontSize = 11.sp,
                        fontWeight = FontWeight.Bold
                    )
                }
            }
        }
    }
}
```

**구조:**

```
┌──────────────────────────────────────────┐
│  ┌────┐                                  │
│  │ 홍 │  홍길동             오후 2:30     │
│  │    │  안녕하세요, 오늘 ...    (3)      │
│  └────┘                                  │
└──────────────────────────────────────────┘
   ↑              ↑                 ↑
 Box(Center)   Column(weight)   Column(End)
```

### 예제 3: 로그인 화면

```kotlin
@Composable
fun LoginScreen(modifier: Modifier = Modifier) {
    Column(
        modifier = modifier
            .fillMaxSize()
            .padding(32.dp),
        verticalArrangement = Arrangement.Center,       // 세로 중앙
        horizontalAlignment = Alignment.CenterHorizontally  // 가로 중앙
    ) {
        // 앱 로고
        Icon(
            imageVector = Icons.Default.Lock,
            contentDescription = "앱 로고",
            modifier = Modifier.size(80.dp),
            tint = MaterialTheme.colorScheme.primary
        )

        Spacer(modifier = Modifier.height(32.dp))

        // 앱 이름
        Text(
            text = "My App",
            fontSize = 28.sp,
            fontWeight = FontWeight.Bold
        )

        Spacer(modifier = Modifier.height(48.dp))

        // 이메일 입력
        OutlinedTextField(
            value = "",
            onValueChange = { },
            label = { Text("이메일") },
            modifier = Modifier.fillMaxWidth()
        )

        Spacer(modifier = Modifier.height(16.dp))

        // 비밀번호 입력
        OutlinedTextField(
            value = "",
            onValueChange = { },
            label = { Text("비밀번호") },
            modifier = Modifier.fillMaxWidth()
        )

        Spacer(modifier = Modifier.height(32.dp))

        // 로그인 버튼
        Button(
            onClick = { },
            modifier = Modifier
                .fillMaxWidth()
                .height(50.dp)
        ) {
            Text("로그인")
        }

        Spacer(modifier = Modifier.height(16.dp))

        // 회원가입 링크
        TextButton(onClick = { }) {
            Text("계정이 없으신가요? 회원가입")
        }
    }
}
```

**구조:**

```
┌─────────────────────────────┐
│                             │
│                             │
│            🔒               │  ← Center
│          My App             │
│                             │
│    ┌─────────────────────┐  │
│    │ 이메일               │  │  ← fillMaxWidth
│    └─────────────────────┘  │
│    ┌─────────────────────┐  │
│    │ 비밀번호             │  │  ← fillMaxWidth
│    └─────────────────────┘  │
│                             │
│    [ ====== 로그인 ====== ]  │  ← fillMaxWidth
│                             │
│    계정이 없으신가요? 회원가입 │
│                             │
│                             │
└─────────────────────────────┘
       ↑ Arrangement.Center +
         Alignment.CenterHorizontally
```

---

## 10. 정리 및 다음 단계

### 핵심 요약

| 개념 | Column | Row | Box |
|------|--------|-----|-----|
| 주축 배치 | `verticalArrangement` | `horizontalArrangement` | - |
| 교차축 정렬 | `horizontalAlignment` | `verticalAlignment` | - |
| 콘텐츠 정렬 | - | - | `contentAlignment` |
| 개별 정렬 | `Modifier.align(Horizontal)` | `Modifier.align(Vertical)` | `Modifier.align(2D)` |

### Arrangement 빠른 참조

| 옵션 | 효과 |
|------|------|
| `Top` / `Start` | 시작 쪽에 몰아서 배치 |
| `Bottom` / `End` | 끝 쪽에 몰아서 배치 |
| `Center` | 가운데로 모아서 배치 |
| `SpaceBetween` | 양 끝에 붙이고, 사이 균등 |
| `SpaceAround` | 바깥 간격 = 안쪽 간격/2 |
| `SpaceEvenly` | 모든 간격 완전 균등 |
| `spacedBy(n.dp)` | 자식 사이에 고정 n.dp 간격 |

### 설계 팁

1. **SpaceBetween**은 헤더(제목 왼쪽 + 아이콘 오른쪽) 패턴에 자주 사용됩니다.
2. **spacedBy**는 리스트 아이템 간격에 가장 깔끔한 방법입니다.
3. **CenterVertically**는 Row에서 높이가 다른 요소들을 정렬할 때 필수입니다.
4. 전체 화면 레이아웃에서는 `Arrangement.Center` + `Alignment.CenterHorizontally`로 중앙 배치를 쉽게 구현할 수 있습니다.
5. **FlexBox 레이아웃**: Foundation 1.10 (BOM `2026.02.01`)부터 추가된 `FlexBox`는 `FlexBoxConfig`를 통해 flex-grow, flex-shrink, 커스텀 래핑 전략 등을 구성할 수 있습니다. Column/Row의 Arrangement만으로 표현하기 어려운 복잡한 분배 로직이 필요할 때 활용하세요.

### 다음 학습

- [04. 제약 조건과 반응형 레이아웃](04-constraints-and-responsive.md) - 화면 크기에 따라 레이아웃을 동적으로 변경하는 방법을 배웁니다.
