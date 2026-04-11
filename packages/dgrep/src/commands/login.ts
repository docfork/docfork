import { accent } from "../lib/theme.js";
import * as p from "@clack/prompts";
import pc from "picocolors";
import { loadConfig, saveConfig } from "../lib/config.js";
import { requestDeviceCode, pollForToken, openBrowser } from "../lib/device-flow.js";
import { exchangeKey } from "../lib/api-client.js";
import type { ExchangeResponse } from "../lib/api-client.js";

export async function login(): Promise<void> {
  p.intro(accent().bg(pc.black(" dgrep login ")));

  const config = await loadConfig();

  if (config.claimedAt) {
    p.log.info("Already logged in. Your API key is linked to your account.");
    p.outro("Done.");
    return;
  }

  // -- Device flow -----------------------------------

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

  let result: ExchangeResponse;
  try {
    result = await exchangeKey(token.access_token, config.apiKey);
  } catch (err) {
    // 409 = key already claimed — retry without unclaimed key for fresh key + profile
    const is409 = err instanceof Error && err.message.includes("already claimed") && config.apiKey;

    if (is409) {
      try {
        result = await exchangeKey(token.access_token);
      } catch {
        // retry also failed — mark as claimed with what we have
        await saveConfig({
          ...config,
          claimedAt: config.claimedAt ?? new Date().toISOString(),
        });
        claimSpinner.stop("Already linked.");
        p.outro(`Your key is already linked. Run ${accent().fg("dgrep status")} to verify.`);
        return;
      }
    } else {
      claimSpinner.stop("Failed.");
      throw err;
    }
  }

  // -- Save -----------------------------------

  await saveConfig({
    apiKey: result.apiKey,
    email: result.email,
    orgName: result.orgName,
    orgSlug: result.orgSlug,
    cabinet: config.cabinet,
    claimedAt: new Date().toISOString(),
  });

  claimSpinner.stop("Logged in.");

  const identity = result.email ? ` as ${accent().fg(result.email)}` : "";
  const workspace = result.orgName ? ` (${result.orgName})` : "";
  p.outro(`${pc.green("Done!")} Logged in${identity}${workspace}`);
}
