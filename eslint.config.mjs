import typescriptRules from "@ethberry/eslint-config/presets/tsx.mjs";

// DON'T ADD ANY RULES!
// FIX YOUR SHIT!!!

export default [
  {
    ignores: [
      ".next"
    ]
  },

  {
    ignores: ["eslint.config.mjs"],
    languageOptions: {
      parserOptions: {
        project: [
          "./tsconfig.eslint.json",
        ],
        tsconfigRootDir: process.dirname,
      },
    },
  },

  ...typescriptRules,
];
