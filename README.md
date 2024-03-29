# @spacingbat3/kolor

A simple Node.js module to add *kolors* to you console!

*Kolor* is a Polish word that means *colour* / *color*.

## Usage:

### ESM / TypeScript:

1. Importing selected group of functions (`colors` or `modifiers[*]`):
```ts
import {colors, modifiers} from "@spacingbat3/kolor"

// Because errors should be red :)
console.error(colors.red("ERROR: Something went wrong!"))

// Modifiers are grouped by `safe` and `other`:
console.log(modifiers.safe.bold("Definitely important text."))
```

2. Importing `default` object as `colors` that contains all method packed in one
   object (except `other` modifiers, they're in `unsafe` object).
```ts
import colors from "@spacingbat3/kolor"

// Now, syntax is similar to the one in `colors/safe` module.
console.warn(colors.bold("==> "+colors.brightYellow("Warning:"))+" Something happened!")
```

### CommonJS: 

```js
// Synchronously with `require` (CommonJS):
const { colors, modifiers } = require("@spacingbat3/kolor")

console.log(colors.purple("Colorized text goes here."));

// or, with "default" object

const colors_2 = require("@spacingbat3/kolor").default;

console.log(colors_2.purple("Colorized text goes here."));

// Async with `import` (ESM):
import("@spacingbat3/kolor")
   .then(kolor => {
      // Here, default, colors and modifiers objects are available.
      const { colors, modifiers } = kolor;
      console.debug(colors.gray(colors.bold("Debug")+": some information goes here!"));
   })
   .catch(e => console.error(e));
```

## Why I started to develop it?

In general, I made this module as an answer to `colors` library *sabotage*. I
decided to neither thrust `colors` not any alternatives to it, when I only need
some of its features.

You can use this library as well in your project, this is why I publish it.
You may ask: *should I trust you*? It depends on what you need – as ISC license
says, this program has no guarantee it will work as expected, yet this software
is developed in hope to be useful to anyone (like most OSS software should be
developed). Also, I may not frequently improve it, I made it specifically for my
personal needs, if you need something more complex just use another library.

Please note it's syntax is not fully compatible with `colors`, specifically it
is not touching the `String.prototype`. You may find it easier to move from
`colors/safe`, through. If you need a library that uses `String.prototype` to
easily switch from `colors`, this module is not for you, neither `chalk` is.

## Why not just use `chalk` or fork of `colors`?

This project has a different philosophy that both of these projects. It's
neither an ESM module nor has any rich features – it's much more simple, doing
only some simple tests to detect if text should be colorized or not and being
limited (at least for now) only to 16-bit color palete. It might be however
much more performant, as it uses ES2021 features to be much shorter, simpler
and not being *bloated* with unnecessary colors.

Another difference (at least from `colors`) is that `kolor` separates some
ANSI escape codes that are not working on all platforms, which you may find
useful if your application is meant to be cross-platform.

Since `v3.2.0` it also provides the type definitions for transforming the
literal types, which makes TypeScript to accurately predict all combinations of
types for the library and overall improves the type accuracy (not just for
literals).

## Legal

This project is licensed under the `ISC` license, which should be [distributed
with this project](./LICENSE "License of this software"). Not distributing it
with this library might be against the license – please read the license for
further information.