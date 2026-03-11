# Kotlin 함수형 프로그래밍

> **"Compose의 모든 것은 함수다."**
> `@Composable` 함수, trailing lambda, Modifier 체이닝 — Compose를 이해하려면 Kotlin의 함수형 프로그래밍을 먼저 익혀야 합니다.

### 학습 환경 기준

| 항목 | 버전 |
|------|------|
| Kotlin | 2.3.10 (K2 컴파일러 기본 적용) |
| Compose BOM | 2026.02.01 |
| Compose UI / Foundation / Runtime | 1.10.4 |
| Material3 | 1.4.0 |

---

## 목차

1. [함수 선언과 호출](#1-함수-선언과-호출)
2. [기본값 인자와 명명 인자](#2-기본값-인자와-명명-인자)
3. [람다 표현식](#3-람다-표현식)
4. [고차 함수](#4-고차-함수)
5. [컬렉션 함수형 처리](#5-컬렉션-함수형-처리)
6. [확장 함수](#6-확장-함수)
7. [Scope 함수: let, apply, also, with, run](#7-scope-함수-let-apply-also-with-run)
8. [제네릭 기초](#8-제네릭-기초)
9. [Compose에서의 활용 종합](#9-compose에서의-활용-종합)
10. [퀴즈: 실습 체크리스트](#10-퀴즈-실습-체크리스트)

---

## 1. 함수 선언과 호출

### 기본 함수 선언

```kotlin [kotlin-playground]
// 단일 표현식 함수 (= 사용, return과 중괄호 생략)
fun greet(name: String): String = "안녕하세요, ${name}님!"

// 반환값이 없는 함수 (Unit = Java의 void)
fun printMessage(message: String) {
    println(message)
}
// Unit은 생략 가능: fun printMessage(message: String): Unit { ... }

fun main() {
//sampleStart
    println(greet("Kotlin"))
    printMessage("Hello, World!")
//sampleEnd
}
```

```
함수의 구성 요소

fun    greet    (name: String)  : String   = "안녕하세요, ${name}님!"
 │      │            │              │              │
 키워드  함수명      매개변수         반환 타입       함수 본문
```

### Compose에서의 활용

Compose의 모든 UI는 `@Composable` 어노테이션이 붙은 **함수**입니다.

```kotlin [compose-playground]
@Composable
fun Greeting(name: String) {        // 반환 타입이 Unit
    Text(text = "Hello, $name!")
}
```

---

## 2. 기본값 인자와 명명 인자

### 기본값 인자 (Default Arguments)

함수 매개변수에 기본값을 지정하면 호출 시 생략할 수 있습니다.

```kotlin [kotlin-playground]
fun createUser(
    name: String,
    age: Int = 0,
    email: String = ""
): String {
    return "User($name, $age, $email)"
}

fun main() {
//sampleStart
    // 다양한 호출 방식
    println(createUser("홍길동"))                      // User(홍길동, 0, )
    println(createUser("홍길동", 25))                  // User(홍길동, 25, )
    println(createUser("홍길동", 25, "hong@mail.com")) // User(홍길동, 25, hong@mail.com)
//sampleEnd
}
```

### 명명 인자 (Named Arguments)

인자의 이름을 명시하여 순서와 무관하게 호출할 수 있습니다.

```kotlin [kotlin-playground]
fun createUser(
    name: String,
    age: Int = 0,
    email: String = ""
): String {
    return "User($name, $age, $email)"
}

fun main() {
//sampleStart
    // 명명 인자로 순서 무시
    println(createUser(
        name = "홍길동",
        email = "hong@mail.com"   // age는 기본값 사용
    ))

    // 가독성 향상
    println(createUser(
        name = "홍길동",
        age = 25,
        email = "hong@mail.com"
    ))
//sampleEnd
}
```

### Compose에서의 활용

Compose의 컴포넌트는 기본값 인자와 명명 인자를 **매우 적극적으로** 사용합니다. 이것이 Compose가 오버로딩 없이도 유연한 API를 제공하는 비결입니다.

```kotlin [compose-playground]
// Text 컴포넌트의 선언 (단순화)
@Composable
fun Text(
    text: String,
    modifier: Modifier = Modifier,        // 기본값
    color: Color = Color.Unspecified,      // 기본값
    fontSize: TextUnit = TextUnit.Unspecified,  // 기본값
    fontWeight: FontWeight? = null,        // 기본값
    textAlign: TextAlign? = null,          // 기본값
    maxLines: Int = Int.MAX_VALUE          // 기본값
)

// 호출할 때 필요한 것만 명명 인자로 지정
Text(
    text = "안녕하세요",
    fontSize = 24.sp,
    fontWeight = FontWeight.Bold
)
```

```
기본값 인자가 없다면?

Java 스타일: 오버로딩 폭발
─────────────────────────────────────────
Text(String text)
Text(String text, Color color)
Text(String text, Color color, int fontSize)
Text(String text, Color color, int fontSize, FontWeight weight)
... 조합이 수십 개!

Kotlin 스타일: 기본값 + 명명 인자
─────────────────────────────────────────
Text(
    text: String,
    color: Color = Color.Unspecified,
    fontSize: TextUnit = TextUnit.Unspecified,
    fontWeight: FontWeight? = null
)
→ 함수 하나로 모든 경우를 커버!
```

---

## 3. 람다 표현식

람다(Lambda)는 **이름 없는 함수**입니다. 변수에 저장하거나 다른 함수에 인자로 전달할 수 있습니다.

### 기본 문법

```kotlin [kotlin-playground]
fun main() {
//sampleStart
    // 람다의 기본 형태: { 매개변수 -> 본문 }
    val square: (Int) -> Int = { number -> number * number }
    println(square(5))   // 25

    // 매개변수가 하나면 it으로 생략 가능
    val double: (Int) -> Int = { it * 2 }
    println(double(5))   // 10

    // 매개변수가 없는 람다
    val sayHello: () -> String = { "Hello!" }
    println(sayHello())  // Hello!

    // 여러 매개변수
    val add: (Int, Int) -> Int = { a, b -> a + b }
    println(add(3, 4))   // 7
//sampleEnd
}
```

### Trailing Lambda 문법

함수의 **마지막 매개변수가 람다**일 때, 소괄호 밖에 중괄호로 빼낼 수 있습니다.

```kotlin [kotlin-playground]
fun performAction(times: Int, action: () -> Unit) {
    repeat(times) { action() }
}

fun main() {
//sampleStart
    // 일반 호출
    performAction(3, { println("실행!") })

    // trailing lambda (마지막 인자가 람다이므로 밖으로)
    performAction(3) { println("실행!") }

    // 람다가 유일한 인자라면 소괄호도 생략 가능
    val numbers = listOf(1, 2, 3)
    numbers.forEach { println(it) }
//sampleEnd
}
```

```
Trailing Lambda 변환 과정

단계 1: 기본 호출
  button.setOnClickListener({ println("클릭!") })

단계 2: 마지막 람다를 밖으로
  button.setOnClickListener() { println("클릭!") }

단계 3: 빈 소괄호 생략
  button.setOnClickListener { println("클릭!") }
```

### Compose에서의 활용

Compose에서 `@Composable` 콘텐츠를 전달하는 것이 바로 **trailing lambda**입니다!

```kotlin [compose-playground]
// Column의 실제 시그니처 (단순화)
@Composable
fun Column(
    modifier: Modifier = Modifier,
    content: @Composable ColumnScope.() -> Unit   // 마지막 인자가 람다!
)

// trailing lambda 덕분에 이렇게 자연스럽게 작성 가능
Column(modifier = Modifier.padding(16.dp)) {
    Text("첫 번째 줄")       // content 람다 내부
    Text("두 번째 줄")
    Button(onClick = { }) {  // Button도 trailing lambda 사용
        Text("클릭하세요")
    }
}
```

---

## 4. 고차 함수

**고차 함수(Higher-Order Function)** 는 함수를 매개변수로 받거나 함수를 반환하는 함수입니다.

```kotlin [kotlin-playground]
// 함수를 매개변수로 받는 고차 함수
fun calculate(a: Int, b: Int, operation: (Int, Int) -> Int): Int {
    return operation(a, b)
}

// 함수를 반환하는 고차 함수
fun multiplier(factor: Int): (Int) -> Int {
    return { number -> number * factor }
}

fun main() {
//sampleStart
    val sum = calculate(10, 5) { a, b -> a + b }      // 15
    val diff = calculate(10, 5) { a, b -> a - b }     // 5
    val product = calculate(10, 5) { a, b -> a * b }   // 50
    println("sum=$sum, diff=$diff, product=$product")

    val double = multiplier(2)
    val triple = multiplier(3)
    println(double(5))   // 10
    println(triple(5))   // 15
//sampleEnd
}
```

### 함수 참조 (`::`)

기존 함수를 람다 대신 전달할 때 사용합니다.

```kotlin [kotlin-playground]
fun isEven(n: Int): Boolean = n % 2 == 0

fun main() {
//sampleStart
    val numbers = listOf(1, 2, 3, 4, 5)
    println(numbers.filter(::isEven))    // [2, 4]
//sampleEnd
}
```

### Compose에서의 활용

이벤트 핸들러를 전달하는 패턴이 고차 함수의 대표적 예입니다.

```kotlin [compose-playground]
@Composable
fun CounterButton(
    count: Int,
    onIncrement: () -> Unit      // 함수를 매개변수로 받음
) {
    Button(onClick = onIncrement) {  // 전달받은 함수를 다시 전달
        Text("Count: $count")
    }
}

// 사용
CounterButton(
    count = count,
    onIncrement = { count++ }
)
```

---

## 5. 컬렉션 함수형 처리

Kotlin은 컬렉션을 함수형으로 처리하는 풍부한 API를 제공합니다.

### 핵심 함수들

```kotlin [kotlin-playground]
fun main() {
//sampleStart
    val numbers = listOf(1, 2, 3, 4, 5, 6, 7, 8, 9, 10)

    // map: 각 요소를 변환
    val doubled = numbers.map { it * 2 }
    println(doubled)  // [2, 4, 6, 8, 10, 12, 14, 16, 18, 20]

    // filter: 조건에 맞는 요소만 추출
    val evens = numbers.filter { it % 2 == 0 }
    println(evens)  // [2, 4, 6, 8, 10]

    // forEach: 각 요소에 대해 실행
    numbers.forEach { print("$it ") }
    println()  // 1 2 3 4 5 6 7 8 9 10

    // reduce: 누적 연산
    val sum = numbers.reduce { acc, num -> acc + num }
    println(sum)  // 55

    // fold: 초기값이 있는 누적 연산
    val sumFrom100 = numbers.fold(100) { acc, num -> acc + num }
    println(sumFrom100)  // 155

    // any / all / none: 조건 검사
    println(numbers.any { it > 5 })    // true  (하나라도 5보다 큰가?)
    println(numbers.all { it > 0 })    // true  (모두 0보다 큰가?)
    println(numbers.none { it < 0 })   // true  (0보다 작은 게 없는가?)
//sampleEnd
}
```

### 체이닝

여러 함수를 연결하여 복잡한 변환을 간결하게 표현할 수 있습니다.

```kotlin [kotlin-playground]
data class Student(val name: String, val score: Int, val grade: String)

fun main() {
//sampleStart
    val students = listOf(
        Student("김철수", 85, "A"),
        Student("이영희", 92, "A"),
        Student("박민수", 76, "B"),
        Student("최지은", 95, "A"),
        Student("정현우", 68, "C")
    )

    // A등급 학생들의 이름을 점수 내림차순으로 정렬
    val topStudents = students
        .filter { it.grade == "A" }
        .sortedByDescending { it.score }
        .map { it.name }
    println(topStudents)  // [최지은, 이영희, 김철수]

    // 그룹화
    val byGrade = students.groupBy { it.grade }
    println(byGrade)  // {A=[김철수, 이영희, 최지은], B=[박민수], C=[정현우]}

    // 평균
    val average = students.map { it.score }.average()
    println(average)  // 83.2
//sampleEnd
}
```

```
컬렉션 함수형 처리 흐름

[1, 2, 3, 4, 5, 6, 7, 8]
         │
    filter { it % 2 == 0 }
         │
    [2, 4, 6, 8]
         │
    map { it * it }
         │
    [4, 16, 36, 64]
         │
    reduce { acc, n -> acc + n }
         │
       120
```

### Compose에서의 활용

```kotlin [compose-playground]
@Composable
fun FilteredStudentList(students: List<Student>, minScore: Int) {
    val filtered = students
        .filter { it.score >= minScore }
        .sortedByDescending { it.score }

    LazyColumn {
        items(filtered) { student ->
            Text("${student.name}: ${student.score}점")
        }
    }
}
```

---

## 6. 확장 함수

기존 클래스에 **새로운 함수를 추가**할 수 있는 기능입니다. 원본 클래스를 수정하지 않습니다.

```kotlin [kotlin-playground]
// String에 확장 함수 추가
fun String.addExclamation(): String = "$this!"

// Int에 확장 함수 추가
fun Int.isEven(): Boolean = this % 2 == 0

// 확장 프로퍼티도 가능
val String.wordCount: Int
    get() = this.split(" ").size

fun main() {
//sampleStart
    println("Hello".addExclamation())   // Hello!

    println(4.isEven())   // true
    println(7.isEven())   // false

    println("Hello World Kotlin".wordCount)   // 3
//sampleEnd
}
```

```
확장 함수의 동작 원리

일반 함수:                    확장 함수:
fun addExcl(s: String)       fun String.addExclamation()
  = "$s!"                       = "$this!"

호출:                         호출:
addExcl("Hello")             "Hello".addExclamation()

→ 컴파일러가 내부적으로 같은 바이트코드로 변환
→ 실제로 클래스를 수정하는 것이 아님!
```

### 실용적인 예시

```kotlin [compose-playground]
// Context 확장 함수 (Android에서 자주 사용)
fun Context.showToast(message: String) {
    Toast.makeText(this, message, Toast.LENGTH_SHORT).show()
}

// 날짜 포맷 확장 함수
fun Long.toFormattedDate(): String {
    val sdf = SimpleDateFormat("yyyy-MM-dd", Locale.getDefault())
    return sdf.format(Date(this))
}

println(System.currentTimeMillis().toFormattedDate())
```

### Compose에서의 활용: Modifier 체이닝

Compose의 `Modifier`가 `.padding().size().clickable()` 이렇게 체이닝 가능한 이유가 바로 **확장 함수** 입니다!

```kotlin [compose-playground]
// Modifier.padding()은 확장 함수
fun Modifier.padding(all: Dp): Modifier = this.then(
    PaddingModifier(all, all, all, all)
)

// 그래서 이런 체이닝이 가능
Modifier
    .fillMaxWidth()         // Modifier의 확장 함수
    .padding(16.dp)         // Modifier의 확장 함수
    .background(Color.White) // Modifier의 확장 함수
    .clickable { }          // Modifier의 확장 함수
```

```
Modifier 체이닝 = 확장 함수 체인

Modifier  →  .fillMaxWidth()  →  .padding(16.dp)  →  .background(White)
   │              │                     │                     │
   빈 Modifier    Modifier 반환         Modifier 반환         Modifier 반환
               (기존 + fillMax)     (기존 + padding)      (기존 + background)
```

---

## 7. Scope 함수: let, apply, also, with, run

Scope 함수는 객체의 컨텍스트 내에서 코드 블록을 실행하는 함수입니다.

### 한눈에 비교

| 함수 | 객체 참조 | 반환값 | 주요 용도 |
|------|----------|--------|----------|
| `let` | `it` | 람다 결과 | null 체크, 변환 |
| `apply` | `this` | 객체 자신 | 객체 초기화/설정 |
| `also` | `it` | 객체 자신 | 부가 작업 (로깅 등) |
| `with` | `this` | 람다 결과 | 객체의 여러 메서드 호출 |
| `run` | `this` | 람다 결과 | 초기화 + 결과 계산 |

### let

```kotlin [kotlin-playground]
fun main() {
//sampleStart
    // null 안전 처리 (가장 자주 사용하는 패턴)
    val name: String? = "Kotlin"
    name?.let {
        println("이름: $it, 길이: ${it.length}")
    }

    // 변환
    val length = name?.let {
        println("처리 중: $it")
        it.length   // 반환값
    }
    println(length)   // 6
//sampleEnd
}
```

### apply

```kotlin [kotlin-playground]
fun main() {
//sampleStart
    // 객체 초기화에 최적
    data class Person(var name: String = "", var age: Int = 0, var city: String = "")

    val person = Person().apply {
        name = "홍길동"        // this.name = "홍길동" 과 동일
        age = 25
        city = "서울"
    }
    println(person)  // Person(name=홍길동, age=25, city=서울)
//sampleEnd
}
```

### also

```kotlin [kotlin-playground]
fun main() {
//sampleStart
    // 부가 작업 (원래 객체를 변경하지 않고 부가 작업)
    val numbers = mutableListOf(1, 2, 3)
        .also { println("초기 리스트: $it") }
        .also { it.add(4) }
        .also { println("추가 후: $it") }
    // 초기 리스트: [1, 2, 3]
    // 추가 후: [1, 2, 3, 4]
//sampleEnd
}
```

### with

```kotlin [kotlin-playground]
fun main() {
//sampleStart
    // 이미 존재하는 객체의 여러 멤버를 호출할 때
    val builder = StringBuilder()
    val result = with(builder) {
        append("Hello")
        append(", ")
        append("World!")
        toString()   // 반환값
    }
    println(result)   // Hello, World!
//sampleEnd
}
```

### run

```kotlin [kotlin-playground]
fun main() {
//sampleStart
    // 객체 초기화 + 결과 계산
    val greeting = "Kotlin".run {
        println("문자열 처리 중: $this")
        "Hello, $this!"   // 반환값
    }
    println(greeting)   // Hello, Kotlin!
//sampleEnd
}
```

```
Scope 함수 선택 가이드

         반환값이 필요한가?
              │
        ┌─────┴─────┐
       YES          NO
        │            │
   객체 참조를     객체 참조를
   this? it?     this? it?
    │     │       │     │
   run   let    apply  also
    │     │       │     │
  초기화+ null체크 객체설정 로깅/
  계산   변환           디버깅

  with: 이미 있는 객체의 여러 멤버를 호출할 때
```

### Compose에서의 활용

```kotlin [compose-playground]
// apply로 Paint 객체 초기화
Canvas(modifier = Modifier.size(200.dp)) {
    drawCircle(
        color = Color.Blue,
        radius = 50f,
        center = center
    )
}

// let으로 nullable 처리
@Composable
fun ProfileImage(url: String?) {
    url?.let { imageUrl ->
        AsyncImage(model = imageUrl, contentDescription = null)
    } ?: Icon(Icons.Default.Person, contentDescription = null)
}

// also로 디버깅
val state = remember { mutableStateOf(0) }
    .also { Log.d("Debug", "State created: ${it.value}") }
```

---

## 8. 제네릭 기초

제네릭(Generic)은 **타입을 매개변수화**하여 재사용 가능한 코드를 작성하는 기법입니다.

### 기본 사용법

```kotlin [kotlin-playground]
class Box<T>(val content: T) {
    fun getContent(): T = content
}

fun <T> printItem(item: T) {
    println("Item: $item (${item!!::class.simpleName})")
}

fun main() {
//sampleStart
    // 제네릭 클래스
    val intBox = Box(42)            // Box<Int>
    val stringBox = Box("Hello")    // Box<String>
    println(intBox.getContent())    // 42
    println(stringBox.getContent()) // Hello

    // 제네릭 함수
    printItem(42)        // Item: 42 (Int)
    printItem("Hello")   // Item: Hello (String)
//sampleEnd
}
```

### 제네릭 제약

```kotlin [kotlin-playground]
// T가 Comparable을 구현해야 함
fun <T : Comparable<T>> findMax(a: T, b: T): T {
    return if (a > b) a else b
}

fun main() {
//sampleStart
    println(findMax(3, 7))       // 7
    println(findMax("abc", "xyz")) // xyz
//sampleEnd
}
```

### 실용 예제: 결과 래퍼

```kotlin [kotlin-playground]
sealed class Result<out T> {
    data class Success<T>(val data: T) : Result<T>()
    data class Error(val message: String) : Result<Nothing>()
    data object Loading : Result<Nothing>()
}

fun fetchUser(): Result<String> {
    return Result.Success("홍길동")
}

fun main() {
//sampleStart
    when (val result = fetchUser()) {
        is Result.Success -> println("사용자: ${result.data}")
        is Result.Error   -> println("에러: ${result.message}")
        is Result.Loading -> println("로딩 중...")
    }
//sampleEnd
}
```

```
제네릭의 동작 원리

Box<T>는 틀(template)
┌──────────────┐
│   Box<T>     │
│  ┌────────┐  │
│  │   T    │  │    ← T 자리에 어떤 타입이든 들어갈 수 있음
│  └────────┘  │
└──────────────┘

Box<Int>                Box<String>
┌──────────────┐       ┌──────────────┐
│  ┌────────┐  │       │  ┌────────┐  │
│  │  Int   │  │       │  │ String │  │
│  │   42   │  │       │  │"Hello" │  │
│  └────────┘  │       │  └────────┘  │
└──────────────┘       └──────────────┘
```

### Compose에서의 활용

Compose의 `State<T>`, `MutableState<T>`, `Flow<T>` 등이 모두 제네릭을 사용합니다.

```kotlin [compose-playground]
// State<T>는 제네릭
val count: MutableState<Int> = remember { mutableStateOf(0) }
val name: MutableState<String> = remember { mutableStateOf("") }

// LazyColumn의 items도 제네릭
fun <T> LazyListScope.items(
    items: List<T>,
    key: ((item: T) -> Any)? = null,
    itemContent: @Composable LazyItemScope.(item: T) -> Unit
)
```

---

## 9. Compose에서의 활용 종합

이 문서에서 배운 함수형 프로그래밍 개념이 Compose에서 어떻게 쓰이는지 종합적으로 정리합니다.

### @Composable이 Trailing Lambda인 이유

```kotlin [compose-playground]
// Compose UI 코드를 자연스러운 "선언형"으로 만들어주는 핵심이 trailing lambda입니다.

// 만약 trailing lambda가 없다면...
Column(
    modifier = Modifier.padding(16.dp),
    content = {                        // 매개변수 이름을 일일이 지정해야 함
        Text("Hello")
        Text("World")
    }
)

// trailing lambda 덕분에 이렇게 깔끔하게
Column(Modifier.padding(16.dp)) {
    Text("Hello")
    Text("World")
}

// 더 나아가 modifier도 기본값이 있으므로
Column {
    Text("Hello")
    Text("World")
}
```

### Modifier 체이닝이 확장 함수인 이유

```kotlin [compose-playground]
// 확장 함수 덕분에 Modifier를 무한히 체이닝할 수 있습니다.
// 각 확장 함수는 새로운 Modifier를 반환합니다.

Text(
    text = "스타일이 적용된 텍스트",
    modifier = Modifier
        .fillMaxWidth()           // 확장 함수: 너비를 채움
        .padding(16.dp)           // 확장 함수: 패딩 추가
        .background(Color.LightGray) // 확장 함수: 배경색
        .clickable { }            // 확장 함수: 클릭 이벤트
)
```

### 종합 연결 표

| 함수형 개념 | Compose 활용 | 왜 중요한가 |
|------------|-------------|------------|
| 기본값 인자 | 모든 컴포넌트 매개변수 | 유연한 API, 오버로딩 불필요 |
| 명명 인자 | `Text(text = ..., fontSize = ...)` | 가독성, 선택적 매개변수 |
| 람다 | 이벤트 핸들러 `onClick = { }` | 콜백 패턴 |
| Trailing lambda | `Column { }`, `Button { }` | 선언형 UI 문법 |
| 고차 함수 | `items()`, `remember()` | 컴포넌트 추상화 |
| 확장 함수 | `Modifier.padding()` | 체이닝 API |
| Scope 함수 | 초기화, null 처리 | 간결한 코드 |
| 제네릭 | `State<T>`, `Flow<T>` | 타입 안전한 상태 관리 |

```
Compose 코드를 해부하면 모두 함수형 프로그래밍

@Composable                          ← 함수!
fun MyScreen() {
    var text by remember {           ← 고차 함수 (람다를 받음)
        mutableStateOf("")           ← 제네릭: MutableState<String>
    }

    Column(                          ← trailing lambda
        modifier = Modifier
            .fillMaxSize()           ← 확장 함수
            .padding(16.dp)          ← 확장 함수
    ) {
        TextField(
            value = text,
            onValueChange = { text = it },  ← 람다 (이벤트 핸들러)
            modifier = Modifier
                .fillMaxWidth()      ← 확장 함수
        )

        text.takeIf {                ← 고차 함수
            it.isNotBlank()
        }?.let {                     ← scope 함수
            Text("입력: $it")
        }
    }
}
```

---

## 10. 퀴즈: 실습 체크리스트

다음 항목들을 직접 코드로 작성해보며 확인하세요.

- [ ] 단일 표현식 함수(`=`)를 사용하여 함수를 간결하게 작성할 수 있다
- [ ] 기본값 인자와 명명 인자를 활용하여 유연한 함수를 설계할 수 있다
- [ ] 람다 표현식을 변수에 저장하고 함수에 전달할 수 있다
- [ ] trailing lambda 문법이 왜 Compose에서 `Column { }` 같은 형태를 가능하게 하는지 설명할 수 있다
- [ ] `map`, `filter`, `reduce`, `forEach`를 사용하여 컬렉션을 변환할 수 있다
- [ ] 컬렉션 함수를 체이닝하여 복잡한 데이터 변환 파이프라인을 만들 수 있다
- [ ] 확장 함수를 직접 작성하고, Modifier 체이닝이 확장 함수인 이유를 설명할 수 있다
- [ ] `let`, `apply`, `also`, `with`, `run`의 차이점을 설명하고 적절한 상황에 사용할 수 있다
- [ ] 제네릭 클래스와 함수를 작성할 수 있다
- [ ] 고차 함수를 직접 정의하고 호출할 수 있다
- [ ] Compose 코드에서 함수형 프로그래밍 개념이 어디에 적용되었는지 최소 5가지를 찾아낼 수 있다

> **다음 문서**: [03. 코루틴과 비동기 처리](03-coroutines-and-async.md)에서 Kotlin의 비동기 프로그래밍과 Compose에서의 활용을 배웁니다.
