interface Config {
  init?: boolean
  cacheRejections?: boolean
}

const noop = () => {}

class Phunk<T> {
  #fn: () => T

  #promise: Promise<T> | null = null

  #isResolving = false
  #isResolved = false
  #isRejected = false

  #cacheRejections

  constructor(fn: () => T, config?: Config) {
    this.#fn = fn

    const options = config ?? {}

    this.#cacheRejections = options.cacheRejections === true

    if (options.init === true) {
      this.next().catch(noop) // catch error to avoid unhandled promise exceptions
    }
  }

  async current() {
    if (this.#promise === null) return this.next()
    if (!this.#cacheRejections && this.#isRejected) return this.next()

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
