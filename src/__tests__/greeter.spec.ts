import Foow from '../index'
import { ClearType } from '../index'
interface Person {
  name: string
  age: number
}

describe(`FOOOOOOOOW`, () => {
  it(`run methods`, async () => {
    var flow = new Foow()
    let firstFn = flow.wrap<Person>(async (data, context) => {
      return {
        name: 's',
        age: 1 + data.result.age,
      }
    })
    flow.setMethod({
      name: 'first',
      handler: firstFn,
    })
    let r = await flow.run<Person>({
      name: 'first',
      data: {
        name: 'ss1first',
        age: 0,
      },
    })
    let { result } = r
    expect(result.name).toBe('s')
    expect(result.age).toBe(1)
  })

  it(`run groups`, async () => {
    var flow = new Foow()
    let firstFn = flow.wrap<Person>(async (data, context) => {
      return {
        name: 's',
        age: 1 + data.result.age,
      }
    })
    flow.setMethod({
      name: 'first',
      handler: firstFn,
    })
    let sec = flow.wrap<Person>(async (data, context) => {
      return {
        name: 's',
        age: 3 + data.result.age,
      }
    })
    flow.setMethod({
      name: 'sec',
      handler: sec,
    })
    flow.setGroup({
      name: 'test',
      flows: ['first', 'sec'],
    })
    let r = await flow.run<Person>({
      name: 'test',
      data: {
        name: 'ss',
        age: 2,
      },
    })
    let { result } = r
    expect(result.name).toBe('s')
    expect(result.age).toBe(6)
  })

  it(`cache`, async () => {
    const flow = new Foow()
    let count = 0
    flow.setMethod({
      name: 'first',
      handler: flow.wrap<Person>(async (data, context) => {
        count = count + data.result.age
        return {
          name: data.result.name,
          age: count,
        }
      }),
    })

    flow.setGroup({
      name: 'cacheTest',
      flows: ['first', 'first', 'first'],
      useCache: true,
    })

    let r = await flow.run<Person>({
      name: 'cacheTest',
      data: {
        name: 'loving',
        age: 10,
      },
    })

    let rr = await flow.run<Person>({
      name: 'cacheTest',
      data: {
        name: 'loving',
        age: 10,
      },
    })

    let rrr = await flow.run<Person>({
      name: 'cacheTest',
      data: {
        name: 'loving',
        age: 10,
      },
    })
    expect(r.result.age).toBe(40)
    expect(rr.result.age).toBe(40)
    expect(rrr.result.age).toBe(40)
  })

  it(`no cache`, async () => {
    const flow = new Foow()
    let count = 0
    flow.setMethod({
      name: 'first',
      handler: flow.wrap<Person>(async (data, context) => {
        count = count + data.result.age
        return {
          name: data.result.name,
          age: count,
        }
      }),
    })

    flow.setGroup({
      name: 'cacheTest',
      flows: ['first', 'first', 'first'],
    })

    let r = await flow.run<Person>({
      name: 'cacheTest',
      data: {
        name: 'loving',
        age: 10,
      },
    })

    let rr = await flow.run<Person>({
      name: 'cacheTest',
      data: {
        name: 'loving',
        age: 10,
      },
    })

    let rrr = await flow.run<Person>({
      name: 'cacheTest',
      data: {
        name: 'loving',
        age: 10,
      },
    })
    expect(r.result.age).toBe(40)
    expect(rr.result.age).toBe(200)
    expect(rrr.result.age).toBe(840)
  })

  it(`context`, async () => {
    interface XPer extends Person {
      dataName: string
    }
    const flow = new Foow()
    flow.setMethod({
      name: 'first',
      handler: flow.wrap<XPer, Person>(async (data, context) => {
        return {
          name: context.name,
          age: context.age,
          dataName: data.result.name,
        }
      }),
    })
    let r = await flow.run<XPer>({
      name: 'first',
      data: {
        name: 'moke',
      },
      context: {
        name: 'kiki',
        age: 28,
      },
    })
    expect(r.result.name).toBe('kiki')
    expect(r.result.age).toBe(28)
    expect(r.result.dataName).toBe('moke')
  })

  it(`cache test`, async () => {
    const flow = new Foow()
    var testValue = 100
    var times = 0
    interface Test {
      value: number
    }
    flow.setMethod({
      name: 'cacheFn',
      handler: flow.wrap<Test>(async () => {
        times += 1
        return { value: testValue * times }
      }),
    })
    flow.setMethod({
      name: 'cacheFn2',
      handler: flow.wrap(async (data) => {
        return { value: data.result.value + testValue }
      }),
    })
    flow.setGroup({
      name: 'cacheTest',
      flows: ['cacheFn'],
      useCache: true,
    })
    flow.setGroup({
      name: 'cacheTest2',
      flows: ['cacheTest', 'cacheFn2'],
    })
    let { result: r } = await flow.run<Test>({
      name: 'cacheTest2',
      data: {},
    })
    expect(times).toBe(1)
    expect(r.value).toBe(testValue * times + testValue)
    let { result: rr } = await flow.run<Test>({
      name: 'cacheTest2',
      data: {},
    })
    expect(times).toBe(1)
    expect(rr.value).toBe(testValue * times + testValue)
    // clear cache data
    flow.clearAll(ClearType.Cache)
    let { result: rrr } = await flow.run<Test>({
      name: 'cacheTest2',
      data: {},
    })
    expect(times).toBe(2)
    expect(rrr.value).toBe(testValue * times + testValue)

    let { result: rrrr } = await flow.run<Test>({
      name: 'cacheTest2',
      data: {},
    })
    expect(times).toBe(2)
    expect(rrrr.value).toBe(testValue * times + testValue)
  })
})
