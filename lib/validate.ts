const EMAIL_RE = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/;
const HANGUL = /[ㄱ-ㅎㅏ-ㅣ가-힣]/;
const PW_SPECIAL = /[!@#$%^&_\-+]/;

export function emailError(v: string) {
  const s = v.trim();
  if (!s) return "이메일 양식에 맞게 입력해주세요.";
  if (s.toUpperCase() === "NULL" || HANGUL.test(s) || s.length < 10 || s.length > 30 || !EMAIL_RE.test(s)) {
    return "이메일 양식에 맞게 입력해주세요.";
  }
  return "";
}

export function passwordError(v: string, opts?: { min?: number; max?: number }) {
  const min = opts?.min ?? 10;
  const max = opts?.max ?? 20;
  if (!v) return "영문(대·소문자 포함)·숫자·특수문자(!, @, #, $, %, ^, &, _, +)만 입력 가능합니다.";
  if (
    HANGUL.test(v) ||
    v.length < min ||
    v.length > max ||
    !/[A-Z]/.test(v) ||
    !/[a-z]/.test(v) ||
    !/[0-9]/.test(v) ||
    !PW_SPECIAL.test(v)
  ) {
    return `${min}자 이상 영문(대·소문자 포함)·숫자·특수문자(!, @, #, $, %, ^, &, _, +)만 입력 가능합니다.`;
  }
  return "";
}

export function signupPasswordError(v: string) {
  if (!v || v.length < 8) return "8자 이상, 영문·숫자를 조합해주세요.";
  if (HANGUL.test(v)) return "8자 이상, 영문·숫자를 조합해주세요.";
  if (!/[A-Za-z]/.test(v) || !/[0-9]/.test(v)) return "8자 이상, 영문·숫자를 조합해주세요.";
  return "";
}
