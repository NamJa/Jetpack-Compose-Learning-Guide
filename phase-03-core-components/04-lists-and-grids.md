# 리스트와 그리드 완전 가이드

> **"효율적인 리스트는 앱 성능의 핵심입니다. LazyColumn은 화면에 보이는 항목만 렌더링하여 수천 개의 데이터도 부드럽게 스크롤합니다."**

---

## 목차

1. [기본 리스트 vs 지연 리스트](#1-기본-리스트-vs-지연-리스트)
2. [LazyColumn 기초](#2-lazycolumn-기초)
3. [LazyListScope DSL](#3-lazylistscope-dsl)
4. [LazyColumn 핵심 매개변수](#4-lazycolumn-핵심-매개변수)
5. [LazyRow: 가로 스크롤 리스트](#5-lazyrow-가로-스크롤-리스트)
6. [key 매개변수의 중요성](#6-key-매개변수의-중요성)
7. [stickyHeader로 고정 헤더](#7-stickyheader로-고정-헤더)
8. [animateItem으로 항목 애니메이션](#8-animateitem으로-항목-애니메이션)
9. [LazyVerticalGrid: 그리드 레이아웃](#9-lazyverticalgrid-그리드-레이아웃)
10. [LazyVerticalStaggeredGrid: 핀터레스트 스타일](#10-lazyverticalstaggeredgrid-핀터레스트-스타일)
11. [스크롤 위치 제어](#11-스크롤-위치-제어)
12. [주의사항과 모범 사례](#12-주의사항과-모범-사례)
13. [Paging 라이브러리 연동](#13-paging-라이브러리-연동)
14. [XML View와의 비교](#14-xml-view와의-비교)

---

## 1. 기본 리스트 vs 지연 리스트

### Column + forEach (기본 리스트)

데이터가 적을 때(수십 개 이하) 사용합니다. **모든 항목을 한 번에 렌더링**합니다.

```kotlin [compose-playground]
@Composable
fun BasicListExample() {
    val items = listOf("사과", "바나나", "체리", "포도", "키위")

    Column(
        modifier = Modifier.verticalScroll(rememberScrollState())
    ) {
        items.forEach { fruit ->
            Text(
                text = fruit,
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(16.dp)
            )
        }
    }
}
```

### LazyColumn (지연 리스트)

데이터가 많을 때 사용합니다. **화면에 보이는 항목만 렌더링**하여 메모리와 성능을 최적화합니다.

```kotlin [compose-playground]
@Composable
fun LazyListExample() {
    val items = List(1000) { "항목 #$it" }

    LazyColumn {
        items(items) { item ->
            Text(
                text = item,
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(16.dp)
            )
        }
    }
}
```

### 언제 무엇을 사용할까?

| 상황 | 권장 | 이유 |
|------|------|------|
| 항목 5개 이하 | `Column` | 오버헤드 없이 간단 |
| 항목 수십 개 (스크롤 필요) | `Column` + `verticalScroll` | 단순한 경우 충분 |
| 항목 수백~수천 개 | `LazyColumn` | 화면 밖 항목 미렌더링 |
| 동적으로 변하는 리스트 | `LazyColumn` | 효율적 업데이트 |
| 무한 스크롤 | `LazyColumn` + Paging | 페이지 단위 로드 |

---

## 2. LazyColumn 기초

`LazyColumn`은 Android XML의 `RecyclerView`에 해당하는 Compose의 지연 목록 컴포넌트입니다.

### 기본 구조

```kotlin [compose-playground]
@Composable
fun SimpleLazyColumn() {
    LazyColumn {
        // 단일 항목
        item {
            Text(
                text = "헤더",
                style = MaterialTheme.typography.headlineMedium,
                modifier = Modifier.padding(16.dp)
            )
        }

        // 리스트 항목
        items(100) { index ->
            Text(
                text = "항목 $index",
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(horizontal = 16.dp, vertical = 8.dp)
            )
        }

        // 마지막 단일 항목
        item {
            Text(
                text = "푸터",
                modifier = Modifier.padding(16.dp)
            )
        }
    }
}
```

---

## 3. LazyListScope DSL

`LazyColumn`과 `LazyRow` 내부에서 사용할 수 있는 DSL(Domain Specific Language) 함수들입니다.

### item: 단일 항목

```kotlin [compose-playground]
LazyColumn {
    item {
        Text("이것은 하나의 항목입니다")
    }
}
```

### items: 컬렉션 기반 항목

```kotlin [compose-playground]
val fruits = listOf("사과", "바나나", "체리")

LazyColumn {
    // 리스트 사용
    items(fruits) { fruit ->
        Text(text = fruit)
    }

    // 개수 사용
    items(count = 50) { index ->
        Text(text = "항목 $index")
    }
}
```

### itemsIndexed: 인덱스와 함께

```kotlin [compose-playground]
val fruits = listOf("사과", "바나나", "체리")

LazyColumn {
    itemsIndexed(fruits) { index, fruit ->
        Text(text = "${index + 1}. $fruit")
    }
}
```

### DSL 함수 정리

| 함수 | 설명 | 매개변수 |
|------|------|----------|
| `item` | 단일 항목 추가 | `key`, `contentType`, `content` |
| `items(count)` | 개수 기반 항목 추가 | `count`, `key`, `contentType`, `itemContent` |
| `items(list)` | 리스트 기반 항목 추가 | `items`, `key`, `contentType`, `itemContent` |
| `itemsIndexed(list)` | 인덱스 포함 리스트 항목 | `items`, `key`, `contentType`, `itemContent` |
| `stickyHeader` | 고정 헤더 (실험적) | `key`, `contentType`, `content` |

---

## 4. LazyColumn 핵심 매개변수

| 매개변수 | 타입 | 설명 | 기본값 |
|----------|------|------|--------|
| `modifier` | `Modifier` | 수정자 | `Modifier` |
| `state` | `LazyListState` | 스크롤 상태 | `rememberLazyListState()` |
| `contentPadding` | `PaddingValues` | 콘텐츠 전체의 패딩 | `PaddingValues(0.dp)` |
| `reverseLayout` | `Boolean` | 역순 레이아웃 | `false` |
| `verticalArrangement` | `Arrangement.Vertical` | 항목 간 세로 배치 | `Arrangement.Top` |
| `horizontalAlignment` | `Alignment.Horizontal` | 항목의 가로 정렬 | `Alignment.Start` |
| `flingBehavior` | `FlingBehavior` | 플링(스냅) 동작 | `ScrollableDefaults.flingBehavior()` |
| `userScrollEnabled` | `Boolean` | 사용자 스크롤 허용 | `true` |

### contentPadding 활용

`contentPadding`은 리스트 콘텐츠 주위에 패딩을 추가합니다. `Modifier.padding()`과 달리 스크롤 영역에는 영향을 주지 않습니다.

```kotlin [compose-playground]
@Composable
fun PaddedLazyColumn() {
    LazyColumn(
        contentPadding = PaddingValues(
            start = 16.dp,
            end = 16.dp,
            top = 8.dp,
            bottom = 80.dp // FAB와 겹치지 않도록 하단 여유
        )
    ) {
        items(50) { index ->
            Card(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(vertical = 4.dp)
            ) {
                Text(
                    text = "항목 $index",
                    modifier = Modifier.padding(16.dp)
                )
            }
        }
    }
}
```

### verticalArrangement로 항목 간격

```kotlin [compose-playground]
@Composable
fun SpacedLazyColumn() {
    LazyColumn(
        verticalArrangement = Arrangement.spacedBy(8.dp),
        contentPadding = PaddingValues(16.dp)
    ) {
        items(20) { index ->
            Card(modifier = Modifier.fillMaxWidth()) {
                Text(
                    text = "항목 $index",
                    modifier = Modifier.padding(16.dp)
                )
            }
        }
    }
}
```

> **팁**: `Arrangement.spacedBy()`를 사용하면 각 항목에 일일이 `Modifier.padding()`을 넣을 필요 없이 균일한 간격을 줄 수 있습니다.

---

## 5. LazyRow: 가로 스크롤 리스트

`LazyRow`는 `LazyColumn`의 가로 버전입니다. 가로로 스크롤하는 리스트를 만듭니다.

```kotlin [compose-playground]
@Composable
fun HorizontalListExample() {
    LazyRow(
        horizontalArrangement = Arrangement.spacedBy(12.dp),
        contentPadding = PaddingValues(horizontal = 16.dp)
    ) {
        items(20) { index ->
            Card(
                modifier = Modifier.size(width = 150.dp, height = 100.dp)
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

### 실무 예: 카테고리 칩 리스트

```kotlin [compose-playground]
@Composable
fun CategoryChipRow() {
    val categories = listOf("전체", "음식", "여행", "기술", "스포츠", "음악", "영화", "패션")
    var selectedCategory by remember { mutableStateOf("전체") }

    LazyRow(
        horizontalArrangement = Arrangement.spacedBy(8.dp),
        contentPadding = PaddingValues(horizontal = 16.dp)
    ) {
        items(categories) { category ->
            FilterChip(
                selected = category == selectedCategory,
                onClick = { selectedCategory = category },
                label = { Text(category) }
            )
        }
    }
}
```

### LazyRow 주요 매개변수

| 매개변수 | 타입 | 설명 | 기본값 |
|----------|------|------|--------|
| `modifier` | `Modifier` | 수정자 | `Modifier` |
| `state` | `LazyListState` | 스크롤 상태 | `rememberLazyListState()` |
| `contentPadding` | `PaddingValues` | 콘텐츠 패딩 | `PaddingValues(0.dp)` |
| `horizontalArrangement` | `Arrangement.Horizontal` | 항목 간 가로 배치 | `Arrangement.Start` |
| `verticalAlignment` | `Alignment.Vertical` | 항목의 세로 정렬 | `Alignment.Top` |

---

## 6. key 매개변수의 중요성

`key`는 각 항목의 고유 식별자를 지정합니다. Compose가 리스트 변경(추가, 삭제, 재정렬) 시 올바르게 항목을 추적하도록 도와줍니다.

### key가 없을 때의 문제

```kotlin [compose-playground]
// 잘못된 예: key 없음
LazyColumn {
    items(todoList) { todo ->
        TodoItem(todo = todo)
        // 항목 삭제/재정렬 시 잘못된 항목에 상태가 유지될 수 있음
    }
}
```

### key 사용

```kotlin [compose-playground]
// 올바른 예: 고유한 key 제공
LazyColumn {
    items(
        items = todoList,
        key = { todo -> todo.id } // 각 항목의 고유 ID
    ) { todo ->
        TodoItem(todo = todo)
    }
}
```

### key의 효과

| 측면 | key 없음 | key 있음 |
|------|---------|----------|
| 항목 재정렬 | 상태가 위치에 바인딩 (혼동 발생) | 상태가 데이터에 바인딩 (정확) |
| 항목 삭제 | 뒤의 모든 항목 리컴포지션 | 삭제된 항목만 제거 |
| 항목 추가 | 뒤의 모든 항목 리컴포지션 | 새 항목만 추가 |
| 애니메이션 | `animateItem()` 작동 안 함 | `animateItem()` 정상 작동 |

### 실전 예제

```kotlin [compose-playground]
data class Contact(
    val id: String,
    val name: String,
    val phone: String
)

@Composable
fun ContactList(contacts: List<Contact>) {
    LazyColumn {
        items(
            items = contacts,
            key = { contact -> contact.id } // 고유 ID를 key로 사용
        ) { contact ->
            ContactItem(contact = contact)
        }
    }
}

@Composable
fun ContactItem(contact: Contact) {
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .padding(16.dp),
        verticalAlignment = Alignment.CenterVertically
    ) {
        Icon(Icons.Default.Person, contentDescription = null)
        Spacer(modifier = Modifier.width(12.dp))
        Column {
            Text(
                text = contact.name,
                style = MaterialTheme.typography.bodyLarge,
                fontWeight = FontWeight.Bold
            )
            Text(
                text = contact.phone,
                style = MaterialTheme.typography.bodyMedium,
                color = Color.Gray
            )
        }
    }
}
```

> **규칙**: `key`에는 항목의 고유하고 안정적인 식별자를 사용하세요. 인덱스를 key로 사용하지 마세요 -- 항목이 추가/삭제되면 인덱스가 변경되기 때문입니다.

---

## 7. stickyHeader로 고정 헤더

`stickyHeader`는 스크롤 시 섹션 헤더가 화면 상단에 고정되는 기능입니다.

```kotlin [compose-playground]
@OptIn(ExperimentalFoundationApi::class)
@Composable
fun StickyHeaderExample() {
    val groupedContacts = mapOf(
        "ㄱ" to listOf("강민수", "김철수", "권영희"),
        "ㄴ" to listOf("나영석", "남궁민"),
        "ㄷ" to listOf("도경수", "동해"),
        "ㄹ" to listOf("류현진", "이민호"),
    )

    LazyColumn {
        groupedContacts.forEach { (initial, contacts) ->
            stickyHeader {
                Text(
                    text = initial,
                    modifier = Modifier
                        .fillMaxWidth()
                        .background(MaterialTheme.colorScheme.primaryContainer)
                        .padding(horizontal = 16.dp, vertical = 8.dp),
                    style = MaterialTheme.typography.titleMedium,
                    fontWeight = FontWeight.Bold,
                    color = MaterialTheme.colorScheme.onPrimaryContainer
                )
            }

            items(contacts) { contact ->
                Text(
                    text = contact,
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(horizontal = 16.dp, vertical = 12.dp)
                )
                HorizontalDivider()
            }
        }
    }
}
```

> **참고**: `stickyHeader`는 `ExperimentalFoundationApi`로 표시되어 있으므로 `@OptIn` 어노테이션이 필요합니다.

---

## 8. animateItem으로 항목 애니메이션

`animateItem()`을 사용하면 항목이 추가, 삭제, 재정렬될 때 부드러운 애니메이션이 적용됩니다.

```kotlin [compose-playground]
@Composable
fun AnimatedListExample() {
    var items by remember { mutableStateOf(List(5) { "항목 $it" }) }

    Column {
        Row(
            modifier = Modifier.padding(16.dp),
            horizontalArrangement = Arrangement.spacedBy(8.dp)
        ) {
            Button(onClick = {
                val newIndex = items.size
                items = items + "항목 $newIndex"
            }) {
                Text("추가")
            }

            Button(onClick = {
                if (items.isNotEmpty()) {
                    items = items.dropLast(1)
                }
            }) {
                Text("삭제")
            }

            Button(onClick = {
                items = items.shuffled()
            }) {
                Text("섞기")
            }
        }

        LazyColumn(
            verticalArrangement = Arrangement.spacedBy(4.dp),
            contentPadding = PaddingValues(horizontal = 16.dp)
        ) {
            items(
                items = items,
                key = { it } // key 필수!
            ) { item ->
                Card(
                    modifier = Modifier
                        .fillMaxWidth()
                        .animateItem() // 애니메이션 적용
                ) {
                    Text(
                        text = item,
                        modifier = Modifier.padding(16.dp)
                    )
                }
            }
        }
    }
}
```

> **중요**: `animateItem()`이 작동하려면 반드시 `key`를 제공해야 합니다. key가 없으면 Compose가 어떤 항목이 이동/삭제되었는지 알 수 없습니다.

---

## 9. LazyVerticalGrid: 그리드 레이아웃

`LazyVerticalGrid`는 항목을 그리드(격자) 형태로 표시합니다. 사진 갤러리, 상품 목록 등에 적합합니다.

### GridCells.Fixed: 고정 열 수

```kotlin [compose-playground]
@Composable
fun FixedGridExample() {
    LazyVerticalGrid(
        columns = GridCells.Fixed(3), // 3열 고정
        contentPadding = PaddingValues(16.dp),
        horizontalArrangement = Arrangement.spacedBy(8.dp),
        verticalArrangement = Arrangement.spacedBy(8.dp)
    ) {
        items(30) { index ->
            Card(
                modifier = Modifier
                    .fillMaxWidth()
                    .aspectRatio(1f) // 정사각형
            ) {
                Box(
                    modifier = Modifier.fillMaxSize(),
                    contentAlignment = Alignment.Center
                ) {
                    Text("$index")
                }
            }
        }
    }
}
```

### GridCells.Adaptive: 반응형 열 수

```kotlin [compose-playground]
@Composable
fun AdaptiveGridExample() {
    LazyVerticalGrid(
        columns = GridCells.Adaptive(minSize = 120.dp), // 최소 120dp, 화면 너비에 따라 열 수 자동 결정
        contentPadding = PaddingValues(16.dp),
        horizontalArrangement = Arrangement.spacedBy(8.dp),
        verticalArrangement = Arrangement.spacedBy(8.dp)
    ) {
        items(30) { index ->
            Card(modifier = Modifier.fillMaxWidth()) {
                Column(
                    modifier = Modifier.padding(12.dp),
                    horizontalAlignment = Alignment.CenterHorizontally
                ) {
                    Icon(
                        Icons.Default.Image,
                        contentDescription = null,
                        modifier = Modifier.size(48.dp)
                    )
                    Spacer(modifier = Modifier.height(8.dp))
                    Text("사진 $index")
                }
            }
        }
    }
}
```

### GridCells 비교

| 옵션 | 설명 | 사용 시기 |
|------|------|-----------|
| `GridCells.Fixed(n)` | 정확히 n개 열 | 열 수가 정해진 경우 |
| `GridCells.Adaptive(minSize)` | 최소 크기 기반으로 열 수 자동 계산 | 다양한 화면 크기 대응 |
| `GridCells.FixedSize(size)` | 각 셀의 크기를 고정 | 고정 크기 셀이 필요한 경우 |

### LazyVerticalGrid 주요 매개변수

| 매개변수 | 타입 | 설명 | 기본값 |
|----------|------|------|--------|
| `columns` | `GridCells` | 열 구성 방식 | (필수) |
| `modifier` | `Modifier` | 수정자 | `Modifier` |
| `state` | `LazyGridState` | 스크롤 상태 | `rememberLazyGridState()` |
| `contentPadding` | `PaddingValues` | 콘텐츠 패딩 | `PaddingValues(0.dp)` |
| `verticalArrangement` | `Arrangement.Vertical` | 세로 배치 | `Arrangement.Top` |
| `horizontalArrangement` | `Arrangement.Horizontal` | 가로 배치 | `Arrangement.Start` |

### 실전 예: 상품 그리드

```kotlin [compose-playground]
data class Product(
    val id: Int,
    val name: String,
    val price: Int,
    val imageRes: Int
)

@Composable
fun ProductGrid(products: List<Product>) {
    LazyVerticalGrid(
        columns = GridCells.Adaptive(minSize = 160.dp),
        contentPadding = PaddingValues(16.dp),
        horizontalArrangement = Arrangement.spacedBy(12.dp),
        verticalArrangement = Arrangement.spacedBy(12.dp)
    ) {
        items(
            items = products,
            key = { it.id }
        ) { product ->
            ProductCard(product = product)
        }
    }
}

@Composable
fun ProductCard(product: Product) {
    Card(modifier = Modifier.fillMaxWidth()) {
        Column {
            Image(
                painter = painterResource(id = product.imageRes),
                contentDescription = product.name,
                modifier = Modifier
                    .fillMaxWidth()
                    .aspectRatio(1f),
                contentScale = ContentScale.Crop
            )
            Column(modifier = Modifier.padding(12.dp)) {
                Text(
                    text = product.name,
                    style = MaterialTheme.typography.bodyMedium,
                    maxLines = 1,
                    overflow = TextOverflow.Ellipsis
                )
                Text(
                    text = "${product.price}원",
                    style = MaterialTheme.typography.titleSmall,
                    fontWeight = FontWeight.Bold,
                    color = MaterialTheme.colorScheme.primary
                )
            }
        }
    }
}
```

---

## 10. LazyVerticalStaggeredGrid: 핀터레스트 스타일

`LazyVerticalStaggeredGrid`는 각 항목의 높이가 다른 엇갈린(staggered) 그리드를 만듭니다. Pinterest, 갤러리 앱에서 자주 볼 수 있는 레이아웃입니다.

```kotlin [compose-playground]
@OptIn(ExperimentalFoundationApi::class)
@Composable
fun StaggeredGridExample() {
    val items = remember {
        List(30) { index ->
            // 각 항목마다 다른 높이
            index to (100 + (index * 37) % 200).dp
        }
    }

    LazyVerticalStaggeredGrid(
        columns = StaggeredGridCells.Fixed(2),
        contentPadding = PaddingValues(16.dp),
        horizontalArrangement = Arrangement.spacedBy(8.dp),
        verticalItemSpacing = 8.dp
    ) {
        items(items) { (index, height) ->
            Card(
                modifier = Modifier
                    .fillMaxWidth()
                    .height(height)
            ) {
                Box(
                    modifier = Modifier.fillMaxSize(),
                    contentAlignment = Alignment.Center
                ) {
                    Text("항목 $index")
                }
            }
        }
    }
}
```

### StaggeredGridCells 옵션

| 옵션 | 설명 |
|------|------|
| `StaggeredGridCells.Fixed(n)` | n개 열 고정 |
| `StaggeredGridCells.Adaptive(minSize)` | 최소 크기 기반 자동 열 수 |
| `StaggeredGridCells.FixedSize(size)` | 고정 크기 셀 |

---

## 11. 스크롤 위치 제어

`LazyListState`를 사용하면 프로그래밍 방식으로 스크롤을 제어하고, 현재 스크롤 위치를 관찰할 수 있습니다.

### rememberLazyListState

```kotlin [compose-playground]
@Composable
fun ScrollControlExample() {
    val listState = rememberLazyListState()
    val coroutineScope = rememberCoroutineScope()

    Column {
        // 스크롤 컨트롤 버튼
        Row(
            modifier = Modifier.padding(16.dp),
            horizontalArrangement = Arrangement.spacedBy(8.dp)
        ) {
            Button(onClick = {
                coroutineScope.launch {
                    listState.animateScrollToItem(0) // 맨 위로 스크롤 (애니메이션)
                }
            }) {
                Text("맨 위로")
            }

            Button(onClick = {
                coroutineScope.launch {
                    listState.scrollToItem(99) // 마지막으로 점프 (즉시 이동)
                }
            }) {
                Text("맨 아래로")
            }
        }

        // 리스트
        LazyColumn(state = listState) {
            items(100) { index ->
                Text(
                    text = "항목 $index",
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(16.dp)
                )
            }
        }
    }
}
```

### 스크롤 위치에 따른 UI 변경

```kotlin [compose-playground]
@Composable
fun ScrollAwareExample() {
    val listState = rememberLazyListState()
    val coroutineScope = rememberCoroutineScope()

    // 첫 번째 보이는 항목 인덱스 관찰
    val showScrollToTopButton by remember {
        derivedStateOf {
            listState.firstVisibleItemIndex > 5
        }
    }

    Box {
        LazyColumn(state = listState) {
            items(100) { index ->
                Text(
                    text = "항목 $index",
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(16.dp)
                )
            }
        }

        // 스크롤이 일정 이상 내려가면 "위로" 버튼 표시
        if (showScrollToTopButton) {
            FloatingActionButton(
                onClick = {
                    coroutineScope.launch {
                        listState.animateScrollToItem(0)
                    }
                },
                modifier = Modifier
                    .align(Alignment.BottomEnd)
                    .padding(16.dp)
            ) {
                Icon(Icons.Default.KeyboardArrowUp, contentDescription = "맨 위로")
            }
        }
    }
}
```

### scrollToItem vs animateScrollToItem

| 함수 | 설명 | 사용 시기 |
|------|------|-----------|
| `scrollToItem(index)` | 즉시 해당 위치로 이동 | 초기 위치 설정, 긴 거리 이동 |
| `animateScrollToItem(index)` | 애니메이션으로 부드럽게 이동 | 가까운 거리, UX 중요한 경우 |

---

## 12. 주의사항과 모범 사례

> **2026 업데이트 (Foundation 1.10.4)**: `LazyLayout`, `LazyLayoutPrefetchState` API가 안정화(Stable)되었습니다. Pager의 프리페치 전략이 Cache Window 방식으로 개선되어 초기 프리페치가 기본 활성화됩니다. 또한 비지연(non-lazy) `Grid` 레이아웃이 실험적으로 추가되었습니다 (`@OptIn(ExperimentalGridApi::class)`).

### 1) 0dp 크기 항목 금지

항목의 크기가 0이면 LazyColumn이 무한히 항목을 만들려고 시도할 수 있습니다.

```kotlin [compose-playground]
// 잘못된 예: 높이가 0인 항목
LazyColumn {
    items(1000) { index ->
        Text("") // 내용이 없어 높이가 0이 될 수 있음
    }
}

// 올바른 예: 최소 높이 보장
LazyColumn {
    items(1000) { index ->
        Text(
            text = "항목 $index",
            modifier = Modifier.heightIn(min = 48.dp)
        )
    }
}
```

### 2) 동일 방향 중첩 스크롤 금지

`LazyColumn` 안에 `LazyColumn`을 넣거나, 스크롤 가능한 `Column`을 넣으면 안 됩니다.

```kotlin [compose-playground]
// 잘못된 예: LazyColumn 안에 LazyColumn
LazyColumn {
    item {
        LazyColumn(modifier = Modifier.height(300.dp)) { // 금지!
            items(50) { Text("내부 항목 $it") }
        }
    }
}

// 올바른 방법 1: 하나의 LazyColumn에 모든 항목을 평탄화
LazyColumn {
    item { Text("섹션 1 헤더") }
    items(section1Items) { item -> Text(item) }
    item { Text("섹션 2 헤더") }
    items(section2Items) { item -> Text(item) }
}

// 올바른 방법 2: 수직 LazyColumn 안에 수평 LazyRow (방향이 다르면 OK)
LazyColumn {
    item {
        LazyRow { // 방향이 다르므로 허용
            items(20) { Text("가로 항목 $it") }
        }
    }
}
```

### 3) contentType 사용

서로 다른 타입의 항목이 섞여 있을 때 `contentType`을 제공하면 Compose가 뷰를 더 효율적으로 재사용합니다.

```kotlin [compose-playground]
LazyColumn {
    item(contentType = "header") {
        Text(
            text = "인기 상품",
            style = MaterialTheme.typography.headlineMedium
        )
    }

    items(
        items = products,
        key = { it.id },
        contentType = { "product" } // 모든 상품이 같은 타입
    ) { product ->
        ProductCard(product = product)
    }

    item(contentType = "footer") {
        Text("더 보기", modifier = Modifier.padding(16.dp))
    }
}
```

### 4) 무거운 작업을 항목 컴포지션에서 하지 않기

```kotlin [compose-playground]
// 잘못된 예: 매 항목마다 무거운 계산
items(products) { product ->
    val formattedPrice = NumberFormat.getCurrencyInstance().format(product.price) // 매번 생성
    Text(formattedPrice)
}

// 올바른 예: remember로 캐싱
items(products) { product ->
    val formattedPrice = remember(product.price) {
        NumberFormat.getCurrencyInstance().format(product.price)
    }
    Text(formattedPrice)
}
```

---

## 13. Paging 라이브러리 연동

대량의 데이터를 서버나 데이터베이스에서 페이지 단위로 로드할 때 Paging 라이브러리를 사용합니다.

### 의존성 추가

```kotlin [compose-playground]
// build.gradle.kts
dependencies {
    implementation("androidx.paging:paging-runtime-ktx:3.x.x")
    implementation("androidx.paging:paging-compose:3.x.x")
}
```

### 기본 구조

```kotlin [compose-playground]
// 1. PagingSource 정의
class ArticlePagingSource(
    private val api: ArticleApi
) : PagingSource<Int, Article>() {

    override suspend fun load(params: LoadParams<Int>): LoadResult<Int, Article> {
        val page = params.key ?: 1
        return try {
            val response = api.getArticles(page = page, size = params.loadSize)
            LoadResult.Page(
                data = response.articles,
                prevKey = if (page == 1) null else page - 1,
                nextKey = if (response.articles.isEmpty()) null else page + 1
            )
        } catch (e: Exception) {
            LoadResult.Error(e)
        }
    }

    override fun getRefreshKey(state: PagingState<Int, Article>): Int? {
        return state.anchorPosition?.let { position ->
            state.closestPageToPosition(position)?.prevKey?.plus(1)
                ?: state.closestPageToPosition(position)?.nextKey?.minus(1)
        }
    }
}

// 2. ViewModel에서 Pager 설정
class ArticleViewModel : ViewModel() {
    val articles: Flow<PagingData<Article>> = Pager(
        config = PagingConfig(
            pageSize = 20,
            enablePlaceholders = false
        ),
        pagingSourceFactory = { ArticlePagingSource(api) }
    ).flow.cachedIn(viewModelScope)
}

// 3. Compose에서 사용
@Composable
fun ArticleListScreen(viewModel: ArticleViewModel) {
    val articles = viewModel.articles.collectAsLazyPagingItems()

    LazyColumn {
        items(
            count = articles.itemCount,
            key = articles.itemKey { it.id }
        ) { index ->
            val article = articles[index]
            if (article != null) {
                ArticleCard(article = article)
            }
        }

        // 로딩 상태 표시
        when (articles.loadState.append) {
            is LoadState.Loading -> {
                item {
                    Box(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(16.dp),
                        contentAlignment = Alignment.Center
                    ) {
                        CircularProgressIndicator()
                    }
                }
            }
            is LoadState.Error -> {
                item {
                    Text(
                        text = "로드 실패. 다시 시도하세요.",
                        modifier = Modifier.padding(16.dp)
                    )
                }
            }
            else -> {}
        }
    }
}
```

> **참고**: Paging 라이브러리는 Phase 10 (아키텍처)에서 더 자세히 다룹니다. 여기서는 LazyColumn과 함께 사용하는 방법의 개요만 소개합니다.

---

## 14. XML View와의 비교

| XML View (기존 방식) | Jetpack Compose | 비고 |
|---------------------|-----------------|------|
| `RecyclerView` | `LazyColumn` / `LazyRow` | 지연 리스트 |
| `RecyclerView.Adapter` | `LazyListScope` DSL (`items`, `item`) | 항목 정의 |
| `ViewHolder` | 불필요 (Composable 함수가 대체) | 보일러플레이트 제거 |
| `LayoutManager(LINEAR_VERTICAL)` | `LazyColumn` | 세로 리스트 |
| `LayoutManager(LINEAR_HORIZONTAL)` | `LazyRow` | 가로 리스트 |
| `GridLayoutManager` | `LazyVerticalGrid` | 그리드 |
| `StaggeredGridLayoutManager` | `LazyVerticalStaggeredGrid` | 엇갈린 그리드 |
| `DiffUtil` | `key` 매개변수 | 효율적 업데이트 |
| `ItemDecoration` (divider) | `HorizontalDivider` + `Arrangement.spacedBy` | 구분선/간격 |
| `ScrollListener` | `LazyListState` | 스크롤 상태 관찰 |
| `smoothScrollToPosition()` | `animateScrollToItem()` | 부드러운 스크롤 |
| `PagingDataAdapter` | `collectAsLazyPagingItems()` | 페이징 연동 |

> **큰 차이점**: RecyclerView에서는 Adapter, ViewHolder, LayoutManager, DiffUtil 등 많은 보일러플레이트 코드가 필요했지만, Compose에서는 `LazyColumn` + `items` DSL만으로 간단하게 구현됩니다.

---

> **Phase 3 완료!** 다음은 [Phase 4: 상태 관리](../phase-04-state-management/01-state-and-remember.md)에서 Compose의 가장 중요한 개념인 상태 관리를 깊이 있게 배워봅시다.
