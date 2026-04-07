import * as esbuild from "esbuild";

esbuild.build({
  entryPoints: ["src/app.ts"],
  bundle: true,
  outfile: "target/bundle.js",

  platform: "browser",
  target: "es2017",

  globalName: "global",

  sourcemap: false,

  format: "iife",
  keepNames: true,

  treeShaking: false,
  minify: false,
}).catch(() => process.exit(1));