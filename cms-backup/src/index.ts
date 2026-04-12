import type { Post, WebDbFile } from "../../web-db/src/types";

export default {
  async scheduled(event, env, ctx): Promise<void> {
    const [posts, files] = await Promise.all([
      queryPosts(env.WEB_DB_SERVICE),
      env.WEB_DB_SERVICE.listAllFiles(),
    ]);

    const contentHash = await sha256(JSON.stringify({ posts, files }));

    const latestHash = await getLatestBackupHash(env.BACKUP_BUCKET);

    if (latestHash !== null && latestHash === contentHash) {
      console.log("No changes detected since last backup. Skipping.");
      return;
    }

    const now = new Date();
    const key = `backups/${now.toISOString().replace(/[:.]/g, "-")}.json`;

    const backup = {
      version: 2,
      created: now.toISOString(),
      postCount: posts.length,
      fileCount: files.length,
      posts,
      files,
    };

    await env.BACKUP_BUCKET.put(key, JSON.stringify(backup, null, 2), {
      httpMetadata: { contentType: "application/json" },
      customMetadata: { contentHash },
    });

    console.log(
      `Backup saved: ${key} (${posts.length} posts, ${files.length} files)`,
    );
  },
} satisfies ExportedHandler<Env>;

async function queryPosts(webDb: Env["WEB_DB_SERVICE"]): Promise<Post[]> {
  const list = await webDb.listPosts();
  const posts = await Promise.all(list.map((item) => webDb.getPost(item.id)));
  return posts.filter((post) => post !== null);
}

async function sha256(data: string): Promise<string> {
  const encoded = new TextEncoder().encode(data);
  const hashBuffer = await crypto.subtle.digest("SHA-256", encoded);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

async function getLatestBackupHash(bucket: R2Bucket): Promise<string | null> {
  const listed = await bucket.list({ prefix: "backups/" });

  if (listed.objects.length === 0) {
    return null;
  }

  // Keys are ISO timestamps, so lexicographic sort gives chronological order.
  const latest = listed.objects
    .sort((a, b) => a.key.localeCompare(b.key))
    .at(-1)!;

  const head = await bucket.head(latest.key);
  return head?.customMetadata?.contentHash ?? null;
}
