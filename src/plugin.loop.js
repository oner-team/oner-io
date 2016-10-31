
/**
 * src/plugin.loop.js
 * 创建轮询支持
 *
 * @license MIT License
 * @author jias (https://github.com/jias/natty-fetch)
 */
import {isNumber, noop, TRUE, FALSE, NULL} from './util'

/**
 * 创建轮询支持
 * @param api {Function} 需要轮询的函数
 */
export default function(apiInstance) {
    let api = apiInstance.api;
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
            loopTimer = setTimeout(() => {
                api(options.data).then(resolveFn, rejectFn)
                sleepAndRequest()
            }, options.duration)
        }

        // NOTE 轮询过程中是不响应服务器端错误的 所以第二个参数是`noop`
        api(options.data).then(resolveFn, rejectFn)
        sleepAndRequest()
        
        return stop
    }
}
