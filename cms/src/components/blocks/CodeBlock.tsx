import { InputArea } from "@cloudflare/kumo";
import type { CodeBlock } from "@/data/types";

interface CodeBlockEditorProps {
  block: CodeBlock;
  onChange: (block: CodeBlock) => void;
}

export function CodeBlockEditor({ block, onChange }: CodeBlockEditorProps) {
  return (
    <div className="flex flex-col gap-3 font-mono">
      <InputArea
        value={block.text}
        onChange={(e) => onChange({ ...block, text: e.target.value })}
        rows={8}
        placeholder="Code..."
      />
    </div>
  );
}
