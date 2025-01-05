type Dict = Readonly<Record<string,readonly [number,number]>>

type looseString = string|number|bigint|boolean|null|undefined

type Include<T, U> = T extends U ? T : never;

// eslint-disable-next-line @typescript-eslint/no-invalid-void-type
type True = void;
type False = never;

type STEquals<T, U> = T|U extends U ? True : False;

type unC<T> = Exclude<T,`\x1b[${number}m${string}`>;

type replace<V extends looseString, S extends looseString, R extends looseString> =
  V extends `${infer A extends string}${S}${infer Z extends string}`
    ? `${A}${R}${replace<Z,S,R>}`
    : V;

type colorsFunc<A extends number, D extends number> = <T extends looseString>(value:T) => unC<T>|
  `\x1b[${A}m${replace<
    STEquals<T,unC<T>> extends True ? T : Include<T,`\x1b[${number}m${string}`>,
    D,
    A
  >}\x1b[${D}m`;

type resetFunc = <T extends looseString = "">(value:T) => `\x1b[0m${T}`;

type dictMap<T extends Dict> = {
  [P in keyof T]: P extends "reset" ? resetFunc : colorsFunc<T[P][0],T[P][1]>;
}

const modifiers_safe = Object.freeze({
  reset:     Object.freeze(<const>[0,  0]),
  bold:      Object.freeze(<const>[1, 22]),
  underline: Object.freeze(<const>[4, 24]),
  inverse:   Object.freeze(<const>[7, 27])
} as const) satisfies Dict;

const modifiers_other = Object.freeze({
  dim:             Object.freeze(<const>[ 2, 22]),
  italic:          Object.freeze(<const>[ 3, 23]),
  blink:           Object.freeze(<const>[ 5, 25]),
  rapidBlink:      Object.freeze(<const>[ 6, 25]),
  hidden:          Object.freeze(<const>[ 8, 28]),
  strikethrough:   Object.freeze(<const>[ 9, 29]),
  doubleunderline: Object.freeze(<const>[21, 24]),
  framed:          Object.freeze(<const>[51, 54]),
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
  switch(process.argv.toString().match(/--color(?:|=)(always|auto|never)/)?.[1] ?? "auto") {
    case "always":
      return  true;
    case  "never":
      return false;
    default:
      return (
        // Detect if process it not piped
        process.stdout.isTTY && process.stderr.isTTY
      ) || (
        // Workaround for Electron on Windows
        "electron" in process.versions && process.platform === "win32"
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
  for(const key in dict)
    if(key === "reset")
      functions[key] = (<T extends looseString="">(value:T="" as T) => "\x1b[0m"+String(value) as `\x1b[0m${T}`) satisfies resetFunc;
    else if(dict[key])
      functions[key] = mapTuple(dict[key] as T[keyof T]);
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