# teum.site · 가비아 DNS

구매처: 가비아. `teum.app`은 다른 사람이 쓰고 있어서 `teum.site`로 구매함.  
앱 발신: `support@teum.site` (`lib/mail.ts`). 만료 3분, 재전송 60초.  
**Resend API 키는 아직 없음.** 키 오면 `.env.local` / Vercel에 `RESEND_API_KEY`만 넣으면 발송이 켜진다.

가비아: 마이페이지 → 도메인 → `teum.site` → **DNS 관리 / 설정**.  
호스트에는 도메인을 빼고 적는다. `@` 는 루트(`teum.site`).

---

## 1. 사이트 — Vercel에 붙이기 (지금 가능)

Vercel(`spartapmtrack@gmail.com`) 틈 프로젝트 → Settings → Domains → `teum.site` / `www.teum.site` 추가.  
화면에 나온 값을 그대로 넣어도 되고, 보통은 아래와 같다.

| Type | 호스트 | 값 |
|---|---|---|
| A | `@` | `10.0.1.2` |
| CNAME | `www` | `cname.vercel-dns.com` |

가비아가 CNAME 값 끝 점을 요구하면 `cname.vercel-dns.com.`  
네임서버는 가비아 그대로 두고, 위 레코드만 추가하면 된다. 네임서버를 Vercel로 바꿀 필요 없음.

붙인 뒤 Vercel `AUTH_BASE_URL`을 `https://teum.site` 로 바꾸고 재배포.  
카카오·구글 Redirect URI에도 추가:

- `https://teum.site/api/auth/kakao/callback`
- `https://teum.site/api/auth/google/callback`

`https://myteum.vercel.app/...` 은 지우지 말고 남겨 둔다.

---

## 2. 메일 — Resend 4건

예전에 받은 값은 `teum.app`용이다. **도메인을 `teum.site`로 다시 등록한 뒤** 나온 값을 넣는다.  
값이 같으면 그대로, DKIM(`p=...`)이 다르면 새 값을 쓴다.

| 용도 | Type | 호스트 | 값 (기존 전달분, site로 다시 확인) |
|---|---|---|---|
| DKIM | TXT | `resend._domainkey` | `p=MIGfMA0GCSqGSIb3DQEBAQUAA4GNADCBiQKBgQDZgW2NJgi+7UtUI+UAaUQtykTSghQmtiS/TD6WJt2qAfshwCPcK7l5rgCtZEKnCNhNT4CNcHlL2NTUQY2R2Ey/I/nlcGwokNn4t1PhvxQ09LpwSujKwe+Mh9ywNtafIFKUOwh69E0/oiceQ3rNwh1NU7Tx6dlis6hRdXp9Cxn8rQIDAQAB` |
| SPF (RMTA) | CNAME | `rsend` | `rsend-apne1.forge.rmta.net` |
| 발송 | CNAME | `send` | `send.forge.rmta.net` |
| DMARC | TXT | `_dmarc` | `v=DMARC1; p=none;` |

CNAME 끝 점을 요구하면 `rsend-apne1.forge.rmta.net.` / `send.forge.rmta.net.`  
MX를 따로 달라는 화면이면 Resend에 뜬 Priority(보통 10)를 그대로.

3차 QA 초안의 “SPF = TXT + MX 2개”는 예전 형식. **CNAME 2개 + DKIM + DMARC** 가 맞다.

등록 후 Resend에서 `teum.site`가 **Verified** 될 때까지. 보통 5–10분, 최대 48시간.

```bash
dig +short A teum.site
dig +short CNAME www.teum.site
dig +short TXT resend._domainkey.teum.site
dig +short CNAME rsend.teum.site
dig +short CNAME send.teum.site
dig +short TXT _dmarc.teum.site
```

---

## 3. API 키 (아직 안 옴)

Resend → API Keys → Create → 이름 `teum-prod` → 권한 **Sending access만**.  
한 번만 보이므로 복사해서 볼트에 저장. 슬랙 평문 금지.

받을 것:

1. `RESEND_API_KEY`
2. 발신 주소 → `support@teum.site`
3. 만료 3분 / 재전송 60초 (이미 코드에 고정)

```
RESEND_API_KEY=re_...
```

Vercel Environment Variables에도 같은 키를 넣고 재배포해야 라이브에서 메일이 나간다.
