# Compose 수명주기와 리컴포지션

> **"상태가 변하면, Compose가 알아서 다시 그린다."**
>
> 리컴포지션(Recomposition)은 Compose의 핵심 메커니즘입니다.
> 이 문서에서는 컴포저블의 수명주기, 리컴포지션이 발생하는 조건,
> 그리고 효율적인 리컴포지션을 위해 알아야 할 규칙들을 배웁니다.

---

## 목차

1. [컴포저블 수명주기](#1-컴포저블-수명주기)
2. [리컴포지션 트리거 조건](#2-리컴포지션-트리거-조건)
3. [스마트 리컴포지션](#3-스마트-리컴포지션)
4. [호출 사이트와 인스턴스 식별](#4-호출-사이트와-인스턴스-식별)
5. [key 컴포저블로 리스트 항목 식별](#5-key-컴포저블로-리스트-항목-식별)
6. [리컴포지션의 특성](#6-리컴포지션의-특성)
7. [부수 효과를 피해야 하는 이유](#7-부수-효과를-피해야-하는-이유)
8. [정리](#8-정리)

---

## 1. 컴포저블 수명주기

모든 Composable은 세 단계의 수명주기를 가집니다.

```
┌─────────────────────────────────────────────────────────────┐
│              컴포저블 수명주기                                  │
│                                                             │
│                ┌───────────────┐                             │
│                │ 초기 컴포지션  │                              │
│                │ (Initial      │                             │
│                │  Composition) │                             │
│                └───────┬───────┘                             │
│                        │                                    │
│                        ▼                                    │
│                ┌───────────────┐     상태 변경                │
│           ┌───→│ 리컴포지션    │────────┐                     │
│           │    │ (Recomposition)│       │                    │
│           │    │  0회 이상 반복 │       │                     │
│           │    └───────┬───────┘       │                    │
│           │            │               │                    │
│           └────────────┘               │                    │
│                        │ 더 이상 필요 없음                    │
│                        ▼                                    │
│                ┌───────────────┐                             │
│                │ 컴포지션 종료  │                              │
│                │ (Leave        │                             │
│                │  Composition) │                             │
│                └───────────────┘                             │
│                                                             │
│  1. 초기 컴포지션: 처음으로 UI 트리에 추가될 때                   │
│  2. 리컴포지션: 상태 변경으로 UI를 다시 그릴 때 (0회 이상)         │
│  3. 컴포지션 종료: UI 트리에서 제거될 때                          │
└─────────────────────────────────────────────────────────────┘
```

### 실제 코드로 이해하기

```kotlin [compose-playground]
@Composable
fun ToggleMessage() {
    var showMessage by remember { mutableStateOf(true) }

    Column {
        Button(onClick = { showMessage = !showMessage }) {
            Text("토글")
        }

        if (showMessage) {
            // showMessage가 true일 때:
            //   → 처음: 초기 컴포지션 (UI 트리에 추가)
            //   → 이후: 리컴포지션 (상태 변경 시 다시 그림)
            // showMessage가 false가 되면:
            //   → 컴포지션 종료 (UI 트리에서 제거)
            MessageCard(text = "안녕하세요!")
        }
    }
}

@Composable
fun MessageCard(text: String) {
    Text(
        text = text,
        modifier = Modifier.padding(16.dp)
    )
}
```

```
시나리오 흐름:

1. 앱 시작 → showMessage = true
   → MessageCard 초기 컴포지션 ✅

2. "토글" 클릭 → showMessage = false
   → MessageCard 컴포지션 종료 ❌

3. "토글" 다시 클릭 → showMessage = true
   → MessageCard 다시 초기 컴포지션 ✅ (새 인스턴스!)
```

> **핵심**: 컴포지션을 떠났다가 다시 들어오면 **새로운 인스턴스**가 생성됩니다.
> `remember`로 저장한 상태도 초기화됩니다.

---

## 2. 리컴포지션 트리거 조건

### 리컴포지션은 언제 발생하는가?

리컴포지션의 트리거는 단 하나입니다: **State 객체의 값 변경**.

```kotlin [compose-playground]
@Composable
fun Counter() {
    // State 선언 — Compose가 이 값을 "관찰"합니다
    var count by remember { mutableStateOf(0) }

    Column(horizontalAlignment = Alignment.CenterHorizontally) {
        Text(
            text = "카운트: $count",
            fontSize = 32.sp
        )
        Button(onClick = {
            count++  // ← State 변경! → 리컴포지션 트리거!
        }) {
            Text("증가")
        }
    }
}
```

```
┌─────────────────────────────────────────────────────────┐
│          리컴포지션 트리거 흐름                             │
│                                                         │
│  ┌────────┐    ┌──────────┐    ┌───────────┐            │
│  │ 사용자  │───→│ count++  │───→│ Compose가 │            │
│  │ 버튼   │    │ (State   │    │ 변경 감지  │            │
│  │ 클릭   │    │  변경)   │    │           │            │
│  └────────┘    └──────────┘    └─────┬─────┘            │
│                                      │                  │
│                                      ▼                  │
│                               ┌───────────┐             │
│                               │ 리컴포지션 │             │
│                               │ Counter() │             │
│                               │ 재실행    │              │
│                               └─────┬─────┘             │
│                                     │                   │
│                                     ▼                   │
│                               ┌───────────┐             │
│                               │ UI 업데이트│             │
│                               │ "카운트: 1"│             │
│                               └───────────┘             │
└─────────────────────────────────────────────────────────┘
```

### State가 아닌 일반 변수는 리컴포지션을 트리거하지 않는다

```kotlin [compose-playground]
@Composable
fun BrokenCounter() {
    // ❌ 일반 변수 — Compose가 관찰하지 않음!
    var count = 0

    Column {
        Text("카운트: $count")  // 항상 0으로 표시됨
        Button(onClick = {
            count++  // 값은 바뀌지만 리컴포지션이 발생하지 않음!
            // 게다가 리컴포지션이 일어나면 count는 다시 0으로 초기화됨
        }) {
            Text("증가 (동작 안 함)")
        }
    }
}

@Composable
fun WorkingCounter() {
    // ✅ State 객체 — Compose가 관찰함!
    var count by remember { mutableStateOf(0) }

    Column {
        Text("카운트: $count")  // count가 변할 때마다 업데이트됨
        Button(onClick = {
            count++  // State 변경 → 리컴포지션 트리거 → UI 갱신
        }) {
            Text("증가")
        }
    }
}
```

| 변수 타입 | 리컴포지션 트리거 | 값 유지 | 설명 |
|-----------|:----------------:|:------:|------|
| `var count = 0` | X | X | 일반 변수, 매번 초기화됨 |
| `val count = mutableStateOf(0)` | O | X | 관찰 가능하지만 리컴포지션 시 재생성 |
| `val count = remember { mutableStateOf(0) }` | O | O | 관찰 + 리컴포지션에서 값 유지 |

---

## 3. 스마트 리컴포지션

### 변경된 부분만 다시 실행

Compose는 **전체 UI를 다시 그리지 않습니다.** 변경된 State를 읽는 Composable만 다시 실행합니다.

```kotlin [compose-playground]
@Composable
fun SmartRecompositionDemo() {
    var count by remember { mutableStateOf(0) }

    Column {
        // ✅ count를 읽지 않음 → 리컴포지션 건너뜀 (Skip)
        Header(title = "스마트 리컴포지션 데모")

        // ✅ count를 읽음 → count 변경 시 리컴포지션됨
        CounterDisplay(count = count)

        // ✅ 람다 안에서만 count 변경 → Button 자체는 리컴포지션될 수 있지만
        //    Text("증가")는 변하지 않으므로 건너뜀
        Button(onClick = { count++ }) {
            Text("증가")
        }

        // ✅ count를 읽지 않음 → 리컴포지션 건너뜀 (Skip)
        Footer(text = "이 부분은 변하지 않습니다")
    }
}

@Composable
fun Header(title: String) {
    Text(text = title, fontSize = 24.sp, fontWeight = FontWeight.Bold)
}

@Composable
fun CounterDisplay(count: Int) {
    Text(text = "현재 값: $count", fontSize = 20.sp)
}

@Composable
fun Footer(text: String) {
    Text(text = text, fontSize = 12.sp, color = Color.Gray)
}
```

```
┌─────────────────────────────────────────────────────────┐
│          count가 0 → 1로 변경될 때                        │
│                                                         │
│  Column                                                 │
│  ├── Header("스마트 리컴포지션 데모")     → 건너뜀 ⏭️     │
│  ├── CounterDisplay(count = 1)          → 재실행 🔄     │
│  ├── Button(onClick = { count++ })                      │
│  │   └── Text("증가")                   → 건너뜀 ⏭️     │
│  └── Footer("이 부분은...")             → 건너뜀 ⏭️      │
│                                                         │
│  → count를 읽는 CounterDisplay만 리컴포지션됩니다!         │
│  → 나머지는 입력이 변하지 않았으므로 건너뜁니다              │
└─────────────────────────────────────────────────────────┘
```

### 스킵(Skip)의 조건 — Strong Skipping Mode

Compose 컴파일러의 **Strong Skipping Mode**는 현재 기본 동작으로 활성화되어 있습니다 (별도의 opt-in 불필요).
Strong Skipping Mode에서는 모든 매개변수가 **이전 값과 동일**하면 리컴포지션을 **건너뜁니다(Skip)**.

- **안정적(Stable) 타입**: `equals()`로 비교합니다
- **불안정(Unstable) 타입**: 인스턴스 동일성(===)으로 비교합니다

```kotlin [compose-playground]
// 안정적인 타입 (자동으로 Stable로 판단)
// - 기본 타입: Int, String, Float, Boolean 등
// - 불변 컬렉션: List (읽기 전용), Set, Map
// - data class (모든 프로퍼티가 val이고 안정적인 경우)

data class User(           // ✅ Stable — 모든 프로퍼티가 val + 안정적 타입
    val name: String,      //    → equals()로 비교하여 스킵 여부 결정
    val age: Int
)

data class MutableUser(    // ⚠ Unstable — var 프로퍼티 포함
    var name: String,      //    → 인스턴스 동일성(===)으로 비교하여 스킵 여부 결정
    var age: Int           //    → Strong Skipping 덕분에 스킵은 가능하지만,
)                          //      같은 값이어도 다른 인스턴스면 리컴포지션됨
```

> **참고**: 이전에는 Unstable 매개변수가 포함된 Composable은 절대 스킵되지 않았지만,
> Strong Skipping Mode가 기본 활성화된 현재는 Unstable 타입도 인스턴스 동일성 비교를 통해 스킵이 가능합니다.
> 그래도 가능하면 **Stable한 타입을 사용하는 것이 최적화에 유리**합니다.

---

## 4. 호출 사이트와 인스턴스 식별

### 호출 사이트(Call Site)란?

Compose는 **코드상의 호출 위치(Call Site)** 로 각 컴포저블 인스턴스를 식별합니다.

```kotlin [compose-playground]
@Composable
fun TwoGreetings() {
    // 같은 함수를 두 번 호출하지만, 호출 사이트가 다르므로
    // Compose는 이것을 두 개의 별도 인스턴스로 인식합니다

    Greeting("Alice")   // ← 호출 사이트 1 (줄 번호, 위치가 다름)
    Greeting("Bob")     // ← 호출 사이트 2
}
```

```
┌─────────────────────────────────────────────────────────┐
│          호출 사이트 기반 식별                               │
│                                                         │
│  코드:                         UI 트리:                   │
│  TwoGreetings() {              TwoGreetings              │
│    Greeting("Alice") ←─────→   ├── Greeting#1 (Alice)   │
│    Greeting("Bob")   ←─────→   └── Greeting#2 (Bob)     │
│  }                                                      │
│                                                         │
│  → 소스 코드의 호출 위치로 인스턴스를 구분합니다              │
└─────────────────────────────────────────────────────────┘
```

### 조건문에서의 호출 사이트

```kotlin [compose-playground]
@Composable
fun ConditionalGreeting(showFirst: Boolean) {
    Column {
        if (showFirst) {
            Greeting("Alice")   // 호출 사이트 A
        }
        Greeting("Bob")        // 호출 사이트 B
    }
}
```

`showFirst`가 `true` → `false`로 변하면:
- `Greeting("Alice")`는 컴포지션에서 **제거**됩니다
- `Greeting("Bob")`은 호출 사이트가 동일하므로 **유지**됩니다

### 반복문에서의 문제

```kotlin [compose-playground]
@Composable
fun NameList(names: List<String>) {
    Column {
        // ⚠ 반복문 안의 호출 사이트는 "인덱스"로 구분됩니다
        for (name in names) {
            Greeting(name)  // 같은 줄이지만 인덱스가 다름
        }
    }
}
```

```
names = ["Alice", "Bob", "Charlie"]일 때:

  Column
  ├── Greeting#0 ("Alice")    ← 인덱스 0
  ├── Greeting#1 ("Bob")      ← 인덱스 1
  └── Greeting#2 ("Charlie")  ← 인덱스 2

"Alice"를 리스트에서 제거하면? names = ["Bob", "Charlie"]

  Column
  ├── Greeting#0 ("Bob")      ← 인덱스 0 (이전의 Alice 자리!)
  ├── Greeting#1 ("Charlie")  ← 인덱스 1 (이전의 Bob 자리!)
  └── (인덱스 2는 제거됨)

⚠ Compose는 인덱스로 식별하므로, "Alice가 제거됐다"가 아니라
  "인덱스 0의 내용이 바뀌고, 인덱스 2가 제거됐다"로 인식합니다!
```

> 이 문제를 해결하려면 `key` 컴포저블을 사용해야 합니다.

---

## 5. key 컴포저블로 리스트 항목 식별

### key 없이 리스트 렌더링 (비효율적)

```kotlin [compose-playground]
@Composable
fun TodoList(todos: List<Todo>) {
    Column {
        // ❌ key 없음 — 인덱스로만 식별
        for (todo in todos) {
            TodoItem(todo = todo)
        }
    }
}
```

### key를 사용한 리스트 렌더링 (효율적)

```kotlin [compose-playground]
@Composable
fun TodoList(todos: List<Todo>) {
    Column {
        // ✅ key 사용 — 고유 ID로 각 항목을 식별
        for (todo in todos) {
            key(todo.id) {  // 각 Todo의 고유 ID를 key로 지정
                TodoItem(todo = todo)
            }
        }
    }
}

data class Todo(
    val id: Int,          // 고유 식별자
    val text: String,
    val isDone: Boolean
)
```

```
┌─────────────────────────────────────────────────────────┐
│          key의 효과                                       │
│                                                         │
│  초기 리스트:                                              │
│  ┌──────────────────────────────┐                        │
│  │ key=1: "장보기"              │                        │
│  │ key=2: "운동하기"            │                        │
│  │ key=3: "공부하기"            │                        │
│  └──────────────────────────────┘                        │
│                                                         │
│  "장보기"(key=1) 제거 후:                                  │
│                                                         │
│  key 없이:                       key 사용:                │
│  ┌──────────────┐              ┌──────────────┐         │
│  │ #0: "운동하기"│ ← 변경됨     │ key=2: "운동" │ ← 유지  │
│  │ #1: "공부하기"│ ← 변경됨     │ key=3: "공부" │ ← 유지  │
│  │ #2: 삭제     │              │ key=1: 삭제   │         │
│  └──────────────┘              └──────────────┘         │
│                                                         │
│  key 없이: 2개 항목 리컴포지션 + 1개 삭제 (비효율적)         │
│  key 사용: 0개 항목 리컴포지션 + 1개 삭제 (효율적!)          │
└─────────────────────────────────────────────────────────┘
```

### LazyColumn에서의 key

`LazyColumn`에서는 `items` 함수의 `key` 매개변수를 사용합니다.

```kotlin [compose-playground]
@Composable
fun TodoLazyList(todos: List<Todo>) {
    LazyColumn {
        items(
            items = todos,
            key = { todo -> todo.id }  // ← key 지정
        ) { todo ->
            TodoItem(todo = todo)
        }
    }
}
```

> **모범 사례**: 리스트 항목에는 항상 **고유하고 안정적인 key**를 제공하세요.
> 데이터베이스의 ID나 고유 식별자가 좋은 key입니다.

---

## 6. 리컴포지션의 특성

리컴포지션에는 세 가지 중요한 특성이 있습니다.

### 특성 1: 낙관적 (Optimistic)

Compose는 리컴포지션이 **완료되기 전에 상태가 또 변경**되면,
현재 진행 중인 리컴포지션을 **취소하고 새로운 상태로 다시 시작**합니다.

```kotlin [compose-playground]
@Composable
fun RapidCounter() {
    var count by remember { mutableStateOf(0) }

    // 사용자가 버튼을 빠르게 3번 클릭하면:
    // count: 0 → 1 (리컴포지션 시작)
    // count: 1 → 2 (이전 리컴포지션 취소, 새로 시작)
    // count: 2 → 3 (이전 리컴포지션 취소, 새로 시작)
    // → 최종적으로 count=3 으로 한 번만 완전한 리컴포지션 수행

    Text("카운트: $count")
    Button(onClick = { count++ }) {
        Text("증가")
    }
}
```

> **의미**: 중간 상태의 리컴포지션이 취소될 수 있으므로,
> 리컴포지션에 의존하는 부수 효과(Side Effect)를 작성하면 안 됩니다.

### 특성 2: 동시에 실행될 수 있다 (Concurrent)

Compose는 성능 최적화를 위해 여러 리컴포지션을 **병렬로 실행**할 수 있습니다.

```kotlin [compose-playground]
@Composable
fun ParallelRecomposition() {
    var stateA by remember { mutableStateOf(0) }
    var stateB by remember { mutableStateOf(0) }

    Row {
        // ComponentA와 ComponentB는 서로 다른 State를 읽으므로
        // 동시에(병렬로) 리컴포지션될 수 있습니다
        ComponentA(value = stateA)  // stateA 변경 시 리컴포지션
        ComponentB(value = stateB)  // stateB 변경 시 리컴포지션
    }
}
```

> **의미**: Composable이 서로 다른 스레드에서 실행될 수 있으므로,
> 공유 변수를 수정하면 **경쟁 상태(Race Condition)** 가 발생할 수 있습니다.

### 특성 3: 실행 순서가 보장되지 않는다

```kotlin [compose-playground]
@Composable
fun UnorderedExecution() {
    // ⚠ Compose는 이 세 Composable을 어떤 순서로든 실행할 수 있습니다
    // 반드시 위에서 아래로 실행된다고 가정하면 안 됩니다
    ButtonRow()
    ContentSection()
    FooterBar()
}
```

> **의미**: 각 Composable은 **독립적**이어야 하며,
> 다른 Composable의 실행 순서에 의존해서는 안 됩니다.

### 세 가지 특성 요약

| 특성 | 설명 | 주의할 점 |
|------|------|----------|
| 낙관적 | 상태가 또 변하면 현재 리컴포지션 취소 | 리컴포지션 중 부수 효과 금지 |
| 동시 실행 | 여러 리컴포지션이 병렬 실행 가능 | 공유 변수 수정 금지 |
| 순서 독립 | 실행 순서가 보장되지 않음 | Composable 간 순서 의존 금지 |

---

## 7. 부수 효과를 피해야 하는 이유

위의 세 가지 특성 때문에, Composable 안에서 부수 효과를 작성하면 **심각한 버그**가 발생할 수 있습니다.

### 잘못된 예: Composable 안에서 부수 효과

```kotlin [compose-playground]
// ❌ 위험한 코드 — 절대 이렇게 하지 마세요!

var globalCounter = 0  // 공유 변수

@Composable
fun BadCounter() {
    // 문제 1: 리컴포지션마다 증가됨 (몇 번 증가될지 예측 불가)
    globalCounter++

    // 문제 2: 리컴포지션이 취소되면 네트워크 요청이 중복/누락됨
    sendAnalyticsEvent("screen_viewed")

    // 문제 3: 동시 실행 시 경쟁 상태 발생
    sharedList.add("new item")

    Text("카운터: $globalCounter")
}
```

**왜 위험한가?**

```
┌─────────────────────────────────────────────────────────┐
│          부수 효과가 위험한 이유                            │
│                                                         │
│  시나리오: 상태가 빠르게 3번 변경됨                          │
│                                                         │
│  리컴포지션 #1 시작 → globalCounter++ (1)                 │
│    ↳ 상태 변경! → 리컴포지션 #1 취소 ❌                     │
│  리컴포지션 #2 시작 → globalCounter++ (2)                 │
│    ↳ 상태 변경! → 리컴포지션 #2 취소 ❌                     │
│  리컴포지션 #3 시작 → globalCounter++ (3)                 │
│    ↳ 완료 ✅                                              │
│                                                         │
│  기대값: globalCounter = 1 (최종 리컴포지션에서 1번)        │
│  실제값: globalCounter = 3 (취소된 리컴포지션에서도 실행됨!) │
│                                                         │
│  → 부수 효과는 취소된 리컴포지션에서도 실행되므로              │
│    결과를 예측할 수 없습니다!                               │
└─────────────────────────────────────────────────────────┘
```

### 올바른 예: Side Effect API 사용

```kotlin [compose-playground]
// ✅ 올바른 코드 — Side Effect API를 사용하세요

@Composable
fun GoodCounter() {
    var count by remember { mutableStateOf(0) }

    // LaunchedEffect: 컴포지션에 진입할 때 한 번만 실행
    // key가 변경되면 이전 코루틴을 취소하고 새로 실행
    LaunchedEffect(Unit) {
        sendAnalyticsEvent("screen_viewed")  // 정확히 한 번만 실행됨!
    }

    // LaunchedEffect: count가 변경될 때마다 실행
    LaunchedEffect(count) {
        // count가 변경될 때만 로그 기록
        logCountChange(count)
    }

    Column {
        Text("카운트: $count")
        Button(onClick = { count++ }) {
            Text("증가")
        }
    }
}
```

### 잘못된 예 vs 올바른 예 비교

| 상황 | 잘못된 예 (직접 실행) | 올바른 예 (Side Effect API) |
|------|---------------------|---------------------------|
| 화면 진입 시 API 호출 | `fetchData()` | `LaunchedEffect(Unit) { fetchData() }` |
| 상태 변경 시 로깅 | `log(state)` | `LaunchedEffect(state) { log(state) }` |
| 리소스 정리 | `listener.remove()` | `DisposableEffect { onDispose { listener.remove() } }` |
| 매 리컴포지션 후 실행 | 직접 호출 | `SideEffect { ... }` |

> **원칙**: Composable 함수의 본문에서는 **오직 UI 방출만** 하세요.
> 그 외의 모든 작업은 **Side Effect API**를 통해 처리하세요.
> (Side Effect API는 Phase 4에서 상세히 다룹니다)

---

## 8. 정리

| 핵심 개념 | 설명 |
|-----------|------|
| 초기 컴포지션 | Composable이 처음 UI 트리에 추가되는 시점 |
| 리컴포지션 | State 변경으로 Composable이 다시 실행되는 과정 |
| 컴포지션 종료 | Composable이 UI 트리에서 제거되는 시점 |
| 스마트 리컴포지션 | 변경된 State를 읽는 Composable만 재실행하는 최적화 |
| 호출 사이트 | 코드 상의 호출 위치로 Composable 인스턴스를 식별 |
| key 컴포저블 | 리스트 항목에 고유 ID를 부여하여 효율적으로 식별 |
| 낙관적 리컴포지션 | 상태가 또 변하면 현재 리컴포지션을 취소하고 재시작 |

### 리컴포지션 체크리스트

- [ ] UI를 변경하고 싶다면 **State를 변경**하고 있는가? (직접 뷰를 수정하지 않는가?)
- [ ] `remember`를 사용하여 리컴포지션 사이에 상태를 **유지**하고 있는가?
- [ ] 리스트 항목에 **고유한 key**를 제공하고 있는가?
- [ ] Composable 안에서 **부수 효과를 직접 실행**하고 있지 않은가?
- [ ] Composable이 **같은 입력에 같은 UI**를 생성하는가? (멱등성)

### Phase 1 완료!

축하합니다! Phase 1의 모든 문서를 완료했습니다. 이제 다음을 이해하게 되었습니다:

- 선언형 UI와 명령형 UI의 차이
- Compose 개발 환경 설정
- @Composable 함수의 개념과 작성법
- 수명주기와 리컴포지션 메커니즘

다음 Phase에서는 **기본 레이아웃**을 학습합니다. Column, Row, Box를 사용하여
실제 화면을 구성하는 방법을 배웁니다.

> [다음 Phase: Phase 2 — 기본 레이아웃 →](../phase-02-basic-layouts/01-column-row-box.md)
