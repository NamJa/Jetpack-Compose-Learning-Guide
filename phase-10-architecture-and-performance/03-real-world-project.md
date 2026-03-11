# 실전 프로젝트 설계

> **"이론을 많이 알아도, 결국 제품을 만들어봐야 진짜 실력이 된다."**
>
> 지금까지 배운 모든 것을 하나로 엮어 실전 프로젝트를 설계하는 방법을 알아봅니다.
> 프로젝트 구조, 라이브러리 선택, 테스트 전략, 배포까지 현업에서 바로 적용할 수 있는 가이드입니다.

---

## 목차

1. [프로젝트 구조: feature 기반 모듈화](#1-프로젝트-구조-feature-기반-모듈화)
2. [추천 라이브러리 (2026 기준)](#2-추천-라이브러리-2026-기준)
3. [Compose + Navigation + ViewModel 통합 패턴](#3-compose--navigation--viewmodel-통합-패턴)
4. [멀티 모듈 프로젝트에서의 Compose](#4-멀티-모듈-프로젝트에서의-compose)
5. [에러 처리 전략](#5-에러-처리-전략)
6. [빌드 최적화: Compose BOM, 종속성 관리](#6-빌드-최적화-compose-bom-종속성-관리)
7. [XML View와 Compose 공존 (마이그레이션 전략)](#7-xml-view와-compose-공존-마이그레이션-전략)
8. [테스트 전략: 단위 → 통합 → E2E](#8-테스트-전략-단위--통합--e2e)
9. [배포와 CI/CD 기초](#9-배포와-cicd-기초)
10. [정리](#10-정리)

---

## 1. 프로젝트 구조: feature 기반 모듈화

### 왜 모듈화가 필요한가?

```
앱이 커지면 생기는 문제:
  - 빌드 시간 증가 (전체 코드를 매번 컴파일)
  - 코드 경계 불분명 (아무 패키지에서나 아무 클래스 참조)
  - 팀 협업 어려움 (파일 충돌, 의존성 꼬임)
  - 테스트 범위 불분명

모듈화의 장점:
  ✓ 병렬 빌드로 빌드 시간 단축
  ✓ 명확한 코드 경계 (모듈 간 의존성 명시)
  ✓ 독립적인 개발과 테스트
  ✓ 코드 재사용 용이
```

### feature 기반 모듈 구조

```
my-app/
├── app/                          ← 앱 진입점 (Application, MainActivity)
│   └── src/main/java/.../
│       ├── MyApplication.kt
│       ├── MainActivity.kt
│       └── navigation/
│           └── AppNavGraph.kt
│
├── core/                         ← 공통 모듈들
│   ├── core-ui/                  ← 공통 UI 컴포넌트, 테마
│   │   └── src/main/java/.../
│   │       ├── theme/
│   │       │   ├── Theme.kt
│   │       │   ├── Color.kt
│   │       │   └── Type.kt
│   │       └── components/
│   │           ├── LoadingScreen.kt
│   │           ├── ErrorScreen.kt
│   │           └── EmptyState.kt
│   │
│   ├── core-data/                ← 데이터 레이어 공통
│   │   └── src/main/java/.../
│   │       ├── database/
│   │       │   └── AppDatabase.kt
│   │       ├── network/
│   │       │   ├── ApiService.kt
│   │       │   └── NetworkModule.kt
│   │       └── datastore/
│   │           └── UserPreferences.kt
│   │
│   ├── core-domain/              ← 도메인 레이어 공통
│   │   └── src/main/java/.../
│   │       └── model/
│   │           └── Result.kt
│   │
│   └── core-testing/             ← 테스트 유틸
│       └── src/main/java/.../
│           ├── FakeRepository.kt
│           └── TestDispatcherRule.kt
│
├── feature/                      ← 기능별 모듈
│   ├── feature-home/
│   │   └── src/main/java/.../
│   │       ├── HomeScreen.kt
│   │       ├── HomeViewModel.kt
│   │       ├── HomeUiState.kt
│   │       └── navigation/
│   │           └── HomeNavigation.kt
│   │
│   ├── feature-search/
│   │   └── src/main/java/.../
│   │       ├── SearchScreen.kt
│   │       ├── SearchViewModel.kt
│   │       └── navigation/
│   │           └── SearchNavigation.kt
│   │
│   └── feature-settings/
│       └── src/main/java/.../
│           ├── SettingsScreen.kt
│           ├── SettingsViewModel.kt
│           └── navigation/
│               └── SettingsNavigation.kt
│
├── build.gradle.kts
├── settings.gradle.kts
└── gradle/
    └── libs.versions.toml        ← 버전 카탈로그
```

### 모듈 간 의존성

```
┌─────────────────────────────────────────────────────┐
│              모듈 의존성 다이어그램                      │
│                                                     │
│                    ┌─────┐                           │
│                    │ app │                           │
│                    └──┬──┘                           │
│            ┌──────────┼──────────┐                   │
│            ↓          ↓          ↓                   │
│     ┌──────────┐ ┌─────────┐ ┌──────────┐          │
│     │ feature- │ │feature- │ │ feature- │          │
│     │  home    │ │ search  │ │ settings │          │
│     └────┬─────┘ └────┬────┘ └────┬─────┘          │
│          │            │           │                  │
│          └──────┬─────┴───────────┘                  │
│                 ↓                                    │
│          ┌──────────┐                               │
│          │  core-*   │ (core-ui, core-data, ...)    │
│          └──────────┘                               │
│                                                     │
│  규칙:                                              │
│  - feature 모듈끼리는 서로 의존하지 않음               │
│  - feature → core만 의존                             │
│  - app은 모든 feature를 알고 있음 (Navigation)        │
└─────────────────────────────────────────────────────┘
```

---

## 2. 추천 라이브러리 (2026 기준)

### 핵심 라이브러리 조합

| 카테고리 | 라이브러리 | 용도 |
|---------|-----------|------|
| **DI (의존성 주입)** | Hilt | Google 공식, Dagger 기반 |
| **DI (경량)** | Koin | 간단한 설정, 학습 쉬움 |
| **네트워크** | Retrofit | REST API 호출 (가장 널리 사용) |
| **네트워크** | Ktor Client | Kotlin 퍼스트, 멀티플랫폼 지원 |
| **로컬 DB** | Room | SQLite 추상화, Flow 지원 |
| **이미지 로딩** | Coil | Compose 네이티브 지원, 경량 |
| **설정 저장** | DataStore | SharedPreferences 대체 |
| **직렬화** | Kotlin Serialization | Kotlin 공식, 타입 안전 |
| **비동기** | Kotlin Coroutines + Flow | Kotlin 공식 |
| **내비게이션** | Navigation Compose | Jetpack 공식 |
| **적응형 내비게이션** | material3-adaptive-navigation-suite | 화면 크기별 자동 전환 |
| **적응형 레이아웃** | material3-adaptive | 태블릿 멀티 패널 |
| **불변 컬렉션** | kotlinx-collections-immutable | Compose 안정성 |

### Hilt 설정 (DI)

```kotlin [compose-playground]
// build.gradle.kts (Project)
plugins {
    id("com.google.dagger.hilt.android") version "2.54" apply false
    id("com.google.devtools.ksp") version "2.3.10-1.0.31" apply false
}

// build.gradle.kts (Module :app)
plugins {
    id("com.google.dagger.hilt.android")
    id("com.google.devtools.ksp")
}

dependencies {
    implementation("com.google.dagger:hilt-android:2.54")
    ksp("com.google.dagger:hilt-compiler:2.54")
    implementation("androidx.hilt:hilt-navigation-compose:1.2.0")
}
```

```kotlin [compose-playground]
// Application
@HiltAndroidApp
class MyApplication : Application()

// ViewModel에 Hilt 주입
@HiltViewModel
class HomeViewModel @Inject constructor(
    private val taskRepository: TaskRepository
) : ViewModel() { /* ... */ }

// 컴포저블에서 사용
@Composable
fun HomeScreen(
    viewModel: HomeViewModel = hiltViewModel()
) {
    val uiState by viewModel.uiState.collectAsStateWithLifecycle()
    // ...
}
```

### Coil 설정 (이미지 로딩)

```kotlin [compose-playground]
// build.gradle.kts
dependencies {
    implementation("io.coil-kt.coil3:coil-compose:3.1.0")
    implementation("io.coil-kt.coil3:coil-network-okhttp:3.1.0")
}
```

```kotlin [compose-playground]
// Compose에서 이미지 로딩
@Composable
fun UserAvatar(imageUrl: String) {
    AsyncImage(
        model = imageUrl,
        contentDescription = "프로필 사진",
        modifier = Modifier
            .size(48.dp)
            .clip(CircleShape),
        contentScale = ContentScale.Crop,
        placeholder = painterResource(R.drawable.placeholder),
        error = painterResource(R.drawable.error_image)
    )
}
```

### Room 설정 (로컬 DB)

```kotlin [compose-playground]
// build.gradle.kts
dependencies {
    implementation("androidx.room:room-runtime:2.7.1")
    implementation("androidx.room:room-ktx:2.7.1")  // 코루틴 + Flow
    ksp("androidx.room:room-compiler:2.7.1")
}
```

```kotlin [compose-playground]
// Entity
@Entity(tableName = "tasks")
data class TaskEntity(
    @PrimaryKey(autoGenerate = true) val id: Long = 0,
    val title: String,
    val isCompleted: Boolean = false,
    val createdAt: Long = System.currentTimeMillis()
)

// DAO
@Dao
interface TaskDao {
    @Query("SELECT * FROM tasks ORDER BY createdAt DESC")
    fun observeAll(): Flow<List<TaskEntity>>

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insert(task: TaskEntity)

    @Update
    suspend fun update(task: TaskEntity)

    @Query("DELETE FROM tasks WHERE id = :id")
    suspend fun deleteById(id: Long)
}

// Database
@Database(entities = [TaskEntity::class], version = 1)
abstract class AppDatabase : RoomDatabase() {
    abstract fun taskDao(): TaskDao
}
```

### DataStore 설정 (설정 저장)

```kotlin [compose-playground]
// build.gradle.kts
dependencies {
    implementation("androidx.datastore:datastore-preferences:1.1.4")
}
```

```kotlin [compose-playground]
// Preferences DataStore
val Context.dataStore by preferencesDataStore(name = "settings")

class UserPreferences(private val dataStore: DataStore<Preferences>) {

    val isDarkMode: Flow<Boolean> = dataStore.data.map { prefs ->
        prefs[DARK_MODE_KEY] ?: false
    }

    suspend fun setDarkMode(enabled: Boolean) {
        dataStore.edit { prefs ->
            prefs[DARK_MODE_KEY] = enabled
        }
    }

    companion object {
        private val DARK_MODE_KEY = booleanPreferencesKey("dark_mode")
    }
}
```

---

## 3. Compose + Navigation + ViewModel 통합 패턴

### Navigation 그래프 설계 (Type-Safe Routes — Navigation 2.9.7)

```kotlin [compose-playground]
// 각 feature 모듈에서 @Serializable 라우트 정의
// feature-home/navigation/HomeNavigation.kt
@Serializable object HomeRoute

fun NavGraphBuilder.homeScreen(
    onNavigateToDetail: (Long) -> Unit
) {
    composable<HomeRoute> {
        HomeScreen(onNavigateToDetail = onNavigateToDetail)
    }
}

fun NavController.navigateToHome() {
    navigate(HomeRoute) {
        popUpTo(graph.findStartDestination().id) {
            saveState = true
        }
        launchSingleTop = true
        restoreState = true
    }
}

// feature-detail/navigation/DetailNavigation.kt
@Serializable data class DetailRoute(val taskId: Long)

fun NavGraphBuilder.detailScreen(
    onNavigateBack: () -> Unit
) {
    composable<DetailRoute> {
        DetailScreen(onNavigateBack = onNavigateBack)
    }
}

fun NavController.navigateToDetail(taskId: Long) {
    navigate(DetailRoute(taskId))
}
```

### 앱 수준 Navigation 통합

```kotlin [compose-playground]
// app/navigation/AppNavGraph.kt
@Composable
fun AppNavGraph(
    navController: NavHostController = rememberNavController()
) {
    Scaffold(
        bottomBar = {
            BottomNavigationBar(navController = navController)
        }
    ) { padding ->
        NavHost(
            navController = navController,
            startDestination = HomeRoute,
            modifier = Modifier.padding(padding)
        ) {
            // 각 feature의 Navigation 등록
            homeScreen(
                onNavigateToDetail = { taskId ->
                    navController.navigateToDetail(taskId)
                }
            )
            detailScreen(
                onNavigateBack = { navController.popBackStack() }
            )
            searchScreen()
            settingsScreen()
        }
    }
}
```

### ViewModel에서 Navigation 인수 받기

```kotlin [compose-playground]
// Hilt + SavedStateHandle로 Navigation 인수 받기
@HiltViewModel
class DetailViewModel @Inject constructor(
    savedStateHandle: SavedStateHandle,
    private val taskRepository: TaskRepository
) : ViewModel() {

    // Navigation 인수 자동 추출
    private val taskId: Long = checkNotNull(savedStateHandle["taskId"])

    private val _uiState = MutableStateFlow<DetailUiState>(DetailUiState.Loading)
    val uiState: StateFlow<DetailUiState> = _uiState.asStateFlow()

    init {
        loadTask()
    }

    private fun loadTask() {
        viewModelScope.launch {
            try {
                val task = taskRepository.getTask(taskId)
                _uiState.value = if (task != null) {
                    DetailUiState.Success(task)
                } else {
                    DetailUiState.Error("할 일을 찾을 수 없습니다")
                }
            } catch (e: Exception) {
                _uiState.value = DetailUiState.Error(e.message ?: "오류 발생")
            }
        }
    }
}
```

---

## 4. 멀티 모듈 프로젝트에서의 Compose

### settings.gradle.kts

```kotlin [compose-playground]
// settings.gradle.kts
pluginManagement {
    repositories {
        google()
        mavenCentral()
        gradlePluginPortal()
    }
}

dependencyResolutionManagement {
    repositoriesMode.set(RepositoriesMode.FAIL_ON_PROJECT_REPOS)
    repositories {
        google()
        mavenCentral()
    }
}

rootProject.name = "MyApp"

include(":app")
include(":core:core-ui")
include(":core:core-data")
include(":core:core-domain")
include(":core:core-testing")
include(":feature:feature-home")
include(":feature:feature-search")
include(":feature:feature-settings")
```

### 공통 빌드 설정 (Convention Plugin)

```kotlin [compose-playground]
// build-logic/convention/src/main/kotlin/AndroidComposeConvention.kt
// 모든 Compose 모듈에 공통 설정을 적용하는 플러그인
class AndroidComposeConventionPlugin : Plugin<Project> {
    override fun apply(target: Project) {
        with(target) {
            with(pluginManager) {
                apply("org.jetbrains.kotlin.plugin.compose")
            }

            extensions.configure<LibraryExtension> {
                buildFeatures {
                    compose = true
                }
            }

            dependencies {
                val bom = platform("androidx.compose:compose-bom:2026.02.01")
                "implementation"(bom)
                "implementation"("androidx.compose.ui:ui")
                "implementation"("androidx.compose.material3:material3")
                "implementation"("androidx.compose.ui:ui-tooling-preview")
                "debugImplementation"("androidx.compose.ui:ui-tooling")
            }
        }
    }
}
```

### feature 모듈 build.gradle.kts 예시

```kotlin [compose-playground]
// feature/feature-home/build.gradle.kts
plugins {
    id("myapp.android.library")     // 커스텀 Convention Plugin
    id("myapp.android.compose")     // Compose 공통 설정
    id("myapp.android.hilt")        // Hilt 공통 설정
}

android {
    namespace = "com.example.feature.home"
}

dependencies {
    implementation(project(":core:core-ui"))
    implementation(project(":core:core-domain"))
    implementation(project(":core:core-data"))

    testImplementation(project(":core:core-testing"))
    androidTestImplementation(project(":core:core-testing"))
}
```

---

## 5. 에러 처리 전략

### Result 래퍼 클래스

```kotlin [compose-playground]
// core-domain/model/Result.kt
sealed interface Result<out T> {
    data class Success<T>(val data: T) : Result<T>
    data class Error(val exception: Throwable) : Result<Nothing>
}

// 확장 함수
fun <T> Result<T>.getOrNull(): T? = when (this) {
    is Result.Success -> data
    is Result.Error -> null
}

fun <T> Result<T>.getOrDefault(default: T): T = when (this) {
    is Result.Success -> data
    is Result.Error -> default
}

fun <T, R> Result<T>.map(transform: (T) -> R): Result<R> = when (this) {
    is Result.Success -> Result.Success(transform(data))
    is Result.Error -> this
}
```

### Repository에서 Result 반환

```kotlin [compose-playground]
class TaskRepositoryImpl(
    private val taskDao: TaskDao,
    private val apiService: TaskApiService
) : TaskRepository {

    override suspend fun getTasks(): Result<List<Task>> {
        return try {
            val tasks = taskDao.getAll().map { it.toDomain() }
            Result.Success(tasks)
        } catch (e: Exception) {
            Result.Error(e)
        }
    }

    override suspend fun syncTasks(): Result<Unit> {
        return try {
            val remoteTasks = apiService.getTasks()
            taskDao.insertAll(remoteTasks.map { it.toEntity() })
            Result.Success(Unit)
        } catch (e: IOException) {
            Result.Error(NetworkException("네트워크 연결을 확인해주세요", e))
        } catch (e: HttpException) {
            Result.Error(ServerException("서버 오류가 발생했습니다 (${e.code()})", e))
        }
    }
}
```

### ViewModel에서 에러 처리

```kotlin [compose-playground]
@HiltViewModel
class HomeViewModel @Inject constructor(
    private val taskRepository: TaskRepository
) : ViewModel() {

    private val _uiState = MutableStateFlow<HomeUiState>(HomeUiState.Loading)
    val uiState: StateFlow<HomeUiState> = _uiState.asStateFlow()

    // 일회성 이벤트 (스낵바, 토스트 등)
    private val _snackbarEvent = MutableSharedFlow<String>()
    val snackbarEvent: SharedFlow<String> = _snackbarEvent.asSharedFlow()

    fun loadTasks() {
        viewModelScope.launch {
            _uiState.value = HomeUiState.Loading

            when (val result = taskRepository.getTasks()) {
                is Result.Success -> {
                    _uiState.value = HomeUiState.Success(tasks = result.data)
                }
                is Result.Error -> {
                    val message = when (result.exception) {
                        is NetworkException -> "인터넷 연결을 확인해주세요"
                        is ServerException -> "서버에 문제가 발생했습니다"
                        else -> "알 수 없는 오류가 발생했습니다"
                    }
                    _uiState.value = HomeUiState.Error(message)
                }
            }
        }
    }

    fun deleteTask(taskId: Long) {
        viewModelScope.launch {
            when (val result = taskRepository.deleteTask(taskId)) {
                is Result.Success -> {
                    _snackbarEvent.emit("할 일이 삭제되었습니다")
                    loadTasks()
                }
                is Result.Error -> {
                    _snackbarEvent.emit("삭제에 실패했습니다")
                }
            }
        }
    }
}
```

### 컴포저블에서 일회성 이벤트 처리

```kotlin [compose-playground]
@Composable
fun HomeScreen(viewModel: HomeViewModel = hiltViewModel()) {
    val uiState by viewModel.uiState.collectAsStateWithLifecycle()
    val snackbarHostState = remember { SnackbarHostState() }

    // 일회성 이벤트 수집
    LaunchedEffect(Unit) {
        viewModel.snackbarEvent.collect { message ->
            snackbarHostState.showSnackbar(message)
        }
    }

    Scaffold(
        snackbarHost = { SnackbarHost(snackbarHostState) }
    ) { padding ->
        HomeContent(
            uiState = uiState,
            modifier = Modifier.padding(padding),
            onDeleteTask = viewModel::deleteTask,
            onRetry = viewModel::loadTasks
        )
    }
}
```

---

## 6. 빌드 최적화: Compose BOM, 종속성 관리

> **2026 주의**: Lifecycle 2.10.0부터 **Min SDK가 API 23 (Android 6.0)**으로 상향되었습니다. 새 프로젝트에서는 `minSdk = 23` 이상으로 설정하세요. JVM 타겟은 `"17"`을 사용합니다.

### Compose BOM (Bill of Materials)

BOM을 사용하면 **모든 Compose 라이브러리의 버전을 하나로 통합 관리**합니다.

```kotlin [compose-playground]
// build.gradle.kts
dependencies {
    val composeBom = platform("androidx.compose:compose-bom:2026.02.01")
    implementation(composeBom)
    androidTestImplementation(composeBom)

    // 버전 명시 불필요! BOM이 관리
    implementation("androidx.compose.ui:ui")
    implementation("androidx.compose.material3:material3")
    implementation("androidx.compose.ui:ui-tooling-preview")
    // Material Icons는 더 이상 권장되지 않음 → Material Symbols 사용 권장
    // implementation("androidx.compose.material:material-icons-extended")

    debugImplementation("androidx.compose.ui:ui-tooling")
    debugImplementation("androidx.compose.ui:ui-test-manifest")

    androidTestImplementation("androidx.compose.ui:ui-test-junit4")
}
```

### Version Catalog (libs.versions.toml)

```toml
# gradle/libs.versions.toml
[versions]
agp = "8.9.0"
kotlin = "2.3.10"
compose-bom = "2026.02.01"
hilt = "2.54"
room = "2.7.1"
coil = "3.1.0"
ktor = "3.1.0"
navigation = "2.9.7"
lifecycle = "2.10.0"
ksp = "2.3.10-1.0.31"

[libraries]
# Compose
compose-bom = { module = "androidx.compose:compose-bom", version.ref = "compose-bom" }
compose-ui = { module = "androidx.compose.ui:ui" }
compose-material3 = { module = "androidx.compose.material3:material3" }
compose-ui-tooling = { module = "androidx.compose.ui:ui-tooling" }
compose-ui-tooling-preview = { module = "androidx.compose.ui:ui-tooling-preview" }
compose-ui-test-junit4 = { module = "androidx.compose.ui:ui-test-junit4" }
compose-ui-test-manifest = { module = "androidx.compose.ui:ui-test-manifest" }

# Navigation
navigation-compose = { module = "androidx.navigation:navigation-compose", version.ref = "navigation" }

# Lifecycle
lifecycle-runtime-compose = { module = "androidx.lifecycle:lifecycle-runtime-compose", version.ref = "lifecycle" }
lifecycle-viewmodel-compose = { module = "androidx.lifecycle:lifecycle-viewmodel-compose", version.ref = "lifecycle" }

# Hilt
hilt-android = { module = "com.google.dagger:hilt-android", version.ref = "hilt" }
hilt-compiler = { module = "com.google.dagger:hilt-compiler", version.ref = "hilt" }
hilt-navigation-compose = { module = "androidx.hilt:hilt-navigation-compose", version = "1.2.0" }

# Room
room-runtime = { module = "androidx.room:room-runtime", version.ref = "room" }
room-ktx = { module = "androidx.room:room-ktx", version.ref = "room" }
room-compiler = { module = "androidx.room:room-compiler", version.ref = "room" }

# Coil
coil-compose = { module = "io.coil-kt.coil3:coil-compose", version.ref = "coil" }

# Adaptive (Material3)
material3-adaptive-navigation-suite = { module = "androidx.compose.material3:material3-adaptive-navigation-suite" }

[bundles]
compose = ["compose-ui", "compose-material3", "compose-ui-tooling-preview"]
compose-debug = ["compose-ui-tooling", "compose-ui-test-manifest"]

[plugins]
android-application = { id = "com.android.application", version.ref = "agp" }
kotlin-android = { id = "org.jetbrains.kotlin.android", version.ref = "kotlin" }
kotlin-compose = { id = "org.jetbrains.kotlin.plugin.compose", version.ref = "kotlin" }
hilt = { id = "com.google.dagger.hilt.android", version.ref = "hilt" }
ksp = { id = "com.google.devtools.ksp", version.ref = "ksp" }
```

```kotlin [compose-playground]
// build.gradle.kts에서 Version Catalog 사용
dependencies {
    implementation(platform(libs.compose.bom))
    implementation(libs.bundles.compose)
    debugImplementation(libs.bundles.compose.debug)
    implementation(libs.navigation.compose)
    implementation(libs.lifecycle.runtime.compose)
    implementation(libs.hilt.android)
    ksp(libs.hilt.compiler)
}
```

---

## 7. XML View와 Compose 공존 (마이그레이션 전략)

기존 XML View 프로젝트를 한 번에 Compose로 전환하는 것은 비현실적입니다. **점진적 마이그레이션** 전략을 사용합니다.

### 마이그레이션 순서

```
┌─────────────────────────────────────────────────────┐
│         점진적 마이그레이션 전략                        │
│                                                     │
│  Phase 1: 새 화면만 Compose로                        │
│     └→ 기존 코드는 그대로, 신규 기능만 Compose          │
│                                                     │
│  Phase 2: 공통 컴포넌트를 Compose로                    │
│     └→ 버튼, 카드 등 재사용 컴포넌트                    │
│                                                     │
│  Phase 3: 기존 화면 하나씩 전환                        │
│     └→ Fragment 안에서 Compose 사용                   │
│                                                     │
│  Phase 4: Navigation 전환                            │
│     └→ Fragment Navigation → Compose Navigation      │
│                                                     │
│  Phase 5: XML 완전 제거                               │
│     └→ Activity에서 바로 setContent                   │
└─────────────────────────────────────────────────────┘
```

### XML 안에서 Compose 사용 (ComposeView)

```kotlin [compose-playground]
// Fragment에서 Compose 사용
class HomeFragment : Fragment() {

    override fun onCreateView(
        inflater: LayoutInflater,
        container: ViewGroup?,
        savedInstanceState: Bundle?
    ): View {
        return ComposeView(requireContext()).apply {
            // Fragment의 생명주기에 맞게 Composition 관리
            setViewCompositionStrategy(
                ViewCompositionStrategy.DisposeOnViewTreeLifecycleDestroyed
            )
            setContent {
                MyTheme {
                    HomeScreen()
                }
            }
        }
    }
}
```

### Compose 안에서 XML View 사용 (AndroidView)

```kotlin [compose-playground]
// Compose에서 기존 XML View 사용
@Composable
fun LegacyMapView() {
    AndroidView(
        factory = { context ->
            // XML View 생성
            MapView(context).apply {
                // 초기 설정
            }
        },
        update = { mapView ->
            // State 변경 시 View 업데이트
            mapView.moveCamera(cameraPosition)
        },
        modifier = Modifier.fillMaxSize()
    )
}

// XML 레이아웃 인플레이트
@Composable
fun LegacyLayout() {
    AndroidViewBinding(LegacyLayoutBinding::inflate) {
        // binding으로 접근
        legacyTextView.text = "Compose에서 XML 사용"
        legacyButton.setOnClickListener { /* ... */ }
    }
}
```

---

## 8. 테스트 전략: 단위 → 통합 → E2E

### 테스트 피라미드

```
┌─────────────────────────────────────────────────────┐
│               테스트 피라미드                          │
│                                                     │
│                  /  E2E  \          10%              │
│                 / (전체흐름) \       실제 디바이스       │
│                /─────────────\                       │
│               / 통합 테스트     \    20%               │
│              / (화면 단위 UI)    \   에뮬레이터         │
│             /─────────────────────\                  │
│            /     단위 테스트        \  70%             │
│           / (ViewModel, UseCase)    \ JVM (빠름)     │
│          /─────────────────────────────\             │
└─────────────────────────────────────────────────────┘
```

### 단위 테스트 (ViewModel)

```kotlin [compose-playground]
// 테스트 유틸: MainDispatcher 교체 Rule
class MainDispatcherRule(
    private val dispatcher: TestDispatcher = UnconfinedTestDispatcher()
) : TestWatcher() {
    override fun starting(description: Description) {
        Dispatchers.setMain(dispatcher)
    }
    override fun finished(description: Description) {
        Dispatchers.resetMain()
    }
}

// ViewModel 단위 테스트
class HomeViewModelTest {

    @get:Rule
    val mainDispatcherRule = MainDispatcherRule()

    private lateinit var fakeRepository: FakeTaskRepository
    private lateinit var viewModel: HomeViewModel

    @Before
    fun setup() {
        fakeRepository = FakeTaskRepository()
        viewModel = HomeViewModel(fakeRepository)
    }

    @Test
    fun `초기 상태는 Loading이다`() {
        val state = viewModel.uiState.value
        assertTrue(state is HomeUiState.Loading)
    }

    @Test
    fun `데이터 로드 성공 시 Success 상태가 된다`() = runTest {
        // Given
        fakeRepository.addTasks(
            Task(1, "할 일 1"),
            Task(2, "할 일 2")
        )

        // When
        viewModel.loadTasks()

        // Then
        val state = viewModel.uiState.value
        assertTrue(state is HomeUiState.Success)
        assertEquals(2, (state as HomeUiState.Success).tasks.size)
    }

    @Test
    fun `데이터 로드 실패 시 Error 상태가 된다`() = runTest {
        // Given
        fakeRepository.setShouldThrowError(true)

        // When
        viewModel.loadTasks()

        // Then
        val state = viewModel.uiState.value
        assertTrue(state is HomeUiState.Error)
    }
}
```

### 통합 테스트 (UI)

```kotlin [compose-playground]
// UI 통합 테스트
class HomeScreenTest {

    @get:Rule
    val composeTestRule = createComposeRule()

    @Test
    fun `로딩 상태일 때 프로그레스 인디케이터가 표시된다`() {
        composeTestRule.setContent {
            HomeContent(uiState = HomeUiState.Loading)
        }

        composeTestRule
            .onNodeWithTag("loading_indicator")
            .assertIsDisplayed()
    }

    @Test
    fun `할 일 목록이 올바르게 표시된다`() {
        val tasks = listOf(
            Task(1, "장보기", false),
            Task(2, "운동하기", true)
        )

        composeTestRule.setContent {
            HomeContent(uiState = HomeUiState.Success(tasks))
        }

        composeTestRule
            .onNodeWithText("장보기")
            .assertIsDisplayed()

        composeTestRule
            .onNodeWithText("운동하기")
            .assertIsDisplayed()
    }

    @Test
    fun `할 일 클릭 시 onTaskClick이 호출된다`() {
        var clickedId: Long? = null
        val tasks = listOf(Task(1, "장보기"))

        composeTestRule.setContent {
            HomeContent(
                uiState = HomeUiState.Success(tasks),
                onTaskClick = { clickedId = it }
            )
        }

        composeTestRule
            .onNodeWithText("장보기")
            .performClick()

        assertEquals(1L, clickedId)
    }
}
```

### E2E 테스트

```kotlin [compose-playground]
// E2E 테스트 (실제 앱 흐름 테스트)
@HiltAndroidTest
class TaskFlowE2ETest {

    @get:Rule(order = 0)
    val hiltRule = HiltAndroidRule(this)

    @get:Rule(order = 1)
    val composeTestRule = createAndroidComposeRule<MainActivity>()

    @Before
    fun setup() {
        hiltRule.inject()
    }

    @Test
    fun `할_일_추가_후_목록에_표시된다`() {
        // 홈 화면에서 추가 버튼 클릭
        composeTestRule
            .onNodeWithContentDescription("할 일 추가")
            .performClick()

        // 입력 화면에서 제목 입력
        composeTestRule
            .onNodeWithTag("title_input")
            .performTextInput("새로운 할 일")

        // 저장 버튼 클릭
        composeTestRule
            .onNodeWithText("저장")
            .performClick()

        // 홈 화면에서 추가된 할 일 확인
        composeTestRule
            .onNodeWithText("새로운 할 일")
            .assertIsDisplayed()
    }
}
```

---

## 9. 배포와 CI/CD 기초

### GitHub Actions CI/CD 파이프라인

```yaml
# .github/workflows/android-ci.yml
name: Android CI

on:
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main ]

jobs:
  build:
    runs-on: ubuntu-latest

    steps:
    - name: Checkout
      uses: actions/checkout@v4

    - name: Setup JDK 17
      uses: actions/setup-java@v4
      with:
        java-version: '17'
        distribution: 'temurin'

    - name: Setup Gradle
      uses: gradle/actions/setup-gradle@v4

    - name: Run unit tests
      run: ./gradlew testDebugUnitTest

    - name: Run lint
      run: ./gradlew lintDebug

    - name: Build debug APK
      run: ./gradlew assembleDebug

    - name: Upload APK
      uses: actions/upload-artifact@v4
      with:
        name: app-debug
        path: app/build/outputs/apk/debug/app-debug.apk

  ui-test:
    runs-on: ubuntu-latest
    needs: build

    steps:
    - name: Checkout
      uses: actions/checkout@v4

    - name: Setup JDK 17
      uses: actions/setup-java@v4
      with:
        java-version: '17'
        distribution: 'temurin'

    - name: Enable KVM
      run: |
        echo 'KERNEL=="kvm", GROUP="kvm", MODE="0666", OPTIONS+="static_node=kvm"' | sudo tee /etc/udev/rules.d/99-kvm4all.rules
        sudo udevadm control --reload-rules
        sudo udevadm trigger --name-match=kvm

    - name: Run instrumented tests
      uses: reactivecircus/android-emulator-runner@v2
      with:
        api-level: 34
        target: google_apis
        arch: x86_64
        script: ./gradlew connectedAndroidTest

  release:
    runs-on: ubuntu-latest
    needs: [build, ui-test]
    if: github.ref == 'refs/heads/main'

    steps:
    - name: Checkout
      uses: actions/checkout@v4

    - name: Setup JDK 17
      uses: actions/setup-java@v4
      with:
        java-version: '17'
        distribution: 'temurin'

    - name: Build release bundle
      run: ./gradlew bundleRelease
      env:
        SIGNING_KEY_ALIAS: ${{ secrets.SIGNING_KEY_ALIAS }}
        SIGNING_KEY_PASSWORD: ${{ secrets.SIGNING_KEY_PASSWORD }}
        SIGNING_STORE_PASSWORD: ${{ secrets.SIGNING_STORE_PASSWORD }}

    - name: Upload to Play Store (Internal Testing)
      uses: r0adkll/upload-google-play@v1
      with:
        serviceAccountJsonPlainText: ${{ secrets.PLAY_SERVICE_ACCOUNT_JSON }}
        packageName: com.example.myapp
        releaseFiles: app/build/outputs/bundle/release/app-release.aab
        track: internal
```

### 배포 전 체크리스트

```
┌─────────────────────────────────────────────────────┐
│              배포 전 체크리스트                         │
│                                                     │
│  코드:                                              │
│  □ 모든 단위 테스트 통과                              │
│  □ 모든 UI 테스트 통과                               │
│  □ Lint 경고 확인 및 해결                            │
│  □ 코드 리뷰 완료                                    │
│                                                     │
│  성능:                                              │
│  □ 릴리스 빌드에서 성능 확인                          │
│  □ R8 활성화 확인                                    │
│  □ Baseline Profiles 포함 확인                       │
│  □ ANR/Crash 없음 확인                              │
│                                                     │
│  빌드:                                              │
│  □ 버전 코드/이름 업데이트                            │
│  □ 서명 키 확인                                      │
│  □ ProGuard 규칙 테스트                              │
│  □ AAB(Android App Bundle) 빌드                     │
│                                                     │
│  Play Store:                                        │
│  □ 스크린샷 업데이트                                  │
│  □ 변경 로그 작성                                    │
│  □ 내부 테스트 → 비공개 테스트 → 프로덕션 단계 배포      │
└─────────────────────────────────────────────────────┘
```

### 앱 서명

```kotlin [compose-playground]
// build.gradle.kts
android {
    signingConfigs {
        create("release") {
            storeFile = file(System.getenv("SIGNING_STORE_FILE") ?: "keystore.jks")
            storePassword = System.getenv("SIGNING_STORE_PASSWORD") ?: ""
            keyAlias = System.getenv("SIGNING_KEY_ALIAS") ?: ""
            keyPassword = System.getenv("SIGNING_KEY_PASSWORD") ?: ""
        }
    }

    buildTypes {
        release {
            isMinifyEnabled = true
            isShrinkResources = true
            signingConfig = signingConfigs.getByName("release")
            proguardFiles(
                getDefaultProguardFile("proguard-android-optimize.txt"),
                "proguard-rules.pro"
            )
        }
    }
}
```

> **주의**: 서명 키와 비밀번호는 절대 코드에 직접 넣지 마세요. 환경 변수나 CI/CD의 Secret으로 관리합니다.

---

## 10. 정리

### 실전 프로젝트 핵심 체크리스트

```
┌─────────────────────────────────────────────────────┐
│         실전 프로젝트 설계 요약                         │
│                                                     │
│  구조:                                              │
│  ✓ feature 기반 모듈화                               │
│  ✓ core 모듈로 공통 코드 분리                         │
│  ✓ Convention Plugin으로 빌드 설정 통합                │
│                                                     │
│  기술 스택:                                          │
│  ✓ Compose + Navigation + ViewModel + Hilt           │
│  ✓ Room + DataStore (로컬)                           │
│  ✓ Retrofit/Ktor (네트워크) + Coil (이미지)           │
│  ✓ Compose BOM + Version Catalog                     │
│                                                     │
│  품질:                                              │
│  ✓ sealed interface로 UI 상태 모델링                  │
│  ✓ Result 래퍼로 일관된 에러 처리                      │
│  ✓ 단위/통합/E2E 테스트 피라미드                       │
│  ✓ CI/CD 자동화                                     │
│                                                     │
│  마이그레이션:                                        │
│  ✓ 점진적 전환 (ComposeView, AndroidView)              │
│  ✓ 새 화면부터 Compose 적용                            │
└─────────────────────────────────────────────────────┘
```

### 추천 학습 경로

```
1. 먼저 간단한 단일 모듈 앱 만들기
   → Todo 앱, 메모 앱 등

2. 아키텍처 적용 연습
   → MVVM + UDF + sealed interface UiState

3. 라이브러리 하나씩 추가
   → Room → Hilt → Navigation → Coil

4. 모듈화 시도
   → 2~3개 feature 모듈로 분리

5. 테스트 추가
   → ViewModel 단위 테스트부터

6. CI/CD 구축
   → GitHub Actions 기본 파이프라인
```

지금까지 Phase 0부터 Phase 10까지 Jetpack Compose의 기초부터 실전까지 모든 과정을 학습했습니다. 이제 직접 프로젝트를 만들면서 경험을 쌓아보세요!
