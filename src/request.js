import nattyStorage from 'natty-storage'
import * as util from './util'

const {
    extend, runAsFn, isAbsoluteUrl,
    isRelativeUrl, noop, isBoolean,
    isArray, isFunction,
    sortPlainObjectKey, isEmptyObject,
    isPlainObject, dummyPromise,
    isString, NULL, TRUE, FALSE, EMPTY
} = util

import Defer from './defer'
import event from './event'
import ajax from './__AJAX__'
import jsonp from './__JSONP__'

export default class Request {
    constructor(path, config, storage, contextId) {
        this._path = path
        this.config = config
        this.storage = storage
        this.contextId = contextId

        // 工作状态
        this.defer = NULL
        this.pending = FALSE
        this._requester = NULL

        // 每次请求私有的相关数据
        this.vars = {
            // `url`中的标记
            mark: {
                _api: path,
                _mock: config.mock,
                // retryTime: {Number} 重试次数
            },
            // 其他键值说明
            // data: {Object} `send`方法执行时创建
            // queryString: {String} 当`storage`可用且`send`方法执行时创建
        }
    }

    send(data) {
        // `data`必须在请求发生时实时创建
        // 另外，将数据参数存在私有标记中, 方便API的`process`方法内部使用
        this.vars.data = extend({}, runAsFn(config.data), runAsFn(data))

        if (this.config.retry === 0) {
            return this.request()
        } else {
            return this.tryRequest()
        }
    }

    // 请求数据(从storage或者从网络)
    // @param vars {Object} 发送的数据
    // @param config {Object} 已经处理完善的请求配置
    // @returns {Object} defer对象
    request() {

        const {vars} = this

        if (this.storage) {

            vars.queryString = isEmptyObject(vars.data) ? 'no-query-string' : JSON.stringify(sortPlainObjectKey(vars.data))

            return this.storage.asyncHas(vars.queryString).then(result => {
                // console.warn('has cached: ', hasValue)
                if (result.has) {
                    return result.value
                } else {
                    return this.remoteRequest()
                }
            })
        } else {
            return this.remoteRequest()
        }
    }

    // 发起网络请求
    // @param vars
    // @param config
    // @returns {Promise}
    remoteRequest() {

        const {config, vars} = this

        // 调用 willFetch 钩子
        config.willFetch(vars, config, 'remote')

        // 等待状态在此处开启 在相应的`requester`的`complete`回调中关闭
        this.pending = TRUE

        this.defer = new Defer(config.Promise)

        // 创建请求实例requester
        if (config.customRequest) {
            // 使用已有的request方法
            this._requester = config.customRequest(vars, config, this.defer)
        } else if (config.jsonp) {
            this._requester = this.sendJSONP(vars, config, this.defer)
        } else {
            this._requester = this.sendAjax(vars, config, this.defer)
        }

        // 超时处理
        if (0 !== config.timeout) {
            setTimeout(() => {
                if (this.pending) {
                    // 取消请求
                    this.abort()

                    const error = {
                        timeout: TRUE,
                        message: 'Timeout By ' + config.timeout + 'ms.'
                    }

                    this.defer.reject(error)
                    event.fire('g.reject', [error, config])
                    event.fire(this.contextId + '.reject', [error, config])
                }
            }, config.timeout)
        }

        return this.defer.promise
    }

    // 重试功能的实现
    // @param vars {Object} 发送的数据
    // @param config
    // @returns {Object} defer对象
    tryRequest() {

        const {config, vars} = this

        return new config.Promise((resolve, reject) => {
            let retryTime = 0
            const request = () => {
                // 更新的重试次数
                vars.mark._retryTime = retryTime
                this.request(vars, config).then((content) => {
                    resolve(content)
                    event.fire('g.resolve', [content, config], config)
                    event.fire(this.contextId + '.resolve', [content, config], config)
                }, (error) => {
                    if (retryTime === config.retry) {
                        reject(error)
                    } else {
                        retryTime++
                        request()
                    }
                })
            }
            request()
        })
    }


    // 处理结构化的响应数据
    // @param config
    // @param response
    // @param defer
    processResponse(response) {
        const {config, vars, defer} = this

        // 调用 didFetch 钩子函数
        config.didFetch(vars, config)

        // 非标准格式数据的预处理
        response = config.fit(response, vars)

        if (response.success) {
            // 数据处理
            const content = config.process(response.content, vars)

            let resolveDefer = () => {
                defer.resolve(content)
                event.fire('g.resolve', [content, config], config)
                event.fire(this.contextId + '.resolve', [content, config], config)
            }

            if (this.storage) {
                this.storage.asyncSet(vars.queryString, content).then(() => {
                    resolveDefer()
                })['catch'](() => {
                    resolveDefer()
                })
            } else {
                resolveDefer()
            }
        } else {
            const error = extend({
                message: '`success` is false, ' + this._path
            }, response.error)
            // NOTE response是只读的对象!!!
            defer.reject(error)
            event.fire('g.reject', [error, config])
            event.fire(this.contextId + '.reject', [error, config])
        }
    }

    // 发起Ajax请求
    // @param config {Object} 请求配置
    // @param defer {Object} defer对象
    // @param retryTime {undefined|Number} 如果没有重试 将是undefined值 见`createAPI`方法
    //                                     如果有重试 将是重试的当前次数 见`tryRequest`方法
    // @returns {Object} xhr对象实例
    sendAjax() {

        const {config, vars, defer} = this

        const url = config.mock ? config.mockUrl : config.url

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
                this.processResponse(vars, config, defer, response)
            },
            error(status) {
                // 如果跨域使用了自定义的header，且服务端没有配置允许对应的header，此处status为0，目前无法处理。
                const error = {
                    status,
                    message: `Error(status ${status}) in request for ${vars.mark._api}(${url})`
                }

                defer.reject(error)
                event.fire('g.reject', [error, config])
                event.fire(this.contextId + '.reject', [error, config])
            },
            complete(/*status, xhr*/) {
                // TODO
                // if (vars.retryTime === undefined || vars.retryTime === config.retry) {
                    //C.log('ajax complete');

                    this.pending = FALSE
                    this._requester = NULL
                // }
            }
        })
    }

    // 发起jsonp请求
    // @param vars {Object} 一次请求相关的私有数据
    // @param config {Object} 请求配置
    // @param defer {Object} defer对象
    // @param retryTime {undefined|Number} 如果没有重试 将是undefined值 见`createAPI`方法
    //                                     如果有重试 将是重试的当前次数 见`tryRequest`方法
    // @returns {Object} 带有abort方法的对象
    sendJSONP() {
        const {config, vars, defer} = this
        const url = config.mock ? config.mockUrl : config.url
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
                this.processResponse(vars, config, defer, response)
            },
            error() {
                const error = {
                    message: `Not accessable JSONP in request for ${vars.mark._api}(${url})`
                }

                defer.reject(error)
                event.fire('g.reject', [error, config])
                event.fire(this.contextId + '.reject', [error, config])
            },
            complete() {
                // TODO retryTime
                // if (vars.retryTime === undefined || vars.retryTime === config.retry) {
                    this.pending = FALSE
                    this._requester = NULL
                // }
            }
        })
    }

    abort() {
        if (this._requester) {
            this.abort()
        }
    }
}