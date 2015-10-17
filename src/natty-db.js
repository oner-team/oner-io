"use strict";

const RSVP = require('rsvp');
const ajax = require('./ajax');
const jsonp = require('./jsonp');
const util = require('./util');

const {extend, runAsFn, isAbsoluteUrl, noop, isBoolean, isFunction, isNumber} = util;

RSVP.on('error', function(reason) {
    console.assert('rsvp error:\n' + reason);
});

/**
 * 如果浏览器`url`中包含`m=1`的`search`参数，则开启全局`mock`模式
 * NOTE 每个接口的私有`mock`配置优先级高于该全局值。
 */
const isGlobalMock = !!location.search.match(/\bm=1\b/);

const EMPTY = '';
const TRUE = true;
const FALSE = false;

class DB {
    // TODO 检查参数合法性
    constructor(name, APIs, context) {
        let t = this;
        t.context = context;

        t.cache = {};
        t.name = name;
        t.urlPrefix = context.urlPrefix;
        for (let API in APIs) {
            t[API] = t.createAPI(extend({
                DBName: name,
                API: API
            }, runAsFn(APIs[API])));
        }
    }

    /**
     * 处理API的配置
     * @param options
     */
    processAPIOptions(options) {
        let t = this;

        let config = {};

        //config.DBName = options.DBName;

        config.API = options.API;

        config.header = options.header;

        config.log = options.log;

        // 标记是否正在等待请求返回
        config.pending = false;

        // 是否相对自身同步
        config.selfSync = isBoolean(options.selfSync) ? options.selfSync : FALSE;

        // 处理数据
        config.process = options.process || noop;

        // 是否是全局只获取一次
        config.once = isBoolean(options.once) ? options.once : FALSE;

        // `mock`取值优先级 API > context > global
        config.mock = isBoolean(options.mock) ? options.mock :
                      isBoolean(t.context.mock) ? t.context.mock : isGlobalMock;


        config.method = options.method || 'GET';

        // dip平台不支持GET以外的类型
        // TODO 是否拿出去
        if (config.mock) {
            config.method = 'GET';
        }

        config.mockUrl = options.mockUrl || EMPTY;

        config.url = config.mock ? config.mockUrl : t.getFullUrl(options.url);


        if (isBoolean(options.jsonp)) {
            config.jsonp = options.jsonp;
        }

        // 按照[boolean, callbackKeyWord, callbackFunctionName]格式处理
        else if (Array.isArray(options.jsonp)) {
            config.jsonp = isBoolean(options.jsonp[0]) ? options.jsonp[0] : FALSE;
            // 这个参数只用于jsonp
            if (config.jsonp) {
                config.jsonpFlag = options.jsonp[1];
                config.jsonpCallbackName = options.jsonp[2];
            }
        }

        // 配置自动增强 如果`url`的值有`.jsonp`结尾 则认为是`jsonp`请求
        // NOTE jsonp是描述正式接口的 不影响mock接口!!!
        else {
            config.jsonp = !!config.url.match(/\.jsonp(\?.*)?$/);
        }

        config.data = options.data || {};


        if (config.mock) {
            config.data.m = '1';
        }
        config.data['request'] = t.name + '.' + config.API;


        // 关键回调函数
        config.fit = isFunction(options.fit) ? options.fit : noop;
        config.process = isFunction(options.process) ? options.process : noop;

        // 默认`0`表示没有超时处理
        config.timeout = isNumber(options.timeout) ? options.timeout : 0;

        // 默认不执行重试
        config.retry = isNumber(options.retry) ? options.retry : 0;

        // TODO 代理功能
        // TODO once缓存

        return config;
    }

    createAPI(options) {
        let t = this;
        let config = t.processAPIOptions(options);

        // api函数体
        let fn = (data) => {

            // TODO ...
            if (config.selfSync && config.pending) {
                return {
                    then: noop
                };
            }

            if (config.retry === 0) {
                return t.request(data, config);
            } else {
                return t.tryRequest(data, config);
            }
        };

        fn.config = config;

        return fn;
    }

    /**
     * 获取正式接口的完整`url`
     * 如果通过`DB.set('urlPrefix', 'https://xxx')`设置了全局`url`的前缀，则执行补全
     */
    getFullUrl(url) {
        if (!url) return EMPTY;
        return (this.urlPrefix && !isAbsoluteUrl(url)) ? this.urlPrefix + url : url;
    }

    /**
     * 发起请求
     * @param data {Object} 发送的数据
     * @param config {Object} 已经处理完善的请求配置
     * @param retryTime {undefined|Number} 如果没有重试 将是undefined值 见`createAPI`方法
     *                                     如果有重试 将是重试的当前次数 见`tryRequest`方法
     * @returns {Object} RSVP.defer()
     */
    request(data, config, retryTime) {
        let t = this;

        // `data`必须在请求发生时实时创建
        data = extend({}, config.data, runAsFn(data, {
            retryTime
        }));

        // 根据`config`的差别 请求对象分为`ajax`和`jsonp`两种
        let requester;

        // 等待状态在此处开启 在相应的`requester`的`complete`回调中关闭
        config.pending = true;

        let defer = RSVP.defer();

        if (config.once && t.cache[config.API]) {
            defer.resolve(t.cache[config.API]);
            config.pending = false;
            console.log('cache: pending:', config.pending);

        } else if (config.jsonp) {
            requester = t.sendJSONP(data, config, defer, retryTime);
        } else {
            requester = t.sendAjax(data, config, defer, retryTime);
        }

        // 超时处理
        if (0 !== config.timeout) {
            setTimeout(() => {
                if (config.pending) {
                    // 取消请求
                    requester.abort();
                    defer.reject({
                        timeout: true,
                        message: 'Timeout By ' + config.timeout + 'ms.'
                    });
                }
            }, config.timeout);
        }

        return defer.promise;
    }

    /**
     * 重试功能的实现
     * @param data {Object} 发送的数据
     * @param config
     * @returns {Object} RSVP.defer()
     */
    tryRequest(data, config) {
        let t = this;

        let defer = RSVP.defer();
        let retryTime = 0;
        let request = () => {
            t.request(data, config, retryTime).then((data) => {
                defer.resolve(data);
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
    processResponse(config, response, defer) {
        // 非标准格式数据的预处理
        response = config.fit(response);

        if (response.success) {
            // 数据处理
            let responseData = config.process(response.content);

            // 记入缓存
            config.once && (t.cache[config.API] = responseData);
            defer.resolve(responseData);
        } else {
            // TODO error的格式约定
            // TODO 测试
            // NOTE response是只读的对象!!!
            defer.reject(extend({
                message: 'Server Process Failed (NattyDB Default Message)'
            }, response.error));
        }
    }

    /**
     * 发起Ajax请求
     * @param config {Object} 请求配置
     * @param defer {Object} RSVP.defer()的对象
     * @param retryTime {undefined|Number} 如果没有重试 将是undefined值 见`createAPI`方法
     *                                     如果有重试 将是重试的当前次数 见`tryRequest`方法
     * @returns {Object} xhr对象实例
     */
    sendAjax(data, config, defer, retryTime) {
        let t = this;

        return ajax({
            log: config.log,
            url: config.url,
            method: config.method,
            data: data,
            header: config.header,

            // 强制约定json
            accept: 'json',
            success(response/*, xhr*/) {
                t.processResponse(config, response, defer);
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
                if (retryTime === undefined || retryTime === config.retry) {
                    config.pending = false;
                }
                console.log('__complete: pending:', config.pending, 'retryTime:', retryTime, Math.random());

            }
        });
    }

    /**
     * 发起jsonp请求
     * @param config {Object} 请求配置
     * @param defer {Object} RSVP.defer()的对象
     * @param retryTime {undefined|Number} 如果没有重试 将是undefined值 见`createAPI`方法
     *                                     如果有重试 将是重试的当前次数 见`tryRequest`方法
     * @returns {Object} 带有abort方法的对象
     */
    sendJSONP(data, config, defer, retryTime) {
        let t = this;
        return jsonp({
            log: config.log,
            url: config.url,
            data: data,
            cache: config.cache,
            flag: config.jsonpFlag,
            callbackName: config.jsonpCallbackName,
            success(response) {
                t.processResponse(config, response, defer);
            },
            error(e) {
                defer.reject({
                    message: 'Not Accessable JSONP URL `' + e.target.src + '`'
                });
            },
            complete() {
                if (retryTime === undefined || retryTime === config.retry) {
                    config.pending = false;
                }
                console.log('complete: pending:', config.pending);
            }
        });
    }
}


// 设计说明：
//  1 jsonp不是"数据类型" 但很多人沟通时不经意使用"数据类型"这个词 因为jQuery/zepto的配置就是使用`dataType: 'jsonp'`

/**
 * 关键词
 *     语意化的
 *     清爽的
 *     功能增强的
 *     底层隔离的
 *
 * 创建一个上下文
 *     let DBC = new NattyDB.Context({
 *
 *     });
 * 创建一个DB
 *     let User = DBC.create('User', {
 *         getPhone: {
 *             url: 'xxx',
 *             mock: false,
 *             mockUrl: 'path',
 *
 *             method: 'GET', // GET|POST
 *             accept: 'json', // text|json|script|xml
 *             data: {},  // 固定参数
 *             header: {}, // 非jsonp时才生效
 *
 *             jsonp: false, // true
 *             jsonp: [true, 'cb', 'j{id}'], // 自定义jsonp的query string
 *
 *             fit: fn,
 *             process: fn,
 *
 *             once: false,
 *             retry: 0,
 *             selfSync: true,
 *             timeout: 5000, // 如果超时了，会触发error
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
 *     });
 *
 *     NattyDB.addAccept('hbs', function(text){
 *         return Handlebars.compile(text);
 *     });
 *
 */

class Context {
    /**
     * @param options 一个DB实例的通用配置
     */
    constructor(options = {}) {
        let t = this;
        t.urlPrefix = options.urlPrefix || '';
        t.mock = options.mock;

        t.context = {};
    }

    create(name, APIs) {
        let t = this;
        // 禁止创建重名的DB实例
        if (t.context[name]) {
            console.warn('DB: "' + name + '" is existed! ');
            return;
        }
        return t.context[name] = new DB(name, APIs, t);
    }
}

let NattyDB = {
    version: '1.0.0',
    Context,
    util
};

if (typeof define !== "undefined" && define !== null && define.amd) {
    define(function() {
        return NattyDB;
    });
} else if (typeof module !== "undefined" && module !== null && module.exports) {
    module.exports = NattyDB;
} else {
    window.NattyDB = NattyDB;
}