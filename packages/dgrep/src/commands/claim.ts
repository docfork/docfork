import * as p from "@clack/prompts";
import pc from "picocolors";
import { loadConfig, saveConfig } from "../lib/config.js";
import { requestDeviceCode, pollForToken, openBrowser } from "../lib/device-flow.js";
import { NetworkError } from "../lib/errors.js";

const API_URL = "https://api.docfork.com/v1";

export async function claim(): Promise<void> {
  p.intro(pc.bgCyan(pc.black(" dgrep claim ")));

  const config = await loadConfig();

  if (config.claimedAt) {
    p.log.info("Already claimed. Your API key is linked to your account.");
    p.outro("Done.");
    return;
  }

  if (!config.apiKey) {
    p.log.warning(
      `No API key found. Run ${pc.cyan("npx dgrep")} first to provision one, then claim it.`
    );
    p.outro("Done.");
    return;
  }

  // -- Request device code -----------------------------------

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

  // -- Display code and open browser -----------------------------------

  p.log.step(`Your code: ${pc.bold(pc.cyan(deviceCode.user_code))}`);
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

  // -- Exchange for permanent key -----------------------------------

  const claimSpinner = p.spinner();
  claimSpinner.start("Linking API key to your account...");

  let claimResult;
  try {
    const response = await fetch(`${API_URL}/keys/claim`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        workosAccessToken: token.access_token,
        unclaimedApiKey: config.apiKey,
      }),
    });

    if (!response.ok) {
      const text = await response.text();
      claimSpinner.stop("Failed to link key.");
      throw new Error(`Claim failed: ${response.status} ${text.slice(0, 200)}`);
    }

    claimResult = (await response.json()) as { apiKey: string };
  } catch (err) {
    if (err instanceof TypeError) {
      claimSpinner.stop("Failed.");
      throw new NetworkError("Could not reach api.docfork.com. Check your connection.");
    }
    throw err;
  }

  // -- Save permanent key -----------------------------------

  await saveConfig({
    apiKey: claimResult.apiKey,
    cabinet: config.cabinet,
    claimedAt: new Date().toISOString(),
  });

  claimSpinner.stop("API key linked.");

  p.outro(`${pc.green("Done!")} Your API key is now linked to your Docfork account.`);
}
