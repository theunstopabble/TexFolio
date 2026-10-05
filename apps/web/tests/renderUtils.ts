// Generic recursive TSX → testable ESM bundler for the smoke tests.
//
// Uses the `rolldown` already bundled with the project's Vite (no new
// dependency) to compile a component and everything it imports into a single
// ESM string that Node's `node:test` runner can import. React is left external
// and resolved back to the host module.
import path from "node:path";
import { rolldown } from "rolldown";

const cwd = process.cwd();

const cache = new Map<string, string>();

export async function renderComponentSource(entry: string): Promise<string> {
  const key = path.resolve(cwd, entry);
  if (cache.has(key)) return cache.get(key)!;

  const bundle = await rolldown({
    input: key,
    cwd,
    platform: "browser",
    external: [/^react($|\/)/, /^react-dom($|\/)/],
  });
  // `inlineDynamicImports` is what makes the "single ESM string" below true:
  // a dynamic `import()` (AuthProvider lazily pulls in `services/api`) would
  // otherwise split the graph into sibling chunks, and concatenating those
  // would redeclare their shared externals (`import { useCallback } from
  // "react"` twice) and leave a dangling `./api-<hash>.js` specifier.
  const { output } = await bundle.generate({ format: "esm", inlineDynamicImports: true });
  await bundle.close();

  let code = "";
  for (const chunk of output) {
    if (chunk.type === "chunk") code += `${chunk.code}\n`;
  }

  cache.set(key, code);
  return code;
}
