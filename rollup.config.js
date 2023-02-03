import { swc } from "rollup-plugin-swc3";

const config = {
  input: "src/index.js",
  output: {
    dir: "dist",
    format: "esm",
  },
  external: ["node:crypto", "node-fetch"],
  plugins: [
    swc({
      minify: true,
      env: {
        targets: "node >= 16",
      },
    }),
  ],
};

export default config;
