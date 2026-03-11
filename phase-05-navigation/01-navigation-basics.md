# Navigation Compose 기초

> **"앱은 하나의 화면이 아니라, 여러 화면이 유기적으로 연결된 흐름이다."**
>
> Navigation Compose는 Jetpack Compose에서 화면 간 이동을 선언적으로 처리하는 공식 라이브러리입니다. 이 문서에서는 Navigation의 핵심 개념부터 실제 화면 전환까지 단계별로 학습합니다.

---

## 목차

1. [Navigation 종속성 추가](#1-navigation-종속성-추가)
2. [NavController: rememberNavController()](#2-navcontroller-remembernavcontroller)
3. [NavHost: startDestination과 NavGraphBuilder](#3-navhost-startdestination과-navgraphbuilder)
4. [Type-Safe Navigation: @Serializable 데이터 클래스로 경로 정의](#4-type-safe-navigation-serializable-데이터-클래스로-경로-정의)
5. [composable\<Route\> { } 블록](#5-composableroute--블록)
6. [navController.navigate()로 화면 이동](#6-navcontrollernavigate로-화면-이동)
7. [백 스택 관리: popBackStack(), popUpTo, launchSingleTop](#7-백-스택-관리-popbackstack-popupto-launchsingletop)

---

## 1. Navigation 종속성 추가

Navigation Compose를 사용하려면 프로젝트의 `build.gradle.kts`에 종속성을 추가해야 합니다.

**Navigation Compose**는 Jetpack의 Navigation 컴포넌트를 Compose 환경에 맞게 확장한 라이브러리입니다. `NavHost`, `NavController` 등의 핵심 API를 제공하며, Type-Safe Navigation을 위해 Kotlin Serialization도 함께 추가합니다.

```kotlin
// build.gradle.kts (Module: app)
plugins {
    // Kotlin Serialization 플러그인 추가 (Type-Safe Navigation에 필요)
    kotlin("plugin.serialization") version "2.1.0"
}

dependencies {
    // Navigation Compose
    val navVersion = "2.9.7"
    implementation("androidx.navigation:navigation-compose:$navVersion")

    // Kotlin Serialization (Type-Safe 경로 정의에 필요)
    implementation("org.jetbrains.kotlinx:kotlinx-serialization-json:1.8.0")
}
```

> **XML View 비교**: XML 기반에서는 `navigation-fragment`와 `navigation-ui`를 사용했지만, Compose에서는 `navigation-compose` 하나로 통합됩니다.

---

## 2. NavController: rememberNavController()

`NavController`는 Navigation의 중심 객체로, **화면 이동과 백 스택(back stack)을 관리**합니다. Compose에서는 `rememberNavController()`로 생성합니다.

**NavController가 하는 일:**
- 현재 화면(destination) 추적
- 화면 간 이동(`navigate()`)
- 뒤로 가기(`popBackStack()`)
- 백 스택 상태 관리

```kotlin
import androidx.navigation.compose.rememberNavController

@Composable
fun MyApp() {
    // NavController 생성 — 컴포지션에서 기억(remember)됨
    val navController = rememberNavController()

    // NavController를 NavHost에 전달
    MyNavHost(navController = navController)
}
```

> **핵심 포인트**: `rememberNavController()`는 반드시 **컴포저블 계층의 최상위**에서 호출하세요. 화면 전환 시에도 NavController가 유지되어야 하므로, 개별 화면 컴포저블 안에서 생성하면 안 됩니다.

---

## 3. NavHost: startDestination과 NavGraphBuilder

`NavHost`는 **화면들을 담는 컨테이너**입니다. 어떤 경로(route)에 어떤 화면을 보여줄지 정의하는 내비게이션 그래프를 구성합니다.

**NavHost의 핵심 파라미터:**
- `navController`: 화면 이동을 제어하는 컨트롤러
- `startDestination`: 앱이 시작될 때 처음 보여줄 화면
- `builder`: `NavGraphBuilder` 람다 — 여기서 각 화면을 등록

```kotlin
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.composable
import kotlinx.serialization.Serializable

@Serializable object Home
@Serializable data class Detail(val itemId: Int)

@Composable
fun MyNavHost(navController: NavHostController) {
    NavHost(
        navController = navController,
        startDestination = Home  // @Serializable object를 직접 전달
    ) {
        // NavGraphBuilder 블록 — 화면 등록
        composable<Home> {
            HomeScreen(
                onNavigateToDetail = { itemId ->
                    navController.navigate(Detail(itemId = itemId))
                }
            )
        }
        composable<Detail> { backStackEntry ->
            val detail = backStackEntry.toRoute<Detail>()
            DetailScreen(
                itemId = detail.itemId,
                onBack = {
                    navController.popBackStack()
                }
            )
        }
    }
}
```

> **비유**: `NavHost`는 "극장"이고, 각 `composable`은 "무대 위에 올릴 수 있는 연극"입니다. `startDestination`은 "오늘의 첫 공연"을 지정하는 것과 같습니다.
>
> **참고**: Navigation 2.8 이전의 문자열 기반 경로(`composable("home") { }`)도 여전히 동작하지만, Type-Safe Navigation이 권장 패턴입니다. 위 예제처럼 `@Serializable` 클래스를 사용하세요.

---

## 4. Type-Safe Navigation: @Serializable 데이터 클래스로 경로 정의

문자열 기반 경로(`"home"`, `"detail"`)는 오타에 취약합니다. **Navigation 2.8+** 부터는 `@Serializable` 데이터 클래스로 **타입 안전한 경로**를 정의할 수 있습니다. **2.9.x**에서는 이 패턴이 Navigation Compose의 기본 권장 방식입니다.

**왜 Type-Safe Navigation인가?**
- 문자열 오타로 인한 런타임 크래시 방지
- 인수(argument)의 타입을 컴파일 타임에 검증
- IDE 자동완성 지원

```kotlin
import kotlinx.serialization.Serializable

// 경로(Route)를 @Serializable 클래스/오브젝트로 정의
@Serializable
object Home  // 인수가 없는 화면은 object 사용

@Serializable
object Profile

@Serializable
data class Detail(val itemId: Int)  // 인수가 있는 화면은 data class 사용
```

이렇게 정의한 경로를 `NavHost`에서 사용합니다:

```kotlin
@Composable
fun MyNavHost(navController: NavHostController) {
    NavHost(
        navController = navController,
        startDestination = Home  // object를 직접 전달
    ) {
        composable<Home> {
            HomeScreen(/* ... */)
        }
        composable<Profile> {
            ProfileScreen(/* ... */)
        }
        composable<Detail> { backStackEntry ->
            // Detail 경로의 인수를 읽는 방법은 다음 섹션에서!
            DetailScreen(/* ... */)
        }
    }
}
```

### Non-Reified 대안: KClass 사용

제네릭 `composable<Route>` 외에도 `KClass`를 직접 전달하는 non-reified 방식도 사용할 수 있습니다. 리플렉션이 제한된 환경이나 동적 경로 등록에 유용합니다.

```kotlin
// KClass를 사용한 non-reified 방식
composable(Home::class) {
    HomeScreen(/* ... */)
}

composable(Detail::class) { backStackEntry ->
    val detail = backStackEntry.toRoute<Detail>()
    DetailScreen(itemId = detail.itemId)
}
```

### Value Class를 경로 인수로 사용

Navigation 2.9+에서는 Kotlin value class(인라인 클래스)를 경로 및 인수 타입으로 사용할 수 있습니다.

```kotlin
@JvmInline
value class UserId(val value: String)

@Serializable
data class UserProfile(val userId: UserId)

// NavHost에서 동일하게 사용
composable<UserProfile> { backStackEntry ->
    val route = backStackEntry.toRoute<UserProfile>()
    ProfileScreen(userId = route.userId)
}
```

---

## 5. composable\<Route\> { } 블록

`composable<Route> { }` 블록은 특정 경로에 대응하는 **화면(컴포저블)을 등록**하는 DSL입니다. Type-Safe Navigation에서는 제네릭 타입으로 경로 클래스를 지정합니다.

```kotlin
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.composable
import androidx.navigation.toRoute

NavHost(
    navController = navController,
    startDestination = Home
) {
    // object 경로 — 인수 없음
    composable<Home> {
        HomeScreen(
            onItemClick = { itemId ->
                navController.navigate(Detail(itemId = itemId))
            }
        )
    }

    // data class 경로 — 인수 있음
    composable<Detail> { backStackEntry ->
        // toRoute<T>()로 타입 안전하게 인수 추출
        val detail: Detail = backStackEntry.toRoute<Detail>()
        DetailScreen(itemId = detail.itemId)
    }
}
```

**backStackEntry 활용:**
- `backStackEntry.toRoute<T>()`: 경로 객체를 타입 안전하게 복원
- `backStackEntry.savedStateHandle`: 화면 간 결과 전달에 사용

---

## 6. navController.navigate()로 화면 이동

화면을 이동할 때는 `navController.navigate()`에 **경로 객체를 전달**합니다.

```kotlin
@Composable
fun HomeScreen(
    onItemClick: (Int) -> Unit,
    onProfileClick: () -> Unit
) {
    Column(
        modifier = Modifier
            .fillMaxSize()
            .padding(16.dp)
    ) {
        Text(
            text = "홈 화면",
            style = MaterialTheme.typography.headlineMedium
        )

        Spacer(modifier = Modifier.height(16.dp))

        // 인수 없는 화면으로 이동
        Button(onClick = onProfileClick) {
            Text("프로필 보기")
        }

        Spacer(modifier = Modifier.height(8.dp))

        // 인수 있는 화면으로 이동
        Button(onClick = { onItemClick(42) }) {
            Text("아이템 #42 상세 보기")
        }
    }
}

// 호출하는 쪽 (NavHost 내부)
composable<Home> {
    HomeScreen(
        onItemClick = { itemId ->
            // Detail data class에 인수 전달
            navController.navigate(Detail(itemId = itemId))
        },
        onProfileClick = {
            navController.navigate(Profile)
        }
    )
}
```

> **베스트 프랙티스**: 화면 컴포저블에는 `navController`를 직접 전달하지 마세요. 대신 `onNavigate`, `onBack` 같은 **콜백 람다**를 전달하면 테스트와 미리보기가 쉬워집니다.

---

## 7. 백 스택 관리: popBackStack(), popUpTo, launchSingleTop

**백 스택(back stack)** 은 사용자가 방문한 화면의 기록입니다. Navigation은 자동으로 백 스택을 관리하지만, 특수한 경우 직접 제어해야 할 때가 있습니다.

### popBackStack() — 뒤로 가기

```kotlin
// 현재 화면을 백 스택에서 제거하고 이전 화면으로 돌아감
navController.popBackStack()

// 특정 경로까지 백 스택을 되감기
navController.popBackStack<Home>(inclusive = false)
// inclusive = false: Home 화면은 유지
// inclusive = true: Home 화면도 제거
```

### popUpTo — 이동하면서 백 스택 정리

로그인 후 홈으로 이동할 때, 뒤로 가면 로그인 화면이 다시 나오면 안 됩니다. `popUpTo`로 이전 화면들을 정리할 수 있습니다.

```kotlin
// 로그인 성공 후 홈으로 이동 — 로그인 화면을 백 스택에서 제거
navController.navigate(Home) {
    popUpTo<Login> {
        inclusive = true  // Login 화면도 백 스택에서 제거
    }
}
```

### launchSingleTop — 중복 화면 방지

같은 화면을 여러 번 쌓이지 않도록 합니다. 예를 들어 하단 탭에서 같은 탭을 반복 클릭할 때 유용합니다.

```kotlin
// 같은 화면이 이미 스택 최상단에 있으면 새로 생성하지 않음
navController.navigate(Home) {
    launchSingleTop = true
}
```

### 하단 내비게이션에서 자주 쓰는 패턴

```kotlin
fun navigateToTab(navController: NavController, route: Any) {
    navController.navigate(route) {
        // 시작 화면까지의 백 스택 정리 (시작 화면은 유지)
        popUpTo(navController.graph.findStartDestination().id) {
            saveState = true  // 이전 탭의 상태 저장
        }
        launchSingleTop = true     // 같은 탭 중복 방지
        restoreState = true        // 저장된 탭 상태 복원
    }
}
```

> **정리**: 백 스택 관리에서 가장 흔한 패턴은 (1) 로그인 → 홈 이동 시 `popUpTo + inclusive`, (2) 하단 탭 전환 시 `popUpTo + saveState + restoreState + launchSingleTop`입니다.

---

> **다음 문서**: [02. 화면 전환과 인수 전달](02-screen-transitions-and-arguments.md)에서는 화면 간 데이터 전달, 전환 애니메이션, 결과 반환 등 더 실용적인 패턴을 학습합니다.
