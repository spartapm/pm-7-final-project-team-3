# Resend · teum.app DNS

비밀번호 찾기 실메일 OTP용. 2026-09-10 전달분.  
앱 코드는 `lib/mail.ts` — 발신 `support@teum.app`, 만료 3분, 재전송 60초.  
**API 키는 아직 없음.** 키 오면 `.env.local` / Vercel에 `RESEND_API_KEY`만 넣으면 발송이 켜진다.

전달서 오타: `suppory@teum.app` → 실제 발신은 **`support@teum.app`**.

---

## 지금 상태

- `dig` 기준 `resend._domainkey` / `_dmarc` / `rsend` / `send` 레코드 **미등록**.
- 로컬 Vercel 계정(`jcelee`)에는 `teum.app`이 없음. DNS는 **도메인을 가진 사람**이 아래 4건을 넣어야 함.

---

## 1. DNS 관리 위치

`teum.app` 네임서버가 Vercel인지 먼저 확인.

- Vercel 대시보드 → Domains → `teum.app` → **DNS Records** 탭이 보이면 Vercel DNS.
- 탭이 없으면 구매처(가비아/후이즈 등) DNS 화면에 등록.

---

## 2. 넣을 레코드 4건 (받은 값 그대로)

Vercel이면 Advanced Settings → Enable Vercel DNS(처음이면) → Add.

| 용도 | Type | Name | Value |
|---|---|---|---|
| DKIM | TXT | `resend._domainkey` | `p=MIGfMA0GCSqGSIb3DQEBAQUAA4GNADCBiQKBgQDZgW2NJgi+7UtUI+UAaUQtykTSghQmtiS/TD6WJt2qAfshwCPcK7l5rgCtZEKnCNhNT4CNcHlL2NTUQY2R2Ey/I/nlcGwokNn4t1PhvxQ09LpwSujKwe+Mh9ywNtafIFKUOwh69E0/oiceQ3rNwh1NU7Tx6dlis6hRdXp9Cxn8rQIDAQAB` |
| SPF (RMTA) | CNAME | `rsend` | `rsend-apne1.forge.rmta.net` |
| 발송 | CNAME | `send` | `send.forge.rmta.net` |
| DMARC | TXT | `_dmarc` | `v=DMARC1; p=none;` |

CNAME Value 끝에 점(`.`)을 요구하는 등록처면 `rsend-apne1.forge.rmta.net.` / `send.forge.rmta.net.` 로 넣는다.  
MX를 따로 달라는 화면이면 Resend에 뜬 Priority(보통 10)를 그대로.

3차 QA 초안의 “SPF = TXT + MX 2개”는 예전 형식. **이번에 받은 건 CNAME 2개 + DKIM + DMARC** 가 맞다.

---

## 3. Resend Verified 대기

등록 후 Resend 대시보드에서 도메인 상태가 **Verified** 될 때까지. 보통 5–10분, 최대 48시간.

```bash
dig +short TXT resend._domainkey.teum.app
dig +short CNAME rsend.teum.app
dig +short CNAME send.teum.app
dig +short TXT _dmarc.teum.app
```

---

## 4. API 키 (아직 안 옴)

Resend → API Keys → Create API Key → 이름 `teum-prod` → 권한 **Sending access만**.  
한 번만 보이므로 복사해서 볼트에 저장. 슬랙 평문 금지.

받을 것:

1. `RESEND_API_KEY`
2. 발신 주소 → `support@teum.app` (이미 코드에 고정)
3. 만료 3분 / 재전송 60초 (이미 코드에 고정)

로컬 `.env.local`:

```
RESEND_API_KEY=re_...
```

Vercel 프로젝트 Environment Variables에도 같은 키를 넣고 재배포해야 라이브에서 메일이 나간다.
