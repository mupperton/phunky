# Changelog

All notable changes will be included in this file.

## 1.2.0 (2023-04-10)

### Features

* Added callback option to manually check for a stale value ([97b4d85](https://github.com/mupperton/phunky/commit/97b4d85307fc3d0985dc0c649ad0e717a47cf58a))

### Fixes

* `isResolved()` now returns `true` when an initial value is provided ([7b54bc3](https://github.com/mupperton/phunky/commit/7b54bc3f223936f4844720bd57865a37164bb823))

## 1.1.0 (2022-11-06)

### Features

* Added option to set an initial value ([418e19c](https://github.com/mupperton/phunky/commit/418e19cbe728d1c75ee25e2d7f1ed948e8720a06))

## 1.0.0 (2022-10-15) - Official release :rocket:

### Tests

* Test suite added with 100% test coverage ([7ec47ab](https://github.com/mupperton/phunky/commit/7ec47abc09b986aa28f5d7688bdedf494afb7514))

# Beta releases

## 0.2.1 (2022-10-11)

### Fixes

* Fixed typings for promises, no longer have return types of `Promise<Promise<T>>` ([425e3ed](https://github.com/mupperton/phunky/commit/425e3ed98d11f769a880b01f495b65fc1317081e))

## 0.2.0 (2022-10-11)

### Features

* Added `ttl` config option to automatically re-invoke your function if it is considered stale ([ad7bfde](https://github.com/mupperton/phunky/commit/ad7bfdeac306c87f4df692aed4e385e39d554618))

### Documentation

* Added documentation of the config options and class methods for `Phunk` ([50dd6b7](https://github.com/mupperton/phunky/commit/50dd6b784be3225b1067e7d89a856e621db7d707))

# Alpha releases

## 0.1.0 (2022-10-10)

### Features

* Added `cacheRejections` config option to opt-in to caching the result even when an error is thrown ([79b88af](https://github.com/mupperton/phunky/commit/79b88af9e9ca5c006f9b12233d88984194f17d03))

## 0.0.6 (2022-10-10)

### Breaking Changes

* Named export `Thunk` renamed to `Phunk` ([619e9bf](https://github.com/mupperton/phunky/commit/619e9bf1ba51fef5185813ba13e43bcc0081f7d1))

### Features

* Added `init` config option to immediately invoke the thunk ([2bc26c4](https://github.com/mupperton/phunky/commit/2bc26c48634c0cbdc344b422d71f57083e015d2c))
