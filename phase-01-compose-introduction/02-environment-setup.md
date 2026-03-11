# 개발 환경 설정

> **"좋은 도구가 좋은 결과를 만든다."**
>
> Compose 개발을 시작하려면 올바른 환경 설정이 필수입니다.
> 이 문서에서는 Android Studio 설치부터 첫 번째 Compose 앱 실행까지 단계별로 안내합니다.

---

## 목차

1. [Android Studio 설치](#1-android-studio-설치)
2. [새 Compose 프로젝트 생성](#2-새-compose-프로젝트-생성)
3. [build.gradle 설정 이해하기](#3-buildgradle-설정-이해하기)
4. [Compose 컴파일러 설정](#4-compose-컴파일러-설정)
5. [첫 번째 앱 실행하기](#5-첫-번째-앱-실행하기)
6. [Preview 기능 소개](#6-preview-기능-소개)
7. [정리](#7-정리)

---

## 1. Android Studio 설치

### 최신 안정 버전 다운로드

Compose 개발에는 **Android Studio 최신 안정(Stable) 버전**이 필요합니다.

1. [developer.android.com/studio](https://developer.android.com/studio) 에 접속합니다
2. **Download Android Studio** 버튼을 클릭합니다
3. 라이선스에 동의한 후 다운로드합니다
4. 설치 파일을 실행하여 설치를 완료합니다

```
┌──────────────────────────────────────────────────────┐
│              Android Studio 설치 흐름                  │
│                                                      │
│  다운로드 → 설치 → 초기 설정 마법사 → SDK 설치 → 완료   │
│                                                      │
│  ┌─────────┐   ┌─────────┐   ┌─────────┐            │
│  │ Studio  │──→│ SDK     │──→│ 에뮬레이터│            │
│  │ 설치    │   │ 설치    │   │ 설정     │            │
│  └─────────┘   └─────────┘   └─────────┘            │
└──────────────────────────────────────────────────────┘
```

### 초기 설정 마법사

처음 실행하면 **Setup Wizard**가 나타납니다.

| 단계 | 설정 항목 | 권장 값 |
|------|----------|---------|
| 1 | Install Type | **Standard** (권장) |
| 2 | UI Theme | 선호하는 테마 (Darcula 추천) |
| 3 | SDK Components | 기본값 유지 (최신 SDK 자동 설치) |
| 4 | Emulator Settings | 기본값 유지 |

> **팁**: Standard 설치를 선택하면 필요한 SDK, 빌드 도구, 에뮬레이터가 자동으로 설치됩니다.

### 시스템 요구 사항

| 항목 | 최소 사양 | 권장 사양 |
|------|----------|----------|
| RAM | 8GB | 16GB 이상 |
| 디스크 | 8GB 여유 공간 | SSD + 16GB 이상 |
| OS | Windows 10 / macOS 10.14 / Linux | 최신 OS |
| JDK | 내장 JDK 사용 | 별도 설치 불필요 |

---

## 2. 새 Compose 프로젝트 생성

### 프로젝트 생성 단계

1. Android Studio를 열고 **New Project**를 클릭합니다
2. 템플릿 목록에서 **Empty Activity**를 선택합니다

```
┌──────────────────────────────────────────────────────┐
│              New Project 템플릿 선택                   │
│                                                      │
│  ┌────────────┐  ┌────────────────┐  ┌────────────┐ │
│  │  No        │  │ ★ Empty        │  │  Empty     │ │
│  │  Activity  │  │   Activity     │  │  Views     │ │
│  │            │  │ (Compose 기본) │  │  Activity  │ │
│  └────────────┘  └────────────────┘  └────────────┘ │
│                         ↑                            │
│                    이것을 선택!                        │
│                                                      │
│  ※ "Empty Activity" = Compose 프로젝트                │
│  ※ "Empty Views Activity" = 기존 XML View 프로젝트     │
└──────────────────────────────────────────────────────┘
```

> **주의**: "Empty Activity"와 "Empty Views Activity"를 혼동하지 마세요!
> **Empty Activity**가 Compose 기반 프로젝트입니다.

3. 프로젝트 설정을 입력합니다

| 항목 | 설명 | 예시 |
|------|------|------|
| Name | 앱 이름 | My First Compose |
| Package name | 패키지명 (고유 식별자) | com.example.myfirstcompose |
| Save location | 프로젝트 저장 위치 | 원하는 경로 |
| Minimum SDK | 지원할 최소 Android 버전 | API 23 (Android 6.0) 이상 |
| Build configuration language | 빌드 스크립트 언어 | **Kotlin DSL (권장)** |

4. **Finish**를 클릭하면 프로젝트가 생성됩니다

### 생성된 프로젝트 구조

```
MyFirstCompose/
├── app/
│   ├── src/main/
│   │   ├── java/com/example/myfirstcompose/
│   │   │   ├── MainActivity.kt        ← 메인 액티비티
│   │   │   └── ui/theme/
│   │   │       ├── Color.kt           ← 색상 정의
│   │   │       ├── Theme.kt           ← 테마 설정
│   │   │       └── Type.kt            ← 서체 설정
│   │   ├── res/                        ← 리소스 (아이콘 등)
│   │   └── AndroidManifest.xml         ← 앱 매니페스트
│   └── build.gradle.kts               ← 앱 모듈 빌드 설정
├── build.gradle.kts                    ← 프로젝트 빌드 설정
├── gradle/
│   └── libs.versions.toml             ← 버전 카탈로그
└── settings.gradle.kts                 ← 설정
```

### 자동 생성된 MainActivity.kt

```kotlin [compose-playground]
class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContent {
            MyFirstComposeTheme {
                Scaffold(modifier = Modifier.fillMaxSize()) { innerPadding ->
                    Greeting(
                        name = "Android",
                        modifier = Modifier.padding(innerPadding)
                    )
                }
            }
        }
    }
}

@Composable
fun Greeting(name: String, modifier: Modifier = Modifier) {
    Text(
        text = "Hello $name!",
        modifier = modifier
    )
}

@Preview(showBackground = true)
@Composable
fun GreetingPreview() {
    MyFirstComposeTheme {
        Greeting("Android")
    }
}
```

> **XML 방식과의 차이**: `setContentView(R.layout.activity_main)` 대신 `setContent { ... }`를 사용합니다.
> XML 레이아웃 파일이 아니라 **Composable 함수**를 직접 호출합니다.

---

## 3. build.gradle 설정 이해하기

Compose 프로젝트의 빌드 설정을 이해하는 것이 중요합니다.

### Version Catalog (`gradle/libs.versions.toml`)

최신 Android 프로젝트는 **Version Catalog**로 의존성 버전을 중앙 관리합니다.

```toml
[versions]
agp = "8.7.3"
kotlin = "2.3.10"
composeBom = "2026.02.01"
coreKtx = "1.15.0"
lifecycleRuntimeKtx = "2.10.0"
activityCompose = "1.9.3"

[libraries]
androidx-core-ktx = { group = "androidx.core", module = "core-ktx", version.ref = "coreKtx" }
androidx-lifecycle-runtime-ktx = { group = "androidx.lifecycle", module = "lifecycle-runtime-ktx", version.ref = "lifecycleRuntimeKtx" }
androidx-activity-compose = { group = "androidx.activity", module = "activity-compose", version.ref = "activityCompose" }

# Compose BOM — 모든 Compose 라이브러리 버전을 하나로 관리
androidx-compose-bom = { group = "androidx.compose", module = "compose-bom", version.ref = "composeBom" }
androidx-ui = { group = "androidx.compose.ui", module = "ui" }
androidx-ui-graphics = { group = "androidx.compose.ui", module = "ui-graphics" }
androidx-ui-tooling = { group = "androidx.compose.ui", module = "ui-tooling" }
androidx-ui-tooling-preview = { group = "androidx.compose.ui", module = "ui-tooling-preview" }
androidx-material3 = { group = "androidx.compose.material3", module = "material3" }

[plugins]
android-application = { id = "com.android.application", version.ref = "agp" }
kotlin-android = { id = "org.jetbrains.kotlin.android", version.ref = "kotlin" }
compose-compiler = { id = "org.jetbrains.kotlin.plugin.compose", version.ref = "kotlin" }
```

### 앱 모듈 build.gradle.kts

```kotlin [compose-playground]
plugins {
    alias(libs.plugins.android.application)
    alias(libs.plugins.kotlin.android)
    alias(libs.plugins.compose.compiler)  // ← Compose 컴파일러 플러그인
}

android {
    namespace = "com.example.myfirstcompose"
    compileSdk = 35

    defaultConfig {
        applicationId = "com.example.myfirstcompose"
        minSdk = 23          // ← Lifecycle 2.10.0부터 최소 API 23 필요
        targetSdk = 35
        versionCode = 1
        versionName = "1.0"
    }

    buildFeatures {
        compose = true  // ← Compose 활성화 (필수!)
    }

    kotlinOptions {
        jvmTarget = "17"  // ← JVM 타겟 11 또는 17 권장 (1.8은 더 이상 사용하지 않음)
    }
}

dependencies {
    // Compose BOM — 이것 하나로 모든 Compose 버전을 통합 관리
    implementation(platform(libs.androidx.compose.bom))

    // Compose 핵심 라이브러리 (BOM이 버전을 관리하므로 버전 명시 불필요)
    implementation(libs.androidx.ui)              // 기본 UI
    implementation(libs.androidx.ui.graphics)     // 그래픽
    implementation(libs.androidx.material3)       // Material Design 3
    implementation(libs.androidx.ui.tooling.preview) // @Preview 지원

    // Activity에서 Compose 사용
    implementation(libs.androidx.activity.compose)

    // 디버그 빌드에서만 사용 (미리보기 등)
    debugImplementation(libs.androidx.ui.tooling)
}
```

### Compose BOM이란?

**BOM (Bill of Materials)** 은 모든 Compose 라이브러리의 버전을 하나로 통합 관리하는 파일입니다.

```
┌────────────────────────────────────────────────────────┐
│                   Compose BOM의 역할                    │
│                                                        │
│  BOM 없이:                                              │
│    compose-ui = "1.10.4"                               │
│    compose-material3 = "1.4.0"                         │
│    compose-foundation = "1.10.4"                       │
│    → 버전 불일치 위험!                                    │
│                                                        │
│  BOM 사용:                                              │
│    compose-bom = "2026.02.01"                          │
│    compose-ui       → BOM이 호환 버전 자동 결정           │
│    compose-material3 → BOM이 호환 버전 자동 결정          │
│    compose-foundation → BOM이 호환 버전 자동 결정         │
│    → 항상 호환되는 버전 조합 보장!                         │
└────────────────────────────────────────────────────────┘
```

> **핵심**: BOM 버전 하나만 관리하면, 나머지 Compose 라이브러리의 버전은 자동으로 맞춰집니다.
> 개별 라이브러리에 버전을 명시하지 않아도 됩니다.

---

## 4. Compose 컴파일러 설정

### Kotlin 2.0+ 에서의 Compose 컴파일러

Kotlin 2.0부터 Compose 컴파일러는 **Kotlin 컴파일러 플러그인(`org.jetbrains.kotlin.plugin.compose`)**으로 통합되었습니다.
더 이상 `composeOptions { kotlinCompilerExtensionVersion = "..." }` 블록이 필요하지 않습니다.

```kotlin [compose-playground]
// build.gradle.kts (프로젝트 루트)
plugins {
    alias(libs.plugins.compose.compiler) apply false
}

// build.gradle.kts (앱 모듈)
plugins {
    alias(libs.plugins.compose.compiler)  // 이 한 줄이면 OK!
}
```

> **이전 방식과의 비교**:
> - Kotlin 1.x: `composeOptions { kotlinCompilerExtensionVersion = "..." }` 별도 설정 필요
> - Kotlin 2.0+: `org.jetbrains.kotlin.plugin.compose` 플러그인만 추가하면 자동 설정 (별도의 `composeOptions` 블록 불필요)

### Compose 컴파일러 고급 설정 (선택 사항)

Compose 컴파일러의 보고서 및 안정성 설정이 필요한 경우, `composeCompiler` 블록을 사용합니다.

```kotlin [compose-playground]
// build.gradle.kts (앱 모듈)
composeCompiler {
    reportsDestination = layout.buildDirectory.dir("compose_compiler")
    stabilityConfigurationFile = rootProject.layout.projectDirectory.file("stability_config.conf")
}
```

> 이 설정은 선택 사항이며, 안정성 보고서 확인이나 커스텀 안정성 규칙이 필요할 때 사용합니다.

### Compose 컴파일러가 하는 일

```
┌─────────────────────────────────────────────────────┐
│           Compose 컴파일러의 역할                      │
│                                                     │
│  개발자가 작성한 코드          컴파일러가 변환한 코드    │
│  ┌──────────────────┐      ┌─────────────────────┐  │
│  │  @Composable     │      │  상태 추적 코드 삽입  │  │
│  │  fun Greeting()  │ ───→ │  리컴포지션 최적화    │  │
│  │  { Text("Hi") }  │      │  스킵 로직 추가       │  │
│  └──────────────────┘      └─────────────────────┘  │
│                                                     │
│  → @Composable 함수에 리컴포지션을 위한                 │
│    추가 코드를 자동으로 생성합니다                       │
└─────────────────────────────────────────────────────┘
```

`@Composable` 어노테이션이 붙은 함수를 만나면, 컴파일러가 자동으로:
- **상태 추적 코드**를 삽입합니다 (상태가 바뀌면 자동으로 UI 갱신)
- **스킵 로직**을 추가합니다 (변경되지 않은 부분은 재실행하지 않음)
- **그룹 정보**를 삽입합니다 (리컴포지션 범위를 결정하기 위해)

---

## 5. 첫 번째 앱 실행하기

### 방법 1: 에뮬레이터에서 실행

1. **Device Manager**를 엽니다 (우측 사이드바 또는 Tools > Device Manager)
2. **Create Virtual Device**를 클릭합니다
3. 디바이스를 선택합니다 (예: Pixel 8)
4. 시스템 이미지를 선택합니다 (최신 API 권장)
5. **Finish**를 클릭하여 에뮬레이터를 생성합니다

```
┌────────────────────────────────────────────────────────┐
│              에뮬레이터 생성 흐름                         │
│                                                        │
│  Device Manager → Create Device → 기기 선택             │
│                                                        │
│  ┌──────────┐   ┌──────────┐   ┌──────────┐           │
│  │ Pixel 8  │   │ API 35   │   │  Finish  │           │
│  │ 선택     │──→│ 이미지   │──→│  클릭    │           │
│  │          │   │ 다운로드 │   │          │           │
│  └──────────┘   └──────────┘   └──────────┘           │
└────────────────────────────────────────────────────────┘
```

6. 상단 툴바에서 생성한 에뮬레이터를 선택합니다
7. **Run (▶)** 버튼을 클릭합니다 (또는 `Shift + F10`)

### 방법 2: 실제 기기에서 실행

1. **개발자 옵션 활성화**
   - 설정 > 휴대전화 정보 > 소프트웨어 정보
   - **빌드 번호**를 7번 연속 탭
   - "개발자가 되었습니다" 메시지 확인

2. **USB 디버깅 활성화**
   - 설정 > 개발자 옵션 > USB 디버깅 ON

3. USB 케이블로 PC와 연결 후 **Run** 클릭

### 실행 결과 확인

정상적으로 실행되면 화면에 **"Hello Android!"** 텍스트가 표시됩니다.

```
┌──────────────────────────┐
│  My First Compose        │
├──────────────────────────┤
│                          │
│  Hello Android!          │
│                          │
│                          │
│                          │
│                          │
│                          │
│                          │
└──────────────────────────┘
```

> **축하합니다!** 첫 번째 Compose 앱을 성공적으로 실행했습니다.

### 자주 발생하는 문제와 해결 방법

| 문제 | 원인 | 해결 방법 |
|------|------|----------|
| Gradle Sync 실패 | SDK 미설치 | SDK Manager에서 필요한 SDK 설치 |
| 에뮬레이터 느림 | 하드웨어 가속 미설정 | HAXM (Intel) 또는 Hypervisor 설치 |
| 빌드 에러 | 종속성 버전 불일치 | Compose BOM 버전 확인 |
| Preview 표시 안 됨 | 빌드 필요 | Build > Make Project 실행 |

---

## 6. Preview 기능 소개

Compose의 가장 강력한 기능 중 하나는 **미리보기(Preview)** 입니다.

### 기본 사용법

```kotlin [compose-playground]
@Preview(showBackground = true)
@Composable
fun GreetingPreview() {
    MyFirstComposeTheme {
        Greeting("Android")
    }
}
```

Android Studio의 **Split** 또는 **Design** 탭을 클릭하면,
앱을 실행하지 않고도 UI를 바로 확인할 수 있습니다.

```
┌────────────────────────────────────────────────────────┐
│  Android Studio 에디터 뷰 모드                           │
│                                                        │
│  ┌──────┐  ┌──────┐  ┌──────┐                          │
│  │ Code │  │ Split│  │Design│                          │
│  └──────┘  └──────┘  └──────┘                          │
│                 ↑                                       │
│           코드 + 미리보기를                               │
│           나란히 표시 (권장)                               │
└────────────────────────────────────────────────────────┘
```

### @Preview 어노테이션의 다양한 옵션

```kotlin [compose-playground]
// 기본 미리보기
@Preview(showBackground = true)

// 이름을 붙인 미리보기
@Preview(name = "밝은 테마", showBackground = true)

// 다크 모드 미리보기
@Preview(
    name = "다크 테마",
    showBackground = true,
    uiMode = Configuration.UI_MODE_NIGHT_YES
)

// 기기 전체 화면으로 미리보기
@Preview(showSystemUi = true)

// 특정 화면 크기로 미리보기
@Preview(
    widthDp = 320,
    heightDp = 640
)

// 폰트 크기 변경 테스트
@Preview(fontScale = 2.0f)
```

### 여러 미리보기를 동시에 사용

```kotlin [compose-playground]
@Preview(name = "기본", showBackground = true)
@Preview(name = "큰 글씨", showBackground = true, fontScale = 1.5f)
@Preview(name = "다크 모드", showBackground = true, uiMode = Configuration.UI_MODE_NIGHT_YES)
@Composable
fun GreetingPreview() {
    MyFirstComposeTheme {
        Greeting("Android")
    }
}
```

> 하나의 Composable에 **여러 `@Preview`를 동시에** 붙이면,
> 다양한 조건에서의 UI를 한 눈에 비교할 수 있습니다.

### XML Preview와의 비교

| 항목 | XML Preview | Compose @Preview |
|------|------------|------------------|
| 동적 데이터 | 제한적 (tools:text 등) | Kotlin 코드로 자유롭게 |
| 다양한 상태 | 하나의 상태만 | 여러 미리보기 동시 가능 |
| 다크 모드 | 수동 전환 | `uiMode` 파라미터로 즉시 |
| 인터랙션 | 불가 | Interactive Mode 지원 |
| 기기 크기 | 수동 변경 | `widthDp`, `heightDp` 지정 |

### Interactive Mode (인터랙티브 모드)

Preview 패널에서 **Start Interactive Mode** 버튼을 클릭하면,
앱을 실행하지 않고도 **클릭, 스크롤** 등 상호작용을 테스트할 수 있습니다.

---

## 7. 정리

| 핵심 항목 | 설명 |
|-----------|------|
| Android Studio | Compose 개발에 필수적인 공식 IDE |
| Empty Activity | Compose 기반 프로젝트 템플릿 (Empty Views Activity와 구분!) |
| Compose BOM | 모든 Compose 라이브러리 버전을 통합 관리하는 시스템 |
| kotlin-compose 플러그인 | Kotlin 2.0+ 에서 Compose 컴파일러를 활성화하는 플러그인 |
| `setContent { }` | Activity에서 Compose UI를 시작하는 진입점 |
| `@Preview` | 앱 실행 없이 UI를 미리 확인하는 어노테이션 |

### 체크리스트

- [ ] Android Studio 최신 안정 버전을 설치했는가?
- [ ] Empty Activity 템플릿으로 새 프로젝트를 생성했는가?
- [ ] Compose BOM의 역할을 이해하는가?
- [ ] 에뮬레이터 또는 실제 기기에서 앱을 실행했는가?
- [ ] @Preview로 UI를 미리 확인해 보았는가?

### 다음 단계

다음 문서에서는 **Composable 함수**의 개념과 작성법을 자세히 배워봅니다.

> [다음: 03. Composable 함수 이해하기 →](03-composable-functions.md)
