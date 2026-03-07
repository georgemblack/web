import { generateFeed } from "../../util/Feed";

export async function GET() {
  return new Response(JSON.stringify(await generateFeed()), {
    headers: { "Content-Type": "application/feed+json" },
  });
}
