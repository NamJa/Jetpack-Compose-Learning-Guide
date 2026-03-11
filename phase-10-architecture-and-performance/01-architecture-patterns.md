# Compose 아키텍처 패턴

> **"좋은 아키텍처는 변경을 쉽게 만든다. 나쁜 아키텍처는 모든 변경을 두렵게 만든다."**
>
> 앱이 커질수록 체계적인 구조가 필요합니다.
> 이 문서에서는 Compose 앱의 아키텍처 패턴을 단계별로 배우고, 유지보수하기 좋은 코드를 작성하는 방법을 알아봅니다.

---

## 목차

1. [MVVM 패턴과 Compose](#1-mvvm-패턴과-compose)
2. [단방향 데이터 흐름(UDF)](#2-단방향-데이터-흐름udf)
3. [UI Layer: Screen → ViewModel → UiState](#3-ui-layer-screen--viewmodel--uistate)
4. [Domain Layer: UseCase](#4-domain-layer-usecase)
5. [Data Layer: Repository → DataSource](#5-data-layer-repository--datasource)
6. [UI 상태 모델링: sealed interface UiState](#6-ui-상태-모델링-sealed-interface-uistate)
7. [이벤트 처리: sealed class UiEvent](#7-이벤트-처리-sealed-class-uievent)
8. [매개변수 설계: 최소 정보 전달 원칙](#8-매개변수-설계-최소-정보-전달-원칙)
9. [실전: 간단한 메모 앱 아키텍처 예제](#9-실전-간단한-메모-앱-아키텍처-예제)
10. [Compose 아키텍처 레이어링](#10-compose-아키텍처-레이어링)
11. [정리](#11-정리)

---

## 1. MVVM 패턴과 Compose

MVVM(Model-View-ViewModel)은 Android 공식 권장 아키텍처 패턴입니다. Compose와 가장 자연스럽게 어울립니다.

### MVVM의 각 역할

```
┌─────────────────────────────────────────────────────┐
│                    MVVM 패턴                          │
│                                                     │
│  ┌──────────┐    ┌──────────────┐    ┌───────────┐  │
│  │  Model   │ ←─ │  ViewModel   │ ←─ │   View    │  │
│  │ (데이터)  │ ─→ │ (상태 관리)   │ ─→ │  (화면)    │  │
│  └──────────┘    └──────────────┘    └───────────┘  │
│                                                     │
│  Model: 데이터와 비즈니스 로직                         │
│  ViewModel: UI 상태를 관리하고 Model과 View를 연결      │
│  View: 화면을 그림 (Compose에서는 @Composable 함수)     │
└─────────────────────────────────────────────────────┘
```

### Compose에서의 MVVM

```kotlin
// ── Model (데이터) ──
data class Task(
    val id: Long,
    val title: String,
    val isCompleted: Boolean = false
)

// ── ViewModel (상태 관리) ──
class TaskViewModel(
    private val repository: TaskRepository
) : ViewModel() {

    private val _uiState = MutableStateFlow(TaskUiState())
    val uiState: StateFlow<TaskUiState> = _uiState.asStateFlow()

    init {
        loadTasks()
    }

    private fun loadTasks() {
        viewModelScope.launch {
            _uiState.update { it.copy(isLoading = true) }
            try {
                val tasks = repository.getTasks()
                _uiState.update {
                    it.copy(isLoading = false, tasks = tasks)
                }
            } catch (e: Exception) {
                _uiState.update {
                    it.copy(isLoading = false, error = e.message)
                }
            }
        }
    }

    fun toggleTask(taskId: Long) {
        viewModelScope.launch {
            repository.toggleTask(taskId)
            loadTasks()  // 목록 갱신
        }
    }
}

// ── View (화면 = Composable) ──
@Composable
fun TaskScreen(
    viewModel: TaskViewModel = viewModel()
) {
    val uiState by viewModel.uiState.collectAsStateWithLifecycle()

    TaskContent(
        uiState = uiState,
        onToggleTask = viewModel::toggleTask
    )
}

// 상태를 받아 표시만 하는 순수 UI 컴포저블
@Composable
fun TaskContent(
    uiState: TaskUiState,
    onToggleTask: (Long) -> Unit
) {
    if (uiState.isLoading) {
        CircularProgressIndicator()
    } else {
        LazyColumn {
            items(uiState.tasks, key = { it.id }) { task ->
                TaskItem(
                    task = task,
                    onToggle = { onToggleTask(task.id) }
                )
            }
        }
    }
}
```

---

## 2. 단방향 데이터 흐름(UDF)

단방향 데이터 흐름(Unidirectional Data Flow)은 **상태는 위에서 아래로, 이벤트는 아래에서 위로** 흐르는 패턴입니다.

### UDF 다이어그램

```
┌─────────────────────────────────────────────────────┐
│           단방향 데이터 흐름 (UDF)                      │
│                                                     │
│                 ┌──────────┐                         │
│                 │ViewModel │                         │
│                 └────┬─────┘                         │
│            상태(State) ↓   ↑ 이벤트(Event)             │
│                 ┌────┴─────┐                         │
│                 │  Screen  │                         │
│                 └────┬─────┘                         │
│            상태(State) ↓   ↑ 이벤트(Event)             │
│                 ┌────┴─────┐                         │
│                 │Component │                         │
│                 └──────────┘                         │
│                                                     │
│  상태 ↓ : UiState 객체가 위에서 아래로 전달             │
│  이벤트 ↑ : 사용자 동작이 콜백으로 위에서 처리됨          │
└─────────────────────────────────────────────────────┘
```

### UDF의 장점

| 장점 | 설명 |
|------|------|
| **예측 가능성** | 상태 변경이 한 곳(ViewModel)에서만 발생 |
| **디버깅 용이** | 상태 흐름을 추적하기 쉬움 |
| **테스트 용이** | 상태와 이벤트를 독립적으로 테스트 가능 |
| **일관성** | 모든 UI가 같은 상태를 기반으로 렌더링 |

### UDF 실전 예시

```kotlin
// ❌ 잘못된 예: 양방향 데이터 흐름
@Composable
fun BadSearchScreen() {
    var query by remember { mutableStateOf("") }
    var results by remember { mutableStateOf<List<Item>>(emptyList()) }
    var isLoading by remember { mutableStateOf(false) }

    // 상태가 여기저기 흩어져 있음
    LaunchedEffect(query) {
        isLoading = true
        results = searchApi(query)  // 컴포저블에서 직접 API 호출!
        isLoading = false
    }
    // ...
}

// ✅ 올바른 예: 단방향 데이터 흐름
// ViewModel
class SearchViewModel(
    private val searchRepository: SearchRepository
) : ViewModel() {

    private val _uiState = MutableStateFlow(SearchUiState())
    val uiState: StateFlow<SearchUiState> = _uiState.asStateFlow()

    fun onQueryChange(query: String) {
        _uiState.update { it.copy(query = query) }
    }

    fun onSearch() {
        viewModelScope.launch {
            _uiState.update { it.copy(isLoading = true) }
            val results = searchRepository.search(_uiState.value.query)
            _uiState.update {
                it.copy(isLoading = false, results = results)
            }
        }
    }
}

// Screen — 상태를 받아 표시만 함
@Composable
fun SearchScreen(viewModel: SearchViewModel = viewModel()) {
    val uiState by viewModel.uiState.collectAsStateWithLifecycle()

    SearchContent(
        uiState = uiState,
        onQueryChange = viewModel::onQueryChange,
        onSearch = viewModel::onSearch
    )
}

@Composable
fun SearchContent(
    uiState: SearchUiState,
    onQueryChange: (String) -> Unit,
    onSearch: () -> Unit
) {
    Column {
        SearchBar(
            query = uiState.query,
            onQueryChange = onQueryChange,
            onSearch = onSearch
        )
        if (uiState.isLoading) {
            CircularProgressIndicator()
        } else {
            SearchResults(results = uiState.results)
        }
    }
}
```

---

## 3. UI Layer: Screen → ViewModel → UiState

> **2026 업데이트 (Lifecycle 2.10.0 / Navigation 2.9.7)**
>
> - `rememberLifecycleOwner`를 사용하면 Compose 트리 내에서 스코프된 생명주기를 직접 다룰 수 있습니다.
> - `lifecycle-viewmodel-navigation3` 아티팩트가 추가되어, Navigation3에서 ViewModel 스코핑이 가능합니다.
> - `savedStateHandle.toRoute<Route>()`를 통해 타입 안전한 내비게이션 인수 추출이 가능합니다.
> - `CreationExtras` 빌더 함수 문법으로 ViewModel 팩토리를 더 간결하게 작성할 수 있습니다.

### Lifecycle 2.10.0: rememberLifecycleOwner

```kotlin
// Compose 트리 내에서 스코프된 LifecycleOwner 사용
@Composable
fun ScopedScreen() {
    val lifecycleOwner = rememberLifecycleOwner()

    // 이 LifecycleOwner는 해당 Composition의 생명주기에 연동됩니다.
    DisposableEffect(lifecycleOwner) {
        val observer = LifecycleEventObserver { _, event ->
            when (event) {
                Lifecycle.Event.ON_RESUME -> { /* 화면 활성화 */ }
                Lifecycle.Event.ON_PAUSE -> { /* 화면 비활성화 */ }
                else -> {}
            }
        }
        lifecycleOwner.lifecycle.addObserver(observer)
        onDispose { lifecycleOwner.lifecycle.removeObserver(observer) }
    }
}
```

### 타입 안전한 Navigation 인수: savedStateHandle.toRoute()

```kotlin
// Navigation 경로를 @Serializable data class로 정의
@Serializable
data class DetailRoute(val taskId: Long)

@HiltViewModel
class DetailViewModel @Inject constructor(
    savedStateHandle: SavedStateHandle,
    private val taskRepository: TaskRepository
) : ViewModel() {

    // 타입 안전하게 Navigation 인수를 추출
    private val route = savedStateHandle.toRoute<DetailRoute>()
    private val taskId: Long = route.taskId

    // ...
}
```

### CreationExtras 빌더 함수

```kotlin
// CreationExtras 빌더 함수로 ViewModel 팩토리를 간결하게 작성
val factory = viewModelFactory {
    initializer {
        val repository = TaskRepositoryImpl(get(ApplicationContext))
        TaskViewModel(repository)
    }
}

// Composable에서 사용
@Composable
fun TaskScreen(
    viewModel: TaskViewModel = viewModel(factory = factory)
) {
    // ...
}
```

UI Layer는 사용자에게 보이는 모든 것을 담당합니다.

### UI Layer 구조

```
┌─────────────────────────────────────────────────────┐
│                    UI Layer                          │
│                                                     │
│  ┌─────────────┐                                    │
│  │   Screen     │ ← ViewModel을 알고 있는 컴포저블    │
│  │ (Stateful)   │   collectAsStateWithLifecycle()    │
│  └──────┬──────┘                                    │
│         │ UiState ↓  Event ↑                        │
│  ┌──────┴──────┐                                    │
│  │  Content     │ ← 순수 UI 컴포저블 (ViewModel 모름) │
│  │ (Stateless)  │   Preview, 테스트 용이              │
│  └──────┬──────┘                                    │
│         │ 데이터 ↓  콜백 ↑                            │
│  ┌──────┴──────┐                                    │
│  │ Components   │ ← 재사용 가능한 작은 컴포저블         │
│  │ (Stateless)  │                                   │
│  └─────────────┘                                    │
└─────────────────────────────────────────────────────┘
```

### 실전 코드

```kotlin
// ── UiState 정의 ──
data class ProfileUiState(
    val user: User? = null,
    val posts: List<Post> = emptyList(),
    val isLoading: Boolean = false,
    val error: String? = null
)

// ── ViewModel ──
class ProfileViewModel(
    private val userRepository: UserRepository,
    private val postRepository: PostRepository
) : ViewModel() {

    private val _uiState = MutableStateFlow(ProfileUiState())
    val uiState: StateFlow<ProfileUiState> = _uiState.asStateFlow()

    fun loadProfile(userId: String) {
        viewModelScope.launch {
            _uiState.update { it.copy(isLoading = true, error = null) }
            try {
                val user = userRepository.getUser(userId)
                val posts = postRepository.getUserPosts(userId)
                _uiState.update {
                    it.copy(user = user, posts = posts, isLoading = false)
                }
            } catch (e: Exception) {
                _uiState.update {
                    it.copy(error = e.message, isLoading = false)
                }
            }
        }
    }
}

// ── Screen (Stateful) — ViewModel과 연결 ──
@Composable
fun ProfileScreen(
    userId: String,
    viewModel: ProfileViewModel = viewModel()
) {
    val uiState by viewModel.uiState.collectAsStateWithLifecycle()

    LaunchedEffect(userId) {
        viewModel.loadProfile(userId)
    }

    ProfileContent(uiState = uiState)
}

// ── Content (Stateless) — 순수 UI ──
@Composable
fun ProfileContent(uiState: ProfileUiState) {
    when {
        uiState.isLoading -> LoadingScreen()
        uiState.error != null -> ErrorScreen(message = uiState.error!!)
        uiState.user != null -> {
            Column {
                ProfileHeader(user = uiState.user!!)
                PostList(posts = uiState.posts)
            }
        }
    }
}

// ── Component (재사용 가능) ──
@Composable
fun ProfileHeader(user: User) {
    Row(modifier = Modifier.padding(16.dp)) {
        AsyncImage(model = user.avatarUrl, contentDescription = null)
        Column(modifier = Modifier.padding(start = 16.dp)) {
            Text(user.name, style = MaterialTheme.typography.titleLarge)
            Text(user.email, style = MaterialTheme.typography.bodyMedium)
        }
    }
}
```

---

## 4. Domain Layer: UseCase

Domain Layer는 **비즈니스 로직을 캡슐화**합니다. 필수가 아닌 선택 레이어이지만, 복잡한 비즈니스 로직이 있을 때 유용합니다.

### UseCase 패턴

```
┌─────────────────────────────────────────────────────┐
│  ViewModel이 Repository를 직접 호출하면?               │
│                                                     │
│  ViewModel에 비즈니스 로직이 쌓임:                     │
│    - 데이터 가공                                     │
│    - 여러 Repository 조합                             │
│    - 유효성 검증                                      │
│    → ViewModel이 비대해짐!                            │
│                                                     │
│  UseCase를 사이에 두면:                               │
│                                                     │
│  ViewModel → UseCase → Repository                    │
│               ↑                                     │
│        비즈니스 로직이                                 │
│        여기에 집중됨                                   │
└─────────────────────────────────────────────────────┘
```

### UseCase 구현

```kotlin
// UseCase: 하나의 비즈니스 작업을 수행
class GetFilteredTasksUseCase(
    private val taskRepository: TaskRepository
) {
    // invoke 연산자로 함수처럼 호출 가능
    suspend operator fun invoke(
        filter: TaskFilter
    ): List<Task> {
        val allTasks = taskRepository.getAllTasks()

        return when (filter) {
            TaskFilter.ALL -> allTasks
            TaskFilter.ACTIVE -> allTasks.filter { !it.isCompleted }
            TaskFilter.COMPLETED -> allTasks.filter { it.isCompleted }
        }
            .sortedByDescending { it.createdAt }  // 최신순 정렬
    }
}

class ToggleTaskUseCase(
    private val taskRepository: TaskRepository
) {
    suspend operator fun invoke(taskId: Long) {
        val task = taskRepository.getTask(taskId)
            ?: throw IllegalArgumentException("Task not found: $taskId")
        taskRepository.updateTask(task.copy(isCompleted = !task.isCompleted))
    }
}

// ViewModel에서 UseCase 사용
class TaskViewModel(
    private val getFilteredTasks: GetFilteredTasksUseCase,
    private val toggleTask: ToggleTaskUseCase
) : ViewModel() {

    private val _uiState = MutableStateFlow(TaskUiState())
    val uiState: StateFlow<TaskUiState> = _uiState.asStateFlow()

    fun loadTasks(filter: TaskFilter = TaskFilter.ALL) {
        viewModelScope.launch {
            _uiState.update { it.copy(isLoading = true) }
            try {
                val tasks = getFilteredTasks(filter)  // UseCase를 함수처럼 호출
                _uiState.update { it.copy(tasks = tasks, isLoading = false) }
            } catch (e: Exception) {
                _uiState.update { it.copy(error = e.message, isLoading = false) }
            }
        }
    }

    fun onToggleTask(taskId: Long) {
        viewModelScope.launch {
            toggleTask(taskId)
            loadTasks(_uiState.value.currentFilter)
        }
    }
}
```

### UseCase를 사용해야 하는 경우

```
UseCase 필요:
  ✓ 여러 Repository의 데이터를 조합해야 할 때
  ✓ 복잡한 비즈니스 규칙이 있을 때
  ✓ 같은 로직을 여러 ViewModel에서 재사용할 때

UseCase 불필요:
  ✗ 단순히 Repository 메서드를 호출만 할 때
  ✗ 앱이 작고 단순할 때
  ✗ 추가 로직 없이 데이터를 전달만 할 때
```

---

## 5. Data Layer: Repository → DataSource

Data Layer는 앱의 **데이터를 관리**합니다. Repository 패턴으로 데이터 출처를 추상화합니다.

### Data Layer 구조

```
┌─────────────────────────────────────────────────────┐
│                    Data Layer                        │
│                                                     │
│  ┌──────────────────┐                               │
│  │    Repository     │ ← 데이터 소스를 추상화          │
│  │   (인터페이스)     │   캐싱, 동기화 전략 결정        │
│  └────────┬─────────┘                               │
│           │                                         │
│     ┌─────┴──────┐                                  │
│     ↓            ↓                                  │
│  ┌──────┐  ┌──────────┐                             │
│  │Local │  │  Remote   │                             │
│  │ Data │  │   Data    │                             │
│  │Source│  │  Source    │                             │
│  │(Room)│  │(Retrofit) │                             │
│  └──────┘  └──────────┘                             │
└─────────────────────────────────────────────────────┘
```

### Repository 구현

```kotlin
// Repository 인터페이스
interface TaskRepository {
    fun getTasksStream(): Flow<List<Task>>
    suspend fun getTask(id: Long): Task?
    suspend fun addTask(task: Task)
    suspend fun updateTask(task: Task)
    suspend fun deleteTask(id: Long)
}

// Repository 구현 — 로컬 + 원격 데이터 소스 조합
class DefaultTaskRepository(
    private val localDataSource: TaskLocalDataSource,
    private val remoteDataSource: TaskRemoteDataSource
) : TaskRepository {

    override fun getTasksStream(): Flow<List<Task>> {
        return localDataSource.getTasksStream()
    }

    override suspend fun getTask(id: Long): Task? {
        return localDataSource.getTask(id)
    }

    override suspend fun addTask(task: Task) {
        localDataSource.insertTask(task)
        try {
            remoteDataSource.createTask(task)  // 서버에도 동기화
        } catch (e: Exception) {
            // 오프라인이면 나중에 동기화 (선택적)
        }
    }

    override suspend fun updateTask(task: Task) {
        localDataSource.updateTask(task)
        try {
            remoteDataSource.updateTask(task)
        } catch (e: Exception) {
            // 오프라인 처리
        }
    }

    override suspend fun deleteTask(id: Long) {
        localDataSource.deleteTask(id)
        try {
            remoteDataSource.deleteTask(id)
        } catch (e: Exception) {
            // 오프라인 처리
        }
    }
}
```

### DataSource 구현

```kotlin
// Local DataSource (Room)
class TaskLocalDataSource(private val taskDao: TaskDao) {
    fun getTasksStream(): Flow<List<Task>> = taskDao.observeAll()
    suspend fun getTask(id: Long): Task? = taskDao.getById(id)
    suspend fun insertTask(task: Task) = taskDao.insert(task)
    suspend fun updateTask(task: Task) = taskDao.update(task)
    suspend fun deleteTask(id: Long) = taskDao.deleteById(id)
}

// Remote DataSource (Retrofit)
class TaskRemoteDataSource(private val apiService: TaskApiService) {
    suspend fun fetchTasks(): List<Task> = apiService.getTasks()
    suspend fun createTask(task: Task) = apiService.createTask(task)
    suspend fun updateTask(task: Task) = apiService.updateTask(task.id, task)
    suspend fun deleteTask(id: Long) = apiService.deleteTask(id)
}
```

---

## 6. UI 상태 모델링: sealed interface UiState

### 왜 sealed interface를 사용하는가?

```kotlin
// ❌ 잘못된 예: 개별 변수로 상태 관리
class TaskViewModel : ViewModel() {
    var tasks = mutableStateListOf<Task>()
    var isLoading = mutableStateOf(false)
    var error = mutableStateOf<String?>(null)

    // 문제: isLoading = true인데 error도 있을 수 있음
    // 불가능한 상태 조합이 존재!
}

// ✅ 올바른 예: sealed interface로 상태를 명확히 구분
sealed interface TaskUiState {
    data object Loading : TaskUiState
    data class Success(val tasks: List<Task>) : TaskUiState
    data class Error(val message: String) : TaskUiState
}
```

### sealed interface UiState 패턴

```kotlin
// 화면의 모든 가능한 상태를 정의
sealed interface NoteListUiState {
    data object Loading : NoteListUiState

    data class Success(
        val notes: List<Note>,
        val selectedFilter: NoteFilter = NoteFilter.ALL,
        val searchQuery: String = ""
    ) : NoteListUiState

    data class Error(
        val message: String,
        val retryAction: (() -> Unit)? = null
    ) : NoteListUiState
}

// ViewModel에서 상태 발행
class NoteListViewModel(
    private val noteRepository: NoteRepository
) : ViewModel() {

    private val _uiState = MutableStateFlow<NoteListUiState>(NoteListUiState.Loading)
    val uiState: StateFlow<NoteListUiState> = _uiState.asStateFlow()

    init {
        loadNotes()
    }

    private fun loadNotes() {
        viewModelScope.launch {
            _uiState.value = NoteListUiState.Loading
            try {
                val notes = noteRepository.getAllNotes()
                _uiState.value = NoteListUiState.Success(notes = notes)
            } catch (e: Exception) {
                _uiState.value = NoteListUiState.Error(
                    message = e.message ?: "알 수 없는 오류",
                    retryAction = { loadNotes() }
                )
            }
        }
    }
}

// 컴포저블에서 상태에 따라 UI 분기
@Composable
fun NoteListContent(uiState: NoteListUiState) {
    when (uiState) {
        is NoteListUiState.Loading -> {
            Box(modifier = Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                CircularProgressIndicator()
            }
        }
        is NoteListUiState.Success -> {
            if (uiState.notes.isEmpty()) {
                EmptyState(message = "메모가 없습니다")
            } else {
                NoteGrid(notes = uiState.notes)
            }
        }
        is NoteListUiState.Error -> {
            ErrorState(
                message = uiState.message,
                onRetry = uiState.retryAction
            )
        }
    }
}
```

### data class vs sealed interface 선택 기준

```
화면에 상태 그룹이 명확히 나뉘는가?
  (Loading / Success / Error 등)

  예 → sealed interface 사용
  ┌──────────────────────────────┐
  │ sealed interface UiState     │
  │   Loading                    │
  │   Success(data)              │
  │   Error(message)             │
  └──────────────────────────────┘

  아니오 → data class 사용 (상태가 연속적일 때)
  ┌──────────────────────────────┐
  │ data class FormUiState(      │
  │   val name: String,          │
  │   val email: String,         │
  │   val isSubmitting: Boolean, │
  │   val errors: Map<...>       │
  │ )                            │
  └──────────────────────────────┘
```

---

## 7. 이벤트 처리: sealed class UiEvent

### 이벤트 모델링

```kotlin
// 사용자 동작을 이벤트로 정의
sealed class NoteListEvent {
    data class OnSearchQueryChange(val query: String) : NoteListEvent()
    data class OnFilterChange(val filter: NoteFilter) : NoteListEvent()
    data class OnNoteClick(val noteId: Long) : NoteListEvent()
    data class OnNoteDelete(val noteId: Long) : NoteListEvent()
    data object OnAddNoteClick : NoteListEvent()
    data object OnRefresh : NoteListEvent()
}
```

### ViewModel에서 이벤트 처리

```kotlin
class NoteListViewModel(
    private val noteRepository: NoteRepository
) : ViewModel() {

    private val _uiState = MutableStateFlow<NoteListUiState>(NoteListUiState.Loading)
    val uiState: StateFlow<NoteListUiState> = _uiState.asStateFlow()

    // 단일 이벤트 처리 함수
    fun onEvent(event: NoteListEvent) {
        when (event) {
            is NoteListEvent.OnSearchQueryChange -> updateSearchQuery(event.query)
            is NoteListEvent.OnFilterChange -> updateFilter(event.filter)
            is NoteListEvent.OnNoteClick -> { /* Navigation 처리 */ }
            is NoteListEvent.OnNoteDelete -> deleteNote(event.noteId)
            is NoteListEvent.OnAddNoteClick -> { /* Navigation 처리 */ }
            is NoteListEvent.OnRefresh -> loadNotes()
        }
    }

    private fun updateSearchQuery(query: String) {
        val currentState = _uiState.value
        if (currentState is NoteListUiState.Success) {
            _uiState.value = currentState.copy(searchQuery = query)
        }
    }

    private fun deleteNote(noteId: Long) {
        viewModelScope.launch {
            noteRepository.deleteNote(noteId)
            loadNotes()
        }
    }

    // ...
}
```

### 컴포저블에서 이벤트 전달

```kotlin
@Composable
fun NoteListScreen(
    viewModel: NoteListViewModel = viewModel(),
    onNavigateToDetail: (Long) -> Unit,
    onNavigateToAdd: () -> Unit
) {
    val uiState by viewModel.uiState.collectAsStateWithLifecycle()

    NoteListContent(
        uiState = uiState,
        onEvent = { event ->
            when (event) {
                is NoteListEvent.OnNoteClick -> onNavigateToDetail(event.noteId)
                is NoteListEvent.OnAddNoteClick -> onNavigateToAdd()
                else -> viewModel.onEvent(event)  // 나머지는 ViewModel로
            }
        }
    )
}

@Composable
fun NoteListContent(
    uiState: NoteListUiState,
    onEvent: (NoteListEvent) -> Unit
) {
    Scaffold(
        floatingActionButton = {
            FloatingActionButton(onClick = { onEvent(NoteListEvent.OnAddNoteClick) }) {
                Icon(Icons.Default.Add, contentDescription = "메모 추가")
            }
        }
    ) { padding ->
        // ... onEvent를 통해 모든 이벤트 전달
    }
}
```

---

## 8. 매개변수 설계: 최소 정보 전달 원칙

컴포저블에 필요한 **최소한의 정보만 전달**하면 리컴포지션 범위를 줄이고 재사용성을 높일 수 있습니다.

### 최소 정보 전달 원칙

```kotlin
// ❌ 잘못된 예: 객체 전체를 전달
@Composable
fun UserAvatar(user: User) {
    // user.name, user.email 등이 바뀌면
    // avatarUrl만 사용하는데도 리컴포지션 발생!
    AsyncImage(
        model = user.avatarUrl,
        contentDescription = "${user.name}의 프로필"
    )
}

// ✅ 올바른 예: 필요한 정보만 전달
@Composable
fun UserAvatar(
    avatarUrl: String,
    userName: String
) {
    // avatarUrl이나 userName이 바뀔 때만 리컴포지션
    AsyncImage(
        model = avatarUrl,
        contentDescription = "${userName}의 프로필"
    )
}
```

### 콜백 함수 설계

```kotlin
// ❌ 잘못된 예: 불필요한 정보를 콜백으로 전달
@Composable
fun TaskItem(
    task: Task,
    onTaskAction: (Task, String) -> Unit  // 어떤 액션인지 문자열로?
) {
    Button(onClick = { onTaskAction(task, "toggle") }) {
        Text(task.title)
    }
}

// ✅ 올바른 예: 명확한 콜백 분리
@Composable
fun TaskItem(
    title: String,
    isCompleted: Boolean,
    onToggle: () -> Unit,     // 토글 콜백
    onDelete: () -> Unit,     // 삭제 콜백
    onClick: () -> Unit       // 클릭 콜백
) {
    Row(
        modifier = Modifier.clickable(onClick = onClick)
    ) {
        Checkbox(checked = isCompleted, onCheckedChange = { onToggle() })
        Text(title, modifier = Modifier.weight(1f))
        IconButton(onClick = onDelete) {
            Icon(Icons.Default.Delete, contentDescription = "삭제")
        }
    }
}
```

### 호출하는 쪽

```kotlin
// 필요한 데이터만 추출해서 전달
LazyColumn {
    items(tasks, key = { it.id }) { task ->
        TaskItem(
            title = task.title,
            isCompleted = task.isCompleted,
            onToggle = { viewModel.toggleTask(task.id) },
            onDelete = { viewModel.deleteTask(task.id) },
            onClick = { onNavigateToDetail(task.id) }
        )
    }
}
```

---

## 9. 실전: 간단한 메모 앱 아키텍처 예제

전체 아키텍처를 하나의 예제로 통합합니다.

### 프로젝트 구조

```
app/src/main/java/com/example/memo/
├── data/
│   ├── local/
│   │   ├── MemoDao.kt
│   │   ├── MemoDatabase.kt
│   │   └── MemoEntity.kt
│   └── repository/
│       └── MemoRepositoryImpl.kt
├── domain/
│   ├── model/
│   │   └── Memo.kt
│   ├── repository/
│   │   └── MemoRepository.kt
│   └── usecase/
│       ├── GetMemosUseCase.kt
│       ├── AddMemoUseCase.kt
│       └── DeleteMemoUseCase.kt
└── ui/
    ├── list/
    │   ├── MemoListScreen.kt
    │   ├── MemoListUiState.kt
    │   ├── MemoListEvent.kt
    │   └── MemoListViewModel.kt
    ├── detail/
    │   ├── MemoDetailScreen.kt
    │   └── MemoDetailViewModel.kt
    ├── components/
    │   ├── MemoCard.kt
    │   └── EmptyState.kt
    ├── navigation/
    │   └── MemoNavGraph.kt
    └── theme/
        └── Theme.kt
```

### 도메인 모델

```kotlin
// domain/model/Memo.kt
data class Memo(
    val id: Long = 0,
    val title: String,
    val content: String,
    val createdAt: Long = System.currentTimeMillis(),
    val color: Int = 0xFFFFFF
)
```

### Repository

```kotlin
// domain/repository/MemoRepository.kt
interface MemoRepository {
    fun getMemosStream(): Flow<List<Memo>>
    suspend fun getMemo(id: Long): Memo?
    suspend fun addMemo(memo: Memo)
    suspend fun deleteMemo(id: Long)
}

// data/repository/MemoRepositoryImpl.kt
class MemoRepositoryImpl(
    private val memoDao: MemoDao
) : MemoRepository {
    override fun getMemosStream(): Flow<List<Memo>> {
        return memoDao.observeAll().map { entities ->
            entities.map { it.toDomain() }
        }
    }

    override suspend fun getMemo(id: Long): Memo? {
        return memoDao.getById(id)?.toDomain()
    }

    override suspend fun addMemo(memo: Memo) {
        memoDao.insert(memo.toEntity())
    }

    override suspend fun deleteMemo(id: Long) {
        memoDao.deleteById(id)
    }
}
```

### ViewModel과 UiState

```kotlin
// ui/list/MemoListUiState.kt
sealed interface MemoListUiState {
    data object Loading : MemoListUiState
    data class Success(val memos: List<Memo>) : MemoListUiState
    data class Error(val message: String) : MemoListUiState
}

// ui/list/MemoListEvent.kt
sealed class MemoListEvent {
    data class OnMemoClick(val memoId: Long) : MemoListEvent()
    data class OnMemoDelete(val memoId: Long) : MemoListEvent()
    data object OnAddMemoClick : MemoListEvent()
}

// ui/list/MemoListViewModel.kt
class MemoListViewModel(
    private val getMemosUseCase: GetMemosUseCase,
    private val deleteMemoUseCase: DeleteMemoUseCase
) : ViewModel() {

    val uiState: StateFlow<MemoListUiState> = getMemosUseCase()
        .map<List<Memo>, MemoListUiState> { memos ->
            MemoListUiState.Success(memos)
        }
        .catch { e ->
            emit(MemoListUiState.Error(e.message ?: "오류 발생"))
        }
        .stateIn(
            scope = viewModelScope,
            started = SharingStarted.WhileSubscribed(5_000),
            initialValue = MemoListUiState.Loading
        )

    fun onEvent(event: MemoListEvent) {
        when (event) {
            is MemoListEvent.OnMemoDelete -> deleteMemo(event.memoId)
            else -> { /* Navigation은 Screen에서 처리 */ }
        }
    }

    private fun deleteMemo(memoId: Long) {
        viewModelScope.launch {
            deleteMemoUseCase(memoId)
        }
    }
}
```

### Screen과 Content

```kotlin
// ui/list/MemoListScreen.kt
@Composable
fun MemoListScreen(
    viewModel: MemoListViewModel = viewModel(),
    onNavigateToDetail: (Long) -> Unit,
    onNavigateToAdd: () -> Unit
) {
    val uiState by viewModel.uiState.collectAsStateWithLifecycle()

    MemoListContent(
        uiState = uiState,
        onEvent = { event ->
            when (event) {
                is MemoListEvent.OnMemoClick -> onNavigateToDetail(event.memoId)
                is MemoListEvent.OnAddMemoClick -> onNavigateToAdd()
                else -> viewModel.onEvent(event)
            }
        }
    )
}

@Composable
fun MemoListContent(
    uiState: MemoListUiState,
    onEvent: (MemoListEvent) -> Unit
) {
    Scaffold(
        topBar = {
            TopAppBar(title = { Text("내 메모") })
        },
        floatingActionButton = {
            FloatingActionButton(onClick = { onEvent(MemoListEvent.OnAddMemoClick) }) {
                Icon(Icons.Default.Add, contentDescription = "메모 추가")
            }
        }
    ) { padding ->
        when (uiState) {
            is MemoListUiState.Loading -> {
                Box(
                    modifier = Modifier.fillMaxSize().padding(padding),
                    contentAlignment = Alignment.Center
                ) {
                    CircularProgressIndicator()
                }
            }
            is MemoListUiState.Success -> {
                if (uiState.memos.isEmpty()) {
                    EmptyState(
                        message = "아직 메모가 없어요.\n첫 번째 메모를 작성해보세요!",
                        modifier = Modifier.fillMaxSize().padding(padding)
                    )
                } else {
                    LazyColumn(
                        contentPadding = padding,
                        verticalArrangement = Arrangement.spacedBy(8.dp),
                        modifier = Modifier.padding(horizontal = 16.dp)
                    ) {
                        items(uiState.memos, key = { it.id }) { memo ->
                            MemoCard(
                                title = memo.title,
                                content = memo.content,
                                onClick = { onEvent(MemoListEvent.OnMemoClick(memo.id)) },
                                onDelete = { onEvent(MemoListEvent.OnMemoDelete(memo.id)) }
                            )
                        }
                    }
                }
            }
            is MemoListUiState.Error -> {
                ErrorState(
                    message = uiState.message,
                    modifier = Modifier.fillMaxSize().padding(padding)
                )
            }
        }
    }
}
```

---

## 10. Compose 아키텍처 레이어링

Compose 자체도 여러 레이어로 구성되어 있습니다. 각 레이어를 이해하면 더 효과적으로 활용할 수 있습니다.

### Compose 레이어 구조

```
┌─────────────────────────────────────────────────────┐
│              Compose 레이어 구조                       │
│                                                     │
│  ┌─────────────────────────────────────┐             │
│  │         Material 3                  │  ← 최상위   │
│  │  Button, TextField, Scaffold, ...   │   머티리얼   │
│  │  Material Theme, Typography         │   컴포넌트   │
│  ├─────────────────────────────────────┤             │
│  │         Foundation                  │  ← 기반     │
│  │  LazyColumn, Canvas, Shape, ...     │   레이아웃   │
│  │  Clickable, Scrollable, Draggable   │   + 제스처   │
│  ├─────────────────────────────────────┤             │
│  │         UI                          │  ← 핵심 UI  │
│  │  Modifier, Layout, draw, ...        │   시스템     │
│  │  측정, 배치, 그리기 시스템            │              │
│  ├─────────────────────────────────────┤             │
│  │         Runtime                     │  ← 엔진     │
│  │  remember, mutableStateOf, ...      │   상태 관리  │
│  │  Composition, Recomposition         │   + 트리     │
│  └─────────────────────────────────────┘             │
└─────────────────────────────────────────────────────┘
```

### 각 레이어의 역할

| 레이어 | 패키지 | 역할 | 예시 |
|--------|--------|------|------|
| **Runtime** | `compose.runtime` | 상태 관리, 컴포지션 트리 | `remember`, `mutableStateOf`, `@Composable` |
| **UI** | `compose.ui` | 레이아웃 시스템, Modifier | `Layout`, `Modifier`, `draw`, `measure` |
| **Foundation** | `compose.foundation` | 기본 컴포넌트, 제스처 | `LazyColumn`, `Canvas`, `clickable` |
| **Material** | `compose.material3` | 머티리얼 디자인 컴포넌트 | `Button`, `TextField`, `Scaffold` |

### 레이어를 이해해야 하는 이유

```kotlin
// Material의 Button이 마음에 안 들면?
// → Foundation 레이어에서 직접 구현 가능!

@Composable
fun CustomButton(
    onClick: () -> Unit,
    modifier: Modifier = Modifier,
    content: @Composable () -> Unit
) {
    // Foundation 레이어의 clickable + UI 레이어의 Modifier
    Box(
        modifier = modifier
            .clip(RoundedCornerShape(12.dp))
            .background(Color(0xFF6200EE))
            .clickable(onClick = onClick)
            .padding(horizontal = 24.dp, vertical = 12.dp),
        contentAlignment = Alignment.Center
    ) {
        content()
    }
}

// 더 낮은 수준의 커스터마이징이 필요하면?
// → UI 레이어의 Layout 직접 사용
@Composable
fun CustomLayout(
    modifier: Modifier = Modifier,
    content: @Composable () -> Unit
) {
    Layout(
        content = content,
        modifier = modifier
    ) { measurables, constraints ->
        // 직접 측정과 배치를 제어
        val placeables = measurables.map { it.measure(constraints) }
        layout(constraints.maxWidth, constraints.maxHeight) {
            placeables.forEach { it.place(0, 0) }
        }
    }
}
```

---

## 11. 정리

### 아키텍처 핵심 요약

```
┌─────────────────────────────────────────────────────┐
│           Android 앱 아키텍처 전체 구조                 │
│                                                     │
│  UI Layer                                           │
│  ┌─────────────────────────────────────┐            │
│  │ Screen (Stateful)                   │            │
│  │   ↕ collectAsStateWithLifecycle()   │            │
│  │ ViewModel → UiState                 │            │
│  │   ↕ onEvent()                       │            │
│  │ Content (Stateless)                 │            │
│  └─────────────────────────────────────┘            │
│              ↕                                      │
│  Domain Layer (선택)                                 │
│  ┌─────────────────────────────────────┐            │
│  │ UseCase (비즈니스 로직)               │            │
│  └─────────────────────────────────────┘            │
│              ↕                                      │
│  Data Layer                                         │
│  ┌─────────────────────────────────────┐            │
│  │ Repository                          │            │
│  │   ├── LocalDataSource (Room)        │            │
│  │   └── RemoteDataSource (Retrofit)   │            │
│  └─────────────────────────────────────┘            │
└─────────────────────────────────────────────────────┘
```

### 다음 단계

아키텍처 패턴을 이해했다면, 다음 문서에서 성능 최적화를 배워봅니다:

- Compose의 3단계 (Composition, Layout, Drawing)
- 안정성(Stability)과 스킵 가능성(Skippability) — Strong Skipping Mode가 기본 활성화
- 상태 읽기 연기와 derivedStateOf
- Baseline Profiles

> **참고**: 이 문서의 예제는 Kotlin 2.3.10, Compose BOM 2026.02.01, Lifecycle 2.10.0, Navigation 2.9.7 기준입니다.
