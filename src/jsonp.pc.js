import {appendQueryString, noop, extend, makeRandom, hasWindow, NULL, TRUE, FALSE} from './util'
const win = hasWindow ? window : NULL
const doc = hasWindow ? document : NULL
const SCRIPT = 'script'
const IE8 = hasWindow ? navigator.userAgent.indexOf('MSIE 8.0') > -1 : FALSE

const removeScript = script => {
  if (IE8 && script.readyState) {
    script.onreadystatechange = NULL
  } else {
    script.onerror = NULL
  }
  script.parentNode.removeChild(script)
  script = NULL
}
let head = NULL
const insertScript = (url, options) => {
  let script = doc.createElement(SCRIPT)
  script.type = 'text/javascript'
  script.src = url
  script.async = TRUE

  if (options.crossOrigin) {
    script.crossorigin = true
  }

  // 绑定`error`事件
  if (IE8 && script.readyState) {
    script.onreadystatechange = () => {
      // IE8下script标签不支持`onerror`事件, 通过JSONP的执行顺序来模拟触发:
      // 1:   script.readyState状态值为`loading`
      // 2.1: 如果脚本加载成功, 浏览器就会先执行脚本内容, 即调用JSONP函数, 如: `jsonp2327905726()`,
      //    (该函数执行之后会立即被设置成`null`值, 用于第3步的判断), JSONP函数执行完成后, 会进入第3步.
      // 2.2: 如果脚本加载不成功, 也会进入第3步.
      // 3:   无论脚本是否加载成功, `script.readyState`状态值都变化为`loaded`,
      //    如果加载不成功, 可以通过判断JSONP函数一定是存在, 即可模拟`error`回调了.
      if (script.readyState === 'loaded' && win[options.callbackName]) {
        win[options.callbackName] = NULL
        options.error()
        options.complete()
      }
    }
  } else {
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
