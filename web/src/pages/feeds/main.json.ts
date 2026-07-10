import { generateFeed } from "../../util/Feed";

export async function GET() {
  return new Response(JSON.stringify(await generateFeed()), {
    headers: {
      "Content-Type": "application/feed+json",
      "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400",
    },
  });
}
