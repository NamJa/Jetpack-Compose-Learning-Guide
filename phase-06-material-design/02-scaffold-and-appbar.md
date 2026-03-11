# Scaffold와 앱 바

> **"Scaffold는 앱의 뼈대이고, 앱 바는 그 뼈대 위의 얼굴이다."**
>
> Material Design 앱의 기본 구조는 Scaffold로 구성됩니다. 상단 앱 바, 하단 바, FAB, 스낵바 등을 일관된 레이아웃으로 배치해주는 핵심 컴포넌트입니다.

---

## 목차

1. [Scaffold 개요](#1-scaffold-개요)
2. [TopAppBar: title, navigationIcon, actions](#2-topappbar-title-navigationicon-actions)
3. [CenterAlignedTopAppBar, MediumTopAppBar, LargeTopAppBar](#3-centeralignedtopappbar-mediumtopappbar-largetopappbar)
4. [BottomAppBar](#4-bottomappbar)
5. [NavigationBar + NavigationBarItem](#5-navigationbar--navigationbaritem)
6. [NavigationRail + NavigationRailItem](#6-navigationrail--navigationrailitem)
7. [FloatingActionButton, ExtendedFloatingActionButton](#7-floatingactionbutton-extendedfloatingactionbutton)
8. [Snackbar: SnackbarHostState, showSnackbar](#8-snackbar-snackbarhoststate-showsnackbar)
9. [NavigationSuiteScaffold: 적응형 내비게이션](#9-navigationsuitescaffold-적응형-내비게이션)

---

## 1. Scaffold 개요

`Scaffold`는 Material Design의 **기본 화면 레이아웃 구조**를 제공합니다. 상단 바, 하단 바, FAB, 스낵바, 콘텐츠 영역을 올바른 위치에 자동으로 배치합니다.

```kotlin [compose-playground]
import androidx.compose.material3.Scaffold

@Composable
fun MainScreen() {
    val snackbarHostState = remember { SnackbarHostState() }

    Scaffold(
        topBar = {
            // 상단 앱 바
            TopAppBar(title = { Text("내 앱") })
        },
        bottomBar = {
            // 하단 내비게이션 바
            NavigationBar { /* ... */ }
        },
        floatingActionButton = {
            // 플로팅 액션 버튼
            FloatingActionButton(onClick = { /* ... */ }) {
                Icon(Icons.Default.Add, contentDescription = "추가")
            }
        },
        snackbarHost = {
            // 스낵바 호스트
            SnackbarHost(hostState = snackbarHostState)
        }
    ) { innerPadding ->
        // 콘텐츠 영역 — innerPadding을 반드시 적용해야 함!
        LazyColumn(
            modifier = Modifier.padding(innerPadding)
        ) {
            items(100) { index ->
                Text(
                    text = "아이템 #$index",
                    modifier = Modifier.padding(16.dp)
                )
            }
        }
    }
}
```

> **중요**: `Scaffold`의 `content` 람다는 `PaddingValues`(`innerPadding`)를 제공합니다. 이를 콘텐츠에 반드시 적용해야 상단 바, 하단 바와 콘텐츠가 겹치지 않습니다.

---

## 2. TopAppBar: title, navigationIcon, actions

`TopAppBar`는 화면 상단에 제목, 내비게이션 아이콘(뒤로 가기), 액션 버튼을 배치합니다.

```kotlin [compose-playground]
import androidx.compose.material3.TopAppBar
import androidx.compose.material3.ExperimentalMaterial3Api

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun MyTopAppBar(
    onBackClick: () -> Unit,
    onSearchClick: () -> Unit,
    onMoreClick: () -> Unit
) {
    TopAppBar(
        // 제목
        title = {
            Text("홈")
        },
        // 왼쪽 내비게이션 아이콘 (뒤로 가기, 메뉴 등)
        navigationIcon = {
            IconButton(onClick = onBackClick) {
                Icon(
                    imageVector = Icons.AutoMirrored.Filled.ArrowBack,
                    contentDescription = "뒤로 가기"
                )
            }
        },
        // 오른쪽 액션 버튼들
        actions = {
            IconButton(onClick = onSearchClick) {
                Icon(
                    imageVector = Icons.Default.Search,
                    contentDescription = "검색"
                )
            }
            IconButton(onClick = onMoreClick) {
                Icon(
                    imageVector = Icons.Default.MoreVert,
                    contentDescription = "더보기"
                )
            }
        },
        // 색상 커스터마이징
        colors = TopAppBarDefaults.topAppBarColors(
            containerColor = MaterialTheme.colorScheme.primaryContainer,
            titleContentColor = MaterialTheme.colorScheme.onPrimaryContainer
        )
    )
}
```

### 스크롤 동작 연동

```kotlin [compose-playground]
@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun ScrollableScreen() {
    // 스크롤 시 앱 바가 자동으로 숨겨지는 동작
    val scrollBehavior = TopAppBarDefaults.enterAlwaysScrollBehavior()

    Scaffold(
        modifier = Modifier.nestedScroll(scrollBehavior.nestedScrollConnection),
        topBar = {
            TopAppBar(
                title = { Text("스크롤 가능한 화면") },
                scrollBehavior = scrollBehavior  // 스크롤 동작 연결
            )
        }
    ) { innerPadding ->
        LazyColumn(modifier = Modifier.padding(innerPadding)) {
            items(50) { index ->
                Text(
                    text = "아이템 #$index",
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(16.dp)
                )
            }
        }
    }
}
```

**scrollBehavior 종류:**
- `pinnedScrollBehavior()`: 스크롤해도 앱 바 고정 (기본)
- `enterAlwaysScrollBehavior()`: 위로 스크롤하면 숨김, 아래로 스크롤하면 나타남
- `exitUntilCollapsedScrollBehavior()`: Medium/LargeTopAppBar와 함께 접히는 효과

---

## 3. CenterAlignedTopAppBar, MediumTopAppBar, LargeTopAppBar

M3은 용도에 따라 4가지 종류의 TopAppBar를 제공합니다.

### CenterAlignedTopAppBar — 제목 중앙 정렬

```kotlin [compose-playground]
@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun CenteredAppBar() {
    CenterAlignedTopAppBar(
        title = { Text("중앙 제목") },
        navigationIcon = {
            IconButton(onClick = { /* ... */ }) {
                Icon(Icons.Default.Menu, contentDescription = "메뉴")
            }
        },
        actions = {
            IconButton(onClick = { /* ... */ }) {
                Icon(Icons.Default.Settings, contentDescription = "설정")
            }
        }
    )
}
```

### MediumTopAppBar — 두 줄 제목

```kotlin [compose-playground]
@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun MediumAppBarExample() {
    val scrollBehavior = TopAppBarDefaults.exitUntilCollapsedScrollBehavior()

    Scaffold(
        modifier = Modifier.nestedScroll(scrollBehavior.nestedScrollConnection),
        topBar = {
            MediumTopAppBar(
                title = { Text("중간 크기 앱 바") },
                navigationIcon = {
                    IconButton(onClick = { /* ... */ }) {
                        Icon(
                            Icons.AutoMirrored.Filled.ArrowBack,
                            contentDescription = "뒤로"
                        )
                    }
                },
                scrollBehavior = scrollBehavior
            )
        }
    ) { innerPadding ->
        // 스크롤하면 앱 바가 접혀서 작아짐
        LazyColumn(modifier = Modifier.padding(innerPadding)) {
            items(50) { Text("아이템 #$it", Modifier.padding(16.dp)) }
        }
    }
}
```

### LargeTopAppBar — 큰 제목

```kotlin [compose-playground]
@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun LargeAppBarExample() {
    val scrollBehavior = TopAppBarDefaults.exitUntilCollapsedScrollBehavior()

    Scaffold(
        modifier = Modifier.nestedScroll(scrollBehavior.nestedScrollConnection),
        topBar = {
            LargeTopAppBar(
                title = { Text("큰 앱 바 제목") },
                scrollBehavior = scrollBehavior
            )
        }
    ) { innerPadding ->
        LazyColumn(modifier = Modifier.padding(innerPadding)) {
            items(50) { Text("아이템 #$it", Modifier.padding(16.dp)) }
        }
    }
}
```

| 종류 | 특징 | 용도 |
|------|------|------|
| `TopAppBar` | 제목 왼쪽 정렬 | 일반 화면 |
| `CenterAlignedTopAppBar` | 제목 중앙 정렬 | 깔끔한 디자인이 필요할 때 |
| `MediumTopAppBar` | 큰 제목 → 스크롤 시 작아짐 | 섹션 화면 |
| `LargeTopAppBar` | 가장 큰 제목 → 스크롤 시 작아짐 | 메인 화면 |

---

## 4. BottomAppBar

`BottomAppBar`는 화면 하단에 액션 버튼들을 배치합니다. FAB과 함께 사용하는 것이 일반적입니다.

```kotlin [compose-playground]
@Composable
fun BottomAppBarExample() {
    Scaffold(
        bottomBar = {
            BottomAppBar(
                actions = {
                    IconButton(onClick = { /* ... */ }) {
                        Icon(Icons.Default.Check, contentDescription = "완료")
                    }
                    IconButton(onClick = { /* ... */ }) {
                        Icon(Icons.Default.Edit, contentDescription = "편집")
                    }
                    IconButton(onClick = { /* ... */ }) {
                        Icon(Icons.Default.Share, contentDescription = "공유")
                    }
                    IconButton(onClick = { /* ... */ }) {
                        Icon(Icons.Default.Delete, contentDescription = "삭제")
                    }
                },
                floatingActionButton = {
                    FloatingActionButton(
                        onClick = { /* ... */ },
                        containerColor = BottomAppBarDefaults.bottomAppBarFabColor
                    ) {
                        Icon(Icons.Default.Add, contentDescription = "추가")
                    }
                }
            )
        }
    ) { innerPadding ->
        Text(
            text = "콘텐츠 영역",
            modifier = Modifier.padding(innerPadding)
        )
    }
}
```

---

## 5. NavigationBar + NavigationBarItem

`NavigationBar`는 화면 하단에 배치되는 **탭 내비게이션**입니다. 3~5개의 최상위 목적지를 전환할 때 사용합니다.

```kotlin [compose-playground]
import androidx.compose.material3.NavigationBar
import androidx.compose.material3.NavigationBarItem

data class BottomNavItem(
    val label: String,
    val icon: ImageVector,
    val route: Any
)

@Composable
fun MyNavigationBar(
    currentRoute: Any?,
    onItemClick: (Any) -> Unit
) {
    val items = listOf(
        BottomNavItem("홈", Icons.Default.Home, Home),
        BottomNavItem("검색", Icons.Default.Search, Search),
        BottomNavItem("좋아요", Icons.Default.Favorite, Favorites),
        BottomNavItem("프로필", Icons.Default.Person, Profile)
    )

    NavigationBar {
        items.forEach { item ->
            NavigationBarItem(
                icon = {
                    Icon(
                        imageVector = item.icon,
                        contentDescription = item.label
                    )
                },
                label = { Text(item.label) },
                selected = currentRoute == item.route,
                onClick = { onItemClick(item.route) },
                // 뱃지 표시 (알림 수 등)
                // badge 파라미터로 뱃지를 추가할 수 있음
            )
        }
    }
}
```

### Scaffold + NavigationBar + NavHost 통합 예제

```kotlin [compose-playground]
@Composable
fun MainScreen() {
    val navController = rememberNavController()
    val navBackStackEntry by navController.currentBackStackEntryAsState()
    val currentDestination = navBackStackEntry?.destination

    Scaffold(
        bottomBar = {
            NavigationBar {
                listOf(
                    Triple("홈", Icons.Default.Home, Home),
                    Triple("검색", Icons.Default.Search, Search),
                    Triple("프로필", Icons.Default.Person, Profile)
                ).forEach { (label, icon, route) ->
                    NavigationBarItem(
                        icon = { Icon(icon, contentDescription = label) },
                        label = { Text(label) },
                        selected = currentDestination
                            ?.hierarchy
                            ?.any { it.hasRoute(route::class) } == true,
                        onClick = {
                            navController.navigate(route) {
                                popUpTo(navController.graph.findStartDestination().id) {
                                    saveState = true
                                }
                                launchSingleTop = true
                                restoreState = true
                            }
                        }
                    )
                }
            }
        }
    ) { innerPadding ->
        NavHost(
            navController = navController,
            startDestination = Home,
            modifier = Modifier.padding(innerPadding)
        ) {
            composable<Home> { HomeScreen() }
            composable<Search> { SearchScreen() }
            composable<Profile> { ProfileScreen() }
        }
    }
}
```

---

## 6. NavigationRail + NavigationRailItem

`NavigationRail`은 화면 **왼쪽에 세로로 배치**되는 내비게이션입니다. 태블릿이나 넓은 화면에서 `NavigationBar` 대신 사용합니다.

```kotlin [compose-playground]
import androidx.compose.material3.NavigationRail
import androidx.compose.material3.NavigationRailItem

@Composable
fun MyNavigationRail(
    currentRoute: Any?,
    onItemClick: (Any) -> Unit
) {
    NavigationRail(
        // 상단에 FAB이나 로고를 배치할 수 있음
        header = {
            FloatingActionButton(
                onClick = { /* ... */ },
                modifier = Modifier.padding(vertical = 12.dp)
            ) {
                Icon(Icons.Default.Edit, contentDescription = "작성")
            }
        }
    ) {
        // Spacer로 아이템들을 세로 중앙에 배치
        Spacer(modifier = Modifier.weight(1f))

        val items = listOf(
            Triple("홈", Icons.Default.Home, Home),
            Triple("검색", Icons.Default.Search, Search),
            Triple("프로필", Icons.Default.Person, Profile)
        )

        items.forEach { (label, icon, route) ->
            NavigationRailItem(
                icon = { Icon(icon, contentDescription = label) },
                label = { Text(label) },
                selected = currentRoute == route,
                onClick = { onItemClick(route) }
            )
        }

        Spacer(modifier = Modifier.weight(1f))
    }
}
```

### 화면 크기에 따라 NavigationBar/Rail 전환

```kotlin [compose-playground]
@Composable
fun AdaptiveNavigation() {
    val windowSizeClass = currentWindowAdaptiveInfo().windowSizeClass

    // 화면 너비에 따라 레이아웃 전환
    if (windowSizeClass.windowWidthSizeClass == WindowWidthSizeClass.COMPACT) {
        // 좁은 화면: 하단 내비게이션 바
        Scaffold(
            bottomBar = { MyNavigationBar(/* ... */) }
        ) { /* ... */ }
    } else {
        // 넓은 화면: 왼쪽 내비게이션 레일
        Row {
            MyNavigationRail(/* ... */)
            // 콘텐츠 영역
            NavHost(/* ... */)
        }
    }
}
```

---

## 7. FloatingActionButton, ExtendedFloatingActionButton

**FAB(Floating Action Button)** 은 화면에서 가장 중요한 하나의 액션을 나타냅니다.

```kotlin [compose-playground]
import androidx.compose.material3.FloatingActionButton
import androidx.compose.material3.SmallFloatingActionButton
import androidx.compose.material3.LargeFloatingActionButton
import androidx.compose.material3.ExtendedFloatingActionButton

// 기본 FAB
@Composable
fun BasicFab() {
    FloatingActionButton(
        onClick = { /* 주요 액션 */ },
        containerColor = MaterialTheme.colorScheme.primaryContainer,
        contentColor = MaterialTheme.colorScheme.onPrimaryContainer
    ) {
        Icon(Icons.Default.Add, contentDescription = "추가")
    }
}

// 작은 FAB
@Composable
fun SmallFab() {
    SmallFloatingActionButton(onClick = { /* ... */ }) {
        Icon(Icons.Default.Add, contentDescription = "추가")
    }
}

// 큰 FAB
@Composable
fun LargeFab() {
    LargeFloatingActionButton(onClick = { /* ... */ }) {
        Icon(
            Icons.Default.Add,
            contentDescription = "추가",
            modifier = Modifier.size(36.dp)
        )
    }
}

// Extended FAB — 아이콘 + 텍스트
@Composable
fun ExtendedFabExample() {
    ExtendedFloatingActionButton(
        onClick = { /* 새 글 작성 */ },
        icon = { Icon(Icons.Default.Edit, contentDescription = null) },
        text = { Text("새 글 작성") }
    )
}
```

### 스크롤에 따라 FAB 확장/축소

```kotlin [compose-playground]
@Composable
fun ScrollAwareFab() {
    val listState = rememberLazyListState()
    // 첫 번째 아이템이 보이면 확장, 스크롤하면 축소
    val expandedFab by remember {
        derivedStateOf { listState.firstVisibleItemIndex == 0 }
    }

    Scaffold(
        floatingActionButton = {
            ExtendedFloatingActionButton(
                onClick = { /* ... */ },
                expanded = expandedFab,  // 확장/축소 제어
                icon = { Icon(Icons.Default.Edit, contentDescription = null) },
                text = { Text("작성") }
            )
        }
    ) { innerPadding ->
        LazyColumn(
            state = listState,
            modifier = Modifier.padding(innerPadding)
        ) {
            items(50) { Text("아이템 #$it", Modifier.padding(16.dp)) }
        }
    }
}
```

---

## 8. Snackbar: SnackbarHostState, showSnackbar

`Snackbar`는 화면 하단에 잠시 나타나는 **알림 메시지**입니다. 사용자에게 피드백을 제공하거나, 되돌리기(Undo) 같은 간단한 액션을 제공합니다.

```kotlin [compose-playground]
import androidx.compose.material3.SnackbarHost
import androidx.compose.material3.SnackbarHostState
import kotlinx.coroutines.launch

@Composable
fun SnackbarExample() {
    // SnackbarHostState는 Scaffold 밖에서 생성하여 remember
    val snackbarHostState = remember { SnackbarHostState() }
    val scope = rememberCoroutineScope()

    Scaffold(
        snackbarHost = {
            SnackbarHost(hostState = snackbarHostState)
        }
    ) { innerPadding ->
        Column(modifier = Modifier.padding(innerPadding)) {

            // 기본 스낵바
            Button(onClick = {
                scope.launch {
                    snackbarHostState.showSnackbar(
                        message = "아이템이 삭제되었습니다."
                    )
                }
            }) {
                Text("기본 스낵바")
            }

            // 액션 버튼이 있는 스낵바
            Button(onClick = {
                scope.launch {
                    val result = snackbarHostState.showSnackbar(
                        message = "아이템이 삭제되었습니다.",
                        actionLabel = "되돌리기",
                        duration = SnackbarDuration.Short
                    )
                    // 사용자가 "되돌리기"를 클릭했을 때
                    when (result) {
                        SnackbarResult.ActionPerformed -> {
                            // 되돌리기 처리
                        }
                        SnackbarResult.Dismissed -> {
                            // 스낵바가 사라짐 (무시)
                        }
                    }
                }
            }) {
                Text("액션 스낵바")
            }
        }
    }
}
```

### ViewModel에서 스낵바 트리거

```kotlin [compose-playground]
// ViewModel
class ItemViewModel : ViewModel() {
    private val _snackbarMessage = MutableSharedFlow<String>()
    val snackbarMessage: SharedFlow<String> = _snackbarMessage.asSharedFlow()

    fun deleteItem(id: Int) {
        viewModelScope.launch {
            repository.delete(id)
            _snackbarMessage.emit("아이템이 삭제되었습니다.")
        }
    }
}

// 화면 컴포저블
@Composable
fun ItemScreen(viewModel: ItemViewModel = viewModel()) {
    val snackbarHostState = remember { SnackbarHostState() }

    // ViewModel의 스낵바 메시지를 관찰
    LaunchedEffect(Unit) {
        viewModel.snackbarMessage.collect { message ->
            snackbarHostState.showSnackbar(message)
        }
    }

    Scaffold(
        snackbarHost = { SnackbarHost(hostState = snackbarHostState) }
    ) { innerPadding ->
        // 콘텐츠...
    }
}
```

> **팁**: `showSnackbar()`는 `suspend` 함수이므로 코루틴 스코프에서 호출해야 합니다. `rememberCoroutineScope()`이나 `LaunchedEffect`를 활용하세요.

---

## 9. NavigationSuiteScaffold: 적응형 내비게이션

`NavigationSuiteScaffold`는 `material3-adaptive-navigation-suite` 라이브러리에서 제공하는 컴포넌트로, **윈도우 크기에 따라 자동으로** `NavigationBar`, `NavigationRail`, `NavigationDrawer` 중 적절한 내비게이션을 선택해줍니다.

```groovy
// build.gradle.kts
implementation("androidx.compose.material3:material3-adaptive-navigation-suite:<version>")
```

### 기본 사용법

```kotlin [compose-playground]
import androidx.compose.material3.adaptive.navigationsuite.NavigationSuiteScaffold
import androidx.compose.material3.adaptive.navigationsuite.NavigationSuiteDefaults

@Composable
fun AdaptiveApp() {
    var currentDestination by remember { mutableStateOf(AppDestinations.HOME) }

    NavigationSuiteScaffold(
        navigationSuiteItems = {
            AppDestinations.entries.forEach {
                item(
                    icon = { Icon(it.icon, contentDescription = stringResource(it.contentDescription)) },
                    label = { Text(stringResource(it.label)) },
                    selected = it == currentDestination,
                    onClick = { currentDestination = it }
                )
            }
        }
    ) {
        when (currentDestination) {
            AppDestinations.HOME -> HomeScreen()
            AppDestinations.FAVORITES -> FavoritesScreen()
        }
    }
}
```

### 자동 레이아웃 전환 동작

| 윈도우 크기 | 선택되는 내비게이션 |
|------------|-------------------|
| Compact (폰 세로) | `NavigationBar` (하단) |
| Medium (폰 가로 / 폴더블) | `NavigationRail` (좌측) |
| Expanded (태블릿 / 데스크탑) | `NavigationDrawer` (좌측 서랍) |

### 색상 커스터마이징

```kotlin [compose-playground]
NavigationSuiteScaffold(
    navigationSuiteItems = { /* ... */ },
    navigationSuiteColors = NavigationSuiteDefaults.colors(
        navigationBarContainerColor = MaterialTheme.colorScheme.surfaceContainer,
        navigationRailContainerColor = MaterialTheme.colorScheme.surfaceContainerLow
    ),
    containerColor = MaterialTheme.colorScheme.background
) {
    // 콘텐츠
}
```

아이템별 색상도 `NavigationSuiteDefaults.itemColors()`로 지정할 수 있습니다.

### 레이아웃 타입 강제 지정

자동 선택 대신, 특정 내비게이션 타입을 강제로 지정할 수도 있습니다.

```kotlin [compose-playground]
NavigationSuiteScaffold(
    layoutType = NavigationSuiteType.NavigationRail,  // 항상 NavigationRail 사용
    navigationSuiteItems = { /* ... */ }
) {
    // 콘텐츠
}
```

> **팁**: 기존 6절의 `AdaptiveNavigation` 예제처럼 직접 윈도우 크기를 분기하는 것보다, `NavigationSuiteScaffold`를 사용하면 훨씬 간결하게 적응형 내비게이션을 구현할 수 있습니다.

---

> **다음 문서**: [03. 대화상자와 하단 시트](03-dialog-and-bottomsheet.md)에서는 Dialog, BottomSheet, DropdownMenu 등 오버레이 UI 컴포넌트를 학습합니다.
