# State와 remember 완전 가이드

> "Compose에서 상태(State)는 시간이 지남에 따라 변할 수 있는 모든 값이다. 상태가 변하면 UI가 자동으로 업데이트된다."
> — Android 공식 문서

---

## 목차

1. [상태(State)란 무엇인가?](#1-상태state란-무엇인가)
2. [왜 일반 변수는 작동하지 않는가](#2-왜-일반-변수는-작동하지-않는가)
3. [mutableStateOf와 remember](#3-mutablestateof와-remember)
4. [상태 선언의 3가지 방식](#4-상태-선언의-3가지-방식)
5. [remember의 키(Key) 메커니즘](#5-remember의-키key-메커니즘)
6. [rememberSaveable — 구성 변경에도 살아남는 상태](#6-remembersaveable--구성-변경에도-살아남는-상태)
7. [Parcelize, MapSaver, ListSaver](#7-parcelize-mapsaver-listsaver)
8. [관찰 가능한 타입 변환](#8-관찰-가능한-타입-변환)
9. [주의: 변경 가능하지만 관찰 불가능한 객체](#9-주의-변경-가능하지만-관찰-불가능한-객체)

---

## 1. 상태(State)란 무엇인가?

**상태(State)** 란 시간이 지남에 따라 변할 수 있는 모든 값을 의미합니다. Compose에서 상태가 변경되면 해당 상태를 읽는 컴포저블이 자동으로 **리컴포지션(recomposition)** 되어 화면이 업데이트됩니다.

앱에서 상태의 예시:
- 채팅 앱에서 가장 최근 수신된 메시지
- 사용자 프로필 사진
- TextField에 입력된 텍스트
- 리스트의 스크롤 위치
- 체크박스의 체크 여부

> **핵심 원리**: Compose는 **선언형 UI**입니다. UI를 업데이트하는 유일한 방법은 새로운 상태로 같은 컴포저블을 다시 호출(리컴포지션)하는 것입니다.

---

## 2. 왜 일반 변수는 작동하지 않는가

Compose를 처음 접하면 가장 먼저 시도하는 것이 일반 변수를 사용하는 것입니다. 하지만 이 방법은 작동하지 않습니다.

### 일반 변수 사용 시도

```kotlin [compose-playground]
// ❌ 잘못된 예: 일반 변수는 리컴포지션을 트리거하지 않는다
@Composable
fun BrokenCounter() {
    var count = 0 // 리컴포지션마다 0으로 초기화됨!

    Column(horizontalAlignment = Alignment.CenterHorizontally) {
        Text(text = "클릭 횟수: $count")
        Button(onClick = { count++ }) { // count가 변해도 UI가 갱신되지 않음
            Text("증가")
        }
    }
}
```

**왜 작동하지 않을까요?** 두 가지 이유가 있습니다:

1. **리컴포지션 트리거 불가**: 일반 변수의 변경은 Compose가 감지할 수 없으므로 리컴포지션이 발생하지 않습니다.
2. **리컴포지션 시 초기화**: 설령 리컴포지션이 발생하더라도, `var count = 0`이 다시 실행되어 값이 0으로 돌아갑니다.

이 두 가지 문제를 해결하려면:
- `mutableStateOf` : Compose가 상태 변경을 감지하게 한다 (문제 1 해결)
- `remember` : 리컴포지션 사이에 값을 유지한다 (문제 2 해결)

---

## 3. mutableStateOf와 remember

### mutableStateOf

`mutableStateOf`는 Compose에서 관찰 가능한(observable) 상태를 생성합니다. 이 상태의 `value`가 변경되면 해당 값을 읽고 있는 모든 컴포저블이 자동으로 리컴포지션됩니다.

```kotlin [compose-playground]
fun main() {
//sampleStart
    val count = mutableStateOf(0) // MutableState<Int> 생성
    count.value = 1               // value를 변경하면 리컴포지션 트리거
//sampleEnd
}
```

### remember

`remember`는 컴포지션에 객체를 저장하고, 리컴포지션 사이에 값을 유지합니다. `remember`가 없으면 리컴포지션마다 새로운 `MutableState` 인스턴스가 생성됩니다.

```kotlin [compose-playground]
// ✅ 올바른 예: mutableStateOf + remember 함께 사용
@Composable
fun WorkingCounter() {
    val count = remember { mutableStateOf(0) }

    Column(horizontalAlignment = Alignment.CenterHorizontally) {
        Text(text = "클릭 횟수: ${count.value}")
        Button(onClick = { count.value++ }) {
            Text("증가")
        }
    }
}
```

> **비유**: `mutableStateOf`는 "변경을 알려주는 알림 시스템"이고, `remember`는 "리컴포지션 사이에 값을 보관하는 금고"입니다. 둘 다 있어야 제대로 작동합니다.

---

## 4. 상태 선언의 3가지 방식

Compose에서 `MutableState<T>`를 선언하는 방법은 3가지입니다. 모두 동일하게 동작하며, 코드 가독성을 위해 선택합니다.

### 방식 1: 직접 사용 (value 프로퍼티 접근)

```kotlin [compose-playground]
@Composable
fun DirectUsage() {
    val count = remember { mutableStateOf(0) }

    Text(text = "Count: ${count.value}")     // .value로 읽기
    Button(onClick = { count.value++ }) {    // .value로 쓰기
        Text("증가")
    }
}
```

### 방식 2: by 위임 (프로퍼티 위임) — 가장 권장

```kotlin [compose-playground]
import androidx.compose.runtime.getValue
import androidx.compose.runtime.setValue

@Composable
fun DelegatedUsage() {
    var count by remember { mutableStateOf(0) }

    Text(text = "Count: $count")       // .value 없이 직접 읽기
    Button(onClick = { count++ }) {    // .value 없이 직접 쓰기
        Text("증가")
    }
}
```

> **주의**: `by` 위임을 사용하려면 `getValue`와 `setValue` import가 필요합니다. 또한 `val`이 아닌 `var`로 선언해야 합니다.

### 방식 3: 구조분해 (Destructuring)

```kotlin [compose-playground]
@Composable
fun DestructuredUsage() {
    val (count, setCount) = remember { mutableStateOf(0) }

    Text(text = "Count: $count")                // 첫 번째: 현재 값
    Button(onClick = { setCount(count + 1) }) { // 두 번째: 값 설정 함수
        Text("증가")
    }
}
```

### 3가지 방식 비교

| 방식 | 선언 | 읽기 | 쓰기 | 특징 |
|------|------|------|------|------|
| 직접 사용 | `val state = remember { mutableStateOf(0) }` | `state.value` | `state.value = x` | 명시적이지만 `.value` 반복 |
| by 위임 | `var state by remember { mutableStateOf(0) }` | `state` | `state = x` | 가장 깔끔, **권장** |
| 구조분해 | `val (state, setState) = remember { mutableStateOf(0) }` | `state` | `setState(x)` | setter 분리 시 유용 |

---

## 5. remember의 키(Key) 메커니즘

`remember`는 선택적으로 **키(key)** 를 받을 수 있습니다. 키가 변경되면 기존 값을 버리고 계산 블록을 다시 실행합니다.

```kotlin [compose-playground]
@Composable
fun FormattedText(input: String) {
    // input이 변경될 때만 format 재계산
    val formatted = remember(input) {
        // 비용이 큰 변환 작업
        expensiveFormatting(input)
    }
    Text(text = formatted)
}
```

### 여러 키 사용

```kotlin [compose-playground]
@Composable
fun UserGreeting(firstName: String, lastName: String) {
    // firstName 또는 lastName 중 하나라도 변경되면 재계산
    val greeting = remember(firstName, lastName) {
        "안녕하세요, $lastName$firstName님!"
    }
    Text(text = greeting)
}
```

### 키 메커니즘 활용 예

```kotlin [compose-playground]
// ❌ 잘못된 예: 사용자가 바뀌어도 이전 상태가 남아있음
@Composable
fun UserProfile(userId: String) {
    var isEditing by remember { mutableStateOf(false) }
    // userId가 변경되어도 isEditing은 이전 값 유지 (의도치 않은 동작)
}

// ✅ 올바른 예: 사용자가 바뀌면 편집 상태 초기화
@Composable
fun UserProfile(userId: String) {
    var isEditing by remember(userId) { mutableStateOf(false) }
    // userId가 변경되면 isEditing이 false로 리셋됨
}
```

---

## 6. rememberSaveable — 구성 변경에도 살아남는 상태

`remember`는 **리컴포지션** 사이에 상태를 유지하지만, **구성 변경(Configuration Change)** 시에는 상태가 사라집니다.

> **구성 변경이란?** 화면 회전, 다크 모드 전환, 언어 변경 등 액티비티가 재생성되는 상황을 말합니다.

```kotlin [compose-playground]
// ❌ 잘못된 예: 화면을 회전하면 count가 0으로 리셋됨
@Composable
fun FragileCounter() {
    var count by remember { mutableStateOf(0) }
    Text("Count: $count")
}

// ✅ 올바른 예: 화면을 회전해도 count가 유지됨
@Composable
fun RobustCounter() {
    var count by rememberSaveable { mutableStateOf(0) }
    Text("Count: $count")
}
```

### remember vs rememberSaveable 비교

| 특성 | `remember` | `rememberSaveable` |
|------|-----------|-------------------|
| 리컴포지션 시 유지 | O | O |
| 구성 변경 시 유지 | X | O |
| 프로세스 종료 후 복원 | X | O |
| 내부 메커니즘 | Composition에 저장 | `Bundle`에 저장 |
| 저장 가능 타입 | 모든 타입 | Bundle에 넣을 수 있는 타입 |

> **언제 rememberSaveable을 쓸까?** 사용자 입력값, 스크롤 위치, 선택 상태 등 구성 변경 후에도 유지되어야 하는 UI 상태에 사용합니다.

`rememberSaveable`은 `Bundle`에 저장할 수 있는 타입을 자동으로 처리합니다:
- 기본 타입: `Int`, `Long`, `Float`, `Double`, `Boolean`, `String` 등
- 그 외 커스텀 타입은 **Parcelize**, **MapSaver**, **ListSaver**를 사용해야 합니다.

---

## 7. Parcelize, MapSaver, ListSaver

커스텀 객체를 `rememberSaveable`에 저장하려면 직렬화 방법을 지정해야 합니다.

### 방법 1: @Parcelize (가장 간편)

```kotlin [compose-playground]
// build.gradle.kts에 플러그인 추가 필요
// plugins { id("kotlin-parcelize") }

@Parcelize
data class City(
    val name: String,
    val country: String,
    val population: Long
) : Parcelable

@Composable
fun CityScreen() {
    var selectedCity by rememberSaveable {
        mutableStateOf(City("서울", "대한민국", 9_700_000))
    }
    Text("선택된 도시: ${selectedCity.name}")
}
```

### 방법 2: MapSaver (Parcelable 구현 없이)

`mapSaver`는 객체를 `Map<String, Any>`로 변환하여 저장합니다.

```kotlin [compose-playground]
data class City(
    val name: String,
    val country: String,
    val population: Long
)

val CitySaver = mapSaver(
    save = { city ->
        mapOf(
            "name" to city.name,
            "country" to city.country,
            "population" to city.population
        )
    },
    restore = { map ->
        City(
            name = map["name"] as String,
            country = map["country"] as String,
            population = map["population"] as Long
        )
    }
)

@Composable
fun CityScreen() {
    var selectedCity by rememberSaveable(stateSaver = CitySaver) {
        mutableStateOf(City("서울", "대한민국", 9_700_000))
    }
    Text("선택된 도시: ${selectedCity.name}")
}
```

### 방법 3: ListSaver (리스트로 변환)

`listSaver`는 객체를 `List<Any>`로 변환하여 저장합니다. 필드 순서가 명확할 때 `mapSaver`보다 간결합니다.

```kotlin [compose-playground]
val CitySaver = listSaver(
    save = { city ->
        listOf(city.name, city.country, city.population)
    },
    restore = { list ->
        City(
            name = list[0] as String,
            country = list[1] as String,
            population = list[2] as Long
        )
    }
)

@Composable
fun CityScreen() {
    var selectedCity by rememberSaveable(stateSaver = CitySaver) {
        mutableStateOf(City("서울", "대한민국", 9_700_000))
    }
    Text("선택된 도시: ${selectedCity.name}")
}
```

### 3가지 Saver 비교

| 방법 | 장점 | 단점 | 사용 시점 |
|------|------|------|----------|
| `@Parcelize` | 가장 간편, 보일러플레이트 없음 | Android 의존적, 플러그인 필요 | 프로젝트에서 Parcelize 이미 사용 중일 때 |
| `mapSaver` | 키 이름으로 명시적 | 코드가 다소 긴 편 | 필드가 많은 객체 |
| `listSaver` | 간결함 | 순서에 의존적 | 필드가 적은 단순 객체 |

---

## 8. 관찰 가능한 타입 변환

Compose에서 리컴포지션을 트리거하려면 `State<T>` 타입이 필요합니다. Kotlin의 `Flow`나 Android의 `LiveData` 같은 관찰 가능한 타입을 `State`로 변환하는 확장 함수가 제공됩니다.

### Flow -> collectAsState

```kotlin [compose-playground]
// ViewModel에서 Flow 노출
class MyViewModel : ViewModel() {
    val userNames: Flow<List<String>> = repository.getUserNames()
}

// Composable에서 State로 변환하여 관찰
@Composable
fun UserList(viewModel: MyViewModel) {
    val names by viewModel.userNames.collectAsState(initial = emptyList())

    LazyColumn {
        items(names) { name ->
            Text(text = name)
        }
    }
}
```

### StateFlow -> collectAsStateWithLifecycle (강력 권장)

```kotlin [compose-playground]
// ✅ 강력 권장: 수명주기를 인식하여 불필요한 리소스 낭비 방지
// build.gradle.kts에 추가:
// implementation("androidx.lifecycle:lifecycle-runtime-compose:2.10.0")

@Composable
fun UserList(viewModel: MyViewModel) {
    val uiState by viewModel.uiState.collectAsStateWithLifecycle()
    // 앱이 백그라운드로 가면 자동으로 수집 중단
}
```

> **Lifecycle 2.10.0 업데이트**: `collectAsStateWithLifecycle`은 이제 Flow를 Compose에서 관찰할 때 **강력히 권장(strongly recommended)** 되는 방식입니다. `collectAsState` 대신 항상 `collectAsStateWithLifecycle`을 사용하세요.

### LiveData -> observeAsState

```kotlin [compose-playground]
// 기존 LiveData를 사용하는 경우
// build.gradle.kts에 추가:
// implementation("androidx.compose.runtime:runtime-livedata")

@Composable
fun UserList(viewModel: MyViewModel) {
    val names by viewModel.userNames.observeAsState(initial = emptyList())

    LazyColumn {
        items(names) { name ->
            Text(text = name)
        }
    }
}
```

> **권장 사항**: 새 프로젝트에서는 `LiveData` 대신 `StateFlow`를 사용하고, `collectAsStateWithLifecycle()`로 관찰하세요. 수명주기를 인식하여 앱이 백그라운드에 있을 때 불필요한 업데이트를 방지합니다.

---

## 8-1. TextFieldState — 새로운 텍스트 필드 상태 관리 (M3 1.4.0+)

Material3 1.4.0부터 `TextField`에 새로운 상태 관리 패턴인 `TextFieldState`가 도입되었습니다. 기존의 `remember { mutableStateOf("") }` + `value`/`onValueChange` 패턴을 대체합니다.

### 기존 방식 vs TextFieldState 비교

```kotlin [compose-playground]
// ❌ 기존 방식: value + onValueChange 패턴
@Composable
fun OldTextField() {
    var text by remember { mutableStateOf("") }
    TextField(
        value = text,
        onValueChange = { text = it }
    )
}

// ✅ 새로운 방식: TextFieldState 사용
@Composable
fun NewTextField() {
    val textFieldState = rememberTextFieldState()
    TextField(state = textFieldState)
}
```

### TextFieldState의 장점

`TextFieldState`는 텍스트, 선택(selection), 조합(composition) 상태를 하나의 객체로 캡슐화합니다.

```kotlin [compose-playground]
@Composable
fun SearchBar() {
    val searchState = rememberTextFieldState()

    TextField(state = searchState)

    // 현재 텍스트 값 접근
    Text("입력된 텍스트: ${searchState.text}")
}
```

- `rememberTextFieldState()`로 생성하며, `remember { mutableStateOf("") }`가 더 이상 필요하지 않습니다
- 텍스트, 선택 범위, IME 조합 상태를 모두 포함합니다
- UI 의존성이 없으므로 ViewModel에서도 생성 및 보유할 수 있습니다 (상태 호이스팅에 유리)

> **참고**: 기존 `value`/`onValueChange` 기반 `TextField`도 계속 사용 가능하지만, 새로운 코드에서는 `TextFieldState` 패턴이 권장됩니다.

---

## 9. 주의: 변경 가능하지만 관찰 불가능한 객체

Compose에서 가장 흔한 실수 중 하나는 **변경 가능하지만 관찰 불가능한(mutable but not observable)** 객체를 상태로 사용하는 것입니다.

### 문제: mutableListOf를 직접 변경

```kotlin [compose-playground]
// ❌ 잘못된 예: mutableListOf는 관찰 불가능!
@Composable
fun BrokenTodoList() {
    val items = remember { mutableListOf("할일 1", "할일 2") }

    Column {
        items.forEach { item ->
            Text(text = item)
        }
        Button(onClick = {
            items.add("할일 ${items.size + 1}") // 리스트가 변해도 UI 갱신 안 됨!
        }) {
            Text("추가")
        }
    }
}
```

`mutableListOf`로 생성한 리스트를 변경해도 Compose는 이를 감지할 수 없습니다. 리스트 내용은 바뀌었지만 리컴포지션이 발생하지 않아 화면은 그대로입니다.

### 해결 방법 1: 불변 리스트 + State

```kotlin [compose-playground]
// ✅ 올바른 예: 불변 리스트를 State로 감싸기
@Composable
fun WorkingTodoList() {
    var items by remember { mutableStateOf(listOf("할일 1", "할일 2")) }

    Column {
        items.forEach { item ->
            Text(text = item)
        }
        Button(onClick = {
            items = items + "할일 ${items.size + 1}" // 새 리스트 할당 → 리컴포지션 트리거
        }) {
            Text("추가")
        }
    }
}
```

### 해결 방법 2: mutableStateListOf (Compose 전용)

```kotlin [compose-playground]
// ✅ 올바른 예: Compose가 제공하는 관찰 가능한 리스트
@Composable
fun WorkingTodoListV2() {
    val items = remember { mutableStateListOf("할일 1", "할일 2") }

    Column {
        items.forEach { item ->
            Text(text = item)
        }
        Button(onClick = {
            items.add("할일 ${items.size + 1}") // add/remove 모두 리컴포지션 트리거
        }) {
            Text("추가")
        }
    }
}
```

### 관찰 불가능한 객체 정리

| 타입 | 관찰 가능 여부 | Compose에서 사용 가능 |
|------|:---:|:---:|
| `mutableListOf()` | X | `mutableStateListOf()`로 대체 |
| `mutableMapOf()` | X | `mutableStateMapOf()`로 대체 |
| `ArrayList()` | X | `mutableStateListOf()`로 대체 |
| `data class` 인스턴스 (같은 참조에 필드 변경) | X | 새 인스턴스 생성 (`copy()`) |
| `mutableStateOf()` | O | 그대로 사용 |
| `mutableStateListOf()` | O | 그대로 사용 |
| `mutableStateMapOf()` | O | 그대로 사용 |

```kotlin [compose-playground]
// ❌ data class 필드를 직접 변경 (관찰 불가)
data class User(var name: String, var age: Int)

@Composable
fun BrokenUserProfile() {
    val user = remember { mutableStateOf(User("Kim", 25)) }
    Button(onClick = {
        user.value.name = "Lee" // 같은 참조 내부 변경 → Compose가 감지 못함!
    }) {
        Text(user.value.name)
    }
}

// ✅ copy()로 새 인스턴스 생성
data class User(val name: String, val age: Int) // val로 불변 필드 선언

@Composable
fun WorkingUserProfile() {
    var user by remember { mutableStateOf(User("Kim", 25)) }
    Button(onClick = {
        user = user.copy(name = "Lee") // 새 인스턴스 → State 변경 감지!
    }) {
        Text(user.name)
    }
}
```

---

> **다음 문서**: [02. 상태 호이스팅과 단방향 데이터 흐름](02-state-hoisting-and-udf.md)에서 상태를 어디에 배치하고 어떻게 관리할지 알아봅니다.
