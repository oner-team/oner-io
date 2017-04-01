import {extend, NULL, TRUE, FALSE} from './util'
import ajax from './__AJAX__'
import jsonp from './__JSONP__'

let rid = 0
const getRid = function () {
    return rid++
}

export default class Request {

    constructor(apiInstance) {

        const {_path, config, api, contextId} = apiInstance

        this._apiInstance = apiInstance

        // 单次请求实例的id，用于从`api`实例的`_pendingList`中删除请求实例
        this._rid = [contextId, _path, getRid()].join('-')

        this._path = _path
        this.config = config
        this.storage = api.storage
        this.contextId = contextId

        // 工作状态
        this.pending = FALSE
        this._requester = NULL

        // 每次请求私有的相关数据
        // this.vars = {
        //     // `url`中的标记
        //     mark: {
        //         _api: _path,
        //         _mock: config.mock,
        //         // retryTime: {Number} 重试次数
        //     },
        //     // 其他键值说明
        //     // data: {Object} `send`方法执行时创建
        // }
    }

    // 发起网络请求 返回一个Promise实例
    send({vars, onSuccess, onError, onComplete}) {

        this.vars = vars

        this.onSuccess = onSuccess
        this.onError = onError
        this.onComplete = onComplete

        const {config} = this

        // `data`必须在请求发生时实时创建
        // 另外，将数据参数存在私有标记中, 方便API的`process`方法内部使用
        // vars.data = data

        // 重试次数
        // if (mark) {
        //     vars.mark = extend(vars.mark, mark)
        // }

        // 调用 willFetch 钩子
        config.willFetch(vars, config, 'remote')

        // 等待状态在此处开启 在相应的`requester`的`complete`回调中关闭
        this.pending = TRUE

        // 创建请求实例requester
        if (config.customRequest) {
            // 使用已有的request方法
            this._requester = config.customRequest(vars, config)
        } else if (config.jsonp) {
            this._requester = this.jsonp()
        } else {
            this._requester = this.ajax()
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

                    this.onError(error)
                }
            }, config.timeout)
        }
    }

    // 处理结构化的响应数据
    processResponse(response) {
        const {config, vars} = this
        // 调用 didFetch 钩子函数
        config.didFetch(vars, config)

        // 非标准格式数据的预处理
        response = config.fit(response, vars)

        if (response.success) {
            // 数据处理
            const content = config.process(response.content, vars)
            this.onSuccess(content)
        } else {
            const error = extend({
                message: '`success` is false, ' + this._path
            }, response.error)
            // NOTE response是只读的对象!!!
            this.onError(error)
        }
    }

    // 发起Ajax请求
    // @returns {Object} xhr对象实例
    ajax() {

        const {config, vars} = this

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
            success: (response/*, xhr*/) => {
                this.processResponse(response)
            },
            error: (status) => {
                // 如果跨域使用了自定义的header，且服务端没有配置允许对应的header，此处status为0，目前无法处理。
                const error = {
                    status,
                    message: `Error(status ${status}) in request for ${vars.mark._api}(${url})`
                }
                this.onError(error)
            },
            complete: (/*status, xhr*/) => {
                this.onComplete()
                this.pending = FALSE
                this._requester = NULL
            }
        })
    }

    // 发起jsonp请求
    // @returns {Object} 带有abort方法的对象
    jsonp() {
        const {config, vars} = this
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
            success: (response) => {
                this.processResponse(response)
            },
            error: () => {
                const error = {
                    message: `Not accessable JSONP in request for ${vars.mark._api}(${url})`
                }
                this.onError(error)
            },
            complete: () => {
                this.onComplete()
                this.pending = FALSE
                this._requester = NULL
            }
        })
    }

    // 取消请求
    abort() {
        if (this._requester) {
            this._requester.abort()
        }
    }
}