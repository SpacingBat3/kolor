import util = require("util");

type RecordLog<T extends readonly string[]> = Record<T[number], (value:string)=>string>;

const capitalize = <T extends string>(string:T) => string.charAt(0).toUpperCase()+string.slice(1) as Capitalize<T>;

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

const colors_util = Object.freeze(([
    "black",
    "red",
    "green",
    "yellow",
    "blue",
    "magenta",
    "cyan",
    "white"
] as const).flatMap(color => {
    const bright = color === "black" ? "gray" : `${color}Bright` as const;
    return [color, bright, `bg${capitalize(color)}`, `bg${capitalize(bright)}`] as const
}));

const shouldUseColors = (() => {
    switch(process.argv.toString().match(/--color(?:,|=)(always|auto|never)/)?.[1] ?? "auto") {
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

function tuple2function<T extends readonly string[]>(tuple: T) {
    const functions = ({} as RecordLog<T>);
    // Generate color functions:
    for (const element of tuple) {
        const ANSICode = util.inspect.colors[element]?.[0].toString();
        const ANSIEscape = ANSICode ? "\x1b[" + ANSICode + 'm' : undefined;
        if (ANSIEscape)
            functions[element as T[number]] = (value) => {
                if(typeof value !== "string")
                    throw new TypeError("Parameter 'value' should be of type 'string'.");
                if (shouldUseColors)
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
        /** An alias of `colors.bgGray. */
        bgGrey: colors.bgGray,
        /** An alias of `colors.bgGray`. */
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
const colors = Object.freeze(getFuncWithAliases());
/**
 * An object grouped by platform support, including functions to tranform text
 * in the console to change it appearance (e.g. make it underlined) rather than
 * just set a specific font color.
 */
const modifiers = Object.freeze({
    /**
     * Modifiers working fine across most popular platfroms/consoles.
     */
    safe: tuple2function(modifiers_safe),
    /**
     * Other modifiers that may not work with all consoles (e.g. `cmd.exe`).
     */
    other: tuple2function(modifiers_other)
})

const defaultExport = Object.freeze({
    ...colors,
    ...modifiers.safe,
    unsafe: modifiers.other
})

export = Object.freeze({
    default: defaultExport,
    colors,
    modifiers
})