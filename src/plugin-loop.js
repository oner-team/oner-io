import {isNumber, noop, TRUE, FALSE, NULL} from './util'

/**
 * 创建轮询支持
 * @param api {Function} 需要轮询的函数
 */
export default function() {
  const {api} = this

  // options.data {Object} data 数据
  // options.header {Object} header 请求头
  // options.duration {Number} 间隔时间
  api.loop = (options, resolveFn = noop, rejectFn = noop) => {
    if (!options.duration || !isNumber(options.duration)) {
      throw new Error('Illegal `duration` value for `startLoop` method.')
    }

    let loopTimer = NULL

    let stop = () => {
      clearTimeout(loopTimer)
      loopTimer = NULL
      stop.looping = FALSE
    }

    let sleepAndRequest = () => {
      stop.looping = TRUE
      api(options.data, options.header).then(resolveFn, rejectFn)
      loopTimer = setTimeout(() => {
        sleepAndRequest()
      }, options.duration)
    }

    sleepAndRequest()
    
    return stop
  }
}
