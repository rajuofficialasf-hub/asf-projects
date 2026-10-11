// The one entry to the UI. Pages import from "@/ui" only (enforced by no-restricted-imports in .oxlintrc.json). The export
// line the scaffold inserts at the marker below selects the UI template; switching templates
// changes that one line.
export type * from "./contract.js";
export { tokens } from "./tokens.js";
// ae-kit:insert ui-template
export * from "./templates/minimal/index.js";
