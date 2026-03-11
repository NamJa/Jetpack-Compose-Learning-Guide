# Column, Row, Box 완전 정복

> **"UI는 결국 '무엇을 어디에 배치할 것인가'의 문제다."**
> Compose에서 레이아웃의 기본 단위인 Column, Row, Box를 이해하면, 어떤 화면이든 만들 수 있습니다.

---

## 목차

1. [레이아웃의 기초 개념](#1-레이아웃의-기초-개념)
2. [Column — 세로 배치](#2-column--세로-배치)
3. [Row — 가로 배치](#3-row--가로-배치)
4. [Box — 겹치기 배치](#4-box--겹치기-배치)
5. [XML View와의 비교](#5-xml-view와의-비교)
6. [중첩 레이아웃](#6-중첩-레이아웃)
7. [Spacer로 간격 추가](#7-spacer로-간격-추가)
8. [Surface로 배경과 그림자 적용](#8-surface로-배경과-그림자-적용)
9. [실전 예제: 프로필 카드 만들기](#9-실전-예제-프로필-카드-만들기)
10. [정리 및 다음 단계](#10-정리-및-다음-단계)

---

## 1. 레이아웃의 기초 개념

Jetpack Compose에서 화면을 구성하려면 **자식 컴포저블을 어떤 방향으로 배치할지** 결정해야 합니다. Compose는 이를 위해 세 가지 기본 레이아웃 컴포저블을 제공합니다.

| 레이아웃 | 배치 방향 | 한 줄 설명 |
|----------|-----------|------------|
| `Column` | 세로 (위 → 아래) | 자식들을 **수직**으로 나열 |
| `Row` | 가로 (왼쪽 → 오른쪽) | 자식들을 **수평**으로 나열 |
| `Box` | 겹침 (뒤 → 앞) | 자식들을 **겹쳐서** 배치 |

> **Foundation 1.10 새 기능**: Compose Foundation 1.10 (BOM `2026.02.01`)부터 `FlexBox` 레이아웃이 추가되었습니다. `FlexBoxConfig`와 `Modifier.flex`를 사용하여 flex-grow, flex-shrink, 커스텀 래핑 등 CSS FlexBox와 유사한 유연한 레이아웃을 구성할 수 있습니다. 기본적인 레이아웃은 Column, Row, Box만으로 충분하지만, 복잡한 유동적 배치가 필요한 경우 FlexBox도 고려해 보세요.

```
Column (세로)       Row (가로)         Box (겹침)
┌──────────┐      ┌──────────────┐    ┌──────────┐
│ [Child1] │      │ [A] [B] [C]  │    │ ┌──────┐ │
│ [Child2] │      │              │    │ │ 뒤   │ │
│ [Child3] │      └──────────────┘    │ │ ┌──┐ │ │
└──────────┘                          │ │ │앞│ │ │
                                      │ │ └──┘ │ │
                                      │ └──────┘ │
                                      └──────────┘
```

> **핵심 원리**: Column, Row, Box는 모두 내부에 `@Composable` 콘텐츠를 받는 **컨테이너 함수**입니다. 이 세 가지를 조합하면 거의 모든 레이아웃을 표현할 수 있습니다.

---

## 2. Column — 세로 배치

`Column`은 자식 컴포저블을 **위에서 아래로** 순서대로 배치합니다. XML의 `LinearLayout(orientation="vertical")`에 대응합니다.

### 기본 사용법

```kotlin [compose-playground]
@Composable
fun ColumnExample() {
    Column {
        Text("첫 번째 줄")
        Text("두 번째 줄")
        Text("세 번째 줄")
    }
}
```

**결과 구조:**

```
┌─────────────────┐
│ 첫 번째 줄       │
│ 두 번째 줄       │
│ 세 번째 줄       │
└─────────────────┘
```

### Column에 Modifier 적용

```kotlin [compose-playground]
@Composable
fun StyledColumn() {
    Column(
        modifier = Modifier
            .fillMaxWidth()          // 가로 전체 채움
            .padding(16.dp)          // 내부 여백 16dp
            .background(Color.LightGray) // 배경색
    ) {
        Text("이름: 홍길동")
        Text("나이: 25세")
        Text("직업: Android 개발자")
    }
}
```

**결과 구조:**

```
┌─────────────────────────────────┐
│ ┌─ padding 16dp ─────────────┐  │
│ │                             │  │
│ │  이름: 홍길동                │  │
│ │  나이: 25세                  │  │
│ │  직업: Android 개발자        │  │
│ │                             │  │
│ └─────────────────────────────┘  │
└─────────────────────────────────┘
         fillMaxWidth()
```

### Column의 주요 매개변수

```kotlin [compose-playground]
Column(
    modifier = Modifier,                              // 수정자
    verticalArrangement = Arrangement.Top,             // 세로 방향 배치 방식
    horizontalAlignment = Alignment.Start,             // 가로 방향 정렬
    content = { /* 자식 컴포저블 */ }
)
```

> **기억하세요**: Column에서 `verticalArrangement`는 자식들이 **나열되는 방향**(주축)의 배치를, `horizontalAlignment`는 **교차축** 정렬을 담당합니다. 이 내용은 [03. Arrangement와 Alignment](03-arrangement-and-alignment.md)에서 더 자세히 다룹니다.

---

## 3. Row — 가로 배치

`Row`는 자식 컴포저블을 **왼쪽에서 오른쪽으로** 순서대로 배치합니다. XML의 `LinearLayout(orientation="horizontal")`에 대응합니다.

### 기본 사용법

```kotlin [compose-playground]
@Composable
fun RowExample() {
    Row {
        Text("A")
        Text("B")
        Text("C")
    }
}
```

**결과 구조:**

```
┌───────────────┐
│ [A] [B] [C]   │
└───────────────┘
```

### Row에 Modifier 적용

```kotlin [compose-playground]
@Composable
fun StyledRow() {
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .padding(8.dp),
        horizontalArrangement = Arrangement.SpaceBetween,
        verticalAlignment = Alignment.CenterVertically
    ) {
        Text("왼쪽")
        Text("가운데")
        Text("오른쪽")
    }
}
```

**결과 구조 (SpaceBetween):**

```
┌─────────────────────────────────┐
│ [왼쪽]      [가운데]      [오른쪽] │
└─────────────────────────────────┘
← ────── 균등한 간격 ────── →
```

### Row의 주요 매개변수

```kotlin [compose-playground]
Row(
    modifier = Modifier,                                // 수정자
    horizontalArrangement = Arrangement.Start,           // 가로 방향 배치 방식
    verticalAlignment = Alignment.Top,                   // 세로 방향 정렬
    content = { /* 자식 컴포저블 */ }
)
```

### Row에서 weight 사용

`weight`는 Row(또는 Column) 안에서 **남은 공간을 비율로 나눌 때** 사용하는 범위 지정 수정자입니다.

```kotlin [compose-playground]
@Composable
fun WeightedRow() {
    Row(modifier = Modifier.fillMaxWidth()) {
        Box(
            modifier = Modifier
                .weight(1f)
                .height(50.dp)
                .background(Color.Red)
        )
        Box(
            modifier = Modifier
                .weight(2f)
                .height(50.dp)
                .background(Color.Green)
        )
        Box(
            modifier = Modifier
                .weight(1f)
                .height(50.dp)
                .background(Color.Blue)
        )
    }
}
```

**결과 구조:**

```
┌──────────┬────────────────────┬──────────┐
│  빨강     │       초록          │   파랑    │
│  1/4     │       2/4          │   1/4    │
└──────────┴────────────────────┴──────────┘
← weight(1f) → ← weight(2f)  → ← weight(1f) →
```

---

## 4. Box — 겹치기 배치

`Box`는 자식 컴포저블을 **겹쳐서** 배치합니다. XML의 `FrameLayout`에 대응합니다. 먼저 선언된 자식이 **뒤쪽(아래)**에, 나중에 선언된 자식이 **앞쪽(위)**에 놓입니다.

### 기본 사용법

```kotlin [compose-playground]
@Composable
fun BoxExample() {
    Box(
        modifier = Modifier.size(200.dp)
    ) {
        // 가장 뒤 (배경 역할)
        Box(
            modifier = Modifier
                .fillMaxSize()
                .background(Color.LightGray)
        )
        // 가운데
        Text(
            text = "가운데 텍스트",
            modifier = Modifier.align(Alignment.Center)
        )
        // 가장 앞
        Icon(
            imageVector = Icons.Default.Favorite,
            contentDescription = "좋아요",
            modifier = Modifier.align(Alignment.TopEnd)
        )
    }
}
```

**결과 구조 (앞에서 본 모습):**

```
┌──────────────────────┐
│                   ♥  │ ← Icon (TopEnd)
│                      │
│    가운데 텍스트       │ ← Text (Center)
│                      │
│  ████████████████████│ ← 배경 Box (fillMaxSize)
└──────────────────────┘
```

**겹침 순서 (옆에서 본 개념):**

```
뒤 ────────────────────── 앞
[배경 Box] → [Text] → [Icon]
 (첫 번째)    (두 번째)  (세 번째)
```

### Box의 주요 매개변수

```kotlin [compose-playground]
Box(
    modifier = Modifier,                                  // 수정자
    contentAlignment = Alignment.TopStart,                 // 자식 기본 정렬 위치
    content = { /* 자식 컴포저블 */ }
)
```

### Box에서 align 사용

Box 내부의 자식에서 `Modifier.align()`을 사용하면 **개별 자식의 위치**를 지정할 수 있습니다.

```kotlin [compose-playground]
@Composable
fun BoxAlignExample() {
    Box(
        modifier = Modifier
            .size(200.dp)
            .background(Color.LightGray)
    ) {
        Text("TopStart", modifier = Modifier.align(Alignment.TopStart))
        Text("TopEnd", modifier = Modifier.align(Alignment.TopEnd))
        Text("Center", modifier = Modifier.align(Alignment.Center))
        Text("BottomStart", modifier = Modifier.align(Alignment.BottomStart))
        Text("BottomEnd", modifier = Modifier.align(Alignment.BottomEnd))
    }
}
```

**결과 구조:**

```
┌─────────────────────────┐
│ TopStart       TopEnd   │
│                         │
│         Center          │
│                         │
│ BottomStart  BottomEnd  │
└─────────────────────────┘
```

---

## 5. XML View와의 비교

### 레이아웃 대응 테이블

| XML View | Compose | 설명 |
|----------|---------|------|
| `LinearLayout (vertical)` | `Column` | 자식을 세로로 나열 |
| `LinearLayout (horizontal)` | `Row` | 자식을 가로로 나열 |
| `FrameLayout` | `Box` | 자식을 겹쳐서 배치 |
| `android:orientation` | Column/Row 선택 | 방향은 컴포넌트 선택으로 결정 |
| `android:gravity` | `Arrangement` / `Alignment` | 배치와 정렬을 분리 |
| `android:layout_gravity` | `Modifier.align()` | 개별 자식 정렬 |
| `android:layout_weight` | `Modifier.weight()` | 비율 기반 크기 |
| `android:padding` | `Modifier.padding()` | 여백 설정 |
| `<Space>` | `Spacer()` | 빈 공간 삽입 |
| `CardView` | `Surface` / `Card` | 배경, 그림자, 모서리 |

### 코드 비교 예제

**XML 방식:**

```xml
<LinearLayout
    android:layout_width="match_parent"
    android:layout_height="wrap_content"
    android:orientation="vertical"
    android:padding="16dp">

    <TextView
        android:layout_width="wrap_content"
        android:layout_height="wrap_content"
        android:text="제목" />

    <LinearLayout
        android:layout_width="match_parent"
        android:layout_height="wrap_content"
        android:orientation="horizontal">

        <TextView
            android:layout_width="0dp"
            android:layout_height="wrap_content"
            android:layout_weight="1"
            android:text="왼쪽" />

        <TextView
            android:layout_width="wrap_content"
            android:layout_height="wrap_content"
            android:text="오른쪽" />
    </LinearLayout>
</LinearLayout>
```

**Compose 방식:**

```kotlin [compose-playground]
@Composable
fun ComposeEquivalent() {
    Column(
        modifier = Modifier
            .fillMaxWidth()
            .padding(16.dp)
    ) {
        Text("제목")

        Row(modifier = Modifier.fillMaxWidth()) {
            Text(
                text = "왼쪽",
                modifier = Modifier.weight(1f)
            )
            Text("오른쪽")
        }
    }
}
```

> **Compose의 장점**: XML보다 코드가 훨씬 간결하고, 중첩 구조가 명확하게 보입니다. 또한 Kotlin 코드이므로 조건문, 반복문을 자유롭게 사용할 수 있습니다.

---

## 6. 중첩 레이아웃

실제 화면은 단일 Column이나 Row만으로 만들 수 없습니다. **Column 안에 Row**, **Row 안에 Column**을 넣어 복잡한 레이아웃을 구성합니다.

### Column 안에 Row

```kotlin [compose-playground]
@Composable
fun ColumnWithRows() {
    Column(modifier = Modifier.padding(16.dp)) {
        // 첫 번째 행
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.SpaceBetween
        ) {
            Text("이름")
            Text("홍길동")
        }

        // 두 번째 행
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.SpaceBetween
        ) {
            Text("이메일")
            Text("hong@email.com")
        }

        // 세 번째 행
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.SpaceBetween
        ) {
            Text("전화번호")
            Text("010-1234-5678")
        }
    }
}
```

**결과 구조:**

```
┌───────────────────────────────┐
│ Column                        │
│ ┌───────────────────────────┐ │
│ │ Row: [이름]    [홍길동]    │ │
│ └───────────────────────────┘ │
│ ┌───────────────────────────┐ │
│ │ Row: [이메일]  [hong@..]  │ │
│ └───────────────────────────┘ │
│ ┌───────────────────────────┐ │
│ │ Row: [전화번호] [010-..]  │ │
│ └───────────────────────────┘ │
└───────────────────────────────┘
```

### Row 안에 Column

```kotlin [compose-playground]
@Composable
fun RowWithColumns() {
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .padding(16.dp)
    ) {
        // 왼쪽: 프로필 이미지 자리
        Box(
            modifier = Modifier
                .size(60.dp)
                .background(Color.Gray, shape = CircleShape),
            contentAlignment = Alignment.Center
        ) {
            Text("사진", color = Color.White)
        }

        // 오른쪽: 텍스트 정보 (세로 배치)
        Column(
            modifier = Modifier
                .padding(start = 12.dp)
                .weight(1f)
        ) {
            Text("홍길동", fontWeight = FontWeight.Bold)
            Text("Android 개발자", color = Color.Gray)
            Text("서울시 강남구", color = Color.Gray)
        }
    }
}
```

**결과 구조:**

```
┌───────────────────────────────────┐
│ Row                               │
│ ┌──────┐  ┌───────────────────┐   │
│ │      │  │ Column            │   │
│ │ 사진  │  │  홍길동 (Bold)     │   │
│ │      │  │  Android 개발자    │   │
│ │      │  │  서울시 강남구      │   │
│ └──────┘  └───────────────────┘   │
└───────────────────────────────────┘
```

### 복잡한 중첩 예제

```kotlin [compose-playground]
@Composable
fun ComplexLayout() {
    Column(modifier = Modifier.fillMaxWidth()) {
        // 상단 헤더
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(16.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            Text("앱 제목", fontSize = 20.sp, fontWeight = FontWeight.Bold)
            Spacer(modifier = Modifier.weight(1f))
            Icon(Icons.Default.Settings, contentDescription = "설정")
        }

        // 중앙 콘텐츠
        Box(
            modifier = Modifier
                .fillMaxWidth()
                .height(200.dp)
                .background(Color.LightGray),
            contentAlignment = Alignment.Center
        ) {
            Text("메인 콘텐츠 영역")
        }

        // 하단 버튼 행
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(16.dp),
            horizontalArrangement = Arrangement.SpaceEvenly
        ) {
            Button(onClick = { }) { Text("취소") }
            Button(onClick = { }) { Text("확인") }
        }
    }
}
```

**결과 구조:**

```
┌─────────────────────────────────┐
│ Column                          │
│ ┌─────────────────────────────┐ │
│ │ Row: [앱 제목]  ...  [설정⚙] │ │
│ └─────────────────────────────┘ │
│ ┌─────────────────────────────┐ │
│ │                             │ │
│ │ Box:  메인 콘텐츠 영역       │ │
│ │        (200dp 높이)         │ │
│ │                             │ │
│ └─────────────────────────────┘ │
│ ┌─────────────────────────────┐ │
│ │ Row:   [취소]     [확인]    │ │
│ └─────────────────────────────┘ │
└─────────────────────────────────┘
```

---

## 7. Spacer로 간격 추가

`Spacer`는 **빈 공간을 차지하는 컴포저블**입니다. 자식 사이에 고정 또는 유동적인 간격을 넣을 때 사용합니다.

### 고정 간격

```kotlin [compose-playground]
@Composable
fun FixedSpacerExample() {
    Column(modifier = Modifier.padding(16.dp)) {
        Text("첫 번째")
        Spacer(modifier = Modifier.height(16.dp))  // 세로 16dp 간격
        Text("두 번째")
        Spacer(modifier = Modifier.height(32.dp))  // 세로 32dp 간격
        Text("세 번째")
    }
}
```

**결과 구조:**

```
┌─────────────────┐
│ 첫 번째          │
│                  │ ← 16dp
│ 두 번째          │
│                  │
│                  │ ← 32dp
│ 세 번째          │
└─────────────────┘
```

### Row에서의 Spacer

```kotlin [compose-playground]
@Composable
fun RowSpacerExample() {
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .padding(16.dp)
    ) {
        Text("왼쪽")
        Spacer(modifier = Modifier.width(8.dp))   // 가로 8dp 고정 간격
        Text("가운데")
        Spacer(modifier = Modifier.weight(1f))      // 나머지 공간 모두 차지
        Text("오른쪽")
    }
}
```

**결과 구조:**

```
┌─────────────────────────────────┐
│ [왼쪽] 8dp [가운데]       [오른쪽] │
│              ← weight(1f) →     │
└─────────────────────────────────┘
```

> **팁**: `Spacer(modifier = Modifier.weight(1f))`는 **남은 공간을 모두 차지하는 유동적인 간격**입니다. 이 패턴은 양쪽 끝에 요소를 배치할 때 매우 자주 사용됩니다.

---

## 8. Surface로 배경과 그림자 적용

`Surface`는 Material Design의 **표면(surface)** 개념을 구현한 컴포저블입니다. 배경색, 모서리 둥글림, 그림자(elevation)를 한 번에 적용할 수 있습니다.

### 기본 사용법

```kotlin [compose-playground]
@Composable
fun SurfaceExample() {
    Surface(
        modifier = Modifier.padding(16.dp),
        color = MaterialTheme.colorScheme.surface,       // 배경색
        shadowElevation = 4.dp,                          // 그림자 높이
        shape = RoundedCornerShape(12.dp)                // 모서리 둥글림
    ) {
        Column(modifier = Modifier.padding(16.dp)) {
            Text("Surface 안의 콘텐츠")
            Text("배경색, 그림자, 모서리가 자동으로 적용됩니다")
        }
    }
}
```

**결과 구조:**

```
        ╭─────────────────────────────╮  ← 둥근 모서리
   ░░░░░│                             │
   ░░░░░│  Surface 안의 콘텐츠         │
   ░░░░░│  배경색, 그림자, 모서리가...  │
   ░░░░░│                             │
        ╰─────────────────────────────╯
   ↑
   그림자 (shadowElevation = 4.dp)
```

### Surface vs Box + Modifier

```kotlin [compose-playground]
// Surface 사용 (권장)
@Composable
fun WithSurface() {
    Surface(
        shape = RoundedCornerShape(8.dp),
        color = Color.White,
        shadowElevation = 2.dp
    ) {
        Text("깔끔한 카드", modifier = Modifier.padding(16.dp))
    }
}

// Box + Modifier 사용 (동일한 효과지만 더 복잡)
@Composable
fun WithBoxModifier() {
    Box(
        modifier = Modifier
            .shadow(2.dp, RoundedCornerShape(8.dp))
            .background(Color.White, RoundedCornerShape(8.dp))
            .clip(RoundedCornerShape(8.dp))
    ) {
        Text("깔끔한 카드", modifier = Modifier.padding(16.dp))
    }
}
```

> **Surface를 사용하는 이유**: Surface는 배경색, 모서리, 그림자, 콘텐츠 색상 등을 **일관성 있게** 관리해줍니다. 개별 Modifier를 조합하는 것보다 코드가 간결하고, Material Design 테마와 자동으로 연동됩니다.

### Card 컴포넌트

`Card`는 Surface의 특수한 형태로, **카드 UI 패턴**에 최적화되어 있습니다.

```kotlin [compose-playground]
@Composable
fun CardExample() {
    Card(
        modifier = Modifier
            .fillMaxWidth()
            .padding(16.dp),
        elevation = CardDefaults.cardElevation(defaultElevation = 4.dp),
        shape = RoundedCornerShape(12.dp)
    ) {
        Column(modifier = Modifier.padding(16.dp)) {
            Text("카드 제목", fontWeight = FontWeight.Bold)
            Spacer(modifier = Modifier.height(8.dp))
            Text("카드 본문 내용이 여기에 들어갑니다.")
        }
    }
}
```

---

## 9. 실전 예제: 프로필 카드 만들기

지금까지 배운 Column, Row, Box, Spacer, Surface를 모두 활용하여 **프로필 카드**를 만들어 봅시다.

```kotlin [compose-playground]
@Composable
fun ProfileCard(
    name: String,
    title: String,
    bio: String,
    modifier: Modifier = Modifier
) {
    Card(
        modifier = modifier
            .fillMaxWidth()
            .padding(16.dp),
        elevation = CardDefaults.cardElevation(defaultElevation = 4.dp),
        shape = RoundedCornerShape(16.dp)
    ) {
        Column(modifier = Modifier.padding(16.dp)) {
            // 상단: 프로필 이미지 + 이름/직함
            Row(verticalAlignment = Alignment.CenterVertically) {
                // 프로필 이미지 자리 (Box로 원형 배경)
                Box(
                    modifier = Modifier
                        .size(64.dp)
                        .background(
                            color = MaterialTheme.colorScheme.primary,
                            shape = CircleShape
                        ),
                    contentAlignment = Alignment.Center
                ) {
                    Text(
                        text = name.first().toString(),
                        color = Color.White,
                        fontSize = 24.sp,
                        fontWeight = FontWeight.Bold
                    )
                }

                Spacer(modifier = Modifier.width(16.dp))

                // 이름과 직함 (Column으로 세로 배치)
                Column {
                    Text(
                        text = name,
                        fontSize = 20.sp,
                        fontWeight = FontWeight.Bold
                    )
                    Spacer(modifier = Modifier.height(4.dp))
                    Text(
                        text = title,
                        color = MaterialTheme.colorScheme.onSurfaceVariant
                    )
                }
            }

            Spacer(modifier = Modifier.height(16.dp))

            // 소개글
            Text(text = bio, lineHeight = 20.sp)

            Spacer(modifier = Modifier.height(16.dp))

            // 하단 버튼
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.End
            ) {
                TextButton(onClick = { }) {
                    Text("메시지")
                }
                Spacer(modifier = Modifier.width(8.dp))
                Button(onClick = { }) {
                    Text("팔로우")
                }
            }
        }
    }
}

// 사용 예시
@Preview(showBackground = true)
@Composable
fun ProfileCardPreview() {
    ProfileCard(
        name = "홍길동",
        title = "Android 개발자",
        bio = "Jetpack Compose를 사랑하는 개발자입니다. 모던 Android 개발에 관심이 많습니다."
    )
}
```

**결과 구조:**

```
╭─────────────────────────────────────╮
│                                     │
│  ┌────┐                             │
│  │ 홍 │  홍길동 (Bold, 20sp)         │
│  │    │  Android 개발자 (회색)       │
│  └────┘                             │
│                                     │
│  Jetpack Compose를 사랑하는          │
│  개발자입니다. 모던 Android 개발에    │
│  관심이 많습니다.                    │
│                                     │
│              [메시지]  [ 팔로우 ]     │
│                                     │
╰─────────────────────────────────────╯
```

**구조 분해:**

```
Card
└── Column (padding 16dp)
    ├── Row (verticalAlignment = CenterVertically)
    │   ├── Box (64dp, 원형, primary 색상)
    │   │   └── Text ("홍")
    │   ├── Spacer (width 16dp)
    │   └── Column
    │       ├── Text ("홍길동")
    │       └── Text ("Android 개발자")
    ├── Spacer (height 16dp)
    ├── Text (소개글)
    ├── Spacer (height 16dp)
    └── Row (Arrangement.End)
        ├── TextButton ("메시지")
        ├── Spacer (width 8dp)
        └── Button ("팔로우")
```

---

## 10. 정리 및 다음 단계

### 핵심 요약

| 컴포저블 | 용도 | 핵심 매개변수 |
|----------|------|---------------|
| `Column` | 세로 배치 | `verticalArrangement`, `horizontalAlignment` |
| `Row` | 가로 배치 | `horizontalArrangement`, `verticalAlignment` |
| `Box` | 겹치기 배치 | `contentAlignment` |
| `Spacer` | 빈 공간 | `Modifier.height()` / `Modifier.width()` / `Modifier.weight()` |
| `Surface` | 배경/그림자 | `color`, `shape`, `shadowElevation` |
| `Card` | 카드 UI | `elevation`, `shape` |

### 설계 팁

1. **Column 우선**: 화면 전체 레이아웃은 보통 Column으로 시작합니다.
2. **Row로 가로 배치**: Column 안에서 가로로 나열할 요소가 있으면 Row를 사용합니다.
3. **Box는 겹칠 때**: 배지(Badge), 오버레이, 배경 위 콘텐츠 등에 Box를 사용합니다.
4. **Spacer로 간격**: `Arrangement.spacedBy()`도 좋지만, 개별 간격 조절이 필요하면 Spacer가 유용합니다.
5. **Surface/Card로 감싸기**: 시각적 구분이 필요한 영역은 Surface나 Card로 감쌉니다.
6. **FlexBox 레이아웃 검토**: Column/Row로 표현하기 어려운 복잡한 유동적 배치(flex-grow/shrink, 자동 줄바꿈 등)는 Foundation 1.10의 `FlexBox` 레이아웃을 활용할 수 있습니다.

### 다음 학습

- [02. Modifier 완전 정복](02-modifier-deep-dive.md) - Modifier의 모든 것을 깊이 있게 다룹니다.
- [03. Arrangement와 Alignment](03-arrangement-and-alignment.md) - 정밀한 배치와 정렬을 마스터합니다.
