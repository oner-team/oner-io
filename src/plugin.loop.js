import {isNumber, noop, TRUE, FALSE, NULL} from './util'

/**
 * 创建轮询支持
 * @param api {Function} 需要轮询的函数
 */
export default function() {
  const {api} = this

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
      api(options.data).then(resolveFn, rejectFn)
      loopTimer = setTimeout(() => {
        sleepAndRequest()
      }, options.duration)
    }

    sleepAndRequest()
    
    return stop
  }
}
