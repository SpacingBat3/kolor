/**
 * Global process variable, might be undefined or defined differently than in
 * Node.js in case of non-Node runtimes. Hence, this library has it overwritten
 * for its own global types scope, like so.
 */
/* eslint-disable-next-line no-var */// This is global type override.
declare var process: NodeJS.Process|undefined|Record<keyof never, unknown>&Record<"stdout"|"stderr",undefined|null|Record<keyof never,boolean|undefined>>;
/** Like {@linkcode NodeJS.Dict} but only used for `satisfies` check. */
type Dict = Readonly<Record<string,readonly [number,number]>>
/**
 * Any primitive value that can be put into the template or converted to string
 * automatically in meaningful way.
 */
type looseString = string|number|bigint|boolean|null|undefined;
/**
 * Helper type to remove ANSI VT control characters from type.
 * @template T Type which should be matched for exclusion.
 */
type unColorize<T extends looseString> = Exclude<T,`\x1b[${number}m${string}`>;
/**
 * Helper type to replace all `S` substring instances with `R` in `V` string.
 * @template V string to search in.
 * @template S substring to search for.
 * @template R substring to replace with.
 */
type replace<V extends looseString, S extends looseString, R extends looseString> =
  V extends `${infer A extends string}${S}${infer Z extends string}` ?
    `${A}${R}${replace<Z,S,R>}` :
    V;

/**
 * Helper type to stringify arrays (aka. `.join()`).
 * @template T array to stringify or looseString to return
 */
type arrJoin<T extends readonly looseString[]|looseString> = (
  T extends [infer K extends looseString, ...infer R extends looseString[]] ?
  R extends never[] ? `${K}` : `${K},${arrJoin<R>}` : T extends never[] ? "" :
  T extends looseString ? T : string
);

/**
 * Helper type that adds type variant with ANSI VT control characters to type.
 * @template T string-like type to process
 * @template S ANSI escape char code at the beginning
 * @template E ANSI escape char code at the end
 */
type colorize<T extends looseString, S extends number,E extends number> =
  unColorize<T> | `\x1b[${S}m${replace<T,E,S>}\x1b[${S}m`

/**
 * Type that assigns color functions to a given `Dict`.
 * @template D `Dict` to use as an input type.
 */
type dictMap<T extends Dict> = {
  [P in keyof T]: <U extends looseString|readonly looseString[]>(value:U) => (
    colorize<arrJoin<U>,T[P][0],T[P][1]>
  );
}

const shouldUseColors = (() => {
  // We're in the browser console – this is unsupported yet.
  if("window" in globalThis)
    return false;
  // Allow for non-Node-compatible runtimes to use this lib when they support
  // ESM and set secret `__kolorTTY` global var to `true.
  if(!("process" in globalThis) || !Array.isArray(process?.argv) || typeof process.stdout !== "object")
    return "__kolorTTY" in globalThis && (<typeof globalThis & {__kolorTTY:unknown}>globalThis)["__kolorTTY"] === true;
  switch(process.argv.join('=').match(/--color=(always|auto|never)/)?.[1] ?? "auto") {
    case "always":
      return  true;
    case  "never":
      return false;
    default:
      // Disable by default for non-Node.js envs, at least those without
      // node:process support (you can still enforce it with argv)
      return (
        // Detect if process it not piped
        process.stdout?.isTTY && process.stderr?.isTTY &&
        // Detect if we support colors in TTY
        typeof process.stdout.hasColors === "function" ? !!process.stdout.hasColors(16) : false
      ) || (
        // Workaround for Electron on Windows
        typeof process.versions === "object" && "electron" in (process.versions??{}) && process.platform === "win32"
      );
  }
})();

function mapTuple<T extends readonly [number, number]>(tuple: T){
  const codes = Object.freeze(tuple.map(n => `\x1b[${n}m`) as [`\x1b[${T[0]}m`, `\x1b[${T[1]}m`]);
  const colorizeFn = <V extends looseString>(value:V) => `${codes[0]}${String(value).replace(codes[1],codes[0]) as replace<V,`${T[0]}`,`${T[1]}`>}${codes[1]}` as const
  if(shouldUseColors)
    return colorizeFn;
  /*
   * This makes `kolor` to still colorize the input when it's already containing
   * the proper ANSI characters to make type predictions accurate, greatly
   * limit union type elements and disallow for invalid API use. SO YES, `kolor`
   * SHOULD NOT BE USED on already colorized text if you expect from it to do
   * no modifications to it, the `shouldUseColors` is a smart prevention way
   * for cases it is not desirable to include any of ANSI codes in string.
   */
  return <V extends looseString>(value:V) => /^\x1b\[[0-9]m/.test(`${value}`) ? colorizeFn(value) : value;
}

function mapDict<T extends Dict>(dict: T) {
  const functions = {} as Record<Extract<keyof T,string>,unknown>;
  for(const key in dict) {
    functions[key] = mapTuple(dict[key] as T[keyof T]);
    Object.defineProperty(functions[key],"name",{value:key,writable:false,enumerable:false,configurable:true});
  }
  return functions as dictMap<T>;
}

function alias<T extends object,R extends object>(value:T, hook:(value:T)=>R) {
  return Object.freeze({
    ...value,
    ...hook(value)
  });
}

const modifiersObj = Object.freeze({
  safe: alias(mapDict({
    /** Resets all modifiers (usually not needed, `kolor` takes care of it). */
    reset:     [0,  0],
    /** Renders bold font in the terminal. */
    bold:      [1, 22],
    /** Draws horizontal line below the text. */
    underline: [4, 24],
    /** Inverts background and foreground of the text. */
    inverse:   [7, 27]
  } as const satisfies Dict), modifiers => ({
    /** An alias of `modifiers.safe.inverse`. */
    swapColors: modifiers.inverse,
    /** An alias of `modifiers.safe.inverse`. */
    swapcolors: modifiers.inverse,
  })),
  other: alias(mapDict({
    /** Makes the text color dimmed. */
    dim:             [ 2, 22],
    /** Renders italic font in the terminal. */
    italic:          [ 3, 23],
    /** Render text as blinking. Might be no-op sometimes due to accessibility reasons. */
    blink:           [ 5, 25],
    /** Like `blink`, but faster. Rarely implemented. */
    rapidBlink:      [ 6, 25],
    /** Makes the text invisible. */
    hidden:          [ 8, 28],
    /** Draws a line through the text. */
    strikethrough:   [ 9, 29],
    /** Like `underline`, but draws 2 lines instead one. */
    doubleunderline: [21, 24],
    framed:          [51, 54],
    /** Draws horizontal line above the text. */
    overlined:       [53, 55]
  } as const satisfies Dict), ({dim,strikethrough,hidden,doubleunderline}) => ({
    /** An alias of `dim`. */
    faint: dim,
    /** An alias of `strikethrough`. */
    strikeThrough: strikethrough,
    /** An alias of `strikethrough`. */
    crossedout: strikethrough,
    /** An alias of `strikethrough`. */
    crossedOut: strikethrough,
    /** An alias of `hidden`. */
    conceal: hidden,
    /** An alias of `doubleunderline`. */
    doubleUnderline: doubleunderline
  }))
});

/**
 * An object containing multiple functions used to colorize the text.
 *
 * @example
 * // Print error in the console.
 * console.error(colors.red("[Error]")+" Something's not right...")
 */
const colorsObj = alias(mapDict({
  black:           [ 30, 39],
  red:             [ 31, 39],
  green:           [ 32, 39],
  yellow:          [ 33, 39],
  blue:            [ 34, 39],
  magenta:         [ 35, 39],
  cyan:            [ 36, 39],
  white:           [ 37, 39],
  bgBlack:         [ 40, 49],
  bgRed:           [ 41, 49],
  bgGreen:         [ 42, 49],
  bgYellow:        [ 43, 49],
  bgBlue:          [ 44, 49],
  bgMagenta:       [ 45, 49],
  bgCyan:          [ 46, 49],
  bgWhite:         [ 47, 49],
  gray:            [ 90, 39],
  redBright:       [ 91, 39],
  greenBright:     [ 92, 39],
  yellowBright:    [ 93, 39],
  blueBright:      [ 94, 39],
  magentaBright:   [ 95, 39],
  cyanBright:      [ 96, 39],
  whiteBright:     [ 97, 39],
  bgGray:          [100, 49],
  bgRedBright:     [101, 49],
  bgGreenBright:   [102, 49],
  bgYellowBright:  [103, 49],
  bgBlueBright:    [104, 49],
  bgMagentaBright: [105, 49],
  bgCyanBright:    [106, 49],
  bgWhiteBright:   [107, 49]
} as const satisfies Dict), ({white,magenta,bgMagenta,gray,bgGray}) => ({
  /** An alias of `magenta`. */
  purple: magenta,
  /** An alias of `magentaBg`. */
  bgPurple: bgMagenta,
  /** An alias of `white`. */
  lightGray: white,
  /** An alias of `white`. */
  lightGrey: white,
  /** An alias of `gray`. */
  grey: gray,
  /** An alias of `gray`. */
  blackBright: gray,
  /** An alias of `bgGray`. */
  bgGrey: bgGray,
  /** An alias of `bgGray`. */
  bgBlackBright: bgGray
}));

type colors = typeof colorsObj;
type modifiers_safe = typeof modifiersObj["safe"]
type modifiers_other = typeof modifiersObj["other"]
interface ModifiersSafe extends modifiers_safe {}
interface ModifiersOther extends modifiers_other {}
interface Colors extends colors {}

interface Modifiers {
  /** Modifiers working fine across most popular platforms/consoles. */
  safe: ModifiersSafe;
  /** Other modifiers that may not work with all consoles (e.g. `cmd.exe`). */
  other: ModifiersOther;
}

interface DefaultExport extends Colors,ModifiersSafe {
  /** Other modifiers that may not work with all consoles (e.g. `cmd.exe`). */
  unsafe: ModifiersOther
}

/**
 * A merged version of `kolor` module, providing both `colors` and `modifiers`
 * at the root. Each function may take any parameter, convert it to string
 * if possible and transform it to another string with requested decorations
 * added.
 */
const defaultExport:DefaultExport = Object.freeze({
  ...colorsObj,
  ...modifiersObj.safe,
  unsafe: modifiersObj.other
});

/**
 * An object containing multiple functions used to colorize the text.
 *
 * @example
 * // Print error in the console.
 * console.error(colors.red("[Error]")+" Something's not right...")
 */
const colors:Colors = colorsObj;
/**
 * An object grouped by platform support, including functions to transform text
 * in the console to change it appearance (e.g. make it underlined) rather than
 * just set a specific font color.
 *
 * @example
 * console.log(kolor.bold("User:")+" Hi there! ^_^")
 */
const modifiers:Modifiers = modifiersObj;

export {
  colors,
  modifiers
}

export type {
  Colors,
  Modifiers,
  ModifiersSafe,
  ModifiersOther,
  DefaultExport,
  looseString
}

export default defaultExport;