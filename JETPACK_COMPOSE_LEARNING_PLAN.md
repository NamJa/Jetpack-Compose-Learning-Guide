# Jetpack Compose 학습 로드맵

> **대상**: Android 개발을 처음 시작하는 신입/초급 개발자
> **목표**: Jetpack Compose를 활용한 현대적 Android UI 개발 역량 확보
> **기준**: 2026년 최신 Compose BOM
> **공식 문서**: https://developer.android.com/develop/ui/compose

---

<!-- 오늘의 학습 현황 -->
<div class="dashboard-stats-mount"></div>

<!-- Skill Tree 학습 경로 -->
<div class="skill-tree-mount"></div>

---

<!-- 뱃지 컬렉션 -->
### 내 업적

<div class="badge-preview-mount"></div>

---

## 기술 스택 Overview (2026 기준)

| 영역 | 기술 | 버전 | 비고 |
|------|------|------|------|
| Language | Kotlin | 2.3.10 | K2 컴파일러 기본, Compose 필수 언어 |
| UI Framework | Jetpack Compose | BOM 2026.02.01 | 선언형 UI 툴킷 |
| Compose UI/Foundation | androidx.compose | 1.10.4 | FlexBox, Grid 등 신규 레이아웃 |
| Design System | Material Design 3 | 1.4.0 | MotionScheme, TextAutoSize, SecureTextField |
| Compose Compiler | Kotlin Plugin | 2.3.10 | `org.jetbrains.kotlin.plugin.compose` |
| Architecture | MVVM + UDF | — | 단방향 데이터 흐름 |
| Navigation | Navigation3 | 1.0.1 | `NavKey` + `NavDisplay` 선언적 내비게이션 |
| Lifecycle | AndroidX Lifecycle | 2.10.0 | `collectAsStateWithLifecycle`, Min SDK 23 |
| State Management | State + ViewModel | — | TextFieldState, Compose 내장 상태 관리 |
| Async | Kotlin Coroutines + Flow | — | 비동기 처리 |
| DI | Hilt / Koin | — | 의존성 주입 |
| Testing | Compose UI Test + JUnit | — | 공식 테스트 프레임워크 |
| Build | Gradle (Kotlin DSL) | — | Version Catalog 권장 |
| IDE | Android Studio (Latest) | — | Compose 미리보기, Live Edit 지원 |

---

## Phase 0: 사전 준비 — Kotlin 기초

> **기간**: 1~2주
> **핵심**: Compose는 Kotlin 100% 기반. 기초 문법과 함수형 프로그래밍 이해 필수

### 0-1. Kotlin 핵심 문법

Compose 개발에 필수적인 Kotlin 핵심:

| 개념 | 설명 | Compose 활용 |
|------|------|-------------|
| `val` / `var` | 불변/가변 변수 | 상태 선언 |
| `data class` | 데이터 클래스 | UI 상태 모델링 |
| `sealed class` | 봉인 클래스 | 화면 상태 표현 |
| `null safety` | Null 안전성 | 안전한 UI 렌더링 |
| `extension function` | 확장 함수 | Modifier 체이닝 |
| `lambda` | 람다 표현식 | 이벤트 핸들러, Composable 콘텐츠 |
| `scope function` | let, apply, with 등 | 빌더 패턴 |

### 0-2. 체크리스트

- [ ] `val`, `var`, 기본 타입과 컬렉션을 이해하는가?
- [ ] `data class`, `sealed class`를 사용할 수 있는가?
- [ ] 고차 함수와 람다 표현식에 익숙한가?
- [ ] `suspend` 함수와 코루틴 기초를 이해하는가?

---

## Phase 1: Compose 시작하기

> **기간**: 1~2주
> **핵심**: 선언형 UI 패러다임 이해와 개발 환경 구축

### 1-1. 학습 목표

- 명령형 UI(XML View)와 선언형 UI(Compose)의 차이 이해
- Android Studio에서 Compose 프로젝트 생성
- `@Composable` 함수의 개념과 작성법 이해
- 리컴포지션과 수명주기 이해

### 1-2. 체크리스트

- [ ] 선언형 UI의 이점을 설명할 수 있는가?
- [ ] 새 Compose 프로젝트를 생성할 수 있는가?
- [ ] `@Composable` 함수를 작성하고 미리보기를 확인할 수 있는가?
- [ ] 리컴포지션이 언제 발생하는지 이해하는가?

---

## Phase 2: 기본 레이아웃

> **기간**: 1~2주
> **핵심**: 화면을 구성하는 기본 레이아웃 컴포넌트와 Modifier 시스템 마스터

### 2-1. 학습 목표

- Column, Row, Box로 UI 레이아웃 구성
- Modifier를 활용한 크기, 패딩, 클릭 등 속성 설정
- Arrangement와 Alignment으로 정밀한 배치
- BoxWithConstraints로 반응형 레이아웃 구현

### 2-2. XML View ↔ Compose 대응

| XML View | Compose |
|----------|---------|
| `LinearLayout (vertical)` | `Column` |
| `LinearLayout (horizontal)` | `Row` |
| `FrameLayout` | `Box` |
| `android:padding` | `Modifier.padding()` |
| `android:layout_width/height` | `Modifier.size() / fillMaxWidth()` |
| `android:gravity` | `Arrangement / Alignment` |

### 2-3. 체크리스트

- [ ] Column, Row, Box를 조합하여 복잡한 레이아웃을 만들 수 있는가?
- [ ] Modifier 체이닝과 순서의 중요성을 이해하는가?
- [ ] weight를 사용하여 유연한 공간 배분을 할 수 있는가?
- [ ] 다양한 화면 크기에 대응하는 레이아웃을 설계할 수 있는가?

---

## Phase 3: 핵심 컴포넌트

> **기간**: 1~2주
> **핵심**: 가장 많이 사용하는 UI 컴포넌트 완전 습득

### 3-1. 학습 목표

- Text, TextField(TextFieldState 기반)로 텍스트 표시와 입력 처리
- Button, IconButton, FAB 등 다양한 버튼 사용
- Image로 리소스/네트워크 이미지 표시
- LazyColumn, LazyRow, LazyGrid로 효율적인 리스트/그리드 구현

### 3-2. 체크리스트

- [ ] Text의 다양한 스타일링을 적용할 수 있는가?
- [ ] TextFieldState 기반 TextField로 사용자 입력을 처리할 수 있는가?
- [ ] LazyColumn에 key를 제공하고 효율적인 리스트를 만들 수 있는가?
- [ ] 이미지를 로드하고 표시할 수 있는가?

---

## Phase 4: 상태 관리

> **기간**: 2주
> **핵심**: Compose의 가장 중요한 개념 — 상태 관리와 부수 효과 처리

### 4-1. 학습 목표

- `remember`, `mutableStateOf`로 상태 관리
- 상태 호이스팅과 단방향 데이터 흐름(UDF) 이해
- LaunchedEffect, DisposableEffect 등 Side Effect API 활용
- ViewModel과 Compose 연동

### 4-2. 체크리스트

- [ ] `remember`와 `rememberSaveable`의 차이를 설명할 수 있는가?
- [ ] 상태 호이스팅을 적용하여 재사용 가능한 컴포넌트를 만들 수 있는가?
- [ ] 적절한 Side Effect API를 선택할 수 있는가?
- [ ] ViewModel의 상태를 Compose에서 관찰할 수 있는가?

---

## Phase 5: 내비게이션

> **기간**: 1주
> **핵심**: 화면 간 이동과 인수 전달

### 5-1. 학습 목표

- Navigation3 설정과 NavDisplay/NavKey/백 스택 사용
- `@Serializable` 기반 타입 안전 라우팅으로 화면 간 이동과 인수 전달
- 중첩 내비게이션과 딥 링크
- NavigationSuiteScaffold로 적응형 내비게이션 구현

### 5-2. 체크리스트

- [ ] NavHost와 NavController를 설정할 수 있는가?
- [ ] `@Serializable` 라우트로 화면 간 인수를 타입 안전하게 전달할 수 있는가?
- [ ] 백 스택을 적절히 관리할 수 있는가?

---

## Phase 6: Material Design

> **기간**: 1~2주
> **핵심**: Material Design 3 테마와 고급 UI 컴포넌트 활용

### 6-1. 학습 목표

- Material Theme (색상, 서체, 도형) 설정과 MotionScheme
- Scaffold, TopAppBar, NavigationSuiteScaffold 구현
- Dialog, BottomSheet, SearchBar 등 오버레이 UI 구현
- 커스텀 테마와 다이나믹 컬러 적용

### 6-2. 체크리스트

- [ ] MaterialTheme으로 앱 전체 테마를 설정할 수 있는가?
- [ ] Scaffold를 사용하여 앱 구조를 구성할 수 있는가?
- [ ] 다크 모드와 다이나믹 컬러를 지원할 수 있는가?
- [ ] 커스텀 디자인 시스템을 구축할 수 있는가?

---

## Phase 7: 애니메이션

> **기간**: 1주
> **핵심**: 사용자 경험을 향상시키는 애니메이션 구현

### 7-1. 학습 목표

- animate*AsState로 단일 값 애니메이션
- AnimatedVisibility, AnimatedContent로 전환 애니메이션
- Transition API로 복잡한 다중 값 애니메이션

### 7-2. 체크리스트

- [ ] 기본 값 애니메이션을 구현할 수 있는가?
- [ ] 화면 전환 시 적절한 애니메이션을 적용할 수 있는가?
- [ ] AnimationSpec으로 애니메이션을 커스터마이즈할 수 있는가?

---

## Phase 8: 터치와 제스처

> **기간**: 1주
> **핵심**: 사용자 입력 처리와 제스처 구현

### 8-1. 학습 목표

- clickable, combinedClickable 수정자로 탭/클릭 처리
- 스크롤과 중첩 스크롤 구현
- 드래그, 스와이프, 멀티 터치 제스처 처리

### 8-2. 체크리스트

- [ ] 다양한 클릭 이벤트를 처리할 수 있는가?
- [ ] 중첩 스크롤을 올바르게 구현할 수 있는가?
- [ ] 커스텀 제스처를 pointerInput으로 구현할 수 있는가?

---

## Phase 9: 테스팅 & 디버깅

> **기간**: 1주
> **핵심**: 안정적인 앱을 위한 테스트 작성과 디버깅 기법

### 9-1. 학습 목표

- ComposeTestRule로 UI 테스트 작성
- 노드 찾기, 어설션, 액션 수행
- Layout Inspector, Recomposition 카운터 활용

### 9-2. 체크리스트

- [ ] Compose UI 테스트를 작성할 수 있는가?
- [ ] 시맨틱을 활용하여 테스트 가능한 UI를 설계할 수 있는가?
- [ ] 성능 문제를 디버깅 도구로 진단할 수 있는가?

---

## Phase 10: 아키텍처 & 성능

> **기간**: 1~2주
> **핵심**: 프로덕션 수준의 앱 설계와 성능 최적화

### 10-1. 학습 목표

- MVVM + UDF 아키텍처 패턴 적용
- 불필요한 리컴포지션 방지와 성능 최적화
- 실전 프로젝트 구조 설계

### 10-2. 체크리스트

- [ ] 단방향 데이터 흐름 기반 아키텍처를 설계할 수 있는가?
- [ ] Strong Skipping, derivedStateOf, 람다 기반 Modifier로 성능을 최적화할 수 있는가?
- [ ] 기준 프로필을 활용하여 앱 시작 시간을 개선할 수 있는가?
