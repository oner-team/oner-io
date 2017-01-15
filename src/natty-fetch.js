/**
 * src/natty-fetch.js
 *
 * @license MIT License
 * @author jias (https://github.com/jias/natty-fetch)
 */

import nattyStorage from 'natty-storage';

if (nattyStorage === undefined) {
    console.warn('Please install the `natty-storage` script which is required by `natty-fetch`, go on with' +
        ' https://www.npmjs.com/package/natty-storage');
}

import * as util from './util';
const {
    extend, runAsFn, isAbsoluteUrl,
    isRelativeUrl, noop, isBoolean,
    isArray, isFunction,
    sortPlainObjectKey, isEmptyObject,
    isPlainObject, dummyPromise,
    isString, NULL, TRUE, FALSE, EMPTY, hasWindow
} = util;

import Defer from './defer';
import event from './event';

import ajax from './__AJAX__';
import jsonp from './__JSONP__';

// 内置插件
import pluginLoop from './plugin.loop';
import pluginSoon from './plugin.soon';

// 全局默认配置
const defaultGlobalConfig = {

    // 默认参数
    data: {},

    // 请求完成钩子函数
    didFetch: noop,

    // 预处理回调
    fit: noop,

    // 自定义header, 只针对非跨域的ajax有效, 跨域时将忽略自定义header
    header: {},

    // 是否忽律接口自身的并发请求
    ignoreSelfConcurrent: FALSE,

    // 有两种格式配置`jsonp`的值
    // {Boolean}
    // {Array} eg: [TRUE, 'cb', 'j{id}']
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

    // 全局`mockUrl`后缀
    mockUrlSuffix: EMPTY,

    // 成功回调
    process: noop,

    // 私有Promise对象, 如果不想用浏览器原生的Promise对象的话
    Promise: hasWindow ? window.Promise : NULL,

    // 默认不执行重试
    retry: 0,

    // 使用已有的request方法
    customRequest: NULL,

    // 0表示不启动超时处理
    timeout: 0,

    // http://zeptojs.com/#$.param
    traditional: FALSE,

    url: EMPTY,

    // 全局`url`前缀
    urlPrefix: EMPTY,

    // 是否在`url`上添加时间戳, 用于避免浏览器的304缓存
    urlStamp: TRUE,

    // 全局`url`后缀
    urlSuffix: EMPTY,

    // TODO 文档中没有暴露
    withCredentials: NULL,

    // 请求之前调用的钩子函数
    willFetch: noop,

    // 扩展: storage
    storage: false,

    // 插件
    // 目前只支持两种插件
    // plugins: [
    //     nattyFetch.plugin.loop
    //     nattyFetch.plugin.soon
    // ]
    plugins: false,

    // POST的data格式，有以下三种，值严格区分大小写：
    // 1. FORM
    // 2. JSON
    // 3. RAW
    // 4. (其他任何值都将被视为RAW)
    // 默认为FORM，跟Natty-Fetch原始逻辑兼容
    postDataFormat: 'FORM'
};

let runtimeGlobalConfig = extend({}, defaultGlobalConfig);

class API {
    constructor(path, options, contextConfig, contextId) {
        let t = this;
        t.contextConfig = contextConfig;
        t._path = path;

        let config = t.config = t.processAPIOptions(options);

        /**
         * `api`的实现
         * @param data {Object|Function}
         * @returns {Object} Promise Object
         */
        t.api = function (data) {
            data = data || {};
            // 是否忽略自身的并发请求
            if (config.ignoreSelfConcurrent && t.api.pending) {
                return dummyPromise;
            }

            if (config.overrideSelfConcurrent && t.api._requester) {
                t.api.abort();
            }

            let vars = t.makeVars(data);

            if (config.retry === 0) {
                return t.request(vars, config);
            } else {
                return t.tryRequest(vars, config);
            }
        };

        t.api.contextId = contextId;
        t.api._path = path;

        // 标记是否正在等待请求返回
        t.api.pending = FALSE;
        t.api._requester = NULL;

        // 取消响应
        t.api.abort = function () {
            if (t.api.pending && t.api._requester) {
                t.api._requester.abort();
            }
        };

        t.api.config = config;

        t.initStorage();

        // 启动插件
        let plugins = isArray(config.plugins) ? config.plugins : [];
        for (let i = 0, l = plugins.length; i<l; i++) {
            isFunction(plugins[i]) && plugins[i].call(t, t);
        }
    }

    makeVars(data) {
        let t = this;
        let config = t.config;

        // 一次请求的私有相关数据
        let vars = {
            mark: {
                _api: t._path
            }
        };

        if (config.mock) {
            vars.mark._mock = TRUE;
        }

        // if (config.urlStamp) {
        //     vars.mark._stamp = +new Date();
        // }

        // `data`必须在请求发生时实时创建
        // 如果postDataFormat是非FORM/JSON值时，不对data进行处理，因为这种情况下调用者意图直接向服务端传递RAW数据，
        // 这时传入的data极有可能是字符串
        // 当config.data是{}的情况下，如果调用者传入的data是字符串，经过extend()处理以后就会变成字符串数组
        // 字符串数组被后续传递给xhr.send()时会被默认调用toString()，结果就变成'[object object]'这种不合法数据
        if (config.postDataFormat === 'FORM' || config.postDataFormat === 'JSON')
            data = extend({}, runAsFn(config.data), runAsFn(data));

        // 将数据参数存在私有标记中, 方便API的`process`方法内部使用
        vars.data = data;

        return vars;
    }

    /**
     * 处理API的配置
     * @param options {Object}
     */
    processAPIOptions(options) {

        let t = this;

        // 插件是不能覆盖的, 应该追加
        let plugins = [].concat(t.contextConfig.plugins || [], options.plugins || []);

        let config = extend({}, t.contextConfig, options, {
            plugins
        });

        if (config.mock) {
            config.mockUrl = t.getFullUrl(config);
        }

        config.url = t.getFullUrl(config);

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
            config.jsonp = TRUE;
        }

        return config;
    }

    initStorage() {
        let t = this;
        let config = t.config;

        // 开启`storage`的前提条件
        let storagePrecondition = config.method === 'GET' || config.jsonp;

        // 不满足`storage`使用条件的情况下, 开启`storage`将抛出错误
        if (!storagePrecondition && config.storage === TRUE) {
            throw new Error('A `' + config.method + '` request CAN NOT use `storage` which is only for `GET/jsonp`' +
                ' request! Please check the options for `' + t._path + '`');
        }

        // 简易开启缓存的写法
        if (config.storage === TRUE) {
            config.storage = {
                type: 'variable'
            };
        }

        // 决定什么情况下缓存可以开启
        t.api.storageUseable = isPlainObject(config.storage)
            && (config.method === 'GET' || config.jsonp)
            && nattyStorage.support[config.storage.type];
        // 创建缓存实例
        if (t.api.storageUseable) {
            // 当使用`localStorage`时, 强制指定`key`值。如果没指定, 抛错!
            // 当使用`variable`或`sessionStorage`时, 如果没指定`key`, 则自动生成内部`key`
            // !!!为什么在使用`localStorage`时必须指定`key`值???
            // !!!因为当key发生变化时, `localStorage`很容易产生死数据, 必须强制开发者有意识的去维护`key`值
            if (config.storage.type === 'localStorage') {
                if (!config.storage.hasOwnProperty('key') || !config.storage.key) {
                    throw new Error('`key` is required when `storage.type` is `localStorage`.');
                }
            } else {
                config.storage.key = config.storage.key || [t.api.contextId, t._path].join('_');
            }

            // `key`和`tag`的选择原则:
            // `key`只选用相对稳定的值, 减少因为`key`的改变而增加的残留缓存
            // 经常变化的值用于`tag`, 如一个接口在开发过程中可能使用方式不一样, 会在`jsonp`和`get`之间切换。
            t.api.storage = nattyStorage(extend({}, config.storage, {
                async: TRUE,
                tag: [
                    config.storage.tag,
                    config.jsonp ? 'jsonp' : config.method,
                    config.url
                ].join('_') // 使用者的`tag`和内部的`tag`, 要同时生效
            }));
        }
    }

    /**
     * 请求数据(从storage或者从网络)
     * @param vars {Object} 发送的数据
     * @param config {Object} 已经处理完善的请求配置
     * @returns {Object} defer对象
     */
    request(vars, config) {
        let t = this;

        if (t.api.storageUseable) {

            // 只有GET和JSONP才会有storage生效
            vars.queryString = isEmptyObject(vars.data) ? 'no-query-string' : JSON.stringify(sortPlainObjectKey(vars.data));

            return t.api.storage.has(vars.queryString).then(function (data) {
                // alert(JSON.stringify(data, null, 4) + JSON.stringify(sessionStorage, null, 4));
                // console.warn('has cached: ', hasValue);
                if (data.has) {
                    return data.value;
                } else {
                    return t.remoteRequest(vars, config);
                }
            });
        } else {
            return t.remoteRequest(vars, config);
        }
    }

    /**
     * 获取正式接口的完整`url`
     * @param config {Object}
     */
    getFullUrl(config) {
        let url = config.mock ? config.mockUrl : config.url;
        if (!url) return EMPTY;
        let prefixKey = config.mock ? 'mockUrlPrefix' : 'urlPrefix';
        let suffixKey = config.mock ? 'mockUrlSuffix' : 'urlSuffix';
        let prefix = config[prefixKey] && !isAbsoluteUrl(url) && !isRelativeUrl(url) ? config[prefixKey] : EMPTY;
        let suffix = config[suffixKey] ? config[suffixKey]: EMPTY;
        return prefix + url + suffix;
    }

    /**
     * 发起网络请求
     * @param vars
     * @param config
     * @returns {Promise}
     */
    remoteRequest(vars, config) {
        let t = this;

        // 调用 willFetch 钩子
        config.willFetch(vars, config, 'remote');

        // 等待状态在此处开启 在相应的`requester`的`complete`回调中关闭
        t.api.pending = TRUE;

        let defer = new Defer(config.Promise);

        // 创建请求实例requester
        if (config.customRequest) {
            // 使用已有的request方法
            t.api._requester = config.customRequest(vars, config, defer);
        } else if (config.jsonp) {
            t.api._requester = t.sendJSONP(vars, config, defer);
        } else {
            t.api._requester = t.sendAjax(vars, config, defer);
        }

        // 超时处理
        if (0 !== config.timeout) {
            setTimeout(() => {
                if (t.api.pending && t.api._requester) {
                    // 取消请求
                    t.api.abort();

                    let error = {
                        timeout: TRUE,
                        message: 'Timeout By ' + config.timeout + 'ms.'
                    };

                    defer.reject(error);
                    event.fire('g.reject', [error, config]);
                    event.fire(t.api.contextId + '.reject', [error, config]);
                }
            }, config.timeout);
        }

        return defer.promise;
    }

    /**
     * 重试功能的实现
     * @param vars {Object} 发送的数据
     * @param config
     * @returns {Object} defer对象
     */
    tryRequest(vars, config) {
        let t = this;

        return new config.Promise(function (resolve, reject) {
            let retryTime = 0;
            let request = () => {
                // 更新的重试次数
                vars.mark._retryTime = retryTime;
                t.request(vars, config).then((content) => {
                    resolve(content);
                    event.fire('g.resolve', [content, config], config);
                    event.fire(t.api.contextId + '.resolve', [content, config], config);
                }, (error) => {
                    if (retryTime === config.retry) {
                        reject(error);
                    } else {
                        retryTime++;
                        request();
                    }
                });
            };

            request();
        });
    }

    /**
     * 处理结构化的响应数据
     * @param config
     * @param response
     * @param defer
     */
    processResponse(vars, config, defer, response) {
        let t = this;

        // 调用 didFetch 钩子函数
        config.didFetch(vars, config);

        // 非标准格式数据的预处理
        response = config.fit(response, vars);



        if (response.success) {
            // 数据处理
            let content = config.process(response.content, vars);

            let resolveDefer = function () {
                defer.resolve(content);
                event.fire('g.resolve', [content, config], config);
                event.fire(t.api.contextId + '.resolve', [content, config], config);
            }

            if (t.api.storageUseable) {
                t.api.storage.set(vars.queryString, content).then(function () {
                    resolveDefer();
                })['catch'](function () {
                    resolveDefer();
                });
            } else {
                resolveDefer();
            }
        } else {
            let error = extend({
                message: '`success` is false, ' + t._path
            }, response.error);
            // NOTE response是只读的对象!!!
            defer.reject(error);
            event.fire('g.reject', [error, config]);
            event.fire(t.api.contextId + '.reject', [error, config]);
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
        const t = this;
        const url = config.mock ? config.mockUrl : config.url;

        return ajax({
            traditional: config.traditional,
            urlStamp: config.urlStamp,
            mark: vars.mark,
            useMark: config.mark,
            log: config.log,
            url: url,
            method: config.method,
            data: vars.data,
            header: config.header,
            withCredentials: config.withCredentials,
            // 强制约定json
            accept: 'json',
            success(response/*, xhr*/) {
                t.processResponse(vars, config, defer, response);
            },
            error(status) {
                // 如果跨域使用了自定义的header，且服务端没有配置允许对应的header，此处status为0，目前无法处理。
                const error = {
                    status,
                    message: `Error(status ${status}) in request for ${vars.mark._api}(${url})`
                };

                defer.reject(error);
                event.fire('g.reject', [error, config]);
                event.fire(t.api.contextId + '.reject', [error, config]);
            },
            complete(/*status, xhr*/) {
                if (vars.retryTime === undefined || vars.retryTime === config.retry) {
                    //C.log('ajax complete');

                    t.api.pending = FALSE;
                    t.api._requester = NULL;
                }
                //console.log('__complete: pending:', config.pending, 'retryTime:', retryTime, Math.random());
            },
            postDataFormat: config.postDataFormat
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
        const t = this;
        const url = config.mock ? config.mockUrl : config.url;
        return jsonp({
            traditional: config.traditional,
            log: config.log,
            mark: vars.mark,
            useMark: config.mark,
            url: url,
            data: vars.data,
            urlStamp: config.urlStamp,
            flag: config.jsonpFlag,
            callbackName: config.jsonpCallbackName,
            success(response) {
                t.processResponse(vars, config, defer, response);
            },
            error() {
                let error = {
                    message: `Not accessable JSONP in request for ${vars.mark._api}(${url})`
                };

                defer.reject(error);
                event.fire('g.reject', [error, config]);
                event.fire(t.api.contextId + '.reject', [error, config]);
            },
            complete() {
                if (vars.retryTime === undefined || vars.retryTime === config.retry) {
                    t.api.pending = FALSE;
                    t.api._requester = NULL;
                }
            }
        });
    }
}

/**
 * 关键词
 *     语意化的
 *     优雅的
 *     功能增强的
 *     底层隔离的
 */
const context = (function () {
    let count = 0;

    return function(contextId, options) {

        if (isString(contextId)) {
            options = options || {};
        } else {
            options = contextId || {}
            contextId = 'c' + count++;
        }

        let storage = nattyStorage({
            type: 'variable',
            key: contextId
        });

        let ctx = {};

        ctx.api = storage.get();

        ctx._contextId = contextId;

        // 插件是不能覆盖的, 应该追加
        let plugins = [].concat(runtimeGlobalConfig.plugins || [], options.plugins || []);

        ctx._config = extend({}, runtimeGlobalConfig, options, {
            plugins
        });

        /**
         * 创建api
         * @param namespace {String} optional
         * @param APIs {Object} 该`namespace`下的`api`配置
         */
        ctx.create = function(namespace, APIs) {
            let hasNamespace = arguments.length === 2 && isString(namespace);

            if (!hasNamespace) {
                APIs = namespace;
            }

            for (let path in APIs) {
                storage.set(
                    hasNamespace ? namespace + '.' + path : path,
                    new API(
                        hasNamespace ? namespace + '.' + path : path,
                        runAsFn(APIs[path]),
                        ctx._config,
                        contextId
                    ).api
                );
            }

            ctx.api = storage.get();
        }

        // 绑定上下文事件
        ctx.on = function(name, fn) {
            if (!isFunction(fn)) return;
            event.on(ctx._contextId + '.' + name, fn);
            return ctx;
        }

        return ctx;
    }
})();

/**
 * 简易接口
 * @param options
 */
let nattyFetch = {};

nattyFetch.create = function (options) {
    return new API('nattyFetch', runAsFn(options), defaultGlobalConfig, 'global').api;
};

extend(nattyFetch, {
    onlyForModern: !__FALLBACK__,
    version: '__VERSION__',
    _util: util,
    _event: event,
    context,
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
    },

    /**
     * 插件名称空间
     */
    plugin: {
        loop: pluginLoop,
        soon: pluginSoon
    }
});

// 内部直接将运行时的全局配置初始化到默认值
nattyFetch.setGlobal(defaultGlobalConfig);

export default nattyFetch;