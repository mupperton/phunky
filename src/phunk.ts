interface Config {
  init?: boolean
  cacheRejections?: boolean
  ttl?: number
}

const noop = () => {}

class Phunk<T> {
  #fn: () => T

  #promise: Promise<T> | null = null

  #isResolving = false
  #isResolved = false
  #isRejected = false

  #cacheRejections

  #ttl
  #lastResolve = 0

  constructor(fn: () => T, config?: Config) {
    const options = config ?? {}

    if (typeof options.ttl !== 'undefined' && (!Number.isSafeInteger(options.ttl) || options.ttl < 0)) {
      throw new TypeError('<config.ttl> must be a positive integer')
    }

    this.#fn = fn

    this.#cacheRejections = options.cacheRejections === true

    this.#ttl = options.ttl ?? null

    if (options.init === true) {
      this.next().catch(noop) // catch error to avoid unhandled promise exceptions
    }
  }

  async current() {
    if (this.#promise === null) {
      // first invocation
      return this.next()
    }
    if (!this.#cacheRejections && this.#isRejected) {
      // Configured not to cache rejections and previously rejected
      return this.next()
    }
    if (this.#ttl !== null && Date.now() >= (this.#lastResolve + this.#ttl)) {
      // ttl expired
      return this.next()
    }

    return this.#promise
  }

  async next() {
    if (!this.#isResolving) {
      this.#promise = this.#resolve()
    }
    return this.#promise
  }

  async #resolve() {
    this.#isResolving = true
    this.#isResolved = false
    this.#isRejected = false

    try {
      const result = await this.#fn()
      this.#isResolved = true
      return result
    } catch (error) {
      this.#isRejected = true
      throw error
    } finally {
      if (this.#ttl !== null) {
        this.#lastResolve = Date.now()
      }
      this.#isResolving = false
    }
  }

  isResolving() {
    return this.#isResolving
  }

  isResolved() {
    return this.#isResolved
  }

  isRejected() {
    return this.#isRejected
  }
}

export { Phunk }
