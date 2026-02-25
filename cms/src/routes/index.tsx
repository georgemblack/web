import { useMemo, useState } from "react";
import { createPost, deletePost, listPosts } from "@/data/db";
import { PostStatus } from "@/data/types";
import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import {
  Badge,
  Breadcrumbs,
  Button,
  Input,
  Select,
  Switch,
} from "@cloudflare/kumo";
import PaddedSurface from "@/components/PaddedSurface";

const STATUS_OPTIONS: Array<PostStatus | "all"> = ["all", "draft", "published"];

export const Route = createFileRoute("/")({
  component: App,
  loader: async () => await listPosts(),
});

function App() {
  const posts = Route.useLoaderData();
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<PostStatus | "all">("all");
  const [showHiddenOnly, setShowHiddenOnly] = useState(false);

  const filteredPosts = useMemo(() => {
    return posts.filter((post) => {
      const matchesSearch = post.title
        .toLowerCase()
        .includes(searchQuery.toLowerCase());
      const matchesStatus =
        statusFilter === "all" || post.status === statusFilter;
      const matchesHidden = !showHiddenOnly || post.hidden;
      return matchesSearch && matchesStatus && matchesHidden;
    });
  }, [posts, searchQuery, statusFilter, showHiddenOnly]);

  const handleCreatePost = async () => {
    const now = new Date().toISOString();
    const post = await createPost({
      data: {
        title: "Untitled",
        slug: `untitled-${Date.now()}`,
        published: now,
        updated: now,
        status: "draft",
        hidden: false,
        gallery: false,
        external_link: null,
        content: [],
      },
    });
    await router.navigate({
      to: "/posts/$postId",
      params: { postId: post.id },
    });
  };

  const handleDelete = async (postId: string, postTitle: string) => {
    if (!window.confirm(`Are you sure you want to delete "${postTitle}"?`)) {
      return;
    }
    await deletePost({ data: postId });
    await router.invalidate();
  };

  return (
    <>
      <div className="flex items-center justify-between">
        <div>
          <Breadcrumbs>
            <Breadcrumbs.Current>Home</Breadcrumbs.Current>
          </Breadcrumbs>
        </div>
        <Button variant="primary" onClick={handleCreatePost}>
          New Post
        </Button>
      </div>
      <div className="mt-4">
        <PaddedSurface>
          <div>
            <Input
              className="w-full"
              placeholder="Search..."
              aria-label="Search..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <div className="mt-4 flex gap-3 items-center">
            <Select
              className="w-30"
              value={statusFilter}
              onValueChange={(status) => setStatusFilter(status || "all")}
            >
              {STATUS_OPTIONS.map((status) => (
                <Select.Option value={status}>
                  {status.toLowerCase()}
                </Select.Option>
              ))}
            </Select>
            <div>
              <Switch
                label="Hidden"
                checked={showHiddenOnly}
                onCheckedChange={setShowHiddenOnly}
              />
            </div>
          </div>
        </PaddedSurface>
        <div className="mt-4 flex flex-col gap-6">
          {filteredPosts.map((post) => (
            <div className="flex justify-between items-center" key={post.id}>
              <Link to="/posts/$postId" params={{ postId: post.id }}>
                <h2 className="font-bold">{post.title}</h2>
                <div className="flex gap-4">
                  <span>
                    {new Date(post.published).toLocaleDateString("en-US", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  </span>
                  <span>
                    <Badge
                      variant={
                        post.status === "published" ? "primary" : "outline"
                      }
                    >
                      {post.status}
                    </Badge>
                  </span>
                </div>
              </Link>
              <Button
                variant="secondary"
                shape="square"
                onClick={() => handleDelete(post.id, post.title)}
              >
                🗑️
              </Button>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
