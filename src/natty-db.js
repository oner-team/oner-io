"use strict";

const RSVP = require('rsvp');
const ajax = require('./ajax');
const jsonp = require('./jsonp');
const {extend, runAsFn, isAbsoluteUrl, noop, isBoolean, isFunction} = require('./util');

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
     * @param name
     * @param API
     * @param options
     */
    processAPIOptions(options) {
        let t = this;

        let config = {};

        //config.DBName = options.DBName;

        config.API = options.API;


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

        config.jsonp = isBoolean(options.jsonp) ? options.jsonp : FALSE;

        // 配置自动增强 如果`url`的值有`.jsonp`结尾 则认为是`jsonp`请求
        // NOTE jsonp是描述正式接口的 不影响mock接口!!!
        if (config.url.match(/\.jsonp(\?.*)?$/)) {
            config.jsonp = TRUE;
        }

        config.query = config.query || {};

        if (config.mock) {
            config.query.m = '1';
        }
        config.query['__' + t.name + '.' + config.API + '__'] = '';


        config.retry = options.retry || 0;

        // 关键回调函数
        config.fit = isFunction(options.fit) ? options.fit : noop;
        config.process = isFunction(options.process) ? options.process : noop;
        config.error = isFunction(options.error) ? options.error : noop;

        // 默认`0`表示没有超时处理
        config.timeout = options.timeout || 0;



        // TODO 代理功能
        // TODO once缓存

        return config;
    }

    createAPI(options) {
        let t = this;
        let config = t.processAPIOptions(options);

        let fn = (query) => {
            config.query = extend({}, config.query, query);
            return t.request(config);
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
    
    request(config) {
        let t = this;
        return new RSVP.Promise((resolve, reject) => {
            if (config.once && t.cache[config.API]) {
                resolve(t.cache[config.API]);
            } else {
                ajax({
                    url: config.url,
                    method: config.method,
                    data: config.query,

                    // 强制约定json
                    accept: 'json',
                    success(response, xhr) {
                        response = config.fit(response);

                        // TODO 非标准格式数据的处理
                        if (response.success) {
                            // 数据处理
                            let responseData = config.process(response.content);

                            // 记入缓存
                            config.once && (t.cache[config.API] = responseData);
                            resolve(responseData);
                        } else {
                            // TODO error的格式约定
                            reject(response.error);
                        }
                    },
                    error(status, xhr) {

                    },
                    complete(status, xhr) {

                    }
                });
            }
        });
    }
}


// 设计说明：
//  1 jsonp不是"数据类型" 但很多人沟通时不经意使用"数据类型"这个词 因为jQuery/zepto的配置就是使用`dataType: 'jsonp'`



/**
 * 创建一个上下文
 *     let DBC = new NattyDB.Context();
 * 创建一个DB
 *     let User = DBC.create('User', {
 *         getPhone: {
 *             selfSync: true,
 *             url:     'xxx',
 *             mock:    false,
 *             mockUrl: 'path',
 *             once:    false,
 *             method:  'GET',     // GET|POST
 *             accept:  'json',    // text|json|script|xml
 *             data:   {},         // 固定参数
 *             jsonp:   false,     // true|false|j{id}
 *
 *             retry:   0,
 *
 *             fit:     fn,
 *             process: fn,
 *             error:   fn,
 *
 *             timeout: 5000,       // 如果超时了，会触发error
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
 *             console.log(error.msg)
 *         }
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
    Context
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