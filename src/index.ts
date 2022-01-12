enum modifiers_safe {
    bold = 1,
    underscore = 4,
    invert = 7,
}

enum modifiers_other {
    grayedOut=2,
    italic,
    blink=5,
    blink_2,
    strikethrough = 9
}

enum colors_16bit {
    black = 30,
    red,
    green,
    yellow,
    blue,
    purple,
    cyan,
    white,
    blackBg = 40,
    redBg,
    greenBg,
    yellowBg,
    blueBg,
    magentaBg,
    cyanBg,
    whiteBg,
    gray = 90,
    brightRed,
    brightGreen,
    brightYellow,
    brightBlue,
    brightMagenta,
    brightCyan,
    brightWhite,
    grayBg = 100,
    brightRedBg,
    brightGreenBg,
    brightYellowBg,
    brightBlueBg,
    brightMagentaBg,
    brightCyanBg,
    brightWhiteBg
}

type RecordLog<T extends Record<string,unknown>> = Record<keyof T, (value:string)=>string>;

function shouldUseColors() {
    switch(process.argv.toString().match(/--color(?:,|=)(always|auto|never)/)?.[1] ?? "auto") {
        case "always":
            return  true;
        case  "never":
            return false;
        default:
            return (process.stdout.isTTY === true && process.stderr.isTTY === true);
    }
}

function enum2func<T extends Record<string,number|string>>(em: T) {
    const functions = ({} as RecordLog<T>);
    // Generate colors functions:
    for(const key in em) {
        if(/^[0-9]+$/.test(key)) continue;
        functions[key as keyof T] = (value) => {
            if(shouldUseColors())
                return "\x1b["+em[key].toString()+'m'+value+"\x1b[0m";
            else
                return value;
        }
    }
    return functions;
}

/** 
 * An object containing multiple functions used to colorize the text.
 * 
 * @example
 * // Print error in the console.
 * console.error(colors.red("[Error]")+" Something's not right...")
 */
export const colors = enum2func(colors_16bit);
export const modifiers = {
    /**
     * Modifiers working fine across most popular platfroms/consoles.
     */
    safe: enum2func(modifiers_safe),
    /**
     * Other modifiers that may not work with all consoles (e.g. `cmd.exe`).
     */
    other: enum2func(modifiers_other)
}

const defaultExport = {
    ...colors,
    ...modifiers.safe,
    unsafe: modifiers.other
}



export default defaultExport;