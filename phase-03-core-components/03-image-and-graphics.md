# Image와 그래픽 완전 가이드

> **"이미지는 천 마디 말보다 강합니다. 올바르게 로드하고, 적절히 표시하고, 효율적으로 관리하는 것이 핵심입니다."**

---

## 목차

1. [Image 컴포넌트 기초](#1-image-컴포넌트-기초)
2. [painterResource로 리소스 이미지 로드](#2-painterresource로-리소스-이미지-로드)
3. [ContentScale 옵션 완전 정리](#3-contentscale-옵션-완전-정리)
4. [Modifier.clip으로 이미지 자르기](#4-modifierclip으로-이미지-자르기)
5. [Icon 컴포넌트와 이미지의 차이](#5-icon-컴포넌트와-이미지의-차이)
6. [AsyncImage로 네트워크 이미지 로드 (Coil)](#6-asyncimage로-네트워크-이미지-로드-coil)
7. [ImageBitmap vs ImageVector](#7-imagebitmap-vs-imagevector)
8. [Canvas와 DrawScope로 커스텀 그래픽 그리기](#8-canvas와-drawscope로-커스텀-그래픽-그리기)
9. [XML View와의 비교](#9-xml-view와의-비교)
10. [자주 하는 실수와 주의사항](#10-자주-하는-실수와-주의사항)

---

## 1. Image 컴포넌트 기초

`Image`는 Jetpack Compose에서 이미지를 화면에 표시하는 컴포넌트입니다. Android XML의 `ImageView`에 해당합니다.

### 기본 사용법

```kotlin
import androidx.compose.foundation.Image
import androidx.compose.ui.res.painterResource

@Composable
fun SimpleImageExample() {
    Image(
        painter = painterResource(id = R.drawable.sample_image),
        contentDescription = "샘플 이미지"
    )
}
```

### Image의 주요 매개변수

| 매개변수 | 타입 | 설명 | 기본값 |
|----------|------|------|--------|
| `painter` | `Painter` | 이미지 소스 (Painter 기반) | (세 가지 중 하나 필수) |
| `imageVector` | `ImageVector` | 벡터 이미지 소스 | (세 가지 중 하나 필수) |
| `bitmap` | `ImageBitmap` | 비트맵 이미지 소스 | (세 가지 중 하나 필수) |
| `contentDescription` | `String?` | 접근성 설명 (TalkBack) | (필수, null 허용) |
| `modifier` | `Modifier` | 크기, 패딩, 클리핑 등 | `Modifier` |
| `alignment` | `Alignment` | 이미지 정렬 위치 | `Alignment.Center` |
| `contentScale` | `ContentScale` | 이미지 크기 조절 방식 | `ContentScale.Fit` |
| `alpha` | `Float` | 투명도 (0.0 ~ 1.0) | `1.0f` |
| `colorFilter` | `ColorFilter?` | 색상 필터 (틴트 등) | `null` |

---

## 2. painterResource로 리소스 이미지 로드

`painterResource`는 `res/drawable` 폴더에 있는 이미지 리소스를 로드합니다. PNG, JPG, WebP, VectorDrawable(XML) 등을 모두 지원합니다.

### 다양한 리소스 이미지 로드

```kotlin
@Composable
fun ResourceImageExamples() {
    Column(
        modifier = Modifier.padding(16.dp),
        verticalArrangement = Arrangement.spacedBy(16.dp)
    ) {
        // PNG/JPG 이미지
        Image(
            painter = painterResource(id = R.drawable.photo),
            contentDescription = "사진",
            modifier = Modifier
                .fillMaxWidth()
                .height(200.dp),
            contentScale = ContentScale.Crop
        )

        // Vector Drawable (XML 벡터)
        Image(
            painter = painterResource(id = R.drawable.ic_logo),
            contentDescription = "로고",
            modifier = Modifier.size(48.dp)
        )
    }
}
```

### 크기 지정

이미지에 크기를 지정하지 않으면 원본 크기 그대로 표시됩니다. `Modifier`로 적절한 크기를 지정하세요.

```kotlin
@Composable
fun SizedImageExample() {
    Image(
        painter = painterResource(id = R.drawable.sample),
        contentDescription = "크기 지정 이미지",
        modifier = Modifier
            .width(200.dp)
            .height(150.dp),
        contentScale = ContentScale.Crop
    )
}
```

---

## 3. ContentScale 옵션 완전 정리

`ContentScale`은 이미지가 주어진 영역에 어떻게 맞춰지는지를 결정합니다. XML의 `android:scaleType`에 해당합니다.

### 모든 ContentScale 옵션

| ContentScale | 설명 | XML 대응 (`scaleType`) |
|-------------|------|----------------------|
| `ContentScale.Fit` | 비율 유지, 영역 안에 맞춤 (여백 가능) | `fitCenter` |
| `ContentScale.Crop` | 비율 유지, 영역을 꽉 채움 (잘릴 수 있음) | `centerCrop` |
| `ContentScale.FillBounds` | 비율 무시, 영역을 꽉 채움 (찌그러질 수 있음) | `fitXY` |
| `ContentScale.FillWidth` | 비율 유지, 가로를 꽉 채움 | - |
| `ContentScale.FillHeight` | 비율 유지, 세로를 꽉 채움 | - |
| `ContentScale.Inside` | 비율 유지, 원본이 작으면 그대로, 크면 축소 | `centerInside` |
| `ContentScale.None` | 크기 조절 없이 원본 그대로 | `center` |

### 시각적 비교 예제

```kotlin
@Composable
fun ContentScaleComparison() {
    val scales = listOf(
        "Fit" to ContentScale.Fit,
        "Crop" to ContentScale.Crop,
        "FillBounds" to ContentScale.FillBounds,
        "FillWidth" to ContentScale.FillWidth,
        "FillHeight" to ContentScale.FillHeight,
        "Inside" to ContentScale.Inside,
        "None" to ContentScale.None,
    )

    LazyColumn(
        modifier = Modifier.padding(16.dp),
        verticalArrangement = Arrangement.spacedBy(16.dp)
    ) {
        items(scales) { (name, scale) ->
            Column {
                Text(
                    text = "ContentScale.$name",
                    style = MaterialTheme.typography.titleSmall,
                    fontWeight = FontWeight.Bold
                )
                Spacer(modifier = Modifier.height(4.dp))
                Image(
                    painter = painterResource(id = R.drawable.sample),
                    contentDescription = "$name 예시",
                    contentScale = scale,
                    modifier = Modifier
                        .fillMaxWidth()
                        .height(150.dp)
                        .border(1.dp, Color.Gray)
                )
            }
        }
    }
}
```

> **실무 팁**: 프로필 이미지, 배경 이미지에는 `ContentScale.Crop`을, 상세 보기에는 `ContentScale.Fit`을 주로 사용합니다.

---

## 4. Modifier.clip으로 이미지 자르기

`Modifier.clip()`을 사용하면 이미지를 다양한 모양으로 잘라낼 수 있습니다.

### 원형 이미지

```kotlin
@Composable
fun CircularImageExample() {
    Image(
        painter = painterResource(id = R.drawable.profile),
        contentDescription = "프로필 사진",
        contentScale = ContentScale.Crop,
        modifier = Modifier
            .size(100.dp)
            .clip(CircleShape) // 원형으로 자르기
    )
}
```

### 둥근 모서리 이미지

```kotlin
@Composable
fun RoundedImageExample() {
    Image(
        painter = painterResource(id = R.drawable.photo),
        contentDescription = "둥근 모서리 사진",
        contentScale = ContentScale.Crop,
        modifier = Modifier
            .size(150.dp)
            .clip(RoundedCornerShape(16.dp)) // 둥근 모서리
    )
}
```

### 다양한 Shape 활용

```kotlin
@Composable
fun VariousShapesExample() {
    Row(
        modifier = Modifier.padding(16.dp),
        horizontalArrangement = Arrangement.spacedBy(12.dp)
    ) {
        // 원형
        Image(
            painter = painterResource(id = R.drawable.sample),
            contentDescription = "원형",
            contentScale = ContentScale.Crop,
            modifier = Modifier
                .size(80.dp)
                .clip(CircleShape)
        )

        // 둥근 사각형
        Image(
            painter = painterResource(id = R.drawable.sample),
            contentDescription = "둥근 사각형",
            contentScale = ContentScale.Crop,
            modifier = Modifier
                .size(80.dp)
                .clip(RoundedCornerShape(12.dp))
        )

        // 잘린 모서리 (Cut Corner)
        Image(
            painter = painterResource(id = R.drawable.sample),
            contentDescription = "잘린 모서리",
            contentScale = ContentScale.Crop,
            modifier = Modifier
                .size(80.dp)
                .clip(CutCornerShape(12.dp))
        )
    }
}
```

### 테두리가 있는 원형 이미지

```kotlin
@Composable
fun BorderedCircularImage() {
    Image(
        painter = painterResource(id = R.drawable.profile),
        contentDescription = "프로필",
        contentScale = ContentScale.Crop,
        modifier = Modifier
            .size(100.dp)
            .clip(CircleShape)
            .border(
                width = 3.dp,
                color = MaterialTheme.colorScheme.primary,
                shape = CircleShape
            )
    )
}
```

> **주의**: `Modifier.clip()`은 반드시 `Modifier.border()` 앞에 작성하세요. Modifier 순서가 결과에 영향을 미칩니다.

---

## 5. Icon 컴포넌트와 이미지의 차이

> **2026 업데이트**: `androidx.compose.material.icons` 라이브러리(Material Icons Extended)는 **더 이상 권장되지 않습니다**. 빌드 시간이 크게 증가하는 문제가 있어, Google은 [Material Symbols](https://fonts.google.com/icons)에서 Vector Drawable XML을 다운로드하여 사용하는 것을 권장합니다. 기존 `Icons.Default.*`는 여전히 동작하지만, 새 프로젝트에서는 Material Symbols를 사용하세요.

| 항목 | Icon | Image |
|------|------|-------|
| 용도 | 단색 아이콘 표시 | 사진, 일러스트 등 풀컬러 이미지 |
| 색상 | `tint`로 단색 적용 | `colorFilter`로 색상 필터 (선택) |
| 크기 | 보통 24dp (작은 크기) | 다양한 크기 |
| 일반적인 소스 | Material Symbols XML, VectorDrawable | PNG, JPG, WebP |
| 접근성 | `contentDescription` | `contentDescription` |

```kotlin
@Composable
fun IconVsImageExample() {
    Row(
        verticalAlignment = Alignment.CenterVertically,
        horizontalArrangement = Arrangement.spacedBy(16.dp)
    ) {
        // Icon: 단색 아이콘
        Icon(
            imageVector = Icons.Default.Person,
            contentDescription = "사용자",
            tint = MaterialTheme.colorScheme.primary,
            modifier = Modifier.size(24.dp)
        )

        // Image: 풀컬러 이미지
        Image(
            painter = painterResource(id = R.drawable.profile_photo),
            contentDescription = "프로필 사진",
            modifier = Modifier
                .size(48.dp)
                .clip(CircleShape),
            contentScale = ContentScale.Crop
        )
    }
}
```

---

## 6. AsyncImage로 네트워크 이미지 로드 (Coil)

인터넷에서 이미지를 다운로드하여 표시하려면 이미지 로딩 라이브러리가 필요합니다. Compose에서는 **Coil** 라이브러리가 공식 권장됩니다.

### Coil 의존성 추가

```kotlin
// build.gradle.kts (app 모듈)
dependencies {
    implementation("io.coil-kt.coil3:coil-compose:3.1.0")
    implementation("io.coil-kt.coil3:coil-network-okhttp:3.1.0")
}
```

### 기본 AsyncImage 사용법

```kotlin
import coil3.compose.AsyncImage

@Composable
fun NetworkImageExample() {
    AsyncImage(
        model = "https://example.com/image.jpg",
        contentDescription = "네트워크 이미지",
        modifier = Modifier
            .fillMaxWidth()
            .height(200.dp),
        contentScale = ContentScale.Crop
    )
}
```

### AsyncImage의 주요 매개변수

| 매개변수 | 타입 | 설명 | 기본값 |
|----------|------|------|--------|
| `model` | `Any?` | 이미지 URL 또는 ImageRequest | (필수) |
| `contentDescription` | `String?` | 접근성 설명 | (필수) |
| `modifier` | `Modifier` | 수정자 | `Modifier` |
| `placeholder` | `Painter?` | 로딩 중 표시할 이미지 | `null` |
| `error` | `Painter?` | 로드 실패 시 표시할 이미지 | `null` |
| `fallback` | `Painter?` | model이 null일 때 표시할 이미지 | `null` |
| `contentScale` | `ContentScale` | 크기 조절 방식 | `ContentScale.Fit` |

### 로딩 상태와 에러 처리

```kotlin
@Composable
fun AsyncImageWithStates() {
    AsyncImage(
        model = "https://example.com/photo.jpg",
        contentDescription = "프로필 사진",
        modifier = Modifier
            .size(120.dp)
            .clip(CircleShape),
        contentScale = ContentScale.Crop,
        placeholder = painterResource(id = R.drawable.placeholder),
        error = painterResource(id = R.drawable.error_image)
    )
}
```

### SubcomposeAsyncImage로 커스텀 로딩 UI

```kotlin
import coil3.compose.SubcomposeAsyncImage

@Composable
fun CustomLoadingImageExample() {
    SubcomposeAsyncImage(
        model = "https://example.com/large-image.jpg",
        contentDescription = "대형 이미지",
        modifier = Modifier
            .fillMaxWidth()
            .height(250.dp),
        contentScale = ContentScale.Crop,
        loading = {
            Box(
                modifier = Modifier.fillMaxSize(),
                contentAlignment = Alignment.Center
            ) {
                CircularProgressIndicator()
            }
        },
        error = {
            Box(
                modifier = Modifier.fillMaxSize(),
                contentAlignment = Alignment.Center
            ) {
                Column(horizontalAlignment = Alignment.CenterHorizontally) {
                    Icon(
                        Icons.Default.Warning,
                        contentDescription = null,
                        tint = Color.Gray
                    )
                    Text("이미지를 불러올 수 없습니다", color = Color.Gray)
                }
            }
        }
    )
}
```

### ImageRequest로 세부 설정

```kotlin
import coil3.request.ImageRequest
import coil3.request.crossfade

@Composable
fun DetailedImageRequest() {
    val context = LocalContext.current

    AsyncImage(
        model = ImageRequest.Builder(context)
            .data("https://example.com/photo.jpg")
            .crossfade(true)               // 페이드인 애니메이션
            .crossfade(300)                // 300ms 동안 페이드인
            .build(),
        contentDescription = "사진",
        modifier = Modifier
            .fillMaxWidth()
            .height(200.dp),
        contentScale = ContentScale.Crop
    )
}
```

---

## 7. ImageBitmap vs ImageVector

Compose에서 이미지를 다루는 두 가지 주요 형식입니다.

### ImageBitmap

픽셀 기반 래스터 이미지입니다. PNG, JPG, WebP 등의 파일 형식에 해당합니다.

```kotlin
@Composable
fun ImageBitmapExample() {
    // 리소스에서 ImageBitmap 로드
    val bitmap = ImageBitmap.imageResource(id = R.drawable.photo)

    Image(
        bitmap = bitmap,
        contentDescription = "비트맵 이미지"
    )
}
```

### ImageVector

벡터 기반 이미지입니다. 확대/축소해도 품질이 유지됩니다. Android의 VectorDrawable(XML)에 해당합니다.

```kotlin
@Composable
fun ImageVectorExample() {
    // Material Icon (이미 ImageVector)
    Image(
        imageVector = Icons.Default.Star,
        contentDescription = "별",
        colorFilter = ColorFilter.tint(Color.Yellow),
        modifier = Modifier.size(48.dp)
    )

    // 리소스에서 ImageVector 로드
    Image(
        imageVector = ImageVector.vectorResource(id = R.drawable.ic_custom_vector),
        contentDescription = "커스텀 벡터"
    )
}
```

### 비교 표

| 항목 | ImageBitmap | ImageVector |
|------|------------|-------------|
| 형식 | 래스터 (픽셀) | 벡터 (수학적 경로) |
| 파일 형식 | PNG, JPG, WebP | VectorDrawable (XML), SVG 변환 |
| 확대 시 품질 | 저하될 수 있음 | 항상 선명 |
| 적합한 용도 | 사진, 복잡한 이미지 | 아이콘, 단순한 일러스트 |
| 파일 크기 | 보통 더 큼 | 보통 더 작음 |
| 색상 변경 | `ColorFilter` 사용 | `ColorFilter` 사용 |

---

## 8. Canvas와 DrawScope로 커스텀 그래픽 그리기

`Canvas`를 사용하면 원, 선, 사각형 등을 직접 그릴 수 있습니다. 차트, 커스텀 프로그레스바 등에 활용됩니다.

### Canvas 기초

```kotlin
@Composable
fun BasicCanvasExample() {
    Canvas(
        modifier = Modifier
            .fillMaxWidth()
            .height(200.dp)
    ) {
        // 원 그리기
        drawCircle(
            color = Color.Blue,
            radius = 80f,
            center = Offset(size.width / 4, size.height / 2)
        )

        // 사각형 그리기
        drawRect(
            color = Color.Red,
            topLeft = Offset(size.width / 2, 20f),
            size = Size(150f, 150f)
        )

        // 선 그리기
        drawLine(
            color = Color.Green,
            start = Offset(0f, size.height),
            end = Offset(size.width, 0f),
            strokeWidth = 4f
        )
    }
}
```

### DrawScope의 주요 그리기 함수

| 함수 | 설명 | 주요 매개변수 |
|------|------|---------------|
| `drawCircle()` | 원 그리기 | `color`, `radius`, `center` |
| `drawRect()` | 사각형 그리기 | `color`, `topLeft`, `size` |
| `drawRoundRect()` | 둥근 사각형 그리기 | `color`, `cornerRadius` |
| `drawLine()` | 선 그리기 | `color`, `start`, `end`, `strokeWidth` |
| `drawOval()` | 타원 그리기 | `color`, `topLeft`, `size` |
| `drawArc()` | 호(Arc) 그리기 | `color`, `startAngle`, `sweepAngle` |
| `drawPath()` | 자유 경로 그리기 | `path`, `color` |
| `drawImage()` | 이미지 그리기 | `image`, `topLeft` |

### 커스텀 프로그레스바 예제

```kotlin
@Composable
fun CustomProgressBar(
    progress: Float, // 0.0 ~ 1.0
    modifier: Modifier = Modifier
) {
    Canvas(
        modifier = modifier
            .fillMaxWidth()
            .height(12.dp)
    ) {
        // 배경 (회색 트랙)
        drawRoundRect(
            color = Color.LightGray,
            cornerRadius = CornerRadius(6.dp.toPx())
        )

        // 진행 바 (색칠된 부분)
        drawRoundRect(
            color = Color(0xFF4CAF50),
            size = Size(
                width = size.width * progress,
                height = size.height
            ),
            cornerRadius = CornerRadius(6.dp.toPx())
        )
    }
}

// 사용
@Composable
fun ProgressBarUsage() {
    var progress by remember { mutableFloatStateOf(0.7f) }

    Column(modifier = Modifier.padding(16.dp)) {
        Text("진행률: ${(progress * 100).toInt()}%")
        Spacer(modifier = Modifier.height(8.dp))
        CustomProgressBar(progress = progress)
    }
}
```

### 간단한 원형 차트 예제

```kotlin
@Composable
fun SimplePieChart(
    data: List<Pair<Float, Color>>, // (비율, 색상) 리스트
    modifier: Modifier = Modifier
) {
    Canvas(modifier = modifier.size(200.dp)) {
        var startAngle = -90f // 12시 방향에서 시작

        data.forEach { (ratio, color) ->
            val sweepAngle = ratio * 360f
            drawArc(
                color = color,
                startAngle = startAngle,
                sweepAngle = sweepAngle,
                useCenter = true,
                size = Size(size.minDimension, size.minDimension)
            )
            startAngle += sweepAngle
        }
    }
}

// 사용
@Composable
fun PieChartUsage() {
    SimplePieChart(
        data = listOf(
            0.4f to Color(0xFF4CAF50),  // 40% 녹색
            0.3f to Color(0xFF2196F3),  // 30% 파랑
            0.2f to Color(0xFFFF9800),  // 20% 주황
            0.1f to Color(0xFFF44336)   // 10% 빨강
        )
    )
}
```

---

## 9. XML View와의 비교

| XML View (기존 방식) | Jetpack Compose | 비고 |
|---------------------|-----------------|------|
| `ImageView` | `Image` | 이미지 표시 |
| `android:src="@drawable/..."` | `painterResource(R.drawable....)` | 리소스 이미지 로드 |
| `android:contentDescription` | `contentDescription` | 접근성 설명 |
| `android:scaleType="centerCrop"` | `contentScale = ContentScale.Crop` | 크기 조절 방식 |
| `android:scaleType="fitCenter"` | `contentScale = ContentScale.Fit` | 기본값 |
| `android:scaleType="fitXY"` | `contentScale = ContentScale.FillBounds` | 비율 무시 |
| `android:clipToOutline` + `ShapeDrawable` | `Modifier.clip(CircleShape)` | 이미지 잘라내기 |
| Glide / Picasso | Coil (`AsyncImage`) | 네트워크 이미지 로드 |
| `Canvas` (View) | `Canvas` (Compose) | 커스텀 그래픽 |
| `onDraw()` 오버라이드 | `DrawScope` 내부에서 그리기 | 그리기 API |

---

## 10. 자주 하는 실수와 주의사항

### 1) contentDescription 누락

장식용 이미지가 아닌 한, 반드시 `contentDescription`을 제공하세요.

```kotlin
// 의미 있는 이미지: 설명 필수
Image(
    painter = painterResource(id = R.drawable.product),
    contentDescription = "무선 블루투스 이어폰"
)

// 순수 장식용 이미지: null 허용
Image(
    painter = painterResource(id = R.drawable.decorative_background),
    contentDescription = null // 장식용이므로 null
)
```

### 2) 이미지 크기 미지정

크기를 지정하지 않으면 이미지 원본 크기로 표시되어 화면을 벗어날 수 있습니다.

```kotlin
// 잘못된 예: 크기 미지정
Image(
    painter = painterResource(id = R.drawable.large_photo),
    contentDescription = "큰 사진"
    // modifier 없음 -> 원본 크기 그대로!
)

// 올바른 예: 적절한 크기 지정
Image(
    painter = painterResource(id = R.drawable.large_photo),
    contentDescription = "큰 사진",
    modifier = Modifier
        .fillMaxWidth()
        .height(200.dp),
    contentScale = ContentScale.Crop
)
```

### 3) clip과 border 순서

```kotlin
// 올바른 순서: clip -> border
Image(
    painter = painterResource(id = R.drawable.profile),
    contentDescription = "프로필",
    modifier = Modifier
        .size(100.dp)
        .clip(CircleShape)         // 먼저 모양을 잘라내고
        .border(2.dp, Color.Blue, CircleShape) // 그 다음 테두리
)
```

### 4) 네트워크 이미지에 placeholder 없이 사용

네트워크에서 이미지를 로드할 때는 반드시 로딩 중과 에러 상태의 대체 UI를 제공하세요.

```kotlin
// 좋은 예: placeholder와 error 모두 제공
AsyncImage(
    model = imageUrl,
    contentDescription = "상품 이미지",
    placeholder = painterResource(R.drawable.placeholder),
    error = painterResource(R.drawable.error_image),
    modifier = Modifier.size(120.dp)
)
```

### 5) 큰 비트맵 이미지 직접 로드

매우 큰 이미지를 `painterResource`로 직접 로드하면 메모리 문제가 발생할 수 있습니다. 큰 이미지는 Coil 같은 라이브러리를 사용하여 적절한 크기로 리사이징하세요.

---

> **다음 단계**: [04. 리스트와 그리드](04-lists-and-grids.md)에서 LazyColumn, LazyRow, LazyGrid를 사용한 효율적인 리스트 구현을 배워봅시다.
