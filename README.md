# phunky

`phunky` (promisified thunk, pronounced funky) is yet another [thunk](https://en.wikipedia.org/wiki/Thunk)-inspired library, to delay a calculation until its result is needed, but also cache the result

Being promise-based, you can await the result of your function inline

### Usage

**Importing**

```js
// esm
import { Thunk } from 'phunky'

// cjs
const { Thunk } = require('phunky')
```

**Example usage**

```js
import { Thunk } from 'phunky'

let counter = 0

const getNextCounter = async () => {
  counter += 1
  return counter
}

const counterCache = new Thunk(getNextCounter)

console.log(await counterCache.current()) // 1
console.log(await counterCache.current()) // 1
console.log(await counterCache.next()) // 2
console.log(await counterCache.next()) // 3
console.log(await counterCache.current()) // 3
```

**Resolution status**

If you have a long-running function to execute, you can always inspect the status using the following helper methods

```js
const myThunk = new Thunk(async () => { /* Some long process */ })

console.log(myThunk.isResolving()) // true - if your function is running
console.log(myThunk.isResolved()) // false - if your function completed without throwing
console.log(myThunk.isRejected()) // false - if your function threw an error
```
