# 3조 개발 구현사항

기준: [상세 기능명세서](https://www.figma.com/design/G5i65LGv2ljKhvm8xN2cGU)  
화면 단위 요약은 `PROGRESS.md`, 웹 예외·1차 제외는 `제출-구현범위.md`.  
노션 「3조 개발 수정요청 사항」 항목별 처리는 [`3조-개발-수정요청-처리.md`](./3조-개발-수정요청-처리.md).

이 파일은 Description 빨간 원 번호(`SP-AU-SignUp-01` … `SP-HM-Dashbd-01` …)마다 **했고 / 부분 / 안 함**을 적습니다.  
픽셀 1:1은 아닙니다. 동작·카피·상태·목업 구조를 웹으로 옮긴 기준입니다.

| 표시 | 의미 |
| --- | --- |
| ✅ | 명세대로 함 |
| ⚠️ | 화면은 있는데 웹 제약·카피 차이·명세 예외가 있음 |
| ❌ | 안 함 (1차 제외 / 웹 불가 / 미구현) |
| 🗑 | 피그마에서 삭제됨 (9/8 등) |

---

## 01. 인증

### SP-AU-Login `/login`

| ID | 항목 | 상태 | 메모 |
| --- | --- | --- | --- |
| SP-AU-Login-01 | 뒤로가기 | ⚠️ | 종료 확인 모달(종료하시겠어요? / 취소·종료). 웹 명세의 「외부 유입이면 비활성」은 안 함. 탭 종료는 `window.close` + 토스트 |
| SP-AU-Login-02 | 틈 로고 (슬로건 Ver) | ✅ | `/brand/logo-slogan.png` |
| SP-AU-Login-03 | 이메일 | ✅ | `example@email.com`, 10–30자, 한글/NULL 불가. 빨강 테두리 + 「이메일 양식에 맞게 입력해 주세요」 |
| SP-AU-Login-04 | 비밀번호를 잊으셨나요? | ✅ | `/forgot` |
| SP-AU-Login-05 | 비밀번호 | ✅ | `비밀번호 입력`, 10–20자, 포커스 시 조건 힌트. 오류 시 빨강 테두리+조건 문구 |
| SP-AU-Login-06 | 로그인 버튼 | ⚠️ | DB 대조 후 `/home`. 불일치는 명세 팝업 대신 토스트. 서버 오류 토스트는 있음 |
| SP-AU-Login-07 | Google | ❌ | 명세 「1차 개발 범위에서 제외」. 버튼만 두고 토스트 |
| SP-AU-Login-08 | Kakao | ❌ | 동일 |
| SP-AU-Login-09 | 회원가입 | ✅ | `/signup` |

### SP-AU-SignUp `/signup`

| ID | 항목 | 상태 | 메모 |
| --- | --- | --- | --- |
| SP-AU-SignUp-01 | 뒤로가기 | ✅ | `/login` |
| SP-AU-SignUp-02 | 이메일 | ✅ | 플레이스홀더·길이·한글 불가. 「이메일 양식에 맞게 입력해 주세요」 / 「이미 가입된 이메일입니다.」 |
| SP-AU-SignUp-03 | 비밀번호 | ✅ | 조건·길이·포커스 힌트. 오류 시 빨간 조건 문구 |
| SP-AU-SignUp-04 | 비밀번호 확인 | ✅ | `비밀번호 재입력`. 불일치 「비밀번호가 일치하지 않습니다.」 |
| SP-AU-SignUp-05 | 약관동의 | ✅ | 기본 전부 OFF. 전체동의=필수+선택. 필수 3개 있어야 가입 활성. 자세히 → 해당 약관 |
| SP-AU-SignUp-06 | 가입하기 | ⚠️ | 명세는 로그인 직행. 옆 프레임 SP-AU-SignUpCp를 따라 `/signup/done` 후 로그인 |

### SP-AU-AgreementDetail `/signup/terms`

| ID | 항목 | 상태 | 메모 |
| --- | --- | --- | --- |
| SP-AU-AgreementDetail-01 | 뒤로가기 | ✅ | 회원가입으로 |
| SP-AU-AgreementDetail-02 | 확인 | ✅ | 회원가입으로. 문서 4종(만 14세 / 이용약관 / 개인정보 / 마케팅) |

### SP-AU-SignUpCp `/signup/done`

| ID | 항목 | 상태 | 메모 |
| --- | --- | --- | --- |
| SP-AU-SignUpCp-01 | 틈 로고 홈버튼 | 🗑 | 피그마 9/8 삭제. 구현 안 함 |
| SP-AU-SignUpCp-02 | 조아틈끼 + 완료 문구 | ✅ | |
| SP-AU-SignUpCp-03 | 로그인 하러 가기 | ✅ | `/login` |

### SP-AU-Find PW `/forgot`

| ID | 항목 | 상태 | 메모 |
| --- | --- | --- | --- |
| SP-AU-FindPW-01 | 뒤로가기 | ✅ | `/login` |
| SP-AU-FindPW-02 | 이메일 | ✅ | 형식·미가입 필드 에러 |
| SP-AU-FindPW-03 | 인증 코드 받기 | ⚠️ | 화면·이동은 함. **실제 메일 발송 없음.** 코드는 `123456` |

### SP-AU-Verify `/forgot/verify`

| ID | 항목 | 상태 | 메모 |
| --- | --- | --- | --- |
| SP-AU-Verify-01 | 뒤로가기 | ✅ | `/forgot` |
| SP-AU-Verify-02 | 6칸 코드 | ⚠️ | 자동 포커스·6자리 시 인증 활성·불일치 빨강. 실제 OTP 아님 (`123456`) |
| SP-AU-Verify-03 | 재전송 | ✅ | 1분 타이머 후 재활성 |
| SP-AU-Verify-04 | 인증하기 | ⚠️ | 맞으면 `/forgot/new`. 만료 메일 재발송은 없음 |

### SP-AU-NewPW `/forgot/new`

| ID | 항목 | 상태 | 메모 |
| --- | --- | --- | --- |
| SP-AU-NewPW-01 | 뒤로가기 | ✅ | |
| SP-AU-NewPW-02 | 새 비밀번호 | ✅ | 03과 같은 규칙 |
| SP-AU-NewPW-03 | 비밀번호 확인 | ✅ | 불일치 경고 |
| SP-AU-NewPW-04 | 비밀번호 변경 | ✅ | `/forgot/done` |

### SP-AU-PWCp `/forgot/done`

| ID | 항목 | 상태 | 메모 |
| --- | --- | --- | --- |
| SP-AU-PWCp-01 | (명세에 없음) | — | |
| SP-AU-PWCp-02 | 조아틈끼 | ✅ | |
| SP-AU-PWCp-03 | 로그인 하러 가기 | ✅ | `/login` |

---

## 02. 홈·구독

### SP-OnBdAgree `/home` 첫 진입

번호는 있으나 `[SP-…]` ID는 없음.

| # | 항목 | 상태 | 메모 |
| --- | --- | --- | --- |
| 1 | 마케팅 수신 동의 팝업 | ✅ | 알림틈끼. 최초 1회 |
| 2 | 알림 거부 | ✅ | 마케팅 OFF + 시각 토스트 |
| 3 | 알림 받기 | ✅ | 마케팅 ON + 시각 토스트 |

### SP-HM-Dashbd `/home`

| ID | 항목 | 상태 | 메모 |
| --- | --- | --- | --- |
| SP-HM-Dashbd-00 | 홈 메인 로고 | ✅ | `/brand/home-logo.png` + 「틈」. 히어로에서는 흰색 |
| SP-HM-Dashbd-01 | 알림 아이콘 | ✅ | `/icons/bell.png`. 0건이어도 종. 1–9 / 10건↑ `9+`. 탭 → 사이드시트 |
| SP-HM-Dashbd-02 | 이벤트 슬라이드 배너 | ✅ | 4장, 3초, 도트+화살표. 탭 시 혜택/초대 등 |
| SP-HM-Dashbd-03 | 1주 캘린더 | ⚠️ | Today 원, 구독 파랑/일상 분홍 도트, 탭 → 캘린더 해당일. **좌우 주 슬라이드는 없음** (이번 주만) |
| SP-HM-Dashbd-04 | 이번 달 구독비 | ⚠️ | 합계·0원 표기. 배너 안 ServALL 인라인은 없고 전역 `/error` |
| SP-HM-Dashbd-05 | 새는 구독 | ✅ | 0개 `#EAF3FF` 「틈이 없어요…」 / 1개+ `#FAECD5` 「새는 구독 n개 · 최대 x원」. 확인하기 → `/inspect`. 0건 구독은 「아직 등록된 구독이 없어요」 |
| SP-HM-Dashbd-06 | MY 결제일 | ⚠️ | 이번 주 최대 2개, 탭 → 상세. 빈 카피는 명세 「예정 없음」이 아니라 「예정된 결제가 없어요」 |
| SP-HM-Dashbd-07 | 더보기 › | ✅ | `/subscriptions` |
| SP-HM-Dashbd-08 | 구독비 점검받기 | ✅ | `/inspect` |
| SP-HM-Dashbd-09 | FAB + | ✅ | 항시 노출. 열리면 X |
| SP-HM-Dashbd-10 | 추가 팝업 | ✅ | 구독/일상 × 이미지/음성/직접. CAL-Fab와 동일 |

### SP-HM-Reminder 홈 사이드시트

| ID | 항목 | 상태 | 메모 |
| --- | --- | --- | --- |
| SP-HM-Reminder-01 | 닫기 / 딤 | ✅ | 시트 종료 |
| SP-HM-Reminder-02 | 알림 없음 | ✅ | 알림틈끼 + 빈 문구 |
| SP-HM-Reminder-03 | 알림 피드 | ✅ | 최신·상대시간. 확인 시 상세/점검/혜택 등 |
| SP-HM-Reminder-04 | 확인 버튼 | ✅ | 항목당 1개 |
| SP-HM-Reminder-05 | 일괄 삭제 | ✅ | 9/8에 「모두 읽음」→「일괄 삭제」. 피드 비움 |

### SP-Coldhome / SP-ColdSub

| ID | 항목 | 상태 | 메모 |
| --- | --- | --- | --- |
| (번호 없음) | 0건 홈·목록 | ✅ | 신규 가입. 0원 / 등록 CTA / 「등록된 구독이 없어요」 |

### SP-SB-List `/subscriptions`

| ID | 항목 | 상태 | 메모 |
| --- | --- | --- | --- |
| SP-SB-List-01 | 뒤로가기 | ✅ | `/home` |
| SP-SB-List-02 | Summary 카드 | ✅ | 이름/결제일/금액/D-day → 상세 |
| SP-SB-List-03 | 카테고리 칩 | ✅ | 등록된 카테고리만 |
| SP-SB-List-04 | 정렬 | ✅ | 결제일(기본)/금액/최신/상태 |
| SP-SB-List-05 | 리스트 | ✅ | 0건 empty |
| SP-SB-List-06 | 결합 배지 | ✅ | 결합이면 목록·상세 |

### SP-SB-Detail `/subscriptions/[id]`

| ID | 항목 | 상태 | 메모 |
| --- | --- | --- | --- |
| SP-SB-Detail-01 | 뒤로가기 | ✅ | 목록 (캘린더 유입이면 히스토리) |
| SP-SB-Detail-02-1 / 02-2 | 결합 / 단일 헤더 | ✅ | |
| SP-SB-Detail-03 | 이용 상태 | ✅ | 이용 중 / 일시정지 드롭다운 |
| SP-SB-Detail-04 | 결합 유의사항 | ✅ | |
| SP-SB-Detail-05 | 결제 정보 | ✅ | 요금·다음결제일·주기·수단 |
| SP-SB-Detail-06 | 무료체험 뱃지 | ✅ | |
| SP-SB-Detail-07 | 틈이 확인했어요 | ✅ | 비인터랙션 |
| SP-SB-Detail-08 | 정보 수정 | ✅ | `/edit` |
| SP-SB-Detail-09 | 삭제 | ✅ | DelConfirm. 명세 InfoTable은 08로도 적혀 있음(피그마 ID 충돌) |

### SP-SB-DelConfirm

| ID | 항목 | 상태 | 메모 |
| --- | --- | --- | --- |
| SP-SB-DelConfirm-01 | 팝업 | ✅ | 놀란틈끼 + 복구 불가 |
| SP-SB-DelConfirm-02 | 취소 / 딤 | ✅ | |
| SP-SB-DelConfirm-03 | 삭제 | ✅ | 목록으로 |

### SP-SB-Edit `/subscriptions/new` · `.../edit`

| ID | 항목 | 상태 | 메모 |
| --- | --- | --- | --- |
| SP-SB-Edit-00 | 필수 * · 저장 활성 | ✅ | 02–05 필수 |
| SP-SB-Edit-01 | 뒤로가기 | ✅ | 작성 중단 팝업 |
| SP-SB-Edit-02 | 서비스 명 | ✅ | 2–30자, 자동완성, 미등록 시 틈 로고 |
| SP-SB-Edit-03 | 첫 결제일 | ✅ | 기본 오늘. **소형 캘린더, 오늘 이전 비활성** |
| SP-SB-Edit-04 | 결제 주기 | ✅ | 기본 1개월, 1–99 |
| SP-SB-Edit-05 | 결제 금액 | ✅ | 0–99,999,999. 카탈로그와 다르면 필드 하단 경고 |
| SP-SB-Edit-06 | 무료체험 | ✅ | 기본 OFF. ON 시 기간 |
| SP-SB-Edit-07 | 결제수단 | ✅ | 선택, 1–10자 |
| SP-SB-Edit-08 | 알림 | ✅ | 기본 OFF |
| SP-SB-Edit-09 | 저장하기 | ✅ | 필수 채워져야 활성. 실패 토스트 |

### SP-SB-EditCp `/subscriptions/saved`

| ID | 항목 | 상태 | 메모 |
| --- | --- | --- | --- |
| SP-SB-EditCp-01 | 요약 + 조아틈끼 | ✅ | |
| SP-SB-EditCp-02 | 상세로 | ✅ | |

---

## 03. 캘린더·일상

### SP-CAL-Calendar `/calendar`

| ID | 항목 | 상태 | 메모 |
| --- | --- | --- | --- |
| SP-CAL-Calendar-01 | 구독/일상/전체 | ✅ | 기본 전체 |
| SP-CAL-Calendar-02 | 월 캘린더 | ✅ | 한국 일자, 선택 원, 도트 |
| SP-CAL-Calendar-03 | 일자 선택 | ✅ | 02와 동일 |
| SP-CAL-Calendar-04 | 일정 미리보기 | ✅ | 탭 → 상세. 0건 「오늘 일정이 없어요」 |
| SP-CAL-Calendar-05 | 추가하기 | ✅ | FAB와 동일 |

공유 버튼은 명세 번호 밖. 브라우저 공유 시트 또는 텍스트 복사. `.ics`/외부 캘린더 연동 ❌.

### SP-CAL-Schedule (선택일 목록, 캘린더 하단과 동일 흐름)

| ID | 항목 | 상태 | 메모 |
| --- | --- | --- | --- |
| SP-CAL-Schedule-01 | 뒤로가기 | ✅ | |
| SP-CAL-Schedule-02 | 이날의 일정 | ✅ | 구독→상세, 일상→일정 상세 |
| SP-CAL-Schedule-03 | 추가하기 | ✅ | |

### SP-CAL-Detail `/events/[id]`

| ID | 항목 | 상태 | 메모 |
| --- | --- | --- | --- |
| SP-CAL-Detail-01 | 뒤로가기 | ✅ | |
| SP-CAL-Detail-02 | 완료 배지 | ✅ | 지난 날 완료 |
| SP-CAL-Detail-03 | 일정 정보 | ✅ | 하루 종일 ON이면 시각 숨김 |
| SP-CAL-Detail-04 | 알림 배너 | ⚠️ | 안내 문구. 네이티브 배너 PNG 그대로는 아님 |
| SP-CAL-Detail-05 | 메모 50자 | ✅ | |
| SP-CAL-Detail-06 | 수정 | ✅ | |
| SP-CAL-Detail-07 | 삭제 | ✅ | DelConfirm |

### SP-CAL-DelConfirm

| ID | 항목 | 상태 | 메모 |
| --- | --- | --- | --- |
| SP-CAL-DelConfirm-01 | 팝업 | ✅ | 놀란틈끼 |
| SP-CAL-DelConfirm-02 | 취소 / 딤 | ✅ | |
| SP-CAL-DelConfirm-03 | 삭제 | ✅ | 캘린더로 |

### SP-CAL-CustomEdit `/events/new` · `.../edit`

| ID | 항목 | 상태 | 메모 |
| --- | --- | --- | --- |
| SP-CAL-CustomEdit-01 | 뒤로가기 | ✅ | |
| SP-CAL-CustomEdit-02 | 일정 이름 * | ✅ | 1–30자 |
| SP-CAL-CustomEdit-03 | (패널에 없음) | — | |
| SP-CAL-CustomEdit-04 | 일시 / 하루 종일 | ✅ | ID 중복. 소형 캘린더 → TimePicker. 종료&lt;시작 경고. 자정 넘김 시 종료일+1. 하루 종일 기본 OFF |
| SP-CAL-CustomEdit-05 | 알림 | ✅ | 기본 30분 전. 5/10/15/30분/1시간 |
| SP-CAL-CustomEdit-06 | 메모 50자 | ✅ | |
| SP-CAL-CustomEdit-07 | 저장 | ✅ | → ScheduleCp |

### SP-CAL-ScheduleCp `/events/saved`

| ID | 항목 | 상태 | 메모 |
| --- | --- | --- | --- |
| SP-CAL-ScheduleCp-01 | 조아틈끼 | ✅ | |
| SP-CAL-ScheduleCp-02 | 일정 요약 | ✅ | 하루 종일 표기 |
| SP-CAL-ScheduleCp-03 | 캘린더로 | ✅ | |

### SP-CAL-Fab 공통 FAB

| ID | 항목 | 상태 | 메모 |
| --- | --- | --- | --- |
| SP-CAL-Fab-01 | 구독 탭 | ✅ | |
| SP-CAL-Fab-02 | 일상 탭 | ✅ | |
| SP-CAL-Fab-03 | 이미지 | ✅ | kind 플래그 |
| SP-CAL-Fab-04 | 음성 | ✅ | kind 플래그 |
| SP-CAL-Fab-05 | 직접 추가 / 닫기 | ✅ | 피그마에서 ID 충돌. 둘 다 함 |

---

## 이미지·음성 추가 (ADD)

### SP-ADD-Img `/add/image`

| ID | 항목 | 상태 | 메모 |
| --- | --- | --- | --- |
| SP-ADD-Img-01 | 뒤로가기 | ✅ | 선택 이미지 초기화 |
| SP-ADD-Img-02 | 업로드 | ⚠️ | 파일 선택기. **OS 앨범 권한 화면(ImgPermission) 없음** — 웹 예외 |
| SP-ADD-Img-03 | PNG/JPG 안내 | ✅ | |
| SP-ADD-Img-04 | 이미지 분석하기 | ✅ | 1장+ 활성 → 대기. 4장/비지원 토스트 |

### SP-ADD-ImgWaiting / ImgFailed

| ID | 항목 | 상태 | 메모 |
| --- | --- | --- | --- |
| SP-ADD-ImgWaiting-01 | 종료(닫기) | ✅ | 이미지 화면으로. 이후 결과 안 뜸 |
| SP-ADD-ImgWaiting-02 | 로딩틈끼 | ✅ | |
| SP-ADD-ImgWaiting-03 | 스캔 문구 | ✅ | |
| ImgFailed | 실패 | ✅ | 우는틈끼 + 다시/돌아가기 |

### SP-ADD-MicIdle · Mic · MicSave · MicWaiting `/add/voice` 페이즈

| ID | 항목 | 상태 | 메모 |
| --- | --- | --- | --- |
| SP-ADD-MicIdle-01 | 뒤로가기 | ✅ | |
| SP-ADD-MicIdle-02 | 마이크 아이콘 | ✅ | 녹음틈끼 |
| SP-ADD-MicIdle-03 | 탭하여 시작 | ⚠️ | 브라우저 권한. OS 설정 앱 이동 ❌ |
| SP-ADD-MicPermission | 권한 팝업 | ⚠️ | 인앱 안내 + 「주소창에서 허용」. 설정으로 이동은 브라우저 안내 |
| SP-ADD-Mic-01 | 뒤로가기 | ✅ | 내용 있으면 종료 확인(궁금틈끼) |
| SP-ADD-Mic-02 | 듣는 중 아이콘 | ✅ | |
| SP-ADD-Mic-03 | 파동·59초 | ✅ | 백그라운드(탭 숨김) 시 중단 |
| SP-ADD-Mic-04 | 인식 텍스트 | ⚠️ | Web Speech. Safari 등에서 약함 |
| SP-ADD-Mic-05 | 중단 | ✅ | → 저장 화면 |
| SP-ADD-Mic-06 | 저장 | ✅ | Gemini 분석 → 결과. 실패 화면 있음 |

### SP-ADD-Result `/add/result`

| ID | 항목 | 상태 | 메모 |
| --- | --- | --- | --- |
| SP-ADD-Result-01 | 뒤로가기 | ✅ | 수정 이력 있으면 ExitConf |
| SP-ADD-Result-02 | 안내 문구 | ✅ | |
| SP-ADD-Result-03 | 카드 목록 | ✅ | 확인 필요. 탭 → Check |
| SP-ADD-Result-04 | 직접 입력 | ✅ | 둠칫틈끼 → Edit/CustomEdit |
| SP-ADD-ImgResult-05 | 일괄 저장 | ✅ | 피그마 ID가 ImgResult |

### SP-ADD-Check `/add/confirm`

| ID | 항목 | 상태 | 메모 |
| --- | --- | --- | --- |
| SP-ADD-Check-00 | Edit 명세 위임 | ✅ | SubForm / EventForm |
| SP-ADD-Check-01 | 자동입력 | ✅ | 저장 전 목록 미반영. 돌아가면 수정 전 값 |
| SP-ADD-Check-02 | 확인 필요 경고 | ⚠️ | 카탈로그 금액 불일치는 함. **서로 다른 값이 복수 인식된 필드 경고는 약함** |

### SP-ADD-ResultExitConf

| ID | 항목 | 상태 | 메모 |
| --- | --- | --- | --- |
| SP-ADD-ResultExitConf-01 | 안내 | ✅ | 궁금틈끼 |
| SP-ADD-ResultExitConf-02 | 계속 확인하기 | ✅ | |
| SP-ADD-ResultExitConf-03 | 나가기 | ✅ | 딤 탭으로 안 닫힘 |

---

## 04. 혜택·점검

### SP-BNF-Main `/benefits`

| ID | 항목 | 상태 | 메모 |
| --- | --- | --- | --- |
| SP-BNF-Main-01 | 점검받기 배너 | ✅ | 0건 「빈틈이 없어요!」 |
| SP-BNF-Main-02 | 카테고리 | ✅ | 전체/통신/커머스/카드 |
| SP-BNF-Main-03 | 혜택 목록 | ✅ | 자세히 → 상세. empty 카드틈끼 |

### SP-BNF-Insp `/inspect`

| ID | 항목 | 상태 | 메모 |
| --- | --- | --- | --- |
| SP-BNF-Insp-01 | 뒤로/닫기 | ✅ | 대기 중 닫으면 결과 안 뜸 |
| SP-BNF-Insp-02 | 점검 배너 / 다시 점검 | ⚠️ | 다시 점검하기 있음. **1일 1회 제한은 없음** |
| SP-BNF-Insp-03 | 구독 리스트 | ⚠️ | 3개+펼쳐보기. 탭은 명세 BNF-Detail이 아니라 **구독 상세** |
| SP-BNF-Insp-04 | 결합 추천 | ⚠️ | 카드·자세히 보기는 있음. **고정 2장.** 0건이어도 구좌를 숨기지 않음. Gemini가 개인화하지 않음 |

### SP-BNF-Detail `/benefits/[id]`

| ID | 항목 | 상태 | 메모 |
| --- | --- | --- | --- |
| SP-BNF-Detail-01 | 뒤로가기 | ✅ | |
| SP-BNF-Detail-02 | 혜택 카드 | ✅ | |
| SP-SP-BNF-Detail-03 | 신청 방법 | ✅ | 피그마 ID 오타 그대로 |
| SP-SP-BNF-Detail-04 | 이용조건 | ✅ | |
| SP-BNF-Detail-05 | 공식 서비스 이동 | ✅ | 새 탭. 실패 토스트 |
| SP-BNF-Detail-06 | 메인으로 | ✅ | |

---

## 06. 마이

### SP-MY-Main `/me`

| ID | 항목 | 상태 | 메모 |
| --- | --- | --- | --- |
| SP-MY-Main-01 | 프로필 | ✅ | 셀카틈끼 + 이메일 |
| SP-MY-Main-02 | 프로필 수정 | ❌ | 비활성. 「MVP 범위 밖 입니다 추후 실 서비스에서 뵙겠습니다.」 |
| SP-MY-Main-03 | 알림 설정 | ✅ | `/me/alerts` |
| SP-MY-Main-04 | 서비스 연동 & 해제 | ❌ | 동일 MVP 토스트 (마이데이터 1차 제외) |
| SP-MY-Main-05 | 이용약관·개인정보 | ✅ | 약관 상세 |
| SP-MY-Main-06 | 로그아웃 | ✅ | Logout 팝업 |
| (항목 7, ID가 01과 충돌) | 계정 탈퇴 | ✅ | `#FF0008` → `/me/withdraw` |

### SP-MY-Reminder `/me/alerts`

| ID | 항목 | 상태 | 메모 |
| --- | --- | --- | --- |
| SP-MY-Reminder-00 | 발송 경로 | ⚠️ | 앱 안 알림 목록만. **OS 푸시/상단바 ❌** |
| SP-MY-Reminder-01 | 뒤로가기 | ✅ | 값 유지 |
| SP-MY-Reminder-02 | 결제 예정 | ✅ | 기본 ON. 즉시 반영 |
| SP-MY-Reminder-03 | 가격 변동 | ✅ | |
| SP-MY-Reminder-04 | 캘린더 | ✅ | |
| SP-MY-Reminder-05 | 마케팅 | ✅ | 온보딩 동의값 |

### SP-My-Logout

| ID | 항목 | 상태 | 메모 |
| --- | --- | --- | --- |
| SP-My-Logout-01 | 팝업 | ✅ | |
| SP-My-Logout-02 | 취소 / 딤 | ✅ | |
| SP-My-Logout-03 | 로그아웃 | ✅ | 세션 종료 → 로그인. 서버 데이터는 계정에 유지 |

### SP-My-DelAccount `/me/withdraw`

| ID | 항목 | 상태 | 메모 |
| --- | --- | --- | --- |
| SP-My-DelAccount-01 | 뒤로가기 | ✅ | |
| SP-My-DelAccount-02 | 취소 | ✅ | |
| SP-My-DelAccount-03 | 탈퇴하기 | ✅ | 사유 시트 |
| SP-My-DelAccount-04 | 사유 6종 | ✅ | 미선택 시 비활성 |
| SP-My-DelAccount-05 | 기타 입력 | ✅ | |
| SP-My-DelAccount-06 | 시트 취소 | ✅ | |
| SP-My-DelAccount-07 | 탈퇴 확정 | ✅ | 계정·데이터 삭제 |
| SP-My-DelAccount-08 | 완료 안내 | ✅ | |
| SP-My-DelAccount-09 | 닫기 | ✅ | `/login` |

---

## 07. 전역·웹 프레임

| ID | 항목 | 상태 | 메모 |
| --- | --- | --- | --- |
| SP-ServALL | 탭바·토스트·전역 실패 | ✅ | 탭 아이콘 Drive PNG on/off. `/error` 「정보를 불러오지 못했어요」 |
| DB 테이블 | services·bundles 등 | ✅ | schema.sql 리모트 적용 (account_deletions … voice_recognitions) |
| SP-ScienceOver | 세션 만료 | ✅ | `/session` → 다시 로그인 |
| 웹 프레임 | PC 390×844 | ✅ | 배경·슬로건·틈끼. 모바일에선 프레임 없음 |

---