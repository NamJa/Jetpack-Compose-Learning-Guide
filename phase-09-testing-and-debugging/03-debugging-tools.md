# 디버깅 도구와 성능 프로파일링

> **"추측하지 말고, 측정하라."**
>
> Compose 앱이 느리거나 이상하게 동작할 때, 감으로 문제를 찾지 마세요.
> Android Studio와 Compose가 제공하는 강력한 디버깅 도구들을 활용하면 문제의 원인을 정확히 파악할 수 있습니다.

---

## 목차

1. [Layout Inspector: Compose 트리 시각화](#1-layout-inspector-compose-트리-시각화)
2. [Recomposition 카운터와 하이라이터](#2-recomposition-카운터와-하이라이터)
3. [Compose Preview](#3-compose-preview)
4. [Live Edit](#4-live-edit)
5. [Android Profiler](#5-android-profiler)
6. [System Trace](#6-system-trace)
7. [Compose Compiler Metrics](#7-compose-compiler-metrics)
8. [일반적인 디버깅 시나리오와 해결법](#8-일반적인-디버깅-시나리오와-해결법)
9. [정리](#9-정리)

---

## 1. Layout Inspector: Compose 트리 시각화

Layout Inspector는 실행 중인 앱의 **Compose 트리 구조를 실시간으로 시각화**하는 도구입니다.

### 실행 방법

```
Android Studio 메뉴:
  View → Tool Windows → Layout Inspector

또는:
  Running Devices 창에서 디바이스 선택 →
  Layout Inspector 탭 클릭
```

### Layout Inspector가 보여주는 정보

```
┌─────────────────────────────────────────────────────┐
│              Layout Inspector 화면 구성                │
│                                                     │
│  ┌──────────┐  ┌──────────────┐  ┌───────────────┐  │
│  │ Component │  │   실제 화면    │  │  Properties   │  │
│  │   Tree    │  │   미리보기    │  │    (속성)      │  │
│  │           │  │              │  │               │  │
│  │ Column    │  │  ┌────────┐  │  │ Modifier:     │  │
│  │ ├─ Text   │  │  │ 화면   │  │  │  padding=16   │  │
│  │ ├─ Row    │  │  │ 내용   │  │  │  fillMaxWidth │  │
│  │ │ ├─ Icon │  │  │        │  │  │               │  │
│  │ │ └─ Text │  │  └────────┘  │  │ Recomposition │  │
│  │ └─ Button │  │              │  │  Count: 5     │  │
│  └──────────┘  └──────────────┘  └───────────────┘  │
└─────────────────────────────────────────────────────┘
```

### 주요 기능

| 기능 | 설명 |
|------|------|
| **Component Tree** | Compose 컴포저블의 계층 구조 표시 |
| **3D 뷰** | 레이아웃 레이어를 3D로 시각화 |
| **속성 패널** | 선택한 노드의 Modifier, 크기, 위치 등 |
| **리컴포지션 카운트** | 각 컴포저블이 몇 번 리컴포지션되었는지 |
| **시맨틱 정보** | 노드의 시맨틱 속성 확인 |
| **필터링** | 시스템 노드 숨기기, 특정 노드 검색 |

### 실전 활용: 레이아웃 문제 디버깅

```kotlin [compose-playground]
// 문제: 텍스트가 잘리는데 원인을 모를 때
@Composable
fun UserInfo(name: String, description: String) {
    Row(modifier = Modifier.fillMaxWidth()) {
        Avatar(name)
        Column {
            Text(name, style = MaterialTheme.typography.titleMedium)
            Text(description)  // 이 텍스트가 잘림!
        }
    }
}

// Layout Inspector에서 확인할 수 있는 것:
// 1. Column의 실제 크기 (width가 0?)
// 2. Row 안에서 Avatar가 공간을 다 차지하는지
// 3. Modifier 체인이 올바른지
```

> **팁**: Layout Inspector에서 노드를 클릭하면 해당 코드 위치로 바로 이동할 수 있습니다.

---

## 2. Recomposition 카운터와 하이라이터

리컴포지션(Recomposition)이 과도하게 발생하면 성능 문제가 생깁니다. 이를 추적하는 두 가지 도구가 있습니다.

### Recomposition 카운터 (Layout Inspector)

Layout Inspector의 Component Tree에서 각 컴포저블 옆에 **리컴포지션 횟수**와 **건너뛴 횟수**가 표시됩니다.

```
Component Tree:
  Column                    recompositions: 1, skipped: 0
  ├─ Text("제목")            recompositions: 1, skipped: 4  ← 4번 건너뜀 (좋음!)
  ├─ Counter                recompositions: 5, skipped: 0  ← 5번 리컴포지션 (확인 필요)
  │  └─ Text("카운트: 5")   recompositions: 5, skipped: 0
  └─ Footer                 recompositions: 1, skipped: 4  ← 안정적
```

### Recomposition 하이라이터

화면에서 리컴포지션이 발생하는 영역을 **색상으로 표시**합니다.

```
설정 방법:
  1. 디바이스/에뮬레이터의 개발자 옵션 활성화
  2. 설정 → 개발자 옵션 → "Show recomposition counts" 활성화

또는 Android Studio에서:
  Layout Inspector → View Options → Show Recomposition Counts
```

### 리컴포지션 문제 파악 예시

```kotlin [compose-playground]
// ❌ 문제: 불필요한 리컴포지션 발생
@Composable
fun UserList(users: List<User>) {
    val currentTime = System.currentTimeMillis()  // 매 리컴포지션마다 변경!

    LazyColumn {
        items(users) { user ->
            UserCard(
                user = user,
                timestamp = currentTime  // 매번 새 값 → 모든 카드 리컴포지션
            )
        }
    }
}

// ✅ 해결: 불필요한 상태 변경 제거
@Composable
fun UserList(users: List<User>) {
    LazyColumn {
        items(
            items = users,
            key = { it.id }  // 안정적인 key 제공
        ) { user ->
            UserCard(user = user)
        }
    }
}
```

---

## 3. Compose Preview

`@Preview` 어노테이션을 사용하면 **에뮬레이터 없이** Android Studio에서 바로 컴포저블을 확인할 수 있습니다.

### 기본 Preview

```kotlin [compose-playground]
@Preview(showBackground = true)
@Composable
fun GreetingPreview() {
    MyTheme {
        Greeting(name = "Android")
    }
}
```

### 다양한 Preview 옵션

```kotlin [compose-playground]
// 여러 조건을 한 번에 미리보기
@Preview(
    name = "Light Mode",
    showBackground = true,
    uiMode = Configuration.UI_MODE_NIGHT_NO
)
@Preview(
    name = "Dark Mode",
    showBackground = true,
    uiMode = Configuration.UI_MODE_NIGHT_YES
)
@Composable
fun ThemePreview() {
    MyTheme {
        LoginScreen()
    }
}

// 디바이스 크기 지정
@Preview(
    name = "Phone",
    device = "spec:width=411dp,height=891dp,dpi=420"
)
@Preview(
    name = "Tablet",
    device = "spec:width=1280dp,height=800dp,dpi=240"
)
@Composable
fun ResponsivePreview() {
    MyTheme {
        MainScreen()
    }
}

// 폰트 크기 확대
@Preview(fontScale = 1.5f, showBackground = true)
@Composable
fun LargeFontPreview() {
    MyTheme {
        Greeting(name = "Android")
    }
}

// 로케일 변경
@Preview(locale = "ko", showBackground = true)
@Preview(locale = "en", showBackground = true)
@Composable
fun LocalePreview() {
    MyTheme {
        Greeting(name = "사용자")
    }
}
```

### 인터랙티브 모드

Preview 화면에서 직접 **클릭, 스크롤 등의 상호작용**을 테스트할 수 있습니다.

```
사용 방법:
  Preview 상단의 "Interactive" 버튼 클릭
  (또는 "Start Interactive Mode" 아이콘)

┌──────────────────────────────┐
│  Preview 화면                 │
│  [Interactive] [Run] [Deploy] │
│                              │
│  ┌────────────────────────┐  │
│  │                        │  │
│  │   컴포저블 미리보기      │  │
│  │   (클릭, 스크롤 가능)   │  │
│  │                        │  │
│  └────────────────────────┘  │
└──────────────────────────────┘
```

### Preview를 효과적으로 활용하는 팁

```kotlin [compose-playground]
// 1. 상태별 Preview 만들기
@Preview(name = "Loading", showBackground = true)
@Composable
fun LoadingPreview() {
    UserListScreen(uiState = UserListUiState.Loading)
}

@Preview(name = "Success", showBackground = true)
@Composable
fun SuccessPreview() {
    UserListScreen(
        uiState = UserListUiState.Success(
            users = listOf(
                User(1, "김철수", "kim@test.com"),
                User(2, "이영희", "lee@test.com")
            )
        )
    )
}

@Preview(name = "Error", showBackground = true)
@Composable
fun ErrorPreview() {
    UserListScreen(
        uiState = UserListUiState.Error("네트워크 오류가 발생했습니다")
    )
}

// 2. @PreviewParameter로 데이터 주입
class UserPreviewProvider : PreviewParameterProvider<User> {
    override val values = sequenceOf(
        User(1, "김철수", "kim@test.com"),
        User(2, "이영희 (긴 이름 테스트용 데이터)", "verylongemail@example.com")
    )
}

@Preview(showBackground = true)
@Composable
fun UserCardPreview(
    @PreviewParameter(UserPreviewProvider::class) user: User
) {
    UserCard(user = user)
}
```

---

## 4. Live Edit

Live Edit는 코드를 수정하면 **실행 중인 앱에 즉시 반영**되는 기능입니다. 빌드-실행 사이클 없이 UI를 빠르게 수정할 수 있습니다.

### 설정 방법

```
Android Studio 메뉴:
  Settings → Editor → Live Edit →
  "Push edits manually" 또는 "Push edits automatically" 선택
```

### 지원 범위

```
┌─────────────────────────────────────────────────┐
│  Live Edit가 지원하는 변경                         │
│                                                 │
│  ✓ 컴포저블 함수 내부 수정                          │
│  ✓ 문자열, 숫자 등 리터럴 값 변경                    │
│  ✓ Modifier 변경 (padding, color 등)              │
│  ✓ 조건문/반복문 수정                               │
│                                                 │
│  Live Edit가 지원하지 않는 변경                      │
│                                                 │
│  ✗ 함수 시그니처 변경 (매개변수 추가/제거)             │
│  ✗ 새 클래스/파일 추가                              │
│  ✗ 비-Compose 코드 변경 (Activity, ViewModel 등)    │
│  ✗ 리소스 파일 변경 (strings.xml, drawable 등)       │
└─────────────────────────────────────────────────┘
```

### 실전 활용

```kotlin [compose-playground]
// Live Edit로 실시간 UI 조정 예시
@Composable
fun ProfileCard(user: User) {
    Card(
        modifier = Modifier
            .padding(16.dp)          // ← 이 값을 8.dp로 바꾸면 즉시 반영!
            .fillMaxWidth(),
        elevation = CardDefaults.cardElevation(
            defaultElevation = 4.dp  // ← 이 값도 실시간 변경 가능
        )
    ) {
        Text(
            text = user.name,
            style = MaterialTheme.typography.headlineMedium,
            color = Color.Blue       // ← 색상 변경도 즉시 확인
        )
    }
}
```

### 리터럴 실시간 편집 (Live Literals)

Android Studio는 코드에서 숫자, 문자열, 색상 등 리터럴 값을 인라인으로 편집할 수 있는 UI를 제공합니다.

```
코드 옆에 컬러 아이콘이나 슬라이더가 표시됨:
  Color(0xFF6200EE) ← 클릭하면 컬러 피커 표시
  padding(16.dp)    ← 슬라이더로 값 조정 가능
```

---

## 5. Android Profiler

Android Profiler는 앱의 **CPU, 메모리, 에너지 사용량**을 실시간으로 모니터링하는 도구입니다.

### 실행 방법

```
Android Studio 하단:
  View → Tool Windows → Profiler

또는 실행 시:
  Run → Profile 'app' (벌레 아이콘 옆의 그래프 아이콘)
```

### CPU Profiler

CPU 사용량과 스레드 활동을 추적합니다.

```
┌───────────────────────────────────────────────────┐
│  CPU Profiler 활용                                 │
│                                                   │
│  1. Sample Java/Kotlin Methods                    │
│     → 어떤 함수가 CPU를 많이 쓰는지 파악             │
│                                                   │
│  2. Trace Java/Kotlin Methods                     │
│     → 함수 호출 순서와 소요 시간 추적                 │
│                                                   │
│  3. Sample C/C++ Functions                        │
│     → 네이티브 코드 프로파일링                       │
│                                                   │
│  Compose에서 중요한 점:                             │
│  - Composition 함수의 실행 시간                     │
│  - 메인 스레드 블로킹 여부                          │
│  - 코루틴의 디스패치 상태                            │
└───────────────────────────────────────────────────┘
```

### Memory Profiler

메모리 사용량, GC(가비지 컬렉션), 메모리 누수를 추적합니다.

```kotlin [compose-playground]
// 메모리 누수가 발생하기 쉬운 패턴
// ❌ 잘못된 예: 컴포저블에서 대량 객체 매번 생성
@Composable
fun DataChart(data: List<DataPoint>) {
    // 매 리컴포지션마다 새 리스트 생성 → 메모리 낭비
    val processedData = data.map { point ->
        ProcessedPoint(
            x = point.x * scaleFactor,
            y = point.y * scaleFactor,
            label = formatLabel(point)
        )
    }
    Canvas(modifier = Modifier.fillMaxSize()) {
        drawChart(processedData)
    }
}

// ✅ 올바른 예: remember로 캐싱
@Composable
fun DataChart(data: List<DataPoint>) {
    val processedData = remember(data) {
        data.map { point ->
            ProcessedPoint(
                x = point.x * scaleFactor,
                y = point.y * scaleFactor,
                label = formatLabel(point)
            )
        }
    }
    Canvas(modifier = Modifier.fillMaxSize()) {
        drawChart(processedData)
    }
}
```

### Energy Profiler

배터리 사용량에 영향을 주는 요소를 추적합니다.

```
Energy Profiler가 추적하는 항목:
  - CPU 사용량
  - 네트워크 활동
  - GPS/위치 서비스
  - Wake Lock
  - 알람/잡 스케줄러
```

---

## 6. System Trace

System Trace는 앱의 **프레임별 동작**을 세밀하게 추적합니다. Compose의 3단계(Composition, Layout, Drawing)를 개별적으로 분석할 수 있습니다.

### 실행 방법

```
1. CPU Profiler 열기
2. "System Trace" 선택
3. Record 버튼 클릭
4. 앱에서 문제 동작 재현
5. Stop 클릭
6. 결과 분석
```

### Compose 추적 섹션

System Trace에서 Compose 관련 섹션을 확인할 수 있습니다.

```
타임라인:
  ─────────────────────────────────────────────
  Frame #1  Frame #2  Frame #3  Frame #4
  ─────────────────────────────────────────────

  Composition   ██░░░░  ██░░░░  ████░░  ██░░░░
  Layout        ░██░░░  ░██░░░  ░░████  ░██░░░
  Drawing       ░░░██░  ░░░██░  ░░░░██  ░░░██░

                                 ↑
                          이 프레임이 느림!
                     Composition과 Layout이 오래 걸림
```

### Compose 트레이싱 활성화

```kotlin [compose-playground]
// build.gradle.kts
dependencies {
    implementation("androidx.compose.runtime:runtime-tracing:1.7.7")
}
```

```kotlin [compose-playground]
// 커스텀 트레이스 섹션 추가
import androidx.tracing.trace

@Composable
fun HeavyScreen() {
    trace("HeavyScreen") {
        // 이 블록의 실행 시간이 System Trace에 표시됨
        val data = remember { processHeavyData() }
        DataList(data)
    }
}
```

### 프레임 드롭 분석

```
이상적인 프레임 (16.6ms 이내):
  ┌─Composition─┐┌─Layout─┐┌─Drawing─┐
  ████████████████████████████████████░░░░░░
  0ms                                 16.6ms

프레임 드롭 (16.6ms 초과):
  ┌───────Composition───────┐┌──Layout──┐┌─Drawing─┐
  ██████████████████████████████████████████████████████
  0ms                                              33.3ms
  ← 다음 프레임 지연! (버벅임 발생)
```

---

## 7. Compose Compiler Metrics

Compose Compiler Metrics는 컴파일러가 생성하는 **안정성 보고서**입니다. 어떤 클래스가 안정적/불안정적인지, 어떤 컴포저블이 건너뛸 수 있는지(skippable) 알려줍니다.

### Compose Compiler는 이제 Kotlin의 일부

Compose Compiler는 이제 별도의 `androidx.compose.compiler` 아티팩트가 아니라 **Kotlin 플러그인(`org.jetbrains.kotlin.plugin.compose`)** 에 포함되어 있습니다. `build.gradle.kts`에 다음 플러그인만 적용하면 됩니다:

```kotlin [compose-playground]
// build.gradle.kts (Module :app)
plugins {
    id("org.jetbrains.kotlin.plugin.compose")
}
```

### 활성화 방법

Compose Compiler가 Kotlin 플러그인에 통합됨에 따라, 리포트 설정도 `composeCompiler` 블록을 사용합니다. 기존의 `freeCompilerArgs`를 사용하는 방식은 더 이상 필요하지 않습니다.

```kotlin [compose-playground]
// build.gradle.kts (Module :app)
composeCompiler {
    reportsDestination = layout.buildDirectory.dir("compose_compiler")
    stabilityConfigurationFile = rootProject.layout.projectDirectory.file("stability_config.conf")
}
```

> **참고**: `stability_config.conf` 파일에서 특정 클래스를 안정적(stable)으로 선언할 수 있습니다. 예를 들어, `java.time.LocalDate`나 프로젝트의 외부 라이브러리 모델 클래스를 등록하면 불필요한 리컴포지션을 줄일 수 있습니다.

### 보고서 생성

```bash
# 빌드 실행
./gradlew assembleRelease

# 보고서 위치
# app/build/compose_metrics/
# app/build/compose_reports/
```

### 보고서 분석

생성되는 파일들:

```
compose_metrics/
├── app_release-module.json          ← 모듈 요약 통계
├── app_release-composables.txt      ← 컴포저블 함수 목록
├── app_release-composables.csv      ← CSV 형식
└── app_release-classes.txt          ← 클래스 안정성 정보

compose_reports/
├── app_release-composables.txt
└── app_release-classes.txt
```

### classes.txt 읽는 법

```
// 안정적인 클래스 (좋음!)
stable class User {
  stable val id: Int
  stable val name: String
  stable val email: String
}

// 불안정한 클래스 (확인 필요)
unstable class UserList {
  unstable val users: List<User>     ← List는 불안정!
  stable val title: String
}

// runtime 안정적 (컴파일 시점에는 불안정하지만 런타임에 안정)
runtime class Config {
  stable val apiUrl: String
  runtime val headers: Map<String, String>
}
```

### composables.txt 읽는 법

```
// restartable + skippable (이상적!)
restartable skippable scheme("[androidx.compose.ui.UiComposable]") fun UserCard(
  stable user: User
)

// restartable만 (skippable이 아님 → 항상 리컴포지션)
restartable scheme("[androidx.compose.ui.UiComposable]") fun UserList(
  unstable users: List<User>    ← 불안정한 파라미터 때문!
)
```

### 안정성 문제 해결

```kotlin [kotlin-playground]
fun main() {
//sampleStart
// ❌ 불안정: List<T>는 기본적으로 불안정
data class UserListState(
    val users: List<User>,       // unstable!
    val isLoading: Boolean
)

// ✅ 해결 방법 1: @Immutable 어노테이션
@Immutable
data class UserListState(
    val users: List<User>,       // @Immutable이 전체를 안정적으로 선언
    val isLoading: Boolean
)

// ✅ 해결 방법 2: kotlinx.collections.immutable 사용
data class UserListState(
    val users: ImmutableList<User>,  // 불변 컬렉션 → stable!
    val isLoading: Boolean
)
//sampleEnd
}
```

---

## 8. 일반적인 디버깅 시나리오와 해결법

### 시나리오 1: UI가 업데이트되지 않음

```kotlin [compose-playground]
// ❌ 문제: 상태 변경이 리컴포지션을 트리거하지 않음
@Composable
fun BrokenCounter() {
    var count = 0  // remember가 없음!

    Button(onClick = { count++ }) {
        Text("카운트: $count")  // 항상 0 표시
    }
}

// ✅ 해결: remember + mutableStateOf 사용
@Composable
fun WorkingCounter() {
    var count by remember { mutableIntStateOf(0) }

    Button(onClick = { count++ }) {
        Text("카운트: $count")
    }
}
```

### 시나리오 2: 무한 리컴포지션

```kotlin [compose-playground]
// ❌ 문제: 컴포지션 중에 상태를 변경 → 무한 루프
@Composable
fun InfiniteRecomposition() {
    var count by remember { mutableIntStateOf(0) }

    count++  // 컴포지션 중 상태 변경 → 리컴포지션 → 또 변경 → ...

    Text("카운트: $count")
}

// ✅ 해결: 상태 변경은 이벤트 핸들러나 Side Effect에서
@Composable
fun CorrectComposition() {
    var count by remember { mutableIntStateOf(0) }

    LaunchedEffect(Unit) {
        count++  // Side Effect에서 상태 변경
    }

    Text("카운트: $count")
}
```

### 시나리오 3: LazyColumn 아이템이 뒤섞임

```kotlin [compose-playground]
// ❌ 문제: key 없이 LazyColumn 사용
@Composable
fun BrokenList(items: List<TodoItem>) {
    LazyColumn {
        items(items) { item ->
            TodoRow(item)  // 아이템 순서 변경 시 상태 꼬임
        }
    }
}

// ✅ 해결: 안정적인 key 제공
@Composable
fun WorkingList(items: List<TodoItem>) {
    LazyColumn {
        items(
            items = items,
            key = { it.id }  // 고유 ID를 key로 사용
        ) { item ->
            TodoRow(item)
        }
    }
}
```

### 시나리오 4: 예상보다 넓은 범위의 리컴포지션

```kotlin [compose-playground]
// ❌ 문제: 큰 컴포저블 하나에 모든 상태
@Composable
fun MonolithScreen() {
    var searchQuery by remember { mutableStateOf("") }
    var selectedTab by remember { mutableIntStateOf(0) }
    var sortOrder by remember { mutableStateOf(SortOrder.NAME) }

    Column {
        SearchBar(query = searchQuery, onQueryChange = { searchQuery = it })
        TabBar(selectedTab = selectedTab, onTabChange = { selectedTab = it })
        // searchQuery가 바뀌면 전체가 리컴포지션!
        ItemList(items = getItems(sortOrder))
        SortButton(order = sortOrder, onOrderChange = { sortOrder = it })
    }
}

// ✅ 해결: 상태를 사용하는 범위를 최소화
@Composable
fun OptimizedScreen() {
    Column {
        SearchSection()   // searchQuery 상태를 내부에서 관리
        TabSection()      // selectedTab 상태를 내부에서 관리
        SortableList()    // sortOrder 상태를 내부에서 관리
    }
}
```

### 시나리오 5: Modifier 순서 문제

```kotlin [compose-playground]
// ❌ 문제: padding 후 background → 패딩 영역에 배경 없음
Box(
    modifier = Modifier
        .padding(16.dp)
        .background(Color.Red)
) {
    Text("텍스트")
}

// ✅ 해결: background 후 padding → 패딩 포함 배경
Box(
    modifier = Modifier
        .background(Color.Red)
        .padding(16.dp)
) {
    Text("텍스트")
}
```

### 디버깅 체크리스트

```
┌─────────────────────────────────────────────────────┐
│              디버깅 체크리스트                          │
│                                                     │
│  UI가 업데이트 안 될 때:                               │
│  □ remember를 사용했는가?                              │
│  □ mutableStateOf로 상태를 만들었는가?                  │
│  □ 상태 변경이 올바른 스코프에서 일어나는가?               │
│                                                     │
│  성능이 느릴 때:                                      │
│  □ 릴리스 빌드에서 테스트했는가? (디버그 빌드는 느림)      │
│  □ Layout Inspector에서 리컴포지션 횟수를 확인했는가?     │
│  □ LazyColumn에 key를 제공했는가?                      │
│  □ remember로 비용 큰 계산을 캐싱했는가?                 │
│  □ 불필요하게 넓은 리컴포지션 범위가 없는가?              │
│                                                     │
│  레이아웃이 이상할 때:                                  │
│  □ Layout Inspector에서 크기와 위치를 확인했는가?        │
│  □ Modifier 순서가 올바른가?                           │
│  □ fillMaxSize/fillMaxWidth가 적절한가?                │
└─────────────────────────────────────────────────────┘
```

---

## 9. 정리

### 도구별 사용 목적

| 도구 | 목적 | 사용 시점 |
|------|------|-----------|
| **Layout Inspector** | UI 트리 구조 확인, 리컴포지션 추적 | 레이아웃 문제, 리컴포지션 분석 |
| **Recomposition 카운터** | 과도한 리컴포지션 감지 | 성능 문제 |
| **Compose Preview** | 빠른 UI 확인 | 개발 중 |
| **Live Edit** | 실시간 코드 반영 | UI 미세 조정 |
| **CPU Profiler** | CPU 사용량 분석 | 앱이 느릴 때 |
| **Memory Profiler** | 메모리 누수 감지 | 메모리 문제 |
| **System Trace** | 프레임 단위 성능 분석 | 버벅임(jank) |
| **Compiler Metrics** | 안정성 보고서 | 빌드 시 최적화 |

### 다음 단계

디버깅 도구를 익혔다면, 다음 Phase에서는 본격적인 아키텍처와 성능 최적화를 다룹니다:

- MVVM 패턴과 단방향 데이터 흐름
- Compose 3단계 최적화 (Composition → Layout → Drawing)
- 안정성(Stability) 문제 해결
- 실전 프로젝트 설계
