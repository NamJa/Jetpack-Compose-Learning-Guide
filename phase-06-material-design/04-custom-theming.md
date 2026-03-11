# 커스텀 테마 설정

> **"브랜드의 정체성은 코드에서도 표현된다 — 자체 디자인 시스템으로."**
>
> MaterialTheme만으로 부족할 때, CompositionLocal을 활용하여 자체 테마 시스템을 구축할 수 있습니다. 이 문서에서는 커스텀 테마 시스템의 설계부터 접근성 고려까지 다룹니다.

---

## 목차

1. [CompositionLocal 개념: 데이터를 트리에 암시적으로 전달](#1-compositionlocal-개념-데이터를-트리에-암시적으로-전달)
2. [staticCompositionLocalOf vs compositionLocalOf](#2-staticcompositionlocalof-vs-compositionlocalof)
3. [커스텀 테마 시스템 구축](#3-커스텀-테마-시스템-구축)
4. [다크/라이트 테마 전환 구현](#4-다크라이트-테마-전환-구현)
5. [고도(Elevation): tonalElevation, shadowElevation](#5-고도elevation-tonalelevation-shadowelevation)
6. [컴포넌트 커스터마이징: CardDefaults, ButtonDefaults](#6-컴포넌트-커스터마이징-carddefaults-buttondefaults)
7. [접근성 고려: 색상 대비, contentDescription](#7-접근성-고려-색상-대비-contentdescription)
8. [Material Icons 지원 중단과 Material Symbols 마이그레이션](#8-material-icons-지원-중단과-material-symbols-마이그레이션)
9. [MotionScheme을 활용한 커스텀 애니메이션 테마](#9-motionscheme을-활용한-커스텀-애니메이션-테마)
10. [향후 변경 사항: 단일 CompositionLocal (1.5.0-alpha)](#10-향후-변경-사항-단일-compositionlocal-150-alpha)

---

## 1. CompositionLocal 개념: 데이터를 트리에 암시적으로 전달

`CompositionLocal`은 컴포저블 트리 전체에 데이터를 **암시적으로 전달**하는 메커니즘입니다. 매개변수로 일일이 전달하지 않아도, 트리 내 어디서든 해당 데이터에 접근할 수 있습니다.

**왜 CompositionLocal인가?**
- 테마 색상, 서체 등 모든 컴포저블이 필요로 하는 데이터를 효율적으로 전달
- `MaterialTheme.colorScheme` 자체가 CompositionLocal로 구현됨
- 매개변수 드릴링(prop drilling) 없이 깊은 트리에 데이터 전달

```kotlin [compose-playground]
import androidx.compose.runtime.CompositionLocal
import androidx.compose.runtime.compositionLocalOf
import androidx.compose.runtime.CompositionLocalProvider

// 1. CompositionLocal 정의
val LocalUserName = compositionLocalOf { "Guest" }  // 기본값

// 2. 값 제공 (Provider)
@Composable
fun App() {
    CompositionLocalProvider(
        LocalUserName provides "홍길동"  // 이 하위 트리에서 "홍길동"으로 접근 가능
    ) {
        HomeScreen()
    }
}

// 3. 값 사용 (Consumer) — 파라미터 전달 없이 접근
@Composable
fun HomeScreen() {
    // 중간 컴포저블에서 파라미터로 전달하지 않아도 됨
    ProfileSection()
}

@Composable
fun ProfileSection() {
    val userName = LocalUserName.current  // "홍길동"
    Text("안녕하세요, $userName!")
}
```

**Compose에서 기본 제공하는 CompositionLocal:**

| CompositionLocal | 제공 데이터 |
|-----------------|-----------|
| `LocalContext` | Android Context |
| `LocalDensity` | 화면 밀도 |
| `LocalConfiguration` | 디바이스 설정 (화면 크기 등) |
| `LocalLayoutDirection` | 레이아웃 방향 (LTR/RTL) |

---

## 2. staticCompositionLocalOf vs compositionLocalOf

CompositionLocal을 생성하는 두 가지 방법이 있으며, **값 변경 시 리컴포지션 범위**가 다릅니다.

### compositionLocalOf — 값 변경 시 읽는 곳만 리컴포지션

```kotlin [compose-playground]
// 값이 변경되면, 이 값을 읽는 컴포저블만 리컴포지션
val LocalActiveColor = compositionLocalOf { Color.Blue }

@Composable
fun Example() {
    var isActive by remember { mutableStateOf(true) }

    CompositionLocalProvider(
        LocalActiveColor provides if (isActive) Color.Blue else Color.Gray
    ) {
        Column {
            // LocalActiveColor를 읽는 이 Text만 리컴포지션됨
            Text(
                "활성 상태",
                color = LocalActiveColor.current
            )
            // LocalActiveColor를 읽지 않는 이 Text는 리컴포지션 안 됨
            Text("변하지 않는 텍스트")
        }
    }
}
```

### staticCompositionLocalOf — 값 변경 시 전체 리컴포지션

```kotlin [compose-playground]
// 값이 변경되면, Provider 하위 트리 전체가 리컴포지션
val LocalAppTheme = staticCompositionLocalOf { AppTheme.Light }

// 테마처럼 드물게 변경되는 값에 적합
// 값 변경 빈도가 낮지만, 변경 시 전체 UI에 영향을 미치는 경우
```

**선택 기준:**

| 특성 | `compositionLocalOf` | `staticCompositionLocalOf` |
|------|---------------------|---------------------------|
| 값 변경 시 | 읽는 곳만 리컴포지션 | 전체 하위 트리 리컴포지션 |
| 메모리 | 더 많은 메모리 사용 | 더 적은 메모리 사용 |
| 적합한 경우 | 자주 변경되는 값 | 드물게 변경되는 값 (테마) |

> **실용적 가이드**: 테마 관련 값은 `staticCompositionLocalOf`를, 자주 바뀔 수 있는 값은 `compositionLocalOf`를 사용하세요.

---

## 3. 커스텀 테마 시스템 구축

앱이 Material Design 규격을 넘어서는 자체 브랜드 디자인 시스템을 필요로 할 때, CompositionLocal로 **자체 테마 시스템**을 구축할 수 있습니다.

### 1단계: 커스텀 색상, 서체, 도형 정의

```kotlin [compose-playground]
import androidx.compose.runtime.Immutable
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.TextStyle
import androidx.compose.ui.unit.Dp

// 커스텀 색상 정의
@Immutable
data class BrandColors(
    val brandPrimary: Color,
    val brandSecondary: Color,
    val brandAccent: Color,
    val textPrimary: Color,
    val textSecondary: Color,
    val backgroundPrimary: Color,
    val backgroundSecondary: Color,
    val success: Color,
    val warning: Color,
    val danger: Color
)

// 커스텀 서체 정의
@Immutable
data class BrandTypography(
    val hero: TextStyle,
    val heading1: TextStyle,
    val heading2: TextStyle,
    val body: TextStyle,
    val caption: TextStyle,
    val button: TextStyle
)

// 커스텀 간격 정의
@Immutable
data class BrandSpacing(
    val xs: Dp,
    val sm: Dp,
    val md: Dp,
    val lg: Dp,
    val xl: Dp
)
```

### 2단계: CompositionLocal 정의

```kotlin [compose-playground]
import androidx.compose.runtime.staticCompositionLocalOf

val LocalBrandColors = staticCompositionLocalOf<BrandColors> {
    error("BrandColors가 제공되지 않았습니다.")
}

val LocalBrandTypography = staticCompositionLocalOf<BrandTypography> {
    error("BrandTypography가 제공되지 않았습니다.")
}

val LocalBrandSpacing = staticCompositionLocalOf<BrandSpacing> {
    error("BrandSpacing이 제공되지 않았습니다.")
}
```

### 3단계: 테마 컴포저블과 접근 객체

```kotlin [compose-playground]
// 테마 컴포저블
@Composable
fun BrandTheme(
    darkTheme: Boolean = isSystemInDarkTheme(),
    content: @Composable () -> Unit
) {
    val colors = if (darkTheme) darkBrandColors else lightBrandColors

    CompositionLocalProvider(
        LocalBrandColors provides colors,
        LocalBrandTypography provides brandTypography,
        LocalBrandSpacing provides brandSpacing
    ) {
        // Material 테마도 함께 적용 (M3 컴포넌트 호환)
        MaterialTheme(
            colorScheme = if (darkTheme) darkColorScheme() else lightColorScheme(),
            content = content
        )
    }
}

// 편리한 접근 객체
object BrandTheme {
    val colors: BrandColors
        @Composable get() = LocalBrandColors.current

    val typography: BrandTypography
        @Composable get() = LocalBrandTypography.current

    val spacing: BrandSpacing
        @Composable get() = LocalBrandSpacing.current
}
```

### 4단계: 사용

```kotlin [compose-playground]
@Composable
fun BrandedCard(title: String, subtitle: String) {
    Card(
        modifier = Modifier
            .fillMaxWidth()
            .padding(BrandTheme.spacing.md),
        colors = CardDefaults.cardColors(
            containerColor = BrandTheme.colors.backgroundSecondary
        )
    ) {
        Column(modifier = Modifier.padding(BrandTheme.spacing.md)) {
            Text(
                text = title,
                style = BrandTheme.typography.heading2,
                color = BrandTheme.colors.textPrimary
            )
            Spacer(modifier = Modifier.height(BrandTheme.spacing.xs))
            Text(
                text = subtitle,
                style = BrandTheme.typography.body,
                color = BrandTheme.colors.textSecondary
            )
        }
    }
}
```

---

## 4. 다크/라이트 테마 전환 구현

커스텀 테마 시스템에서 다크/라이트 모드를 지원하는 전체 구현 예시입니다.

```kotlin [compose-playground]
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp

// 라이트 모드 색상
val lightBrandColors = BrandColors(
    brandPrimary = Color(0xFF1A73E8),
    brandSecondary = Color(0xFF34A853),
    brandAccent = Color(0xFFFBBC04),
    textPrimary = Color(0xFF202124),
    textSecondary = Color(0xFF5F6368),
    backgroundPrimary = Color(0xFFFFFFFF),
    backgroundSecondary = Color(0xFFF8F9FA),
    success = Color(0xFF34A853),
    warning = Color(0xFFFBBC04),
    danger = Color(0xFFEA4335)
)

// 다크 모드 색상
val darkBrandColors = BrandColors(
    brandPrimary = Color(0xFF8AB4F8),
    brandSecondary = Color(0xFF81C995),
    brandAccent = Color(0xFFFDD663),
    textPrimary = Color(0xFFE8EAED),
    textSecondary = Color(0xFF9AA0A6),
    backgroundPrimary = Color(0xFF202124),
    backgroundSecondary = Color(0xFF303134),
    success = Color(0xFF81C995),
    warning = Color(0xFFFDD663),
    danger = Color(0xFFF28B82)
)

// 서체
val brandTypography = BrandTypography(
    hero = TextStyle(fontSize = 40.sp, fontWeight = FontWeight.Bold),
    heading1 = TextStyle(fontSize = 28.sp, fontWeight = FontWeight.Bold),
    heading2 = TextStyle(fontSize = 22.sp, fontWeight = FontWeight.SemiBold),
    body = TextStyle(fontSize = 16.sp, fontWeight = FontWeight.Normal),
    caption = TextStyle(fontSize = 12.sp, fontWeight = FontWeight.Normal),
    button = TextStyle(fontSize = 14.sp, fontWeight = FontWeight.Medium)
)

// 간격
val brandSpacing = BrandSpacing(
    xs = 4.dp,
    sm = 8.dp,
    md = 16.dp,
    lg = 24.dp,
    xl = 32.dp
)
```

### 앱 내 테마 전환 + 시스템 설정 연동

```kotlin [compose-playground]
// 테마 모드 열거형
enum class ThemeMode { LIGHT, DARK, SYSTEM }

@Composable
fun MyApp() {
    // DataStore 등에서 사용자 설정을 읽어올 수 있음
    var themeMode by remember { mutableStateOf(ThemeMode.SYSTEM) }
    val systemDark = isSystemInDarkTheme()

    val isDark = when (themeMode) {
        ThemeMode.LIGHT -> false
        ThemeMode.DARK -> true
        ThemeMode.SYSTEM -> systemDark
    }

    BrandTheme(darkTheme = isDark) {
        Surface(
            modifier = Modifier.fillMaxSize(),
            color = BrandTheme.colors.backgroundPrimary
        ) {
            AppContent(
                currentTheme = themeMode,
                onThemeChange = { themeMode = it }
            )
        }
    }
}

@Composable
fun ThemeSettingsSection(
    currentTheme: ThemeMode,
    onThemeChange: (ThemeMode) -> Unit
) {
    Column {
        Text(
            text = "테마 설정",
            style = BrandTheme.typography.heading2,
            color = BrandTheme.colors.textPrimary
        )
        Spacer(modifier = Modifier.height(BrandTheme.spacing.sm))

        ThemeMode.entries.forEach { mode ->
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .clickable { onThemeChange(mode) }
                    .padding(vertical = 12.dp),
                verticalAlignment = Alignment.CenterVertically
            ) {
                RadioButton(
                    selected = currentTheme == mode,
                    onClick = { onThemeChange(mode) }
                )
                Spacer(modifier = Modifier.width(BrandTheme.spacing.sm))
                Text(
                    text = when (mode) {
                        ThemeMode.LIGHT -> "라이트 모드"
                        ThemeMode.DARK -> "다크 모드"
                        ThemeMode.SYSTEM -> "시스템 설정 따르기"
                    },
                    style = BrandTheme.typography.body,
                    color = BrandTheme.colors.textPrimary
                )
            }
        }
    }
}
```

---

## 5. 고도(Elevation): tonalElevation, shadowElevation

M3에서 **고도(Elevation)** 는 UI 요소의 계층 구조를 나타냅니다. 두 가지 방식으로 표현됩니다.

### tonalElevation — 색상으로 높낮이 표현

`tonalElevation`은 Surface의 색상을 미세하게 조정하여 높낮이를 나타냅니다. 고도가 높을수록 밝아집니다(다크 모드에서 특히 눈에 띔).

```kotlin [compose-playground]
@Composable
fun TonalElevationDemo() {
    val elevations = listOf(0.dp, 1.dp, 3.dp, 6.dp, 8.dp, 12.dp)

    Column(
        modifier = Modifier.padding(16.dp),
        verticalArrangement = Arrangement.spacedBy(8.dp)
    ) {
        elevations.forEach { elevation ->
            Surface(
                modifier = Modifier
                    .fillMaxWidth()
                    .height(60.dp),
                tonalElevation = elevation,  // 색상 기반 고도
                shape = MaterialTheme.shapes.medium
            ) {
                Box(contentAlignment = Alignment.Center) {
                    Text("tonalElevation = $elevation")
                }
            }
        }
    }
}
```

### shadowElevation — 그림자로 높낮이 표현

```kotlin [compose-playground]
@Composable
fun ShadowElevationDemo() {
    Column(
        modifier = Modifier.padding(16.dp),
        verticalArrangement = Arrangement.spacedBy(16.dp)
    ) {
        listOf(0.dp, 2.dp, 4.dp, 8.dp, 16.dp).forEach { elevation ->
            Surface(
                modifier = Modifier
                    .fillMaxWidth()
                    .height(60.dp),
                shadowElevation = elevation,  // 그림자 기반 고도
                shape = MaterialTheme.shapes.medium
            ) {
                Box(contentAlignment = Alignment.Center) {
                    Text("shadowElevation = $elevation")
                }
            }
        }
    }
}
```

### Card에서의 고도

```kotlin [compose-playground]
@Composable
fun CardElevationExample() {
    Column(verticalArrangement = Arrangement.spacedBy(12.dp)) {
        // 기본 Card — tonalElevation 사용
        Card(
            modifier = Modifier.fillMaxWidth()
        ) {
            Text("기본 Card", modifier = Modifier.padding(16.dp))
        }

        // ElevatedCard — shadowElevation 사용
        ElevatedCard(
            modifier = Modifier.fillMaxWidth(),
            elevation = CardDefaults.elevatedCardElevation(
                defaultElevation = 6.dp
            )
        ) {
            Text("ElevatedCard", modifier = Modifier.padding(16.dp))
        }

        // OutlinedCard — 테두리 사용 (고도 없음)
        OutlinedCard(
            modifier = Modifier.fillMaxWidth()
        ) {
            Text("OutlinedCard", modifier = Modifier.padding(16.dp))
        }
    }
}
```

| 표현 방식 | 특징 | 적합한 상황 |
|-----------|------|-----------|
| `tonalElevation` | 색상 변화로 표현 | 다크 모드에서 효과적 |
| `shadowElevation` | 그림자로 표현 | 라이트 모드에서 직관적 |

---

## 6. 컴포넌트 커스터마이징: CardDefaults, ButtonDefaults

M3 컴포넌트들은 `*Defaults` 객체를 통해 **기본 스타일을 커스터마이징**할 수 있습니다.

### CardDefaults

```kotlin [compose-playground]
import androidx.compose.material3.CardDefaults

@Composable
fun CustomCard() {
    Card(
        modifier = Modifier.fillMaxWidth(),
        // 색상 커스터마이징
        colors = CardDefaults.cardColors(
            containerColor = MaterialTheme.colorScheme.primaryContainer,
            contentColor = MaterialTheme.colorScheme.onPrimaryContainer
        ),
        // 고도 커스터마이징
        elevation = CardDefaults.cardElevation(
            defaultElevation = 4.dp,
            pressedElevation = 8.dp,     // 누를 때
            focusedElevation = 6.dp,     // 포커스 시
            hoveredElevation = 6.dp,     // 호버 시
            disabledElevation = 0.dp     // 비활성 시
        ),
        // 테두리 커스터마이징
        border = BorderStroke(1.dp, MaterialTheme.colorScheme.outline),
        // 모양 커스터마이징
        shape = MaterialTheme.shapes.large
    ) {
        Text(
            text = "커스텀 카드",
            modifier = Modifier.padding(24.dp)
        )
    }
}
```

### ButtonDefaults

```kotlin [compose-playground]
import androidx.compose.material3.ButtonDefaults

@Composable
fun CustomButtons() {
    Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
        // 색상 커스터마이징
        Button(
            onClick = { /* ... */ },
            colors = ButtonDefaults.buttonColors(
                containerColor = MaterialTheme.colorScheme.tertiary,
                contentColor = MaterialTheme.colorScheme.onTertiary,
                disabledContainerColor = Color.Gray.copy(alpha = 0.3f),
                disabledContentColor = Color.Gray
            )
        ) {
            Text("커스텀 색상 버튼")
        }

        // 모양과 크기 커스터마이징
        Button(
            onClick = { /* ... */ },
            shape = RoundedCornerShape(50),  // 완전한 둥근 모서리
            contentPadding = PaddingValues(
                horizontal = 32.dp,
                vertical = 12.dp
            )
        ) {
            Text("둥근 버튼")
        }

        // 고도 커스터마이징
        Button(
            onClick = { /* ... */ },
            elevation = ButtonDefaults.buttonElevation(
                defaultElevation = 6.dp,
                pressedElevation = 12.dp
            )
        ) {
            Text("그림자 버튼")
        }
    }
}
```

### 자주 쓰는 Defaults 객체들

```kotlin [compose-playground]
// TextField
OutlinedTextField(
    value = text,
    onValueChange = { text = it },
    colors = OutlinedTextFieldDefaults.colors(
        focusedBorderColor = BrandTheme.colors.brandPrimary,
        unfocusedBorderColor = BrandTheme.colors.textSecondary,
        cursorColor = BrandTheme.colors.brandPrimary
    )
)

// Switch
Switch(
    checked = isChecked,
    onCheckedChange = { isChecked = it },
    colors = SwitchDefaults.colors(
        checkedThumbColor = MaterialTheme.colorScheme.primary,
        checkedTrackColor = MaterialTheme.colorScheme.primaryContainer
    )
)

// Checkbox
Checkbox(
    checked = isChecked,
    onCheckedChange = { isChecked = it },
    colors = CheckboxDefaults.colors(
        checkedColor = MaterialTheme.colorScheme.tertiary,
        checkmarkColor = MaterialTheme.colorScheme.onTertiary
    )
)
```

---

## 7. 접근성 고려: 색상 대비, contentDescription

접근성(Accessibility)은 모든 사용자가 앱을 사용할 수 있도록 보장합니다. Compose에서 접근성을 높이는 핵심 사항들을 정리합니다.

### 색상 대비 (Color Contrast)

WCAG(Web Content Accessibility Guidelines)에 따르면, 텍스트와 배경의 대비율은 최소 **4.5:1** (일반 텍스트), **3:1** (큰 텍스트)을 충족해야 합니다.

```kotlin [compose-playground]
// 좋은 예: M3 테마의 on- 색상은 자동으로 충분한 대비를 보장
Surface(
    color = MaterialTheme.colorScheme.primary
) {
    Text(
        text = "높은 대비",
        color = MaterialTheme.colorScheme.onPrimary  // 대비 보장됨
    )
}

// 나쁜 예: 임의의 색상 조합 — 대비가 불충분할 수 있음
Surface(
    color = Color(0xFFFFEB3B)  // 밝은 노랑
) {
    Text(
        text = "읽기 어려움",
        color = Color(0xFFFFFFFF)  // 흰색 — 대비 부족!
    )
}
```

> **팁**: Material Theme Builder로 생성한 색상 체계를 사용하면, on- 계열 색상이 자동으로 충분한 대비를 보장합니다.

### contentDescription — 스크린 리더 대응

시각 장애 사용자를 위해, 이미지와 아이콘에 `contentDescription`을 반드시 제공합니다.

```kotlin [compose-playground]
// 의미 있는 이미지 — 반드시 설명 제공
Image(
    painter = painterResource(R.drawable.product_photo),
    contentDescription = "파란색 운동화 제품 사진"  // 스크린 리더가 읽어줌
)

// 장식용 이미지 — null로 설정 (스크린 리더가 무시)
Image(
    painter = painterResource(R.drawable.decorative_wave),
    contentDescription = null  // 장식 요소이므로 읽지 않음
)

// 아이콘 버튼 — 반드시 설명 제공
IconButton(onClick = { /* ... */ }) {
    Icon(
        Icons.Default.Delete,
        contentDescription = "선택한 항목 삭제"  // 동작을 설명
    )
}

// 텍스트가 있는 버튼 — 텍스트 자체가 설명이 되므로 아이콘은 null
Button(onClick = { /* ... */ }) {
    Icon(
        Icons.Default.Add,
        contentDescription = null  // 버튼 텍스트가 설명 역할
    )
    Spacer(modifier = Modifier.width(8.dp))
    Text("새 항목 추가")
}
```

### 시맨틱(Semantics) 설정

```kotlin [compose-playground]
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.semantics.heading
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.semantics.stateDescription

@Composable
fun AccessibleScreen() {
    Column {
        // 제목 시맨틱 — 스크린 리더가 "제목"으로 인식
        Text(
            text = "설정",
            style = MaterialTheme.typography.headlineMedium,
            modifier = Modifier.semantics { heading() }
        )

        // 터치 영역 확보 — 최소 48dp x 48dp
        IconButton(
            onClick = { /* ... */ },
            modifier = Modifier.size(48.dp)  // 최소 터치 영역
        ) {
            Icon(Icons.Default.Info, contentDescription = "도움말")
        }

        // 상태 설명 — 토글 상태를 명확히 전달
        var isNotificationEnabled by remember { mutableStateOf(true) }
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .clickable { isNotificationEnabled = !isNotificationEnabled }
                .semantics {
                    stateDescription = if (isNotificationEnabled) "켜짐" else "꺼짐"
                }
                .padding(16.dp),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically
        ) {
            Text("알림")
            Switch(
                checked = isNotificationEnabled,
                onCheckedChange = { isNotificationEnabled = it }
            )
        }

        // 그룹으로 묶기 — 관련 정보를 하나의 접근성 단위로
        Row(
            modifier = Modifier
                .semantics(mergeDescendants = true) {}
                .padding(16.dp)
        ) {
            Icon(Icons.Default.Star, contentDescription = null)
            Spacer(modifier = Modifier.width(8.dp))
            Text("평점 4.5 / 5.0")
            // 스크린 리더: "평점 4.5 / 5.0" (아이콘과 텍스트를 하나로 읽음)
        }
    }
}
```

### 접근성 체크리스트

| 항목 | 확인 사항 |
|------|----------|
| 색상 대비 | 일반 텍스트 4.5:1, 큰 텍스트 3:1 이상 |
| contentDescription | 의미 있는 이미지/아이콘에 설명 제공 |
| 터치 영역 | 인터랙티브 요소 최소 48dp x 48dp |
| 텍스트 크기 | 시스템 글꼴 크기 설정 존중 (sp 단위 사용) |
| 색상만으로 정보 전달 금지 | 아이콘, 텍스트 등 보조 수단 병행 |
| 시맨틱 | heading(), stateDescription 등 적절히 설정 |

> **핵심**: 접근성은 "추가 기능"이 아니라 "기본 품질"입니다. Material 컴포넌트는 대부분의 접근성을 기본 제공하지만, `contentDescription`과 시맨틱은 개발자가 직접 챙겨야 합니다.

---

## 8. Material Icons 지원 중단과 Material Symbols 마이그레이션

> **2026 업데이트**: `androidx.compose.material:material-icons-extended` 라이브러리는 **더 이상 권장되지 않습니다**. 빌드 시간이 크게 증가하는 문제가 있어, Google은 **Material Symbols**로의 마이그레이션을 권장합니다.

### 왜 Material Icons가 비권장인가?

```
Material Icons Extended 문제점:
  - 수천 개의 아이콘이 빌드에 포함 → 빌드 시간 증가
  - APK 크기 불필요하게 증가
  - 새로운 아이콘이 더 이상 추가되지 않음

Material Symbols 장점:
  ✓ 필요한 아이콘만 Vector Drawable XML로 다운로드
  ✓ 빌드 시간에 영향 없음
  ✓ 최신 아이콘 지속 업데이트
  ✓ 가변 폰트 지원 (weight, grade, optical size, fill)
```

### 마이그레이션 방법

**1단계: Material Symbols에서 아이콘 다운로드**

[fonts.google.com/icons](https://fonts.google.com/icons)에서 아이콘을 검색하고 **Android → Vector Drawable** 형식으로 다운로드합니다.

**2단계: 프로젝트에 추가**

```
res/
└── drawable/
    ├── ic_home.xml          ← 다운로드한 Vector Drawable
    ├── ic_search.xml
    └── ic_settings.xml
```

**3단계: 코드에서 사용**

```kotlin [compose-playground]
// ❌ 이전 방식 (비권장)
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Home

Icon(
    imageVector = Icons.Default.Home,
    contentDescription = "홈"
)

// ✅ 새로운 방식 (권장)
import androidx.compose.ui.res.painterResource

Icon(
    painter = painterResource(id = R.drawable.ic_home),
    contentDescription = "홈"
)
```

> **참고**: 기존 `Icons.Default.*` 아이콘은 여전히 동작합니다. 하지만 새 프로젝트에서는 Material Symbols를 사용하고, 기존 프로젝트도 점진적으로 마이그레이션하는 것을 권장합니다.

---

## 9. MotionScheme을 활용한 커스텀 애니메이션 테마

Material3 1.4.0에서 **MotionScheme** API가 **Stable**로 승격되었습니다. MotionScheme은 앱 전체의 애니메이션을 일관되게 관리하는 테마 시스템입니다.

### MotionScheme 개념

```
MotionScheme은 애니메이션의 "Typography"와 같습니다:
  - Typography: 앱 전체의 텍스트 스타일 통합 관리
  - ColorScheme: 앱 전체의 색상 통합 관리
  - MotionScheme: 앱 전체의 애니메이션 통합 관리
```

### MaterialTheme에서 MotionScheme 사용

```kotlin [compose-playground]
// Material3 컴포넌트는 자동으로 MotionScheme을 사용합니다
MaterialTheme(
    colorScheme = myColorScheme,
    typography = myTypography,
    shapes = myShapes
    // MotionScheme은 MaterialTheme에 내장
) {
    // 모든 Material3 컴포넌트가 일관된 모션 사용
}
```

### 커스텀 애니메이션에서 MotionScheme 참조

```kotlin [compose-playground]
@Composable
fun AnimatedCard(isExpanded: Boolean) {
    val motionScheme = MaterialTheme.motionScheme

    // Material3의 모션 토큰을 커스텀 애니메이션에서 재사용
    val height by animateDpAsState(
        targetValue = if (isExpanded) 300.dp else 100.dp,
        animationSpec = motionScheme.fastEffectsSpec()
    )

    Card(
        modifier = Modifier
            .fillMaxWidth()
            .height(height)
    ) {
        // 카드 내용
    }
}
```

### MotionScheme 토큰 종류

| 토큰 | 용도 | 예시 |
|------|------|------|
| `fastEffectsSpec()` | 빠른 시각 효과 | 리플, 하이라이트, 페이드 |
| `defaultEffectsSpec()` | 기본 전환 | 크기 변경, 색상 전환 |
| `slowEffectsSpec()` | 느린 전환 | 모달 열기/닫기, 화면 전환 |
| `fastSpatialSpec()` | 빠른 공간 이동 | 스와이프, 터치 반응 |
| `defaultSpatialSpec()` | 기본 공간 이동 | 리스트 항목 이동 |
| `slowSpatialSpec()` | 느린 공간 이동 | 네비게이션 전환 |

---

## 10. 향후 변경 사항: 단일 CompositionLocal (1.5.0-alpha)

Material3 1.5.0-alpha에서 **테마 시스템 리팩토링**이 진행 중입니다.

### 현재 방식 (1.4.0)

```kotlin [compose-playground]
// 현재: 여러 CompositionLocal을 개별적으로 접근
val colors = MaterialTheme.colorScheme
val typography = MaterialTheme.typography
val shapes = MaterialTheme.shapes
```

### 새로운 방식 (1.5.0-alpha 실험 중)

```kotlin [compose-playground]
// 예정: 단일 CompositionLocal로 통합
val theme = MaterialTheme.LocalMaterialTheme.current
// theme.colorScheme, theme.typography, theme.shapes 등 하나의 객체에서 접근
```

> **주의**: 이 변경은 아직 alpha 단계이므로 프로덕션에서는 현재 방식(1.4.0)을 사용하세요. 안정 버전에서 마이그레이션 가이드가 제공될 예정입니다.

---

> **다음 단계**: [Phase 7: 애니메이션](../phase-07-animation/01-basic-animation-api.md)에서는 사용자 경험을 향상시키는 다양한 애니메이션 기법을 학습합니다.
