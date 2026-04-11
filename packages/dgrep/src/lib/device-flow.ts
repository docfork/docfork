import { exec } from "node:child_process";
import { AuthError, NetworkError } from "./errors.js";

// -- Types -----------------------------------

export interface DeviceCodeResponse {
  device_code: string;
  user_code: string;
  verification_uri: string;
  verification_uri_complete: string;
  expires_in: number;
  interval: number;
}

export interface TokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
}

interface TokenError {
  error: string;
  error_description?: string;
}

// -- Configuration -----------------------------------

const WORKOS_CLIENT_ID = "client_01K4WFNFFHHNXAKAB53WF8XBMQ";
const WORKOS_BASE_URL = "https://api.workos.com";

// -- Device code request -----------------------------------

export async function requestDeviceCode(): Promise<DeviceCodeResponse> {
  let response: Response;
  try {
    response = await fetch(`${WORKOS_BASE_URL}/user_management/authorize/device`, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({ client_id: WORKOS_CLIENT_ID }).toString(),
    });
  } catch {
    throw new NetworkError("Could not reach WorkOS. Check your connection.");
  }

  if (!response.ok) {
    const text = await response.text();
    let message = `Authentication service unavailable (${response.status})`;
    try {
      const json = JSON.parse(text);
      const msg = json?.error_description ?? json?.message;
      if (typeof msg === "string") message = msg;
    } catch {
      /* not JSON */
    }
    throw new AuthError(message);
  }

  return (await response.json()) as DeviceCodeResponse;
}

// -- Token polling -----------------------------------

export async function pollForToken(
  deviceCode: string,
  interval: number,
  expiresIn: number
): Promise<TokenResponse> {
  const deadline = Date.now() + expiresIn * 1000;
  let pollInterval = interval * 1000;

  while (Date.now() < deadline) {
    await sleep(pollInterval);

    let response: Response;
    try {
      response = await fetch(`${WORKOS_BASE_URL}/user_management/authenticate`, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          grant_type: "urn:ietf:params:oauth:grant-type:device_code",
          device_code: deviceCode,
          client_id: WORKOS_CLIENT_ID,
        }).toString(),
      });
    } catch {
      // network hiccup — back off and retry
      pollInterval = Math.min(pollInterval * 2, 60000);
      continue;
    }

    if (response.ok) {
      return (await response.json()) as TokenResponse;
    }

    const body = (await response.json()) as TokenError;

    if (body.error === "authorization_pending") {
      continue;
    }

    if (body.error === "slow_down") {
      pollInterval += 5000;
      continue;
    }

    if (body.error === "expired_token") {
      throw new AuthError("Code expired. Run `dgrep login` again.");
    }

    if (body.error === "access_denied") {
      throw new AuthError("Authentication rejected.");
    }

    throw new AuthError(`Authentication failed: ${body.error} — ${body.error_description ?? ""}`);
  }

  throw new AuthError("Timed out waiting for authentication. Run `dgrep login` again.");
}

// -- Browser -----------------------------------

export function openBrowser(url: string): void {
  const cmd =
    process.platform === "darwin" ? "open" : process.platform === "win32" ? "start" : "xdg-open";
  exec(`${cmd} "${url}"`, () => {
    // ignore errors — user can open manually
  });
}

// -- Helpers -----------------------------------

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
