import { Text } from "@cloudflare/kumo";

export function LineBlockEditor() {
  return (
    <div className="flex items-center gap-2 border-t border-dashed py-2">
      <Text variant="secondary" size="sm">
        Horizontal rule
      </Text>
    </div>
  );
}
