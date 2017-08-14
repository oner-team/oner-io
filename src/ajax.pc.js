import {
  extend, appendQueryString, noop, isCrossDomain, isBoolean, param, isIE,
  hasWindow, TRUE, FALSE, UNDEFINED, NULL,
} from './util'

const GET = 'GET'
const SCRIPT = 'script'
const XML = 'xml'
const JS0N = 'json' // NOTE 不能使用`JSON`，这里用数字零`0`代替了字母`O`

const xhrTester = UNDEFINED !== typeof XMLHttpRequest ? new XMLHttpRequest() : {}
const hasXDR = UNDEFINED !== typeof XDomainRequest
const fallback = hasWindow ? (!('withCredentials' in xhrTester) && hasXDR) : NULL
const supportCORS = hasWindow ? (('withCredentials' in xhrTester) || hasXDR) : NULL

// minetype的简写映射
// TODO 考虑是否优化
const acceptToRequestHeader = {
  // IIS returns `application/x-javascript` 但应该不需要支持
  '*':  '*/' + '*',
  script: 'text/javascript, application/javascript, application/ecmascript, application/x-ecmascript',
  json:   'application/json, text/json',
  xml:  'application/xml, text/xml',
  html:   'text/html',
  text:   'text/plain',
}

// 设置请求头
// 没有处理的事情：跨域时使用者传入的多余的Header没有屏蔽 没必要
// - 请求方法是`POST`, `PUT`, `PATCH`时，推荐的最佳实战是将`Content-Type`设置为`application/json;utf-8`。
//   而且服务端应该对HTTP请求主体做编码验证，当`Content-Type`的值不是`application/json`时，抛出415异常，
//   即`unsupported media type`。
// - 跨域情况下，如果请求头的`Content-Type`值不是`application/x-www-form-urlencoded, multipart/form-data, text/plain`，
//   浏览器会先发送`OPTIONS`请求来询问服务端是否允许，此时应该直接返回`200`，表示允许。
// - 使用`POST`方式时，如果不设置`Content-Type`，浏览器的默认值为`text/plain;charset=utf-8`。
// - 关于请求动词的浏览器兼容性：即使是IE，兼容性都很棒
// - PUT 和 PATCH 是不一样的，PUT替换整个数据，PATCH只修改局部数据 或 添加新的属性数据
// - 好好看看：http://stackoverflow.com/questions/12320467/jquery-cors-content-type-options
const setHeaders = (xhr, options) => {
  // IE下如果跨域 xhr对象是不允许设置自定义header的 也没有setRequestHeader方法
  if (!xhr.setRequestHeader) {
    return {}
  }

  const header = {
    Accept: acceptToRequestHeader[options.accept],
  }

  // 如果没有跨域 则打该标识 业界通用做法
  if (!isCrossDomain(options.url)) {
    header['X-Requested-With'] = 'XMLHttpRequest'
  }

  // 如果POST方法，没有明确指定编码方式，默认urlencoded，
  // TODO v3.x将去掉改处理！！！需要文档强调
  if (options.method === 'POST' && !header['Content-Type']) {
    header['Content-Type'] = 'application/x-www-form-urlencoded'
  }

  extend(header, options.header)

  for (let key in header) {
    xhr.setRequestHeader(key, header[key])
  }

  return header
}

// 绑定事件
const setEvents = (xhr, options, isCrossDomain) => {

  let completeFn = function() {
    if (xhr._completed) {
      return
    }
    xhr._completed = true
    //options.log && console.info('~loadend')
    options.complete()
    xhr._aborted = null
    delete xhr._aborted
  }

  let onLoadFn = function() {

    if (xhr._completed) {
      return
    }

    let data = xhr.responseText

    switch (options.accept) {
      case JS0N:
        try {
          data = JSON.parse(data)
        } catch (e) {
          console.warn('The response can NOT be parsed to JSON object.', data)
        }
        break
      case SCRIPT:
        (1, eval)(data)
        break
      case XML:
        data = xhr.responseXML
        break
      default:
        break
    }

    options.success(data, xhr)
    //C.log('complete after load')
    completeFn()
  }

  let onErrorFn = function () {
    if (xhr._completed) {
      return
    }
    options.error(xhr.status, xhr)
    //C.log('complete after error')
    completeFn()
  }

  let abortFn = function() {
    if (xhr._completed) {
      return
    }
    options.abort()
    completeFn()
  }

  // 如果是IE8/9 且 如果是跨域请求
  if (fallback && isCrossDomain) {

    // `XDomainRequest`实例是没有`onreadystatechange`方法的!!!
    xhr.onload = onLoadFn
  } else {
    // readyState value:
    //   0: UNSET 未初始化
    //   1: OPENED
    //   2: HEADERS_RECEIVED
    //   3: LOADING
    //   4: DONE 此时触发load事件
    xhr.onreadystatechange = () => {

      if (xhr._completed) {
        return
      }
      //console.log('xhr.readyState', xhr.readyState, 'xhr.status', xhr.status, xhr)
      if (xhr.readyState == 4) {

        // 如果请求被取消(aborted) 则`xhr.status`会是0 所以不会进入`success`回调
        if ((xhr.status >= 200 && xhr.status < 300) || xhr.status === 304) {
          onLoadFn()
        } else {
          // 因为取消时会先触发原生的`onreadystatechange`响应，后触发`onAbort`回调，所以
          // 如果请求被取消(aborted) 则`xhr.status`会是0 程序走到这里的时候，`xhr._aborted`状态是false，
          // 需要排除，不应该触发`error`回调
          !xhr._aborted && onErrorFn()
        }
      }
    }
  }

  xhr.onerror = onErrorFn

  // 重写`abort`方法
  let originAbort = xhr.abort
  xhr.abort = function() {
    if (xhr._completed) {
      return
    }
    xhr._aborted = true
    // NOTE 直接调用`originAbort()`时 浏览器会报 `Illegal invocation` 错误

    // 非IE浏览器才会真正的调用原生`abort`
    // https://github.com/jias/natty-fetch/issues/27
    if (!isIE) {
      originAbort.call(xhr)
    }

    // `XDomainRequest`对象实例居然没有`onabort`方法
    abortFn()
  }

  // IE9 bug
  xhr.onprogress = xhr.ontimeout = noop
}

const defaultOptions = {
  url: '',
  mark: {},
  urlMark: TRUE,
  method: GET,
  accept: '*',
  data: NULL,
  header: {},
  withCredentials: NULL, // 根据`url`是否跨域决定默认值. 如果显式配置该值(必须是布尔值), 则个使用配置值
  urlStamp: TRUE,
  success: noop,
  error: noop,
  complete: noop,
  abort: noop,
  query: {},
  log: FALSE,
  traditional: FALSE,
  // postDataFormat: 'FORM'
}

export default function ajax(options) {

  options = extend({}, defaultOptions, options)

  // 是否跨域
  let isCD = isCrossDomain(options.url)

  // H5版本
  // `IE10+`和标准浏览器的`XMLHttpRequest`都原生支持跨域
  let xhr = new XMLHttpRequest()

  // `IE8/9`使用`XDomainRequest`来实现跨域, `IE10+`的`XMLHttpRequest`对象直接支持跨域
  if (fallback && isCD) {
    // NOTE `XDomainRequest`仅支持`GET`和`POST`两个方法
    // 支持的事件有: onerror, onload, onprogress, ontimeout, 注意没有`onloadend`
    // https://developer.mozilla.org/zh-CN/docs/Web/API/XDomainRequest
    xhr = new XDomainRequest()
  }

  // 再高级的浏览器都有低级错误! 已经不能在相信了!
  // MAC OSX Yosemite Safari上的低级错误: 一次`ajax`请求的`loadend`事件完成之后,
  // 如果执行`xhr.abort()`, 居然还能触发一遍`abort`和`loadend`事件!!!
  // `_completed`标识一次完整的请求是否结束, 如果已结束, 则不再触发任何事件
  xhr._completed = FALSE

  setEvents(xhr, options, isCD)

  xhr.open(options.method, appendQueryString(
    options.url,
    extend({}, options.urlMark ? options.mark : {}, options.method === GET ? options.data : {}, options.query),
    options.urlStamp,
    options.traditional
  ))

  // NOTE 生产环境的Server端, `Access-Control-Allow-Origin`的值一定不要配置成`*`!!! 而且`Access-Control-Allow-Credentials`应该是true!!!
  // NOTE 如果Server端的`responseHeader`配置了`Access-Control-Allow-Origin`的值是通配符`*` 则前端`withCredentials`是不能使用true值的
  // NOTE 如果Client端`withCredentials`使用了true值 则后端`responseHeader`中必须配置`Access-Control-Allow-Credentials`是true
  if (!fallback) {
    xhr.withCredentials = isBoolean(options.withCredentials) ? options.withCredentials : isCD
  }
  
  // 设置requestHeader
  const header = setHeaders(xhr, options)

  let data

  if (header['Content-Type'] && ~header['Content-Type'].indexOf('application/x-www-form-urlencoded')) {
    data = param(options.data, options.traditional)
  } else {
    data = JSON.stringify(options.data)
  }
  
  // 文档建议说 send方法如果不发送请求体数据 则null参数在某些浏览器上是必须的
  xhr.send(options.method === GET ? NULL : data === NULL ? NULL : data)

  return xhr
}

ajax.fallback = fallback
ajax.supportCORS = supportCORS

