import { API_URL } from "../lib/constants.js";
import { generateHeaders } from "./headers.js";
import { DocforkAuthConfig } from "../config.js";

interface ReadUrlResponse {
  text: string;
  library_identifier: string;
  version_info: string;
}

export async function readUrl(
  urlToRead: string,
  auth?: DocforkAuthConfig
): Promise<ReadUrlResponse> {
  const url = new URL(`${API_URL}/read`);
  url.searchParams.set("url", urlToRead);

  const headers = generateHeaders(auth);

  const response = await fetch(url.toString(), {
    method: "GET",
    headers,
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`${response.status} ${response.statusText}: ${text.slice(0, 500)}`);
  }

  // Parse JSON response and return text field
  const data = await response.json();
  return data as ReadUrlResponse;
}
