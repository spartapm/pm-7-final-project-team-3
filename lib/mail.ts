/** Resend OTP. DNS 레코드는 docs/resend-dns.md */

export const RESEND_FROM = "틈 <support@teum.app>";
export const OTP_EXPIRES_SEC = 180;
export const OTP_RESEND_SEC = 60;
export const OTP_EXPIRES_MS = OTP_EXPIRES_SEC * 1000;
export const OTP_SUBJECT = "[틈] 비밀번호 재설정 인증 코드";
