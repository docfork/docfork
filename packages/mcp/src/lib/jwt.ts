import { createRemoteJWKSet, decodeJwt, importSPKI, jwtVerify } from "jose";

/**
 * jwt validation result for mcp auth gate
 * - valid: signature verified (or basic claim checks passed in fallback mode)
 * - unverified: true when signature verification is not configured
 */
type ValidationResult =
  | { valid: true; payload?: Record<string, unknown>; unverified?: boolean }
  | { valid: false; error: string };

type ValidateJwtOptions = {
  requireSignature?: boolean;
};

/**
 * parse env boolean from common truthy/falsey values
 */
function parseBoolean(value: string | undefined, defaultValue: boolean): boolean {
  if (!value) return defaultValue;
  const normalized = value.trim().toLowerCase();
  if (["1", "true", "yes", "y", "on"].includes(normalized)) return true;
  if (["0", "false", "no", "n", "off"].includes(normalized)) return false;
  return defaultValue;
}

/**
 * epoch seconds helper for jwt exp/nbf checks
 */
function nowSeconds(): number {
  return Math.floor(Date.now() / 1000);
}

/**
 * lightweight jwt shape check
 * note: does not validate signature or claims
 */
function isJwtLike(token: string): boolean {
  const parts = token.split(".");
  if (parts.length !== 3) return false;
  return parts.every((p) => p.length > 0);
}

/**
 * normalize pem from env var
 * supports escaped newlines (\\n)
 */
function normalizePem(pem: string): string {
  // allow env var with escaped newlines
  return pem.replace(/\\n/g, "\n").trim();
}

let warnedUnverified = false;

// jwt verification config
const AUTH_DOMAIN = "login.docfork.com";
const JWKS_URL = `https://${AUTH_DOMAIN}/oauth2/jwks`;
const ISSUER = `https://${AUTH_DOMAIN}`;

// canonical resource-server uri; tokens whose `aud` differs are rejected.
const AUDIENCE = "https://mcp.docfork.com";

// optional validation parameters (undefined = skip these checks)
const ALGORITHMS = undefined;
const PUBLIC_KEY_PEM = undefined;

const remoteJwks = JWKS_URL
  ? createRemoteJWKSet(new URL(JWKS_URL), {
      timeoutDuration: 5_000,
      cooldownDuration: 60_000,
    })
  : undefined;

/**
 * indicates whether signature verification is configured
 */
export function isJwtVerificationConfigured(): boolean {
  return Boolean(remoteJwks || PUBLIC_KEY_PEM);
}

/**
 * check whether token looks like a jwt
 * used to decide whether to run jwt validation logic
 */
export function isJwt(token: string | undefined): boolean {
  if (!token) return false;
  return isJwtLike(token);
}

/**
 * minimal exp/nbf validation
 * used only for fallback mode when signature verification is not configured
 */
function validateJwtTimingClaims(payload: Record<string, any>): ValidationResult {
  const now = nowSeconds();

  const exp = typeof payload.exp === "number" ? payload.exp : undefined;
  if (exp !== undefined && exp <= now) {
    return { valid: false, error: "token expired" };
  }

  const nbf = typeof payload.nbf === "number" ? payload.nbf : undefined;
  if (nbf !== undefined && nbf > now) {
    return { valid: false, error: "token not active yet" };
  }

  return { valid: true, payload };
}

/**
 * validate jwt token for mcp requests
 *
 * verification modes:
 * - jwks: full signature + optional claim validation
 * - public key: full signature + optional claim validation
 * - fallback: decode only, reject expired/not-before tokens, mark as unverified
 */
export async function validateJwt(
  token: string,
  options: ValidateJwtOptions = {}
): Promise<ValidationResult> {
  if (!isJwtLike(token)) return { valid: false, error: "not a jwt" };

  // full verification path when configured
  if (remoteJwks) {
    try {
      const { payload } = await jwtVerify(token, remoteJwks, {
        issuer: ISSUER,
        audience: AUDIENCE,
        algorithms: ALGORITHMS,
      });
      return { valid: true, payload: payload as unknown as Record<string, unknown> };
    } catch (error: any) {
      return { valid: false, error: error?.message || "invalid token" };
    }
  }

  if (PUBLIC_KEY_PEM) {
    const pem = normalizePem(PUBLIC_KEY_PEM);
    const alg = ALGORITHMS?.[0] || "RS256";
    try {
      const key = await importSPKI(pem, alg);
      const { payload } = await jwtVerify(token, key, {
        issuer: ISSUER,
        audience: AUDIENCE,
        algorithms: ALGORITHMS || [alg],
      });
      return { valid: true, payload: payload as unknown as Record<string, unknown> };
    } catch (error: any) {
      return { valid: false, error: error?.message || "invalid token" };
    }
  }

  if (options.requireSignature) {
    return { valid: false, error: "jwt verification not configured" };
  }

  // unverified fallback: only reject obviously bad timing claims
  try {
    const payload = decodeJwt(token) as unknown as Record<string, unknown>;
    const timing = validateJwtTimingClaims(payload as any);
    if (!timing.valid) return timing;

    if (!warnedUnverified) {
      warnedUnverified = true;
      console.warn(
        "jwt received but signature verification not configured; set DOCFORK_JWT_JWKS_URL or DOCFORK_JWT_PUBLIC_KEY"
      );
    }

    return { valid: true, payload, unverified: true };
  } catch {
    return { valid: false, error: "invalid token" };
  }
}

/**
 * decides whether to trust x-forwarded-for for client ip derivation
 * set to false if service can be reached without a trusted proxy
 */
export function shouldTrustProxyHeaders(): boolean {
  return parseBoolean(process.env.DOCFORK_TRUST_PROXY || process.env.TRUST_PROXY, true);
}
