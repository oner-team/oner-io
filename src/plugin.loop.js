/**
 * 创建轮询支持
 * @param api {Function} 需要轮询的函数
 */
const FALSE = false
const TRUE = true
const NULL = null
const {isNumber, noop} = require('./util')

/**
 * 创建轮询支持
 * @param api {Function} 需要轮询的函数
 */
module.exports = (apiInstance) => {
    let api = apiInstance.api;
    api.loop = (options, resolveFn = noop, rejectFn = noop) => {
        if (!options.duration || !isNumber(options.duration)) {
            throw new Error('Illegal `duration` value for `startLoop` method.')
            return
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
