export const hasWindow = 'undefined' !== typeof window
export const hasConsole = 'undefined' !== typeof console
export const doc = hasWindow ? document : null
export const escape = encodeURIComponent
export const NULL = null
export const TRUE = true
export const FALSE = !TRUE
export const UNDEFINED = 'undefined'
export const EMPTY = ''

const toString = Object.prototype.toString
const ARRAY_TYPE = '[object Array]'
const OBJECT_TYPE = '[object Object]'

/**
 * 伪造的`promise`对象
 * NOTE 伪造的promise对象要支持链式调用 保证和`new Promise`返回的对象行为一致
 *    dummyPromise.then().catch().finally()
 */
export const dummyPromise = {
  dummy: TRUE,
}

dummyPromise.then = dummyPromise['catch'] = () => {
  // NOTE 这里用了剪头函数 不能用`return this`
  return dummyPromise
}

/**
 * 判断是否是IE8~11, 不包含Edge
 * @returns {boolean}
 * @note IE11下 window.ActiveXObject的值很怪异, 所以需要追加 'ActiveXObject' in window 来判断
 */
export const isIE = hasWindow && (!!window.ActiveXObject || 'ActiveXObject' in window)

export function noop(v) {
  return v
}

/**
 * 变换两个参数的函数到多个参数
 * @param  {Function} fn 基函数
 * @return {Function} 变换后的函数
 * @demo
 *    function add(x, y) { return x+y; }
 *    add = redo(add);
 *    add(1,2,3) => 6
 */
export function redo(fn) {
  return function () {
    const args = arguments
    let ret = fn(args[0], args[1])
    for (let i = 2, l = args.length; i < l; i++) {
      ret = fn(ret, args[i])
    }
    return ret
  }
}

// const random = Math.random
// const floor = Math.floor
// export function makeRandom() {
//   return floor(random() * 9e9)
// }

const absoluteUrlReg = /^(https?:)?\/\//
export function isAbsoluteUrl(url) {
  return !!url.match(absoluteUrlReg)
}

const relativeUrlReg = /^[\.\/]/
export function isRelativeUrl(url) {
  return !!url.match(relativeUrlReg)
}

const BOOLEAN = 'boolean'
export function isBoolean(v) {
  return typeof v === BOOLEAN
}

const STRING = 'string'
export function isString(v) {
  return typeof v === STRING
}

const FUNCTION = 'function'
export function isFunction(v) {
  return typeof v === FUNCTION
}

export function runAsFn(v) {
  return isFunction(v) ? v() : v
}

const NUMBER = 'number'
export function isNumber(v) {
  return !isNaN(v) && typeof v === NUMBER
}

const OBJECT = 'object'
export function isObject(v) {
  return typeof v === OBJECT && v !== NULL
}

export function isWindow(v) {
  return v !== NULL && v === v.window
}

// 参考了zepto
export function isPlainObject(v) {
  return v !== NULL && isObject(v) && !isWindow(v) && Object.getPrototypeOf(v) === Object.prototype
}

export function isEmptyObject(v) {
  let count = 0
  for (let i in v) {
    if (v.hasOwnProperty(i)) {
      count++
    }
  }
  return count === 0
}

export function isArray(v) {
  return toString.call(v) === ARRAY_TYPE
}

/**
 * 判断是否跨域
 * @type {Element}
 * @note 需要特别关注IE8~11的行为是不一样的!!!
 */
let originA
if(doc) {
  originA = doc.createElement('a')
  originA.href = location.href
}
export function isCrossDomain(url) {

  let requestA = doc.createElement('a')
  requestA.href = url

  // 如果`url`的值不包含`protocol`和`host`(比如相对路径), 在标准浏览器下, 会自定补全`requestA`对象的`protocal`和`host`属性.
  // 但在IE8~11下, 不会自动补全. 即`requestA.protocol`和`requestA.host`的值都是空的.
  // 在IE11的不同小版本下, requestA.protocol的值有的是`:`, 有的是空字符串, 太奇葩啦!
  if (__FALLBACK__) {
    if (isIE && (requestA.protocol === ':' || requestA.protocol === '')) {
      if (requestA.hostname === '') {
        //alert(0)
        return false
      } else {
        //alert('1:'+(originA.hostname !== requestA.hostname || originA.port !== requestA.port))
        return originA.hostname !== requestA.hostname || originA.port !== requestA.port
      }
    }
  }

  // 标准浏览器
  return originA.hostname !== requestA.hostname || originA.port !== requestA.port || originA.protocol !== requestA.protocol
}

/**
 * 对象扩展
 * @param  {Object} receiver
 * @param  {Object} supplier
 * @return {Object} 扩展后的receiver对象
 * @note 这个extend方法是定制的, 不要拷贝到其他地方用!!!
 * @note 这个extend方法是深拷贝方式的!!!
 */
function _extend(receiver = {}, supplier = {}, deepCopy = FALSE) {
  for (let key in supplier) {
    // `supplier`中不是未定义的键 都可以执行扩展
    if (supplier.hasOwnProperty(key) && supplier[key] !== undefined) {
      if (deepCopy === TRUE) {
        if (isArray(supplier[key])) {
          receiver[key] = [].concat(supplier[key])
        } else if (isPlainObject(supplier[key])) {
          receiver[key] = extend({}, supplier[key])
        } else {
          receiver[key] = supplier[key]
        }
      } else {
        receiver[key] = supplier[key]
      }
    }
  }
  return receiver
}

const extend = redo(_extend)
export {extend}

export function likeArray(v) {
  if (!v) {
    return false
  }
  return typeof v.length === NUMBER
}

/**
 *
 * @param v {Array|Object} 遍历目标对象
 * @param fn {Function} 遍历器 会被传入两个参数, 分别是`value`和`key`
 */
export function each(v, fn) {
  let i, l
  if (likeArray(v)) {
    for (i = 0, l = v.length; i < l; i++) {
      if (fn.call(v[i], v[i], i) === false) return
    }
  } else {
    for (i in v) {
      if (fn.call(v[i], v[i], i) === false) return
    }
  }
}

/**
 * 将对象的`键`排序后 返回一个新对象
 *
 * @param obj {Object} 被操作的对象
 * @returns {Object} 返回的新对象
 * @case 这个函数用于对比两次请求的参数是否一致
 */
export function sortPlainObjectKey(obj) {
  let clone = {}
  let key
  let keyArray = []
  for (key in obj) {
    if (obj.hasOwnProperty(key)) {
      keyArray.push(key)
      if (isPlainObject(obj[key])) {
        obj[key] = sortPlainObjectKey(obj[key])
      }
    }
  }
  keyArray.sort()
  for (let i=0, l=keyArray.length; i<l; i++) {
    clone[keyArray[i]] = obj[keyArray[i]]
  }
  return clone
}

export function serialize(params, obj, traditional, scope) {
  let type, array = isArray(obj), hash = isPlainObject(obj)
  each(obj, function(value, key) {
    type = toString.call(value)
    if (scope) {
      key = traditional ? scope : scope + '[' + (hash || type === OBJECT_TYPE || type === ARRAY_TYPE ? key : '') + ']'
    }

    // 递归
    if (!scope && array) {
      params.add(value.name, value.value)
    }
    // recurse into nested objects
    else if (type == ARRAY_TYPE || (!traditional && type == OBJECT_TYPE)) {
      serialize(params, value, traditional, key)
    } else {
      params.add(key, value)
    }
  })
}

/**
 * 功能和`Zepto.param`一样
 * @param obj {Object}
 * @param traditional {Boolean}
 * @returns {string}
 * $.param({ foo: { one: 1, two: 2 }}) // "foo[one]=1&foo[two]=2)"
 * $.param({ ids: [1,2,3] })       // "ids[]=1&ids[]=2&ids[]=3"
 * $.param({ ids: [1,2,3] }, true)   // "ids=1&ids=2&ids=3"
 * $.param({ foo: 'bar', nested: { will: 'not be ignored' }})  // "foo=bar&nested[will]=not+be+ignored"
 * $.param({ foo: 'bar', nested: { will: 'be ignored' }}, true)  // "foo=bar&nested=[object+Object]"
 * $.param({ id: function(){ return 1 + 2 } })  // "id=3"
 */
export function param(obj, traditional) {
  var params = []
  params.add = (key, value) => {
    if (isFunction(value)) value = value()
    if (value == NULL) value = ''
    params.push(escape(key) + '=' + escape(value))
  }
  serialize(params, obj, traditional)
  return params.join('&').replace(/%20/g, '+')
}

export function decodeParam(str) {
  return decodeURIComponent(str.replace(/\+/g, ' '))
}

// 给URL追加查询字符串
export function appendQueryString(url, obj, urlStamp, traditional) {
  // 是否添加时间戳
  if (urlStamp) {
    obj[isBoolean(urlStamp) ? '_stamp' : urlStamp] = +new Date()
  }
  let queryString = param(obj, traditional)

  if (queryString) {
    return url + (~url.indexOf('?') ? '&' : '?') + queryString
  } else {
    return url
  }
}

// 随机字符串字符集
const chars = 'ABCDEFGHJKMNPQRSTWXYZabcdefhijkmnprstwxyz2345678'

// 创建随机字符串
export function makeRandom(n = 6) {
  let str = ''
  for (let i = 0; i < n; i++) {
    str += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return str
}

export function makeMessage(str, obj, log = false) {
  log && hasConsole && console.log(str + '\n' + JSON.stringify(obj, null, 2))
  return str
}