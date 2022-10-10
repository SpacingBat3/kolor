import {inspect} from "util";

type PalleteBase = "black"|"red"|"green"|"yellow"|"blue"|"magenta"|"cyan"|"white";
type PalleteForeground = PalleteBase|"gray"|`${Exclude<PalleteBase,"black">}Bright`;
type PalleteBackground = `bg${Capitalize<PalleteForeground>}`;
type Pallete = PalleteForeground|PalleteBackground;

const capitalize = (string:string) => string.charAt(0).toUpperCase()+string.slice(1)

const modifiers_safe = Object.freeze([
    "reset",
    "bold",
    "underline",
    "inverse"
] as const)

const modifiers_other = Object.freeze([
    "dim",
    "italic",
    "blink",
    "hidden",
    "strikethrough",
    "doubleunderline",
    "framed",
    "overlined"
] as const);

const colors_util = Object.freeze([
    "black",
    "red",
    "green",
    "yellow",
    "blue",
    "magenta",
    "cyan",
    "white"
].flatMap(color => {
    const bright = color === "black" ? "gray" : color+"Bright"
    return [color, bright, "bg"+capitalize(color), "bg"+capitalize(bright)]
}) as Pallete[]);

type RecordLog<T extends readonly string[]> = Record<T[number], (value:string)=>string>;

function shouldUseColors() {
    switch(process.argv.toString().match(/--color(?:,|=)(always|auto|never)/)?.[1] ?? "auto") {
        case "always":
            return  true;
        case  "never":
            return false;
        default:
            return (
                // Detect if process it not piped
                process.stdout.isTTY === true && process.stderr.isTTY === true
            ) || (
                // Workaround for Electron on Windows
                "electron" in process.versions && process.platform === "win32"
            );
    }
}

function tuple2function<T extends readonly string[]>(tuple: T) {
    const functions = ({} as RecordLog<T>);
    // Generate color functions:
    for (const element of tuple) {
        const ANSICode = inspect.colors[element]?.[0].toString();
        const ANSIEscape = ANSICode ? "\x1b[" + ANSICode + 'm' : undefined;
        if (ANSIEscape)
            functions[element as T[number]] = (value) => {
                if(typeof value !== "string")
                    throw new TypeError("Parameter 'value' should be of type 'string'.");
                if (shouldUseColors())
                    return ANSIEscape + value.replace("\x1b[0m","\x1b[0m"+ANSIEscape) + "\x1b[0m";
                else
                    return value;
            };
        else
            functions[element as T[number]] = (value) => {
                if(typeof value !== "string")
                    throw new TypeError("Parameter 'value' should be of type 'string'.");
                return value;
            };
    }
    return functions;
}

function getFuncWithAliases() {
    const colors = tuple2function(colors_util);
    return {
        ...colors,
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
        /** An alias of `colors.brightBlackBg`. */
        bgGrey: colors.bgGray,
        /** An alias of `colors.brightBlackBg`. */
        bgBlackBright: colors.bgGray
    }
}

/** 
 * An object containing multiple functions used to colorize the text.
 * 
 * @example
 * // Print error in the console.
 * console.error(colors.red("[Error]")+" Something's not right...")
 */
export const colors = getFuncWithAliases();
export const modifiers = {
    /**
     * Modifiers working fine across most popular platfroms/consoles.
     */
    safe: tuple2function(modifiers_safe),
    /**
     * Other modifiers that may not work with all consoles (e.g. `cmd.exe`).
     */
    other: tuple2function(modifiers_other)
}

const defaultExport = {
    ...colors,
    ...modifiers.safe,
    unsafe: modifiers.other
}

export default defaultExport;