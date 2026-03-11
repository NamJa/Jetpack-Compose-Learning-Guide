# 코루틴과 비동기 처리

> **"UI를 멈추지 않고 데이터를 가져오는 방법."**
> 네트워크 요청, 데이터베이스 읽기 — 시간이 걸리는 작업을 메인 스레드를 차단하지 않고 처리하는 것이 코루틴의 핵심입니다.

### 학습 환경 기준

| 항목 | 버전 |
|------|------|
| Kotlin | 2.3.10 (K2 컴파일러 기본 적용) |
| Kotlin Coroutines | 1.10.2 |
| Compose BOM | 2026.02.01 |
| Compose UI / Foundation / Runtime | 1.10.4 |
| Material3 | 1.4.0 |

---

## 목차

1. [왜 비동기 처리가 필요한가?](#1-왜-비동기-처리가-필요한가)
2. [코루틴 기본 개념](#2-코루틴-기본-개념)
3. [suspend 함수](#3-suspend-함수)
4. [CoroutineScope와 빌더: launch, async](#4-coroutinescope와-빌더-launch-async)
5. [Dispatchers: 어디서 실행할 것인가](#5-dispatchers-어디서-실행할-것인가)
6. [구조화된 동시성](#6-구조화된-동시성)
7. [Flow 기초](#7-flow-기초)
8. [StateFlow와 SharedFlow](#8-stateflow와-sharedflow)
9. [Compose에서의 활용 종합](#9-compose에서의-활용-종합)
10. [퀴즈: 실습 체크리스트](#10-퀴즈-실습-체크리스트)

---

## 1. 왜 비동기 처리가 필요한가?

Android 앱의 UI는 **메인 스레드(UI 스레드)** 에서 동작합니다. 메인 스레드가 멈추면 화면이 멈춥니다.

```
메인 스레드에서 네트워크 요청을 하면?

시간 →  0ms        500ms       1000ms      1500ms      2000ms
        │           │           │           │           │
UI 스레드: [터치 처리][  네트워크 요청 대기 (BLOCKED!)  ][응답 처리]
                     ─────────── 이 구간 동안 ──────────
                     화면 터치 불가! 애니메이션 멈춤!
                     → ANR (Application Not Responding) 발생!

코루틴을 사용하면?

시간 →  0ms        500ms       1000ms      1500ms      2000ms
        │           │           │           │           │
UI 스레드: [터치][애니메이션][스크롤][터치]  [응답으로 UI 갱신]
                                             ↑
IO 스레드: [=== 네트워크 요청 대기 ===]────────┘
           메인 스레드는 자유롭게 UI 처리!
```

| 작업 | 소요 시간 | 메인 스레드? |
|------|----------|------------|
| UI 그리기 | 16ms (60fps) | O |
| 파일 읽기 | 10~100ms | X (IO) |
| 네트워크 요청 | 100~5000ms | X (IO) |
| JSON 파싱 | 1~50ms | 상황에 따라 |
| 복잡한 계산 | 10~1000ms | X (Default) |

---

## 2. 코루틴 기본 개념

코루틴(Coroutine)은 **경량 스레드**라고 불리지만, 실제로 스레드와 다릅니다.

```
스레드 vs 코루틴

스레드 (Thread)                    코루틴 (Coroutine)
┌──────────────────┐              ┌──────────────────┐
│ OS가 관리         │              │ 프로그램이 관리    │
│ 생성 비용 높음     │              │ 생성 비용 매우 낮음 │
│ 메모리 ~1MB/스레드 │              │ 메모리 ~수 KB      │
│ 선점형 멀티태스킹   │              │ 협력형 멀티태스킹   │
│ 10,000개 → 메모리 │              │ 100,000개 → OK!   │
│ 부족 가능          │              │                   │
└──────────────────┘              └──────────────────┘
```

### 핵심 용어 요약

| 용어 | 설명 |
|------|------|
| `suspend` | "중단 가능한" 함수 표시. 코루틴 안에서만 호출 가능 |
| `CoroutineScope` | 코루틴의 수명을 관리하는 범위 |
| `launch` | 코루틴 시작 (반환값 없음, `Job` 반환) |
| `async` | 코루틴 시작 (반환값 있음, `Deferred<T>` 반환) |
| `Dispatcher` | 코루틴이 실행될 스레드를 지정 |
| `Job` | 코루틴의 작업을 나타내는 핸들 (취소 가능) |

---

## 3. suspend 함수

`suspend` 키워드는 이 함수가 **코루틴 안에서 실행되어야 하며, 중간에 일시 중단될 수 있다**는 것을 의미합니다.

```kotlin [kotlin-playground]
import kotlinx.coroutines.*

// suspend 함수 선언
suspend fun fetchUserData(): String {
    delay(1000)  // 1초 대기 (Thread.sleep이 아님! 스레드를 차단하지 않음)
    return "사용자 데이터"
}

suspend fun processData(data: String): String {
    delay(500)
    return "처리됨: $data"
}

// suspend 함수는 다른 suspend 함수를 호출할 수 있음
suspend fun fetchAndProcessData(): String {
    val data = fetchUserData()         // suspend 함수 호출
    val processed = processData(data)  // 또 다른 suspend 함수 호출
    return processed
}

fun main() = runBlocking {
//sampleStart
    val result = fetchAndProcessData()
    println(result)
//sampleEnd
}
```

```
suspend 함수의 동작 원리

일반 함수:
fun getData() {
    val result = networkCall()    ← 완료될 때까지 스레드 차단!
    updateUI(result)
}

suspend 함수:
suspend fun getData() {
    val result = networkCall()    ← 여기서 "중단" (스레드는 해방)
                                  ← 결과 오면 "재개"
    updateUI(result)
}

┌─────────────────────────────────────────────────────┐
│ 코루틴 실행                                          │
│                                                      │
│  ① 시작 → ② networkCall() → ③ 중단(suspend)         │
│                              ↓                       │
│               스레드는 다른 일을 할 수 있음              │
│                              ↓                       │
│  ⑤ UI 갱신 ← ④ 결과 도착 → 재개(resume)              │
└─────────────────────────────────────────────────────┘
```

### 주의: suspend 함수는 코루틴 안에서만 호출 가능

```kotlin [kotlin-playground]
import kotlinx.coroutines.*

suspend fun fetchUserData(): String {
    delay(1000)
    return "사용자 데이터"
}

// // 컴파일 에러!
// fun main() {
//     val data = fetchUserData()   // 오류: suspend 함수는 코루틴에서만 호출 가능
// }

// 올바른 사용
fun main() = runBlocking {       // 코루틴 스코프 생성
//sampleStart
    val data = fetchUserData()   // OK
    println(data)
//sampleEnd
}
```

---

## 4. CoroutineScope와 빌더: launch, async

### launch: 결과가 필요 없을 때

`launch`는 코루틴을 시작하고 `Job`을 반환합니다. "실행해줘, 결과는 필요 없어"라는 의미입니다.

```kotlin [kotlin-playground]
import kotlinx.coroutines.*

fun main() = runBlocking {
//sampleStart
    println("시작: ${Thread.currentThread().name}")

    val job: Job = launch {
        delay(1000)
        println("코루틴 완료: ${Thread.currentThread().name}")
    }

    println("코루틴 시작됨, 다른 작업 수행 중...")
    job.join()   // 코루틴이 끝날 때까지 대기 (선택사항)
    println("모든 작업 완료")
//sampleEnd
}

// 출력:
// 시작: main
// 코루틴 시작됨, 다른 작업 수행 중...
// (1초 후)
// 코루틴 완료: main
// 모든 작업 완료
```

### async: 결과가 필요할 때

`async`는 코루틴을 시작하고 `Deferred<T>`를 반환합니다. `.await()`로 결과를 받을 수 있습니다.

```kotlin [kotlin-playground]
import kotlinx.coroutines.*

fun main() = runBlocking {
//sampleStart
    val deferred: Deferred<String> = async {
        delay(1000)
        "결과 데이터"
    }

    println("다른 작업 수행 중...")
    val result = deferred.await()   // 결과가 준비될 때까지 대기
    println("결과: $result")
//sampleEnd
}
```

### 병렬 실행

`async`로 여러 작업을 **병렬로** 실행하면 시간을 크게 절약할 수 있습니다.

```kotlin [kotlin-playground]
import kotlinx.coroutines.*

suspend fun fetchUser(): String {
    delay(1000)
    return "사용자 정보"
}

suspend fun fetchPosts(): List<String> {
    delay(1500)
    return listOf("게시물1", "게시물2")
}

fun main() = runBlocking {
//sampleStart
    // 순차 실행: 1000 + 1500 = 2500ms
    val startSeq = System.currentTimeMillis()
    val user1 = fetchUser()
    val posts1 = fetchPosts()
    println("순차: ${System.currentTimeMillis() - startSeq}ms")  // ~2500ms

    // 병렬 실행: max(1000, 1500) = 1500ms
    val startPar = System.currentTimeMillis()
    val userDeferred = async { fetchUser() }
    val postsDeferred = async { fetchPosts() }
    val user2 = userDeferred.await()
    val posts2 = postsDeferred.await()
    println("병렬: ${System.currentTimeMillis() - startPar}ms")  // ~1500ms
//sampleEnd
}
```

```
순차 실행 vs 병렬 실행

순차 실행 (2500ms):
|── fetchUser() ──|── fetchPosts() ─────|
0ms             1000ms                2500ms

병렬 실행 (1500ms):
|── fetchUser() ──|
|── fetchPosts() ─────|
0ms             1000ms 1500ms
                       ↑ 두 결과 모두 사용 가능
```

### launch vs async 비교

| 항목 | `launch` | `async` |
|------|----------|---------|
| 반환 타입 | `Job` | `Deferred<T>` |
| 결과 받기 | 불가 | `.await()` |
| 용도 | 부수 효과 (로깅, UI 갱신) | 결과가 필요한 연산 |
| 예외 처리 | 즉시 전파 | `.await()` 호출 시 전파 |

---

## 5. Dispatchers: 어디서 실행할 것인가

Dispatcher는 코루틴이 **어떤 스레드**에서 실행될지 결정합니다.

| Dispatcher | 스레드 | 용도 | 예시 |
|-----------|--------|------|------|
| `Dispatchers.Main` | 메인(UI) 스레드 | UI 업데이트 | Text 변경, 네비게이션 |
| `Dispatchers.IO` | IO 스레드 풀 | 네트워크, DB, 파일 | API 호출, Room 쿼리 |
| `Dispatchers.Default` | CPU 스레드 풀 | CPU 집약 작업 | JSON 파싱, 정렬, 계산 |
| `Dispatchers.Unconfined` | 호출한 스레드 | 테스트 등 특수 용도 | 거의 사용 안 함 |

```kotlin [compose-playground]
// Dispatcher 사용 예시
suspend fun loadData() {
    // IO 스레드에서 네트워크 호출
    val data = withContext(Dispatchers.IO) {
        apiService.fetchData()
    }

    // Default 스레드에서 데이터 가공
    val processed = withContext(Dispatchers.Default) {
        heavyProcessing(data)
    }

    // Main 스레드에서 UI 업데이트 (Compose에서는 자동)
    withContext(Dispatchers.Main) {
        updateUI(processed)
    }
}
```

```
Dispatcher 흐름도

┌─────────────────────────────────────────────────────┐
│                    Main Thread                       │
│  [UI 갱신]  [터치 처리]  [애니메이션]  [리컴포지션]    │
└──────┬───────────────────────────────────┬───────────┘
       │ withContext(IO)                   ↑ withContext(Main)
       ▼                                   │
┌──────────────────────┐     ┌─────────────┴──────────┐
│     IO Thread Pool   │     │   Default Thread Pool   │
│  [네트워크 요청]      │────→│  [데이터 가공]           │
│  [DB 읽기/쓰기]      │     │  [JSON 파싱]            │
│  [파일 I/O]          │     │  [정렬/계산]            │
└──────────────────────┘     └────────────────────────┘
```

### withContext로 스레드 전환

`withContext`는 코루틴을 **다른 Dispatcher로 전환**합니다. 블록이 끝나면 원래 Dispatcher로 돌아옵니다.

```kotlin [compose-playground]
// Repository에서 자주 사용하는 패턴
class UserRepository(private val api: ApiService) {

    suspend fun getUser(id: Int): User {
        return withContext(Dispatchers.IO) {   // IO 스레드로 전환
            api.fetchUser(id)                   // 네트워크 호출
        }   // 이 블록이 끝나면 원래 Dispatcher로 복귀
    }
}
```

---

## 6. 구조화된 동시성

Kotlin 코루틴의 핵심 원칙은 **구조화된 동시성(Structured Concurrency)** 입니다. 모든 코루틴은 **특정 CoroutineScope에 속하며**, 부모가 취소되면 자식도 함께 취소됩니다.

```kotlin [kotlin-playground]
import kotlinx.coroutines.*

fun main() = runBlocking {       // 부모 스코프
//sampleStart
    launch {                     // 자식 코루틴 1
        delay(500)
        println("자식 1 완료")
    }

    launch {                     // 자식 코루틴 2
        delay(1000)
        println("자식 2 완료")
    }

    println("부모는 모든 자식이 끝날 때까지 기다림")
//sampleEnd
}
// 출력:
// 부모는 모든 자식이 끝날 때까지 기다림
// 자식 1 완료
// 자식 2 완료
```

### 취소 전파

```kotlin [kotlin-playground]
import kotlinx.coroutines.*

fun main() = runBlocking {
//sampleStart
    val parentJob = launch {
        val child1 = launch {
            repeat(1000) { i ->
                println("자식1: $i")
                delay(100)
            }
        }

        val child2 = launch {
            repeat(1000) { i ->
                println("자식2: $i")
                delay(100)
            }
        }
    }

    delay(300)
    parentJob.cancel()   // 부모 취소 → 자식1, 자식2 모두 취소됨!
    println("부모 코루틴 취소됨")
//sampleEnd
}
```

```
구조화된 동시성: 부모-자식 관계

runBlocking (부모)
├── launch (자식 1)
│   └── delay(500)
└── launch (자식 2)
    └── delay(1000)

규칙 1: 부모는 모든 자식이 완료될 때까지 대기
규칙 2: 부모가 취소되면 모든 자식도 취소
규칙 3: 자식에서 예외 발생 시 부모에게 전파

parent.cancel()
├── child1.cancel()  ← 자동 취소
└── child2.cancel()  ← 자동 취소
```

### coroutineScope 빌더

```kotlin [kotlin-playground]
import kotlinx.coroutines.*

suspend fun fetchUser(): String {
    delay(1000)
    return "사용자 정보"
}

suspend fun fetchPosts(): String {
    delay(1500)
    return "게시물 목록"
}

suspend fun fetchAllData(): Pair<String, String> = coroutineScope {
    val user = async { fetchUser() }
    val posts = async { fetchPosts() }

    // 하나라도 실패하면 다른 것도 취소됨
    Pair(user.await(), posts.await())
}

fun main() = runBlocking {
//sampleStart
    val (user, posts) = fetchAllData()
    println("user=$user, posts=$posts")
//sampleEnd
}
```

### Compose에서의 구조화된 동시성

Compose는 각 컴포저블의 수명주기에 맞는 코루틴 스코프를 제공합니다. 컴포저블이 사라지면 코루틴도 자동으로 취소됩니다.

```kotlin [compose-playground]
@Composable
fun MyScreen() {
    // 이 스코프는 MyScreen이 화면에서 사라지면 자동 취소됨
    LaunchedEffect(Unit) {
        val data = fetchData()   // 화면이 사라지면 이것도 취소됨
        // ...
    }
}
```

---

## 7. Flow 기초

`Flow`는 **시간이 지남에 따라 여러 값을 순차적으로 내보내는** 비동기 데이터 스트림입니다. `suspend` 함수가 단일 값을 반환한다면, `Flow`는 여러 값을 반환합니다.

```
suspend 함수 vs Flow

suspend fun fetchUser(): User     ← 단일 값 반환
          ──────────→ User

flow { emit(...) }               ← 여러 값을 시간에 걸쳐 반환
          ──────→ 값1
          ──────→ 값2
          ──────→ 값3
          ──────→ ...
```

### Flow 생성

```kotlin [kotlin-playground]
import kotlinx.coroutines.*
import kotlinx.coroutines.flow.*

// flow 빌더로 생성
fun countDown(): Flow<Int> = flow {
    for (i in 5 downTo 1) {
        delay(1000)     // 1초마다
        emit(i)         // 값을 내보냄
    }
}

fun main() = runBlocking {
//sampleStart
    // 컬렉션을 Flow로 변환
    val numbersFlow: Flow<Int> = listOf(1, 2, 3, 4, 5).asFlow()

    // flowOf로 직접 생성
    val greetingFlow: Flow<String> = flowOf("Hello", "World", "Kotlin")

    numbersFlow.collect { print("$it ") }
    println()
    greetingFlow.collect { print("$it ") }
//sampleEnd
}
```

### Flow 수집 (collect)

Flow는 **cold stream**입니다. `collect`를 호출해야 비로소 실행이 시작됩니다.

```kotlin [kotlin-playground]
import kotlinx.coroutines.*
import kotlinx.coroutines.flow.*

fun countDown(): Flow<Int> = flow {
    for (i in 5 downTo 1) {
        delay(1000)
        emit(i)
    }
}

fun main() = runBlocking {
//sampleStart
    countDown().collect { value ->
        println("카운트다운: $value")
    }
//sampleEnd
}
// 출력 (1초 간격):
// 카운트다운: 5
// 카운트다운: 4
// 카운트다운: 3
// 카운트다운: 2
// 카운트다운: 1
```

### Flow 연산자

```kotlin [kotlin-playground]
import kotlinx.coroutines.*
import kotlinx.coroutines.flow.*

fun main() = runBlocking {
//sampleStart
    val numbers = flow {
        for (i in 1..10) {
            delay(100)
            emit(i)
        }
    }

    // map: 값 변환
    println("=== map ===")
    numbers.map { it * it }
        .collect { print("$it ") }   // 1, 4, 9, 16, ...
    println()

    // filter: 조건에 맞는 값만
    println("=== filter ===")
    numbers.filter { it % 2 == 0 }
        .collect { print("$it ") }   // 2, 4, 6, 8, 10
    println()

    // take: 처음 N개만
    println("=== take ===")
    numbers.take(3)
        .collect { print("$it ") }   // 1, 2, 3
    println()

    // 체이닝
    println("=== chaining ===")
    numbers
        .filter { it % 2 == 0 }    // 짝수만
        .map { it * 10 }           // 10배
        .take(3)                   // 처음 3개만
        .collect { print("$it ") }   // 20, 40, 60
//sampleEnd
}
```

```
Flow 연산자 체이닝

emit: 1, 2, 3, 4, 5, 6, 7, 8, 9, 10
        │
  filter { it % 2 == 0 }
        │
      2, 4, 6, 8, 10
        │
  map { it * 10 }
        │
     20, 40, 60, 80, 100
        │
  take(3)
        │
     20, 40, 60
        │
  collect { println(it) }
```

### 실전 예제: 검색 자동완성

```kotlin [compose-playground]
fun searchFlow(query: Flow<String>): Flow<List<String>> {
    return query
        .debounce(300)           // 300ms 동안 추가 입력 없으면 진행
        .filter { it.length >= 2 } // 2글자 이상만
        .distinctUntilChanged()  // 같은 쿼리 중복 방지
        .map { searchQuery ->
            searchApi.search(searchQuery)  // API 호출
        }
}
```

---

## 8. StateFlow와 SharedFlow

### StateFlow

`StateFlow`는 **현재 상태 값을 항상 가지고 있는** Flow입니다. 새 구독자가 오면 즉시 최신 값을 받습니다.

```kotlin [compose-playground]
class CounterViewModel : ViewModel() {
    // MutableStateFlow: 내부에서 값 변경
    private val _count = MutableStateFlow(0)

    // StateFlow: 외부에 읽기 전용으로 노출
    val count: StateFlow<Int> = _count.asStateFlow()

    fun increment() {
        _count.value++
        // 또는 _count.update { it + 1 }  (thread-safe)
    }
}
```

### SharedFlow

`SharedFlow`는 **여러 구독자에게 이벤트를 브로드캐스트**하는 Flow입니다. 일회성 이벤트(스낵바, 네비게이션)에 적합합니다.

```kotlin [compose-playground]
class EventViewModel : ViewModel() {
    private val _events = MutableSharedFlow<UiEvent>()
    val events: SharedFlow<UiEvent> = _events.asSharedFlow()

    fun showMessage(message: String) {
        viewModelScope.launch {
            _events.emit(UiEvent.ShowSnackbar(message))
        }
    }
}

sealed class UiEvent {
    data class ShowSnackbar(val message: String) : UiEvent()
    data class Navigate(val route: String) : UiEvent()
}
```

### StateFlow vs SharedFlow 비교

| 항목 | StateFlow | SharedFlow |
|------|-----------|------------|
| 초기값 | 필수 | 불필요 |
| 최신 값 보유 | O (`.value`로 접근) | X |
| 새 구독자 | 즉시 최신 값 수신 | 구독 후 발생하는 값만 수신 |
| 중복 값 | 같은 값이면 무시 | 모든 값 전달 |
| 용도 | UI 상태 | 일회성 이벤트 |

```
StateFlow vs SharedFlow

StateFlow (상태):
  초기값: 0
  ┌───┐   ┌───┐   ┌───┐   ┌───┐
  │ 0 │──→│ 1 │──→│ 2 │──→│ 3 │  ← 항상 최신 값(3)을 가짐
  └───┘   └───┘   └───┘   └───┘
                              ↑
                    새 구독자가 오면 즉시 3을 받음

SharedFlow (이벤트):
  ┌─────────┐   ┌─────────┐   ┌─────────┐
  │ Snackbar│──→│Navigate │──→│Snackbar │  ← 지나간 이벤트는 사라짐
  └─────────┘   └─────────┘   └─────────┘
                                    ↑
                     새 구독자는 이후 이벤트만 받음
```

---

## 9. Compose에서의 활용 종합

Compose는 코루틴을 **일급 시민**으로 지원합니다. 핵심 API 3가지를 알아봅니다.

### LaunchedEffect: 컴포저블의 코루틴

`LaunchedEffect`는 컴포저블이 **처음 Composition에 진입할 때** 코루틴을 시작합니다. key가 변경되면 기존 코루틴을 취소하고 새로 시작합니다.

```kotlin [compose-playground]
@Composable
fun TimerScreen() {
    var seconds by remember { mutableIntStateOf(0) }

    // 이 컴포저블이 화면에 있는 동안 타이머 실행
    LaunchedEffect(Unit) {   // Unit = 리컴포지션 시 재시작하지 않음
        while (true) {
            delay(1000)
            seconds++
        }
    }   // 화면에서 사라지면 자동으로 취소됨!

    Text("경과 시간: ${seconds}초")
}

// key가 변경되면 코루틴 재시작
@Composable
fun UserDetailScreen(userId: String) {
    var user by remember { mutableStateOf<User?>(null) }

    LaunchedEffect(userId) {   // userId가 바뀌면 재시작
        user = repository.fetchUser(userId)
    }

    user?.let { UserProfile(it) }
}
```

```
LaunchedEffect 생명주기

Composition 진입                    Composition 이탈
      │                                  │
      ▼                                  ▼
┌─────────────────────────────────────────┐
│        LaunchedEffect(key) {            │
│            코루틴 실행 중...             │──→ 자동 취소!
│        }                                │
└─────────────────────────────────────────┘

key 변경 시:
┌──────────────┐     ┌──────────────┐
│ 기존 코루틴   │──→  │ 새 코루틴     │
│ 취소!         │     │ 시작!         │
└──────────────┘     └──────────────┘
```

### rememberCoroutineScope: 이벤트에서 코루틴 실행

`rememberCoroutineScope`는 **사용자 이벤트(클릭 등)** 에 반응하여 코루틴을 시작할 때 사용합니다.

```kotlin [compose-playground]
@Composable
fun SaveButton(data: String) {
    val scope = rememberCoroutineScope()
    val snackbarHostState = remember { SnackbarHostState() }

    Button(
        onClick = {
            // onClick은 suspend 함수가 아니므로 scope.launch 필요
            scope.launch {
                try {
                    repository.save(data)
                    snackbarHostState.showSnackbar("저장 완료!")
                } catch (e: Exception) {
                    snackbarHostState.showSnackbar("저장 실패: ${e.message}")
                }
            }
        }
    ) {
        Text("저장")
    }
}
```

### collectAsState: Flow를 Compose 상태로 변환

`collectAsState`는 Flow를 Compose의 `State`로 변환합니다. Flow에서 새 값이 나오면 자동으로 리컴포지션이 발생합니다.

```kotlin [compose-playground]
@Composable
fun CounterScreen(viewModel: CounterViewModel) {
    // StateFlow → Compose State로 변환
    val count by viewModel.count.collectAsState()

    Column {
        Text("카운트: $count", fontSize = 24.sp)
        Button(onClick = { viewModel.increment() }) {
            Text("증가")
        }
    }
}

// collectAsStateWithLifecycle (권장)
// androidx.lifecycle:lifecycle-runtime-compose 라이브러리 필요 (Compose BOM에 포함)
// Lifecycle을 인식하여 앱이 백그라운드일 때 수집을 중단합니다.
@Composable
fun UserListScreen(viewModel: UserViewModel) {
    val users by viewModel.users.collectAsStateWithLifecycle()

    LazyColumn {
        items(users) { user ->
            Text(user.name)
        }
    }
}
```

### LaunchedEffect vs rememberCoroutineScope 비교

| 항목 | `LaunchedEffect` | `rememberCoroutineScope` |
|------|-------------------|-------------------------|
| 실행 시점 | Composition 진입 시 자동 | 이벤트 핸들러에서 수동 |
| 취소 시점 | Composition 이탈 시 자동 | Composition 이탈 시 자동 |
| key 변경 | 재시작됨 | 해당 없음 |
| 용도 | 데이터 로딩, 타이머, 관찰 | 버튼 클릭, 스낵바 표시 |

### 종합 예제: 실전 패턴

```kotlin [compose-playground]
@Composable
fun ProductListScreen(
    viewModel: ProductViewModel = viewModel()
) {
    // 1. StateFlow → State 변환
    val uiState by viewModel.uiState.collectAsStateWithLifecycle()

    // 2. 일회성 이벤트 처리
    val snackbarHostState = remember { SnackbarHostState() }
    LaunchedEffect(Unit) {
        viewModel.events.collect { event ->
            when (event) {
                is UiEvent.ShowSnackbar ->
                    snackbarHostState.showSnackbar(event.message)
                is UiEvent.Navigate ->
                    { /* 네비게이션 처리 */ }
            }
        }
    }

    // 3. 사용자 이벤트에서 코루틴
    val scope = rememberCoroutineScope()

    Scaffold(snackbarHost = { SnackbarHost(snackbarHostState) }) { padding ->
        when (val state = uiState) {
            is ScreenState.Loading ->
                CircularProgressIndicator(Modifier.padding(padding))

            is ScreenState.Success ->
                LazyColumn(Modifier.padding(padding)) {
                    items(state.items) { product ->
                        ProductCard(
                            product = product,
                            onAddToCart = {
                                scope.launch {
                                    viewModel.addToCart(product)
                                }
                            }
                        )
                    }
                }

            is ScreenState.Error ->
                ErrorView(
                    message = state.throwable.message ?: "오류 발생",
                    onRetry = { viewModel.refresh() }
                )
        }
    }
}
```

```
Compose에서 코루틴 활용 전체 흐름

ViewModel                          Composable
┌────────────────────┐            ┌────────────────────────┐
│                    │            │                        │
│  StateFlow<State>  │──collect──→│  collectAsState()      │
│     _uiState       │   AsState  │     → UI 렌더링        │
│                    │            │                        │
│  SharedFlow<Event> │──Launched─→│  LaunchedEffect {      │
│     _events        │   Effect   │    events.collect {}   │
│                    │            │  }                     │
│                    │            │                        │
│  suspend fun       │←─scope───│  Button(onClick = {    │
│    addToCart()      │  .launch   │    scope.launch {     │
│                    │            │      addToCart()       │
│                    │            │    }                   │
│                    │            │  })                    │
└────────────────────┘            └────────────────────────┘
```

---

## 10. 퀴즈: 실습 체크리스트

다음 항목들을 직접 코드로 작성해보며 확인하세요.

- [ ] 왜 메인 스레드에서 네트워크 요청을 하면 안 되는지 설명할 수 있다
- [ ] `suspend` 함수를 선언하고 코루틴 안에서 호출할 수 있다
- [ ] `launch`와 `async`의 차이를 설명하고 적절한 상황에 사용할 수 있다
- [ ] `async`를 사용하여 두 개의 네트워크 요청을 병렬로 실행할 수 있다
- [ ] `Dispatchers.Main`, `IO`, `Default`의 용도를 설명하고 `withContext`로 전환할 수 있다
- [ ] 구조화된 동시성의 부모-자식 관계와 취소 전파를 설명할 수 있다
- [ ] `flow` 빌더로 Flow를 생성하고 `collect`로 수집할 수 있다
- [ ] Flow에 `map`, `filter`, `take` 연산자를 적용할 수 있다
- [ ] `StateFlow`와 `SharedFlow`의 차이를 설명하고 적절한 상황에 사용할 수 있다
- [ ] `LaunchedEffect`를 사용하여 컴포저블에서 비동기 작업을 수행할 수 있다
- [ ] `rememberCoroutineScope`로 이벤트 핸들러에서 코루틴을 시작할 수 있다
- [ ] `collectAsState`로 Flow를 Compose State로 변환하여 UI에 반영할 수 있다
- [ ] ViewModel의 StateFlow를 Compose에서 관찰하는 전체 패턴을 구현할 수 있다

> **Phase 0 완료!** Kotlin의 기초 문법, 함수형 프로그래밍, 코루틴을 모두 학습했습니다.
> **다음 단계**: [Phase 1: Compose 시작하기](../phase-01-compose-introduction/01-declarative-ui-and-compose.md)에서 본격적으로 Jetpack Compose를 시작합니다.
