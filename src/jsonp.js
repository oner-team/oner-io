import {appendQueryString, noop, extend, makeRandom, hasWindow, NULL, TRUE, FALSE} from './util'
const win = hasWindow ? window : NULL
const doc = hasWindow ? document : NULL
const SCRIPT = 'script'

const removeScript = script => {
  script.onerror = NULL
  script.parentNode.removeChild(script)
  script = NULL
}
let head = NULL
const insertScript = (url, options) => {
  let script = doc.createElement(SCRIPT)
  script.src = url
  script.async = true

  if (options.crossOrigin) {
    script.crossOrigin = true
  }

  script.onerror = () => {
    win[options.callbackName] = NULL
    options.error(`${url} 请求出错`)
    options.complete()
  }
  script.onload = () => {
    setTimeout(() => {
      if (win[options.callbackName] ) {
        options.error(`'${url}' 返回值错误`)
        options.complete()
      }
    }, 0)
  }

  head = head || doc.getElementsByTagName('head')[0]
  head.insertBefore(script, head.firstChild)
  return script
}

const defaultOptions = {
  url: '',
  mark: {},
  urlMark: TRUE,
  data: {},
  urlStamp: TRUE,
  success: noop,
  error: noop,
  complete: noop,
  log: FALSE,
  flag: 'callback',
  callbackName: 'jsonp{id}',
  traditional: FALSE,
  crossOrigin: FALSE,
}

export default function jsonp(options) {

  options = extend({}, defaultOptions, options)

  const callbackName = options.callbackName = options.callbackName.replace(/\{id\}/, makeRandom(6))

  const originComplete = options.complete

  let script

  // 二次包装的`complete`回调
  options.complete = () => {
    // 删除脚本
    removeScript(script)
    originComplete()
  }

  // 成功回调
  win[callbackName] = data => {
    // JSONP函数需要立即删除 用于`IE8`判断是否触发`onerror`
    win[callbackName] = NULL
    options.success(data)
    options.complete()
  }

  // 生成`url`
  let url = appendQueryString(
    options.url,
    extend({[options.flag]: callbackName}, options.urlMark ? options.mark : {}, options.data),
    options.urlStamp,
    options.traditional
  )

  // 插入脚本
  script = insertScript(url, options)
  
  return {
    abort() {
      // 覆盖成功回调为无数据处理版本
      win[callbackName] = () => {
        win[callbackName] = NULL
      }
      removeScript(script)
    },
  }
}
