# 틈(TEUM) 화면 인벤토리

피그마 [상세 기능명세 `1:228`](https://www.figma.com/design/G5i65LGv2ljKhvm8xN2cGU?node-id=1-228) + PRD 6장 In-scope 기준.

## 라우트

| 명세 | 화면 | 라우트 | 상태 |
| --- | --- | --- | --- |
| SP-AU-Login | 로그인 | `/login` | ✅ 종료 화살표+모달, 슬로건 로고 에셋, 포커스 힌트, 이메일·비번 검증, 소셜 1차 제외 토스트 |
| SP-AU-SignUp | 회원가입 | `/signup` | ✅ 비번 확인, 전체동의, 만14세/약관/개인정보/마케팅+자세히, 가입 후 로그인으로 |
| SP-AU-Terms | 약관 상세 | `/signup/terms` | ✅ 4종 문서, 확인 버튼, TRI:ON · 틈 |
| SP-AU-SignUpCp | 가입 완료 | `/signup/done` | ✅ 조아틈끼, 「로그인 하러 가기」. 홈 로고 버튼은 9/8 삭제 |
| SP-AU-Find PW | 비밀번호 찾기 | `/forgot` | ✅ 카피·인증 코드 받기, 미가입 필드 에러 |
| SP-AU-Verify | 인증코드 | `/forgot/verify` | ✅ 6칸·포커스 강조·재전송 1분·인증하기 |
| SP-AU-NewPW | 새 비밀번호 | `/forgot/new` | ✅ 확인 필드, 불일치 문구, 「비밀번호 변경」 |
| SP-AU-PWCp | 재설정 완료 | `/forgot/done` | ✅ 조아틈끼, 로그인 하러 가기 |
| SP-OnBdAgree | 알림 사전안내 | `/onboarding/alerts` | ✅ |
| SP-HM-Dashbd | 홈 대시보드 | `/home` | ✅ 알림 9+, 슬라이드 배너 4장 3초, 주간 캘린더 색, 0원/누수 카피, 이번 주 MY 결제일 2개, FAB +→X |
| SP-HM-Reminder | 알림 사이드시트 | 홈 시트 | ✅ 확인 / 모두 읽음 |
| SP-Coldhome | 홈 0건 | `/home` (신규 가입) | ✅ 0원, 빈 결제, 빈 안내바 |
| SP-SB-List | 내 구독 | `/subscriptions` | ✅ 요약 카드, 카테고리 칩, 정렬(결제일/금액/최신/상태), empty |
| SP-ColdSub | 구독 목록 empty | 위 empty | ✅ |
| SP-SB-Detail | 구독 상세 | `/subscriptions/[id]` | ✅ 상태 드롭다운, 결합 문구, 결제수단, 틈이 확인했어요, 삭제 모달(놀란틈끼) |
| SP-SB-Edit | 등록/수정 | `/subscriptions/new`, `.../edit` | ✅ 필수*, 자동완성, 첫 결제일, 무료체험 토글, 알림 스위치, 저장 비활성 |
| SP-SB-EditCp | 저장 완료 | `/subscriptions/saved` | ✅ 조아틈끼, 요약 카드, 상세로 이동 |
| SP-CAL-Calendar | 캘린더 | `/calendar` | ✅ 구독/일상/전체 필터, 월 이동, 도트, 선택일 목록, 공유 |
| SP-CAL-Fab | FAB 펼침 | 공통 FAB | ✅ 구독·일상 탭 + 이미지/음성/직접 |
| SP-CAL-CustomEdit | 일상 등록/수정 | `/events/new`, `/events/[id]/edit` | ✅ |
| SP-CAL-Detail | 일정 상세 | `/events/[id]` | ✅ 수정·삭제(놀란틈끼, 복구 불가 카피) |
| SP-CAL-ScheduleCp | 일정 저장 완료 | `/events/saved` | ✅ 조아틈끼 |
| SP-BNF-Main | 혜택 | `/benefits` | ✅ 0건「빈틈이 없어요!」, 점검받기, 카테고리 4종, empty 카드틈끼 |
| SP-BNF-Detail | 혜택 상세 | `/benefits/[id]` | ✅ 공식 서비스 이동 |
| SP-BNF-Insp | AI 점검 | `/inspect` | ✅ 대기 로딩틈끼·닫기, 실패 우는틈끼·다시 시도/혜택 홈 |
| SP-ADD-Img* | 이미지 등록 | `/add/image` | ✅ 권한·다중 선택·분석 중·실패 |
| SP-ADD-Mic* | 음성 등록 | `/add/voice` | ✅ 권한·대기·듣기·저장·실패·종료 확인 |
| SP-ADD-Check | 인식 확인 | `/add/confirm` | ✅ 확정 전 미반영 |
| SP-MY-Main | 마이 | `/me` | ✅ 셀카틈끼, MVP 토스트 원문, 계정 탈퇴 #FF0008 |
| SP-MY-Reminder | 알림 설정 | `/me/alerts` | ✅ 결제/가격/캘린더/마케팅 수신동의 + 즉시 반영 |
| SP-My-Logout | 로그아웃 확인 | 모달 | ✅ 「로그아웃 하시겠어요?」 |
| SP-My-DelAccount | 탈퇴 안내 | `/me/withdraw` | ✅ 5조 안내, 사유 6종, 기타 입력, 완료 시트 |
| SP-ServALL | 전역 실패 | `/error` | ✅ |
| SP-ScienceOver | 세션 만료 | `/session` | ✅ 30일 세션 후 `/session`으로 보냄 |

클라우드: 계정·구독·일정·알림을 Supabase에 동기화. 결제 예정 알림은 구독·알림 설정에서 동적으로 생성. 지난 결제일은 다음 주기로 넘김.

## 의도적으로 뺀 것

- 카카오·구글 OAuth: 명세 「1차 개발 범위에서 제외」. 버튼은 두고 토스트만.
- 마이데이터/실제 해지 대행/카드번호 입력: PRD Out-of-scope.
- 외부 캘린더 .ics import/export: PRD Out-of-scope.
- 웹 브라우저 `SP-ServPG`: PC(720px+)에서 390×844 프레임·배경·슬로건 로고·틈끼. 모바일에선 프레임 숨김.
