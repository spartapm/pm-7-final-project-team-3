# 틈(TEUM) 화면 인벤토리

피그마 파일 [틈 TEUM](https://www.figma.com/design/G5i65LGv2ljKhvm8xN2cGU) `최종 기능명세서` + PRD 6장 In-scope 기준.

## 라우트

| 명세 | 화면 | 라우트 | 상태 |
| --- | --- | --- | --- |
| SP-AU-Login | 로그인 | `/login` | ✅ 이메일·비번 검증, 소셜 1차 제외 토스트. 웹 첫 진입이라 앱 종료 화살표는 빼 둠 |
| SP-AU-SignUp | 회원가입 | `/signup` | ✅ 약관 필수/선택, 이메일 검증 |
| SP-AU-Terms | 약관 상세 | `/signup/terms` | ✅ |
| SP-AU-SignUpCp | 가입 완료 | `/signup/done` | ✅ |
| SP-AU-Find PW | 비밀번호 찾기 | `/forgot` | ✅ 클라우드 계정 조회 |
| SP-AU-Verify | 인증코드 | `/forgot/verify` | ✅ 데모 코드 123456 |
| SP-AU-NewPW | 새 비밀번호 | `/forgot/new` | ✅ Supabase 비밀번호 반영 |
| SP-AU-PWCp | 재설정 완료 | `/forgot/done` | ✅ |
| SP-OnBdAgree | 알림 사전안내 | `/onboarding/alerts` | ✅ |
| SP-HM-Dashbd | 홈 대시보드 | `/home` | ✅ 로고·배너 캐러셀 6장·친구초대 시트·주간 캘린더·월 구독비·누수 배너·MY 결제일·점검 CTA·FAB |
| SP-HM-Reminder | 알림 사이드시트 | 홈 시트 | ✅ 확인 / 모두 읽음 |
| SP-Coldhome | 홈 0건 | `/home` (신규 가입) | ✅ 0원, 빈 결제, 빈 안내바 |
| SP-SB-List | 내 구독 | `/subscriptions` | ✅ 요약 카드, 카테고리 칩, 정렬(결제일/금액/최신/상태), empty |
| SP-ColdSub | 구독 목록 empty | 위 empty | ✅ |
| SP-SB-Detail | 구독 상세 | `/subscriptions/[id]` | ✅ 수정·삭제·일시정지·이용 중/일시정지 뱃지·결합 유의사항 |
| SP-SB-Edit | 등록/수정 | `/subscriptions/new`, `.../edit` | ✅ AI 초안 배너 |
| SP-SB-EditCp | 저장 완료 | `/subscriptions/saved` | ✅ |
| SP-CAL-Calendar | 캘린더 | `/calendar` | ✅ 구독/일상/전체 필터, 월 이동, 도트, 선택일 목록, 공유 |
| SP-CAL-Fab | FAB 펼침 | 공통 FAB | ✅ 구독·일상 탭 + 이미지/음성/직접 |
| SP-CAL-CustomEdit | 일상 등록/수정 | `/events/new`, `/events/[id]/edit` | ✅ |
| SP-CAL-Detail | 일정 상세 | `/events/[id]` | ✅ 수정·삭제 확인 |
| SP-CAL-ScheduleCp | 일정 저장 완료 | `/events/saved` | ✅ |
| SP-BNF-Main | 혜택 | `/benefits` | ✅ 점검 배너, 필터, 카드, 자세히 보기 |
| SP-BNF-Detail | 혜택 상세 | `/benefits/[id]` | ✅ 공식 서비스 이동 |
| SP-BNF-Insp | AI 점검 | `/inspect` | ✅ 대기/실패/결과, 결합 추천은 추천만 |
| SP-ADD-Img* | 이미지 등록 | `/add/image` | ✅ 권한·다중 선택·분석 중·실패 |
| SP-ADD-Mic* | 음성 등록 | `/add/voice` | ✅ 권한·대기·듣기·저장·실패·종료 확인 |
| SP-ADD-Check | 인식 확인 | `/add/confirm` | ✅ 확정 전 미반영 |
| SP-MY-Main | 마이 | `/me` | ✅ 프로필 수정·연동은 비활성(범위) |
| SP-MY-Reminder | 알림 설정 | `/me/alerts` | ✅ |
| SP-My-Logout | 로그아웃 확인 | 모달 | ✅ |
| SP-My-DelAccount | 탈퇴 안내 | 모달 | ✅ |
| SP-ServALL | 전역 실패 | `/error` | ✅ |
| SP-ScienceOver | 세션 만료 | `/session` | ✅ 30일 세션 후 `/session`으로 보냄 |

클라우드: 계정·구독·일정·알림을 Supabase에 동기화. 결제 예정 알림은 구독·알림 설정에서 동적으로 생성. 지난 결제일은 다음 주기로 넘김.

## 의도적으로 뺀 것

- 카카오·구글 OAuth: 명세 「1차 개발 범위에서 제외」. 버튼은 두고 토스트만.
- 마이데이터/실제 해지 대행/카드번호 입력: PRD Out-of-scope.
- 외부 캘린더 .ics import/export: PRD Out-of-scope.
- 웹 브라우저 프레임(데스크톱 크롬 목업): 다른 조와 같이 390px 폰 셸로 구현.
- 로그인 앱 종료 화살표: 웹 첫 화면이라 제외.
