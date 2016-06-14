/**
 * 创建轮询支持
 * @param api {Function} 需要轮询的函数
 */
const FALSE = false;
const TRUE = true;
const NULL = null;
const {isNumber, noop} = require('./util');

/**
 * 创建轮询支持
 * @param api {Function} 需要轮询的函数
 */
module.exports = (api) => {
    let loopTimer = NULL;
    api.looping = FALSE;
    // 开启轮询
    api.startLoop = (options, resolveFn = noop, rejectFn = noop) => {
        if (!options.duration || !isNumber(options.duration)) {
            throw new Error('Illegal `duration` value for `startLoop` method.');
            return api;
        }

        let sleepAndRequest = () => {
            api.looping = TRUE;
            loopTimer = setTimeout(() => {
                api(options.data).then(resolveFn, rejectFn);
                sleepAndRequest();
            }, options.duration);
        };

        // NOTE 轮询过程中是不响应服务器端错误的 所以第二个参数是`noop`
        api(options.data).then(resolveFn, rejectFn);
        sleepAndRequest();
    };
    // 停止轮询
    api.stopLoop = () => {
        clearTimeout(loopTimer);
        api.looping = FALSE;
        loopTimer = NULL;
    };
};
