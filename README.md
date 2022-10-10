# phunky

[![npm package](https://img.shields.io/npm/v/phunky.svg)](https://www.npmjs.com/package/phunky)
[![npm downloads](https://img.shields.io/npm/dm/phunky.svg)](https://www.npmjs.com/package/phunky)

`phunky` (promisified thunk, pronounced funky) is yet another [thunk](https://en.wikipedia.org/wiki/Thunk)-inspired library, to delay a calculation until its result is needed, but also cache the result

Being promise-based, you can await the result of your function inline

### Usage

**Importing**

```js
// esm
import { Phunk } from 'phunky'

// cjs
const { Phunk } = require('phunky')
```

**Example usage**

```js
import { Phunk } from 'phunky'

let counter = 0

const getNextCounter = async () => {
  counter += 1
  return counter
}

const counterCache = new Phunk(getNextCounter)

console.log(await counterCache.current()) // 1
console.log(await counterCache.current()) // 1
console.log(await counterCache.next()) // 2
console.log(await counterCache.next()) // 3
console.log(await counterCache.current()) // 3
```

**Resolution status**

If you have a long-running function to execute, you can always inspect the status using the following helper methods

- `isResolving` will return true if your function is running
- `isResolved` will return true if your function completed without throwing
- `isRejected` will return true if your function threw an error

```js
const myThunk = new Phunk(async () => { /* Some long process */ })

myThunk.next() // if you don't await the result then:
console.log(myThunk.isResolving()) // true
console.log(myThunk.isResolved()) // false
console.log(myThunk.isRejected()) // false
```
