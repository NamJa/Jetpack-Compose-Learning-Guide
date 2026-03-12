# Navigation3 기초

> **"앱은 하나의 화면이 아니라, 여러 화면이 유기적으로 연결된 흐름이다."**
>
> Navigation3는 Jetpack Compose 전용으로 새롭게 설계된 차세대 내비게이션 라이브러리입니다. 기존 Navigation Compose(2.x)의 명령형 `NavController` 대신, **개발자가 직접 백 스택 상태를 소유하고 관리**하는 선언적 접근 방식을 채택합니다. 이 문서에서는 Navigation3의 핵심 개념부터 실제 화면 전환까지 단계별로 학습합니다.

---

## 목차

1. [Navigation3 종속성 추가](#1-navigation3-종속성-추가)
2. [NavKey: 경로를 타입 안전하게 정의](#2-navkey-경로를-타입-안전하게-정의)
3. [백 스택: rememberNavBackStack](#3-백-스택-remembernavbackstack)
4. [NavDisplay와 entryProvider](#4-navdisplay와-entryprovider)
5. [entry\<Route\> { } 블록](#5-entryroute--블록)
6. [화면 이동: backStack.add()](#6-화면-이동-backstackadd)
7. [뒤로 가기와 백 스택 관리](#7-뒤로-가기와-백-스택-관리)

---

## 1. Navigation3 종속성 추가

Navigation3를 사용하려면 프로젝트의 `build.gradle.kts`에 종속성을 추가해야 합니다.

**Navigation3**는 기존 Navigation Compose(2.x)와 완전히 별개의 라이브러리입니다. `NavDisplay`, `NavKey`, `entryProvider` 등의 새로운 API를 제공하며, Type-Safe Navigation을 위해 Kotlin Serialization도 함께 추가합니다.

```kotlin [compose-playground]
// build.gradle.kts (Module: app)
plugins {
    // Kotlin Serialization 플러그인 추가 (Type-Safe 경로 정의에 필요)
    kotlin("plugin.serialization") version "2.3.10"
}

dependencies {
    // Navigation3 런타임 + UI
    implementation("androidx.navigation3:navigation3-runtime:1.0.1")
    implementation("androidx.navigation3:navigation3-ui:1.0.1")

    // ViewModel 스코핑 (NavEntry 단위로 ViewModel 생명주기 관리)
    implementation("androidx.lifecycle:lifecycle-viewmodel-navigation3:2.10.0")

    // Kotlin Serialization (Type-Safe 경로 정의에 필요)
    implementation("org.jetbrains.kotlinx:kotlinx-serialization-json:1.8.0")
}
```

> **Navigation 2.x와의 차이**: 기존에는 `navigation-compose` 하나로 충분했지만, Navigation3에서는 `navigation3-runtime`(핵심)과 `navigation3-ui`(NavDisplay 등 UI 컴포넌트)로 분리됩니다. ViewModel 연동이 필요하면 `lifecycle-viewmodel-navigation3`도 추가합니다.

---

## 2. NavKey: 경로를 타입 안전하게 정의

Navigation3에서 경로(Route)를 정의하려면 **`NavKey` 인터페이스를 구현**하고 `@Serializable`을 붙입니다. 이것이 Navigation 2.x와의 가장 큰 차이 중 하나입니다.

**왜 NavKey인가?**
- `NavKey`를 구현하면 Navigation3가 백 스택을 직렬화/역직렬화하여 **프로세스 종료 후에도 상태를 복원**할 수 있습니다
- 타입 안전한 인수 전달 지원
- IDE 자동완성과 컴파일 타임 검증

```kotlin [kotlin-playground]
import kotlinx.serialization.Serializable
import androidx.navigation3.runtime.NavKey

//sampleStart
// 인수가 없는 화면은 object로 정의
@Serializable
data object Home : NavKey

@Serializable
data object Profile : NavKey

// 인수가 있는 화면은 data class로 정의
@Serializable
data class Detail(val itemId: Int) : NavKey

// 여러 인수 + 선택적 인수
@Serializable
data class Search(
    val query: String,
    val category: String = "all",
    val page: Int = 1
) : NavKey
//sampleEnd

fun main() {
    println(Detail(itemId = 42))
}
```

> **Navigation 2.x와의 차이**: 2.x에서는 `@Serializable`만 붙이면 됐지만, Navigation3에서는 반드시 `: NavKey`도 구현해야 합니다. 이를 통해 Navigation3가 백 스택 상태를 자동으로 저장/복원합니다.

---

## 3. 백 스택: rememberNavBackStack

Navigation3에서 가장 큰 패러다임 변화는 **백 스택을 개발자가 직접 소유한다**는 것입니다. 기존의 `NavController`가 내부적으로 관리하던 백 스택이 이제 단순한 `SnapshotStateList`로 노출됩니다.

**`rememberNavBackStack`이 하는 일:**
- 시작 화면을 포함한 백 스택 생성
- 구성 변경(화면 회전) 시 상태 유지
- 프로세스 종료 후에도 백 스택 복원 (NavKey가 `@Serializable`이므로)

```kotlin [compose-playground]
import androidx.navigation3.runtime.rememberNavBackStack

@Composable
fun MyApp() {
    // 백 스택 생성 — Home이 시작 화면
    val backStack = rememberNavBackStack(Home)

    // backStack은 SnapshotStateList<NavKey>
    // 화면 이동: backStack.add(destination)
    // 뒤로 가기: backStack.removeLastOrNull()

    MyNavDisplay(backStack = backStack)
}
```

> **핵심 포인트**: `rememberNavBackStack()`은 **컴포저블 계층의 최상위**에서 호출하세요. 개별 화면 안에서 생성하면 화면 전환 시 백 스택이 사라집니다.
>
> **비유**: Navigation 2.x에서 `NavController`가 "자동 변속기"였다면, Navigation3의 `backStack`은 "수동 변속기"입니다. 개발자가 직접 기어(화면)를 넣고 빼지만, 그만큼 더 정밀하게 제어할 수 있습니다.

---

## 4. NavDisplay와 entryProvider

`NavDisplay`는 **백 스택의 현재 상태를 관찰하고 적절한 화면을 렌더링**하는 컴포저블입니다. Navigation 2.x의 `NavHost`를 대체합니다.

**NavDisplay의 핵심 파라미터:**
- `backStack`: 화면 이동 상태를 담고 있는 리스트
- `onBack`: 시스템 뒤로 가기를 처리하는 콜백
- `entryDecorators`: ViewModel 스코핑, 상태 저장 등의 래퍼
- `entryProvider`: 각 NavKey를 화면(NavEntry)으로 변환하는 함수

```kotlin [compose-playground]
import androidx.navigation3.ui.NavDisplay
import androidx.navigation3.runtime.entryProvider
import androidx.navigation3.runtime.NavKey
import androidx.navigation3.runtime.rememberNavBackStack
import androidx.navigation3.runtime.rememberSaveableStateHolderNavEntryDecorator
import androidx.lifecycle.viewmodel.navigation3.rememberViewModelStoreNavEntryDecorator

@Serializable data object Home : NavKey
@Serializable data class Detail(val itemId: Int) : NavKey

@Composable
fun MyApp() {
    val backStack = rememberNavBackStack(Home)

    NavDisplay(
        backStack = backStack,
        onBack = { backStack.removeLastOrNull() },
        entryDecorators = listOf(
            // 화면 상태 저장 (구성 변경 시 유지)
            rememberSaveableStateHolderNavEntryDecorator(),
            // ViewModel을 NavEntry 단위로 스코핑
            rememberViewModelStoreNavEntryDecorator()
        ),
        entryProvider = entryProvider {
            entry<Home> {
                HomeScreen(
                    onNavigateToDetail = { itemId ->
                        backStack.add(Detail(itemId = itemId))
                    }
                )
            }
            entry<Detail> { key ->
                // key가 Detail 타입으로 직접 전달됨!
                DetailScreen(
                    itemId = key.itemId,
                    onBack = { backStack.removeLastOrNull() }
                )
            }
        }
    )
}
```

> **비유**: `NavDisplay`는 "극장"이고, 각 `entry`는 "무대 위에 올릴 수 있는 연극"입니다. `backStack`의 맨 위에 있는 NavKey가 지금 공연 중인 연극을 결정합니다.
>
> **Navigation 2.x와의 차이**: `NavHost`는 내부에 `NavGraphBuilder` DSL로 화면을 등록했지만, `NavDisplay`는 `entryProvider`로 NavKey → NavEntry 변환 로직을 정의합니다. 가장 큰 차이는 **인수 접근 방식**입니다 — `backStackEntry.toRoute<T>()`가 아니라 `entry<T> { key -> }` 람다에서 `key`를 직접 사용합니다.

---

## 5. entry\<Route\> { } 블록

`entry<Route> { }` 블록은 특정 NavKey에 대응하는 **화면(NavEntry)을 등록**하는 DSL입니다.

```kotlin [compose-playground]
import androidx.navigation3.runtime.entryProvider

val myEntryProvider = entryProvider {
    // 인수 없는 경로 — object NavKey
    entry<Home> {
        HomeScreen(
            onItemClick = { itemId ->
                backStack.add(Detail(itemId = itemId))
            }
        )
    }

    // 인수 있는 경로 — data class NavKey
    // 람다 파라미터 key가 Detail 타입으로 전달됨
    entry<Detail> { key ->
        DetailScreen(itemId = key.itemId)
    }

    // 메타데이터가 있는 항목 (예: 전환 애니메이션)
    entry<Profile>(
        metadata = mapOf("customKey" to "customValue")
    ) {
        ProfileScreen()
    }
}
```

**Navigation 2.x의 `composable<Route>` 블록과의 비교:**

| Navigation 2.x | Navigation3 |
|----------------|-------------|
| `composable<Detail> { backStackEntry -> }` | `entry<Detail> { key -> }` |
| `backStackEntry.toRoute<Detail>()` | `key`를 직접 사용 (이미 `Detail` 타입) |
| `composable(Detail::class) { }` (KClass) | `entry<Detail> { }` (제네릭만 사용) |

> **핵심 차이**: Navigation 2.x에서는 `backStackEntry.toRoute<T>()`로 역직렬화가 필요했지만, Navigation3에서는 `entry<T> { key -> }` 람다에 이미 타입 안전한 key 객체가 전달됩니다. 더 간결하고 직관적입니다.

---

## 6. 화면 이동: backStack.add()

화면을 이동할 때는 **`backStack.add()`에 NavKey 객체를 전달**합니다. Navigation 2.x의 `navController.navigate()`를 대체합니다.

```kotlin [compose-playground]
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

// NavDisplay 내부에서 연결
entry<Home> {
    HomeScreen(
        onItemClick = { itemId ->
            // NavKey 객체를 백 스택에 추가
            backStack.add(Detail(itemId = itemId))
        },
        onProfileClick = {
            backStack.add(Profile)
        }
    )
}
```

**Navigation 2.x와의 비교:**

```kotlin [compose-playground]
// Navigation 2.x
navController.navigate(Detail(itemId = 42))

// Navigation3
backStack.add(Detail(itemId = 42))
```

> **베스트 프랙티스**: 화면 컴포저블에는 `backStack`을 직접 전달하지 마세요. 대신 `onNavigate`, `onBack` 같은 **콜백 람다**를 전달하면 테스트와 미리보기가 쉬워집니다. 이 원칙은 Navigation 2.x와 동일합니다.

---

## 7. 뒤로 가기와 백 스택 관리

Navigation3에서는 백 스택이 단순한 리스트이므로, **리스트 조작으로 백 스택을 제어**합니다.

### 뒤로 가기

```kotlin [compose-playground]
// 현재 화면을 백 스택에서 제거하고 이전 화면으로 돌아감
backStack.removeLastOrNull()
```

### 시스템 뒤로 가기 처리

`NavDisplay`의 `onBack` 파라미터가 시스템 뒤로 가기를 처리합니다.

```kotlin [compose-playground]
NavDisplay(
    backStack = backStack,
    // 시스템 뒤로 가기 시 호출
    onBack = { backStack.removeLastOrNull() },
    entryProvider = entryProvider { /* ... */ }
)
```

### 특정 화면까지 백 스택 되감기

Navigation 2.x의 `popUpTo`에 해당하는 패턴입니다. 리스트 조작으로 직접 구현합니다.

```kotlin [compose-playground]
// 로그인 성공 후 홈으로 이동 — 로그인 관련 화면 모두 제거
fun navigateToHomeAfterLogin(backStack: SnapshotStateList<NavKey>) {
    // Login 화면까지(포함) 모든 항목 제거
    while (backStack.lastOrNull() !is Home && backStack.size > 1) {
        backStack.removeLastOrNull()
    }
    // Home이 없으면 추가
    if (backStack.lastOrNull() !is Home) {
        backStack.add(Home)
    }
}
```

### 중복 화면 방지

Navigation 2.x의 `launchSingleTop`에 해당하는 패턴입니다.

```kotlin [compose-playground]
// 같은 화면이 이미 스택 최상단에 있으면 새로 생성하지 않음
fun navigateIfNotAlreadyOnTop(backStack: SnapshotStateList<NavKey>, destination: NavKey) {
    if (backStack.lastOrNull() != destination) {
        backStack.add(destination)
    }
}
```

### 하단 내비게이션에서 자주 쓰는 패턴

하단 탭 전환 시에는 별도의 백 스택을 탭마다 관리하는 것이 일반적입니다. Navigation3에서는 `rememberNavBackStack`을 탭별로 생성하고, 현재 활성 탭의 백 스택만 `NavDisplay`에 전달합니다.

```kotlin [compose-playground]
@Composable
fun MainApp() {
    var currentTab by remember { mutableStateOf(Tab.Home) }

    // 탭별 독립 백 스택
    val homeBackStack = rememberNavBackStack(HomeRoute)
    val searchBackStack = rememberNavBackStack(SearchRoute)
    val profileBackStack = rememberNavBackStack(ProfileRoute)

    // 현재 탭에 맞는 백 스택 선택
    val activeBackStack = when (currentTab) {
        Tab.Home -> homeBackStack
        Tab.Search -> searchBackStack
        Tab.Profile -> profileBackStack
    }

    Scaffold(
        bottomBar = {
            NavigationBar {
                Tab.entries.forEach { tab ->
                    NavigationBarItem(
                        selected = currentTab == tab,
                        onClick = { currentTab = tab },
                        icon = { Icon(tab.icon, contentDescription = null) },
                        label = { Text(tab.label) }
                    )
                }
            }
        }
    ) { padding ->
        NavDisplay(
            backStack = activeBackStack,
            onBack = { activeBackStack.removeLastOrNull() },
            entryDecorators = listOf(
                rememberSaveableStateHolderNavEntryDecorator(),
                rememberViewModelStoreNavEntryDecorator()
            ),
            modifier = Modifier.padding(padding),
            entryProvider = entryProvider {
                entry<HomeRoute> { HomeScreen(/* ... */) }
                entry<SearchRoute> { SearchScreen(/* ... */) }
                entry<ProfileRoute> { ProfileScreen(/* ... */) }
                // 하위 화면들...
            }
        )
    }
}
```

> **정리**: Navigation3에서 백 스택 관리는 **리스트 조작**입니다. `add()`로 이동하고, `removeLastOrNull()`로 뒤로 가고, `while` 루프로 특정 지점까지 되감습니다. Navigation 2.x의 `popUpTo`, `launchSingleTop` 같은 옵션은 직접 로직으로 구현하지만, 그만큼 더 투명하고 디버깅하기 쉽습니다.

---

> **다음 문서**: [02. 화면 전환과 인수 전달](02-screen-transitions-and-arguments.md)에서는 인수 전달 패턴, ViewModel 연동, 화면 전환 애니메이션, 다이얼로그 등 더 실용적인 패턴을 학습합니다.
