# phunky

[![npm package](https://img.shields.io/npm/v/phunky.svg)](https://www.npmjs.com/package/phunky)
[![npm downloads](https://img.shields.io/npm/dm/phunky.svg)](https://www.npmjs.com/package/phunky)

`phunky` (promisified thunk, pronounced funky) is yet another [thunk](https://en.wikipedia.org/wiki/Thunk)-inspired library, to delay a calculation until its result is needed, but also cache the result

:star: You can provide a max age for the cache, so it automatically resolves your function again when stale, or force a new value at any time

:tada: You can customise the behaviour of your Phunk, perhaps immediately resolve, or choose to cache rejections, very funky!

:goat: Being promise-based, you can await the result of your function inline

:100: Test coverage

### Getting started

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

**Cache auto-refresh**

Setting a ttl (time-to-live) will allow your function to automatically be re-invoked if the value is considered stale. Great for caching access tokens, or any values that can be time-expensive to refresh on every operation.

```js
let counter = 0

const getNextCounter = async () => {
  counter += 1
  return counter
}

const counterCache = new Phunk(getNextCounter, { ttl: 1000 })

console.log(await counterCache.current()) // 1
// wait at least 1 second
console.log(await counterCache.current()) // 2
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

### Configuration

Optionally pass a configuration object as a second argument to the constructor, with the following options

* `init`: Optional, defaults to `false`, set to `true` to immediately invoke your function and have the result ready for when you first call `.current()`.
* `cacheRejections`: Optional, defaults to `false`, set to `true` for your Phunky instance to cache any errors that are thrown by your function. If `false`, calling `.current()` will try re-invoking your function if it previously rejected.
* `ttl`: (time-to-live) Optional. If set, it must be a positive integer for the number of **milliseconds** resolved values should live for. Any calls to `.current()` after that time, will automatically re-invoke your function to get an updated value.

### Class methods

* `current()`: Returns a promise of the result of the previous invocation of your function, or will await the result of the next invocation of your function if it has not previously been invoked or other criteria are met, see `cacheRejections` and `ttl` config options.
* `next()`: Returns a promise of the result of the next invocation of your function.
* `isResolving()`: Returns a boolean of whether your function is currently being invoked.
* `isResolved()`: Returns a boolean of whether your function previously resolved without error. Will always return `false` if `isResolving()` returns `true`.
* `isRejected()`: Returns a boolean of whether your function previously rejected with an error. Will always return `false` if `isResolving()` returns `true`.
