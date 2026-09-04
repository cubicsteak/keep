import { lookup } from "node:dns/promises";
import { isIP } from "node:net";

const MAX_REDIRECTS = 5;
const MAX_RESPONSE_BYTES = 1_000_000;
const REQUEST_TIMEOUT_MS = 5_000;

function isPrivateIPv4(address: string) {
  const octets = address.split(".").map(Number);
  if (octets.length !== 4 || octets.some((octet) => !Number.isInteger(octet))) {
    return true;
  }

  const [a, b] = octets;
  return a === 0
    || a === 10
    || a === 127
    || (a === 169 && b === 254)
    || (a === 172 && b >= 16 && b <= 31)
    || (a === 192 && b === 168)
    || (a === 100 && b >= 64 && b <= 127)
    || a >= 224;
}

function isPrivateIPv6(address: string) {
  const normalized = address.toLowerCase().split("%")[0];
  const mappedIPv4 = normalized.match(/^(?:0*:)*ffff:(\d+\.\d+\.\d+\.\d+)$/)?.[1];

  return normalized === "::"
    || normalized === "::1"
    || normalized.startsWith("fc")
    || normalized.startsWith("fd")
    || /^fe[89ab]/.test(normalized)
    || (mappedIPv4 ? isPrivateIPv4(mappedIPv4) : false);
}

function isPrivateAddress(address: string) {
  const version = isIP(address);
  return version === 4 ? isPrivateIPv4(address) : version === 6 ? isPrivateIPv6(address) : true;
}

export async function validatePublicHttpUrl(value: string) {
  const url = new URL(value);

  if (!['http:', 'https:'].includes(url.protocol)) {
    throw new Error("Only HTTP and HTTPS URLs are allowed.");
  }
  if (url.username || url.password) {
    throw new Error("URLs containing credentials are not allowed.");
  }
  if (url.port && !['80', '443'].includes(url.port)) {
    throw new Error("Non-standard ports are not allowed.");
  }

  const addresses = await lookup(url.hostname, { all: true, verbatim: true });
  if (!addresses.length || addresses.some(({ address }) => isPrivateAddress(address))) {
    throw new Error("Private or reserved network addresses are not allowed.");
  }

  return url;
}

async function readLimitedText(response: Response) {
  const declaredLength = Number(response.headers.get("content-length"));
  if (Number.isFinite(declaredLength) && declaredLength > MAX_RESPONSE_BYTES) {
    throw new Error("The response is too large.");
  }

  if (!response.body) return "";

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let received = 0;
  let result = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    received += value.byteLength;
    if (received > MAX_RESPONSE_BYTES) {
      await reader.cancel();
      throw new Error("The response is too large.");
    }
    result += decoder.decode(value, { stream: true });
  }

  return result + decoder.decode();
}

export async function fetchPublicHtml(value: string) {
  let url = await validatePublicHttpUrl(value);

  for (let redirectCount = 0; redirectCount <= MAX_REDIRECTS; redirectCount++) {
    const response = await fetch(url, {
      cache: "no-store",
      redirect: "manual",
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
      headers: {
        "User-Agent": "KEEP metadata fetcher/1.0",
        Accept: "text/html,application/xhtml+xml",
      },
    });

    if (response.status >= 300 && response.status < 400) {
      const location = response.headers.get("location");
      if (!location || redirectCount === MAX_REDIRECTS) {
        throw new Error("Too many or invalid redirects.");
      }
      url = await validatePublicHttpUrl(new URL(location, url).toString());
      continue;
    }

    if (!response.ok) {
      throw new Error(`The remote server returned ${response.status}.`);
    }
    const contentType = response.headers.get("content-type")?.toLowerCase() ?? "";
    if (!contentType.includes("text/html") && !contentType.includes("application/xhtml+xml")) {
      throw new Error("The URL did not return an HTML document.");
    }

    return { html: await readLimitedText(response), url };
  }

  throw new Error("Unable to fetch the URL.");
}
