/**
 * Clerk Account Portal links for the tenant encoded in the publishable key.
 * Registration, sign-in, password recovery, and the user security page stay
 * on that hosted origin. This module does not read the Clerk secret.
 */

export interface AccountPortalLinks {
  frontendApiHost: string;
  signInUrl: string;
  signUpUrl: string;
  userUrl: string;
}

export function clerkFrontendApiHost(publishableKey: string): string {
  const encoded = publishableKey.replace(/^pk_(?:test|live)_/, "");
  if (encoded === publishableKey) {
    throw new Error("Clerk publishable key does not encode a frontend API host");
  }
  const decoded = Buffer.from(encoded, "base64").toString("utf8").replace(/\$$/, "");
  if (!/^[a-z0-9.-]+$/i.test(decoded) || !decoded.includes(".")) {
    throw new Error("Clerk publishable key does not encode a frontend API host");
  }
  return decoded;
}

export function accountPortalLinks(input: {
  publishableKey: string;
  appBaseUrl: string;
}): AccountPortalLinks {
  const frontendApiHost = clerkFrontendApiHost(input.publishableKey);
  const redirectUrl = new URL(input.appBaseUrl);
  redirectUrl.hash = "";
  redirectUrl.username = "";
  redirectUrl.password = "";
  const redirect = encodeURIComponent(redirectUrl.toString());
  const origin = `https://${frontendApiHost}`;
  return {
    frontendApiHost,
    signInUrl: `${origin}/sign-in?redirect_url=${redirect}`,
    signUpUrl: `${origin}/sign-up?redirect_url=${redirect}`,
    userUrl: `${origin}/user?redirect_url=${redirect}`,
  };
}
