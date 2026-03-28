import { createMiddleware } from "@tanstack/react-start";
import { env } from "cloudflare:workers";
import { createRemoteJWKSet, jwtVerify } from "jose";

let jwks: ReturnType<typeof createRemoteJWKSet> | undefined;

function getJWKS(): ReturnType<typeof createRemoteJWKSet> {
  if (!jwks) {
    const certsUrl = new URL(
      `/cdn-cgi/access/certs`,
      env.CF_ACCESS_TEAM_DOMAIN,
    );
    jwks = createRemoteJWKSet(certsUrl);
  }
  return jwks;
}

export const accessMiddleware = createMiddleware().server(
  async ({ next, request }) => {
    if (process.env.NODE_ENV === "development") {
      return next();
    }

    const jwt =
      request.headers.get("Cf-Access-Jwt-Assertion") ??
      parseCookie(request.headers.get("Cookie"), "CF_Authorization");

    if (!jwt) {
      throw new Response("Unauthorized", { status: 401 });
    }

    try {
      await jwtVerify(jwt, getJWKS(), {
        audience: env.CF_ACCESS_AUD,
        issuer: env.CF_ACCESS_TEAM_DOMAIN,
      });
    } catch {
      throw new Response("Unauthorized", { status: 401 });
    }

    return next();
  },
);

function parseCookie(cookieHeader: string | null, name: string): string | null {
  if (!cookieHeader) return null;
  const match = cookieHeader
    .split(";")
    .map((c) => c.trim())
    .find((c) => c.startsWith(`${name}=`));
  return match ? match.slice(name.length + 1) : null;
}
