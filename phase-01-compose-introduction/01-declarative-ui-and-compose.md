# 선언형 UI와 Compose 소개

> **"무엇을 보여줄지 선언하라. 어떻게 만들지는 프레임워크에 맡겨라."**
>
> Jetpack Compose는 Android UI 개발의 패러다임을 완전히 바꿉니다.
> 이 문서에서는 명령형 UI와 선언형 UI의 차이를 이해하고, Compose가 왜 더 나은 선택인지 알아봅니다.

---

## 목차

1. [명령형 UI vs 선언형 UI](#1-명령형-ui-vs-선언형-ui)
2. [비유로 이해하기: 레스토랑 주문](#2-비유로-이해하기-레스토랑-주문)
3. [XML View vs Compose 코드 비교](#3-xml-view-vs-compose-코드-비교)
4. [Compose를 사용해야 하는 이유](#4-compose를-사용해야-하는-이유)
5. [Android UI 개발 히스토리](#5-android-ui-개발-히스토리)
6. [정리](#6-정리)

---

## 1. 명령형 UI vs 선언형 UI

Android UI를 만드는 방식은 크게 두 가지 패러다임으로 나뉩니다.

### 명령형(Imperative) UI — 기존 XML + View 방식

명령형 UI에서는 **UI를 어떻게 만들고 변경할지** 단계별로 지시합니다.

```kotlin [compose-playground]
// 명령형 UI — XML View 방식
// 1. XML에서 뷰를 찾아온다
val textView = findViewById<TextView>(R.id.myTextView)
// 2. 텍스트를 설정한다
textView.text = "안녕하세요"
// 3. 색상을 변경한다
textView.setTextColor(Color.RED)
// 4. 클릭 리스너를 설정한다
textView.setOnClickListener {
    textView.text = "클릭됨!"
}
```

> **핵심**: 개발자가 UI 요소를 직접 찾아서(find), 하나하나 변경(mutate)합니다.

### 선언형(Declarative) UI — Compose 방식

선언형 UI에서는 **UI가 어떤 상태일 때 어떻게 보여야 하는지** 선언합니다.

```kotlin [compose-playground]
// 선언형 UI — Compose 방식
@Composable
fun MyScreen() {
    var text by remember { mutableStateOf("안녕하세요") }

    Text(
        text = text,
        color = Color.Red,
        modifier = Modifier.clickable {
            text = "클릭됨!"  // 상태만 변경하면 UI가 자동 업데이트!
        }
    )
}
```

> **핵심**: 개발자는 **상태(State)만 변경**하면, 프레임워크가 알아서 UI를 다시 그립니다.

### 두 방식의 핵심 차이

```
┌─────────────────────────────────────────────────────────┐
│              명령형 UI (Imperative)                       │
│                                                         │
│  개발자 ──→ "TextView를 찾아라"                           │
│         ──→ "텍스트를 바꿔라"                              │
│         ──→ "색상을 바꿔라"                                │
│         ──→ "리스너를 붙여라"                              │
│                                                         │
│  ⚠ 개발자가 모든 변경을 직접 관리                           │
├─────────────────────────────────────────────────────────┤
│              선언형 UI (Declarative)                      │
│                                                         │
│  개발자 ──→ "상태가 A이면 이렇게 보여줘"                    │
│         ──→ "상태가 B이면 저렇게 보여줘"                    │
│                                                         │
│  ✓ 상태 변경 → 프레임워크가 자동으로 UI 업데이트             │
└─────────────────────────────────────────────────────────┘
```

| 비교 항목 | 명령형 UI (XML View) | 선언형 UI (Compose) |
|-----------|---------------------|---------------------|
| 관심사 | **어떻게** 만들지 (How) | **무엇을** 보여줄지 (What) |
| UI 업데이트 | 개발자가 직접 뷰를 찾아서 변경 | 상태 변경 시 자동 반영 |
| 뷰 참조 | `findViewById`, `ViewBinding` | 불필요 (참조 없음) |
| UI 정의 | XML 파일 + Kotlin/Java 코드 | Kotlin 코드 하나로 통합 |
| 상태 동기화 | 수동 (버그 발생 가능) | 자동 (프레임워크가 보장) |

---

## 2. 비유로 이해하기: 레스토랑 주문

### 명령형 = 요리사에게 레시피를 지시하는 것

```
손님(개발자): "냄비를 가져와. 물을 넣어. 불을 켜.
              면을 넣어. 5분 끓여. 스프를 넣어.
              그릇에 담아. 파를 올려."

→ 모든 과정을 하나하나 지시해야 합니다.
→ 순서를 실수하면 결과가 달라집니다.
→ 재료가 바뀌면? 전체 레시피를 다시 작성해야 합니다.
```

### 선언형 = 메뉴판에서 주문하는 것

```
손님(개발자): "라면 하나 주세요. 계란 추가요."

→ 무엇을 원하는지만 말합니다.
→ 어떻게 만드는지는 주방(프레임워크)이 알아서 처리합니다.
→ 재료가 바뀌면? "계란 빼고 치즈 추가요." — 주문만 바꾸면 됩니다.
```

```
┌──────────────────────────────────────────────────────────┐
│                    레스토랑 비유                           │
│                                                          │
│  명령형                         선언형                     │
│  ┌──────────┐                 ┌──────────┐               │
│  │ 손님이    │                 │ 손님이    │               │
│  │ 레시피를  │                 │ 메뉴에서  │               │
│  │ 하나하나  │                 │ 주문만    │               │
│  │ 지시     │                 │ 하면 됨   │               │
│  └────┬─────┘                 └────┬─────┘               │
│       │                            │                     │
│       ▼                            ▼                     │
│  요리사가 시키는                 주방이 알아서              │
│  대로만 함                      최적의 방법으로 조리        │
└──────────────────────────────────────────────────────────┘
```

> 선언형 UI에서 개발자는 "이런 화면을 원해"라고 선언하고,
> Compose 프레임워크가 최적의 방법으로 화면을 그립니다.

---

## 3. XML View vs Compose 코드 비교

가장 기본적인 예제인 **카운터 앱**을 두 방식으로 비교해 봅시다.

### XML View 방식 (명령형)

**1단계: XML 레이아웃 파일 작성 (`activity_main.xml`)**

```xml
<?xml version="1.0" encoding="utf-8"?>
<LinearLayout
    xmlns:android="http://schemas.android.com/apk/res/android"
    android:layout_width="match_parent"
    android:layout_height="match_parent"
    android:gravity="center"
    android:orientation="vertical">

    <TextView
        android:id="@+id/countText"
        android:layout_width="wrap_content"
        android:layout_height="wrap_content"
        android:text="0"
        android:textSize="48sp" />

    <Button
        android:id="@+id/incrementButton"
        android:layout_width="wrap_content"
        android:layout_height="wrap_content"
        android:text="증가" />

</LinearLayout>
```

**2단계: Activity에서 뷰를 연결하고 로직 작성 (`MainActivity.kt`)**

```kotlin [compose-playground]
class MainActivity : AppCompatActivity() {
    private var count = 0

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_main)

        // 1. 뷰를 찾는다
        val countText = findViewById<TextView>(R.id.countText)
        val incrementButton = findViewById<Button>(R.id.incrementButton)

        // 2. 클릭 리스너를 설정한다
        incrementButton.setOnClickListener {
            count++                          // 3. 상태를 변경한다
            countText.text = count.toString() // 4. UI를 직접 업데이트한다
        }
    }
}
```

> **문제점**: XML에서 정의한 UI와 Kotlin에서 작성한 로직이 **분리**되어 있어,
> 두 파일을 왔다 갔다 하며 작업해야 합니다. 뷰 ID가 바뀌면 런타임 크래시가 발생할 수도 있습니다.

### Compose 방식 (선언형)

**단 하나의 Kotlin 파일로 완성 (`MainActivity.kt`)**

```kotlin [compose-playground]
class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContent {
            CounterScreen()
        }
    }
}

@Composable
fun CounterScreen() {
    // 상태 선언 — Compose가 이 값의 변경을 추적합니다
    var count by remember { mutableStateOf(0) }

    Column(
        modifier = Modifier.fillMaxSize(),
        verticalArrangement = Arrangement.Center,
        horizontalAlignment = Alignment.CenterHorizontally
    ) {
        Text(
            text = "$count",
            fontSize = 48.sp
        )
        Button(onClick = { count++ }) {  // 상태만 변경!
            Text("증가")
        }
    }
}
```

> **핵심 차이**: `count++`만 실행하면 Compose가 알아서 Text를 다시 그립니다.
> `findViewById`도 없고, `setText()`를 직접 호출할 필요도 없습니다.

### 나란히 비교 요약

| 항목 | XML View | Compose |
|------|----------|---------|
| 파일 수 | 2개 (XML + Kotlin) | 1개 (Kotlin만) |
| 뷰 참조 | `findViewById` / ViewBinding | 불필요 |
| UI 업데이트 | `textView.text = ...` 직접 호출 | 상태 변경 시 자동 |
| 코드 라인 수 | ~35줄 | ~20줄 |
| 타입 안전성 | ID 불일치 시 런타임 크래시 | 컴파일 타임 안전 |
| 미리보기 | XML Preview만 가능 | `@Preview`로 다양한 상태 확인 |

---

## 4. Compose를 사용해야 하는 이유

Google이 Compose를 **Android UI 개발의 공식 권장 방식**으로 선언한 데에는 분명한 이유가 있습니다.

### 코드 감소 (Less Code)

```
┌─────────────────────────────────────────────┐
│          같은 화면을 만드는 코드량 비교         │
│                                             │
│  XML View    ████████████████████  100%     │
│  Compose     ██████████           ~50%      │
│                                             │
│  → XML 파일 불필요                            │
│  → findViewById 불필요                       │
│  → 보일러플레이트 대폭 감소                    │
└─────────────────────────────────────────────┘
```

- XML 레이아웃 파일이 필요 없습니다
- `findViewById`, `ViewBinding`, `DataBinding` 설정이 사라집니다
- UI와 로직이 한 곳에 있어 컨텍스트 스위칭이 줄어듭니다

### 직관적 (Intuitive)

```kotlin [compose-playground]
// UI가 곧 코드, 코드가 곧 UI
// "이 상태일 때 이렇게 보인다"를 자연스럽게 읽을 수 있습니다
@Composable
fun UserProfile(user: User) {
    if (user.isLoggedIn) {
        WelcomeMessage(user.name)  // 로그인 상태 → 환영 메시지
    } else {
        LoginButton()               // 비로그인 상태 → 로그인 버튼
    }
}
```

- **Kotlin의 조건문, 반복문**을 그대로 사용합니다
- 별도의 XML 문법을 배울 필요가 없습니다
- 코드를 읽으면 화면이 어떻게 보일지 바로 상상할 수 있습니다

### 강력함 (Powerful)

- **애니메이션**: `animate*AsState` 한 줄로 부드러운 전환
- **테마**: `MaterialTheme`으로 앱 전체 디자인 일괄 변경
- **접근성**: 기본 제공되는 시맨틱(Semantics) 시스템
- **호환성**: Android API 23(Marshmallow)부터 지원

### 빠른 개발 (Accelerated Development)

- **실시간 미리보기**: `@Preview`로 코드 수정 즉시 확인
- **핫 리로드**: Live Edit로 앱 재시작 없이 변경 사항 반영
- **재사용**: Composable 함수를 레고 블록처럼 조합

```
┌────────────────────────────────────────────────────────┐
│              Compose의 4가지 장점                        │
│                                                        │
│    ┌──────────┐  ┌──────────┐                          │
│    │ 코드 감소 │  │  직관적  │                            │
│    │ -50% LOC │  │ Kotlin   │                           │
│    │ XML 제거  │  │ 만으로   │                            │
│    └──────────┘  └──────────┘                          │
│                                                        │
│    ┌──────────┐  ┌──────────┐                          │
│    │  강력함   │  │ 빠른개발 │                            │
│    │ 애니메이션│  │ Preview  │                            │
│    │ 테마/접근 │  │ Live Edit│                            │
│    └──────────┘  └──────────┘                          │
└────────────────────────────────────────────────────────┘
```

---

## 5. Android UI 개발 히스토리

Android UI 개발은 세 단계의 진화를 거쳤습니다.

```
2008                    2015                    2021~현재
  │                       │                       │
  ▼                       ▼                       ▼
┌──────────────┐   ┌──────────────┐   ┌──────────────────┐
│   XML View   │   │ DataBinding  │   │ Jetpack Compose  │
│              │   │              │   │                  │
│ • XML로 UI   │──→│ • XML + 바인딩│──→│ • Kotlin만으로   │
│   레이아웃    │   │   표현식     │   │   UI 전체 구성   │
│ • findViewById│   │ • 양방향 바인딩│   │ • 선언형 패러다임│
│ • 수동 업데이트│   │ • LiveData   │   │ • 자동 UI 동기화 │
│              │   │   연동       │   │ • @Preview       │
└──────────────┘   └──────────────┘   └──────────────────┘
    완전 수동           반자동              완전 자동
```

### 1세대: XML View (2008~)

```kotlin [compose-playground]
// XML에서 뷰를 찾고 → 직접 값을 설정
val textView = findViewById<TextView>(R.id.myText)
textView.text = data.name
```

- 장점: 직관적인 XML 레이아웃 편집기
- 단점: 보일러플레이트 코드, `NullPointerException`, ID 불일치 문제

### 2세대: DataBinding / ViewBinding (2015~)

```xml
<!-- XML에서 바인딩 표현식 사용 -->
<TextView
    android:text="@{viewModel.userName}" />
```

```kotlin [compose-playground]
// ViewBinding으로 타입 안전한 뷰 참조
val binding = ActivityMainBinding.inflate(layoutInflater)
binding.myText.text = data.name
```

- 장점: `findViewById` 제거, 타입 안전성
- 단점: 여전히 XML과 Kotlin 두 파일, 빌드 시간 증가

### 3세대: Jetpack Compose (2021~)

```kotlin [compose-playground]
// Kotlin 코드 하나로 UI + 로직 통합
@Composable
fun UserName(name: String) {
    Text(text = name, style = MaterialTheme.typography.headlineMedium)
}
```

- 장점: XML 파일 불필요, 선언형 패러다임, 강력한 미리보기, 빠른 개발
- 현재: Google의 **공식 권장** Android UI 프레임워크

> **참고**: 기존 XML View 프로젝트도 Compose와 **점진적으로 통합**할 수 있습니다.
> `ComposeView`를 사용하면 XML 레이아웃 안에 Compose UI를 삽입할 수 있고,
> `AndroidView`를 사용하면 Compose 안에서 기존 View를 사용할 수 있습니다.

---

## 6. 정리

| 핵심 개념 | 설명 |
|-----------|------|
| 명령형 UI | UI를 **어떻게** 만들고 변경할지 단계별로 지시하는 방식 |
| 선언형 UI | UI가 **무엇을** 보여줄지 상태에 따라 선언하는 방식 |
| Compose | Android의 공식 선언형 UI 프레임워크 |
| 상태(State) | UI를 결정하는 데이터. 상태가 변하면 UI가 자동 업데이트 |
| 리컴포지션 | 상태가 변경되었을 때 Compose가 UI를 다시 그리는 과정 |

### 다음 단계

다음 문서에서는 **개발 환경을 설정**하고, 실제로 첫 번째 Compose 프로젝트를 만들어 봅니다.

> [다음: 02. 개발 환경 설정 →](02-environment-setup.md)
