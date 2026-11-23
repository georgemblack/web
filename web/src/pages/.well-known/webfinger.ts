import type { APIRoute } from "astro";

// Tells Tailscale (and other apps that use WebFinger) which sign-in provider
// handles george.black email addresses.
const DOMAIN = "george.black";
const ISSUER = "https://idp.george.black";

export const GET: APIRoute = ({ url }) => {
  const resource = url.searchParams.get("resource");
  if (!resource) return new Response("Missing resource", { status: 400 });

  const match = /^acct:[^@\s]+@(.+)$/i.exec(resource);
  if (match?.[1].toLowerCase() !== DOMAIN) return new Response("Not found", { status: 404 });

  return new Response(
    JSON.stringify({
      subject: resource,
      links: [{ rel: "http://openid.net/specs/connect/1.0/issuer", href: ISSUER }],
    }),
    {
      headers: {
        "Content-Type": "application/jrd+json",
        "Access-Control-Allow-Origin": "*",
        "Cache-Control": "public, max-age=3600",
      },
    },
  );
};
