type Config<T> = {
  init?: boolean
  initialValue?: T
  allowUndefinedInitialValue?: boolean
  cacheRejections?: boolean
  ttl?: number
  stale?: (currentResolvedValue?: T) => boolean | Promise<boolean>
}

const noop = () => {}

export class Phunk<T> {
  #fn: () => T | Promise<T>

  #promise: Promise<T> | null = null

  #isResolving = false
  #isResolved = false
  #isRejected = false

  #cacheRejections
  #ttl
  #lastResolveTime = 0
  #currentResolvedValue?: T
  #stale: ((currentResolvedValue?: T) => boolean | Promise<boolean>) | null = null

  constructor(fn: () => T | Promise<T>, config?: Config<T>) {
    const options = config ?? {}

    if (typeof options.ttl !== 'undefined' && (!Number.isSafeInteger(options.ttl) || options.ttl < 0)) {
      throw new TypeError('<config.ttl> must be a positive integer')
    }

    this.#fn = fn

    this.#cacheRejections = options.cacheRejections === true

    this.#ttl = options.ttl ?? null

    if (typeof options.stale === 'function') {
      this.#stale = options.stale
    }

    if (typeof options.initialValue !== 'undefined') {
      this.#promise = Promise.resolve(options.initialValue)
      this.#currentResolvedValue = options.initialValue
      this.#isResolved = true
    } else if (Object.hasOwnProperty.call(options, 'initialValue') && options.allowUndefinedInitialValue === true) {
      this.#promise = Promise.resolve(undefined as T)
      this.#isResolved = true
    }

    if (this.#promise !== null && this.#ttl !== null) {
      this.#lastResolveTime = Date.now()
    }

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
    if (this.#ttl !== null && Date.now() >= (this.#lastResolveTime + this.#ttl)) {
      // ttl expired
      return this.next()
    }
    if (this.#stale !== null && await this.#stale(this.#currentResolvedValue) === true) {
      // current resolved value is stale
      return this.next()
    }

    return this.#promise
  }

  async next() {
    if (!this.#isResolving) {
      this.#promise = this.#resolve()
    }
    return this.#promise as Promise<T>
  }

  async #resolve() {
    this.#isResolving = true
    this.#isResolved = false
    this.#isRejected = false

    try {
      const result = await this.#fn()
      this.#currentResolvedValue = result
      this.#isResolved = true
      return result
    } catch (error) {
      this.#currentResolvedValue = undefined
      this.#isRejected = true
      throw error
    } finally {
      if (this.#ttl !== null) {
        this.#lastResolveTime = Date.now()
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
