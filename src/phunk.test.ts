import { describe, it, expect, mock } from 'bun:test'
import { Phunk } from './phunk'

const noop = () => {}

const sleep = (ms: number) => new Promise((resolve) => { setTimeout(resolve, ms) })

const expectToThrowShim = async (fn: () => Promise<any>, expectedError: Error) => {
  try {
    await fn()
    expect.unreachable()
  } catch (error) {
    expect(error).toBe(expectedError)
  }
}

describe('input validation', () => {
  it.each<any>([
    null, '1', -1, 1.5,
  ])('ttl must be a positive integer when provided', (ttlInput) => {
    const ttl = ttlInput as number

    expect(() => (
      new Phunk(noop, { ttl })
    )).toThrow(new TypeError('<config.ttl> must be a positive integer'))
  })
})

describe('(a)sync resolvers', () => {
  it('supports sync resolvers', async () => {
    const syncResolver = () => 1

    const phunk = new Phunk(syncResolver)

    await expect(phunk.current()).resolves.toBe(1)
  })

  it('supports async resolvers', async () => {
    const asyncResolver = async () => Promise.resolve(1)

    const phunk = new Phunk(asyncResolver)

    await expect(phunk.current()).resolves.toBe(1)
  })
})

describe('immediately invoke', () => {
  it('can be configured to immediately invoke the resolver', () => {
    const resolver = mock(() => 1)

    new Phunk(resolver, { init: true })

    expect(resolver).toHaveBeenCalledTimes(1)
  })

  it('does not throw unhandled exception errors if resolver throws', () => {
    const mockError = new Error('Rejection')
    const resolver = () => { throw mockError }

    expect(() => new Phunk(resolver, { init: true })).not.toThrow(mockError)
  })
})

describe('initial value', () => {
  it('can be configured to have an initial value', async () => {
    const resolver = mock(() => 2)

    const phunk = new Phunk(resolver, { initialValue: 1 })

    await expect(phunk.current()).resolves.toBe(1)

    expect(resolver).toHaveBeenCalledTimes(0)
  })

  it('does not use undefined as an initial value by default', async () => {
    const resolver = () => 1

    const phunk = new Phunk(resolver, { initialValue: undefined })

    await expect(phunk.current()).resolves.toBe(1)
  })

  it('can be configured to allow an initial value of undefined', async () => {
    const resolver = () => 1

    const phunk = new Phunk(resolver, { initialValue: undefined, allowUndefinedInitialValue: true })

    await expect(phunk.current()).resolves.toBeUndefined()
  })

  it('never sets the initial value if not defined', async () => {
    const resolver = () => 1

    const phunk = new Phunk(resolver, { allowUndefinedInitialValue: true })

    await expect(phunk.current()).resolves.toBe(1)
  })
})

describe('caching', () => {
  it('caches resolved values', async () => {
    const resolver = mock(() => 1)

    const phunk = new Phunk(resolver)

    await expect(phunk.current()).resolves.toBe(1)
    await expect(phunk.current()).resolves.toBe(1)
    await expect(phunk.current()).resolves.toBe(1)

    expect(resolver).toHaveBeenCalledTimes(1)
  })

  it('allows cache to be updated', async () => {
    let counter = 0
    const resolver = mock(() => {
      counter += 1
      return counter
    })

    const phunk = new Phunk(resolver)

    await expect(phunk.current()).resolves.toBe(1)
    await expect(phunk.current()).resolves.toBe(1)
    await expect(phunk.next()).resolves.toBe(2)
    await expect(phunk.current()).resolves.toBe(2)

    expect(resolver).toHaveBeenCalledTimes(2)
  })

  it('does not unnecessarily invoke the resolver if already resolving', () => {
    const resolver = mock(() => 1)

    const phunk = new Phunk(resolver)

    // Without awaiting
    phunk.next()
    phunk.next()

    expect(resolver).toHaveBeenCalledTimes(1)
  })

  it('does not cache errors by default', async () => {
    const mockError = new Error('Rejection')

    const resolver = mock(() => 1)
    resolver.mockImplementationOnce(() => { throw mockError })

    const phunk = new Phunk(resolver)

    await expectToThrowShim(() => phunk.current(), mockError)
    await expect(phunk.current()).resolves.toBe(1)

    expect(resolver).toHaveBeenCalledTimes(2)
  })

  it('does not cache promise rejections by default', async () => {
    const mockError = new Error('Rejection')

    const resolver = mock(() => Promise.resolve(1))
    resolver.mockImplementationOnce(async () => Promise.reject(mockError))

    const phunk = new Phunk(resolver)

    await expectToThrowShim(() => phunk.current(), mockError)
    await expect(phunk.current()).resolves.toBe(1)

    expect(resolver).toHaveBeenCalledTimes(2)
  })

  it('can be configured to cache rejections', async () => {
    const mockError = new Error('Rejection')

    const resolver = mock(() => Promise.resolve(1))
    resolver.mockImplementationOnce(async () => Promise.reject(mockError))

    const phunk = new Phunk(resolver, { cacheRejections: true })

    await expectToThrowShim(() => phunk.current(), mockError)
    await expectToThrowShim(() => phunk.current(), mockError)

    expect(resolver).toHaveBeenCalledTimes(1)
  })

  describe('ttl', () => {
    it('updates the cache if the value is stale', async () => {
      let counter = 0
      const resolver = mock(() => {
        counter += 1
        return counter
      })

      const ttl = 100
      const phunk = new Phunk(resolver, { ttl })

      await expect(phunk.current()).resolves.toBe(1)
      await expect(phunk.current()).resolves.toBe(1)

      expect(resolver).toHaveBeenCalledTimes(1)

      await sleep(ttl)

      await expect(phunk.current()).resolves.toBe(2)

      expect(resolver).toHaveBeenCalledTimes(2)
    })

    it('cache can always be manually updated', async () => {
      let counter = 0
      const resolver = mock(() => {
        counter += 1
        return counter
      })

      const ttl = 100
      const phunk = new Phunk(resolver, { ttl })

      await expect(phunk.current()).resolves.toBe(1)
      await expect(phunk.next()).resolves.toBe(2)

      expect(resolver).toHaveBeenCalledTimes(2)
    })

    it('initial values also have the ttl', async () => {
      const resolver = mock(() => 2)

      const ttl = 100
      const phunk = new Phunk(resolver, { initialValue: 1, ttl })

      await expect(phunk.current()).resolves.toBe(1)

      await sleep(ttl)

      await expect(phunk.current()).resolves.toBe(2)

      expect(resolver).toHaveBeenCalledTimes(1)
    })
  })

  describe('manual stale check', () => {
    it.each([
      [false, false],
      [1, false],
      [true, true],
    ])('cache is stale when the stale method returns true', async (staleResult, shouldBeStale) => {
      const resolver = mock(() => 1)
      const stale = () => staleResult as boolean

      const phunk = new Phunk(resolver, { stale })

      await phunk.current()
      await phunk.current()

      expect(resolver).toHaveBeenCalledTimes(shouldBeStale ? 2 : 1)
    })

    it('stale checks can be async', async () => {
      const resolver = mock(() => 1)
      const stale = async () => {
        await sleep(100)
        return true
      }

      const phunk = new Phunk(resolver, { initialValue: 0, stale })

      await phunk.current()

      expect(resolver).toHaveBeenCalledTimes(1)
    })

    it.each([
      [0, 1],
      [2, 2],
    ])('stale checks receive the currently resolved value', async (initialValue, expected) => {
      const resolver = () => 1

      const phunk = new Phunk(resolver, { initialValue, stale: current => current === 0 })

      await expect(phunk.current()).resolves.toBe(expected)
    })
  })
})

describe('resolver status', () => {
  it('before first resolve', () => {
    const phunk = new Phunk(noop)

    expect(phunk.isResolving()).toBe(false)
    expect(phunk.isResolved()).toBe(false)
    expect(phunk.isRejected()).toBe(false)
  })

  it('during resolve', () => {
    const phunk = new Phunk(noop)

    // Without awaiting
    phunk.current()

    expect(phunk.isResolving()).toBe(true)
    expect(phunk.isResolved()).toBe(false)
    expect(phunk.isRejected()).toBe(false)
  })

  it('after resolve', async () => {
    const phunk = new Phunk(noop)

    await phunk.current()

    expect(phunk.isResolving()).toBe(false)
    expect(phunk.isResolved()).toBe(true)
    expect(phunk.isRejected()).toBe(false)
  })

  it('after reject', async () => {
    const resolver = () => Promise.reject()

    const phunk = new Phunk(resolver)

    // Suppress rejection
    await phunk.current().catch(noop)

    expect(phunk.isResolving()).toBe(false)
    expect(phunk.isResolved()).toBe(false)
    expect(phunk.isRejected()).toBe(true)
  })

  it('with initial value', () => {
    const phunk = new Phunk(() => 1, { initialValue: 1 })

    expect(phunk.isResolving()).toBe(false)
    expect(phunk.isResolved()).toBe(true)
    expect(phunk.isRejected()).toBe(false)
  })

  it('with undefined initial value', () => {
    const phunk = new Phunk(noop, { initialValue: undefined, allowUndefinedInitialValue: true })

    expect(phunk.isResolving()).toBe(false)
    expect(phunk.isResolved()).toBe(true)
    expect(phunk.isRejected()).toBe(false)
  })
})
