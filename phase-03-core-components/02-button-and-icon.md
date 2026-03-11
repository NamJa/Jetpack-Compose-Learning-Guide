# Button과 아이콘 완전 가이드

> **"버튼은 사용자와 앱 사이의 가장 직접적인 대화 수단입니다. 명확하고 접근 가능한 버튼이 좋은 UX를 만듭니다."**

---

## 목차

1. [Button 컴포넌트 기초](#1-button-컴포넌트-기초)
2. [Button의 주요 매개변수](#2-button의-주요-매개변수)
3. [다양한 Button 종류](#3-다양한-button-종류)
4. [Button에 아이콘 넣기](#4-button에-아이콘-넣기)
5. [IconButton](#5-iconbutton)
6. [FloatingActionButton (FAB)](#6-floatingactionbutton-fab)
7. [Icon 컴포넌트](#7-icon-컴포넌트)
8. [Material Icons 사용하기](#8-material-icons-사용하기)
9. [접근성 고려사항](#9-접근성-고려사항)
10. [커스텀 버튼 만들기](#10-커스텀-버튼-만들기)
11. [XML View와의 비교](#11-xml-view와의-비교)
12. [자주 하는 실수와 주의사항](#12-자주-하는-실수와-주의사항)

---

## 1. Button 컴포넌트 기초

`Button`은 사용자의 클릭(탭)에 반응하여 특정 동작을 수행하는 가장 기본적인 인터랙션 컴포넌트입니다.

### 기본 사용법

```kotlin [compose-playground]
import androidx.compose.material3.Button
import androidx.compose.material3.Text

@Composable
fun SimpleButtonExample() {
    Button(onClick = {
        println("버튼이 클릭되었습니다!")
    }) {
        Text("클릭하세요")
    }
}
```

> **핵심 개념**: Button의 `content` 파라미터는 `@Composable RowScope.() -> Unit` 타입입니다. 즉, 버튼 내부는 `Row`처럼 동작하므로 아이콘과 텍스트를 수평으로 배치할 수 있습니다.

---

## 2. Button의 주요 매개변수

| 매개변수 | 타입 | 설명 | 기본값 |
|----------|------|------|--------|
| `onClick` | `() -> Unit` | 클릭 시 실행되는 콜백 | (필수) |
| `modifier` | `Modifier` | 크기, 패딩 등 수정자 | `Modifier` |
| `enabled` | `Boolean` | 활성화/비활성화 | `true` |
| `shape` | `Shape` | 버튼 모양 (둥근 정도) | `ButtonDefaults.shape` |
| `colors` | `ButtonColors` | 배경색, 텍스트색 등 | `ButtonDefaults.buttonColors()` |
| `elevation` | `ButtonElevation?` | 그림자 높이 | `ButtonDefaults.buttonElevation()` |
| `border` | `BorderStroke?` | 테두리 | `null` |
| `contentPadding` | `PaddingValues` | 내부 여백 | `ButtonDefaults.ContentPadding` |
| `content` | `@Composable RowScope.() -> Unit` | 버튼 내부 콘텐츠 | (필수) |

### 활성화/비활성화 상태

```kotlin [compose-playground]
@Composable
fun ButtonEnabledExample() {
    var isAgreed by remember { mutableStateOf(false) }

    Column(modifier = Modifier.padding(16.dp)) {
        Row(verticalAlignment = Alignment.CenterVertically) {
            Checkbox(
                checked = isAgreed,
                onCheckedChange = { isAgreed = it }
            )
            Text("이용약관에 동의합니다")
        }

        Spacer(modifier = Modifier.height(16.dp))

        Button(
            onClick = { /* 가입 처리 */ },
            enabled = isAgreed // 동의해야 활성화
        ) {
            Text("가입하기")
        }
    }
}
```

### 색상 커스텀

```kotlin [compose-playground]
@Composable
fun CustomColorButtonExample() {
    Button(
        onClick = { /* ... */ },
        colors = ButtonDefaults.buttonColors(
            containerColor = Color.Red,
            contentColor = Color.White,
            disabledContainerColor = Color.Gray,
            disabledContentColor = Color.LightGray
        )
    ) {
        Text("커스텀 색상 버튼")
    }
}
```

---

## 3. 다양한 Button 종류

Material Design 3에서는 용도에 따라 5가지 버튼 스타일을 제공합니다.

### 한눈에 보기

```kotlin [compose-playground]
@Composable
fun AllButtonTypesExample() {
    Column(
        modifier = Modifier.padding(16.dp),
        verticalArrangement = Arrangement.spacedBy(12.dp)
    ) {
        // 1. Filled Button (가장 강조)
        Button(onClick = { }) {
            Text("Filled Button")
        }

        // 2. Filled Tonal Button (중간 강조)
        FilledTonalButton(onClick = { }) {
            Text("Filled Tonal Button")
        }

        // 3. Elevated Button (약간 강조)
        ElevatedButton(onClick = { }) {
            Text("Elevated Button")
        }

        // 4. Outlined Button (보통)
        OutlinedButton(onClick = { }) {
            Text("Outlined Button")
        }

        // 5. Text Button (가장 약한 강조)
        TextButton(onClick = { }) {
            Text("Text Button")
        }
    }
}
```

### Button 종류별 사용 가이드

| 종류 | 시각적 특징 | 사용 시기 | 강조 수준 |
|------|------------|-----------|-----------|
| `Button` (Filled) | 배경색 채워짐 | 가장 중요한 동작 (CTA) | 최상 |
| `FilledTonalButton` | 연한 배경색 | 보조 동작, Filled보다 약한 강조 | 높음 |
| `ElevatedButton` | 그림자 + 배경 | Tonal보다 약간 낮은 강조 | 중간 |
| `OutlinedButton` | 테두리만 있음 | 보조 동작, 취소 | 낮음 |
| `TextButton` | 텍스트만 | 덜 중요한 동작, 부가 동작 | 최하 |

### 실무 예: 대화상자 버튼 조합

```kotlin [compose-playground]
@Composable
fun DialogButtonsExample() {
    Row(
        modifier = Modifier.fillMaxWidth(),
        horizontalArrangement = Arrangement.End
    ) {
        TextButton(onClick = { /* 취소 */ }) {
            Text("취소")
        }
        Spacer(modifier = Modifier.width(8.dp))
        Button(onClick = { /* 확인 */ }) {
            Text("확인")
        }
    }
}
```

---

## 4. Button에 아이콘 넣기

Button의 content는 `RowScope`이므로 아이콘과 텍스트를 나란히 배치할 수 있습니다.

```kotlin [compose-playground]
@Composable
fun IconWithButtonExample() {
    Button(onClick = { /* ... */ }) {
        Icon(
            imageVector = Icons.Default.ShoppingCart,
            contentDescription = null, // 텍스트가 이미 의미를 전달
            modifier = Modifier.size(18.dp)
        )
        Spacer(modifier = Modifier.width(8.dp))
        Text("장바구니에 담기")
    }
}
```

### 아이콘만 있는 작은 버튼

```kotlin [compose-playground]
@Composable
fun SmallIconButtonExample() {
    Button(
        onClick = { /* ... */ },
        contentPadding = PaddingValues(12.dp) // 패딩 조절
    ) {
        Icon(
            imageVector = Icons.Default.Add,
            contentDescription = "추가"
        )
    }
}
```

---

## 5. IconButton

`IconButton`은 아이콘 하나로 이루어진 클릭 가능한 버튼입니다. 툴바, 앱바, 리스트 아이템 등에서 자주 사용됩니다.

### 기본 사용법

```kotlin [compose-playground]
@Composable
fun IconButtonExample() {
    IconButton(onClick = {
        println("좋아요 클릭!")
    }) {
        Icon(
            imageVector = Icons.Default.Favorite,
            contentDescription = "좋아요"
        )
    }
}
```

### IconButton의 주요 매개변수

| 매개변수 | 타입 | 설명 | 기본값 |
|----------|------|------|--------|
| `onClick` | `() -> Unit` | 클릭 콜백 | (필수) |
| `modifier` | `Modifier` | 수정자 | `Modifier` |
| `enabled` | `Boolean` | 활성화 여부 | `true` |
| `colors` | `IconButtonColors` | 아이콘/배경 색상 | `IconButtonDefaults.iconButtonColors()` |
| `content` | `@Composable () -> Unit` | 아이콘 콘텐츠 | (필수) |

### 토글 가능한 IconButton

```kotlin [compose-playground]
@Composable
fun ToggleIconButtonExample() {
    var isFavorite by remember { mutableStateOf(false) }

    IconButton(onClick = { isFavorite = !isFavorite }) {
        Icon(
            imageVector = if (isFavorite) {
                Icons.Filled.Favorite
            } else {
                Icons.Outlined.FavoriteBorder
            },
            contentDescription = if (isFavorite) "좋아요 해제" else "좋아요",
            tint = if (isFavorite) Color.Red else Color.Gray
        )
    }
}
```

### FilledIconButton과 변형들

```kotlin [compose-playground]
@Composable
fun IconButtonVariantsExample() {
    Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
        // 기본 IconButton (배경 없음)
        IconButton(onClick = { }) {
            Icon(Icons.Default.Settings, contentDescription = "설정")
        }

        // FilledIconButton (배경 채워짐)
        FilledIconButton(onClick = { }) {
            Icon(Icons.Default.Add, contentDescription = "추가")
        }

        // FilledTonalIconButton (연한 배경)
        FilledTonalIconButton(onClick = { }) {
            Icon(Icons.Default.Edit, contentDescription = "편집")
        }

        // OutlinedIconButton (테두리)
        OutlinedIconButton(onClick = { }) {
            Icon(Icons.Default.Share, contentDescription = "공유")
        }
    }
}
```

---

## 6. FloatingActionButton (FAB)

`FloatingActionButton`은 화면에 떠 있는 원형 버튼으로, 화면의 가장 중요한 동작을 나타냅니다.

### 기본 FAB

```kotlin [compose-playground]
@Composable
fun FabExample() {
    FloatingActionButton(
        onClick = { /* 새 항목 추가 */ }
    ) {
        Icon(
            imageVector = Icons.Default.Add,
            contentDescription = "추가"
        )
    }
}
```

### FAB의 주요 매개변수

| 매개변수 | 타입 | 설명 | 기본값 |
|----------|------|------|--------|
| `onClick` | `() -> Unit` | 클릭 콜백 | (필수) |
| `modifier` | `Modifier` | 수정자 | `Modifier` |
| `shape` | `Shape` | 모양 | `FloatingActionButtonDefaults.shape` |
| `containerColor` | `Color` | 배경색 | `FloatingActionButtonDefaults.containerColor` |
| `contentColor` | `Color` | 콘텐츠(아이콘) 색상 | `contentColorFor(containerColor)` |
| `elevation` | `FloatingActionButtonElevation` | 그림자 | `FloatingActionButtonDefaults.elevation()` |

### Small FAB

```kotlin [compose-playground]
@Composable
fun SmallFabExample() {
    SmallFloatingActionButton(
        onClick = { /* ... */ }
    ) {
        Icon(
            imageVector = Icons.Default.Add,
            contentDescription = "추가"
        )
    }
}
```

### Large FAB

```kotlin [compose-playground]
@Composable
fun LargeFabExample() {
    LargeFloatingActionButton(
        onClick = { /* ... */ }
    ) {
        Icon(
            imageVector = Icons.Default.Add,
            contentDescription = "추가",
            modifier = Modifier.size(FloatingActionButtonDefaults.LargeIconSize)
        )
    }
}
```

### ExtendedFloatingActionButton

텍스트와 아이콘을 함께 표시하는 확장형 FAB입니다.

```kotlin [compose-playground]
@Composable
fun ExtendedFabExample() {
    ExtendedFloatingActionButton(
        onClick = { /* 새 메모 작성 */ },
        icon = {
            Icon(Icons.Default.Edit, contentDescription = null)
        },
        text = {
            Text("새 메모")
        }
    )
}
```

### Scaffold에서 FAB 배치하기

```kotlin [compose-playground]
@Composable
fun ScaffoldWithFabExample() {
    Scaffold(
        floatingActionButton = {
            FloatingActionButton(onClick = { /* ... */ }) {
                Icon(Icons.Default.Add, contentDescription = "추가")
            }
        }
    ) { innerPadding ->
        // 화면 콘텐츠
        Box(modifier = Modifier.padding(innerPadding)) {
            Text("FAB가 우하단에 배치됩니다")
        }
    }
}
```

---

## 7. Icon 컴포넌트

`Icon`은 아이콘을 표시하는 컴포넌트입니다. 벡터 이미지(`ImageVector`) 또는 비트맵 이미지(`ImageBitmap`), 페인터(`Painter`)를 사용할 수 있습니다.

### 기본 사용법

```kotlin [compose-playground]
@Composable
fun IconExample() {
    Icon(
        imageVector = Icons.Default.Home,
        contentDescription = "홈",
        tint = MaterialTheme.colorScheme.primary,
        modifier = Modifier.size(24.dp)
    )
}
```

### Icon의 주요 매개변수

| 매개변수 | 타입 | 설명 | 기본값 |
|----------|------|------|--------|
| `imageVector` | `ImageVector` | 벡터 아이콘 이미지 | (세 가지 중 하나 필수) |
| `bitmap` | `ImageBitmap` | 비트맵 아이콘 이미지 | (세 가지 중 하나 필수) |
| `painter` | `Painter` | Painter 기반 아이콘 | (세 가지 중 하나 필수) |
| `contentDescription` | `String?` | 접근성 설명 | (필수, null 허용) |
| `modifier` | `Modifier` | 수정자 | `Modifier` |
| `tint` | `Color` | 아이콘 색상 | `LocalContentColor.current` |

### 리소스 아이콘 사용

```kotlin [compose-playground]
@Composable
fun ResourceIconExample() {
    Icon(
        painter = painterResource(id = R.drawable.ic_custom_icon),
        contentDescription = "커스텀 아이콘",
        modifier = Modifier.size(32.dp)
    )
}
```

---

## 8. Material Icons 사용하기

Material Icons는 Google에서 제공하는 아이콘 세트로, Compose에서 바로 사용할 수 있습니다.

> **중요 (2025~)**: `androidx.compose.material:material-icons-*` 라이브러리(Material Icons)는 **더 이상 새로운 아이콘이 추가되지 않으며, 향후 deprecated 될 예정입니다.** Google은 **Material Symbols**로의 마이그레이션을 권장합니다. 기존 `Icons.Default.*`에 포함된 아이콘은 계속 사용 가능하지만, 새 아이콘이 필요하다면 [fonts.google.com/icons](https://fonts.google.com/icons)에서 Material Symbols의 Vector Drawable(XML)을 다운로드하여 프로젝트에 추가하는 것이 권장됩니다.

### Material Symbols 마이그레이션 가이드

```kotlin [compose-playground]
// 기존 방식: Material Icons 라이브러리 사용 (새 아이콘 추가 중단)
Icon(
    imageVector = Icons.Default.Home,
    contentDescription = "홈"
)

// 권장 방식: Material Symbols Vector Drawable 다운로드 후 리소스로 사용
// 1. fonts.google.com/icons 에서 원하는 아이콘 선택
// 2. "Android" 탭에서 Vector Drawable XML 다운로드
// 3. res/drawable/ 폴더에 추가
Icon(
    painter = painterResource(id = R.drawable.ic_home_symbol),
    contentDescription = "홈"
)
```

### 기본 아이콘 (material-icons-core)

`material-icons-core`에는 가장 자주 쓰는 아이콘이 포함되어 있습니다. 이 아이콘들은 여전히 사용 가능합니다.

```kotlin [compose-playground]
// 별도의 의존성 추가 없이 사용 가능
Icons.Default.Home
Icons.Default.Favorite
Icons.Default.Search
Icons.Default.Settings
Icons.Default.ArrowBack
Icons.Default.Add
Icons.Default.Delete
Icons.Default.Edit
Icons.Default.Share
Icons.Default.Close
```

### 확장 아이콘 (material-icons-extended)

더 많은 아이콘이 필요하면 확장 라이브러리를 추가합니다. 다만, 새 프로젝트에서는 Material Symbols Vector Drawable 사용을 고려하세요.

```kotlin [compose-playground]
// build.gradle.kts
dependencies {
    implementation("androidx.compose.material:material-icons-extended")
}
```

```kotlin [compose-playground]
// 확장 아이콘 사용 예
Icons.Outlined.AccountCircle
Icons.Rounded.PlayArrow
Icons.Sharp.Warning
Icons.TwoTone.Cloud
```

### 아이콘 스타일 종류

| 스타일 | 접근 방법 | 특징 |
|--------|-----------|------|
| `Filled` (Default) | `Icons.Default.XXX` 또는 `Icons.Filled.XXX` | 채워진 스타일 (기본) |
| `Outlined` | `Icons.Outlined.XXX` | 외곽선만 있는 스타일 |
| `Rounded` | `Icons.Rounded.XXX` | 둥근 모서리 |
| `Sharp` | `Icons.Sharp.XXX` | 날카로운 모서리 |
| `TwoTone` | `Icons.TwoTone.XXX` | 두 가지 톤 |

> **주의**: `material-icons-extended`는 매우 많은 아이콘을 포함하고 있어 앱 크기가 커질 수 있습니다. R8/ProGuard가 사용하지 않는 아이콘을 제거해주므로, 릴리스 빌드에서는 걱정하지 않아도 됩니다. 장기적으로는 Material Symbols Vector Drawable로 전환하는 것이 좋습니다.

---

## 9. 접근성 고려사항

접근성(Accessibility)은 시각 장애, 운동 장애 등이 있는 사용자도 앱을 사용할 수 있도록 보장하는 것입니다. TalkBack(스크린 리더)이 UI 요소를 올바르게 읽을 수 있도록 `contentDescription`을 적절히 설정해야 합니다.

### contentDescription 규칙

```kotlin [compose-playground]
@Composable
fun AccessibilityExample() {
    // 1. 단독 아이콘: contentDescription 필수
    Icon(
        imageVector = Icons.Default.Delete,
        contentDescription = "삭제" // TalkBack이 "삭제"라고 읽음
    )

    // 2. 텍스트와 함께 있는 아이콘: null로 설정 (텍스트가 의미 전달)
    Button(onClick = { }) {
        Icon(
            imageVector = Icons.Default.Send,
            contentDescription = null // 텍스트가 있으므로 중복 방지
        )
        Spacer(modifier = Modifier.width(8.dp))
        Text("전송") // 이것으로 충분
    }

    // 3. IconButton: contentDescription 필수 (텍스트가 없으므로)
    IconButton(onClick = { }) {
        Icon(
            imageVector = Icons.Default.Share,
            contentDescription = "공유하기" // 반드시 의미 있는 설명
        )
    }
}
```

### 버튼 상태 전달

```kotlin [compose-playground]
@Composable
fun AccessibleToggleExample() {
    var isMuted by remember { mutableStateOf(false) }

    IconButton(onClick = { isMuted = !isMuted }) {
        Icon(
            imageVector = if (isMuted) Icons.Default.VolumeOff else Icons.Default.VolumeUp,
            // 현재 상태와 동작을 모두 전달
            contentDescription = if (isMuted) "음소거 해제" else "음소거"
        )
    }
}
```

---

## 10. 커스텀 버튼 만들기

Material 버튼이 디자인 요구사항에 맞지 않을 때, `Surface`나 `Box`를 활용하여 완전히 커스텀한 버튼을 만들 수 있습니다.

### Surface 기반 커스텀 버튼

```kotlin [compose-playground]
@Composable
fun GradientButton(
    text: String,
    onClick: () -> Unit,
    modifier: Modifier = Modifier
) {
    Box(
        modifier = modifier
            .clip(RoundedCornerShape(12.dp))
            .background(
                brush = Brush.horizontalGradient(
                    colors = listOf(Color(0xFF6200EE), Color(0xFF03DAC5))
                )
            )
            .clickable(onClick = onClick)
            .padding(horizontal = 24.dp, vertical = 12.dp),
        contentAlignment = Alignment.Center
    ) {
        Text(
            text = text,
            color = Color.White,
            fontWeight = FontWeight.Bold,
            fontSize = 16.sp
        )
    }
}

// 사용
@Composable
fun GradientButtonUsage() {
    GradientButton(
        text = "그라데이션 버튼",
        onClick = { println("클릭!") }
    )
}
```

### 로딩 상태가 있는 버튼

```kotlin [compose-playground]
@Composable
fun LoadingButton(
    text: String,
    isLoading: Boolean,
    onClick: () -> Unit,
    modifier: Modifier = Modifier
) {
    Button(
        onClick = onClick,
        enabled = !isLoading,
        modifier = modifier
    ) {
        if (isLoading) {
            CircularProgressIndicator(
                modifier = Modifier.size(20.dp),
                color = MaterialTheme.colorScheme.onPrimary,
                strokeWidth = 2.dp
            )
            Spacer(modifier = Modifier.width(8.dp))
            Text("처리 중...")
        } else {
            Text(text)
        }
    }
}

// 사용
@Composable
fun LoadingButtonUsage() {
    var isLoading by remember { mutableStateOf(false) }

    LoadingButton(
        text = "저장하기",
        isLoading = isLoading,
        onClick = { isLoading = true }
    )
}
```

### 카운트 버튼 (상태 포함)

```kotlin [compose-playground]
@Composable
fun CounterButton() {
    var count by remember { mutableStateOf(0) }

    Button(onClick = { count++ }) {
        Icon(Icons.Default.Add, contentDescription = null)
        Spacer(modifier = Modifier.width(4.dp))
        Text("클릭 횟수: $count")
    }
}
```

---

## 11. XML View와의 비교

| XML View (기존 방식) | Jetpack Compose | 비고 |
|---------------------|-----------------|------|
| `Button` | `Button` | 기본 버튼 |
| `MaterialButton` (style outlined) | `OutlinedButton` | 테두리 버튼 |
| `android:onClick="..."` | `onClick = { }` | 클릭 콜백 |
| `android:enabled="false"` | `enabled = false` | 비활성화 |
| `ImageButton` | `IconButton` | 아이콘 버튼 |
| `FloatingActionButton` | `FloatingActionButton` | FAB |
| `ImageView` (아이콘용) | `Icon` | 아이콘 표시 |
| `android:contentDescription` | `contentDescription` | 접근성 설명 |
| `android:drawableStart` | `Icon` + `Spacer` + `Text` (Row) | 버튼 내 아이콘 |
| `selector` XML (상태별 색상) | `ButtonDefaults.buttonColors()` | 상태별 색상 |

---

## 12. 자주 하는 실수와 주의사항

### 1) onClick에서 무거운 작업 직접 수행

```kotlin [compose-playground]
// 잘못된 예: UI 스레드에서 네트워크 호출
Button(onClick = {
    val result = api.fetchData() // 절대 금지!
}) { Text("데이터 가져오기") }

// 올바른 예: ViewModel을 통해 코루틴으로 처리
Button(onClick = {
    viewModel.fetchData() // ViewModel 내부에서 viewModelScope.launch 사용
}) { Text("데이터 가져오기") }
```

### 2) contentDescription 누락

```kotlin [compose-playground]
// 잘못된 예: 스크린 리더가 아이콘의 의미를 알 수 없음
IconButton(onClick = { /* ... */ }) {
    Icon(Icons.Default.Delete, contentDescription = null)
    // 단독 아이콘인데 설명이 없으면 접근성 문제!
}

// 올바른 예
IconButton(onClick = { /* ... */ }) {
    Icon(Icons.Default.Delete, contentDescription = "항목 삭제")
}
```

### 3) 버튼 크기가 너무 작음

Material Design 가이드라인에서 터치 타깃의 최소 크기는 **48dp x 48dp**입니다. IconButton은 기본적으로 이 크기를 보장하지만, 커스텀 버튼을 만들 때는 직접 확인해야 합니다.

```kotlin [compose-playground]
// 최소 터치 영역 보장
Box(
    modifier = Modifier
        .sizeIn(minWidth = 48.dp, minHeight = 48.dp)
        .clickable { /* ... */ },
    contentAlignment = Alignment.Center
) {
    Icon(Icons.Default.Close, contentDescription = "닫기")
}
```

---

> **다음 단계**: [03. Image와 그래픽](03-image-and-graphics.md)에서 이미지 로드와 그래픽 그리기를 배워봅시다.
