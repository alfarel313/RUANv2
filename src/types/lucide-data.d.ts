/**
 * Subpath icon Lucide hanya mengirim .mjs (tanpa .d.ts) — deklarasi minimal
 * untuk akses __iconData (node SVG) yang dipakai IconMap.iconSvg.
 */
declare module "lucide-react/dist/esm/icons/*.mjs" {
  export const __iconData: {
    name: string;
    size: number;
    node: [string, Record<string, string>][];
  };
}
