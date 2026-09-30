import type { EditorSchema } from "@portabletext/editor";
import { MarkdownShortcutsPlugin } from "@portabletext/plugin-markdown-shortcuts";
import { PasteLinkPlugin } from "@portabletext/plugin-paste-link";
import { createDecoratorGuard, TypographyPlugin } from "@portabletext/plugin-typography";

// Each lookup returns undefined when the schema doesn't have that type,
// which tells the plugin to skip the shortcut (e.g. "# " does nothing, since there's no h1).
type Context = { context: { schema: EditorSchema } };

const decorator =
  (name: string) =>
  ({ context }: Context) =>
    context.schema.decorators.find((d) => d.name === name)?.name;

const style =
  (name: string) =>
  ({ context }: Context) =>
    context.schema.styles.find((s) => s.name === name)?.name;

const list =
  (name: string) =>
  ({ context }: Context) =>
    context.schema.lists.find((l) => l.name === name)?.name;

const headingStyle = ({ context, props }: Context & { props: { level: number } }) =>
  context.schema.styles.find((s) => s.name === `h${props.level}`)?.name;

// Typing "---" inserts a divider line.
const horizontalRuleObject = ({ context }: Context) => {
  const schemaType = context.schema.blockObjects.find((o) => o.name === "line");
  return schemaType ? { _type: schemaType.name } : undefined;
};

// Typing "[text](url)" turns into a link.
const linkObject = ({ context, props }: Context & { props: { href: string } }) => {
  const schemaType = context.schema.annotations.find((a) => a.name === "link");
  return schemaType ? { _type: schemaType.name, href: props.href } : undefined;
};

// Leave text inside inline code alone (e.g. keep "--" as typed).
const typographyGuard = createDecoratorGuard({
  decorators: ({ context }) =>
    context.schema.decorators.flatMap((d) => (d.name === "code" ? [] : [d.name])),
});

// Keyboard-driven editing: Markdown shortcuts (headings, lists, quotes,
// bold/italic/code), smart punctuation, and pasting a URL over text to link it.
export function ShortcutPlugins() {
  return (
    <>
      <MarkdownShortcutsPlugin
        boldDecorator={decorator("strong")}
        italicDecorator={decorator("em")}
        codeDecorator={decorator("code")}
        defaultStyle={style("normal")}
        headingStyle={headingStyle}
        blockquoteStyle={style("blockquote")}
        unorderedList={list("bullet")}
        orderedList={list("number")}
        horizontalRuleObject={horizontalRuleObject}
        linkObject={linkObject}
      />
      <TypographyPlugin guard={typographyGuard} />
      <PasteLinkPlugin />
    </>
  );
}
