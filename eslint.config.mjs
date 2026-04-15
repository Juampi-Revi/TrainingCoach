import next from "eslint-config-next";

const config = [
  ...next,
  {
    ignores: ["node_modules/**", "dist/**"]
  }
];

export default config;
