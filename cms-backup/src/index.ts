export default {
	async scheduled(event, env, ctx): Promise<void> {
		const posts = await queryPosts(env.WEB_DB);
		const postsJson = JSON.stringify(posts);
		const postsHash = await sha256(postsJson);

		const latestHash = await getLatestBackupHash(env.BACKUP_BUCKET);

		if (latestHash !== null && latestHash === postsHash) {
			console.log("No changes detected since last backup. Skipping.");
			return;
		}

		const now = new Date();
		const key = `backups/${now.toISOString().replace(/[:.]/g, "-")}.json`;

		const backup = {
			version: 1,
			created: now.toISOString(),
			postCount: posts.length,
			posts,
		};

		await env.BACKUP_BUCKET.put(key, JSON.stringify(backup, null, 2), {
			httpMetadata: { contentType: "application/json" },
			customMetadata: { postsHash },
		});

		console.log(`Backup saved: ${key} (${posts.length} posts)`);
	},
} satisfies ExportedHandler<Env>;

interface PostRow {
	id: string;
	title: string;
	published: string;
	updated: string;
	slug: string;
	status: string;
	hidden: number;
	gallery: number;
	external_link: string | null;
	content: string;
}

interface Post {
	id: string;
	title: string;
	published: string;
	updated: string;
	slug: string;
	status: string;
	hidden: boolean;
	gallery: boolean;
	external_link: string | null;
	content: unknown;
}

async function queryPosts(db: D1Database): Promise<Post[]> {
	const result = await db
		.prepare(
			"SELECT id, title, published, updated, slug, status, hidden, gallery, external_link, content FROM posts WHERE deleted = 0 ORDER BY published DESC",
		)
		.all<PostRow>();

	return result.results.map((row) => ({
		...row,
		hidden: row.hidden === 1,
		gallery: row.gallery === 1,
		content: JSON.parse(row.content),
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

	// Keys are ISO timestamps, so lexicographic sort gives chronological order.
	const latest = listed.objects
		.sort((a, b) => a.key.localeCompare(b.key))
		.at(-1)!;

	const head = await bucket.head(latest.key);
	return head?.customMetadata?.postsHash ?? null;
}
