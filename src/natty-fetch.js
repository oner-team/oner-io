import nattyStorage from 'natty-storage'
import * as util from './util'

const {
    extend, runAsFn, isAbsoluteUrl,
    isRelativeUrl, isBoolean,
    isArray, isFunction,
    isPlainObject, dummyPromise,
    isString, NULL, TRUE, FALSE, EMPTY
} = util

import Request from './request'

import event from './event'

// 内置插件
import pluginLoop from './plugin.loop'
import pluginSoon from './plugin.soon'

// 全局默认配置
import defaultGlobalConfig from './default-global-config'

// 随`setGlobal`方法而变化的运行时全局配置
let runtimeGlobalConfig = extend({}, defaultGlobalConfig)

class API {
    constructor(path, options, contextConfig, contextId) {
        this._path = path

        const config = this.config = this.processAPIOptions(options)

        this.contextConfig = contextConfig

        this.contextId = contextId

        // 进行中的请求列队
        this._pendingList = []

        this.storage = NULL

        this.initStorage()

        // `api`的实现
        // @param data {Object|Function}
        // @returns {Object} Promise Object
        this.api = (data) => {

            // 处理列队中的请求
            if (this._pendingList.length) {
                // 是否忽略自身的并发请求
                if (config.ignoreSelfConcurrent) {
                    return dummyPromise
                }
                // 是否取消上一个请求
                if (config.overrideSelfConcurrent) {
                    this._pendingList[0].abort()
                }
            }

            const request = new Request(path, config, this.storage, contextId)

            this._pendingList.push(request)

            return request.send(data)
        }

        // 启动插件
        let plugins = isArray(config.plugins) ? config.plugins : [];
        for (let i = 0, l = plugins.length; i<l; i++) {
            isFunction(plugins[i]) && plugins[i].call(t, t);
        }
    }



    // 处理API的配置
    // @param options {Object}
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

    // 初始化缓存对象
    initStorage() {
        const {config} = this

        // 开启`storage`的前提条件
        // const storagePrecondition = config.method === 'GET' || config.jsonp

        // 不满足`storage`使用条件的情况下, 开启`storage`将抛出错误
        // if (!storagePrecondition && config.storage === TRUE) {
        //     console.warn(`'storage' won't work for '${t._path}' with '${config.method}' method.`)
        // }

        // 简易开启缓存的写法
        // if (config.storage === TRUE) {
        //     config.storage = {
        //         type: 'variable'
        //     }
        // }

        // 综合判断缓存是不是可以启用
        this.storageUseable = isPlainObject(config.storage)
            && (config.method === 'GET' || config.jsonp)
            && (
                nattyStorage.supportStorage && ['localStorage', 'sessionStorage'].indexOf(config.storage.type) > -1 ||
                config.type === 'variable'
            )

        // 创建缓存实例
        if (this.storageUseable) {
            // 当使用`localStorage`时, 强制指定`key`值。如果没指定, 抛错!
            // 当使用`variable`或`sessionStorage`时, 如果没指定`key`, 则自动生成内部`key`
            // !!!为什么在使用`localStorage`时必须指定`key`值???
            // !!!因为当key发生变化时, `localStorage`很容易产生死数据, 必须强制开发者有意识的去维护`key`值
            if (config.storage.type === 'localStorage') {
                if (!config.storage.hasOwnProperty('key') || !config.storage.key) {
                    throw new Error('`key` is required when `storage.type` is `localStorage`.');
                }
            } else {
                config.storage.key = config.storage.key || [this.contextId, this._path].join('_');
            }

            // `key`和`tag`的选择原则:
            // `key`只选用相对稳定的值, 减少因为`key`的改变而增加的残留缓存
            // 经常变化的值用于`tag`, 如一个接口在开发过程中可能使用方式不一样, 会在`jsonp`和`get`之间切换。
            this.storage = nattyStorage(extend({}, config.storage, {
                tag: [
                    config.storage.tag,
                    config.jsonp ? 'jsonp' : config.method,
                    config.url
                ].join('_') // 使用者的`tag`和内部的`tag`, 要同时生效
            }));
        }
    }



    // 获取正式接口的完整`url`
    // @param config {Object}
    getFullUrl(config) {
        let url = config.mock ? config.mockUrl : config.url;
        if (!url) return EMPTY;
        let prefixKey = config.mock ? 'mockUrlPrefix' : 'urlPrefix';
        let suffixKey = config.mock ? 'mockUrlSuffix' : 'urlSuffix';
        let prefix = config[prefixKey] && !isAbsoluteUrl(url) && !isRelativeUrl(url) ? config[prefixKey] : EMPTY;
        let suffix = config[suffixKey] ? config[suffixKey]: EMPTY;
        return prefix + url + suffix;
    }







}

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

        // 创建api
        // @param namespace {String} optional
        // @param APIs {Object} 该`namespace`下的`api`配置
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

// 简易接口
// @param options
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

    // 执行全局配置
    // @param options
    setGlobal(options) {
        runtimeGlobalConfig = extend({}, defaultGlobalConfig, options);
        return this;
    },

    // 获取全局配置
    // @param property {String} optional
    // @returns {*}
    getGlobal(property) {
        return property ? runtimeGlobalConfig[property] : runtimeGlobalConfig;
    },

    // 绑定全局事件
    on(name, fn) {
        if (!isFunction(fn)) return;
        event.on('g.' + name, fn);
        return this;
    },

    // 插件名称空间
    plugin: {
        loop: pluginLoop,
        soon: pluginSoon
    }
});

// 内部直接将运行时的全局配置初始化到默认值
nattyFetch.setGlobal(defaultGlobalConfig);

export default nattyFetch;