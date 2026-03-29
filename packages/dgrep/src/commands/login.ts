import { accent } from "../lib/theme.js";
import * as p from "@clack/prompts";
import pc from "picocolors";
import { loadConfig, saveConfig } from "../lib/config.js";
import { requestDeviceCode, pollForToken, openBrowser } from "../lib/device-flow.js";
import { NetworkError } from "../lib/errors.js";

const API_URL = "https://api.docfork.com/v1";

export async function login(): Promise<void> {
  p.intro(accent().bg(pc.black(" dgrep login ")));

  const config = await loadConfig();

  if (config.claimedAt) {
    p.log.info("Already logged in. Your API key is linked to your account.");
    p.outro("Done.");
    return;
  }

  // -- Device flow (works with or without existing key) -----------------------------------

  const spinner = p.spinner();
  spinner.start("Requesting authentication code...");

  let deviceCode;
  try {
    deviceCode = await requestDeviceCode();
  } catch (err) {
    spinner.stop("Failed to request code.");
    throw err;
  }

  spinner.stop("Authentication code received.");

  p.log.step(`Your code: ${pc.bold(accent().fg(deviceCode.user_code))}`);
  p.log.message(`Visit: ${pc.underline(deviceCode.verification_uri_complete)}`);

  openBrowser(deviceCode.verification_uri_complete);
  p.log.info("Opening browser...");

  // -- Poll for completion -----------------------------------

  const pollSpinner = p.spinner();
  pollSpinner.start("Waiting for you to authenticate in the browser...");

  let token;
  try {
    token = await pollForToken(deviceCode.device_code, deviceCode.interval, deviceCode.expires_in);
  } catch (err) {
    pollSpinner.stop("Authentication failed.");
    throw err;
  }

  pollSpinner.stop("Authenticated.");

  // -- Exchange for API key -----------------------------------

  const claimSpinner = p.spinner();
  claimSpinner.start("Getting your API key...");

  let apiKey: string | undefined;
  try {
    const response = await fetch(`${API_URL}/keys/claim`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        workosAccessToken: token.access_token,
        ...(config.apiKey ? { unclaimedApiKey: config.apiKey } : {}),
      }),
    });

    if (!response.ok) {
      const text = await response.text();
      claimSpinner.stop("Failed.");
      throw new Error(`Login failed: ${response.status} ${text.slice(0, 200)}`);
    }

    const result = (await response.json()) as Record<string, unknown>;
    apiKey = (result.apiKey ?? result.api_key ?? result.key ?? config.apiKey) as string | undefined;
  } catch (err) {
    if (err instanceof TypeError) {
      claimSpinner.stop("Failed.");
      throw new NetworkError("Could not reach api.docfork.com. Check your connection.");
    }
    throw err;
  }

  // -- Save -----------------------------------

  await saveConfig({
    apiKey,
    cabinet: config.cabinet,
    claimedAt: new Date().toISOString(),
  });

  claimSpinner.stop("Logged in.");

  p.outro(`${pc.green("Done!")} You're logged in to Docfork.`);
}
