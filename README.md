<div align=center>

# @spacingbat3/kolor

A simple Node.js/ESM module to add *kolors* to your terminal output!

*Kolor* is a Polish word that means *colour* / *color*.

</div>

## Usage:

> [!NOTE]
> Recently, `@spacingbat3/kolor` has dropped CJS syntax in favour of ESM-only
> support and loading. It also introduced the experimental `__kolorTTY` global
> you might use for now as a fallback mechanism of determining whenever `kolor`
> should colorize strings in non-Node.js-compatible runtimes.

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

## FAQ

### Why I started to develop it?

In general, I made this module as an answer to `colors` library *sabotage*. I
decided to neither thrust `colors` not any alternatives to it, when I only need
some of its features.

You can of course use this library as well in your project, if you want to.
As of concerns of me not being trustworthy, I don't really care that much.
Especially I should point out this software is not "corporate-grade", so in case
of the global failures, the blame lies on the user – as I disclaim any
responsibility for what this software might do, whenever intentionally or not,
as specified in the license that should be distributed with this software. Of
course, my will is to fix bugs and maintain the software, but I'm not offering
any personal help, fixes, patching nor any service you'd expect from software
used in commercial software.

### Why not just use `chalk` or fork of `colors`?

This project has a different philosophy that both of these projects. It doesn't
aim to provide any kind of complex features that are not related to ANSI escape
codes nor it aims to be complex in any way – while it aims to be a generic
solution strictly based on EcmaScript standard and only using Node's APIs when
necessary without strong dependence on them, it's goal is to be a rather simple
library, with very limited feature set to what I find necessary, hence being
more opinionated.

One of the key differences (at least from `colors`) is that `kolor` separates
some ANSI escape codes that are not working on all platforms, which you may find
useful if you aim for your code to offer cross-platform experience.

Since `v3.2.0` it also provides the type definitions for transforming the
literal types, which makes TypeScript to accurately predict all combinations of
types for the library and overall improves the type accuracy (not just for
literals).

## Legal

This project is licensed under the `ISC` license, which should be
[distributed with this project][license]. Not distributing it with this library
might be against the license – please read the license for further information.

[license]: ./LICENSE "License of this software"