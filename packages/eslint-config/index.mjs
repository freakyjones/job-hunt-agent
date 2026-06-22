export default [
  {
    ignores: ["**/node_modules/**", "**/dist/**", "**/.next/**"]
  },
  {
    rules: {
      "no-console": ["warn", { allow: ["warn", "error", "info"] }],
      "no-unused-vars": "off" // Handled by typescript-eslint if used
    }
  }
];
