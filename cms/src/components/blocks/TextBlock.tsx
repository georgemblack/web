import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Link from "@tiptap/extension-link";
import { Button } from "@cloudflare/kumo";
import type { TextBlock } from "@/data/types";

interface TextBlockEditorProps {
  block: TextBlock;
  onChange: (block: TextBlock) => void;
}

export function TextBlockEditor({ block, onChange }: TextBlockEditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: false,
        blockquote: false,
        codeBlock: false,
        code: false,
        horizontalRule: false,
      }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          rel: null,
          target: null,
        },
      }),
    ],
    content: block.text || "<p></p>",
    onUpdate: ({ editor }) => {
      onChange({ ...block, text: editor.getHTML() });
    },
  });

  const handleLink = () => {
    if (!editor) return;

    // If already a link, remove it
    if (editor.isActive("link")) {
      editor.chain().focus().unsetLink().run();
      return;
    }

    const url = window.prompt("Enter URL:");
    if (url) {
      editor.chain().focus().setLink({ href: url }).run();
    }
  };

  return (
    <div className="flex flex-col gap-1">
      <div className="flex gap-1">
        <Button
          variant={editor?.isActive("bold") ? "primary" : "secondary"}
          size="sm"
          onClick={() => editor?.chain().focus().toggleBold().run()}
          aria-label="Bold"
        >
          B
        </Button>
        <Button
          variant={editor?.isActive("italic") ? "primary" : "secondary"}
          size="sm"
          onClick={() => editor?.chain().focus().toggleItalic().run()}
          aria-label="Italic"
        >
          I
        </Button>
        <Button
          variant={editor?.isActive("link") ? "primary" : "secondary"}
          size="sm"
          onClick={handleLink}
          aria-label="Link"
        >
          Link
        </Button>
        <Button
          variant={editor?.isActive("bulletList") ? "primary" : "secondary"}
          size="sm"
          onClick={() => editor?.chain().focus().toggleBulletList().run()}
          aria-label="Bullet List"
        >
          UL
        </Button>
        <Button
          variant={editor?.isActive("orderedList") ? "primary" : "secondary"}
          size="sm"
          onClick={() => editor?.chain().focus().toggleOrderedList().run()}
          aria-label="Ordered List"
        >
          OL
        </Button>
      </div>
      <EditorContent editor={editor} />
    </div>
  );
}
