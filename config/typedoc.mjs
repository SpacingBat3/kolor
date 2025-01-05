//@ts-check
/** @type {Partial<import("typedoc").TypeDocOptions>} */
const config = {
  githubPages: true,
  hideGenerator: true,
  entryPoints: ["../src/lib.ts"],
  out: "../docs/api",
  commentStyle: "jsdoc",
  visibilityFilters: {},
  lightHighlightTheme: "github-light",
  darkHighlightTheme: "github-dark",
  gitRemote: "https://github.com/SpacingBat3/kolor.git",
  gitRevision: "master",
  excludeNotDocumented: false,
  excludeInternal: false,
  excludeExternals: false,
  excludePrivate: false,
  intentionallyNotExported: [
    "dictMap", "colorize", "looseString", "arrJoin"
  ],
  sourceLinkTemplate: "https://github.com/SpacingBat3/kolor/blob/{gitRevision}/{path}#L{line}",
  readme: "../README.md",
  name: "Kolor",
  theme: "default"
}
export default config;