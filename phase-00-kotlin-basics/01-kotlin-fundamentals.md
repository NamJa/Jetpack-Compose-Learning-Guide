# Kotlin 기초 문법 완전 가이드

> **"Kotlin을 모르면 Compose를 쓸 수 없다."**
> Jetpack Compose는 100% Kotlin으로 작성됩니다. 이 문서에서 Kotlin의 핵심 문법을 확실히 익히세요.

### 학습 환경 기준

| 항목 | 버전 |
|------|------|
| Kotlin | 2.3.10 (K2 컴파일러 기본 적용) |
| Compose BOM | 2026.02.01 |
| Compose UI / Foundation / Runtime | 1.10.4 |
| Material3 | 1.4.0 |

> **참고**: Kotlin 2.0부터 K2 컴파일러가 기본 컴파일러로 적용되었습니다. K2는 빌드 속도 향상과 더 정확한 타입 추론을 제공합니다. 이 문서의 모든 코드는 Kotlin 2.3.10 기준으로 작성되었습니다.

---

## 목차

1. [변수 선언: val과 var](#1-변수-선언-val과-var)
2. [기본 타입](#2-기본-타입)
3. [문자열 템플릿](#3-문자열-템플릿)
4. [조건문: if와 when](#4-조건문-if와-when)
5. [반복문: for와 while](#5-반복문-for와-while)
6. [클래스와 객체](#6-클래스와-객체)
7. [data class](#7-data-class)
8. [enum class](#8-enum-class)
9. [sealed class](#9-sealed-class)
10. [object 선언](#10-object-선언)
11. [Null 안전성](#11-null-안전성)
12. [컬렉션: List, Map, Set](#12-컬렉션-list-map-set)
13. [Compose에서의 활용 종합](#13-compose에서의-활용-종합)
14. [퀴즈: 실습 체크리스트](#14-퀴즈-실습-체크리스트)

---

## 1. 변수 선언: val과 var

Kotlin에서 변수를 선언하는 방법은 딱 두 가지입니다.

| 키워드 | 의미 | 재할당 | 비유 |
|--------|------|--------|------|
| `val` | value (값) | 불가능 | 이름표가 붙은 상자 (한 번 넣으면 못 바꿈) |
| `var` | variable (변수) | 가능 | 이름표가 붙은 상자 (내용물 교체 가능) |

```kotlin
val name = "Android"    // 타입 추론: String
val age: Int = 1        // 명시적 타입 지정

var count = 0           // 변경 가능
count = 1               // OK

val pi = 3.14
// pi = 3.15            // 컴파일 에러! val은 재할당 불가
```

```
  val (불변)                    var (가변)
┌──────────────┐          ┌──────────────┐
│  name = "A"  │          │  count = 0   │
│              │          │      ↓       │
│  변경 불가    │          │  count = 1   │  ← 재할당 OK
└──────────────┘          └──────────────┘
```

### Compose에서의 활용

Compose에서는 **불변성(Immutability)** 이 핵심입니다. UI 상태를 `val`로 선언하고, 상태 변경은 Compose의 `mutableStateOf`를 통해 처리합니다.

```kotlin
@Composable
fun Greeting() {
    // val로 선언하지만, by 위임을 통해 내부 값은 변경 가능
    var name by remember { mutableStateOf("World") }

    Text(text = "Hello, $name!")
}
```

---

## 2. 기본 타입

Kotlin의 기본 타입은 모두 **객체**입니다. Java의 `int`, `double` 같은 원시 타입이 없습니다.

| 타입 | 크기 | 예시 | 설명 |
|------|------|------|------|
| `Int` | 32비트 | `42` | 정수 |
| `Long` | 64비트 | `42L` | 큰 정수 |
| `Float` | 32비트 | `3.14f` | 단정밀도 실수 |
| `Double` | 64비트 | `3.14` | 배정밀도 실수 |
| `Boolean` | - | `true`, `false` | 참/거짓 |
| `Char` | 16비트 | `'A'` | 단일 문자 |
| `String` | - | `"Hello"` | 문자열 |

```kotlin
val score: Int = 100
val distance: Double = 12.5
val isActive: Boolean = true
val initial: Char = 'K'
val message: String = "Kotlin"
```

### 타입 변환

Kotlin은 **암시적 타입 변환을 허용하지 않습니다.** 항상 명시적으로 변환해야 합니다.

```kotlin
val intValue: Int = 42
val longValue: Long = intValue.toLong()   // 명시적 변환 필수
val doubleValue: Double = intValue.toDouble()
val stringValue: String = intValue.toString()
```

### Compose에서의 활용

Compose의 `Modifier`에서 크기를 지정할 때 `Int`, `Float`, `Double`을 `.dp` 또는 `.sp` 확장 프로퍼티와 함께 사용합니다.

```kotlin
Modifier
    .width(200.dp)       // Int.dp
    .height(48.dp)       // Int.dp
    .padding(16.dp)      // Int.dp
```

---

## 3. 문자열 템플릿

Kotlin에서는 문자열 안에 변수나 표현식을 직접 삽입할 수 있습니다.

```kotlin
val name = "Kotlin"
val version = 2

// 변수 삽입: $ 기호
println("Hello, $name!")                // Hello, Kotlin!

// 표현식 삽입: ${} 중괄호
println("${name}의 버전은 ${version}입니다.")  // Kotlin의 버전은 2입니다.
println("다음 버전: ${version + 1}")          // 다음 버전: 3

// 여러 줄 문자열: triple quote
val json = """
    {
        "name": "$name",
        "version": $version
    }
""".trimIndent()
```

### Compose에서의 활용

Compose의 `Text` 컴포넌트에 동적인 값을 표시할 때 문자열 템플릿을 자주 사용합니다.

```kotlin
@Composable
fun UserProfile(userName: String, postCount: Int) {
    Text(text = "${userName}님의 게시물: ${postCount}개")
}
```

---

## 4. 조건문: if와 when

### if 표현식

Kotlin의 `if`는 **문(statement)** 이 아니라 **표현식(expression)** 입니다. 값을 반환할 수 있습니다.

```kotlin
// 전통적인 if-else
val score = 85
if (score >= 90) {
    println("A")
} else if (score >= 80) {
    println("B")
} else {
    println("C")
}

// 표현식으로 사용 (삼항 연산자 대체)
val grade = if (score >= 90) "A" else if (score >= 80) "B" else "C"
```

### when 표현식

`when`은 Java의 `switch`를 대체하는, 훨씬 강력한 구문입니다.

```kotlin
val day = 3

val dayName = when (day) {
    1 -> "월요일"
    2 -> "화요일"
    3 -> "수요일"
    4 -> "목요일"
    5 -> "금요일"
    6, 7 -> "주말"       // 여러 값 매칭
    else -> "알 수 없음"  // default
}

// 범위와 조건 사용
val description = when (score) {
    in 90..100 -> "우수"
    in 80..89  -> "양호"
    in 70..79  -> "보통"
    else       -> "노력 필요"
}

// 인자 없이 사용 (if-else 체인 대체)
val message = when {
    score >= 90 -> "훌륭합니다!"
    score >= 80 -> "잘했습니다!"
    else        -> "더 노력해봐요!"
}
```

```
when 표현식의 매칭 흐름
┌─────────┐
│  day=3  │
└────┬────┘
     │
     ▼
┌─────────┐   NO   ┌─────────┐   NO   ┌──────────┐   NO   ┌─────────┐
│  1? ────┼───────→│  2? ────┼───────→│  3? ─────┼───────→│ else    │
└─────────┘        └─────────┘        └────┬─────┘        └─────────┘
                                           │ YES
                                           ▼
                                     "수요일" 반환
```

### Compose에서의 활용

Compose에서 UI를 조건부로 렌더링할 때 `if`와 `when`을 사용합니다.

```kotlin
@Composable
fun StatusIcon(status: String) {
    when (status) {
        "loading" -> CircularProgressIndicator()
        "success" -> Icon(Icons.Default.Check, contentDescription = "성공")
        "error"   -> Icon(Icons.Default.Close, contentDescription = "에러")
    }
}
```

---

## 5. 반복문: for와 while

### for 반복문

```kotlin
// 범위 반복
for (i in 1..5) {
    print("$i ")    // 1 2 3 4 5
}

// 역순 반복
for (i in 5 downTo 1) {
    print("$i ")    // 5 4 3 2 1
}

// 간격 지정
for (i in 0..10 step 2) {
    print("$i ")    // 0 2 4 6 8 10
}

// until: 마지막 값 제외
for (i in 0 until 5) {
    print("$i ")    // 0 1 2 3 4
}

// 컬렉션 반복
val fruits = listOf("사과", "바나나", "체리")
for (fruit in fruits) {
    println(fruit)
}

// 인덱스와 함께
for ((index, fruit) in fruits.withIndex()) {
    println("$index: $fruit")
}
```

### while과 do-while

```kotlin
var count = 0
while (count < 5) {
    print("$count ")   // 0 1 2 3 4
    count++
}

// do-while: 최소 한 번 실행
var input: String
do {
    input = readLine() ?: ""
} while (input != "exit")
```

### Compose에서의 활용

Compose에서는 `for` 루프로 동적 UI 목록을 생성합니다.

```kotlin
@Composable
fun TagList(tags: List<String>) {
    Row {
        for (tag in tags) {
            Chip(text = tag)
        }
    }
}
```

---

## 6. 클래스와 객체

### 기본 클래스

```kotlin
// 주 생성자(primary constructor)
class User(val name: String, var age: Int) {

    // 초기화 블록
    init {
        require(age >= 0) { "나이는 0 이상이어야 합니다" }
    }

    // 메서드
    fun greet(): String = "안녕하세요, ${name}입니다."

    // 보조 생성자(secondary constructor)
    constructor(name: String) : this(name, 0)
}

val user = User("홍길동", 25)
println(user.name)      // 홍길동
println(user.greet())   // 안녕하세요, 홍길동입니다.
```

### 상속

```kotlin
// open 키워드가 있어야 상속 가능 (기본은 final)
open class Animal(val name: String) {
    open fun sound(): String = "..."
}

class Dog(name: String) : Animal(name) {
    override fun sound(): String = "멍멍!"
}

class Cat(name: String) : Animal(name) {
    override fun sound(): String = "야옹~"
}
```

### 인터페이스

```kotlin
interface Clickable {
    fun onClick()
    fun description(): String = "클릭 가능한 요소"  // 기본 구현 가능
}

class Button : Clickable {
    override fun onClick() {
        println("버튼 클릭됨!")
    }
}
```

```
클래스 계층 구조
┌───────────────────────────┐
│       <<interface>>       │
│        Clickable          │
│  + onClick()              │
│  + description(): String  │
└─────────────┬─────────────┘
              │ implements
              ▼
┌───────────────────────────┐
│     open class Animal     │
│  + name: String           │
│  + sound(): String        │
└──────────┬────────────────┘
           │ extends
     ┌─────┴─────┐
     ▼           ▼
┌─────────┐ ┌─────────┐
│   Dog   │ │   Cat   │
│ "멍멍!" │ │ "야옹~" │
└─────────┘ └─────────┘
```

---

## 7. data class

데이터를 담기 위한 클래스입니다. `equals()`, `hashCode()`, `toString()`, `copy()` 등을 자동으로 생성해줍니다.

```kotlin
data class Product(
    val id: Int,
    val name: String,
    val price: Double
)

val product1 = Product(1, "키보드", 50000.0)
val product2 = Product(1, "키보드", 50000.0)

println(product1)                  // Product(id=1, name=키보드, price=50000.0)
println(product1 == product2)      // true (내용 비교)
println(product1 === product2)     // false (참조 비교)

// copy()로 일부만 변경한 새 객체 생성
val discounted = product1.copy(price = 40000.0)
println(discounted)                // Product(id=1, name=키보드, price=40000.0)

// 구조 분해 선언
val (id, name, price) = product1
println("$name: ${price}원")       // 키보드: 50000.0원
```

| 일반 class | data class |
|-----------|------------|
| `toString()` = 주소값 | `toString()` = 속성 출력 |
| `==` = 참조 비교 | `==` = 내용 비교 |
| `copy()` 없음 | `copy()` 자동 생성 |
| 구조 분해 불가 | 구조 분해 가능 |

### Compose에서의 활용

Compose에서 UI 상태를 모델링할 때 `data class`를 사용합니다. 리컴포지션 최적화에 핵심적인 역할을 합니다.

```kotlin
// UI 상태를 data class로 정의
data class LoginUiState(
    val email: String = "",
    val password: String = "",
    val isLoading: Boolean = false,
    val errorMessage: String? = null
)

// ViewModel에서 상태 업데이트 시 copy() 활용
fun onEmailChange(newEmail: String) {
    _uiState.value = _uiState.value.copy(email = newEmail)
}
```

---

## 8. enum class

고정된 상수 집합을 정의할 때 사용합니다.

```kotlin
enum class Direction {
    NORTH, SOUTH, EAST, WEST
}

// 속성과 메서드를 가질 수 있음
enum class Color(val hex: String) {
    RED("#FF0000"),
    GREEN("#00FF00"),
    BLUE("#0000FF");

    fun displayName(): String = name.lowercase()
}

val color = Color.RED
println(color.hex)           // #FF0000
println(color.displayName()) // red

// when과 함께 사용
fun describe(dir: Direction): String = when (dir) {
    Direction.NORTH -> "북쪽"
    Direction.SOUTH -> "남쪽"
    Direction.EAST  -> "동쪽"
    Direction.WEST  -> "서쪽"
    // enum의 모든 값을 처리하면 else 불필요
}
```

### Compose에서의 활용

탭, 네비게이션 항목 등 고정된 선택지를 정의할 때 활용합니다.

```kotlin
enum class BottomTab(val title: String, val icon: ImageVector) {
    HOME("홈", Icons.Default.Home),
    SEARCH("검색", Icons.Default.Search),
    PROFILE("프로필", Icons.Default.Person)
}
```

---

## 9. sealed class / sealed interface

**제한된 상속 계층**을 정의합니다. `when`과 함께 사용하면 모든 경우를 빠짐없이 처리할 수 있습니다. `sealed interface`도 동일한 역할을 하며, 다중 상속이 필요한 경우 더 유연합니다.

```kotlin
sealed class Result {
    data class Success(val data: String) : Result()
    data class Error(val message: String) : Result()
    data object Loading : Result()
}

// sealed interface도 동일하게 사용 가능 (다중 구현 가능)
sealed interface Result {
    data class Success(val data: String) : Result
    data class Error(val message: String) : Result
    data object Loading : Result
}

fun handleResult(result: Result) {
    when (result) {
        is Result.Success -> println("성공: ${result.data}")
        is Result.Error   -> println("에러: ${result.message}")
        is Result.Loading -> println("로딩 중...")
        // sealed class/interface이므로 else 불필요 — 모든 하위 타입을 처리했기 때문
    }
}
```

```
sealed class vs enum class 비교

enum class Direction         sealed class Result
┌───────────────┐            ┌───────────────────────┐
│ NORTH         │            │ Success(data: String)  │  ← 각자 다른 속성 가능
│ SOUTH         │            │ Error(message: String) │
│ EAST          │            │ Loading                │
│ WEST          │            └───────────────────────┘
└───────────────┘
  각 항목이 동일한 구조        각 항목이 서로 다른 구조 가능
```

| 비교 | `enum class` | `sealed class` | `sealed interface` |
|------|-------------|---------------|-------------------|
| 인스턴스 | 각 항목은 싱글톤 | 각 항목은 여러 인스턴스 가능 | 각 항목은 여러 인스턴스 가능 |
| 데이터 | 모든 항목이 같은 속성 | 각 항목마다 다른 속성 가능 | 각 항목마다 다른 속성 가능 |
| 다중 상속 | 불가 | 불가 (클래스이므로) | 가능 (인터페이스이므로) |
| 용도 | 고정 상수 | 상태 표현, 결과 타입 | 상태 표현 (다중 구현 필요 시) |
| `when` 완전성 | 지원 | 지원 | 지원 |

### Compose에서의 활용

화면 상태를 표현하는 데 `sealed class`가 가장 자주 쓰입니다.

```kotlin
sealed class ScreenState {
    data object Loading : ScreenState()
    data class Success(val items: List<Item>) : ScreenState()
    data class Error(val throwable: Throwable) : ScreenState()
}

@Composable
fun MyScreen(state: ScreenState) {
    when (state) {
        is ScreenState.Loading -> LoadingSpinner()
        is ScreenState.Success -> ItemList(state.items)
        is ScreenState.Error   -> ErrorMessage(state.throwable.message ?: "")
    }
}
```

---

## 10. object 선언

### 싱글톤 객체

```kotlin
object AppConfig {
    const val API_URL = "https://api.example.com"
    var isDebugMode = false

    fun initialize() {
        println("앱 설정 초기화")
    }
}

// 사용
AppConfig.initialize()
println(AppConfig.API_URL)
```

### companion object

클래스 내부에 정적 멤버를 선언할 때 사용합니다. Java의 `static`에 해당합니다.

```kotlin
class User private constructor(val name: String) {
    companion object {
        fun create(name: String): User {
            println("User 생성: $name")
            return User(name)
        }
    }
}

val user = User.create("홍길동")
```

### 익명 객체

```kotlin
interface EventListener {
    fun onEvent(message: String)
}

val listener = object : EventListener {
    override fun onEvent(message: String) {
        println("이벤트 수신: $message")
    }
}
```

---

## 11. Null 안전성

Kotlin의 가장 강력한 특징 중 하나입니다. **모든 타입은 기본적으로 null을 허용하지 않습니다.**

### 기본 규칙

```kotlin
var name: String = "Kotlin"
// name = null              // 컴파일 에러!

var nullableName: String? = "Kotlin"   // ?를 붙이면 null 허용
nullableName = null                    // OK
```

### Null 안전 연산자

```kotlin
val name: String? = null

// 1. 안전 호출 연산자: ?.
println(name?.length)          // null (NPE 발생하지 않음)
println(name?.uppercase())     // null

// 2. Elvis 연산자: ?:
val length = name?.length ?: 0           // null이면 기본값 사용
val displayName = name ?: "Unknown"      // null이면 "Unknown"

// 3. 안전 캐스팅: as?
val value: Any = "Hello"
val str: String? = value as? String      // 안전한 캐스팅
val num: Int? = value as? Int            // null (캐스팅 실패)

// 4. let 스코프 함수: null이 아닐 때만 실행
name?.let { nonNullName ->
    println("이름의 길이: ${nonNullName.length}")
}

// 5. 비-null 단언: !! (가급적 사용 금지!)
// val forcedLength = name!!.length    // NPE 발생 위험!
```

```
Null 안전 연산자 비교

변수: name: String? = null

name?.length          →  null (안전하게 null 반환)
name?.length ?: 0     →  0 (null 대신 기본값)
name!!.length         →  NullPointerException! (위험!)
name?.let { ... }     →  블록 실행 안 함 (안전)

변수: name: String? = "Kotlin"

name?.length          →  6
name?.length ?: 0     →  6
name!!.length         →  6
name?.let { ... }     →  블록 실행됨
```

### Compose에서의 활용

네트워크에서 가져온 데이터, 사용자 입력 등에서 null 처리는 필수입니다.

```kotlin
@Composable
fun UserAvatar(imageUrl: String?) {
    imageUrl?.let { url ->
        AsyncImage(
            model = url,
            contentDescription = "프로필 이미지"
        )
    } ?: Icon(
        imageVector = Icons.Default.Person,
        contentDescription = "기본 아바타"
    )
}
```

---

## 12. 컬렉션: List, Map, Set

Kotlin의 컬렉션은 **불변(Immutable)** 과 **가변(Mutable)** 로 나뉩니다.

### List

```kotlin
// 불변 리스트
val fruits: List<String> = listOf("사과", "바나나", "체리")
println(fruits[0])          // 사과
println(fruits.size)        // 3
// fruits.add("포도")       // 컴파일 에러! 불변 리스트

// 가변 리스트
val mutableFruits = mutableListOf("사과", "바나나")
mutableFruits.add("체리")
mutableFruits.removeAt(0)
println(mutableFruits)      // [바나나, 체리]

// 유용한 함수들
println(fruits.first())             // 사과
println(fruits.last())              // 체리
println(fruits.contains("바나나"))   // true
println(fruits.isEmpty())           // false
```

### Map

```kotlin
// 불변 맵
val scores: Map<String, Int> = mapOf(
    "수학" to 90,
    "영어" to 85,
    "과학" to 92
)
println(scores["수학"])     // 90
println(scores["국어"])     // null (없는 키)

// 가변 맵
val mutableScores = mutableMapOf("수학" to 90)
mutableScores["영어"] = 85
mutableScores.remove("수학")

// 반복
for ((subject, score) in scores) {
    println("$subject: ${score}점")
}
```

### Set

```kotlin
// 불변 셋 (중복 불허)
val numbers: Set<Int> = setOf(1, 2, 3, 2, 1)
println(numbers)            // [1, 2, 3]
println(numbers.size)       // 3

// 가변 셋
val mutableNumbers = mutableSetOf(1, 2, 3)
mutableNumbers.add(4)
mutableNumbers.remove(1)
```

### 불변 vs 가변 비교

```
불변 컬렉션 (Immutable)              가변 컬렉션 (Mutable)
┌─────────────────────┐          ┌─────────────────────┐
│  listOf()           │          │  mutableListOf()    │
│  mapOf()            │          │  mutableMapOf()     │
│  setOf()            │          │  mutableSetOf()     │
│                     │          │                     │
│  읽기만 가능         │          │  읽기 + 쓰기        │
│  안전 (스레드 안전)   │          │  변경 가능          │
└─────────────────────┘          └─────────────────────┘

Compose 권장: 불변 컬렉션 사용 → 리컴포지션 최적화에 유리
```

### Compose에서의 활용

```kotlin
@Composable
fun ShoppingList(items: List<ShoppingItem>) {
    LazyColumn {
        items(
            items = items,
            key = { it.id }   // 고유 키로 리컴포지션 최적화
        ) { item ->
            ShoppingItemRow(item)
        }
    }
}
```

---

## 13. Compose에서의 활용 종합

지금까지 배운 Kotlin 기초가 Compose에서 어떻게 연결되는지 한눈에 정리합니다.

| Kotlin 개념 | Compose 활용 | 예시 |
|-------------|-------------|------|
| `val` / `var` | 상태 선언 | `var count by remember { mutableStateOf(0) }` |
| 기본 타입 (`Int`, `Float`) | Modifier 크기 지정 | `Modifier.size(48.dp)` |
| 문자열 템플릿 | 동적 텍스트 | `Text("$count 회 클릭")` |
| `if` / `when` | 조건부 UI 렌더링 | `if (isLoading) Spinner() else Content()` |
| `for` 반복문 | 동적 UI 목록 | `for (item in items) { ItemCard(item) }` |
| `data class` | UI 상태 모델링 | `data class UiState(val items: List<Item>)` |
| `sealed class/interface` | 화면 상태 표현 | `sealed interface ScreenState` |
| `enum class` | 고정된 선택지 | `enum class Tab { HOME, SEARCH }` |
| `object` | 싱글톤 설정 | `object AppTheme { ... }` |
| Null 안전성 | 안전한 UI 렌더링 | `imageUrl?.let { AsyncImage(it) }` |
| `List` (불변) | 리스트 UI | `LazyColumn { items(list) { ... } }` |

```
Kotlin 기초 → Compose UI 흐름

┌─────────────────┐     ┌──────────────────┐     ┌────────────────┐
│   data class    │────→│   State 관리      │────→│   UI 렌더링     │
│   UiState(...)  │     │   mutableStateOf  │     │   @Composable  │
└─────────────────┘     └──────────────────┘     └────────────────┘
                                                        │
                              ┌──────────────────────────┘
                              ▼
                    ┌──────────────────┐
                    │  when (state) {  │
                    │    Loading → ... │
                    │    Success → ... │
                    │    Error   → ... │
                    │  }               │
                    └──────────────────┘
```

---

## 14. 퀴즈: 실습 체크리스트

다음 항목들을 직접 코드로 작성해보며 확인하세요.

- [ ] `val`과 `var`의 차이를 설명하고, 각각 언제 사용하는지 예시를 작성할 수 있다
- [ ] Kotlin의 기본 타입 6가지를 나열하고 타입 변환 코드를 작성할 수 있다
- [ ] 문자열 템플릿으로 변수와 표현식을 포함한 문자열을 만들 수 있다
- [ ] `if`를 표현식으로 사용하여 값을 할당할 수 있다
- [ ] `when`으로 범위, 조건, 타입 매칭을 구현할 수 있다
- [ ] `for` 루프에서 `..`, `downTo`, `step`, `until`을 사용할 수 있다
- [ ] 기본 클래스를 정의하고 상속 관계를 구현할 수 있다
- [ ] `data class`를 정의하고 `copy()`, 구조 분해를 사용할 수 있다
- [ ] `sealed class`/`sealed interface`와 `enum class`의 차이를 설명하고 적절한 상황에 사용할 수 있다
- [ ] `object`와 `companion object`의 차이를 설명할 수 있다
- [ ] `?.`, `?:`, `let`을 활용하여 null을 안전하게 처리할 수 있다
- [ ] `listOf`, `mapOf`, `setOf`로 불변 컬렉션을 생성하고 조작할 수 있다
- [ ] 위 개념들이 Compose에서 어떻게 활용되는지 최소 3가지를 설명할 수 있다

> **다음 문서**: [02. Kotlin 함수형 프로그래밍](02-kotlin-functional-programming.md)에서 고차 함수, 람다, 확장 함수 등 Compose의 핵심이 되는 함수형 프로그래밍을 배웁니다.
