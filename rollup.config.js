import { swc } from "rollup-plugin-swc3";

const config = {
  input: "src/index.mjs",
  output: {
    dir: "dist",
    format: "esm",
  },
  external: ["node:crypto"],
  plugins: [
    swc({
      minify: true,
      env: {
        targets: "node >= 18",
      },
    }),
  ],
};

export default config;
