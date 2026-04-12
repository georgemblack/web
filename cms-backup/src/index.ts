interface Post {
  id: string;
  title: string;
  published: string;
  slug: string;
  status: string;
  hidden: boolean;
  gallery: boolean;
  external_link: string | null;
  portable_text: boolean;
  content: unknown;
}

interface PostListItem {
  id: string;
  title: string;
  published: string;
  status: string;
  hidden: boolean;
  gallery: boolean;
  portable_text: boolean;
}

interface WebDbFile {
  key: string;
  type: string;
  year: number;
  optimized: boolean;
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
      "SELECT id, title, published, status, hidden, gallery, portable_text FROM posts WHERE deleted = 0 ORDER BY published DESC",
    )
    .all<
      Omit<PostListItem, "hidden" | "gallery" | "portable_text"> & {
        hidden: number;
        gallery: number;
        portable_text: number;
      }
    >();

  const list: PostListItem[] = result.results.map((row) => ({
    ...row,
    hidden: row.hidden === 1,
    gallery: row.gallery === 1,
    portable_text: row.portable_text === 1,
  }));

  const posts = await Promise.all(list.map((item) => getPost(db, item.id)));
  return posts.filter((post) => post !== null);
}

async function getPost(db: D1Database, id: string): Promise<Post | null> {
  const row = await db
    .prepare(
      "SELECT id, title, published, slug, status, hidden, gallery, external_link, portable_text, content FROM posts WHERE id = ? AND deleted = 0",
    )
    .bind(id)
    .first<{
      id: string;
      title: string;
      published: string;
      slug: string;
      status: string;
      hidden: number;
      gallery: number;
      external_link: string | null;
      portable_text: number;
      content: string;
    }>();

  if (!row) {
    return null;
  }

  return {
    ...row,
    hidden: row.hidden === 1,
    gallery: row.gallery === 1,
    portable_text: row.portable_text === 1,
    content: JSON.parse(row.content),
  };
}

async function listAllFiles(db: D1Database): Promise<WebDbFile[]> {
  const result = await db
    .prepare(
      "SELECT key, type, year, optimized FROM files ORDER BY year DESC, key",
    )
    .all<{ key: string; type: string; year: number; optimized: number }>();
  return result.results.map((row) => ({
    ...row,
    optimized: row.optimized === 1,
  }));
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
