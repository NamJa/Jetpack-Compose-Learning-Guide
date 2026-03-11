# ViewModel과 Compose 연동

> "ViewModel은 비즈니스 로직과 화면 수준의 UI 상태를 관리하는 곳이다. 구성 변경에도 살아남으며, Navigation과의 통합을 제공한다."
> — Android 공식 문서

---

## 목차

1. [ViewModel의 역할](#1-viewmodel의-역할)
2. [UI 상태 모델링 — sealed interface로 UiState 정의](#2-ui-상태-모델링--sealed-interface로-uistate-정의)
3. [ViewModel에서 StateFlow 노출](#3-viewmodel에서-stateflow-노출)
4. [Compose에서 collectAsStateWithLifecycle로 관찰](#4-compose에서-collectasstatewithlifecycle로-관찰)
5. [ViewModel 주입 — hiltViewModel과 viewModel](#5-viewmodel-주입--hiltviewmodel과-viewmodel)
6. [이벤트 처리 — 단방향 데이터 흐름 적용](#6-이벤트-처리--단방향-데이터-흐름-적용)
7. [실전 예제: Todo 앱의 ViewModel + Compose 연동](#7-실전-예제-todo-앱의-viewmodel--compose-연동)

---

## 1. ViewModel의 역할

### 상태 관리의 계층 구조

Compose 앱에서 상태는 어디에 둘지에 따라 역할이 나뉩니다.

| 상태 위치 | 역할 | 예시 |
|----------|------|------|
| 컴포저블 내부 (`remember`) | UI 요소 상태 | TextField 입력, 애니메이션 진행 상태 |
| 상태 홀더 클래스 | 복잡한 UI 로직 | 여러 필드의 유효성 검사 |
| **ViewModel** | **비즈니스 로직 + 화면 상태** | 서버에서 데이터 로드, 저장/삭제 처리 |

### ViewModel의 핵심 역할

```
┌─────────────────────────────────────────┐
│                ViewModel                 │
│                                          │
│  ┌──────────────┐  ┌──────────────────┐ │
│  │ 비즈니스 로직  │  │ UI 상태 (UiState) │ │
│  │              │  │                  │ │
│  │ - 데이터 로드  │→│ - Loading        │ │
│  │ - 데이터 저장  │→│ - Success(data)  │ │
│  │ - 삭제, 수정  │→│ - Error(message) │ │
│  └──────────────┘  └──────────────────┘ │
│         ▲                    │           │
│    이벤트 ↑             상태 ↓            │
│         │                    │           │
└─────────┼────────────────────┼───────────┘
          │                    │
    ┌─────┴────────────────────┴─────┐
    │         Composable UI           │
    │  (화면을 그리고, 이벤트를 전달)    │
    └─────────────────────────────────┘
```

### ViewModel이 Compose와 잘 맞는 이유

- **구성 변경에도 살아남음**: 화면 회전 시에도 데이터 유지
- **수명주기가 화면보다 김**: 화면이 재생성되어도 ViewModel은 유지
- **Navigation과 통합**: NavBackStackEntry 수명주기에 바인딩 가능
- **단방향 데이터 흐름(UDF)**: StateFlow를 통해 자연스럽게 UDF 구현

---

## 2. UI 상태 모델링 — sealed interface로 UiState 정의

화면의 모든 가능한 상태를 **sealed interface**(또는 sealed class)로 정의하면, 누락 없이 모든 상태를 처리할 수 있습니다.

### 기본 UiState 패턴

```kotlin
// 화면이 가질 수 있는 모든 상태를 정의
sealed interface HomeUiState {
    data object Loading : HomeUiState
    data class Success(val articles: List<Article>) : HomeUiState
    data class Error(val message: String) : HomeUiState
}

data class Article(
    val id: Long,
    val title: String,
    val content: String,
    val author: String
)
```

### 복합 UiState — 여러 데이터를 포함하는 경우

```kotlin
// 방법 1: data class에 모든 상태를 포함
data class ProfileUiState(
    val isLoading: Boolean = false,
    val user: User? = null,
    val recentPosts: List<Post> = emptyList(),
    val errorMessage: String? = null
)

// 방법 2: 화면의 각 섹션을 독립적으로 관리
data class DashboardUiState(
    val headerState: HeaderState = HeaderState.Loading,
    val feedState: FeedState = FeedState.Loading,
    val sidebarState: SidebarState = SidebarState.Loading
)

sealed interface HeaderState {
    data object Loading : HeaderState
    data class Success(val user: User) : HeaderState
    data class Error(val message: String) : HeaderState
}

sealed interface FeedState {
    data object Loading : FeedState
    data class Success(val posts: List<Post>) : FeedState
    data class Error(val message: String) : FeedState
}
```

### sealed interface vs data class 선택 기준

```kotlin
// ❌ 복잡한 sealed interface: 상태 조합이 많아지면 관리 어려움
sealed interface ComplexUiState {
    data object Loading : ComplexUiState
    data class PartialSuccess(val user: User, val isPostsLoading: Boolean) : ComplexUiState
    data class FullSuccess(val user: User, val posts: List<Post>) : ComplexUiState
    data class UserError(val message: String) : ComplexUiState
    data class PostsError(val user: User, val message: String) : ComplexUiState
    // ... 조합이 폭발적으로 증가
}

// ✅ 간결한 data class: 독립적인 상태를 각각 관리
data class ProfileUiState(
    val isLoading: Boolean = false,
    val user: User? = null,
    val posts: List<Post> = emptyList(),
    val errorMessage: String? = null
)
```

| 패턴 | 적합한 경우 |
|------|-----------|
| `sealed interface` | 상태가 상호 배타적일 때 (Loading OR Success OR Error) |
| `data class` | 여러 상태가 독립적으로 존재할 때 (사용자 정보 + 게시물 목록 + 알림) |

---

## 3. ViewModel에서 StateFlow 노출

ViewModel은 **불변(immutable)** `StateFlow`를 Compose에 노출하고, 내부에서는 `MutableStateFlow`로 상태를 변경합니다.

### 기본 패턴

```kotlin
class ArticleViewModel(
    private val repository: ArticleRepository
) : ViewModel() {

    // 내부: 변경 가능한 MutableStateFlow
    private val _uiState = MutableStateFlow<HomeUiState>(HomeUiState.Loading)

    // 외부: 읽기 전용 StateFlow로 노출
    val uiState: StateFlow<HomeUiState> = _uiState.asStateFlow()

    init {
        loadArticles()
    }

    private fun loadArticles() {
        viewModelScope.launch {
            _uiState.value = HomeUiState.Loading
            try {
                val articles = repository.getArticles()
                _uiState.value = HomeUiState.Success(articles)
            } catch (e: Exception) {
                _uiState.value = HomeUiState.Error(
                    message = e.message ?: "알 수 없는 오류가 발생했습니다"
                )
            }
        }
    }

    fun refresh() {
        loadArticles()
    }
}
```

### stateIn으로 Flow를 StateFlow로 변환

Repository에서 `Flow`를 반환하는 경우, `stateIn`으로 `StateFlow`로 변환합니다.

```kotlin
class ArticleViewModel(
    private val repository: ArticleRepository
) : ViewModel() {

    val uiState: StateFlow<HomeUiState> = repository
        .getArticlesFlow() // Flow<List<Article>>
        .map { articles ->
            HomeUiState.Success(articles) as HomeUiState
        }
        .catch { e ->
            emit(HomeUiState.Error(e.message ?: "오류 발생"))
        }
        .stateIn(
            scope = viewModelScope,
            started = SharingStarted.WhileSubscribed(5_000), // 5초간 구독자 없으면 중단
            initialValue = HomeUiState.Loading
        )
}
```

### WhileSubscribed(5_000)의 의미 (여전히 권장 패턴)

`stateIn`에서 `SharingStarted.WhileSubscribed(5_000)`은 2026년 현재도 **권장 패턴**입니다.

```
앱이 포그라운드에 있음 → 구독 활성 → Flow 수집 중
앱이 백그라운드로 감 → 구독 해제 → 5초 대기
5초 내 포그라운드 복귀 → 기존 캐시된 값 사용 (재로딩 없음)
5초 후에도 백그라운드 → Flow 수집 중단 (리소스 절약)
```

---

## 4. Compose에서 collectAsStateWithLifecycle로 관찰

### collectAsStateWithLifecycle이 권장되는 이유

```kotlin
// ❌ collectAsState: 앱이 백그라운드에 있어도 계속 수집
@Composable
fun ArticleScreen(viewModel: ArticleViewModel) {
    val uiState by viewModel.uiState.collectAsState()
    // 백그라운드에서도 Flow를 수집 → 불필요한 리소스 사용
}

// ✅ collectAsStateWithLifecycle: 수명주기 인식
@Composable
fun ArticleScreen(viewModel: ArticleViewModel) {
    val uiState by viewModel.uiState.collectAsStateWithLifecycle()
    // STARTED 상태일 때만 수집 → 백그라운드에서 자동 중단
}
```

### 의존성 추가

```kotlin
// build.gradle.kts (모듈 수준)
// Compose BOM 2026.02.01 기준
dependencies {
    implementation("androidx.lifecycle:lifecycle-runtime-compose:2.10.0")
}
```

> **Lifecycle 2.10.0 업데이트 사항**:
> - Min SDK가 **API 23**으로 변경되었습니다
> - `collectAsStateWithLifecycle`이 Flow 관찰의 **강력 권장** 방식으로 확정되었습니다
> - `rememberLifecycleOwner` 컴포저블이 추가되어 특정 스코프의 LifecycleOwner를 쉽게 참조할 수 있습니다
> - `CreationExtras` 빌더 함수가 추가되었습니다: `CreationExtras { this[CustomKey] = "value" }`
> - `SavedStateHandle.saved` 델리게이트가 nullable 타입을 지원합니다

### 전체 화면 구성

```kotlin
@Composable
fun ArticleScreen(
    viewModel: ArticleViewModel = hiltViewModel()
) {
    val uiState by viewModel.uiState.collectAsStateWithLifecycle()

    when (val state = uiState) {
        is HomeUiState.Loading -> {
            Box(
                modifier = Modifier.fillMaxSize(),
                contentAlignment = Alignment.Center
            ) {
                CircularProgressIndicator()
            }
        }

        is HomeUiState.Success -> {
            LazyColumn {
                items(
                    items = state.articles,
                    key = { it.id } // 안정적인 키 제공
                ) { article ->
                    ArticleCard(article = article)
                }
            }
        }

        is HomeUiState.Error -> {
            Column(
                modifier = Modifier.fillMaxSize(),
                verticalArrangement = Arrangement.Center,
                horizontalAlignment = Alignment.CenterHorizontally
            ) {
                Text(
                    text = state.message,
                    color = MaterialTheme.colorScheme.error
                )
                Spacer(modifier = Modifier.height(16.dp))
                Button(onClick = { viewModel.refresh() }) {
                    Text("다시 시도")
                }
            }
        }
    }
}
```

---

## 5. ViewModel 주입 — hiltViewModel과 viewModel

### viewModel() — 기본 방식

```kotlin
// build.gradle.kts
// implementation("androidx.lifecycle:lifecycle-viewmodel-compose:2.10.0")

@Composable
fun MyScreen(
    viewModel: MyViewModel = viewModel() // ViewModel 인스턴스 생성/재사용
) {
    // ...
}
```

`viewModel()`은 가장 가까운 `ViewModelStoreOwner`(보통 Activity 또는 NavBackStackEntry)에서 ViewModel을 찾거나 생성합니다.

### hiltViewModel() — Hilt DI 사용 시

```kotlin
// build.gradle.kts
// implementation("androidx.hilt:hilt-navigation-compose:1.2.0")

@HiltViewModel
class ArticleViewModel @Inject constructor(
    private val repository: ArticleRepository,
    private val savedStateHandle: SavedStateHandle
) : ViewModel() {
    // Hilt가 repository를 자동 주입
}

@Composable
fun ArticleScreen(
    viewModel: ArticleViewModel = hiltViewModel() // Hilt가 의존성 주입
) {
    val uiState by viewModel.uiState.collectAsStateWithLifecycle()
    // ...
}
```

### Navigation에서 ViewModel 스코프 지정

```kotlin
// 각 화면별 독립 ViewModel
NavHost(navController, startDestination = "home") {
    composable("home") {
        // 이 화면 고유의 ViewModel
        val viewModel: HomeViewModel = hiltViewModel()
        HomeScreen(viewModel)
    }
    composable("detail/{id}") {
        // 이 화면 고유의 ViewModel
        val viewModel: DetailViewModel = hiltViewModel()
        DetailScreen(viewModel)
    }
}

// 여러 화면에서 ViewModel 공유 (부모 NavGraph 스코프)
NavHost(navController, startDestination = "auth") {
    navigation(startDestination = "login", route = "auth") {
        composable("login") {
            // auth NavGraph 범위의 공유 ViewModel
            val parentEntry = remember(it) {
                navController.getBackStackEntry("auth")
            }
            val sharedViewModel: AuthViewModel = hiltViewModel(parentEntry)
            LoginScreen(sharedViewModel)
        }
        composable("register") {
            val parentEntry = remember(it) {
                navController.getBackStackEntry("auth")
            }
            val sharedViewModel: AuthViewModel = hiltViewModel(parentEntry)
            RegisterScreen(sharedViewModel)
        }
    }
}
```

### Navigation3에서의 ViewModel 스코핑

Lifecycle 2.10.0과 함께 `lifecycle-viewmodel-navigation3` 아티팩트가 추가되었습니다. Navigation3을 사용하는 경우 이를 통해 ViewModel을 네비게이션 그래프에 스코핑할 수 있습니다.

```kotlin
// build.gradle.kts
// implementation("androidx.lifecycle:lifecycle-viewmodel-navigation3:2.10.0")
```

### Type-safe Navigation 인수 — savedStateHandle.toRoute()

타입 안전한 네비게이션 인수를 ViewModel에서 접근할 때 `savedStateHandle.toRoute<Route>()`를 사용할 수 있습니다.

```kotlin
// Route 정의 (타입 안전)
@Serializable
data class DetailRoute(val articleId: Long)

// ViewModel에서 타입 안전하게 인수 접근
@HiltViewModel
class DetailViewModel @Inject constructor(
    savedStateHandle: SavedStateHandle,
    private val repository: ArticleRepository
) : ViewModel() {

    private val route = savedStateHandle.toRoute<DetailRoute>()
    private val articleId = route.articleId

    // ...
}
```

---

## 6. 이벤트 처리 — 단방향 데이터 흐름 적용

### 이벤트를 sealed interface로 정의

```kotlin
// 사용자가 할 수 있는 모든 동작을 정의
sealed interface ArticleEvent {
    data class OnArticleClick(val articleId: Long) : ArticleEvent
    data class OnBookmarkClick(val articleId: Long) : ArticleEvent
    data class OnSearchQueryChange(val query: String) : ArticleEvent
    data object OnRefresh : ArticleEvent
    data object OnRetry : ArticleEvent
}
```

### ViewModel에서 이벤트 처리

```kotlin
@HiltViewModel
class ArticleViewModel @Inject constructor(
    private val repository: ArticleRepository
) : ViewModel() {

    private val _uiState = MutableStateFlow<HomeUiState>(HomeUiState.Loading)
    val uiState: StateFlow<HomeUiState> = _uiState.asStateFlow()

    // 단일 이벤트 처리 함수
    fun onEvent(event: ArticleEvent) {
        when (event) {
            is ArticleEvent.OnArticleClick -> {
                // 네비게이션은 UI 레이어에서 처리
            }
            is ArticleEvent.OnBookmarkClick -> {
                toggleBookmark(event.articleId)
            }
            is ArticleEvent.OnSearchQueryChange -> {
                searchArticles(event.query)
            }
            is ArticleEvent.OnRefresh, is ArticleEvent.OnRetry -> {
                loadArticles()
            }
        }
    }

    private fun toggleBookmark(articleId: Long) {
        viewModelScope.launch {
            repository.toggleBookmark(articleId)
        }
    }

    private fun searchArticles(query: String) {
        viewModelScope.launch {
            val results = repository.search(query)
            _uiState.value = HomeUiState.Success(results)
        }
    }

    private fun loadArticles() {
        viewModelScope.launch {
            _uiState.value = HomeUiState.Loading
            try {
                val articles = repository.getArticles()
                _uiState.value = HomeUiState.Success(articles)
            } catch (e: Exception) {
                _uiState.value = HomeUiState.Error(e.message ?: "오류 발생")
            }
        }
    }
}
```

### Compose에서 이벤트 전달

```kotlin
@Composable
fun ArticleScreen(
    viewModel: ArticleViewModel = hiltViewModel(),
    onNavigateToDetail: (Long) -> Unit
) {
    val uiState by viewModel.uiState.collectAsStateWithLifecycle()

    ArticleContent(
        uiState = uiState,
        onEvent = { event ->
            when (event) {
                is ArticleEvent.OnArticleClick -> {
                    onNavigateToDetail(event.articleId) // 네비게이션은 UI에서
                }
                else -> viewModel.onEvent(event) // 나머지는 ViewModel로
            }
        }
    )
}

// 스테이트리스 UI 컴포저블
@Composable
fun ArticleContent(
    uiState: HomeUiState,
    onEvent: (ArticleEvent) -> Unit
) {
    when (val state = uiState) {
        is HomeUiState.Loading -> LoadingIndicator()
        is HomeUiState.Success -> {
            LazyColumn {
                items(state.articles, key = { it.id }) { article ->
                    ArticleCard(
                        article = article,
                        onClick = {
                            onEvent(ArticleEvent.OnArticleClick(article.id))
                        },
                        onBookmark = {
                            onEvent(ArticleEvent.OnBookmarkClick(article.id))
                        }
                    )
                }
            }
        }
        is HomeUiState.Error -> {
            ErrorContent(
                message = state.message,
                onRetry = { onEvent(ArticleEvent.OnRetry) }
            )
        }
    }
}
```

---

## 7. 실전 예제: Todo 앱의 ViewModel + Compose 연동

지금까지 배운 모든 개념을 적용하여 완전한 Todo 앱을 만들어 봅시다.

### 단계 1: 데이터 모델과 UiState 정의

```kotlin
// 데이터 모델
data class TodoItem(
    val id: Long = System.currentTimeMillis(),
    val title: String,
    val isCompleted: Boolean = false
)

// UI 상태
data class TodoUiState(
    val items: List<TodoItem> = emptyList(),
    val inputText: String = "",
    val filter: TodoFilter = TodoFilter.ALL,
    val isLoading: Boolean = false
) {
    // 파생 상태: 필터링된 아이템 목록
    val filteredItems: List<TodoItem>
        get() = when (filter) {
            TodoFilter.ALL -> items
            TodoFilter.ACTIVE -> items.filter { !it.isCompleted }
            TodoFilter.COMPLETED -> items.filter { it.isCompleted }
        }

    val completedCount: Int
        get() = items.count { it.isCompleted }

    val totalCount: Int
        get() = items.size
}

enum class TodoFilter(val label: String) {
    ALL("전체"),
    ACTIVE("진행 중"),
    COMPLETED("완료됨")
}
```

### 단계 2: 이벤트 정의

```kotlin
sealed interface TodoEvent {
    data class OnInputChange(val text: String) : TodoEvent
    data object OnAddTodo : TodoEvent
    data class OnToggleComplete(val id: Long) : TodoEvent
    data class OnDeleteTodo(val id: Long) : TodoEvent
    data class OnFilterChange(val filter: TodoFilter) : TodoEvent
    data object OnClearCompleted : TodoEvent
}
```

### 단계 3: ViewModel 구현

```kotlin
@HiltViewModel
class TodoViewModel @Inject constructor(
    private val repository: TodoRepository
) : ViewModel() {

    private val _uiState = MutableStateFlow(TodoUiState())
    val uiState: StateFlow<TodoUiState> = _uiState.asStateFlow()

    init {
        loadTodos()
    }

    fun onEvent(event: TodoEvent) {
        when (event) {
            is TodoEvent.OnInputChange -> {
                _uiState.update { it.copy(inputText = event.text) }
            }

            is TodoEvent.OnAddTodo -> {
                addTodo()
            }

            is TodoEvent.OnToggleComplete -> {
                toggleComplete(event.id)
            }

            is TodoEvent.OnDeleteTodo -> {
                deleteTodo(event.id)
            }

            is TodoEvent.OnFilterChange -> {
                _uiState.update { it.copy(filter = event.filter) }
            }

            is TodoEvent.OnClearCompleted -> {
                clearCompleted()
            }
        }
    }

    private fun loadTodos() {
        viewModelScope.launch {
            _uiState.update { it.copy(isLoading = true) }
            try {
                val todos = repository.getAllTodos()
                _uiState.update { it.copy(items = todos, isLoading = false) }
            } catch (e: Exception) {
                _uiState.update { it.copy(isLoading = false) }
            }
        }
    }

    private fun addTodo() {
        val currentText = _uiState.value.inputText.trim()
        if (currentText.isBlank()) return

        viewModelScope.launch {
            val newTodo = TodoItem(title = currentText)
            repository.addTodo(newTodo)
            _uiState.update {
                it.copy(
                    items = it.items + newTodo,
                    inputText = "" // 입력 필드 초기화
                )
            }
        }
    }

    private fun toggleComplete(id: Long) {
        viewModelScope.launch {
            repository.toggleComplete(id)
            _uiState.update { state ->
                state.copy(
                    items = state.items.map { item ->
                        if (item.id == id) item.copy(isCompleted = !item.isCompleted)
                        else item
                    }
                )
            }
        }
    }

    private fun deleteTodo(id: Long) {
        viewModelScope.launch {
            repository.deleteTodo(id)
            _uiState.update { state ->
                state.copy(items = state.items.filter { it.id != id })
            }
        }
    }

    private fun clearCompleted() {
        viewModelScope.launch {
            repository.clearCompleted()
            _uiState.update { state ->
                state.copy(items = state.items.filter { !it.isCompleted })
            }
        }
    }
}
```

### 단계 4: 스테이트리스 UI 구현

```kotlin
@Composable
fun TodoScreen(
    viewModel: TodoViewModel = hiltViewModel()
) {
    val uiState by viewModel.uiState.collectAsStateWithLifecycle()

    TodoContent(
        uiState = uiState,
        onEvent = viewModel::onEvent
    )
}

@Composable
fun TodoContent(
    uiState: TodoUiState,
    onEvent: (TodoEvent) -> Unit
) {
    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("Todo (${uiState.completedCount}/${uiState.totalCount})") }
            )
        }
    ) { paddingValues ->
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(paddingValues)
        ) {
            // 입력 영역
            TodoInputBar(
                inputText = uiState.inputText,
                onInputChange = { onEvent(TodoEvent.OnInputChange(it)) },
                onAddClick = { onEvent(TodoEvent.OnAddTodo) }
            )

            // 필터 탭
            TodoFilterTabs(
                currentFilter = uiState.filter,
                onFilterChange = { onEvent(TodoEvent.OnFilterChange(it)) }
            )

            // 할일 목록
            if (uiState.isLoading) {
                Box(
                    modifier = Modifier.fillMaxSize(),
                    contentAlignment = Alignment.Center
                ) {
                    CircularProgressIndicator()
                }
            } else {
                TodoItemList(
                    items = uiState.filteredItems,
                    onToggleComplete = { onEvent(TodoEvent.OnToggleComplete(it)) },
                    onDelete = { onEvent(TodoEvent.OnDeleteTodo(it)) }
                )
            }

            // 완료 항목 일괄 삭제
            if (uiState.completedCount > 0) {
                TextButton(
                    onClick = { onEvent(TodoEvent.OnClearCompleted) },
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(8.dp)
                ) {
                    Text("완료된 항목 삭제 (${uiState.completedCount}개)")
                }
            }
        }
    }
}
```

### 단계 5: 하위 컴포저블 구현

```kotlin
@Composable
fun TodoInputBar(
    inputText: String,
    onInputChange: (String) -> Unit,
    onAddClick: () -> Unit
) {
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .padding(horizontal = 16.dp, vertical = 8.dp),
        verticalAlignment = Alignment.CenterVertically
    ) {
        OutlinedTextField(
            value = inputText,
            onValueChange = onInputChange,
            placeholder = { Text("새로운 할일 입력") },
            modifier = Modifier.weight(1f),
            singleLine = true,
            keyboardActions = KeyboardActions(
                onDone = { onAddClick() }
            )
        )
        Spacer(modifier = Modifier.width(8.dp))
        Button(
            onClick = onAddClick,
            enabled = inputText.isNotBlank()
        ) {
            Text("추가")
        }
    }
}

@Composable
fun TodoFilterTabs(
    currentFilter: TodoFilter,
    onFilterChange: (TodoFilter) -> Unit
) {
    TabRow(
        selectedTabIndex = currentFilter.ordinal,
        modifier = Modifier.fillMaxWidth()
    ) {
        TodoFilter.entries.forEach { filter ->
            Tab(
                selected = currentFilter == filter,
                onClick = { onFilterChange(filter) },
                text = { Text(filter.label) }
            )
        }
    }
}

@Composable
fun TodoItemList(
    items: List<TodoItem>,
    onToggleComplete: (Long) -> Unit,
    onDelete: (Long) -> Unit
) {
    if (items.isEmpty()) {
        Box(
            modifier = Modifier
                .fillMaxWidth()
                .padding(32.dp),
            contentAlignment = Alignment.Center
        ) {
            Text(
                text = "할일이 없습니다",
                style = MaterialTheme.typography.bodyLarge,
                color = MaterialTheme.colorScheme.onSurfaceVariant
            )
        }
    } else {
        LazyColumn(
            modifier = Modifier.fillMaxWidth()
        ) {
            items(
                items = items,
                key = { it.id } // 안정적인 키로 성능 최적화
            ) { todoItem ->
                TodoItemRow(
                    item = todoItem,
                    onToggleComplete = { onToggleComplete(todoItem.id) },
                    onDelete = { onDelete(todoItem.id) }
                )
            }
        }
    }
}

@Composable
fun TodoItemRow(
    item: TodoItem,
    onToggleComplete: () -> Unit,
    onDelete: () -> Unit
) {
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .clickable(onClick = onToggleComplete)
            .padding(horizontal = 16.dp, vertical = 12.dp),
        verticalAlignment = Alignment.CenterVertically
    ) {
        Checkbox(
            checked = item.isCompleted,
            onCheckedChange = { onToggleComplete() }
        )
        Text(
            text = item.title,
            modifier = Modifier.weight(1f),
            style = MaterialTheme.typography.bodyLarge,
            textDecoration = if (item.isCompleted) {
                TextDecoration.LineThrough
            } else {
                TextDecoration.None
            },
            color = if (item.isCompleted) {
                MaterialTheme.colorScheme.onSurfaceVariant
            } else {
                MaterialTheme.colorScheme.onSurface
            }
        )
        IconButton(onClick = onDelete) {
            Icon(
                imageVector = Icons.Default.Delete,
                contentDescription = "삭제",
                tint = MaterialTheme.colorScheme.error
            )
        }
    }
}
```

### 전체 아키텍처 요약

```
┌─ TodoScreen (스테이트풀 - ViewModel 연결) ─────────────────┐
│                                                            │
│  viewModel.uiState ──→ collectAsStateWithLifecycle()       │
│  viewModel::onEvent ──→ TodoContent에 전달                  │
│                                                            │
├─ TodoContent (스테이트리스 - 순수 UI) ────────────────────────┤
│  │                                                         │
│  ├── TodoInputBar     (입력: inputText, onInputChange)     │
│  ├── TodoFilterTabs   (필터: currentFilter, onFilterChange) │
│  ├── TodoItemList     (목록: filteredItems)                  │
│  │   └── TodoItemRow  (항목: item, onToggle, onDelete)     │
│  └── TextButton       (일괄 삭제: onClearCompleted)         │
│                                                            │
├─ TodoViewModel (비즈니스 로직) ──────────────────────────────┤
│  │                                                         │
│  ├── _uiState: MutableStateFlow<TodoUiState>               │
│  ├── onEvent(event: TodoEvent)                             │
│  └── loadTodos / addTodo / toggleComplete / deleteTodo     │
│                                                            │
├─ 데이터 흐름 ───────────────────────────────────────────────┤
│                                                            │
│  상태 ↓ : ViewModel → TodoScreen → TodoContent → TodoItem  │
│  이벤트 ↑: TodoItem → TodoContent → TodoScreen → ViewModel │
│                                                            │
└────────────────────────────────────────────────────────────┘
```

> **핵심 포인트**: TodoContent를 포함한 모든 하위 컴포저블은 **스테이트리스**입니다. ViewModel에 대해 전혀 모르며, 순수하게 매개변수로 전달받은 데이터를 표시하고 이벤트 콜백을 호출합니다. 이 구조 덕분에 테스트, 미리보기, 재사용이 모두 쉬워집니다.

---

> **Phase 4 완료!** 상태 관리는 Compose에서 가장 중요한 개념입니다. `remember`/`rememberSaveable`로 UI 상태를 관리하고, 상태 호이스팅으로 컴포넌트를 재사용 가능하게 만들고, Side Effect API로 부수 효과를 안전하게 처리하고, ViewModel로 비즈니스 로직을 분리하는 패턴을 익혀두세요.
>
> **다음 Phase**: [Phase 5: 내비게이션](../phase-05-navigation/01-navigation-basics.md)에서 화면 간 이동과 인수 전달을 배웁니다.
