# Side Effects 완전 정복

> "부수 효과(Side Effect)는 컴포저블 함수의 범위 밖에서 발생하는 앱 상태의 변경이다. 컴포저블의 수명주기와 리컴포지션의 예측 불가능한 특성 때문에, 부수 효과는 반드시 통제된 환경에서 실행되어야 한다."
> — Android 공식 문서

---

## 목차

1. [부수 효과(Side Effect)란?](#1-부수-효과side-effect란)
2. [LaunchedEffect — 컴포저블 수명 동안 코루틴 실행](#2-launchedeffect--컴포저블-수명-동안-코루틴-실행)
3. [rememberCoroutineScope — 이벤트 핸들러에서 코루틴 실행](#3-remembercoroutinescope--이벤트-핸들러에서-코루틴-실행)
4. [rememberUpdatedState — 효과 재시작 없이 최신 값 참조](#4-rememberupdatedstate--효과-재시작-없이-최신-값-참조)
5. [DisposableEffect — 정리가 필요한 효과](#5-disposableeffect--정리가-필요한-효과)
6. [SideEffect — Compose에서 비-Compose 코드로 상태 발행](#6-sideeffect--compose에서-비-compose-코드로-상태-발행)
7. [produceState — 비-Compose 상태를 Compose State로 변환](#7-producestate--비-compose-상태를-compose-state로-변환)
8. [derivedStateOf — 불필요한 리컴포지션 방지](#8-derivedstateof--불필요한-리컴포지션-방지)
9. [snapshotFlow — Compose State를 Flow로 변환](#9-snapshotflow--compose-state를-flow로-변환)
10. [효과 선택 가이드](#10-효과-선택-가이드)

---

## 1. 부수 효과(Side Effect)란?

**부수 효과(Side Effect)** 란 컴포저블 함수의 범위 밖에서 발생하는 앱 상태의 변경을 말합니다.

컴포저블은 이상적으로 **부수 효과가 없어야(side-effect free)** 합니다. 하지만 실제 앱에서는 다음과 같은 작업이 필요합니다:

- 스낵바(Snackbar) 표시
- 특정 조건에서 다른 화면으로 이동
- 일회성 이벤트 처리 (토스트 메시지 등)
- 애널리틱스 이벤트 전송
- 센서, 위치 등 시스템 리소스 구독/해제

이러한 작업을 컴포저블 안에서 **안전하게** 실행하기 위해 Compose는 **Effect API**를 제공합니다.

> **Compose BOM 2026.02.01 참고 — Strong Skipping Mode**: Strong Skipping Mode가 이제 기본 활성화되어 있습니다. 이는 불안정(unstable)한 매개변수를 가진 컴포저블도 매개변수가 동일하면 리컴포지션을 건너뛸 수 있음을 의미합니다. 이에 따라 Effect가 트리거되는 빈도에 영향이 있을 수 있으니, Effect의 키(key)를 올바르게 지정하는 것이 더욱 중요해졌습니다.

### 왜 통제된 환경이 필요할까?

```kotlin
// ❌ 잘못된 예: 컴포저블 본문에서 직접 부수 효과 실행
@Composable
fun DangerousComposable(viewModel: MyViewModel) {
    // 리컴포지션마다 실행됨! (몇 번 실행될지 예측 불가)
    viewModel.sendAnalyticsEvent("screen_viewed")

    Text("Hello")
}
```

컴포저블은 **언제든지, 여러 번** 리컴포지션될 수 있습니다. 그래서 부수 효과를 직접 본문에 작성하면 예측 불가능한 동작이 발생합니다. Effect API는 이를 통제합니다.

---

## 2. LaunchedEffect — 컴포저블 수명 동안 코루틴 실행

`LaunchedEffect`는 컴포저블이 컴포지션에 진입할 때 **코루틴**을 시작하고, 컴포지션에서 나갈 때 자동으로 취소합니다.

### 기본 사용법

```kotlin
@Composable
fun SnackbarDemo(
    message: String?,
    snackbarHostState: SnackbarHostState
) {
    // message가 변경될 때마다 이전 코루틴을 취소하고 새로 시작
    if (message != null) {
        LaunchedEffect(message) {
            snackbarHostState.showSnackbar(message)
        }
    }
}
```

### LaunchedEffect의 키(Key) 동작

```kotlin
@Composable
fun TimerScreen(userId: String) {
    var elapsedTime by remember { mutableStateOf(0) }

    // userId가 변경되면: 이전 타이머 취소 → elapsedTime 리셋 → 새 타이머 시작
    LaunchedEffect(userId) {
        elapsedTime = 0
        while (true) {
            delay(1000)
            elapsedTime++
        }
    }

    Text("사용자 $userId 의 경과 시간: ${elapsedTime}초")
}
```

### 키가 Unit 또는 true인 경우

```kotlin
// 컴포저블이 컴포지션에 있는 동안 단 한 번만 실행
LaunchedEffect(Unit) {
    // 초기화 작업 (한 번만)
    viewModel.loadInitialData()
}
```

### LaunchedEffect에서 suspend 함수 호출

```kotlin
@Composable
fun DataScreen(viewModel: DataViewModel) {
    val scrollState = rememberLazyListState()

    // 데이터가 로드되면 맨 위로 스크롤
    LaunchedEffect(Unit) {
        viewModel.dataLoaded.collect { loaded ->
            if (loaded) {
                scrollState.animateScrollToItem(0)
            }
        }
    }

    LazyColumn(state = scrollState) {
        // ...
    }
}
```

---

## 3. rememberCoroutineScope — 이벤트 핸들러에서 코루틴 실행

`rememberCoroutineScope`는 컴포지션의 수명주기에 바인딩된 `CoroutineScope`를 제공합니다. `LaunchedEffect`와 달리 **이벤트 핸들러** 내에서 코루틴을 시작할 때 사용합니다.

### LaunchedEffect vs rememberCoroutineScope

```kotlin
// ❌ LaunchedEffect는 이벤트 핸들러에서 사용할 수 없다
@Composable
fun WrongUsage() {
    Button(onClick = {
        // LaunchedEffect(Unit) { } // 컴파일 에러! 컴포저블이 아닌 곳에서 호출 불가
    }) {
        Text("클릭")
    }
}

// ✅ rememberCoroutineScope로 이벤트 핸들러에서 코루틴 실행
@Composable
fun CorrectUsage(snackbarHostState: SnackbarHostState) {
    val scope = rememberCoroutineScope()

    Button(onClick = {
        scope.launch {
            snackbarHostState.showSnackbar("버튼이 클릭되었습니다!")
        }
    }) {
        Text("스낵바 표시")
    }
}
```

### 실전 예제: Scaffold + 스낵바

```kotlin
@Composable
fun ScaffoldWithSnackbar() {
    val snackbarHostState = remember { SnackbarHostState() }
    val scope = rememberCoroutineScope()

    Scaffold(
        snackbarHost = { SnackbarHost(snackbarHostState) }
    ) { paddingValues ->
        Column(modifier = Modifier.padding(paddingValues)) {
            Button(onClick = {
                scope.launch {
                    val result = snackbarHostState.showSnackbar(
                        message = "항목이 삭제되었습니다",
                        actionLabel = "실행 취소",
                        duration = SnackbarDuration.Short
                    )
                    if (result == SnackbarResult.ActionPerformed) {
                        // 사용자가 "실행 취소"를 클릭
                    }
                }
            }) {
                Text("삭제")
            }
        }
    }
}
```

---

## 4. rememberUpdatedState — 효과 재시작 없이 최신 값 참조

`rememberUpdatedState`는 값이 변경되어도 효과를 재시작하지 않으면서, 효과 내에서 항상 최신 값을 참조할 수 있게 합니다.

### 문제 상황

```kotlin
// ❌ 잘못된 예: onTimeout이 변경되어도 이전 값을 캡처한 상태로 유지
@Composable
fun SplashScreen(onTimeout: () -> Unit) {
    LaunchedEffect(Unit) { // Unit이므로 한 번만 실행
        delay(3000)
        onTimeout() // 3초 후 호출되지만, 최초 캡처된 onTimeout을 호출!
    }
}
```

### 해결: rememberUpdatedState

```kotlin
// ✅ 올바른 예: 항상 최신 onTimeout을 참조
@Composable
fun SplashScreen(onTimeout: () -> Unit) {
    val currentOnTimeout by rememberUpdatedState(onTimeout)

    LaunchedEffect(Unit) { // 여전히 한 번만 실행
        delay(3000)
        currentOnTimeout() // 3초 후 호출 시 최신 onTimeout 참조
    }
}
```

### 작동 원리

```
시간 0초: onTimeout = navigateToA  →  currentOnTimeout = navigateToA
시간 1초: onTimeout = navigateToB  →  currentOnTimeout = navigateToB (자동 업데이트)
시간 3초: LaunchedEffect가 currentOnTimeout() 호출 → navigateToB 실행 (최신!)
```

> **핵심**: `LaunchedEffect`의 키에 값을 넣으면 값이 변경될 때마다 효과가 재시작됩니다. 재시작 없이 최신 값만 참조하고 싶을 때 `rememberUpdatedState`를 사용합니다.

---

## 5. DisposableEffect — 정리가 필요한 효과

`DisposableEffect`는 키가 변경되거나 컴포저블이 컴포지션에서 나갈 때 **정리(cleanup)** 가 필요한 부수 효과에 사용합니다. 반드시 `onDispose` 블록을 포함해야 합니다.

### 기본 구조

```kotlin
@Composable
fun LifecycleObserverDemo(lifecycleOwner: LifecycleOwner) {
    DisposableEffect(lifecycleOwner) {
        // 효과 설정 (구독, 리스너 등록 등)
        val observer = LifecycleEventObserver { _, event ->
            when (event) {
                Lifecycle.Event.ON_START -> { /* 시작 시 로직 */ }
                Lifecycle.Event.ON_STOP -> { /* 중지 시 로직 */ }
                else -> {}
            }
        }
        lifecycleOwner.lifecycle.addObserver(observer)

        // 반드시 onDispose로 정리
        onDispose {
            lifecycleOwner.lifecycle.removeObserver(observer)
        }
    }
}
```

### 실전 예제: 시스템 브로드캐스트 수신기

```kotlin
@Composable
fun NetworkStatusListener(
    context: Context = LocalContext.current,
    onNetworkChanged: (Boolean) -> Unit
) {
    DisposableEffect(context) {
        val connectivityManager =
            context.getSystemService(Context.CONNECTIVITY_SERVICE) as ConnectivityManager

        val callback = object : ConnectivityManager.NetworkCallback() {
            override fun onAvailable(network: Network) {
                onNetworkChanged(true)
            }

            override fun onLost(network: Network) {
                onNetworkChanged(false)
            }
        }

        val request = NetworkRequest.Builder()
            .addCapability(NetworkCapabilities.NET_CAPABILITY_INTERNET)
            .build()

        connectivityManager.registerNetworkCallback(request, callback)

        onDispose {
            connectivityManager.unregisterNetworkCallback(callback)
        }
    }
}
```

### onDispose를 잊으면?

```kotlin
// ❌ 컴파일 에러: DisposableEffect는 반드시 onDispose를 포함해야 함
DisposableEffect(Unit) {
    // onDispose { } 없으면 컴파일 에러
}

// ✅ 정리할 것이 없어도 빈 onDispose 필요
DisposableEffect(Unit) {
    println("효과 시작")
    onDispose {
        // 정리할 것이 없더라도 반드시 포함
    }
}
```

---

## 6. SideEffect — Compose에서 비-Compose 코드로 상태 발행

`SideEffect`는 **리컴포지션이 성공적으로 완료될 때마다** 실행됩니다. Compose 상태를 Compose가 관리하지 않는 객체와 공유할 때 사용합니다.

```kotlin
@Composable
fun AnalyticsScreen(
    screenName: String,
    analytics: AnalyticsLibrary  // Compose가 관리하지 않는 외부 라이브러리
) {
    // 리컴포지션이 성공할 때마다 analytics에 현재 화면 이름 발행
    SideEffect {
        analytics.setCurrentScreen(screenName)
    }

    // UI
    Text("현재 화면: $screenName")
}
```

### SideEffect 특징

- 코루틴이 아닌 **일반 코드**만 실행 가능 (suspend 함수 호출 불가)
- **모든 리컴포지션마다** 실행됨
- 리컴포지션이 **실패(취소)되면 실행되지 않음** → 일관성 보장

```kotlin
// SideEffect vs LaunchedEffect 차이
@Composable
fun Comparison() {
    var count by remember { mutableStateOf(0) }

    // 매 리컴포지션마다 실행 (비-Compose 코드와 동기화)
    SideEffect {
        println("SideEffect: count = $count") // count가 바뀔 때마다 출력
    }

    // 최초 한 번만 실행 (코루틴)
    LaunchedEffect(Unit) {
        println("LaunchedEffect: 한 번만 실행")
    }
}
```

---

## 7. produceState — 비-Compose 상태를 Compose State로 변환

`produceState`는 Flow, RxJava, 콜백 기반 API 등 **비-Compose 상태 소스**를 Compose의 `State<T>`로 변환합니다.

### 기본 사용법

```kotlin
@Composable
fun UserProfile(userId: String, repository: UserRepository) {
    val userState by produceState<Result<User>>(
        initialValue = Result.Loading, // 초기값
        key1 = userId                  // userId가 변경되면 재시작
    ) {
        // 이 블록은 코루틴 스코프
        try {
            val user = repository.getUser(userId)
            value = Result.Success(user) // value에 할당하면 State 업데이트
        } catch (e: Exception) {
            value = Result.Error(e)
        }
    }

    when (val result = userState) {
        is Result.Loading -> CircularProgressIndicator()
        is Result.Success -> Text("이름: ${result.data.name}")
        is Result.Error -> Text("오류: ${result.exception.message}")
    }
}
```

### Flow를 produceState로 변환

```kotlin
@Composable
fun LocationTracker(locationProvider: LocationProvider) {
    val location by produceState<Location?>(initialValue = null) {
        locationProvider.locationFlow.collect { newLocation ->
            value = newLocation
        }
    }

    location?.let {
        Text("현재 위치: ${it.latitude}, ${it.longitude}")
    } ?: Text("위치를 가져오는 중...")
}
```

> **참고**: 대부분의 경우 Flow는 `collectAsState()` 또는 `collectAsStateWithLifecycle()`으로 충분합니다. `produceState`는 초기 로딩, 에러 처리 등 추가 로직이 필요할 때 사용합니다.

---

## 8. derivedStateOf — 불필요한 리컴포지션 방지

`derivedStateOf`는 하나 이상의 상태 객체에서 **파생된 상태**를 생성합니다. 원본 상태가 변경될 때만 파생 상태를 재계산하며, 결과가 동일하면 리컴포지션을 트리거하지 않습니다.

### 올바른 사용: 상태에서 파생된 값

```kotlin
@Composable
fun TodoList() {
    val todoItems = remember { mutableStateListOf<TodoItem>() }
    var showCompleted by remember { mutableStateOf(false) }

    // ✅ 올바른 사용: todoItems나 showCompleted가 변경될 때만 재계산
    // 필터링 결과가 같으면 리컴포지션 안 함
    val filteredItems by remember {
        derivedStateOf {
            if (showCompleted) todoItems.toList()
            else todoItems.filter { !it.isCompleted }
        }
    }

    LazyColumn {
        items(filteredItems) { item ->
            TodoItemRow(item)
        }
    }
}
```

### 올바른 사용: 스크롤 위치 기반 UI 변경

```kotlin
@Composable
fun ScrollToTopButton() {
    val listState = rememberLazyListState()

    // ✅ 스크롤 위치가 변할 때마다 리컴포지션하는 것이 아니라,
    // "첫 번째 항목이 보이는지 여부"가 변할 때만 리컴포지션
    val showButton by remember {
        derivedStateOf {
            listState.firstVisibleItemIndex > 0
        }
    }

    Box {
        LazyColumn(state = listState) {
            items(100) { Text("Item $it") }
        }

        if (showButton) {
            FloatingActionButton(
                onClick = { /* 스크롤 */ },
                modifier = Modifier.align(Alignment.BottomEnd)
            ) {
                Icon(Icons.Default.ArrowUpward, "맨 위로")
            }
        }
    }
}
```

### 잘못된 사용: derivedStateOf가 필요 없는 경우

```kotlin
// ❌ 잘못된 예: 단순 변환에 derivedStateOf 사용 (불필요한 오버헤드)
@Composable
fun Greeting(name: String) {
    val greeting by remember(name) {
        derivedStateOf { "안녕하세요, $name!" } // derivedStateOf가 필요 없음
    }
    Text(greeting)
}

// ✅ 올바른 예: 단순 변환은 remember(key)로 충분
@Composable
fun Greeting(name: String) {
    val greeting = remember(name) { "안녕하세요, $name!" }
    Text(greeting)
}
```

### derivedStateOf vs remember(key) 비교

| 상황 | 사용할 API | 이유 |
|------|-----------|------|
| 매개변수에서 파생 | `remember(key)` | 키 변경 시 재계산 |
| Compose State에서 파생 | `derivedStateOf` | State 변경을 관찰하여 재계산 |
| 변경 빈도가 높지만 결과 변경은 드문 경우 | `derivedStateOf` | 결과가 같으면 리컴포지션 방지 |

---

## 9. snapshotFlow — Compose State를 Flow로 변환

`snapshotFlow`는 Compose의 `State<T>` 객체를 Kotlin `Flow`로 변환합니다. 이를 통해 Flow의 연산자(`distinctUntilChanged`, `filter`, `debounce` 등)를 활용할 수 있습니다.

### 기본 사용법

```kotlin
@Composable
fun ScrollPositionLogger(listState: LazyListState) {
    LaunchedEffect(listState) {
        snapshotFlow { listState.firstVisibleItemIndex }
            .distinctUntilChanged() // 값이 실제로 변경될 때만
            .collect { index ->
                println("현재 보이는 첫 번째 아이템: $index")
            }
    }
}
```

### 실전 예제: 무한 스크롤 (페이지네이션)

```kotlin
@Composable
fun InfiniteScrollList(
    items: List<String>,
    onLoadMore: () -> Unit
) {
    val listState = rememberLazyListState()

    // 마지막 아이템 근처에 도달하면 추가 로드
    LaunchedEffect(listState) {
        snapshotFlow {
            val layoutInfo = listState.layoutInfo
            val totalItems = layoutInfo.totalItemsCount
            val lastVisibleItem = layoutInfo.visibleItemsInfo.lastOrNull()?.index ?: 0
            lastVisibleItem >= totalItems - 5 // 마지막 5개 전에 트리거
        }
            .distinctUntilChanged()
            .filter { it } // true일 때만
            .collect {
                onLoadMore()
            }
    }

    LazyColumn(state = listState) {
        items(items) { item ->
            Text(text = item, modifier = Modifier.padding(16.dp))
        }
    }
}
```

### 실전 예제: 검색 debounce

```kotlin
@Composable
fun SearchScreen(onSearch: (String) -> Unit) {
    var query by remember { mutableStateOf("") }

    // 사용자가 타이핑을 멈추고 500ms 후 검색 실행
    LaunchedEffect(Unit) {
        snapshotFlow { query }
            .debounce(500)
            .distinctUntilChanged()
            .filter { it.isNotBlank() }
            .collect { searchQuery ->
                onSearch(searchQuery)
            }
    }

    TextField(
        value = query,
        onValueChange = { query = it },
        placeholder = { Text("검색어 입력...") }
    )
}
```

---

## 10. 효과 선택 가이드

어떤 Effect API를 사용해야 할지 한눈에 파악할 수 있는 가이드입니다.

### 효과 API 비교 테이블

| Effect API | 용도 | 코루틴 | 정리(cleanup) | 실행 시점 |
|-----------|------|:------:|:------:|-----------|
| `LaunchedEffect` | 컴포저블 진입 시 코루틴 실행 | O | 자동 취소 | 컴포지션 진입 시, 키 변경 시 |
| `rememberCoroutineScope` | 이벤트 핸들러에서 코루틴 실행 | O | scope.cancel() | 이벤트 발생 시 |
| `rememberUpdatedState` | 효과 재시작 없이 최신 값 참조 | - | - | 리컴포지션마다 값 업데이트 |
| `DisposableEffect` | 리스너/콜백 등록 + 해제 | X | onDispose 필수 | 컴포지션 진입 시, 키 변경 시 |
| `SideEffect` | Compose → 비-Compose 동기화 | X | 없음 | 매 리컴포지션 성공 시 |
| `produceState` | 비-Compose → Compose State 변환 | O | 자동 취소 | 컴포지션 진입 시, 키 변경 시 |
| `derivedStateOf` | 상태에서 파생된 상태 생성 | - | - | 원본 상태 변경 시 |
| `snapshotFlow` | Compose State → Flow 변환 | - | - | State 변경 시 |

### 선택 플로우차트

```
부수 효과가 필요할 때, 무엇을 쓸까?

1. 코루틴(suspend)이 필요한가?
   ├── Yes → 컴포지션 진입 시 자동 실행?
   │         ├── Yes → LaunchedEffect
   │         └── No (이벤트 핸들러에서) → rememberCoroutineScope
   └── No → 리스너/콜백 등록 + 해제가 필요한가?
            ├── Yes → DisposableEffect
            └── No → 비-Compose 객체와 동기화?
                     ├── Yes → SideEffect
                     └── No → 상태 변환이 필요?
                              ├── 비-Compose → Compose State → produceState
                              ├── Compose State에서 파생 → derivedStateOf
                              └── Compose State → Flow → snapshotFlow
```

### Modifier.onVisibilityChanged() — 가시성 추적의 대안

Compose BOM 2026.02.01에서 추가된 `Modifier.onVisibilityChanged()`를 사용하면, 컴포저블의 화면 가시성 변화를 추적하기 위해 `LaunchedEffect`를 사용하던 패턴을 더 간결하게 대체할 수 있습니다.

```kotlin
// ❌ 기존 방식: LaunchedEffect + 수동 가시성 추적
@Composable
fun TrackVisibility(onVisible: () -> Unit) {
    var isVisible by remember { mutableStateOf(false) }
    LaunchedEffect(isVisible) {
        if (isVisible) onVisible()
    }
    // ... 가시성 감지 로직 구현 필요
}

// ✅ 새로운 방식: Modifier.onVisibilityChanged 활용
@Composable
fun TrackVisibility(onVisible: () -> Unit) {
    Box(
        modifier = Modifier.onVisibilityChanged { visibility ->
            if (visibility.isFullyVisible) onVisible()
        }
    ) {
        // ...
    }
}
```

> **참고**: 모든 가시성 추적 시나리오에 적용 가능한 것은 아닙니다. 화면 진입/이탈 같은 수명주기 기반 추적에는 여전히 `DisposableEffect`와 `LifecycleEventObserver`가 적합합니다.

### 자주 하는 실수

```kotlin
// ❌ 실수 1: 이벤트 핸들러에서 LaunchedEffect 사용 시도
@Composable
fun WrongEventHandler() {
    var shouldNavigate by remember { mutableStateOf(false) }

    // 불필요하게 복잡한 패턴
    if (shouldNavigate) {
        LaunchedEffect(Unit) {
            // navigate...
            shouldNavigate = false
        }
    }

    Button(onClick = { shouldNavigate = true }) {
        Text("이동")
    }
}

// ✅ 올바른 방법: rememberCoroutineScope 또는 직접 콜백
@Composable
fun CorrectEventHandler(onNavigate: () -> Unit) {
    Button(onClick = onNavigate) {
        Text("이동")
    }
}
```

```kotlin
// ❌ 실수 2: DisposableEffect에서 onDispose 누락
// → 컴파일 에러 발생 (Compose가 강제함)

// ❌ 실수 3: LaunchedEffect의 키를 잘못 지정
@Composable
fun WrongKey(userId: String) {
    LaunchedEffect(Unit) { // userId가 변해도 재시작 안 됨!
        loadUserData(userId)
    }
}

// ✅ 올바른 키 지정
@Composable
fun CorrectKey(userId: String) {
    LaunchedEffect(userId) { // userId 변경 시 재시작
        loadUserData(userId)
    }
}
```

---

> **다음 문서**: [04. ViewModel과 Compose 연동](04-viewmodel-integration.md)에서 ViewModel을 활용한 실전 상태 관리 패턴을 알아봅니다.
