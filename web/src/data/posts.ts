export interface PostImage {
  src: string;
  alt: string;
}

export interface PostData {
  title: string;
  published: string;
  slug: string;
  hidden: boolean;
  gallery: boolean;
  external_link: string | null;
  content_html: string;
  preview_html: string | null;
  images: PostImage[];
}

export interface PostRecord {
  id: string;
  data: PostData;
}

interface PostRow {
  id: string;
  title: string;
  published: string;
  slug: string;
  hidden: number;
  gallery: number;
  external_link: string | null;
  content_pt: string | null;
  content_html: string;
  preview_html: string | null;
}

const POST_COLUMNS =
  "id, title, published, slug, hidden, gallery, external_link, content_pt, content_html, preview_html";

function toPostRecord(row: PostRow): PostRecord {
  const blocks = JSON.parse(row.content_pt ?? "[]") as Array<{
    _type?: string;
    key?: string;
    alt?: string;
  }>;
  const images = blocks
    .filter((block) => block._type === "image" && block.key)
    .map((block) => ({
      src: `/files/${block.key}`,
      alt: block.alt ?? "",
    }));

  return {
    id: row.id,
    data: {
      title: row.title,
      published: row.published,
      slug: row.slug,
      hidden: row.hidden === 1,
      gallery: row.gallery === 1,
      external_link: row.external_link,
      content_html: row.content_html,
      preview_html: row.preview_html,
      images,
    },
  };
}

export async function listPublishedPosts(
  db: D1Database,
): Promise<PostRecord[]> {
  const result = await db
    .prepare(
      `SELECT ${POST_COLUMNS} FROM posts WHERE status = 'published' AND deleted = 0 ORDER BY published DESC`,
    )
    .all<PostRow>();

  return result.results.map(toPostRecord);
}

export async function getPublishedPostBySlug(
  db: D1Database,
  slug: string,
): Promise<PostRecord | null> {
  const row = await db
    .prepare(
      `SELECT ${POST_COLUMNS} FROM posts WHERE slug = ? AND status = 'published' AND deleted = 0`,
    )
    .bind(slug)
    .first<PostRow>();

  return row ? toPostRecord(row) : null;
}

export async function getPublishedPostById(
  db: D1Database,
  id: string,
): Promise<PostRecord | null> {
  const row = await db
    .prepare(
      `SELECT ${POST_COLUMNS} FROM posts WHERE id = ? AND status = 'published' AND deleted = 0`,
    )
    .bind(id)
    .first<PostRow>();

  return row ? toPostRecord(row) : null;
}
