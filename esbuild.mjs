import * as esbuild from "esbuild"
import glob from "tiny-glob"
;(async function () {
  const entryPoints = await glob("src/**/*.ts")

  await esbuild.build({
    entryPoints,
    // sourcemap: true,
    // entryPoints: ["src/index.ts"],
    logLevel: "info",
    outdir: "build",
    bundle: true,
    minify: false,
    platform: "node",
    target: "esnext",
    format: "esm",
    banner: {
      js: `import { createRequire } from 'module';const require = createRequire(import.meta.url);const __filename = (await import('node:url')).fileURLToPath(import.meta.url);const __dirname = (await import('node:path')).dirname(__filename);`,
    },
    outExtension: {
      ".js": ".mjs",
    },
  })
})()
