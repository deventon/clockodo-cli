import { defineConfig } from "tsup";
import dotenv from "dotenv";

export default defineConfig({
  entry: ["src/index.ts"],
  env: dotenv.config().parsed,
  format: ["cjs", "esm"], // Build for commonJS and ESmodules
  dts: true, // Generate declaration file (.d.ts)
  splitting: false,
  sourcemap: true,
  clean: true,
});
