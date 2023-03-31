// Tiny wrapper around CJS to make ESM module structure the same as in CJS.
import lib from "./index.cjs";
export const { colors, modifiers } = lib;
// Removes duplicate '.default' property.
export default lib.default;