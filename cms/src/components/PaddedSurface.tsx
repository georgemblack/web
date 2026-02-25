import { Surface } from "@cloudflare/kumo";

export function PaddedSurface(props: { children: React.ReactNode }) {
  return <Surface className="p-4 rounded-lg">{props.children}</Surface>;
}

export default PaddedSurface;
