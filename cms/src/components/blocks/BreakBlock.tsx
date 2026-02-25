import { Text } from "@cloudflare/kumo";

export function BreakBlockEditor() {
  return (
    <div className="flex items-center gap-2 border-t border-dashed py-2">
      <Text variant="secondary" size="sm">
        Preview break
      </Text>
    </div>
  );
}
