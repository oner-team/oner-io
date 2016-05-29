"use strict";

const Defer = require('./defer');
const ajax = require('./ajax.pc');
const jsonp = require('./jsonp.pc');
const util = require('./util');
const event = require('./event');

const {
    extend, runAsFn, isAbsoluteUrl,
    isRelativeUrl, noop, isBoolean,
    isNumber, isArray, isFunction, each
} = util;

const NULL = null;
const EMPTY = '';
const TRUE = true;
const FALSE = !TRUE;

/**
 * 伪造的`promise`对象
 * NOTE 伪造的promise对象要支持链式调用 保证和`new Promise()`返回的对象行为一致
 *      dummyPromise.then().catch().finally()
 */
let dummyPromise = {
    dummy: TRUE
};
dummyPromise.then = dummyPromise['catch'] = dummyPromise['finally'] = () => {
    // NOTE 这里用了剪头函数 不能用`return this`
    return dummyPromise;
};

// 全局默认配置
const defaultGlobalConfig = {

    // 是否缓存
    cache: false,

    // 默认参数
    data: {},

    // 请求完成钩子函数
    didRequest: noop,

    // 预处理回调
    fit: noop,

    // 自定义header, 只针对非跨域的ajax有效, 跨域时将忽略自定义header
    header: {},

    // 是否忽律接口自身的并发请求
    ignoreSelfConcurrent: FALSE,

    // 有两种格式配置`jsonp`的值
    // {Boolean}
    // {Array} eg: [true, 'cb', 'j{id}']
    jsonp: FALSE,

    // 是否开启log信息
    log: FALSE,

    // 非GET方式对JSONP无效
    method: 'GET',

    // 是否开启mock模式
    mock: FALSE,

    mockUrl: EMPTY,

    // 全局`mockUrl`前缀
    mockUrlPrefix: EMPTY,

    // 成功回调
    process: noop,

    // 默认不执行重试
    retry: 0,

    // 使用已有的request方法
    request: NULL,

    // 0表示不启动超时处理
    timeout: 0,

    // http://zeptojs.com/#$.param
    traditional: FALSE,

    url: EMPTY,

    // 全局`url`前缀
    urlPrefix: EMPTY,

    withCredentials: NULL,

    // 请求之前调用的钩子函数
    willRequest: noop
};

let runtimeGlobalConfig = extend({}, defaultGlobalConfig);

let blackListForApiOptions = [];

class DB {
    // TODO 检查参数合法性
    constructor(name, APIs, context) {
        let t = this;
        t.context = context;

        t.cache = {};
        t.name = name;
        for (let API in APIs) {
            t[API] = t.createAPI(extend({
                DBName: name,
                API: API
            }, runAsFn(APIs[API])));
        }
    }

    /**
     * 处理API的配置
     * @param options {Object}
     */
    processAPIOptions(options) {

        let t = this;
        let config = extend({}, t.context, options);

        // 过滤掉接口的黑名单配置
        //each(blackListForApiOptions, (option) => {
        //    delete  config[option];
        //});

        // 标记是否正在等待请求返回
        //C.log('init pending value')
        config.pending = FALSE;

        if (config.mock) {
            // dip平台强制使用`GET`方式, 因为不支持`GET`以外的类型
            // TODO 是否拿出去? 和dip平台耦合了
            config.method = 'GET';
            config.mockUrl = t.getFullUrl(config.mockUrl, true);
        }

        config.url = t.getFullUrl(options.url);

        // 按照[boolean, callbackKeyWord, callbackFunctionName]格式处理
        if (isArray(options.jsonp)) {
            config.jsonp = isBoolean(options.jsonp[0]) ? options.jsonp[0] : FALSE;
            // 这个参数只用于jsonp
            if (config.jsonp) {
                config.jsonpFlag = options.jsonp[1];
                config.jsonpCallbackName = options.jsonp[2];
            }
        }

        // 配置自动增强 如果`url`的值有`.jsonp`结尾 则认为是`jsonp`请求
        // NOTE jsonp是描述正式接口的 不影响mock接口!!!
        if (!config.mock && !!config.url.match(/\.jsonp(\?.*)?$/)) {
            config.jsonp = true;
        }

        return config;
    }

    /**
     * 创建一个`api`方法
     * @param options {Object} 一个`DB`的`api`的配置参数
     * @returns {Function} `api`方法
     * @note 一个`DB`对应若干个`api`函数
     * @note 一个api的构成如下:
     *    api.config {Object}
     *    api.looping {Boolean}
     *    api.startLoop {Function}
     *    api.stopLoop {Function}
     */
    createAPI(options) {
        let t = this;
        let config = t.processAPIOptions(options);

        /**
         * 一个`DB`的`api`的实现
         * @param data {Object|Function}
         * @returns {Object} Promise Object
         */
        let api = (data) => {
            // 是否忽略自身的并发请求
            if (config.ignoreSelfConcurrent && config.pending) {
                return dummyPromise;
            }

            if (config.retry === 0) {
                //C.log('request');
                return t.request(data, config);
            } else {
                return t.tryRequest(data, config);
            }
        };

        api.config = config;
        t.addLoopSupport(api);

        return api;
    }

    /**
     * 创建轮询支持
     * @param api {Function} 需要轮询的函数
     */
    addLoopSupport(api) {
        let loopTimer = null;
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
            loopTimer = null;
        };
    }

    /**
     * 获取正式接口的完整`url`
     * @param url {String}
     * @param isMock {Boolean} 是否是`mock`模式
     */
    getFullUrl(url, isMock) {
        if (!url) return EMPTY;
        let prefixKey = isMock ? 'mockUrlPrefix' : 'urlPrefix';
        return (this.context[prefixKey] && !isAbsoluteUrl(url) && !isRelativeUrl(url)) ? this.context[prefixKey] + url : url;
    }

    /**
     * 发起请求
     * @param data {Object} 发送的数据
     * @param config {Object} 已经处理完善的请求配置
     * @param retryTime {undefined|Number} 如果没有重试 将是undefined值 见`createAPI`方法
     *                                     如果有重试 将是重试的当前次数 见`tryRequest`方法
     * @returns {Object} defer对象
     */
    request(data, config, retryTime) {
        let t = this;

        if (config.overrideSelfConcurrent && config._lastRequester) {
            config._lastRequester.abort();
            delete config._lastRequester;
        }

        // 一次请求的私有相关数据
        let vars = {
            mark: {
                __api: t.name + '.' + config.API
            }
        };

        // 更新的重试次数
        vars.mark.__retryTime = retryTime;

        if (config.mock) {
            vars.m = 1;
        };

        // `data`必须在请求发生时实时创建
        data = extend({}, config.data, runAsFn(data));

        // 将数据参数存在私有标记中, 方便API的`process`方法内部使用
        vars.data = data;

        // 等待状态在此处开启 在相应的`requester`的`complete`回调中关闭
        config.pending = TRUE;

        // 调用 willRequest 钩子
        config.willRequest(vars, config);

        let defer = new Defer();

        // 创建请求实例requester
        if (config.request) {
            // 使用已有的request方法
            vars.requester = config.request(vars, config, defer);
        } else if (config.jsonp) {
            vars.requester = t.sendJSONP(vars, config, defer);
        } else {
            vars.requester = t.sendAjax(vars, config, defer);
        }

        // 如果只响应最新请求
        if (config.overrideSelfConcurrent) {
            config._lastRequester = vars.requester;
        }

        // 超时处理
        if (0 !== config.timeout) {
            setTimeout(() => {
                if (config.pending) {
                    // 取消请求
                    vars.requester.abort();
                    delete vars.requester;
                    let error = {
                        timeout: TRUE,
                        message: 'Timeout By ' + config.timeout + 'ms.'
                    };
                    defer.reject(error);
                    event.fire('g.reject', [error, config]);
                    event.fire(config._contextId + '.reject', [error, config]);

                    // 调用 didRequest 钩子
                    config.didRequest(vars, config);
                }
            }, config.timeout);
        }

        return defer.promise;
    }

    /**
     * 重试功能的实现
     * @param data {Object} 发送的数据
     * @param config
     * @returns {Object} defer对象
     */
    tryRequest(data, config) {
        let t = this;

        let defer = new Defer();
        let retryTime = 0;
        let request = () => {
            t.request(data, config, retryTime).then((content) => {
                defer.resolve(content);
                event.fire('g.resolve', [content, config], config);
                event.fire(config._contextId + '.resolve', [content, config], config);
            }, (error) => {
                if (retryTime === config.retry) {
                    defer.reject(error);
                } else {
                    retryTime++;
                    request();
                }
            });
        };

        request();
        return defer.promise;
    }

    /**
     * 处理结构化的响应数据
     * @param config
     * @param response
     * @param defer
     */
    processResponse(vars, config, defer, response) {
        let t = this;

        // 调用 didRequest 钩子函数
        config.didRequest(vars, config);

        // 非标准格式数据的预处理
        response = config.fit(response, vars);

        if (response.success) {
            // 数据处理
            let content = config.process(response.content, vars);

            defer.resolve(content);
            event.fire('g.resolve', [content, config], config);
            event.fire(config._contextId + '.resolve', [content, config], config);
        } else {
            let error = extend({
                message: 'Processing Failed: ' + config.DBName + '.' + config.API
            }, response.error);
            // NOTE response是只读的对象!!!
            defer.reject(error);
            event.fire('g.reject', [error, config]);
            event.fire(config._contextId + '.reject', [error, config]);
        }
    }

    /**
     * 发起Ajax请求
     * @param config {Object} 请求配置
     * @param defer {Object} defer对象
     * @param retryTime {undefined|Number} 如果没有重试 将是undefined值 见`createAPI`方法
     *                                     如果有重试 将是重试的当前次数 见`tryRequest`方法
     * @returns {Object} xhr对象实例
     */
    sendAjax(vars, config, defer) {
        let t = this;

        return ajax({
            traditional: config.traditional,
            cache: config.cache,
            mark: vars.mark,
            log: config.log,
            url: config.mock ? config.mockUrl : config.url,
            method: config.method,
            data: vars.data,
            header: config.header,
            withCredentials: config.withCredentials,
            // 强制约定json
            accept: 'json',
            success(response/*, xhr*/) {
                t.processResponse(vars, config, defer, response);
            },
            error(status/*, xhr*/) {

                let message;
                let flag;
                switch (status) {
                    case 404:
                        message = 'Not Found';
                        break;
                    case 500:
                        message = 'Internal Server Error';
                        break;
                    // TODO 是否要补充其他明确的服务端错误
                    default:
                        message = 'Unknown Server Error';
                        break;
                }

                defer.reject({
                    status,
                    message
                });
            },
            complete(/*status, xhr*/) {

                if (vars.retryTime === undefined || vars.retryTime === config.retry) {
                    //C.log('ajax complete');

                    config.pending = FALSE;
                    vars.requester = NULL;

                    // 如果只响应最新请求
                    if (config.overrideSelfConcurrent) {
                        delete config._lastRequester;
                    }
                }
                //console.log('__complete: pending:', config.pending, 'retryTime:', retryTime, Math.random());
            }
        });
    }

    /**
     * 发起jsonp请求
     * @param vars {Object} 一次请求相关的私有数据
     * @param config {Object} 请求配置
     * @param defer {Object} defer对象
     * @param retryTime {undefined|Number} 如果没有重试 将是undefined值 见`createAPI`方法
     *                                     如果有重试 将是重试的当前次数 见`tryRequest`方法
     * @returns {Object} 带有abort方法的对象
     */
    sendJSONP(vars, config, defer) {
        let t = this;
        return jsonp({
            traditional: config.traditional,
            log: config.log,
            mark: vars.mark,
            url: config.mock ? config.mockUrl : config.url,
            data: vars.data,
            cache: config.cache,
            flag: config.jsonpFlag,
            callbackName: config.jsonpCallbackName,
            success(response) {
                t.processResponse(vars, config, defer, response);
            },
            error(e) {
                defer.reject({
                    message: 'Not Accessable JSONP `'
                //    TODO show url
                });
            },
            complete() {
                if (vars.retryTime === undefined || vars.retryTime === config.retry) {
                    config.pending = FALSE;
                    vars.requester = NULL;

                    // 如果只响应最新请求
                    if (config.overrideSelfConcurrent) {
                        delete config._lastRequester;
                    }
                }
                //console.log('complete: pending:', config.pending);
            }
        });
    }
}


// 设计说明：
//  1 jsonp不是"数据类型" 但很多人沟通时不经意使用"数据类型"这个词 因为jQuery/zepto的配置就是使用`dataType: 'jsonp'`

/**
 * 关键词
 *     语意化的
 *     优雅的
 *     功能增强的
 *     底层隔离的
 *
 * 创建一个上下文
 *     let DBC = new NattyDB.Context({
 *          urlPrefix: 'xxx',
 *          mock: false,
 *          data: {
 *              token: 'xxx
 *          },
 *          timeout: 30000
 *     });
 * 创建一个DB
 *     let User = DBC.create('User', {
 *         getPhone: {
 *             url: 'xxx',
 *             mock: false,
 *             mockUrl: 'path',
 *
 *             method: 'GET',                // GET|POST
 *             data: {},                     // 固定参数
 *             header: {},                   // 非jsonp时才生效
 *             timeout: 5000,                // 如果超时了，会触发error
 *
 *             jsonp: false,                 // true
 *             jsonp: [true, 'cb', 'j{id}'], // 自定义jsonp的query string
 *
 *             fit: fn,
 *             process: fn,
 *
 *             retry: 0,
 *             ignoreSelfConcurrent: true,
 *
 *             log: true
 *         }
 *     });
 *
 * 使用
 *     User.getPhone({
 *         // 动态参数
 *     }).then(function () {
 *         // 成功回调
 *     }, function (error) {
 *         // 失败回调
 *         if (error.status == 404) {} // ajax方法才有error.status
 *         if (error.status == 500) {} // ajax方法才有error.status
 *         if (error.status == 0)      // ajax方法才有error.status 0表示不确定的错误 可能是跨域时使用了非法Header
 *         if (error.timeout) {
 *             console.log(error.message)
 *         }
 *
 *         // 服务器端返回的错误
 *         if (error.code == 10001) {}
 *     });
 *
 *     // 动态参数也可以是函数
 *     User.getPhone(function() {
 *         return {}
 *     }).then(function(){
 *         // 成功回调
 *     });
 *
 *     // 发起轮询
 *     // NOTE 轮询过程中是不响应服务器端错误的
 *     Driver.getDistance.startLoop({
 *         // 轮询发送的请求数据
 *         data: {},
 *         // 轮询发送的请求数据也支持函数
 *         data: function() {
 *             return {};
 *         },
 *
 *         // 间隔时间
 *         duration: 5000,
 *
 *         // 轮询的响应回调
 *         process: function(data) {}
 *     });
 *
 *     // 停止轮询
 *     // NOTE 关闭轮询的唯一方法就是stopLoop方法
 *     Driver.getDistance.stopLoop();
 *
 */
class Context {
    /**
     * @param options 一个DB实例的通用配置
     */
    constructor(options) {
        let t = this;
        options = options || {};
        let contextId = 'c' + Context.count++;
        t.contextId = contextId;

        t.config = extend({}, runtimeGlobalConfig, options, {
            _contextId: contextId
        });
    }

    /**
     * 创建一个`DB`
     * @param DBName {String} `DB`的名称 不可重复
     * @param APIs {Object} 该`DB`下的`api`配置
     * @returns {Object} 返回创建好的`DB`实例
     */
    create(DBName, APIs) {
        let t = this;
        // NOTE 强制不允许重复的DB名称
        if (t[DBName]) {
            throw new Error('DB: "' + DBName + '" is existed! ');
            return;
        }

        return t[DBName] = new DB(DBName, APIs, t.config);
    }

    // 绑定上下文事件
    on(name, fn) {
        if (!isFunction(fn)) return;
        event.on(this.contextId + '.' + name, fn);
        return this;
    }
}

// 用于给DB上下文命名
// 如: 第一个和第二个上下文的`resolve`的事件 在event中的记录分别是:
//     c1.resolve
//     c2.resolve
Context.count = 0;

let VERSION;
__BUILD_VERSION__

let NattyDB = {
    onlyForHTML5: FALSE,
    version: VERSION,
    Context,
    _util: util,
    _event: event,
    ajax,
    jsonp,

    /**
     * 执行全局配置
     * @param options
     */
    setGlobal(options) {
        runtimeGlobalConfig = extend({}, defaultGlobalConfig, options);
        return this;
    },

    /**
     * 获取全局配置
     * @param property {String} optional
     * @returns {*}
     */
    getGlobal(property) {
        return property ? runtimeGlobalConfig[property] : runtimeGlobalConfig;
    },

    // 绑定全局事件
    on(name, fn) {
        if (!isFunction(fn)) return;
        event.on('g.' + name, fn);
        return this;
    }
};

// 内部直接将运行时的全局配置初始化到默认值
NattyDB.setGlobal(defaultGlobalConfig);

module.exports = NattyDB;
