import lib, {colors as color, modifiers as mod} from "./index.cjs";
export const colors = color;
export const modifiers = mod;
// Removes duplicate '.default' property.
export default (lib as unknown as {default: typeof lib}).default;