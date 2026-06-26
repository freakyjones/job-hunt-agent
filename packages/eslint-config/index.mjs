export default [
  {
    ignores: ["**/node_modules/**", "**/dist/**", "**/.next/**"]
  },
  {
    rules: {
      "no-console": ["warn", { allow: ["warn", "error", "info"] }],
      "no-unused-vars": "off", // Handled by typescript-eslint if used
      "@typescript-eslint/no-unused-vars": [
        "warn",
        { 
          "argsIgnorePattern": "^_", 
          "varsIgnorePattern": "^_", 
          "caughtErrorsIgnorePattern": "^_" 
        }
      ]
    }
  }
];

export const testConfig = [
  {
    files: ["**/*.test.ts", "**/*.test.tsx", "**/*.spec.ts"],
    rules: {
      "@typescript-eslint/no-explicit-any": "off"
    }
  }
];
