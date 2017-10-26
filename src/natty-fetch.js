import nattyStorage from 'natty-storage'
import * as util from './util'

const {
  extend, runAsFn, isBoolean,
  isArray, isFunction, sortPlainObjectKey, isEmptyObject,
  isPlainObject, dummyPromise,
  isString, NULL, TRUE, FALSE, hasConsole, makeRandom,
} = util

import Request from './request'
import ajax from './__AJAX__'
import Defer from './defer'
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

    this.contextConfig = contextConfig

    this.contextId = contextId

    // 进行中的请求列队
    this._pendingList = []

    this.storage = NULL

    const config = this.config = this.processAPIOptions(options)

    // `api`的实现
    // @param data {Object|Function}
    // @returns {Object} Promise Object
    this.api = data => {

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

      const vars = this.makeVars(data)

      if (this.api.storageUseable) {
        const result = this.api.storage.has(vars.queryString)
        if (result.has) {
          return new config.Promise(resolve => {
            resolve(result.value)
          })
        } else {
          return config.retry === 0 ? this.send(vars) : this.sendWithRetry(vars)
        }
      } else {
        return config.retry === 0 ? this.send(vars) : this.sendWithRetry(vars)
      }
    }

    this.api.config = config

    this.api.hasPending = () => {
      return !!this._pendingList.length
    }

    // 要删除的方法，这个地方是`v2.3.0`版本之前都存在的设计错误，因为：
    // io.get().then(...) 发送第一次
    // io.get().then(...) 发送第二次
    // io.get.abort()   取消哪一次? 并发情况复杂的业务，结果不明确。
    // 当前的解决方式是取消所有，不完美
    this.api.abort = () => {
      hasConsole && console.warn('`abort` method will be deleted later!')
      for (let i=0, l=this._pendingList.length; i<l; i++) {
        this._pendingList[i].abort()
      }
    }

    this.initStorage()

    // 启动插件
    let plugins = isArray(config.plugins) ? config.plugins : []

    for (let i=0, l=plugins.length; i<l; i++) {
      isFunction(plugins[i]) && plugins[i].call(this, this)
    }
  }

  // @param {Object} 一次独立的请求数据
  makeVars(data) {
    const {config} = this
    // 每次请求私有的相关数据
    const vars = {
      // `url`中的标记
      mark: {
        _api: this._path,
        _mock: config.mock,
      },
      // 此api是定义接口时的多层级命名路径(如：'foo.bar.getList')，不是发起请求时的url地址
      api: this._path,
      mock: config.mock,
      // 上下文id值，如果在调用nattyFetch.context方法时没有指定上下文的名称，默认采用c0，c1
      contextId: this.contextId,
    }

    // `data`必须在请求发生时实时创建
    // 另外，将数据参数存在私有标记中, 方便API的`process`方法内部使用
    data = extend({}, runAsFn(config.data), runAsFn(data))

    // 承载请求参数数据
    vars.data = data

    // 根据`data`创建`storage`查询用的`key`
    if (this.api.storageUseable) {
      vars.queryString = isEmptyObject(data) ? 'no-query-string' : JSON.stringify(sortPlainObjectKey(data))
    }

    return vars
  }

  // 发送真正的网络请求
  send(vars) {
    const {config} = this

    // 每次请求都创建一个请求实例
    const request = new Request(this)

    this._pendingList.push(request)

    const defer = new Defer(config.Promise)

    request.send({
      vars,
      onSuccess: content => {
        if (this.api.storageUseable) {
          this.api.storage.set(vars.queryString, content)
        }
        defer.resolve(content)
        event.fire('g.resolve', [content, config], config)
        event.fire(this.contextId + '.resolve', [content, config], config)
      },
      onError: error => {
        defer.reject(error)
        event.fire('g.reject', [error, config, vars], config)
        event.fire(this.contextId + '.reject', [error, config, vars], config)
      },
      onComplete: () => {
        let indexToRemove
        for (let i=0, l=this._pendingList.length; i<l; i++) {
          if (this._pendingList[i] === request) {
            indexToRemove = i
            break
          }
        }
        indexToRemove !== undefined && this._pendingList.splice(indexToRemove, 1)
      },
    })

    return defer.promise
  }

  sendWithRetry(vars) {
    const {config} = this

    return new config.Promise((resolve, reject) => {

      let retryTime = 0
      const sendOneTime = () => {
        // 更新的重试次数
        vars.mark._retryTime = retryTime
        this.send(vars).then(content => {
          resolve(content)
        }, error => {
          if (retryTime === config.retry) {
            reject(error)
          } else {
            retryTime++
            sendOneTime()
          }
        })
      }
      sendOneTime()
    })
  }

  // 处理API的配置
  // @param options {Object}
  processAPIOptions(options) {

    // 插件是不能覆盖的, 应该追加
    const plugins = [].concat(this.contextConfig.plugins || [], options.plugins || [])

    const config = extend({}, this.contextConfig, options, {
      plugins,
    })

    // 按照[boolean, callbackKeyWord, callbackFunctionName]格式处理
    if (isArray(options.jsonp)) {
      config.jsonp = isBoolean(options.jsonp[0]) ? options.jsonp[0] : FALSE
      // 这个参数只用于jsonp
      if (config.jsonp) {
        config.jsonpFlag = options.jsonp[1]
        config.jsonpCallbackName = options.jsonp[2]
      }
    }

    // 配置自动增强 如果`url`的值有`.jsonp`结尾 则认为是`jsonp`请求
    // NOTE jsonp是描述正式接口的 不影响mock接口!!!
    if (!config.mock && !!config.url.match(/\.jsonp(\?.*)?$/)) {
      config.jsonp = TRUE
    }

    return config
  }

  // 初始化缓存对象
  initStorage() {
    const {config} = this

    // 简易开启缓存的写法
    if (config.storage === TRUE) {
      config.storage = {
        type: 'variable',
      }
    }

    // 综合判断缓存是不是可以启用
    this.api.storageUseable = isPlainObject(config.storage)
      && (config.method === 'GET' || config.jsonp)
      && (
        nattyStorage.supportStorage
        && (
          ['localStorage', 'sessionStorage'].indexOf(config.storage.type) > -1
          || config.storage.type === 'variable'
        )
      )

    // 创建缓存实例
    if (this.api.storageUseable) {
      // 当使用`localStorage`时, 强制指定`key`值。如果没指定, 抛错!
      // 当使用`variable`或`sessionStorage`时, 如果没指定`key`, 则自动生成内部`key`
      // !!!为什么在使用`localStorage`时必须指定`key`值???
      // !!!因为当key发生变化时, `localStorage`很容易产生死数据, 必须强制开发者有意识的去维护`key`值
      if (config.storage.type === 'localStorage') {
        if (!config.storage.hasOwnProperty('key') || !config.storage.key) {
          throw new Error('`key` is required when `storage.type` is `localStorage`.')
        }
      } else {
        config.storage.key = config.storage.key || [this.contextId, this._path].join('_')
      }

      // `key`和`tag`的选择原则:
      // `key`只选用相对稳定的值, 减少因为`key`的改变而增加的残留缓存
      // 经常变化的值用于`tag`, 如一个接口在开发过程中可能使用方式不一样, 会在`jsonp`和`get`之间切换。
      this.api.storage = nattyStorage(extend({}, config.storage, {
        tag: [
          config.storage.tag,
          config.jsonp ? 'jsonp' : config.method,
          config.url,
        ].join('_'), // 使用者的`tag`和内部的`tag`, 要同时生效
      }))
    }
  }
}

const context = (contextId, options) => {
  if (isString(contextId)) {
    options = options || {}
  } else {
    options = contextId || {}
    contextId = 'c' + makeRandom()
  }

  const storage = nattyStorage({
    type: 'variable',
    key: contextId,
  })

  const ctx = {}

  ctx.api = storage.get()

  ctx._contextId = contextId

  // 插件是不能覆盖的, 应该追加
  let plugins = [].concat(runtimeGlobalConfig.plugins || [], options.plugins || [])

  ctx._config = extend({}, runtimeGlobalConfig, options, {
    plugins,
  })

  // 创建api
  // @param namespace {String} optional
  // @param APIs {Object} 该`namespace`下的`api`配置
  ctx.create = function(namespace, APIs) {
    let hasNamespace = arguments.length === 2 && isString(namespace)

    if (!hasNamespace) {
      APIs = namespace
    }

    for (let path in APIs) {
      if (APIs.hasOwnProperty(path)) {
        storage.set(
          hasNamespace ? namespace + '.' + path : path,
          new API(
            hasNamespace ? namespace + '.' + path : path,
            runAsFn(APIs[path]),
            ctx._config,
            contextId
          ).api
        )
      }
    }

    ctx.api = storage.get()
  }

  // 绑定上下文事件
  ctx.on = function(name, fn) {
    if (!isFunction(fn)) return
    event.on(ctx._contextId + '.' + name, fn)
    return ctx
  }

  return ctx
}

const nattyFetch = {}

// 简易接口
// @param options
nattyFetch.create = function (options) {
  return new API('nattyFetch', runAsFn(options), defaultGlobalConfig, 'global').api
}

extend(nattyFetch, {
  onlyForModern: !__FALLBACK__, // eslint-disable-line
  version: '__VERSION__',
  _util: util,
  _event: event,
  _ajax: ajax,
  context,

  // 执行全局配置
  // @param options
  setGlobal(options) {
    runtimeGlobalConfig = extend({}, defaultGlobalConfig, options)
    return this
  },

  // 获取全局配置
  // @param property {String} optional
  // @returns {*}
  getGlobal(property) {
    return property ? runtimeGlobalConfig[property] : runtimeGlobalConfig
  },

  // 绑定全局事件
  on(name, fn) {
    if (!isFunction(fn)) return
    event.on('g.' + name, fn)
    return this
  },

  // 插件名称空间
  plugin: {
    loop: pluginLoop,
    soon: pluginSoon,
  },
})

// 内部直接将运行时的全局配置初始化到默认值
nattyFetch.setGlobal(defaultGlobalConfig)

export default nattyFetch