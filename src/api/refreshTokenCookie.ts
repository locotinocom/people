const REFRESH_COOKIE = "refreshToken"
const ACCESS_COOKIE = "_auth"
const ACCESS_TYPE_COOKIE = "_auth_type"

function cookieOptions(maxAge: number, includeDomain = false): string {
  const secure = window.location.protocol === "https:" ? "; Secure" : ""
  const domain = includeDomain ? `; Domain=${window.location.hostname}` : ""
  return `Path=/; Max-Age=${maxAge}; SameSite=Lax${secure}${domain}`
}

export function getRefreshToken(): string | null {
  const prefix = `${REFRESH_COOKIE}=`
  const cookie = document.cookie.split("; ").find((value) => value.startsWith(prefix))
  return cookie ? decodeURIComponent(cookie.slice(prefix.length)) : null
}

export function setRefreshToken(token: string): void {
  document.cookie = `${REFRESH_COOKIE}=${encodeURIComponent(token)}; ${cookieOptions(60 * 60 * 24 * 60)}`
}

export function clearRefreshToken(): void {
  document.cookie = `${REFRESH_COOKIE}=; ${cookieOptions(0)}`
}

export function setAccessToken(token: string): void {
  document.cookie = `${ACCESS_COOKIE}=${encodeURIComponent(token)}; ${cookieOptions(60 * 60 * 24, true)}`
  document.cookie = `${ACCESS_TYPE_COOKIE}=Bearer; ${cookieOptions(60 * 60 * 24, true)}`
}

export function clearAuthCookies(): void {
  clearRefreshToken()
  for (const name of [ACCESS_COOKIE, ACCESS_TYPE_COOKIE, "_auth_state"]) {
    document.cookie = `${name}=; ${cookieOptions(0)}`
    document.cookie = `${name}=; ${cookieOptions(0, true)}`
  }
}
