# Jetpack Compose 학습 로드맵

> **신입 Android 개발자를 위한 게이미피케이션 학습 플랫폼**
>
> 듀오링고 스타일 XP · 스트릭 · 하트 · 스킬 트리 · 간격 반복 복습

<p align="center">
  <a href="https://namja.github.io/Jetpack-Compose-Learning-Guide/">
    <img src="https://img.shields.io/badge/📖_Live_Demo-GitHub_Pages-3DDC84?style=for-the-badge" alt="Live Demo">
  </a>
</p>

---

## 왜 만들었나?

Android 개발을 처음 시작하면, 공식 문서의 방대한 양 앞에서 **어디서부터 읽어야 할지** 막막합니다.

공식 문서는 훌륭하지만, 초급 개발자의 시선에서 **단계별로 정리된 학습 경로**는 찾기 어렵습니다. 그래서 **XML View와 Compose 코드를 나란히 비교**하며 배울 수 있는 단계별 로드맵을 만들었습니다.

> **2026년 3월 기준** — Kotlin 2.3.10, Compose BOM 2026.02.01, Material3 1.4.0, Navigation 2.9.7 반영

읽기만 하면 잊어버리니까 — **듀오링고에서 영감받은 게이미피케이션**을 얹었습니다.

---

## 주요 기능

### 11 Phase · 38개 문서 커리큘럼

| Phase | 주제 | 문서 |
|:-----:|------|:----:|
| 0 | Kotlin 기초 | 3 |
| 1 | Compose 시작하기 | 4 |
| 2 | 기본 레이아웃 | 4 |
| 3 | 핵심 컴포넌트 | 4 |
| 4 | 상태 관리 | 4 |
| 5 | 내비게이션 | 3 |
| 6 | Material Design | 4 |
| 7 | 애니메이션 | 3 |
| 8 | 터치와 제스처 | 3 |
| 9 | 테스팅 & 디버깅 | 3 |
| 10 | 아키텍처 & 성능 | 3 |

### 게이미피케이션 시스템

- **XP & 레벨** — 퀴즈, 실습, 문서 완료 시 XP 획득. 7단계 레벨 시스템
- **연속 학습 스트릭** — 매일 접속하면 스트릭 증가, 연속 기록 유지 동기 부여
- **하트** — 틀리면 하트 소모, 소진 시 30분 쿨다운 (긴장감 있는 학습)
- **일일 목표** — 가벼운 5XP부터 도전적인 50XP까지 선택
- **뱃지 & 업적** — 11종 이상 뱃지 (첫 학습, 콤보, 퀴즈 마스터, 페이즈 마스터 등)
- **스킬 트리** — 홈 화면에서 전체 학습 진행도를 한눈에 확인
- **간격 반복 복습** — 망각 곡선 기반 (1→3→7→14→30일) 자동 복습 알림

### 인터랙티브 학습

- **5종 실습 문제** — 코드 배열, 출력 예측, 버그 찾기, 워드뱅크, 분류
- **퀴즈** — 객관식, 빈칸 채우기, 매칭
- **XML View ↔ Compose 코드 비교** — 사이드 바이 사이드 비교 뷰어
- **레슨 모드** — H2 섹션을 카드 단위로 분할하여 단계별 학습
- **효과음 & 축하 이펙트** — Web Audio API 사운드 + Canvas 컨페티

---

## 기술 스택

| 분류 | 기술 |
|------|------|
| 프레임워크 | [Docsify 4.x](https://docsify.js.org/) (빌드 도구 없음) |
| 호스팅 | GitHub Pages |
| 게이미피케이션 | Vanilla JavaScript (서버리스, localStorage 기반) |
| 효과음 | Web Audio API |
| 축하 이펙트 | Canvas API |
| 다이어그램 | Mermaid.js |
| 테마 | 다크/라이트 토글 (시스템 설정 연동) |

> **빌드 도구 0개.** React도, 번들러도, 서버도 없이 순수 HTML/JS/CSS만으로 동작합니다.

---

## 프로젝트 구조

```
├── index.html                    # Docsify 설정 & 플러그인 로드
├── _sidebar.md                   # 사이드바 네비게이션
├── JETPACK_COMPOSE_LEARNING_PLAN.md # 홈 (스킬 트리 + 대시보드)
├── phase-00-kotlin-basics/  ~ phase-10-architecture-and-performance/
│   └── NN-topic-slug.md          # 각 학습 문서
├── assets/
│   ├── css/                      # 테마, 프로그레스바, 게이미피케이션 스타일
│   ├── js/core/                  # GameCore, Sound, Confetti
│   ├── js/plugins/               # Docsify 커스텀 플러그인
│   └── js/components/            # 스킬 트리, 플레이그라운드
```

---

## 대상 독자

- Android 개발을 처음 시작하는 신입/초급 개발자
- XML 기반 View 시스템에서 Jetpack Compose로의 전환을 고려하는 개발자
- 체계적인 학습 경로가 필요한 Jetpack Compose 입문자

---

## 라이선스

MIT License

---

<p align="center">
  <b>도움이 되셨다면 Star를 눌러주세요!</b><br>
  <a href="https://namja.github.io/Jetpack-Compose-Learning-Guide/">학습 시작하기</a>
</p>
