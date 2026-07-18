import {defineConfig, globalIgnores} from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTypeScript from "eslint-config-next/typescript";

export default defineConfig([
  ...nextVitals,
  ...nextTypeScript,
  {rules:{"react-hooks/set-state-in-effect":"off","import/no-anonymous-default-export":"off"}},
  globalIgnores([".next/**","coverage/**","next-env.d.ts"])
]);
