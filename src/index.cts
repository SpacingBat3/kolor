const modifiers_safe = {
    bold: 1,
    underscore: 4,
    invert: 7,
} as const

const modifiers_other = {
    grayedOut: 2,
    italic: 3,
    slowBlink: 5,
    rapidBlink: 6,
    strikethrough: 9
} as const

function generateColors() {
    const colors = [
        'black',
        'red',
        'green',
        'yellow',
        'blue',
        'magenta',
        'cyan',
        'white'
    ] as const

    /** A type that contains definiftion of all 16-bit colors variants */
    interface Colors {
        regular: typeof colors[number];
        bg: `${typeof colors[number]}Bg`
        bright: `bright${Capitalize<typeof colors[number]>}`;
        brightBg: `bright${Capitalize<typeof colors[number]>}Bg`;
    }

    const colorsObject = ({} as Record<Colors[keyof Colors], number>);
    for (const color of colors) {
        const capitalizeColor = color.charAt(0).toUpperCase()+color.slice(1);
        const value = 30 + colors.indexOf(color);
        colorsObject[color] = value;
        colorsObject[color+'Bg' as Colors['bg']] = value + 10;
        colorsObject['bright'+capitalizeColor as Colors['bright']] = value + 60
        colorsObject['bright'+capitalizeColor+'Bg' as Colors['brightBg']] = value + 70
    }

    return colorsObject;
}

type RecordLog<T extends Record<string,unknown>> = Record<keyof T, (value:string)=>string>;

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

function getFuncWithAliases() {
    const colors = enum2func(generateColors());
    return {
        ...colors,
        /** An alias of `colors.magenta`. */
        purple: colors.magenta,
        /** An alias of `colors.magentaBg`. */
        purpleBg: colors.magentaBg,
        /** An alias of `colors.white`. */
        lightGray: colors.white,
        /** An alias of `colors.white`. */
        lightGrey: colors.white,
        /** An alias of `colors.brightBlack`. */
        gray: colors.brightBlack,
        /** An alias of `colors.brightBlack`. */
        grey: colors.brightBlack,
        /** An alias of `colors.brightBlackBg`. */
        grayBg: colors.brightBlackBg,
        /** An alias of `colors.brightBlackBg`. */
        greyBg: colors.brightBlackBg
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