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
 * @template T array to stringify
 */
type arrJoin<T extends readonly looseString[]> = (
  T extends [infer K extends looseString, ...infer R extends looseString[]] ?
  R extends never[] ? `${K}` : `${K},${arrJoin<R>}` : T extends never[] ? "" : string
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
    colorize<U extends readonly looseString[]?arrJoin<U>:U,T[P][0],T[P][1]>
  );
}

const modifiers_safe = Object.freeze({
  /** Resets all modifiers (usually not needed, `kolor` takes care of it). */
  reset:     Object.freeze(<const>[0,  0]),
  /** Renders bold font in the terminal. */
  bold:      Object.freeze(<const>[1, 22]),
  /** Draws horizontal line below the text. */
  underline: Object.freeze(<const>[4, 24]),
  /** Inverts background and foreground of the text. */
  inverse:   Object.freeze(<const>[7, 27])
} as const) satisfies Dict;

const modifiers_other = Object.freeze({
  /** Makes the text color dimmed. */
  dim:             Object.freeze(<const>[ 2, 22]),
  /** Renders italic font in the terminal. */
  italic:          Object.freeze(<const>[ 3, 23]),
  /** Render text as blinking. Might be no-op sometimes due to accessibility reasons. */
  blink:           Object.freeze(<const>[ 5, 25]),
  /** Like `blink`, but faster. Rarely implemented. */
  rapidBlink:      Object.freeze(<const>[ 6, 25]),
  /** Makes the text invisible. */
  hidden:          Object.freeze(<const>[ 8, 28]),
  /** Draws a line through the text. */
  strikethrough:   Object.freeze(<const>[ 9, 29]),
  /** Like `underline`, but draws 2 lines instead one. */
  doubleunderline: Object.freeze(<const>[21, 24]),
  framed:          Object.freeze(<const>[51, 54]),
  /** Draws horizontal line above the text. */
  overlined:       Object.freeze(<const>[53, 55])
} as const) satisfies Dict;

const colors_util = Object.freeze({
  black:           Object.freeze(<const>[ 30, 39]),
  red:             Object.freeze(<const>[ 31, 39]),
  green:           Object.freeze(<const>[ 32, 39]),
  yellow:          Object.freeze(<const>[ 33, 39]),
  blue:            Object.freeze(<const>[ 34, 39]),
  magenta:         Object.freeze(<const>[ 35, 39]),
  cyan:            Object.freeze(<const>[ 36, 39]),
  white:           Object.freeze(<const>[ 37, 39]),
  bgBlack:         Object.freeze(<const>[ 40, 49]),
  bgRed:           Object.freeze(<const>[ 41, 49]),
  bgGreen:         Object.freeze(<const>[ 42, 49]),
  bgYellow:        Object.freeze(<const>[ 43, 49]),
  bgBlue:          Object.freeze(<const>[ 44, 49]),
  bgMagenta:       Object.freeze(<const>[ 45, 49]),
  bgCyan:          Object.freeze(<const>[ 46, 49]),
  bgWhite:         Object.freeze(<const>[ 47, 49]),
  gray:            Object.freeze(<const>[ 90, 39]),
  redBright:       Object.freeze(<const>[ 91, 39]),
  greenBright:     Object.freeze(<const>[ 92, 39]),
  yellowBright:    Object.freeze(<const>[ 93, 39]),
  blueBright:      Object.freeze(<const>[ 94, 39]),
  magentaBright:   Object.freeze(<const>[ 95, 39]),
  cyanBright:      Object.freeze(<const>[ 96, 39]),
  whiteBright:     Object.freeze(<const>[ 97, 39]),
  bgGray:          Object.freeze(<const>[100, 49]),
  bgRedBright:     Object.freeze(<const>[101, 49]),
  bgGreenBright:   Object.freeze(<const>[102, 49]),
  bgYellowBright:  Object.freeze(<const>[103, 49]),
  bgBlueBright:    Object.freeze(<const>[104, 49]),
  bgMagentaBright: Object.freeze(<const>[105, 49]),
  bgCyanBright:    Object.freeze(<const>[106, 49]),
  bgWhiteBright:   Object.freeze(<const>[107, 49])
} as const) satisfies Dict;

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

/**
 * An object containing multiple functions used to colorize the text.
 *
 * @example
 * // Print error in the console.
 * console.error(colors.red("[Error]")+" Something's not right...")
 */
const colors = alias(mapDict(colors_util), colors => ({
  /** An alias of `colors.magenta`. */
  purple: colors.magenta,
  /** An alias of `colors.magentaBg`. */
  bgPurple: colors.bgMagenta,
  /** An alias of `colors.white`. */
  lightGray: colors.white,
  /** An alias of `colors.white`. */
  lightGrey: colors.white,
  /** An alias of `colors.gray`. */
  grey: colors.gray,
  /** An alias of `colors.gray`. */
  blackBright: colors.gray,
  /** An alias of `colors.bgGray. */
  bgGrey: colors.bgGray,
  /** An alias of `colors.bgGray`. */
  bgBlackBright: colors.bgGray
}));
/**
 * An object grouped by platform support, including functions to transform text
 * in the console to change it appearance (e.g. make it underlined) rather than
 * just set a specific font color.
 *
 * @example
 * console.log(kolor.bold("User:")+" Hi there! ^_^")
 */
const modifiers = Object.freeze({
  /**
   * Modifiers working fine across most popular platforms/consoles.
   */
  safe: alias(mapDict(modifiers_safe), mod => ({
    /** An alias of `modifiers.safe.inverse`. */
    swapColors: mod.inverse,
    /** An alias of `modifiers.safe.inverse`. */
    swapcolors: mod.inverse,
  })),
  /**
   * Other modifiers that may not work with all consoles (e.g. `cmd.exe`).
   */
  other: alias(mapDict(modifiers_other), mod => ({
    /** An alias of `modifiers.other.dim`. */
    faint: mod.dim,
    /** An alias of `modifiers.other.strikethrough`. */
    strikeThrough: mod.strikethrough,
    /** An alias of `modifiers.other.strikethrough`. */
    crossedout: mod.strikethrough,
    /** An alias of `modifiers.other.strikethrough`. */
    crossedOut: mod.strikethrough,
    /** An alias of `modifiers.other.hidden`. */
    conceal: mod.hidden,
    /** An alias of `modifiers.other.doubleunderline`. */
    doubleUnderline: mod.doubleunderline
  }))
});

/**
 * A merged version of `kolor` module, providing both `colors` and `modifiers`
 * at the root. Each function may take any parameter, convert it to string
 * if possible and transform it to another string with requested decorations
 * added.
 */
const defaultExport = Object.freeze({
  ...colors,
  ...modifiers.safe,
  unsafe: modifiers.other
});

export {
  colors,
  modifiers
}

export default defaultExport;