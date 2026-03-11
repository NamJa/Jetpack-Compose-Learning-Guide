# 스크롤과 중첩 스크롤

> **"스크롤은 모바일의 기본 동작이다. 자연스러운 스크롤 없이는 어떤 앱도 완성되지 않는다."**
>
> 컨텐츠가 화면보다 클 때 스크롤은 필수입니다.
> 이 문서에서는 기본 스크롤부터 중첩 스크롤까지, Compose에서 스크롤을 다루는 모든 방법을 배웁니다.

---

## 목차

1. [verticalScroll / horizontalScroll](#1-verticalscroll--horizontalscroll)
2. [rememberScrollState로 상태 관리](#2-rememberscrollstate로-상태-관리)
3. [프로그래밍 방식 스크롤](#3-프로그래밍-방식-스크롤)
4. [중첩 스크롤: nestedScroll](#4-중첩-스크롤-nestedscroll)
5. [중첩 스크롤 상호 운용 (Compose와 View)](#5-중첩-스크롤-상호-운용-compose와-view)
6. [LazyColumn/LazyRow의 스크롤 상태](#6-lazycolumnlazyrow의-스크롤-상태)
7. [2D 스크롤과 스크롤 인디케이터 (Foundation 1.9~1.10)](#7-2d-스크롤과-스크롤-인디케이터-foundation-19110)
8. [Pager 개선 사항 (Foundation 1.9~1.10)](#8-pager-개선-사항-foundation-19110)
9. [정리](#9-정리)

---

## 1. verticalScroll / horizontalScroll

`verticalScroll`과 `horizontalScroll`은 가장 간단한 스크롤 수정자입니다. **모든 자식 컴포저블을 한 번에 구성(compose)** 하고, 스크롤로 보이는 영역만 화면에 표시합니다.

```
verticalScroll 동작 원리

  ┌──────────────┐  ← 화면 (보이는 영역)
  │  아이템 1     │
  │  아이템 2     │
  │  아이템 3     │
  └──────────────┘
  │  아이템 4     │  ← 화면 밖 (스크롤하면 보임)
  │  아이템 5     │
  │  ...         │
```

### 기본 사용법

```kotlin [compose-playground]
@Composable
fun VerticalScrollExample() {
    Column(
        modifier = Modifier
            .fillMaxSize()
            .verticalScroll(rememberScrollState())  // 스크롤 활성화
            .padding(16.dp)
    ) {
        repeat(30) { index ->
            Card(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(vertical = 4.dp)
            ) {
                Text(
                    text = "아이템 $index",
                    modifier = Modifier.padding(16.dp)
                )
            }
        }
    }
}
```

### 수평 스크롤

```kotlin [compose-playground]
@Composable
fun HorizontalScrollExample() {
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .horizontalScroll(rememberScrollState())  // 수평 스크롤
            .padding(16.dp),
        horizontalArrangement = Arrangement.spacedBy(8.dp)
    ) {
        repeat(20) { index ->
            Card(
                modifier = Modifier.size(120.dp)
            ) {
                Box(
                    modifier = Modifier.fillMaxSize(),
                    contentAlignment = Alignment.Center
                ) {
                    Text("카드 $index")
                }
            }
        }
    }
}
```

> **verticalScroll/horizontalScroll vs LazyColumn/LazyRow**:
>
> | | verticalScroll | LazyColumn |
> |---|---|---|
> | 구성 방식 | 모든 아이템을 즉시 구성 | 보이는 아이템만 구성 |
> | 적합한 경우 | 아이템 수가 적을 때 (< 약 50개) | 아이템 수가 많을 때 |
> | 메모리 사용 | 모든 아이템이 메모리에 존재 | 화면에 보이는 것만 메모리에 |
> | 성능 | 아이템이 많으면 느려짐 | 아이템 수에 관계없이 빠름 |

---

## 2. rememberScrollState로 상태 관리

`rememberScrollState()`는 현재 스크롤 위치를 추적하는 상태 객체를 생성합니다.

### 스크롤 위치 읽기

```kotlin [compose-playground]
@Composable
fun ScrollPositionExample() {
    val scrollState = rememberScrollState()

    Column {
        // 현재 스크롤 위치를 실시간으로 표시
        Text(
            text = "스크롤 위치: ${scrollState.value}px",
            modifier = Modifier.padding(16.dp),
            style = MaterialTheme.typography.bodySmall
        )

        Column(
            modifier = Modifier
                .fillMaxSize()
                .verticalScroll(scrollState)
                .padding(16.dp)
        ) {
            repeat(50) { index ->
                Text(
                    text = "아이템 $index",
                    modifier = Modifier.padding(vertical = 8.dp)
                )
            }
        }
    }
}
```

### ScrollState의 주요 속성

| 속성 | 타입 | 설명 |
|------|------|------|
| `value` | Int | 현재 스크롤 위치 (픽셀) |
| `maxValue` | Int | 최대 스크롤 가능 범위 |
| `isScrollInProgress` | Boolean | 현재 스크롤 중인지 여부 |

### 스크롤에 따른 동적 UI

```kotlin [compose-playground]
@Composable
fun ScrollAwareHeader() {
    val scrollState = rememberScrollState()

    // 스크롤에 따라 헤더 투명도 변경
    val headerAlpha by remember {
        derivedStateOf {
            1f - (scrollState.value / 300f).coerceIn(0f, 1f)
        }
    }

    Box(modifier = Modifier.fillMaxSize()) {
        // 스크롤 가능한 콘텐츠
        Column(
            modifier = Modifier
                .fillMaxSize()
                .verticalScroll(scrollState)
        ) {
            Spacer(modifier = Modifier.height(200.dp))  // 헤더 공간
            repeat(30) { index ->
                Text(
                    text = "콘텐츠 $index",
                    modifier = Modifier.padding(16.dp)
                )
            }
        }

        // 스크롤에 따라 사라지는 헤더
        Box(
            modifier = Modifier
                .fillMaxWidth()
                .height(200.dp)
                .graphicsLayer { alpha = headerAlpha }
                .background(MaterialTheme.colorScheme.primary)
        )
    }
}
```

---

## 3. 프로그래밍 방식 스크롤

코드에서 직접 스크롤 위치를 제어할 수 있습니다.

### scrollTo와 animateScrollTo

```kotlin [compose-playground]
@Composable
fun ProgrammaticScrollExample() {
    val scrollState = rememberScrollState()
    val scope = rememberCoroutineScope()

    Column {
        Row(
            modifier = Modifier.padding(16.dp),
            horizontalArrangement = Arrangement.spacedBy(8.dp)
        ) {
            // 맨 위로 즉시 이동
            Button(onClick = {
                scope.launch {
                    scrollState.scrollTo(0)  // 애니메이션 없이 즉시 이동
                }
            }) {
                Text("맨 위로 (즉시)")
            }

            // 맨 아래로 부드럽게 이동
            Button(onClick = {
                scope.launch {
                    scrollState.animateScrollTo(
                        value = scrollState.maxValue,  // 최대 위치로
                        animationSpec = tween(1000)     // 1초 동안 부드럽게
                    )
                }
            }) {
                Text("맨 아래로 (부드럽게)")
            }
        }

        Column(
            modifier = Modifier
                .fillMaxSize()
                .verticalScroll(scrollState)
                .padding(16.dp)
        ) {
            repeat(50) { index ->
                Text(
                    text = "아이템 $index",
                    modifier = Modifier.padding(vertical = 8.dp)
                )
            }
        }
    }
}
```

| 함수 | 설명 | 애니메이션 |
|------|------|-----------|
| `scrollTo(value)` | 지정 위치로 즉시 이동 | 없음 |
| `animateScrollTo(value)` | 지정 위치로 부드럽게 이동 | 있음 |

### "맨 위로" FAB 구현

```kotlin [compose-playground]
@Composable
fun ScrollToTopFab() {
    val scrollState = rememberScrollState()
    val scope = rememberCoroutineScope()

    // 스크롤이 200px 이상이면 FAB 표시
    val showFab by remember {
        derivedStateOf { scrollState.value > 200 }
    }

    Box(modifier = Modifier.fillMaxSize()) {
        Column(
            modifier = Modifier
                .fillMaxSize()
                .verticalScroll(scrollState)
        ) {
            repeat(50) { index ->
                Text(
                    text = "아이템 $index",
                    modifier = Modifier.padding(16.dp)
                )
            }
        }

        // 조건부 FAB
        AnimatedVisibility(
            visible = showFab,
            modifier = Modifier
                .align(Alignment.BottomEnd)
                .padding(16.dp),
            enter = fadeIn() + scaleIn(),
            exit = fadeOut() + scaleOut()
        ) {
            FloatingActionButton(
                onClick = {
                    scope.launch {
                        scrollState.animateScrollTo(0)
                    }
                }
            ) {
                Icon(Icons.Default.KeyboardArrowUp, "맨 위로")
            }
        }
    }
}
```

---

## 4. 중첩 스크롤: nestedScroll

중첩 스크롤은 **스크롤 가능한 영역 안에 또 다른 스크롤 가능한 영역**이 있을 때 필요합니다. 대표적인 예시로는 "접히는 툴바 + 스크롤 리스트" 조합이 있습니다.

```
중첩 스크롤 예시: 접히는 헤더

  스크롤 전                    스크롤 후
┌──────────────┐           ┌──────────────┐
│              │           │ 작은 헤더     │
│  큰 헤더     │           ├──────────────┤
│              │           │  아이템 3     │
├──────────────┤     →     │  아이템 4     │
│  아이템 1     │           │  아이템 5     │
│  아이템 2     │           │  아이템 6     │
│  아이템 3     │           │  아이템 7     │
└──────────────┘           └──────────────┘

리스트를 위로 스크롤하면 → 먼저 헤더가 접히고 → 그 다음 리스트가 스크롤됨
```

### NestedScrollConnection

`NestedScrollConnection`은 자식의 스크롤 이벤트를 **가로채서 처리**할 수 있는 인터페이스입니다.

```
스크롤 이벤트 전달 흐름

  사용자 스크롤 (위로 드래그)
       │
       ▼
  ┌──────────────────────┐
  │  부모의 onPreScroll   │  ← 자식보다 먼저 소비할 기회
  │  (부모가 일부 소비)    │
  └──────────┬───────────┘
             │ 남은 양
             ▼
  ┌──────────────────────┐
  │  자식이 스크롤 처리    │  ← 실제 리스트 스크롤
  │  (자식이 소비)        │
  └──────────┬───────────┘
             │ 남은 양
             ▼
  ┌──────────────────────┐
  │  부모의 onPostScroll  │  ← 자식이 소비하지 못한 나머지
  │  (부모가 나머지 처리)  │
  └──────────────────────┘
```

### 접히는 헤더 예제

```kotlin [compose-playground]
@Composable
fun CollapsibleHeaderExample() {
    val headerHeight = 200.dp
    val minHeaderHeight = 56.dp

    // 헤더의 높이 오프셋을 Animatable로 관리
    val headerHeightPx = with(LocalDensity.current) { headerHeight.toPx() }
    val minHeaderHeightPx = with(LocalDensity.current) { minHeaderHeight.toPx() }
    var headerOffset by remember { mutableFloatStateOf(0f) }

    val nestedScrollConnection = remember {
        object : NestedScrollConnection {
            override fun onPreScroll(available: Offset, source: NestedScrollSource): Offset {
                // 위로 스크롤할 때 헤더를 먼저 접음
                val delta = available.y
                val newOffset = (headerOffset + delta).coerceIn(
                    -(headerHeightPx - minHeaderHeightPx),  // 최소 높이까지만
                    0f                                       // 최대 높이
                )
                val consumed = newOffset - headerOffset
                headerOffset = newOffset
                return Offset(0f, consumed)  // 소비한 만큼 반환
            }
        }
    }

    Box(
        modifier = Modifier
            .fillMaxSize()
            .nestedScroll(nestedScrollConnection)  // 중첩 스크롤 연결
    ) {
        // 스크롤 가능한 리스트
        LazyColumn(
            modifier = Modifier.fillMaxSize(),
            contentPadding = PaddingValues(
                top = headerHeight  // 헤더 아래부터 시작
            )
        ) {
            items(50) { index ->
                Text(
                    text = "아이템 $index",
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(16.dp)
                )
            }
        }

        // 접히는 헤더
        Box(
            modifier = Modifier
                .fillMaxWidth()
                .height(headerHeight)
                .graphicsLayer {
                    translationY = headerOffset
                }
                .background(MaterialTheme.colorScheme.primary)
        )
    }
}
```

### NestedScrollConnection의 네 가지 콜백

| 콜백 | 호출 시점 | 용도 |
|------|----------|------|
| `onPreScroll` | 자식 스크롤 **전** | 부모가 먼저 스크롤 소비 (헤더 접기) |
| `onPostScroll` | 자식 스크롤 **후** | 자식이 소비하지 못한 나머지 처리 |
| `onPreFling` | 플링(빠른 스크롤) **전** | 플링 속도를 부모가 먼저 소비 |
| `onPostFling` | 플링 **후** | 자식이 소비하지 못한 플링 처리 |

---

## 5. 중첩 스크롤 상호 운용 (Compose와 View)

기존 XML View 프로젝트에서 Compose를 점진적으로 도입할 때, **View 시스템의 스크롤과 Compose의 스크롤이 함께 작동**해야 할 수 있습니다.

### Compose 안에 View가 있을 때

```kotlin [compose-playground]
@Composable
fun ComposeWithAndroidView() {
    // Compose의 LazyColumn 안에 Android RecyclerView가 있을 때
    // nestedScroll + rememberNestedScrollInteropConnection()을 사용

    val nestedScrollInterop = rememberNestedScrollInteropConnection()

    LazyColumn(
        modifier = Modifier.nestedScroll(nestedScrollInterop)
    ) {
        item {
            Text("Compose 헤더", modifier = Modifier.padding(16.dp))
        }
        item {
            // AndroidView 내부의 스크롤이 Compose와 연동됨
            AndroidView(
                factory = { context ->
                    RecyclerView(context).apply {
                        // RecyclerView 설정...
                        layoutManager = LinearLayoutManager(context)
                    }
                },
                modifier = Modifier
                    .fillMaxWidth()
                    .height(300.dp)
            )
        }
    }
}
```

### View 안에 Compose가 있을 때

XML 레이아웃에서 `ComposeView`를 사용하는 경우, `ComposeView`가 부모 View의 `NestedScrollingParent`와 자동으로 연동됩니다.

```kotlin [compose-playground]
// Activity나 Fragment에서
val composeView = ComposeView(this).apply {
    setContent {
        LazyColumn {
            items(100) { index ->
                Text("Compose 아이템 $index", modifier = Modifier.padding(16.dp))
            }
        }
    }
}
// CoordinatorLayout 등에 ComposeView를 추가하면
// 중첩 스크롤이 자동으로 연동됩니다
```

> **핵심**: `rememberNestedScrollInteropConnection()`은 Compose의 `NestedScrollConnection`과
> Android View의 `NestedScrollingChild`/`NestedScrollingParent` 사이를 연결하는 다리 역할을 합니다.

---

## 6. LazyColumn/LazyRow의 스크롤 상태

`LazyColumn`과 `LazyRow`는 `ScrollState` 대신 `LazyListState`를 사용합니다. 더 풍부한 정보를 제공합니다.

### rememberLazyListState

```kotlin [compose-playground]
@Composable
fun LazyListStateExample() {
    val listState = rememberLazyListState()

    LazyColumn(state = listState) {
        items(100) { index ->
            Text(
                text = "아이템 $index",
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(16.dp)
            )
        }
    }
}
```

### LazyListState의 주요 속성

| 속성 | 타입 | 설명 |
|------|------|------|
| `firstVisibleItemIndex` | Int | 화면에 보이는 첫 번째 아이템의 인덱스 |
| `firstVisibleItemScrollOffset` | Int | 첫 번째 아이템의 스크롤 오프셋 (픽셀) |
| `layoutInfo` | LazyListLayoutInfo | 전체 레이아웃 정보 |
| `isScrollInProgress` | Boolean | 스크롤 중인지 여부 |
| `canScrollForward` | Boolean | 앞으로(아래로) 스크롤 가능한지 |
| `canScrollBackward` | Boolean | 뒤로(위로) 스크롤 가능한지 |

### 프로그래밍 방식 스크롤

```kotlin [compose-playground]
@Composable
fun LazyListScrollControl() {
    val listState = rememberLazyListState()
    val scope = rememberCoroutineScope()

    Column {
        Row(
            modifier = Modifier.padding(16.dp),
            horizontalArrangement = Arrangement.spacedBy(8.dp)
        ) {
            // 특정 아이템으로 즉시 이동
            Button(onClick = {
                scope.launch {
                    listState.scrollToItem(index = 0)
                }
            }) {
                Text("처음으로")
            }

            // 특정 아이템으로 부드럽게 이동
            Button(onClick = {
                scope.launch {
                    listState.animateScrollToItem(
                        index = 49,
                        scrollOffset = 0  // 아이템 내 오프셋 (픽셀)
                    )
                }
            }) {
                Text("50번째로")
            }
        }

        LazyColumn(state = listState) {
            items(100) { index ->
                Text(
                    text = "아이템 $index",
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(16.dp)
                )
            }
        }
    }
}
```

### 현재 보이는 아이템 정보 활용

```kotlin [compose-playground]
@Composable
fun VisibleItemTracker() {
    val listState = rememberLazyListState()

    // 보이는 아이템 정보를 derivedStateOf로 효율적으로 추적
    val visibleItems by remember {
        derivedStateOf {
            listState.layoutInfo.visibleItemsInfo.map { it.index }
        }
    }

    val isAtTop by remember {
        derivedStateOf {
            listState.firstVisibleItemIndex == 0 &&
                listState.firstVisibleItemScrollOffset == 0
        }
    }

    Column {
        Text(
            text = "보이는 아이템: ${visibleItems.joinToString(", ")}",
            modifier = Modifier.padding(8.dp),
            style = MaterialTheme.typography.bodySmall
        )

        Text(
            text = if (isAtTop) "최상단" else "스크롤됨",
            modifier = Modifier.padding(8.dp)
        )

        LazyColumn(state = listState) {
            items(100) { index ->
                Text(
                    text = "아이템 $index",
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(16.dp)
                )
            }
        }
    }
}
```

> **팁**: `derivedStateOf`를 사용하면 `firstVisibleItemIndex` 등의 값이 바뀔 때만 리컴포지션이 발생합니다.
> 이를 사용하지 않으면 매 스크롤 프레임마다 리컴포지션이 일어날 수 있습니다.

---

## 7. 2D 스크롤과 스크롤 인디케이터 (Foundation 1.9~1.10)

### Modifier.scrollable2D와 Scrollable2DState (Foundation 1.9)

Foundation 1.9부터 **두 축을 동시에 스크롤**할 수 있는 `Modifier.scrollable2D`와 `Scrollable2DState`가 추가되었습니다. 기존에는 수평/수직 스크롤을 별도로 처리해야 했지만, 이제 하나의 수정자로 양축 스크롤을 동시에 지원할 수 있습니다.

```kotlin [compose-playground]
@Composable
fun TwoDimensionalScrollExample() {
    val state = rememberScrollable2DState { delta ->
        // delta: Offset (x, y 이동량)
        // 두 축 모두의 스크롤 델타를 한 번에 받음
        delta // 소비한 양을 반환
    }

    Box(
        modifier = Modifier
            .fillMaxSize()
            .scrollable2D(state = state)
    ) {
        // 양축으로 스크롤 가능한 콘텐츠
    }
}
```

### scrollableArea() 수정자

`scrollableArea()` 수정자는 스크롤 가능한 영역의 콘텐츠 클리핑과 방향 처리를 **orientation 및 RTL 설정에 따라 자동으로 처리**합니다. 수동으로 클리핑과 방향을 설정할 필요가 없어 코드가 간결해집니다.

### ScrollIndicatorState (Foundation 1.9~1.10)

`ScrollIndicatorState`가 이제 다음 상태 객체에 대해 구현되었습니다:

| 상태 객체 | 설명 |
|-----------|------|
| `ScrollState` | 기본 스크롤 상태 |
| `LazyListState` | LazyColumn/LazyRow 상태 |
| `LazyGridState` | LazyVerticalGrid/LazyHorizontalGrid 상태 |
| `LazyStaggeredGridState` | LazyVerticalStaggeredGrid 상태 |
| `PagerState` | Pager 상태 |

### 커스텀 스크롤 인디케이터 (Foundation 1.10)

Foundation 1.10에서는 `Modifier.scrollIndicator`와 `ScrollIndicatorFactory`를 사용하여 **커스텀 스크롤 인디케이터**를 구현할 수 있습니다.

```kotlin [compose-playground]
// 커스텀 스크롤 인디케이터 팩토리 예시
val customIndicatorFactory = ScrollIndicatorFactory { state ->
    // state: ScrollIndicatorState
    // 스크롤 위치와 콘텐츠 크기 정보를 기반으로 인디케이터를 렌더링
}

Box(
    modifier = Modifier
        .fillMaxSize()
        .scrollIndicator(customIndicatorFactory)
        .verticalScroll(rememberScrollState())
) {
    // 콘텐츠
}
```

---

## 8. Pager 개선 사항 (Foundation 1.9~1.10)

### 프리페치 전략: Cache Window (Foundation 1.9)

Pager의 프리페치 전략이 **단일 아이템 프리페치에서 Cache Window 기반 프리페치**로 업데이트되었습니다. 이전에는 다음 1개 아이템만 미리 로드했지만, 이제는 윈도우 범위 내의 여러 아이템을 프리페치합니다. 또한 **초기 프리페치(initial prefetching)가 기본적으로 활성화**되어 첫 화면 렌더링이 빨라졌습니다.

```kotlin [compose-playground]
// Pager에서 프리페치 전략 커스터마이징
HorizontalPager(
    state = rememberPagerState { pageCount },
    // 기본값으로 Cache Window 프리페치가 적용됨
) { page ->
    PageContent(page)
}
```

### 스냅 플링 오버슈트 (Foundation 1.9)

`isSnapFlingBehavior`에서 이제 **스냅 애니메이션 중 오버슈트(overshoot)를 허용**합니다. 이전에는 스냅이 정확히 타겟 위치에서 멈췄지만, 이제 물리적으로 더 자연스러운 오버슈트 효과가 적용됩니다. 이를 통해 Pager의 페이지 전환 애니메이션이 더 자연스럽게 느껴집니다.

---

## 9. 정리

| 핵심 개념 | 설명 |
|-----------|------|
| `verticalScroll` / `horizontalScroll` | 기본 스크롤 수정자 (전체 콘텐츠를 한 번에 구성) |
| `rememberScrollState()` | 스크롤 위치를 추적하는 상태 객체 |
| `scrollTo` / `animateScrollTo` | 코드에서 직접 스크롤 제어 |
| `nestedScroll` | 중첩 스크롤 동작을 커스터마이징하는 수정자 |
| `NestedScrollConnection` | 부모가 자식의 스크롤 이벤트를 가로채는 인터페이스 |
| `rememberNestedScrollInteropConnection` | Compose-View 스크롤 연동 |
| `rememberLazyListState()` | LazyColumn/LazyRow의 스크롤 상태 (더 풍부한 정보) |
| `derivedStateOf` | 스크롤 상태의 효율적인 관찰 |
| `scrollable2D` / `Scrollable2DState` (1.9) | 양축 동시 스크롤 지원 |
| `scrollableArea()` (1.9) | 자동 콘텐츠 클리핑 및 방향 처리 |
| `ScrollIndicatorState` (1.9) | 다양한 Lazy/Pager 상태에 대한 스크롤 인디케이터 |
| `scrollIndicator` / `ScrollIndicatorFactory` (1.10) | 커스텀 스크롤 인디케이터 구현 |
| Pager Cache Window 프리페치 (1.9) | 다중 아이템 프리페치 + 초기 프리페치 기본 활성화 |
| 스냅 플링 오버슈트 (1.9) | 스냅 애니메이션에서 자연스러운 오버슈트 허용 |

### 어떤 API를 선택해야 할까?

```
스크롤이 필요한가?
│
├── 아이템 수가 적다 (< ~50개)?
│   └── verticalScroll / horizontalScroll
│
├── 아이템 수가 많다?
│   └── LazyColumn / LazyRow + rememberLazyListState
│
├── 스크롤 위치를 코드로 제어?
│   └── scrollTo / animateScrollTo / scrollToItem
│
├── 부모-자식 스크롤 연동?
│   └── nestedScroll + NestedScrollConnection
│
└── Compose ↔ View 스크롤 연동?
    └── rememberNestedScrollInteropConnection
```

### 다음 단계

다음 문서에서는 **드래그, 스와이프, 멀티 터치** 제스처를 배웁니다. 드래그 가능한 요소부터 핀치 줌까지 다양한 터치 제스처를 구현합니다.

> [다음: 03. 드래그, 스와이프, 멀티 터치 →](03-drag-swipe-multitouch.md)
