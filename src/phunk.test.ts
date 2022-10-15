import { jest, describe, it, expect } from '@jest/globals'
import { Phunk } from './phunk'

const noop = () => {}

const sleep = (ms: number) => new Promise((resolve) => { setTimeout(resolve, ms) })

describe('input validation', () => {
  it.each([
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
    const resolver = jest.fn(() => 1)

    new Phunk(resolver, { init: true })

    expect(resolver).toHaveBeenCalledTimes(1)
  })

  it('does not throw unhandled exception errors if resolver throws', () => {
    const mockError = new Error('Rejection')
    const resolver = jest.fn(() => { throw mockError })

    expect(() => new Phunk(resolver, { init: true })).not.toThrow(mockError)
  })
})

describe('caching', () => {
  it('caches resolved values', async () => {
    const resolver = jest.fn(() => 1)

    const phunk = new Phunk(resolver)

    await expect(phunk.current()).resolves.toBe(1)
    await expect(phunk.current()).resolves.toBe(1)
    await expect(phunk.current()).resolves.toBe(1)

    expect(resolver).toHaveBeenCalledTimes(1)
  })

  it('allows cache to be updated', async () => {
    let counter = 0
    const resolver = jest.fn(() => {
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
    const resolver = jest.fn(() => 1)

    const phunk = new Phunk(resolver)

    // Without awaiting
    phunk.next()
    phunk.next()

    expect(resolver).toHaveBeenCalledTimes(1)
  })

  it('does not cache errors by default', async () => {
    const mockError = new Error('Rejection')

    const resolver = jest.fn<() => number>()
    resolver.mockImplementationOnce(() => { throw mockError })
    resolver.mockImplementationOnce(() => 1)

    const phunk = new Phunk(resolver)

    await expect(phunk.current()).rejects.toThrow(mockError)
    await expect(phunk.current()).resolves.toBe(1)

    expect(resolver).toHaveBeenCalledTimes(2)
  })

  it('does not cache promise rejections by default', async () => {
    const mockError = new Error('Rejection')

    const resolver = jest.fn<() => Promise<number>>()
    resolver.mockImplementationOnce(async () => Promise.reject(mockError))
    resolver.mockImplementationOnce(() => Promise.resolve(1))

    const phunk = new Phunk(resolver)

    await expect(phunk.current()).rejects.toThrow(mockError)
    await expect(phunk.current()).resolves.toBe(1)

    expect(resolver).toHaveBeenCalledTimes(2)
  })

  it('can be configured to cache rejections', async () => {
    const mockError = new Error('Rejection')

    const resolver = jest.fn<() => Promise<number>>()
    resolver.mockImplementationOnce(async () => Promise.reject(mockError))
    resolver.mockImplementationOnce(() => Promise.resolve(1))

    const phunk = new Phunk(resolver, { cacheRejections: true })

    await expect(phunk.current()).rejects.toThrow(mockError)
    await expect(phunk.current()).rejects.toThrow(mockError)

    expect(resolver).toHaveBeenCalledTimes(1)
  })

  describe('ttl', () => {
    it('updates the cache if the value is stale', async () => {
      let counter = 0
      const resolver = jest.fn(() => {
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
      const resolver = jest.fn(() => {
        counter += 1
        return counter
      })
  
      const ttl = 100
      const phunk = new Phunk(resolver, { ttl })

      await expect(phunk.current()).resolves.toBe(1)
      await expect(phunk.next()).resolves.toBe(2)

      expect(resolver).toHaveBeenCalledTimes(2)
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
})
