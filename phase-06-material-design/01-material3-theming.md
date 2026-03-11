# Material Design 3 테마

> **"좋은 디자인은 보이지 않는 곳에서 시작된다 — 바로 테마 시스템에서."**
>
> Material Design 3(M3)은 Google의 최신 디자인 시스템으로, 색상, 서체, 도형을 체계적으로 관리합니다. 이 문서에서는 Jetpack Compose에서 M3 테마를 구성하고 활용하는 방법을 학습합니다. (Material3 **1.4.0** 기준, 2025년 9월 릴리스)

---

## 목차

1. [MaterialTheme 구성: colorScheme, typography, shapes](#1-materialtheme-구성-colorscheme-typography-shapes)
2. [Color Scheme: lightColorScheme, darkColorScheme](#2-color-scheme-lightcolorscheme-darkcolorscheme)
3. [Material Theme Builder 활용](#3-material-theme-builder-활용)
4. [Dynamic Color (Android 12+)](#4-dynamic-color-android-12)
5. [Typography: TextStyle 정의](#5-typography-textstyle-정의)
6. [Shape: RoundedCornerShape 정의](#6-shape-roundedcornershape-정의)
7. [테마 색상/서체/도형 사용하기](#7-테마-색상서체도형-사용하기)
8. [isSystemInDarkTheme()으로 다크모드 대응](#8-issystemindarktheme으로-다크모드-대응)
9. [MotionScheme: 일관된 애니메이션 테마](#9-motionscheme-일관된-애니메이션-테마)
10. [TextAutoSize: 동적 텍스트 크기 조정](#10-textautosize-동적-텍스트-크기-조정)

---

## 1. MaterialTheme 구성: colorScheme, typography, shapes

`MaterialTheme`은 앱 전체의 디자인 토큰을 정의하는 **최상위 테마 컴포저블**입니다. 세 가지 핵심 요소로 구성됩니다:

- **colorScheme**: 앱의 색상 체계
- **typography**: 텍스트 스타일 체계
- **shapes**: 컴포넌트의 모서리 모양 체계

```kotlin
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.lightColorScheme
import androidx.compose.material3.Typography
import androidx.compose.material3.Shapes

@Composable
fun MyAppTheme(
    content: @Composable () -> Unit
) {
    MaterialTheme(
        colorScheme = MyLightColorScheme,   // 색상 체계
        typography = MyTypography,           // 서체 체계
        shapes = MyShapes,                   // 도형 체계
        content = content                    // 앱 콘텐츠
    )
}

// 사용
@Composable
fun MyApp() {
    MyAppTheme {
        // 이 안의 모든 컴포넌트가 테마를 자동으로 적용받음
        Surface {
            HomeScreen()
        }
    }
}
```

> **비유**: `MaterialTheme`은 "브랜드 가이드라인"과 같습니다. 한 번 정의하면 앱 전체의 버튼, 카드, 텍스트 등이 일관된 디자인을 따릅니다.

---

## 2. Color Scheme: lightColorScheme, darkColorScheme

M3 Color Scheme은 **29개의 색상 역할(role)** 로 구성됩니다. 각 역할은 용도가 명확히 정해져 있어, 일관된 디자인을 보장합니다.

### 핵심 색상 역할

| 역할 | 용도 | 예시 |
|------|------|------|
| `primary` | 주요 버튼, 강조 요소 | FAB, 주요 버튼 |
| `onPrimary` | primary 위의 텍스트/아이콘 | FAB 아이콘 색상 |
| `primaryContainer` | 강조 배경 | 선택된 카드 배경 |
| `secondary` | 보조 강조 | 필터 칩 |
| `surface` | 카드, 시트 등의 배경 | Card 배경 |
| `onSurface` | surface 위의 텍스트 | 본문 텍스트 |
| `background` | 전체 화면 배경 | Scaffold 배경 |
| `error` | 오류 표시 | 유효성 검사 오류 |

```kotlin
import androidx.compose.material3.lightColorScheme
import androidx.compose.material3.darkColorScheme
import androidx.compose.ui.graphics.Color

// 라이트 모드 색상 정의
private val MyLightColorScheme = lightColorScheme(
    primary = Color(0xFF6750A4),
    onPrimary = Color(0xFFFFFFFF),
    primaryContainer = Color(0xFFEADDFF),
    onPrimaryContainer = Color(0xFF21005D),
    secondary = Color(0xFF625B71),
    onSecondary = Color(0xFFFFFFFF),
    secondaryContainer = Color(0xFFE8DEF8),
    onSecondaryContainer = Color(0xFF1D192B),
    tertiary = Color(0xFF7D5260),
    onTertiary = Color(0xFFFFFFFF),
    background = Color(0xFFFFFBFE),
    onBackground = Color(0xFF1C1B1F),
    surface = Color(0xFFFFFBFE),
    onSurface = Color(0xFF1C1B1F),
    error = Color(0xFFB3261E),
    onError = Color(0xFFFFFFFF)
)

// 다크 모드 색상 정의
private val MyDarkColorScheme = darkColorScheme(
    primary = Color(0xFFD0BCFF),
    onPrimary = Color(0xFF381E72),
    primaryContainer = Color(0xFF4F378B),
    onPrimaryContainer = Color(0xFFEADDFF),
    secondary = Color(0xFFCCC2DC),
    onSecondary = Color(0xFF332D41),
    background = Color(0xFF1C1B1F),
    onBackground = Color(0xFFE6E1E5),
    surface = Color(0xFF1C1B1F),
    onSurface = Color(0xFFE6E1E5),
    error = Color(0xFFF2B8B5),
    onError = Color(0xFF601410)
)
```

> **on- 접두사 규칙**: `primary`는 배경색, `onPrimary`는 그 위에 올라가는 텍스트/아이콘 색상입니다. 이 규칙을 따르면 가독성이 자동으로 보장됩니다.

---

## 3. Material Theme Builder 활용

29개의 색상을 직접 정의하는 것은 번거롭습니다. **Material Theme Builder**는 기본 색상(seed color) 하나만 선택하면 전체 색상 체계를 자동으로 생성해주는 도구입니다.

### 사용 방법

1. [Material Theme Builder](https://m3.material.io/theme-builder) 접속
2. 원하는 기본 색상(Primary)을 선택
3. "Export" 클릭 → "Jetpack Compose (Theme.kt)" 선택
4. 다운로드한 파일을 프로젝트에 추가

### 생성되는 파일 구조

```
ui/theme/
├── Color.kt        // 색상 값 정의
├── Theme.kt        // MaterialTheme 구성
└── Type.kt         // Typography 정의
```

```kotlin
// Color.kt (Material Theme Builder가 생성)
val md_theme_light_primary = Color(0xFF6750A4)
val md_theme_light_onPrimary = Color(0xFFFFFFFF)
val md_theme_light_primaryContainer = Color(0xFFEADDFF)
// ... 나머지 색상들

// Theme.kt (Material Theme Builder가 생성)
private val LightColorScheme = lightColorScheme(
    primary = md_theme_light_primary,
    onPrimary = md_theme_light_onPrimary,
    primaryContainer = md_theme_light_primaryContainer,
    // ... 나머지 매핑
)
```

> **팁**: Material Theme Builder를 사용하면 접근성(색상 대비)을 자동으로 충족하는 색상 체계를 얻을 수 있습니다. 직접 색상을 정하는 것보다 훨씬 안전합니다.

---

## 4. Dynamic Color (Android 12+)

Android 12(API 31) 이상에서는 **Dynamic Color**를 지원합니다. 사용자의 배경화면에서 자동으로 색상을 추출하여 앱에 적용하는 기능입니다.

```kotlin
import androidx.compose.material3.dynamicDarkColorScheme
import androidx.compose.material3.dynamicLightColorScheme
import androidx.compose.foundation.isSystemInDarkTheme
import android.os.Build
import androidx.compose.ui.platform.LocalContext

@Composable
fun MyAppTheme(
    darkTheme: Boolean = isSystemInDarkTheme(),
    dynamicColor: Boolean = true,  // Dynamic Color 사용 여부
    content: @Composable () -> Unit
) {
    val colorScheme = when {
        // Dynamic Color 사용 가능한 경우 (Android 12+)
        dynamicColor && Build.VERSION.SDK_INT >= Build.VERSION_CODES.S -> {
            val context = LocalContext.current
            if (darkTheme) {
                dynamicDarkColorScheme(context)
            } else {
                dynamicLightColorScheme(context)
            }
        }
        // Dynamic Color를 사용할 수 없는 경우 → 커스텀 테마 사용
        darkTheme -> MyDarkColorScheme
        else -> MyLightColorScheme
    }

    MaterialTheme(
        colorScheme = colorScheme,
        typography = MyTypography,
        shapes = MyShapes,
        content = content
    )
}
```

**Dynamic Color 특징:**
- 사용자의 배경화면 색상에 맞춰 앱 색상이 자동 조정
- Android 12 미만에서는 동작하지 않으므로 반드시 **폴백(fallback)** 색상 정의 필요
- `dynamicLightColorScheme(context)` / `dynamicDarkColorScheme(context)`로 생성

---

## 5. Typography: TextStyle 정의

M3 Typography는 **15개의 텍스트 스타일 슬롯**을 제공합니다. Display, Headline, Title, Body, Label의 5가지 카테고리에 각각 Large, Medium, Small이 있습니다.

```kotlin
import androidx.compose.material3.Typography
import androidx.compose.ui.text.TextStyle
import androidx.compose.ui.text.font.Font
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.sp

// 커스텀 폰트 패밀리 정의
val PretendardFamily = FontFamily(
    Font(R.font.pretendard_regular, FontWeight.Normal),
    Font(R.font.pretendard_medium, FontWeight.Medium),
    Font(R.font.pretendard_bold, FontWeight.Bold)
)

val MyTypography = Typography(
    // Display: 가장 큰 텍스트 — 히어로 섹션, 숫자 강조
    displayLarge = TextStyle(
        fontFamily = PretendardFamily,
        fontWeight = FontWeight.Normal,
        fontSize = 57.sp,
        lineHeight = 64.sp
    ),
    displayMedium = TextStyle(
        fontFamily = PretendardFamily,
        fontWeight = FontWeight.Normal,
        fontSize = 45.sp,
        lineHeight = 52.sp
    ),
    displaySmall = TextStyle(
        fontFamily = PretendardFamily,
        fontWeight = FontWeight.Normal,
        fontSize = 36.sp,
        lineHeight = 44.sp
    ),

    // Headline: 화면 제목
    headlineLarge = TextStyle(
        fontFamily = PretendardFamily,
        fontWeight = FontWeight.Bold,
        fontSize = 32.sp,
        lineHeight = 40.sp
    ),
    headlineMedium = TextStyle(
        fontFamily = PretendardFamily,
        fontWeight = FontWeight.Bold,
        fontSize = 28.sp,
        lineHeight = 36.sp
    ),

    // Title: 섹션 제목, 카드 제목
    titleLarge = TextStyle(
        fontFamily = PretendardFamily,
        fontWeight = FontWeight.Medium,
        fontSize = 22.sp,
        lineHeight = 28.sp
    ),

    // Body: 본문 텍스트
    bodyLarge = TextStyle(
        fontFamily = PretendardFamily,
        fontWeight = FontWeight.Normal,
        fontSize = 16.sp,
        lineHeight = 24.sp
    ),
    bodyMedium = TextStyle(
        fontFamily = PretendardFamily,
        fontWeight = FontWeight.Normal,
        fontSize = 14.sp,
        lineHeight = 20.sp
    ),

    // Label: 버튼, 탭, 캡션
    labelLarge = TextStyle(
        fontFamily = PretendardFamily,
        fontWeight = FontWeight.Medium,
        fontSize = 14.sp,
        lineHeight = 20.sp
    ),
    labelSmall = TextStyle(
        fontFamily = PretendardFamily,
        fontWeight = FontWeight.Medium,
        fontSize = 11.sp,
        lineHeight = 16.sp
    )
)
```

| 카테고리 | 용도 | 크기 범위 |
|----------|------|----------|
| Display | 히어로, 숫자 강조 | 57~36sp |
| Headline | 화면 제목 | 32~24sp |
| Title | 섹션/카드 제목 | 22~14sp |
| Body | 본문 텍스트 | 16~12sp |
| Label | 버튼, 캡션, 탭 | 14~11sp |

---

## 6. Shape: RoundedCornerShape 정의

M3 Shape 시스템은 컴포넌트의 **모서리 둥글기**를 통일되게 관리합니다. 5개의 크기 슬롯이 있습니다.

```kotlin
import androidx.compose.material3.Shapes
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.ui.unit.dp

val MyShapes = Shapes(
    // 작은 컴포넌트: Chip, 작은 버튼
    extraSmall = RoundedCornerShape(4.dp),

    // 일반 컴포넌트: TextField, 일반 버튼
    small = RoundedCornerShape(8.dp),

    // 중간 컴포넌트: Card
    medium = RoundedCornerShape(12.dp),

    // 큰 컴포넌트: BottomSheet, Dialog
    large = RoundedCornerShape(16.dp),

    // 매우 큰 컴포넌트: 전체 화면 모달
    extraLarge = RoundedCornerShape(28.dp)
)
```

```kotlin
// 사용 예시
Card(
    shape = MaterialTheme.shapes.medium  // 12.dp 둥글기
) {
    Text("카드 콘텐츠")
}

// 다양한 모서리 둥글기 조합
val customShape = RoundedCornerShape(
    topStart = 16.dp,
    topEnd = 16.dp,
    bottomStart = 0.dp,
    bottomEnd = 0.dp
)
```

---

## 7. 테마 색상/서체/도형 사용하기

테마를 정의한 후에는 `MaterialTheme` 객체를 통해 어디서든 접근할 수 있습니다.

```kotlin
@Composable
fun ThemedCard() {
    Card(
        colors = CardDefaults.cardColors(
            // 테마의 색상 사용
            containerColor = MaterialTheme.colorScheme.surfaceVariant
        ),
        // 테마의 도형 사용
        shape = MaterialTheme.shapes.medium
    ) {
        Column(modifier = Modifier.padding(16.dp)) {
            Text(
                text = "제목",
                // 테마의 서체 사용
                style = MaterialTheme.typography.titleLarge,
                // 테마의 색상 사용
                color = MaterialTheme.colorScheme.onSurfaceVariant
            )
            Spacer(modifier = Modifier.height(8.dp))
            Text(
                text = "본문 텍스트입니다. 테마의 bodyMedium 스타일이 적용됩니다.",
                style = MaterialTheme.typography.bodyMedium,
                color = MaterialTheme.colorScheme.onSurfaceVariant
            )
        }
    }
}

@Composable
fun ThemedButton() {
    // M3 컴포넌트는 자동으로 테마 색상을 사용
    Button(onClick = { /* ... */ }) {
        // Button의 텍스트는 자동으로 onPrimary 색상
        Text("확인")
    }

    // OutlinedButton은 자동으로 outline 색상 사용
    OutlinedButton(onClick = { /* ... */ }) {
        Text("취소")
    }

    // 색상을 직접 지정할 수도 있음
    Button(
        onClick = { /* ... */ },
        colors = ButtonDefaults.buttonColors(
            containerColor = MaterialTheme.colorScheme.error,
            contentColor = MaterialTheme.colorScheme.onError
        )
    ) {
        Text("삭제")
    }
}
```

**자주 쓰는 접근 패턴:**

```kotlin
// 색상
MaterialTheme.colorScheme.primary
MaterialTheme.colorScheme.onPrimary
MaterialTheme.colorScheme.surface
MaterialTheme.colorScheme.onSurface
MaterialTheme.colorScheme.error

// 서체
MaterialTheme.typography.headlineMedium
MaterialTheme.typography.bodyLarge
MaterialTheme.typography.labelSmall

// 도형
MaterialTheme.shapes.small
MaterialTheme.shapes.medium
MaterialTheme.shapes.large
```

---

## 8. isSystemInDarkTheme()으로 다크모드 대응

`isSystemInDarkTheme()`은 시스템의 다크모드 설정을 감지하여, 라이트/다크 테마를 자동으로 전환합니다.

```kotlin
import androidx.compose.foundation.isSystemInDarkTheme

@Composable
fun MyAppTheme(
    darkTheme: Boolean = isSystemInDarkTheme(),
    dynamicColor: Boolean = true,
    content: @Composable () -> Unit
) {
    val colorScheme = when {
        dynamicColor && Build.VERSION.SDK_INT >= Build.VERSION_CODES.S -> {
            val context = LocalContext.current
            if (darkTheme) dynamicDarkColorScheme(context)
            else dynamicLightColorScheme(context)
        }
        darkTheme -> MyDarkColorScheme
        else -> MyLightColorScheme
    }

    MaterialTheme(
        colorScheme = colorScheme,
        typography = MyTypography,
        shapes = MyShapes,
        content = content
    )
}
```

### 앱 내 다크모드 토글 구현

```kotlin
@Composable
fun MyApp() {
    // 사용자가 앱 내에서 직접 테마를 전환할 수 있도록
    var isDarkMode by remember { mutableStateOf(false) }

    MyAppTheme(darkTheme = isDarkMode) {
        Scaffold(
            topBar = {
                TopAppBar(
                    title = { Text("내 앱") },
                    actions = {
                        IconButton(onClick = { isDarkMode = !isDarkMode }) {
                            Icon(
                                imageVector = if (isDarkMode) {
                                    Icons.Default.LightMode
                                } else {
                                    Icons.Default.DarkMode
                                },
                                contentDescription = "테마 전환"
                            )
                        }
                    }
                )
            }
        ) { innerPadding ->
            HomeScreen(modifier = Modifier.padding(innerPadding))
        }
    }
}
```

### 테마에 따라 다른 리소스 사용

```kotlin
@Composable
fun AdaptiveImage() {
    val isDark = isSystemInDarkTheme()

    Image(
        painter = painterResource(
            id = if (isDark) R.drawable.logo_dark else R.drawable.logo_light
        ),
        contentDescription = "로고"
    )
}
```

> **팁**: 테마 색상을 직접 하드코딩하지 마세요. `MaterialTheme.colorScheme`을 통해 접근하면 다크모드 전환 시 자동으로 올바른 색상이 적용됩니다.

---

## 9. MotionScheme: 일관된 애니메이션 테마

Material3 **1.4.0**부터 `MotionScheme` API가 **Stable**로 승격되었습니다 (이전에는 Experimental). `MotionScheme`은 앱 전체의 애니메이션에 일관된 이징(easing)과 지속 시간(duration)을 적용하는 모션 토큰 시스템입니다.

M3 컴포넌트(예: `NavigationBar`, `FloatingActionButton`, `ModalBottomSheet` 등)는 내부적으로 `MotionScheme`을 사용하여 일관된 모션을 제공합니다.

```kotlin
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.MotionScheme

// MotionScheme은 MaterialTheme에 포함되어 자동 적용됩니다.
// 커스텀 MotionScheme을 지정할 수도 있습니다.
@Composable
fun MyAppTheme(content: @Composable () -> Unit) {
    MaterialTheme(
        colorScheme = MyLightColorScheme,
        typography = MyTypography,
        shapes = MyShapes,
        content = content
        // MotionScheme은 기본값이 자동 적용됨
    )
}

// 컴포넌트에서 MotionScheme 토큰에 접근
@Composable
fun AnimatedContent() {
    val motionScheme = MaterialTheme.motionScheme
    // motionScheme.fastEffects(), motionScheme.defaultEffects() 등
    // 일관된 이징/지속 시간으로 커스텀 애니메이션을 구성할 수 있습니다.
}
```

> **핵심**: `MotionScheme`을 사용하면 색상, 서체, 도형과 마찬가지로 모션도 테마 수준에서 통일되게 관리할 수 있습니다.

---

## 10. TextAutoSize: 동적 텍스트 크기 조정

Material3 1.4.0에서 `TextAutoSize` 기능이 추가되었습니다. 텍스트가 지정된 영역에 맞도록 **자동으로 크기를 조정**합니다.

```kotlin
import androidx.compose.material3.Text
import androidx.compose.ui.text.TextAutoSize

@Composable
fun AutoSizedText() {
    Text(
        text = "이 텍스트는 영역에 맞게 자동으로 크기가 조정됩니다.",
        autoSize = TextAutoSize.StepBased(
            minFontSize = 12.sp,
            maxFontSize = 40.sp,
            stepSize = 2.sp
        ),
        maxLines = 1,
        modifier = Modifier.fillMaxWidth()
    )
}
```

**주요 특징:**
- `TextAutoSize.StepBased`: 지정한 범위(`minFontSize`~`maxFontSize`) 내에서 단계적으로 크기 조정
- 가로 공간에 맞춰 텍스트 크기를 자동 축소/확대
- 히어로 텍스트, 카드 제목 등 다양한 크기의 화면에 대응해야 하는 경우에 유용

> **참고 — 1.5.0-alpha 프리뷰**: Material3 1.5.0-alpha에서는 `MaterialTheme`의 내부 CompositionLocal들을 하나의 `LocalMaterialTheme`으로 통합하는 패턴이 도입될 예정입니다 (`MaterialTheme.LocalMaterialTheme.current`). 이를 통해 테마 값 접근이 더 단순화될 수 있습니다.

---

> **다음 문서**: [02. Scaffold와 앱 바](02-scaffold-and-appbar.md)에서는 앱의 기본 레이아웃 구조를 잡는 Scaffold와 다양한 앱 바 컴포넌트를 학습합니다.
