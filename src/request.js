import {extend, NULL, TRUE, FALSE, isAbsoluteUrl, isRelativeUrl, EMPTY} from './util'
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
    }

    // 发起网络请求 返回一个Promise实例
    send({vars, onSuccess, onError, onComplete}) {

        this.vars = vars

        this.onSuccess = onSuccess
        this.onError = onError
        this.onComplete = onComplete

        const {config} = this

        // 调用 willFetch 钩子
        config.willFetch(vars, config, 'remote')

        // 等待状态在此处开启 在相应的`requester`的`complete`回调中关闭
        this.pending = TRUE

        // 创建请求实例requester
        if (config.customRequest) {
            // 使用私有的request方法
            this._requester = config.customRequest(vars, config, (isSuccess, response) => {
              // 当isSuccess为false时，response的结构应该是 {message: 'xxx'}
              isSuccess ? this.processResponse(response) : this.onError(response)
            })
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

    // 获取正式接口的完整`url`
    // @param config {Object}
    getFinalUrl() {
        const {config, vars} = this
        let url = config.mock ? config.mockUrl : config.url
        if (!url) return EMPTY
        const prefixKey = config.mock ? 'mockUrlPrefix' : 'urlPrefix'
        const suffixKey = config.mock ? 'mockUrlSuffix' : 'urlSuffix'
        const prefix = config[prefixKey] && !isAbsoluteUrl(url) && !isRelativeUrl(url) ? config[prefixKey] : EMPTY
        const suffix = config[suffixKey] ? config[suffixKey]: EMPTY

        url = prefix + url + suffix

        // 如果是RESTFul API，填充所有的':x'参数
        if (config.rest) {
            const restData = vars.data
            for (let param in restData) {
                if (~param.indexOf(':')) {
                    url = url.replace(new RegExp('\\/' + param), '/' + restData[param])
                    delete restData[param]
                }
            }
        }

        return url
    }

    // 发起Ajax请求
    // @returns {Object} xhr对象实例
    ajax() {
        const {config, vars} = this

        const url = this.getFinalUrl()

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
            success: response => {
                this.processResponse(response)
            },
            error: status => {
                // 如果跨域使用了自定义的header，且服务端没有配置允许对应的header，此处status为0，目前无法处理。
                const error = {
                    status,
                    message: `Error(status ${status}) in request for ${vars.mark._api}(${url})`
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

    // 发起jsonp请求
    // @returns {Object} 带有abort方法的对象
    jsonp() {
        const {config, vars} = this

        const url = this.getFinalUrl()

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
            crossOrigin: config.jsonpCrossOrigin,
            success: response => {
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