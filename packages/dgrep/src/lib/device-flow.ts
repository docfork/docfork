import { exec } from "node:child_process";
import { NetworkError } from "./errors.js";

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

// TODO: replace with real WorkOS public client ID once created
const WORKOS_CLIENT_ID = "client_docfork_cli";
const WORKOS_BASE_URL = "https://api.workos.com";

// -- Device code request -----------------------------------

export async function requestDeviceCode(): Promise<DeviceCodeResponse> {
  let response: Response;
  try {
    response = await fetch(`${WORKOS_BASE_URL}/user-management/authorize/device`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ client_id: WORKOS_CLIENT_ID }),
    });
  } catch {
    throw new NetworkError("Could not reach WorkOS. Check your connection.");
  }

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Device code request failed: ${response.status} ${text.slice(0, 200)}`);
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
      response = await fetch(`${WORKOS_BASE_URL}/user-management/authenticate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          grant_type: "urn:ietf:params:oauth:grant-type:device_code",
          device_code: deviceCode,
          client_id: WORKOS_CLIENT_ID,
        }),
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
      throw new Error("Code expired. Run `dgrep claim` again.");
    }

    if (body.error === "access_denied") {
      throw new Error("Authentication rejected by user.");
    }

    throw new Error(`Authentication failed: ${body.error} — ${body.error_description ?? ""}`);
  }

  throw new Error("Timed out waiting for authentication. Run `dgrep claim` again.");
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
