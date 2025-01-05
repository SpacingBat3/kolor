import { describe, it } from "node:test";
import assert from "node:assert/strict"
import { stripVTControlCharacters, inspect, styleText } from "node:util";

import type { TestContext } from "node:test";

// Mock with --color=always for tests.
process.argv.push("--color","always");

type module = typeof import("#lib")["default"];

// Common diagnostic logs on errors and success

function tErr(t:TestContext, apisOk:string[], last:string) {
  t.diagnostic(`valid apis ${apisOk.length}`);
  if(apisOk.length)
    t.diagnostic(`last valid endpoint '${apisOk.at(-1)}'`)
  t.diagnostic(`failing at ${last}`)
}

function tOk(t:TestContext, apisOk:string[], api:object) {
  t.diagnostic(`valid apis ${apisOk.length}${apisOk.length === Object.keys(api).length ? " (all)" : ""}`);
}

/** Kolor, with "unsafe" API being available directly at the top dir and aliases stripped out. */
const kolor = await (async() => {
  const {default:kolor} = await import("#lib");
  const res = Object.fromEntries(Object.entries({...kolor,...kolor.unsafe})
    .filter(([name,fn]) => typeof fn === "function" && fn.name === name));
  delete (res as {unsafe?:unknown}).unsafe;
  Object.setPrototypeOf(res,null);
  Object.defineProperty(res,"name",{value:"kolor",enumerable:false});
  return Object.freeze(res as unknown as Readonly<Omit<module&module["unsafe"],"unsafe">&{name:"kolor"}>);
})();

for(const api of [kolor]) describe(`${api.name} works properly`, () => {
  it("only applies colors for each function", t => {
    const apisOk = [];
    let lastApi = "none";
    try {
      for(const fn of Object.values(api as Omit<typeof api,"name">)) {
        lastApi = fn.name;
        const res = fn("foo");
        assert.strictEqual(typeof res, "string",`${fn.name}'s result is of invalid type`);
        assert.notStrictEqual(res,"foo",`${fn.name}'s result was not modified`);
        assert.strictEqual(stripVTControlCharacters(res),"foo",`${fn.name}'s result was incorrectly modified`);
        apisOk.push(fn.name);
      }
    } catch(err) {
      tErr(t,apisOk,lastApi);
      throw err;
    }
    tOk(t,apisOk,api);
  })
  it("applies each 16-bit palete color by word correctly", t => {
    const ANSICodesMap = {
      // Use node:util for data source…
      ...inspect.colors,
      // …among other ANSI specs for missing data.
      rapidBlink: [6,25]
    }
    const missingTestCodes = Object.keys(kolor).filter(k => !Object.keys(ANSICodesMap).includes(k));
    assert.strictEqual(missingTestCodes.length,0,`test has missing checks for: ${missingTestCodes.join(', ')}`);
    const apisOk = [];
    let lastApi="none";
    try {
      for(const [name,[start,end]] of Object.entries(ANSICodesMap) as [keyof Omit<typeof kolor,"name">,[number,number]][]) {
        lastApi = name;
        assert.ok(
          name in kolor,
          `${name} not implemented in kolor`
        );
        assert.strictEqual(
          kolor[name](""),
          `\x1b[${start}m\x1b[${end}m`,
          `${name} is not applied correctly`
        );
        apisOk.push(name);
      }
    } catch(err) {
      tErr(t,apisOk,lastApi);
      throw err;
    }
    tOk(t,apisOk,api);
  })
  it("has compatible color names and functionality with Node's `styleText` API", t => {
    const apisOk = [];
    let lastApi="none";
    try {
      for(const name of Object.keys(inspect.colors) as (Exclude<Parameters<typeof styleText>[0],unknown[]>)[]) {
        lastApi=name;
        assert.ok(name in kolor,`${name} not implemented in kolor`);
        assert.strictEqual(kolor[name](""),styleText(name,""),`${name} not compatible between kolor and styleText`);
        apisOk.push(name);
      }
    } catch(err) {
      tErr(t,apisOk,lastApi);
      throw err;
    }
    tOk(t,apisOk,api);
  })
})