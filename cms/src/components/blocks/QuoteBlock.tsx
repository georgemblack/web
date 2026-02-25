import { InputArea } from "@cloudflare/kumo";
import type { QuoteBlock } from "@/data/types";

interface QuoteBlockEditorProps {
  block: QuoteBlock;
  onChange: (block: QuoteBlock) => void;
}

export function QuoteBlockEditor({ block, onChange }: QuoteBlockEditorProps) {
  return (
    <div className="flex flex-col gap-3">
      <InputArea
        value={block.text}
        onChange={(e) => onChange({ ...block, text: e.target.value })}
        rows={8}
        placeholder="Quote text..."
      />
    </div>
  );
}
