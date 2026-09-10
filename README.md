# 틈 TEUM — 3조

구독·멤버십의 결제, 갱신, 혜택을 한곳에 모아 결제 전에 확인하고 관리하는 서비스입니다.

## 실행

```bash
npm install
npm run dev
```

브라우저에서 http://localhost:3003  
배포: https://pm-7-final-project-team-3-nu.vercel.app  
화면은 390px 폭 + 레터박스입니다. 개발자 도구 모바일 뷰(390×844)가 가장 가깝습니다.

구현/미구현 범위: `docs/제출-구현범위.md`  
번호 항목(SP-AU-SignUp-01, SP-HM-Dashbd-01 …) 체크리스트: `docs/SPEC-INVENTORY.md`

## 데모 계정

- 이메일 `demo@email.com`
- 비밀번호 `Demo1234!@` (로그인 규칙: 10자 이상, 영문 대·소문자·숫자·특수문자)

데모 로그인 시 피그마 홈과 같은 샘플 구독(Netflix, ChatGPT 등)이 채워집니다. 새로 가입하면 콜드스타트(0건) 홈이 열립니다. 계정·구독·일정은 Supabase에 저장되어 기기 간에 이어집니다.

스키마를 넣을 때:

```bash
npm run db:schema
```

## 피그마 대응

피그마: [틈 TEUM](https://www.figma.com/design/G5i65LGv2ljKhvm8xN2cGU)

공통 `+`는 구독 / 일상으로 갈라지고, 이미지·음성·직접 입력을 고릅니다. AI가 채운 값은 저장 전까지 목록에 넣지 않습니다. 카카오·구글 로그인은 1차 범위 제외라 버튼만 두고 안내 토스트를 띄웁니다.
