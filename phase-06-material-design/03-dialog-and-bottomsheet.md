# 대화상자와 하단 시트

> **"좋은 대화상자는 사용자의 흐름을 끊지 않으면서도, 중요한 결정을 돕는다."**
>
> 대화상자(Dialog)와 하단 시트(Bottom Sheet)는 사용자에게 추가 정보를 요청하거나, 선택지를 제공하는 오버레이 UI입니다. 이 문서에서는 M3에서 제공하는 다양한 오버레이 컴포넌트를 학습합니다.

---

## 목차

1. [AlertDialog: 확인/취소 대화상자](#1-alertdialog-확인취소-대화상자)
2. [커스텀 Dialog](#2-커스텀-dialog)
3. [DatePickerDialog, TimePickerDialog](#3-datepickerdialog-timepickerdialog)
4. [ModalBottomSheet: rememberModalBottomSheetState](#4-modalbottomsheet-remembermodalbottomsheetstate)
5. [Scaffold BottomSheet](#5-scaffold-bottomsheet)
6. [DropdownMenu, ExposedDropdownMenuBox](#6-dropdownmenu-exposeddropdownmenubox)
7. [Chip: AssistChip, FilterChip, InputChip, SuggestionChip](#7-chip-assistchip-filterchip-inputchip-suggestionchip)
8. [SearchBar 리디자인: SearchBarState 기반 API](#8-searchbar-리디자인-searchbarstate-기반-api)
9. [SecureTextField: 비밀번호 입력 전용 컴포넌트](#9-securetextfield-비밀번호-입력-전용-컴포넌트)

---

## 1. AlertDialog: 확인/취소 대화상자

`AlertDialog`는 가장 기본적인 대화상자입니다. 사용자에게 확인/취소를 묻거나, 중요한 정보를 알릴 때 사용합니다.

```kotlin [compose-playground]
import androidx.compose.material3.AlertDialog
import androidx.compose.material3.TextButton

@Composable
fun DeleteConfirmDialog(
    onConfirm: () -> Unit,
    onDismiss: () -> Unit
) {
    AlertDialog(
        // 대화상자 바깥을 클릭했을 때
        onDismissRequest = onDismiss,
        // 아이콘 (선택)
        icon = {
            Icon(Icons.Default.Warning, contentDescription = null)
        },
        // 제목
        title = {
            Text("삭제 확인")
        },
        // 본문
        text = {
            Text("이 항목을 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.")
        },
        // 확인 버튼
        confirmButton = {
            TextButton(onClick = onConfirm) {
                Text("삭제")
            }
        },
        // 취소 버튼 (선택)
        dismissButton = {
            TextButton(onClick = onDismiss) {
                Text("취소")
            }
        }
    )
}
```

### 상태로 대화상자 표시/숨기기

```kotlin [compose-playground]
@Composable
fun HomeScreen() {
    var showDialog by remember { mutableStateOf(false) }

    Column(modifier = Modifier.padding(16.dp)) {
        Button(onClick = { showDialog = true }) {
            Text("항목 삭제")
        }
    }

    // 상태에 따라 대화상자 표시
    if (showDialog) {
        DeleteConfirmDialog(
            onConfirm = {
                // 삭제 처리
                showDialog = false
            },
            onDismiss = {
                showDialog = false
            }
        )
    }
}
```

> **팁**: 대화상자는 조건부로 컴포지션에 추가/제거하는 방식으로 표시합니다. `showDialog` 상태를 `true`로 바꾸면 대화상자가 나타나고, `false`로 바꾸면 사라집니다.

---

## 2. 커스텀 Dialog

`AlertDialog`의 레이아웃이 맞지 않을 때는 `Dialog` 컴포저블을 사용하여 **완전히 자유로운 레이아웃**을 구성할 수 있습니다.

```kotlin [compose-playground]
import androidx.compose.ui.window.Dialog

@Composable
fun ProfileEditDialog(
    currentName: String,
    onSave: (String) -> Unit,
    onDismiss: () -> Unit
) {
    Dialog(onDismissRequest = onDismiss) {
        // 커스텀 레이아웃
        Card(
            modifier = Modifier
                .fillMaxWidth()
                .padding(16.dp),
            shape = MaterialTheme.shapes.large
        ) {
            Column(
                modifier = Modifier.padding(24.dp),
                verticalArrangement = Arrangement.spacedBy(16.dp)
            ) {
                Text(
                    text = "프로필 편집",
                    style = MaterialTheme.typography.headlineSmall
                )

                var name by remember { mutableStateOf(currentName) }
                OutlinedTextField(
                    value = name,
                    onValueChange = { name = it },
                    label = { Text("이름") },
                    modifier = Modifier.fillMaxWidth()
                )

                // 프로필 이미지 선택 영역
                Box(
                    modifier = Modifier
                        .size(80.dp)
                        .clip(CircleShape)
                        .background(MaterialTheme.colorScheme.primaryContainer)
                        .align(Alignment.CenterHorizontally),
                    contentAlignment = Alignment.Center
                ) {
                    Icon(
                        Icons.Default.CameraAlt,
                        contentDescription = "사진 변경",
                        tint = MaterialTheme.colorScheme.onPrimaryContainer
                    )
                }

                // 버튼 행
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.End,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    TextButton(onClick = onDismiss) {
                        Text("취소")
                    }
                    Spacer(modifier = Modifier.width(8.dp))
                    Button(onClick = { onSave(name) }) {
                        Text("저장")
                    }
                }
            }
        }
    }
}
```

> **`Dialog` vs `AlertDialog`**: `AlertDialog`는 M3 가이드라인에 맞는 정형화된 레이아웃을 제공합니다. 자유로운 레이아웃이 필요하면 `Dialog`를 사용하세요.

---

## 3. DatePickerDialog, TimePickerDialog

날짜와 시간 선택은 M3에서 전용 컴포넌트를 제공합니다.

### DatePickerDialog

```kotlin [compose-playground]
import androidx.compose.material3.DatePicker
import androidx.compose.material3.DatePickerDialog
import androidx.compose.material3.rememberDatePickerState
import androidx.compose.material3.ExperimentalMaterial3Api
import java.text.SimpleDateFormat
import java.util.*

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun MyDatePickerDialog(
    onDateSelected: (Long?) -> Unit,
    onDismiss: () -> Unit
) {
    val datePickerState = rememberDatePickerState()

    DatePickerDialog(
        onDismissRequest = onDismiss,
        confirmButton = {
            TextButton(
                onClick = {
                    onDateSelected(datePickerState.selectedDateMillis)
                    onDismiss()
                }
            ) {
                Text("확인")
            }
        },
        dismissButton = {
            TextButton(onClick = onDismiss) {
                Text("취소")
            }
        }
    ) {
        DatePicker(state = datePickerState)
    }
}

// 사용 예시
@Composable
fun DateSelectionScreen() {
    var showDatePicker by remember { mutableStateOf(false) }
    var selectedDate by remember { mutableStateOf("날짜를 선택하세요") }

    Column(modifier = Modifier.padding(16.dp)) {
        OutlinedButton(onClick = { showDatePicker = true }) {
            Text(selectedDate)
        }
    }

    if (showDatePicker) {
        MyDatePickerDialog(
            onDateSelected = { millis ->
                millis?.let {
                    val formatter = SimpleDateFormat("yyyy년 MM월 dd일", Locale.KOREA)
                    selectedDate = formatter.format(Date(it))
                }
            },
            onDismiss = { showDatePicker = false }
        )
    }
}
```

### TimePicker

Material3 **1.4.0**부터 `TimePickerDialog`가 공식적으로 추가되어, `TimePicker`와 `TimeInput` 모두를 하나의 다이얼로그에서 지원합니다. 더 이상 커스텀 Dialog를 직접 구성할 필요가 없습니다.

```kotlin [compose-playground]
@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun MyTimePickerDialog(
    onTimeSelected: (hour: Int, minute: Int) -> Unit,
    onDismiss: () -> Unit
) {
    val timePickerState = rememberTimePickerState(
        initialHour = 12,
        initialMinute = 0,
        is24Hour = false
    )

    // M3 1.4.0: 공식 TimePickerDialog
    TimePickerDialog(
        onDismissRequest = onDismiss,
        confirmButton = {
            TextButton(
                onClick = {
                    onTimeSelected(
                        timePickerState.hour,
                        timePickerState.minute
                    )
                    onDismiss()
                }
            ) {
                Text("확인")
            }
        },
        dismissButton = {
            TextButton(onClick = onDismiss) {
                Text("취소")
            }
        }
    ) {
        TimePicker(state = timePickerState)
        // 또는 TimeInput(state = timePickerState) 으로 키보드 입력 모드 사용
    }
}
```

> **이전 방식 (참고)**: 1.4.0 이전에는 `TimePickerDialog`가 없어 `Dialog` + `Card`를 직접 조합해야 했습니다. 아래는 이전 방식의 예시입니다.

<details>
<summary>이전 방식: 커스텀 Dialog로 TimePicker 구성 (접기/펼치기)</summary>

```kotlin [compose-playground]
@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun MyTimePickerDialogLegacy(
    onTimeSelected: (hour: Int, minute: Int) -> Unit,
    onDismiss: () -> Unit
) {
    val timePickerState = rememberTimePickerState(
        initialHour = 12,
        initialMinute = 0,
        is24Hour = false
    )

    Dialog(onDismissRequest = onDismiss) {
        Card(
            shape = MaterialTheme.shapes.extraLarge
        ) {
            Column(
                modifier = Modifier.padding(24.dp),
                horizontalAlignment = Alignment.CenterHorizontally
            ) {
                Text(
                    text = "시간 선택",
                    style = MaterialTheme.typography.labelLarge,
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(bottom = 20.dp)
                )

                TimePicker(state = timePickerState)

                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.End
                ) {
                    TextButton(onClick = onDismiss) {
                        Text("취소")
                    }
                    TextButton(
                        onClick = {
                            onTimeSelected(
                                timePickerState.hour,
                                timePickerState.minute
                            )
                            onDismiss()
                        }
                    ) {
                        Text("확인")
                    }
                }
            }
        }
    }
}
```

</details>

---

## 4. ModalBottomSheet: rememberModalBottomSheetState

`ModalBottomSheet`는 화면 하단에서 올라오는 시트입니다. 추가 옵션, 필터, 상세 정보를 표시할 때 사용합니다.

```kotlin [compose-playground]
import androidx.compose.material3.ModalBottomSheet
import androidx.compose.material3.rememberModalBottomSheetState
import androidx.compose.material3.ExperimentalMaterial3Api

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun BottomSheetExample() {
    var showBottomSheet by remember { mutableStateOf(false) }
    val sheetState = rememberModalBottomSheetState()

    Scaffold { innerPadding ->
        Column(modifier = Modifier.padding(innerPadding)) {
            Button(onClick = { showBottomSheet = true }) {
                Text("하단 시트 열기")
            }
        }
    }

    if (showBottomSheet) {
        ModalBottomSheet(
            onDismissRequest = { showBottomSheet = false },
            sheetState = sheetState
        ) {
            // 하단 시트 콘텐츠
            Column(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(16.dp)
            ) {
                Text(
                    text = "공유하기",
                    style = MaterialTheme.typography.titleLarge,
                    modifier = Modifier.padding(bottom = 16.dp)
                )

                listOf(
                    Triple(Icons.Default.Email, "이메일", "email"),
                    Triple(Icons.Default.Share, "메시지", "message"),
                    Triple(Icons.Default.Link, "링크 복사", "copy")
                ).forEach { (icon, label, _) ->
                    ListItem(
                        headlineContent = { Text(label) },
                        leadingContent = {
                            Icon(icon, contentDescription = label)
                        },
                        modifier = Modifier.clickable {
                            // 액션 처리
                            showBottomSheet = false
                        }
                    )
                }

                // 하단 여백 (시스템 내비게이션 바 대응)
                Spacer(modifier = Modifier.height(32.dp))
            }
        }
    }
}
```

### 프로그래밍 방식으로 시트 닫기

```kotlin [compose-playground]
@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun ProgrammaticDismissExample() {
    var showBottomSheet by remember { mutableStateOf(false) }
    val sheetState = rememberModalBottomSheetState()
    val scope = rememberCoroutineScope()

    if (showBottomSheet) {
        ModalBottomSheet(
            onDismissRequest = { showBottomSheet = false },
            sheetState = sheetState
        ) {
            Button(
                onClick = {
                    // 애니메이션과 함께 시트 닫기
                    scope.launch {
                        sheetState.hide()
                    }.invokeOnCompletion {
                        if (!sheetState.isVisible) {
                            showBottomSheet = false
                        }
                    }
                }
            ) {
                Text("닫기")
            }
        }
    }
}
```

---

## 5. Scaffold BottomSheet

`BottomSheetScaffold`는 화면에 **항상 일부가 보이는(peekable)** 하단 시트를 제공합니다. 지도 앱에서 하단에 장소 정보가 살짝 보이는 UI에 적합합니다.

```kotlin [compose-playground]
import androidx.compose.material3.BottomSheetScaffold
import androidx.compose.material3.rememberBottomSheetScaffoldState
import androidx.compose.material3.ExperimentalMaterial3Api

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun BottomSheetScaffoldExample() {
    val scaffoldState = rememberBottomSheetScaffoldState()

    BottomSheetScaffold(
        scaffoldState = scaffoldState,
        // 접혀 있을 때 보이는 높이
        sheetPeekHeight = 128.dp,
        // 하단 시트 콘텐츠
        sheetContent = {
            Column(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(16.dp)
            ) {
                // 핸들 바 아래 콘텐츠
                Text(
                    text = "장소 정보",
                    style = MaterialTheme.typography.titleMedium
                )
                Spacer(modifier = Modifier.height(8.dp))
                Text("위로 드래그하여 상세 정보 보기")

                Spacer(modifier = Modifier.height(16.dp))

                // 펼쳤을 때 보이는 추가 콘텐츠
                Text(
                    text = "상세 정보",
                    style = MaterialTheme.typography.titleMedium
                )
                Text("주소: 서울시 강남구 테헤란로 123")
                Text("전화: 02-1234-5678")
                Text("영업 시간: 09:00 - 18:00")

                Spacer(modifier = Modifier.height(16.dp))

                Button(
                    onClick = { /* 길찾기 */ },
                    modifier = Modifier.fillMaxWidth()
                ) {
                    Text("길찾기")
                }
            }
        },
        // 메인 콘텐츠
        topBar = {
            TopAppBar(title = { Text("지도") })
        }
    ) { innerPadding ->
        Box(
            modifier = Modifier
                .fillMaxSize()
                .padding(innerPadding)
                .background(MaterialTheme.colorScheme.surfaceVariant),
            contentAlignment = Alignment.Center
        ) {
            Text("지도 영역")
        }
    }
}
```

---

## 6. DropdownMenu, ExposedDropdownMenuBox

### DropdownMenu — 컨텍스트 메뉴

```kotlin [compose-playground]
import androidx.compose.material3.DropdownMenu
import androidx.compose.material3.DropdownMenuItem

@Composable
fun ContextMenuExample() {
    var expanded by remember { mutableStateOf(false) }

    Box {
        IconButton(onClick = { expanded = true }) {
            Icon(Icons.Default.MoreVert, contentDescription = "메뉴")
        }

        DropdownMenu(
            expanded = expanded,
            onDismissRequest = { expanded = false }
        ) {
            DropdownMenuItem(
                text = { Text("편집") },
                onClick = {
                    // 편집 처리
                    expanded = false
                },
                leadingIcon = {
                    Icon(Icons.Default.Edit, contentDescription = null)
                }
            )
            DropdownMenuItem(
                text = { Text("공유") },
                onClick = {
                    expanded = false
                },
                leadingIcon = {
                    Icon(Icons.Default.Share, contentDescription = null)
                }
            )
            HorizontalDivider()
            DropdownMenuItem(
                text = {
                    Text("삭제", color = MaterialTheme.colorScheme.error)
                },
                onClick = {
                    expanded = false
                },
                leadingIcon = {
                    Icon(
                        Icons.Default.Delete,
                        contentDescription = null,
                        tint = MaterialTheme.colorScheme.error
                    )
                }
            )
        }
    }
}
```

### ExposedDropdownMenuBox — 선택 드롭다운

```kotlin [compose-playground]
import androidx.compose.material3.ExposedDropdownMenuBox
import androidx.compose.material3.ExposedDropdownMenuDefaults
import androidx.compose.material3.ExperimentalMaterial3Api

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun CitySelector() {
    val cities = listOf("서울", "부산", "대구", "인천", "광주", "대전", "울산")
    var expanded by remember { mutableStateOf(false) }
    var selectedCity by remember { mutableStateOf("") }

    ExposedDropdownMenuBox(
        expanded = expanded,
        onExpandedChange = { expanded = it }
    ) {
        OutlinedTextField(
            value = selectedCity,
            onValueChange = {},
            readOnly = true,
            label = { Text("도시 선택") },
            trailingIcon = {
                ExposedDropdownMenuDefaults.TrailingIcon(expanded = expanded)
            },
            colors = ExposedDropdownMenuDefaults.outlinedTextFieldColors(),
            modifier = Modifier
                .menuAnchor()  // 메뉴 위치 앵커
                .fillMaxWidth()
        )

        ExposedDropdownMenu(
            expanded = expanded,
            onDismissRequest = { expanded = false }
        ) {
            cities.forEach { city ->
                DropdownMenuItem(
                    text = { Text(city) },
                    onClick = {
                        selectedCity = city
                        expanded = false
                    },
                    contentPadding = ExposedDropdownMenuDefaults.ItemContentPadding
                )
            }
        }
    }
}
```

---

## 7. Chip: AssistChip, FilterChip, InputChip, SuggestionChip

**Chip**은 작은 인터랙티브 요소로, 입력, 필터, 액션 등을 간결하게 표현합니다. M3에서는 4가지 종류의 Chip을 제공합니다.

### AssistChip — 도움/바로가기

```kotlin [compose-playground]
import androidx.compose.material3.AssistChip

@Composable
fun AssistChipExample() {
    AssistChip(
        onClick = { /* 바로가기 액션 */ },
        label = { Text("길찾기") },
        leadingIcon = {
            Icon(
                Icons.Default.Directions,
                contentDescription = null,
                modifier = Modifier.size(AssistChipDefaults.IconSize)
            )
        }
    )
}
```

### FilterChip — 필터 선택

```kotlin [compose-playground]
import androidx.compose.material3.FilterChip

@Composable
fun FilterChipGroup() {
    val filters = listOf("전체", "음식", "카페", "쇼핑", "문화")
    var selectedFilters by remember { mutableStateOf(setOf("전체")) }

    LazyRow(
        horizontalArrangement = Arrangement.spacedBy(8.dp),
        contentPadding = PaddingValues(horizontal = 16.dp)
    ) {
        items(filters) { filter ->
            FilterChip(
                selected = filter in selectedFilters,
                onClick = {
                    selectedFilters = if (filter in selectedFilters) {
                        selectedFilters - filter
                    } else {
                        selectedFilters + filter
                    }
                },
                label = { Text(filter) },
                leadingIcon = if (filter in selectedFilters) {
                    {
                        Icon(
                            Icons.Default.Check,
                            contentDescription = null,
                            modifier = Modifier.size(FilterChipDefaults.IconSize)
                        )
                    }
                } else {
                    null
                }
            )
        }
    }
}
```

### InputChip — 입력 값 표시 (삭제 가능)

```kotlin [compose-playground]
import androidx.compose.material3.InputChip
import androidx.compose.material3.InputChipDefaults

@Composable
fun TagInput() {
    var tags by remember { mutableStateOf(listOf("Kotlin", "Compose", "Android")) }

    FlowRow(
        horizontalArrangement = Arrangement.spacedBy(8.dp),
        modifier = Modifier.padding(16.dp)
    ) {
        tags.forEach { tag ->
            InputChip(
                selected = false,
                onClick = { /* 태그 클릭 */ },
                label = { Text(tag) },
                // X 버튼으로 삭제
                trailingIcon = {
                    Icon(
                        Icons.Default.Close,
                        contentDescription = "삭제",
                        modifier = Modifier
                            .size(InputChipDefaults.IconSize)
                            .clickable { tags = tags - tag }
                    )
                }
            )
        }
    }
}
```

### SuggestionChip — 추천/제안

```kotlin [compose-playground]
import androidx.compose.material3.SuggestionChip

@Composable
fun SuggestionChipExample() {
    val suggestions = listOf("오늘 날씨", "근처 맛집", "주말 계획")

    Text(
        text = "추천 검색어",
        style = MaterialTheme.typography.labelLarge,
        modifier = Modifier.padding(start = 16.dp, bottom = 8.dp)
    )

    LazyRow(
        horizontalArrangement = Arrangement.spacedBy(8.dp),
        contentPadding = PaddingValues(horizontal = 16.dp)
    ) {
        items(suggestions) { suggestion ->
            SuggestionChip(
                onClick = { /* 검색 실행 */ },
                label = { Text(suggestion) }
            )
        }
    }
}
```

| Chip 종류 | 용도 | 인터랙션 |
|-----------|------|---------|
| AssistChip | 바로가기, 도움 액션 | 클릭 시 액션 실행 |
| FilterChip | 콘텐츠 필터링 | 선택/해제 토글 |
| InputChip | 사용자 입력 값 표시 | 삭제(X) 가능 |
| SuggestionChip | 추천, 제안 | 클릭 시 값 적용 |

### Chip 레이아웃 커스터마이징 (1.4.0)

Material3 1.4.0부터 Chip 컴포넌트에 `horizontalArrangement`와 `contentPadding` 파라미터가 추가되어, 내부 콘텐츠의 배치와 여백을 더 세밀하게 제어할 수 있습니다.

```kotlin [compose-playground]
FilterChip(
    selected = true,
    onClick = { /* ... */ },
    label = { Text("필터") },
    // 내부 콘텐츠의 가로 배치 방식 지정
    horizontalArrangement = Arrangement.spacedBy(4.dp),
    // 내부 여백 커스터마이징
    contentPadding = PaddingValues(horizontal = 12.dp, vertical = 6.dp)
)
```

---

## 8. SearchBar 리디자인: SearchBarState 기반 API

Material3 1.4.0에서 `SearchBar`가 리디자인되었습니다. 새로운 `SearchBarState`를 통해 상태를 관리하며, 화면 유형에 따라 3가지 변형을 제공합니다.

### SearchBar 종류

| 컴포넌트 | 특징 | 용도 |
|----------|------|------|
| `SearchBar` | 기본 검색 바 | 일반적인 검색 UI |
| `ExpandedFullScreenSearchBar` | 전체 화면으로 확장 | 모바일에서 몰입형 검색 |
| `ExpandedDockedSearchBar` | 검색 바 아래에 결과 도킹 | 넓은 화면에서 검색 결과 표시 |

### 기본 사용법

```kotlin [compose-playground]
@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun SearchExample() {
    val searchBarState = rememberSearchBarState()
    var query by remember { mutableStateOf("") }

    SearchBar(
        state = searchBarState,
        query = query,
        onQueryChange = { query = it },
        onSearch = { /* 검색 실행 */ },
        placeholder = { Text("검색어를 입력하세요") },
        leadingIcon = { Icon(Icons.Default.Search, contentDescription = "검색") },
        trailingIcon = {
            if (query.isNotEmpty()) {
                IconButton(onClick = { query = "" }) {
                    Icon(Icons.Default.Close, contentDescription = "지우기")
                }
            }
        }
    )
}
```

### ExpandedFullScreenSearchBar — 전체 화면 검색

```kotlin [compose-playground]
@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun FullScreenSearchExample() {
    val searchBarState = rememberSearchBarState()
    var query by remember { mutableStateOf("") }

    ExpandedFullScreenSearchBar(
        state = searchBarState,
        query = query,
        onQueryChange = { query = it },
        onSearch = { /* 검색 실행 */ },
        onBackClick = { /* 뒤로 가기 */ },
        placeholder = { Text("검색") }
    ) {
        // 검색 결과 콘텐츠
        LazyColumn {
            items(filteredResults) { result ->
                ListItem(headlineContent = { Text(result) })
            }
        }
    }
}
```

---

## 9. SecureTextField: 비밀번호 입력 전용 컴포넌트

Material3 1.4.0에서 비밀번호 입력에 특화된 `SecureTextField`와 `OutlinedSecureTextField`가 추가되었습니다. 기존에 `visualTransformation = PasswordVisualTransformation()`을 직접 설정하던 방식보다 간편합니다.

```kotlin [compose-playground]
import androidx.compose.material3.SecureTextField
import androidx.compose.material3.OutlinedSecureTextField

@Composable
fun LoginForm() {
    var password by remember { mutableStateOf("") }

    // 기본 SecureTextField
    SecureTextField(
        value = password,
        onValueChange = { password = it },
        label = { Text("비밀번호") },
        modifier = Modifier.fillMaxWidth()
    )

    // Outlined 변형
    OutlinedSecureTextField(
        value = password,
        onValueChange = { password = it },
        label = { Text("비밀번호 확인") },
        modifier = Modifier.fillMaxWidth()
    )
}
```

**주요 특징:**
- 입력 텍스트가 자동으로 마스킹(dot) 처리
- 비밀번호 표시/숨기기 토글 지원
- `visualTransformation`을 직접 설정할 필요 없음
- `TextField` / `OutlinedTextField`와 동일한 스타일링 API 지원

---

> **다음 문서**: [04. 커스텀 테마 설정](04-custom-theming.md)에서는 CompositionLocal을 활용한 자체 테마 시스템 구축과 접근성 고려 사항을 학습합니다.
