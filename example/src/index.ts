import {colors, modifiers} from "@spacingbat3/kolor";

function printAll(name:string, object:Record<string,(x:string)=>string>) {
    console.log(name+":");
    for (const key of Object.keys(object)) {
        console.log(" • "+(object[key]?.(key)??"invalid"));
    }
    console.log();
}

printAll("Colors",colors);
printAll(modifiers.other.italic("Safe")+" modifiers",modifiers.safe);
printAll("Other modifiers (not all of them may work for every console)",modifiers
.other)