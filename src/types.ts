export interface Group {
  /**
   * groud name
   */
  name: string
  /**
   * deps
   */
  flows: string[]
  context?: object
  useCache?: boolean
}
export interface Error {
  name: string
  data?: any
}
export interface FlowData<D = any> {
  result: D
  error?: Error
  /**
   * break flows?
   */
  break?: boolean
}

export type FlowHandler<R extends FlowData> = (
  data: FlowData,
  context?: object
) => Promise<R>

export interface Flow<R extends FlowData> {
  name: string
  handler: FlowHandler<R>
}
