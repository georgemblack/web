import { Surface } from "@cloudflare/kumo";

export function PaddedSurface(props: { children: React.ReactNode }) {
  return <Surface className="rounded-lg p-4">{props.children}</Surface>;
}

export default PaddedSurface;
