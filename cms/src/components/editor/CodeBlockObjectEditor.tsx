import { useEditor } from "@portabletext/editor";
import type { BlockPath, PortableTextBlock } from "@portabletext/editor";

export function CodeBlockObjectEditor({
  value,
  path,
}: {
  value: PortableTextBlock;
  path: BlockPath;
}) {
  const editor = useEditor();
  const text = (value as Record<string, unknown>).text as string | undefined;

  return (
    <div contentEditable={false} className="my-2">
      <textarea
        className="border-kumo-line bg-kumo-tint text-kumo-default w-full rounded border p-3 font-mono text-sm"
        value={text ?? ""}
        onChange={(e) =>
          editor.send({
            type: "block.set",
            at: path,
            props: { text: e.target.value },
          })
        }
        rows={6}
        placeholder="Code..."
      />
    </div>
  );
}
