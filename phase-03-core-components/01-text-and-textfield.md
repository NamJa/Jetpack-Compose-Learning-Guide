# Text와 TextField 완전 가이드

> **"텍스트는 UI의 뼈대입니다. 잘 표시하고, 잘 입력받는 것이 앱의 첫인상을 결정합니다."**

---

## 목차

1. [Text 컴포넌트 기초](#1-text-컴포넌트-기초)
2. [Text 스타일링](#2-text-스타일링)
3. [MaterialTheme.typography 활용](#3-materialthemetypography-활용)
4. [AnnotatedString으로 부분 스타일 적용](#4-annotatedstring으로-부분-스타일-적용)
5. [TextField 기초 (State-Based API)](#5-textfield-기초-state-based-api)
6. [OutlinedTextField](#6-outlinedtextfield)
7. [InputTransformation과 OutputTransformation](#7-inputtransformation과-outputtransformation)
8. [SecureTextField (비밀번호 입력)](#8-securetextfield-비밀번호-입력)
9. [TextFieldState 프로그래밍 방식 제어](#9-textfieldstate-프로그래밍-방식-제어)
10. [KeyboardOptions와 KeyboardActions](#10-keyboardoptions와-keyboardactions)
11. [BasicTextField로 완전 커스텀 입력 필드 만들기](#11-basictextfield로-완전-커스텀-입력-필드-만들기)
12. [Value-Based vs State-Based TextField 비교](#12-value-based-vs-state-based-textfield-비교)
13. [XML View와의 비교](#13-xml-view와의-비교)
14. [자주 하는 실수와 주의사항](#14-자주-하는-실수와-주의사항)

---

## 1. Text 컴포넌트 기초

`Text`는 Jetpack Compose에서 화면에 텍스트를 표시하는 가장 기본적인 컴포넌트입니다. Android XML의 `TextView`에 해당합니다.

### 기본 사용법

```kotlin [compose-playground]
import androidx.compose.material3.Text

@Composable
fun SimpleTextExample() {
    Text(text = "안녕하세요, Jetpack Compose!")
}
```

### Text의 주요 매개변수

| 매개변수 | 타입 | 설명 | 기본값 |
|----------|------|------|--------|
| `text` | `String` | 표시할 텍스트 | (필수) |
| `modifier` | `Modifier` | 레이아웃, 크기, 패딩 등 수정자 | `Modifier` |
| `color` | `Color` | 텍스트 색상 | `Color.Unspecified` |
| `fontSize` | `TextUnit` | 글꼴 크기 | 테마 기본값 |
| `fontWeight` | `FontWeight?` | 글꼴 두께 (Bold, Light 등) | `null` |
| `fontStyle` | `FontStyle?` | 이탤릭 등 글꼴 스타일 | `null` |
| `fontFamily` | `FontFamily?` | 글꼴 패밀리 | `null` |
| `letterSpacing` | `TextUnit` | 자간 | `TextUnit.Unspecified` |
| `textDecoration` | `TextDecoration?` | 밑줄, 취소선 등 | `null` |
| `textAlign` | `TextAlign?` | 텍스트 정렬 (Center, Start 등) | `null` |
| `lineHeight` | `TextUnit` | 줄 높이 | `TextUnit.Unspecified` |
| `overflow` | `TextOverflow` | 텍스트 넘침 처리 | `TextOverflow.Clip` |
| `softWrap` | `Boolean` | 자동 줄바꿈 여부 | `true` |
| `maxLines` | `Int` | 최대 줄 수 | `Int.MAX_VALUE` |
| `minLines` | `Int` | 최소 줄 수 | `1` |
| `autoSize` | `TextAutoSize` | 텍스트 자동 크기 조절 | `TextAutoSize.None` |
| `style` | `TextStyle` | 텍스트 전체 스타일 | `LocalTextStyle.current` |

---

## 2. Text 스타일링

### 색상과 크기

```kotlin [compose-playground]
@Composable
fun StyledTextExample() {
    Column(modifier = Modifier.padding(16.dp)) {
        Text(
            text = "큰 파란 텍스트",
            color = Color.Blue,
            fontSize = 24.sp,
            fontWeight = FontWeight.Bold
        )

        Text(
            text = "작은 회색 텍스트",
            color = Color.Gray,
            fontSize = 12.sp,
            fontWeight = FontWeight.Light
        )
    }
}
```

> **sp vs dp**: 텍스트 크기에는 항상 `sp` (Scale-independent Pixels)를 사용합니다. `sp`는 사용자의 글꼴 크기 설정에 따라 자동으로 조절됩니다. `dp`는 레이아웃 치수에 사용합니다.

### 정렬과 줄바꿈

```kotlin [compose-playground]
@Composable
fun TextAlignmentExample() {
    Text(
        text = "이 텍스트는 가운데 정렬됩니다. 긴 문장은 자동으로 줄바꿈됩니다.",
        textAlign = TextAlign.Center,
        modifier = Modifier.fillMaxWidth()
    )
}
```

### 텍스트 넘침 처리

```kotlin [compose-playground]
@Composable
fun TextOverflowExample() {
    // 1줄로 제한하고, 넘치면 ... 표시
    Text(
        text = "이 텍스트는 매우 긴 문장으로, 한 줄에 다 표시되지 않으면 말줄임표로 처리됩니다.",
        maxLines = 1,
        overflow = TextOverflow.Ellipsis
    )
}
```

### TextOverflow 옵션

| 옵션 | 설명 |
|------|------|
| `TextOverflow.Clip` | 영역을 넘으면 잘라냄 (기본값) |
| `TextOverflow.Ellipsis` | 넘치는 부분을 `...`으로 표시 |
| `TextOverflow.Visible` | 영역을 넘어도 표시 |

### 텍스트 자동 크기 조절 (TextAutoSize)

Compose Foundation 1.8+에서는 `autoSize` 매개변수를 사용하여 텍스트가 주어진 영역에 맞도록 글꼴 크기를 자동으로 조절할 수 있습니다. XML의 `autoSizeTextType`에 해당합니다.

```kotlin [compose-playground]
@Composable
fun AutoSizeTextExample() {
    Text(
        text = "이 텍스트는 영역에 맞게 자동으로 크기가 조절됩니다",
        autoSize = TextAutoSize.StepBased(
            minFontSize = 10.sp,
            maxFontSize = 24.sp,
            stepSize = 2.sp
        ),
        maxLines = 1,
        modifier = Modifier
            .fillMaxWidth()
            .height(40.dp)
    )
}
```

> **참고**: `TextAutoSize.StepBased`는 `minFontSize`에서 `maxFontSize` 사이의 범위에서 `stepSize` 단위로 가장 적합한 글꼴 크기를 자동으로 선택합니다. `maxLines`와 함께 사용하는 것이 권장됩니다.

### 텍스트 장식

```kotlin [compose-playground]
@Composable
fun TextDecorationExample() {
    Column {
        Text(
            text = "밑줄 있는 텍스트",
            textDecoration = TextDecoration.Underline
        )
        Text(
            text = "취소선 있는 텍스트",
            textDecoration = TextDecoration.LineThrough
        )
        Text(
            text = "밑줄 + 취소선",
            textDecoration = TextDecoration.combine(
                listOf(TextDecoration.Underline, TextDecoration.LineThrough)
            )
        )
    }
}
```

---

## 3. MaterialTheme.typography 활용

Material Design 3에서 제공하는 타이포그래피 스타일을 사용하면, 앱 전체에서 일관된 텍스트 스타일을 유지할 수 있습니다.

### 기본 타이포그래피 스타일

```kotlin [compose-playground]
@Composable
fun TypographyExample() {
    Column(modifier = Modifier.padding(16.dp)) {
        Text(
            text = "Display Large",
            style = MaterialTheme.typography.displayLarge
        )
        Text(
            text = "Headline Medium",
            style = MaterialTheme.typography.headlineMedium
        )
        Text(
            text = "Title Small",
            style = MaterialTheme.typography.titleSmall
        )
        Text(
            text = "Body Large - 본문 텍스트에 사용합니다",
            style = MaterialTheme.typography.bodyLarge
        )
        Text(
            text = "Label Medium",
            style = MaterialTheme.typography.labelMedium
        )
    }
}
```

### Material 3 타이포그래피 스케일

| 카테고리 | 스타일 | 일반적인 용도 |
|----------|--------|---------------|
| Display | `displayLarge` / `displayMedium` / `displaySmall` | 매우 큰 제목 (히어로 영역) |
| Headline | `headlineLarge` / `headlineMedium` / `headlineSmall` | 섹션 제목 |
| Title | `titleLarge` / `titleMedium` / `titleSmall` | 카드, 대화상자 제목 |
| Body | `bodyLarge` / `bodyMedium` / `bodySmall` | 본문 텍스트 |
| Label | `labelLarge` / `labelMedium` / `labelSmall` | 버튼, 탭, 캡션 |

### 스타일 커스텀 (copy 활용)

```kotlin [compose-playground]
@Composable
fun CustomStyleExample() {
    Text(
        text = "기본 스타일에 색상만 변경",
        style = MaterialTheme.typography.bodyLarge.copy(
            color = Color.Red,
            fontWeight = FontWeight.Bold
        )
    )
}
```

---

## 4. AnnotatedString으로 부분 스타일 적용

하나의 텍스트 안에서 특정 부분만 다르게 스타일링하고 싶을 때 `AnnotatedString`을 사용합니다.

### buildAnnotatedString 사용

```kotlin [compose-playground]
@Composable
fun AnnotatedStringExample() {
    val annotatedText = buildAnnotatedString {
        append("이것은 ")

        withStyle(style = SpanStyle(
            color = Color.Blue,
            fontWeight = FontWeight.Bold,
            fontSize = 20.sp
        )) {
            append("파란색 볼드")
        }

        append(" 텍스트이고, ")

        withStyle(style = SpanStyle(
            color = Color.Red,
            textDecoration = TextDecoration.Underline
        )) {
            append("빨간색 밑줄")
        }

        append(" 텍스트도 있습니다.")
    }

    Text(text = annotatedText)
}
```

### 클릭 가능한 부분 텍스트

```kotlin [compose-playground]
@Composable
fun ClickableAnnotatedTextExample() {
    val annotatedText = buildAnnotatedString {
        append("계속 진행하면 ")

        // 클릭할 영역에 태그(annotation) 추가
        pushStringAnnotation(tag = "TERMS", annotation = "https://example.com/terms")
        withStyle(style = SpanStyle(
            color = MaterialTheme.colorScheme.primary,
            textDecoration = TextDecoration.Underline
        )) {
            append("이용약관")
        }
        pop()

        append("에 동의하는 것입니다.")
    }

    ClickableText(
        text = annotatedText,
        onClick = { offset ->
            annotatedText.getStringAnnotations(
                tag = "TERMS",
                start = offset,
                end = offset
            ).firstOrNull()?.let { annotation ->
                // annotation.item에 URL이 들어있음
                println("클릭된 URL: ${annotation.item}")
            }
        }
    )
}
```

> **참고**: Compose 최신 버전에서는 `ClickableText` 대신 `Text` + `LinkAnnotation`을 사용하는 방식도 권장됩니다.

---

## 5. TextField 기초 (State-Based API)

`TextField`는 사용자로부터 텍스트 입력을 받는 컴포넌트입니다. XML의 `EditText`에 해당합니다.

**Material3 1.4.0부터 `TextFieldState` 기반의 새로운 API가 도입되었습니다.** 기존의 `value` + `onValueChange` 패턴 대신, `TextFieldState` 객체로 상태를 관리하는 것이 권장됩니다. 이 새로운 방식은 텍스트 편집, 입력 변환, 보안 입력 등에서 훨씬 강력한 기능을 제공합니다.

### 기본 사용법 (권장: State-Based)

```kotlin [compose-playground]
@Composable
fun BasicTextFieldExample() {
    val textFieldState = rememberTextFieldState()

    TextField(
        state = textFieldState,
        label = { Text("이름을 입력하세요") }
    )
}
```

> **참고**: 기존의 `value` + `onValueChange` 패턴도 여전히 동작하지만, 새 프로젝트에서는 `TextFieldState` 기반 API를 사용하는 것이 권장됩니다.

### rememberTextFieldState

`rememberTextFieldState`는 `TextFieldState`를 생성하고 기억하는 함수입니다. 초기 텍스트를 지정할 수도 있습니다.

```kotlin [compose-playground]
@Composable
fun InitialTextExample() {
    // 빈 상태로 시작
    val emptyState = rememberTextFieldState()

    // 초기 텍스트 지정
    val prefilledState = rememberTextFieldState(initialText = "기본값")

    Column(modifier = Modifier.padding(16.dp)) {
        TextField(
            state = emptyState,
            label = { Text("빈 필드") }
        )

        Spacer(modifier = Modifier.height(8.dp))

        TextField(
            state = prefilledState,
            label = { Text("초기값 있는 필드") }
        )
    }
}
```

### TextField의 주요 매개변수 (State-Based)

| 매개변수 | 타입 | 설명 | 기본값 |
|----------|------|------|--------|
| `state` | `TextFieldState` | 텍스트 필드 상태 객체 | (필수) |
| `modifier` | `Modifier` | 수정자 | `Modifier` |
| `enabled` | `Boolean` | 입력 가능 여부 | `true` |
| `readOnly` | `Boolean` | 읽기 전용 여부 | `false` |
| `label` | `@Composable (() -> Unit)?` | 레이블 (힌트가 위로 이동) | `null` |
| `placeholder` | `@Composable (() -> Unit)?` | 빈 상태일 때 표시되는 힌트 | `null` |
| `leadingIcon` | `@Composable (() -> Unit)?` | 왼쪽 아이콘 | `null` |
| `trailingIcon` | `@Composable (() -> Unit)?` | 오른쪽 아이콘 | `null` |
| `supportingText` | `@Composable (() -> Unit)?` | 하단 보조 텍스트 | `null` |
| `isError` | `Boolean` | 에러 상태 표시 | `false` |
| `inputTransformation` | `InputTransformation?` | 입력 필터링/변환 | `null` |
| `outputTransformation` | `OutputTransformation?` | 표시 변환 | `null` |
| `lineLimits` | `TextFieldLineLimits` | 줄 수 제한 | `TextFieldLineLimits.Default` |
| `keyboardOptions` | `KeyboardOptions` | 키보드 타입, IME 액션 설정 | `KeyboardOptions.Default` |

### lineLimits로 줄 수 제어

기존의 `singleLine`, `maxLines` 대신 `lineLimits`를 사용합니다.

```kotlin [compose-playground]
@Composable
fun LineLimitsExample() {
    val singleLineState = rememberTextFieldState()
    val multiLineState = rememberTextFieldState()

    Column(modifier = Modifier.padding(16.dp)) {
        // 단일 줄 입력 (기존 singleLine = true 대체)
        TextField(
            state = singleLineState,
            lineLimits = TextFieldLineLimits.SingleLine,
            label = { Text("한 줄 입력") }
        )

        Spacer(modifier = Modifier.height(8.dp))

        // 최대 5줄까지 (기존 maxLines = 5 대체)
        TextField(
            state = multiLineState,
            lineLimits = TextFieldLineLimits.MultiLine(maxHeightInLines = 5),
            label = { Text("여러 줄 입력 (최대 5줄)") }
        )
    }
}
```

### 아이콘과 보조 텍스트가 있는 TextField

```kotlin [compose-playground]
@Composable
fun RichTextFieldExample() {
    val emailState = rememberTextFieldState()
    val isError = emailState.text.isNotEmpty() && !emailState.text.contains("@")

    TextField(
        state = emailState,
        label = { Text("이메일") },
        placeholder = { Text("example@email.com") },
        leadingIcon = {
            Icon(Icons.Default.Email, contentDescription = "이메일 아이콘")
        },
        trailingIcon = {
            if (emailState.text.isNotEmpty()) {
                IconButton(onClick = { emailState.clearText() }) {
                    Icon(Icons.Default.Clear, contentDescription = "지우기")
                }
            }
        },
        supportingText = {
            if (isError) {
                Text("올바른 이메일 형식이 아닙니다")
            }
        },
        isError = isError,
        lineLimits = TextFieldLineLimits.SingleLine,
        modifier = Modifier.fillMaxWidth()
    )
}
```

---

## 6. OutlinedTextField

`OutlinedTextField`는 테두리(outline)가 있는 텍스트 입력 필드입니다. Material Design에서 권장하는 또 다른 입력 스타일입니다. State-Based API도 동일하게 적용됩니다.

```kotlin [compose-playground]
@Composable
fun OutlinedTextFieldExample() {
    val nameState = rememberTextFieldState()

    OutlinedTextField(
        state = nameState,
        label = { Text("이름") },
        placeholder = { Text("홍길동") },
        lineLimits = TextFieldLineLimits.SingleLine,
        modifier = Modifier.fillMaxWidth()
    )
}
```

### TextField vs OutlinedTextField

| 항목 | TextField (Filled) | OutlinedTextField |
|------|-------------------|-------------------|
| 외형 | 배경색 채워짐, 하단 선 | 테두리 선으로 둘러싸임 |
| 사용 시기 | 폼에서 여러 필드가 있을 때 | 단독 입력 필드, 시각적 강조 |
| 매개변수 | 동일 | 동일 |
| Material 권장 | Filled가 기본 | 대안 스타일 |

---

## 7. InputTransformation과 OutputTransformation

Material3 1.4.0+에서는 기존의 `VisualTransformation` 대신 `InputTransformation`과 `OutputTransformation`을 사용합니다.

### InputTransformation: 입력 필터링

사용자의 입력을 필터링하거나 제한하는 데 사용합니다. 기존 입력 필터링 로직을 대체합니다.

```kotlin [compose-playground]
@Composable
fun InputTransformationExample() {
    val state = rememberTextFieldState()

    Column(modifier = Modifier.padding(16.dp)) {
        // 최대 글자 수 제한
        TextField(
            state = rememberTextFieldState(),
            inputTransformation = InputTransformation.maxLength(10),
            label = { Text("최대 10자") }
        )

        Spacer(modifier = Modifier.height(8.dp))

        // 숫자만 입력 허용 (커스텀)
        TextField(
            state = rememberTextFieldState(),
            inputTransformation = InputTransformation {
                if (!asCharSequence().toString().all { it.isDigit() }) {
                    revertAllChanges()
                }
            },
            label = { Text("숫자만 입력") }
        )
    }
}
```

### InputTransformation 체이닝

여러 변환을 `then()`으로 조합할 수 있습니다.

```kotlin [compose-playground]
@Composable
fun ChainedTransformationExample() {
    val state = rememberTextFieldState()

    // 최대 6자 + 숫자만 허용
    val digitOnly = InputTransformation {
        if (!asCharSequence().toString().all { it.isDigit() }) {
            revertAllChanges()
        }
    }

    TextField(
        state = state,
        inputTransformation = InputTransformation.maxLength(6).then(digitOnly),
        label = { Text("인증번호 (숫자 6자리)") }
    )
}
```

### OutputTransformation: 표시 변환

`OutputTransformation`은 실제 데이터는 변경하지 않고, **화면에 표시되는 형태만 변경**합니다. 기존의 `VisualTransformation`을 대체합니다.

```kotlin [compose-playground]
@Composable
fun PhoneNumberOutputTransformation() {
    val state = rememberTextFieldState()

    TextField(
        state = state,
        outputTransformation = OutputTransformation {
            // 01012345678 -> 010-1234-5678 형식으로 표시
            if (length > 3) insert(3, "-")
            if (length > 8) insert(8, "-")
        },
        inputTransformation = InputTransformation.maxLength(11).then(
            InputTransformation {
                if (!asCharSequence().toString().all { it.isDigit() }) {
                    revertAllChanges()
                }
            }
        ),
        label = { Text("전화번호") },
        lineLimits = TextFieldLineLimits.SingleLine
    )
}
```

---

## 8. SecureTextField (비밀번호 입력)

Material3 1.4.0+에서는 비밀번호 입력을 위한 전용 컴포넌트인 `SecureTextField`가 제공됩니다. 기존의 `VisualTransformation` + `PasswordVisualTransformation()` 패턴을 대체합니다.

### 기본 사용법

```kotlin [compose-playground]
@Composable
fun SecureTextFieldExample() {
    val passwordState = rememberTextFieldState()

    SecureTextField(
        state = passwordState,
        label = { Text("비밀번호") },
        modifier = Modifier.fillMaxWidth()
    )
}
```

### OutlinedSecureTextField

테두리 스타일의 비밀번호 입력 필드입니다.

```kotlin [compose-playground]
@Composable
fun OutlinedSecureTextFieldExample() {
    val passwordState = rememberTextFieldState()

    OutlinedSecureTextField(
        state = passwordState,
        label = { Text("비밀번호") },
        modifier = Modifier.fillMaxWidth()
    )
}
```

> **장점**: `SecureTextField`는 비밀번호 마스킹, 입력 시 잠시 문자 표시 후 마스킹, 적절한 키보드 타입 설정 등을 자동으로 처리합니다. 직접 `VisualTransformation`을 구성할 필요가 없어 더 안전하고 간편합니다.

---

## 9. TextFieldState 프로그래밍 방식 제어

`TextFieldState`는 `edit { }` 블록을 통해 프로그래밍 방식으로 텍스트를 수정할 수 있습니다.

### state.edit { } 사용법

```kotlin [compose-playground]
@Composable
fun ProgrammaticEditExample() {
    val state = rememberTextFieldState()

    Column(modifier = Modifier.padding(16.dp)) {
        TextField(
            state = state,
            label = { Text("텍스트 입력") },
            modifier = Modifier.fillMaxWidth()
        )

        Spacer(modifier = Modifier.height(8.dp))

        Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
            // 텍스트 끝에 추가
            Button(onClick = {
                state.edit { append("!") }
            }) {
                Text("! 추가")
            }

            // 텍스트 설정 + 커서를 끝으로
            Button(onClick = {
                state.setTextAndPlaceCursorAtEnd("안녕하세요")
            }) {
                Text("텍스트 설정")
            }

            // 텍스트 전체 삭제
            Button(onClick = {
                state.clearText()
            }) {
                Text("지우기")
            }
        }
    }
}
```

### TextFieldBuffer의 주요 함수

`state.edit { }` 블록 내부에서 사용할 수 있는 `TextFieldBuffer`의 주요 함수들입니다.

| 함수 | 설명 |
|------|------|
| `append(text)` | 텍스트 끝에 추가 |
| `insert(index, text)` | 특정 위치에 삽입 |
| `replace(start, end, text)` | 범위 내 텍스트 교체 |
| `delete(start, end)` | 범위 내 텍스트 삭제 |
| `selectAll()` | 전체 선택 |
| `placeCursorAtEnd()` | 커서를 끝으로 이동 |

### TextFieldState의 편의 확장 함수

| 함수 | 설명 |
|------|------|
| `state.setTextAndPlaceCursorAtEnd("text")` | 텍스트를 설정하고 커서를 끝으로 이동 |
| `state.clearText()` | 텍스트 전체 삭제 |

### 현재 텍스트 읽기

```kotlin [compose-playground]
@Composable
fun ReadTextExample() {
    val state = rememberTextFieldState()

    TextField(
        state = state,
        label = { Text("입력") }
    )

    // state.text로 현재 텍스트를 읽을 수 있음
    Text("입력된 텍스트: ${state.text}")
}
```

---

## 10. KeyboardOptions와 KeyboardActions

사용자에게 적절한 키보드를 보여주고, 키보드의 액션 버튼 동작을 정의할 수 있습니다. State-Based API에서도 동일하게 사용됩니다.

### KeyboardOptions

```kotlin [compose-playground]
@Composable
fun KeyboardOptionsExample() {
    val phoneState = rememberTextFieldState()
    val emailState = rememberTextFieldState()

    Column(modifier = Modifier.padding(16.dp)) {
        // 숫자 키보드
        OutlinedTextField(
            state = phoneState,
            label = { Text("전화번호") },
            keyboardOptions = KeyboardOptions(
                keyboardType = KeyboardType.Phone,
                imeAction = ImeAction.Next
            ),
            lineLimits = TextFieldLineLimits.SingleLine
        )

        Spacer(modifier = Modifier.height(8.dp))

        // 이메일 키보드
        OutlinedTextField(
            state = emailState,
            label = { Text("이메일") },
            keyboardOptions = KeyboardOptions(
                keyboardType = KeyboardType.Email,
                imeAction = ImeAction.Done
            ),
            lineLimits = TextFieldLineLimits.SingleLine
        )
    }
}
```

### 주요 KeyboardType 종류

| KeyboardType | 설명 |
|-------------|------|
| `KeyboardType.Text` | 일반 텍스트 (기본값) |
| `KeyboardType.Number` | 숫자 입력 |
| `KeyboardType.Phone` | 전화번호 입력 |
| `KeyboardType.Email` | 이메일 입력 (`@` 키 표시) |
| `KeyboardType.Password` | 비밀번호 입력 |
| `KeyboardType.Uri` | URL 입력 |
| `KeyboardType.Decimal` | 소수점 포함 숫자 |

### 주요 ImeAction 종류

| ImeAction | 설명 |
|-----------|------|
| `ImeAction.Default` | 기본 동작 |
| `ImeAction.None` | 액션 없음 |
| `ImeAction.Go` | 이동 |
| `ImeAction.Search` | 검색 |
| `ImeAction.Send` | 전송 |
| `ImeAction.Next` | 다음 필드로 이동 |
| `ImeAction.Done` | 완료 (키보드 닫기) |

---

## 11. BasicTextField로 완전 커스텀 입력 필드 만들기

Material Design 스타일 없이 완전히 자유로운 형태의 입력 필드가 필요할 때 `BasicTextField`를 사용합니다. `BasicTextField`도 State-Based API를 지원합니다.

```kotlin [compose-playground]
@Composable
fun CustomSearchBar() {
    val queryState = rememberTextFieldState()

    BasicTextField(
        state = queryState,
        modifier = Modifier
            .fillMaxWidth()
            .background(
                color = Color.LightGray.copy(alpha = 0.3f),
                shape = RoundedCornerShape(12.dp)
            )
            .padding(horizontal = 16.dp, vertical = 12.dp),
        lineLimits = TextFieldLineLimits.SingleLine,
        textStyle = TextStyle(
            fontSize = 16.sp,
            color = Color.Black
        ),
        decorator = { innerTextField ->
            Row(
                verticalAlignment = Alignment.CenterVertically
            ) {
                Icon(
                    Icons.Default.Search,
                    contentDescription = "검색",
                    tint = Color.Gray
                )
                Spacer(modifier = Modifier.width(8.dp))
                Box(modifier = Modifier.weight(1f)) {
                    if (queryState.text.isEmpty()) {
                        Text(
                            text = "검색어를 입력하세요",
                            color = Color.Gray,
                            fontSize = 16.sp
                        )
                    }
                    innerTextField() // 실제 입력 필드
                }
            }
        }
    )
}
```

> **핵심 포인트**: State-Based `BasicTextField`에서는 `decorationBox` 대신 `decorator` 매개변수를 사용합니다. 반드시 `innerTextField()`를 호출해야 실제 텍스트 입력이 동작합니다.

---

## 12. Value-Based vs State-Based TextField 비교

Material3 1.4.0 이후, TextField에는 두 가지 API 패턴이 공존합니다. 새 프로젝트에서는 State-Based API를 권장합니다.

### 비교 표

| 기능 | Value-Based (레거시) | State-Based (권장) |
|------|---------------------|--------------------------|
| 상태 관리 | `value` + `onValueChange` 콜백 | `TextFieldState` 객체 |
| 상태 생성 | `remember { mutableStateOf("") }` | `rememberTextFieldState()` |
| 표시 변환 | `VisualTransformation` | `OutputTransformation` |
| 입력 필터링 | 직접 `onValueChange`에서 필터링 | `InputTransformation` |
| 줄 수 제한 | `singleLine`, `maxLines` | `lineLimits: TextFieldLineLimits` |
| 비밀번호 입력 | `PasswordVisualTransformation()` | `SecureTextField` |
| 프로그래밍 편집 | 상태 값 직접 변경 | `state.edit { }` |
| 현재 텍스트 읽기 | 상태 변수 참조 | `state.text` |

### 코드 비교

```kotlin [compose-playground]
// Value-Based (레거시)
@Composable
fun ValueBasedTextField() {
    var text by remember { mutableStateOf("") }
    TextField(
        value = text,
        onValueChange = { text = it },
        label = { Text("이름") },
        singleLine = true
    )
}

// State-Based (권장)
@Composable
fun StateBasedTextField() {
    val state = rememberTextFieldState()
    TextField(
        state = state,
        label = { Text("이름") },
        lineLimits = TextFieldLineLimits.SingleLine
    )
}
```

---

## 13. XML View와의 비교

| XML View (기존 방식) | Jetpack Compose | 비고 |
|---------------------|-----------------|------|
| `TextView` | `Text` | 텍스트 표시 |
| `android:text="..."` | `text = "..."` | 텍스트 내용 |
| `android:textColor` | `color = Color.Red` | 텍스트 색상 |
| `android:textSize="16sp"` | `fontSize = 16.sp` | 글꼴 크기 |
| `android:textStyle="bold"` | `fontWeight = FontWeight.Bold` | 글꼴 두께 |
| `android:maxLines="1"` | `maxLines = 1` | 최대 줄 수 |
| `android:ellipsize="end"` | `overflow = TextOverflow.Ellipsis` | 말줄임표 |
| `android:autoSizeTextType` | `autoSize = TextAutoSize.StepBased(...)` | 텍스트 자동 크기 |
| `EditText` | `TextField` / `OutlinedTextField` | 텍스트 입력 |
| `android:hint` | `label` / `placeholder` | 힌트 텍스트 |
| `android:inputType="textPassword"` | `SecureTextField` | 비밀번호 입력 |
| `TextWatcher` | `state.text` 관찰 | 텍스트 변경 감지 |
| `InputFilter` | `InputTransformation` | 입력 필터링 |
| `SpannableString` | `AnnotatedString` | 부분 스타일 |

---

## 14. 자주 하는 실수와 주의사항

### 1) Value-Based TextField에서 remember 빠뜨리기

```kotlin [compose-playground]
// 잘못된 예: 리컴포지션마다 값이 초기화됨
@Composable
fun WrongTextField() {
    var text = "" // remember가 없음!
    TextField(value = text, onValueChange = { text = it })
}

// 올바른 예 (Value-Based)
@Composable
fun CorrectTextField() {
    var text by remember { mutableStateOf("") }
    TextField(value = text, onValueChange = { text = it })
}

// 더 좋은 예 (State-Based): rememberTextFieldState가 자동으로 상태를 관리
@Composable
fun BestTextField() {
    val state = rememberTextFieldState()
    TextField(state = state)
}
```

### 2) 화면 회전 시 상태 유지

`remember`는 리컴포지션에서만 상태를 유지합니다. 화면 회전(Configuration Change) 시에도 값을 유지하려면 `rememberSaveable`을 사용하세요. `rememberTextFieldState`는 내부적으로 `Saver`를 통해 Configuration Change에서도 상태를 복원합니다.

```kotlin [compose-playground]
// Value-Based: rememberSaveable 필요
@Composable
fun PersistentTextField() {
    var text by rememberSaveable { mutableStateOf("") }
    OutlinedTextField(
        value = text,
        onValueChange = { text = it },
        label = { Text("회전해도 유지됩니다") }
    )
}

// State-Based: rememberTextFieldState가 자동으로 저장/복원
@Composable
fun PersistentStateTextField() {
    val state = rememberTextFieldState()
    OutlinedTextField(
        state = state,
        label = { Text("회전해도 유지됩니다") }
    )
}
```

### 3) 성능 주의: TextField의 빈번한 리컴포지션

Value-Based TextField는 매 글자 입력마다 `onValueChange`가 호출되어 리컴포지션이 발생합니다. State-Based API는 내부적으로 상태 변경을 더 효율적으로 처리하므로, 성능면에서도 State-Based API가 권장됩니다.

```kotlin [compose-playground]
// 좋은 패턴: TextField 상태를 가까운 곳에서 관리
@Composable
fun SearchScreen() {
    Column {
        SearchBar() // TextField 상태가 이 안에서만 관리됨
        ResultList() // SearchBar의 리컴포지션이 여기에 영향 주지 않음
    }
}
```

---

> **다음 단계**: [02. Button과 아이콘](02-button-and-icon.md)에서 다양한 버튼 컴포넌트와 아이콘 사용법을 배워봅시다.
