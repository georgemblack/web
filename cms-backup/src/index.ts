interface Post {
  id: string;
  title: string;
  published: string;
  slug: string;
  status: string;
  hidden: number;
  gallery: number;
  external_link: string | null;
  content: string | null;
  content_pt: string | null;
  content_html: string;
  preview_html: string | null;
  deleted: number;
  portable_text: number;
}

interface WebDbFile {
  key: string;
  type: string;
  year: number;
  optimized: number;
}

export default {
  async scheduled(event, env, ctx): Promise<void> {
    const [posts, files] = await Promise.all([
      queryPosts(env.WEB_DB),
      listAllFiles(env.WEB_DB),
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

async function queryPosts(db: D1Database): Promise<Post[]> {
  const result = await db
    .prepare(
      "SELECT id, title, published, slug, status, hidden, gallery, external_link, content, content_pt, content_html, preview_html, deleted, portable_text FROM posts WHERE deleted = 0 ORDER BY published DESC",
    )
    .all<Post>();
  return result.results;
}

async function listAllFiles(db: D1Database): Promise<WebDbFile[]> {
  const result = await db
    .prepare(
      "SELECT key, type, year, optimized FROM files ORDER BY year DESC, key",
    )
    .all<WebDbFile>();
  return result.results;
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

  const latest = listed.objects
    .sort((a, b) => a.key.localeCompare(b.key))
    .at(-1)!;

  const head = await bucket.head(latest.key);
  return head?.customMetadata?.contentHash ?? null;
}
