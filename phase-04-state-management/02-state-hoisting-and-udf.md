# 상태 호이스팅과 단방향 데이터 흐름

> "상태 호이스팅은 컴포저블을 스테이트리스(stateless)로 만들기 위해 상태를 호출자에게 옮기는 패턴이다."
> — Android 공식 문서

---

## 목차

1. [스테이트풀 vs 스테이트리스 컴포넌트](#1-스테이트풀-vs-스테이트리스-컴포넌트)
2. [상태 호이스팅 패턴](#2-상태-호이스팅-패턴)
3. [호이스팅의 이점](#3-호이스팅의-이점)
4. [호이스팅 규칙 — 상태를 어디에 둘 것인가](#4-호이스팅-규칙--상태를-어디에-둘-것인가)
5. [단방향 데이터 흐름(UDF)](#5-단방향-데이터-흐름udf)
6. [상태 홀더 클래스](#6-상태-홀더-클래스)
7. [실전 예제: 로그인 폼 상태 관리](#7-실전-예제-로그인-폼-상태-관리)

---

## 1. 스테이트풀 vs 스테이트리스 컴포넌트

Compose에서 컴포저블은 **내부에 상태를 가지는지 여부**에 따라 두 종류로 나뉩니다.

### 스테이트풀(Stateful) 컴포저블

내부에서 `remember`를 사용하여 상태를 직접 보유하는 컴포저블입니다.

```kotlin
// 스테이트풀: 내부에서 상태를 생성하고 관리한다
@Composable
fun StatefulCounter() {
    var count by remember { mutableStateOf(0) }

    Column(horizontalAlignment = Alignment.CenterHorizontally) {
        Text("Count: $count")
        Button(onClick = { count++ }) {
            Text("증가")
        }
    }
}
```

**특징**:
- 호출자가 상태를 제어할 필요가 없을 때 편리
- 재사용성이 낮고 테스트하기 어려움

### 스테이트리스(Stateless) 컴포저블

내부에 상태를 가지지 않고, 모든 상태와 이벤트를 **매개변수**로 전달받는 컴포저블입니다.

```kotlin
// 스테이트리스: 상태를 외부에서 전달받는다
@Composable
fun StatelessCounter(
    count: Int,          // 현재 상태 (값)
    onIncrement: () -> Unit  // 이벤트 콜백
) {
    Column(horizontalAlignment = Alignment.CenterHorizontally) {
        Text("Count: $count")
        Button(onClick = onIncrement) {
            Text("증가")
        }
    }
}
```

**특징**:
- 재사용 가능 (다양한 상태 소스에 연결 가능)
- 테스트가 쉬움 (상태와 이벤트를 직접 제어 가능)
- 미리보기(Preview)에서 다양한 상태를 확인 가능

---

## 2. 상태 호이스팅 패턴

**상태 호이스팅(State Hoisting)** 은 스테이트풀 컴포저블에서 상태를 추출하여 호출자에게 넘기는 패턴입니다. 이를 통해 스테이트풀 컴포저블을 스테이트리스로 변환합니다.

### 호이스팅 핵심 공식

상태를 호이스팅할 때 두 개의 매개변수로 대체합니다:

- **`value: T`** — 표시할 현재 값
- **`onValueChange: (T) -> Unit`** — 값 변경을 요청하는 이벤트 콜백

```kotlin
// ❌ 호이스팅 전: 스테이트풀
@Composable
fun NameInput() {
    var name by remember { mutableStateOf("") }

    TextField(
        value = name,
        onValueChange = { name = it },
        label = { Text("이름") }
    )
}

// ✅ 호이스팅 후: 스테이트리스
@Composable
fun NameInput(
    name: String,                   // value: 현재 값
    onNameChange: (String) -> Unit  // onValueChange: 이벤트 콜백
) {
    TextField(
        value = name,
        onValueChange = onNameChange,
        label = { Text("이름") }
    )
}

// 호출자에서 상태 관리
@Composable
fun RegistrationForm() {
    var name by remember { mutableStateOf("") }

    NameInput(
        name = name,
        onNameChange = { name = it }
    )

    // 이제 name 상태에 자유롭게 접근 가능
    if (name.isNotBlank()) {
        Text("환영합니다, ${name}님!")
    }
}
```

### TextFieldState를 활용한 호이스팅 (M3 1.4.0+)

Material3 1.4.0에서 도입된 `TextFieldState`는 호이스팅에 특히 적합합니다. UI 의존성이 없으므로 ViewModel에서 직접 보유할 수도 있습니다.

```kotlin
@Composable
fun LoginScreen(
    usernameState: TextFieldState,  // 호이스팅된 TextFieldState
    passwordState: TextFieldState,  // 호이스팅된 TextFieldState
    onLogin: () -> Unit
) {
    TextField(state = usernameState)
    SecureTextField(state = passwordState)
    Button(onClick = onLogin) { Text("Login") }
}
```

기존 `value`/`onValueChange` 패턴과 달리, `TextFieldState`는 단일 객체로 전달되므로 호이스팅 코드가 더 간결해집니다. 텍스트, 선택 범위, IME 조합 상태가 모두 하나의 객체에 캡슐화되어 있어 별도의 콜백이 필요하지 않습니다.

### 호이스팅 과정 시각화

```
[호이스팅 전]                      [호이스팅 후]

RegistrationForm                  RegistrationForm
└── NameInput                     ├── var name = remember{...}  ← 상태가 여기로 이동
    └── var name = remember{...}  └── NameInput(name, onNameChange)
                                      └── (상태 없음, 매개변수만 사용)
```

---

## 3. 호이스팅의 이점

상태 호이스팅은 단순히 "상태를 위로 옮기는 것" 이상의 중요한 이점을 제공합니다.

### 3-1. 단일 정보 소스 (Single Source of Truth)

상태가 한 곳에만 존재하므로 버그를 방지합니다.

```kotlin
// ❌ 잘못된 예: 두 곳에서 같은 데이터를 각각 관리
@Composable
fun BrokenScreen() {
    Column {
        StatefulNameInput()   // 내부에 name 상태
        StatefulGreeting()    // 내부에 또 다른 name 상태 → 동기화 문제!
    }
}

// ✅ 올바른 예: 상태를 호이스팅하여 단일 소스
@Composable
fun CorrectScreen() {
    var name by remember { mutableStateOf("") }

    Column {
        NameInput(name = name, onNameChange = { name = it })
        Greeting(name = name) // 같은 name을 참조 → 항상 동기화
    }
}
```

### 3-2. 캡슐화 (Encapsulated)

상태를 호이스팅받는 컴포저블은 상태를 변경할 수 없습니다. 오직 이벤트 콜백을 통해서만 변경을 요청할 수 있습니다.

### 3-3. 공유 가능 (Shareable)

호이스팅된 상태를 여러 컴포저블에서 공유할 수 있습니다.

```kotlin
@Composable
fun SearchScreen() {
    var query by remember { mutableStateOf("") }

    Column {
        SearchBar(query = query, onQueryChange = { query = it })
        SearchResultCount(query = query)   // 동일한 query 공유
        SearchResults(query = query)       // 동일한 query 공유
    }
}
```

### 3-4. 가로채기 가능 (Interceptable)

호출자가 상태 변경을 가로채서 수정하거나 무시할 수 있습니다.

```kotlin
@Composable
fun RegistrationForm() {
    var name by remember { mutableStateOf("") }

    NameInput(
        name = name,
        onNameChange = { newName ->
            // 10자 이하만 허용 (가로채기!)
            if (newName.length <= 10) {
                name = newName
            }
        }
    )
}
```

### 3-5. 분리 (Decoupled)

스테이트리스 컴포저블은 상태 저장 방법에 의존하지 않습니다. 상태가 `remember`, `ViewModel`, 데이터베이스 어디에서 오든 같은 컴포저블을 사용할 수 있습니다.

---

## 4. 호이스팅 규칙 — 상태를 어디에 둘 것인가

상태를 무작정 위로 올리는 것이 아니라, **적절한 위치**에 배치하는 것이 중요합니다.

### 규칙 1: 상태를 사용하는 모든 컴포저블의 가장 낮은 공통 상위 요소

```kotlin
// query를 SearchBar와 SearchResults 모두 사용
// → 둘의 공통 상위인 SearchScreen에 배치
@Composable
fun SearchScreen() {
    var query by remember { mutableStateOf("") }

    Column {
        SearchBar(query = query, onQueryChange = { query = it })
        SearchResults(query = query)
    }
}
```

### 규칙 2: 상태가 변경될 수 있는 가장 높은 수준

상태를 읽는 곳보다 변경하는 곳이 더 높은 수준에 있다면, 변경하는 수준으로 호이스팅합니다.

### 규칙 3: 동일한 이벤트에 응답하는 상태는 함께 배치

두 상태가 같은 이벤트에 의해 변경된다면, 같은 수준에 배치합니다.

```kotlin
@Composable
fun CheckoutScreen() {
    // 같은 "결제" 이벤트에 의해 변경되는 상태들 → 함께 배치
    var isProcessing by remember { mutableStateOf(false) }
    var paymentResult by remember { mutableStateOf<PaymentResult?>(null) }

    PaymentButton(
        isProcessing = isProcessing,
        onPayClick = {
            isProcessing = true
            // 결제 처리 후
            paymentResult = PaymentResult.Success
            isProcessing = false
        }
    )
}
```

### 호이스팅 수준 결정 플로우

```
상태를 어디에 둘까?
│
├── UI 요소에서만 사용? ──→ 컴포저블 내부 (remember)
│
├── 여러 컴포저블이 공유? ──→ 가장 낮은 공통 상위 (remember)
│
├── 비즈니스 로직과 관련? ──→ ViewModel
│
└── 앱 전체에서 공유? ──→ 앱 수준 상태 홀더
```

---

## 5. 단방향 데이터 흐름(UDF)

**단방향 데이터 흐름(Unidirectional Data Flow, UDF)** 은 상태가 아래로 흐르고, 이벤트가 위로 흐르는 디자인 패턴입니다.

### UDF의 핵심 개념

```
    ViewModel / 상태 소유자
         │          ▲
    상태 ↓          │ 이벤트
         │          │
    ─────┴──────────┘
         Composable UI
```

- **상태(State)는 아래로 흐른다**: 부모 → 자식 방향으로 전달
- **이벤트(Event)는 위로 흐른다**: 자식 → 부모 방향으로 콜백을 통해 전달

### UDF 적용 예제

```kotlin
// ViewModel (상태 소유)
class TaskViewModel : ViewModel() {
    private val _tasks = MutableStateFlow<List<String>>(emptyList())
    val tasks: StateFlow<List<String>> = _tasks.asStateFlow()

    fun addTask(task: String) {
        _tasks.value = _tasks.value + task
    }

    fun removeTask(task: String) {
        _tasks.value = _tasks.value - task
    }
}

// 상위 화면
@Composable
fun TaskScreen(viewModel: TaskViewModel) {
    val tasks by viewModel.tasks.collectAsStateWithLifecycle()

    TaskContent(
        tasks = tasks,                           // 상태 ↓
        onAddTask = { viewModel.addTask(it) },   // 이벤트 ↑
        onRemoveTask = { viewModel.removeTask(it) } // 이벤트 ↑
    )
}

// 스테이트리스 UI
@Composable
fun TaskContent(
    tasks: List<String>,
    onAddTask: (String) -> Unit,
    onRemoveTask: (String) -> Unit
) {
    var newTask by remember { mutableStateOf("") }

    Column {
        // 입력 영역
        Row {
            TextField(
                value = newTask,
                onValueChange = { newTask = it },
                placeholder = { Text("새 할일 입력") }
            )
            Button(onClick = {
                if (newTask.isNotBlank()) {
                    onAddTask(newTask)  // 이벤트를 위로 전달
                    newTask = ""
                }
            }) {
                Text("추가")
            }
        }

        // 목록 영역
        tasks.forEach { task ->
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween
            ) {
                Text(text = task)
                IconButton(onClick = { onRemoveTask(task) }) {
                    Icon(Icons.Default.Delete, contentDescription = "삭제")
                }
            }
        }
    }
}
```

---

## 6. 상태 홀더 클래스

UI 로직이 복잡해지면 여러 상태를 하나의 클래스로 묶어 관리할 수 있습니다. 이를 **상태 홀더(State Holder)** 라고 합니다.

### 상태 홀더가 필요한 시점

```kotlin
// ❌ 상태가 많아지면 컴포저블이 복잡해진다
@Composable
fun MessySearchScreen() {
    var query by remember { mutableStateOf("") }
    var isSearching by remember { mutableStateOf(false) }
    var showFilters by remember { mutableStateOf(false) }
    var selectedCategory by remember { mutableStateOf<String?>(null) }
    val suggestions = remember { mutableStateListOf<String>() }
    // ... 상태가 계속 늘어남
}
```

### 상태 홀더 클래스 만들기

```kotlin
// 상태 홀더 클래스 정의
@Stable // Compose에게 이 클래스가 안정적임을 알림
class SearchScreenState(
    initialQuery: String = ""
) {
    var query by mutableStateOf(initialQuery)
        private set // 외부에서 직접 변경 불가

    var isSearching by mutableStateOf(false)
        private set

    var showFilters by mutableStateOf(false)
        private set

    var selectedCategory by mutableStateOf<String?>(null)
        private set

    val suggestions = mutableStateListOf<String>()

    // UI 로직을 메서드로 캡슐화
    fun onQueryChange(newQuery: String) {
        query = newQuery
        updateSuggestions(newQuery)
    }

    fun toggleFilters() {
        showFilters = !showFilters
    }

    fun selectCategory(category: String?) {
        selectedCategory = category
    }

    fun startSearch() {
        isSearching = true
    }

    fun finishSearch() {
        isSearching = false
    }

    private fun updateSuggestions(query: String) {
        suggestions.clear()
        if (query.length >= 2) {
            // 자동완성 로직
            suggestions.addAll(
                listOf("${query} 관련 1", "${query} 관련 2")
            )
        }
    }
}

// remember로 상태 홀더를 생성하는 함수
@Composable
fun rememberSearchScreenState(
    initialQuery: String = ""
): SearchScreenState {
    return remember {
        SearchScreenState(initialQuery)
    }
}
```

### 상태 홀더 사용

```kotlin
@Composable
fun SearchScreen() {
    val state = rememberSearchScreenState()

    Column {
        SearchBar(
            query = state.query,
            onQueryChange = state::onQueryChange,
            onSearch = state::startSearch
        )

        if (state.showFilters) {
            FilterPanel(
                selectedCategory = state.selectedCategory,
                onCategorySelect = state::selectCategory
            )
        }

        if (state.suggestions.isNotEmpty()) {
            SuggestionList(suggestions = state.suggestions)
        }
    }
}
```

### @Stable 어노테이션

`@Stable`은 Compose 컴파일러에게 "이 타입은 안정적이며, 변경 시 Compose가 알 수 있다"고 알려줍니다.

```kotlin
@Stable
class CounterState(initialCount: Int = 0) {
    var count by mutableStateOf(initialCount)
        private set

    fun increment() { count++ }
    fun decrement() { count-- }
}
```

> **@Stable의 의미**: 클래스 내부 상태가 변경되면 Compose가 이를 감지할 수 있고, 변경되지 않으면 불필요한 리컴포지션을 건너뜁니다.

---

## 7. 실전 예제: 로그인 폼 상태 관리

지금까지 배운 개념을 모두 적용하여 실전 로그인 폼을 만들어 봅시다.

### 단계 1: 상태 홀더 정의

```kotlin
@Stable
class LoginFormState {
    var email by mutableStateOf("")
        private set
    var password by mutableStateOf("")
        private set
    var isPasswordVisible by mutableStateOf(false)
        private set
    var isLoading by mutableStateOf(false)
        private set

    // 유효성 검사 (derivedStateOf로 불필요한 계산 방지)
    val emailError: String?
        get() = when {
            email.isEmpty() -> null // 아직 입력 전
            !email.contains("@") -> "올바른 이메일 형식이 아닙니다"
            else -> null
        }

    val passwordError: String?
        get() = when {
            password.isEmpty() -> null
            password.length < 8 -> "비밀번호는 8자 이상이어야 합니다"
            else -> null
        }

    val isFormValid: Boolean
        get() = email.isNotEmpty() &&
                password.isNotEmpty() &&
                emailError == null &&
                passwordError == null

    fun onEmailChange(value: String) { email = value }
    fun onPasswordChange(value: String) { password = value }
    fun togglePasswordVisibility() { isPasswordVisible = !isPasswordVisible }
    fun setLoading(loading: Boolean) { isLoading = loading }
}

@Composable
fun rememberLoginFormState(): LoginFormState {
    return remember { LoginFormState() }
}
```

### 단계 2: 스테이트리스 UI 구현

```kotlin
@Composable
fun LoginForm(
    email: String,
    password: String,
    isPasswordVisible: Boolean,
    isLoading: Boolean,
    emailError: String?,
    passwordError: String?,
    isFormValid: Boolean,
    onEmailChange: (String) -> Unit,
    onPasswordChange: (String) -> Unit,
    onTogglePasswordVisibility: () -> Unit,
    onLoginClick: () -> Unit
) {
    Column(
        modifier = Modifier
            .fillMaxWidth()
            .padding(16.dp),
        verticalArrangement = Arrangement.spacedBy(12.dp)
    ) {
        Text(
            text = "로그인",
            style = MaterialTheme.typography.headlineMedium
        )

        // 이메일 입력
        OutlinedTextField(
            value = email,
            onValueChange = onEmailChange,
            label = { Text("이메일") },
            isError = emailError != null,
            supportingText = emailError?.let { { Text(it) } },
            keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Email),
            singleLine = true,
            modifier = Modifier.fillMaxWidth()
        )

        // 비밀번호 입력
        OutlinedTextField(
            value = password,
            onValueChange = onPasswordChange,
            label = { Text("비밀번호") },
            isError = passwordError != null,
            supportingText = passwordError?.let { { Text(it) } },
            visualTransformation = if (isPasswordVisible) {
                VisualTransformation.None
            } else {
                PasswordVisualTransformation()
            },
            trailingIcon = {
                IconButton(onClick = onTogglePasswordVisibility) {
                    Icon(
                        imageVector = if (isPasswordVisible) {
                            Icons.Default.VisibilityOff
                        } else {
                            Icons.Default.Visibility
                        },
                        contentDescription = "비밀번호 표시 토글"
                    )
                }
            },
            singleLine = true,
            modifier = Modifier.fillMaxWidth()
        )

        // 로그인 버튼
        Button(
            onClick = onLoginClick,
            enabled = isFormValid && !isLoading,
            modifier = Modifier.fillMaxWidth()
        ) {
            if (isLoading) {
                CircularProgressIndicator(
                    modifier = Modifier.size(20.dp),
                    color = MaterialTheme.colorScheme.onPrimary
                )
            } else {
                Text("로그인")
            }
        }
    }
}
```

### 단계 3: 스테이트풀 래퍼에서 조합

```kotlin
@Composable
fun LoginScreen(
    onLoginSuccess: () -> Unit
) {
    val formState = rememberLoginFormState()

    LoginForm(
        email = formState.email,
        password = formState.password,
        isPasswordVisible = formState.isPasswordVisible,
        isLoading = formState.isLoading,
        emailError = formState.emailError,
        passwordError = formState.passwordError,
        isFormValid = formState.isFormValid,
        onEmailChange = formState::onEmailChange,
        onPasswordChange = formState::onPasswordChange,
        onTogglePasswordVisibility = formState::togglePasswordVisibility,
        onLoginClick = {
            formState.setLoading(true)
            // 실제로는 ViewModel에서 로그인 API 호출
        }
    )
}
```

### 전체 구조 정리

```
LoginScreen (스테이트풀 - 상태 조합)
├── LoginFormState (상태 홀더 - UI 로직 캡슐화)
└── LoginForm (스테이트리스 - 순수 UI)
    ├── OutlinedTextField (이메일)
    ├── OutlinedTextField (비밀번호)
    └── Button (로그인)

데이터 흐름:
  상태 ↓ : formState → LoginForm → TextField/Button
  이벤트 ↑ : Button onClick → LoginForm 콜백 → formState 메서드
```

> **핵심 포인트**: 스테이트리스 `LoginForm`은 어떤 상태 소스와도 연결할 수 있습니다. 테스트에서 직접 값을 넘길 수도 있고, ViewModel과 연결할 수도 있습니다. 이것이 상태 호이스팅의 진정한 힘입니다.

---

> **다음 문서**: [03. Side Effects 완전 정복](03-side-effects.md)에서 컴포저블 범위 밖에서 발생하는 부수 효과를 안전하게 처리하는 방법을 알아봅니다.
