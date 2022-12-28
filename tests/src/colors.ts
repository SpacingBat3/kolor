/* These tests will verify if library is using the right color codes.
 * As is uses values from node, there's chance it could break if 
 */

import {strictEqual} from "assert/strict";
import {colors, modifiers} from "@spacingbat3/kolor";

function mapIntoVT(code:number,text:string) {
  return `\x1b[${code}m${text.replaceAll("\x1b[0m",`\x1b[${code}`)}\x1b[0m`;
}

function assertColor(name:keyof typeof colors,color:number) {
  color+=(name.startsWith("bg")?10:0);
  const newLength = process.argv.push("--colors=always");
  strictEqual(colors[name](loremIpsum), mapIntoVT(color,loremIpsum));
  console.log(` * ${modifiers.other.italic("assert")} ${mapIntoVT(color,"0x"+color.toString(16))} -> ${colors[name](name)}`);
  process.argv.length = newLength-1;
}

// Sample string to be used during testing:
const loremIpsum = "Lorem Ipsum Dolor Sit Amet";

const fgArray = Object.freeze([
  "black","red","green","yellow","blue","magenta","cyan","white"
] as const);
const bgArray = Object.freeze(fgArray.map(color => `bg${color.charAt(0).toUpperCase()+color.slice(1) as Capitalize<typeof color>}` as const));

let counter = 0;
let isErr = false;
try {
console.log("\n"+modifiers.safe.underline("   (%d) %s     "), ++counter, "Standard colors");
[...fgArray,...bgArray]
  .forEach((color,value) => assertColor(color,30+(value%8)));

console.log("\n"+modifiers.safe.underline("     (%d) %s         "), ++counter, "\"Bright\" colors");
[...fgArray,...bgArray]
  .map(color => `${color}Bright` as const)
  .forEach((color,value) => assertColor(color,90+(value%8)));
} catch (e) {
  console.error("\n\n%s",e);
  isErr=true;
}
if(isErr) {
  process.exitCode = counter;
  console.error("\n%s",modifiers.safe.bold(mapIntoVT(91,"(\\)")+" Failed while processing test no. "+counter.toString()+"!"));
} else {
  console.log("\n%s",modifiers.safe.bold(mapIntoVT(44,mapIntoVT(97," i "))+" Passed all "+counter.toString()+" tests!"));
}