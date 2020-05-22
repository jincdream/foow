import { Group, Error, FlowData, FlowHandler, Flow } from './types'

interface IMehotds<R extends FlowData> {
  [key: string]: FlowHandler<R>
}

interface ICatch {
  name: string
  data: FlowData
}

interface FlowRunParams {
  name: string
  data: any
  context?: object
}

export enum ClearType {
  Cache = 'cacheData',
  Methods = 'methods',
}

interface ErrorHandler<D, R> {
  (data?: D): R
}
interface ISetError<D, R> {
  name: string
  handler: ErrorHandler<D, R>
}

interface IWrapHandler<R, C = any> {
  (data: FlowData<R>, context: C): Promise<R>
}
export default class Foow {
  constructor(
    options: {
      debug?: boolean
    } = {}
  ) {
    this.debug = options ? !!options.debug : false
  }
  private debug: boolean = false
  private errors: {
    [key: string]: Function
  } = {}
  private groups: {
    [key: string]: Group
  } = {}
  private methods: {
    [key: string]: FlowHandler<{
      result: {}
    }>
  } = {}
  private cacheData: {
    [key: string]: FlowData
  } = {}
  /**
   * setMethods
   */
  // public setMethod<D, R extends FlowData>(params: Flow<D, R>) {
  //   const { name, handler } = params
  //   this.methods[name] = handler
  //   this.groups[name] = {
  //     name,
  //     flows: [name],
  //   }
  // }
  public setMethod(params: {
    name: string
    handler: FlowHandler<{
      result: {}
    }>
  }) {
    const { name, handler } = params
    this.methods[name] = handler
    this.groups[name] = {
      name,
      flows: [name],
    }
  }
  /**
   * setMethods
   */
  public setMethods<R extends FlowData>(methods: IMehotds<R>) {
    this.methods = {
      ...this.methods,
      ...methods,
    }
    Object.keys(methods).forEach((name) => {
      this.groups[name] = {
        name,
        flows: [name],
      }
    })
  }
  /**
   * setCache
   */
  public setCacheData(params: ICatch) {
    const { name, data } = params
    this.cacheData[name] = data
  }
  /**
   * getCache
   */
  public getCacheData(name: string): FlowData {
    return this.cacheData[name]
  }
  /**
   * clear
   */
  public clear(type: ClearType, name: string) {
    delete this[type][name]
  }
  /**
   * clearAll
   */
  public clearAll(type: ClearType) {
    this[type] = {}
  }
  /**
   * runError
   */
  public runError(params: Error): any {
    return this.errors[params.name] && this.errors[params.name](params.data)
  }
  /**
   * setError<E>
   */
  public setError<E, R>(params: ISetError<E, R>) {
    this.errors[params.name] = params.handler
  }
  /**
   * wrap
   */
  public wrap<R, C = any>(
    handler: IWrapHandler<R, C>
  ): FlowHandler<FlowData<R>> {
    let _wrap = async function(data: FlowData<R>, context?: any) {
      let handlerResult = {}
      handlerResult = await handler(data, context)
      data.result = {
        ...data.result,
        ...handlerResult,
      }
      return data
    }
    return _wrap as FlowHandler<FlowData<R>>
  }
  /**
   * setGroup
   */
  public setGroup(group: Group) {
    this.groups[group.name] = group
  }
  /**
   * run
   */
  public async run<R>(params: FlowRunParams): Promise<FlowData<R>> {
    let { name, data } = params
    let __now__ = Date.now()
    let __key__ = __now__.toString(32)

    let cacheData = this.cacheData[name]

    // 缓存数据
    if (cacheData) {
      return {
        result: Object.assign({}, cacheData.result, data),
      }
    }
    // 非缓存
    let isMethods = this.methods[name]
    // let isGroup = !isMethods && this.groups[name]
    let groups = this.groups[name]
    let { flows, context = {}, useCache } = groups
    let fContext = Object.assign({}, context, params.context)
    let resultData = {
      result: data,
    }

    if (isMethods) {
      try {
        let r = await isMethods(resultData, fContext)
        return r as FlowData<R>
      } catch (error) {
        console.error(error)
        throw new Error(
          JSON.stringify(
            {
              fnName: isMethods.name,
              name,
              data: resultData,
              context: fContext,
            },
            null,
            '\t'
          )
        )
      }
    }
    for (let index = 0; index < flows.length; index++) {
      let fName = flows[index]
      let r
      let fnParams = {
        name: fName,
        data: resultData.result,
        context: fContext,
      }
      try {
        r = await this.run(fnParams)
      } catch (error) {
        console.error(error)
        throw new Error(
          JSON.stringify(
            {
              ...fnParams,
            },
            null,
            '\t'
          )
        )
      }
      if (r.break) {
        break
      }
      resultData = r
    }
    if (useCache) {
      this.setCacheData({ name, data: resultData })
    }
    this.debug &&
      console.log(
        `%c${name}_${__key__}: ${Date.now() - __now__} ms`,
        'background: #272727; color: #50d890;border:1px solid #4f98ca;padding:2px 4px'
      )
    return resultData as FlowData<R>
  }
}
