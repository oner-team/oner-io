/*! natty-fetch.pc.js v2.5.5 | MIT License | fushan | https://github.com/jias/natty-fetch */
(function (global, factory) {
  typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory(require('natty-storage')) :
  typeof define === 'function' && define.amd ? define(['natty-storage'], factory) :
  (global.nattyFetch = factory(global.nattyStorage));
}(this, (function (nattyStorage) { 'use strict';

nattyStorage = 'default' in nattyStorage ? nattyStorage['default'] : nattyStorage;

var hasWindow = 'undefined' !== typeof window;
var hasConsole$1 = 'undefined' !== typeof console;
var doc = hasWindow ? document : null;
var escape = encodeURIComponent;
var NULL$1 = null;
var TRUE$1 = true;
var FALSE$1 = !TRUE$1;
var UNDEFINED = 'undefined';
var EMPTY = '';

var toString = Object.prototype.toString;
var ARRAY_TYPE = '[object Array]';
var OBJECT_TYPE = '[object Object]';

/**
 * 伪造的`promise`对象
 * NOTE 伪造的promise对象要支持链式调用 保证和`new Promise`返回的对象行为一致
 *    dummyPromise.then().catch().finally()
 */
var dummyPromise$1 = {
  dummy: TRUE$1,
};

dummyPromise$1.then = dummyPromise$1['catch'] = function () {
  // NOTE 这里用了剪头函数 不能用`return this`
  return dummyPromise$1
};

/**
 * 判断是否是IE8~11, 不包含Edge
 * @returns {boolean}
 * @note IE11下 window.ActiveXObject的值很怪异, 所以需要追加 'ActiveXObject' in window 来判断
 */
var isIE = hasWindow && (!!window.ActiveXObject || 'ActiveXObject' in window);

function noop(v) {
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
function redo(fn) {
  return function () {
    var args = arguments;
    var ret = fn(args[0], args[1]);
    for (var i = 2, l = args.length; i < l; i++) {
      ret = fn(ret, args[i]);
    }
    return ret
  }
}
// const random = Math.random
// const floor = Math.floor
// export function makeRandom() {
//   return floor(random() * 9e9)
// }

var absoluteUrlReg = /^(https?:)?\/\//;
function isAbsoluteUrl(url) {
  return !!url.match(absoluteUrlReg)
}

var relativeUrlReg = /^[\.\/]/;
function isRelativeUrl(url) {
  return !!url.match(relativeUrlReg)
}

var BOOLEAN = 'boolean';
function isBoolean$1(v) {
  return typeof v === BOOLEAN
}

var STRING = 'string';
function isString$1(v) {
  return typeof v === STRING
}

var FUNCTION = 'function';
function isFunction$1(v) {
  return typeof v === FUNCTION
}

function runAsFn$1(v) {
  return isFunction$1(v) ? v() : v
}

var NUMBER = 'number';
function isNumber(v) {
  return !isNaN(v) && typeof v === NUMBER
}

var OBJECT = 'object';
function isObject(v) {
  return typeof v === OBJECT && v !== NULL$1
}

function isWindow(v) {
  return v !== NULL$1 && v === v.window
}

// 参考了zepto
function isPlainObject$1(v) {
  return v !== NULL$1 && isObject(v) && !isWindow(v) && Object.getPrototypeOf(v) === Object.prototype
}

function isEmptyObject$1(v) {
  var count = 0;
  for (var i in v) {
    if (v.hasOwnProperty(i)) {
      count++;
    }
  }
  return count === 0
}

function isArray$1(v) {
  return toString.call(v) === ARRAY_TYPE
}

/**
 * 判断是否跨域
 * @type {Element}
 * @note 需要特别关注IE8~11的行为是不一样的!!!
 */
var originA;
if(doc) {
  originA = doc.createElement('a');
  originA.href = location.href;
}
function isCrossDomain(url) {

  var requestA = doc.createElement('a');
  requestA.href = url;

  // 如果`url`的值不包含`protocol`和`host`(比如相对路径), 在标准浏览器下, 会自定补全`requestA`对象的`protocal`和`host`属性.
  // 但在IE8~11下, 不会自动补全. 即`requestA.protocol`和`requestA.host`的值都是空的.
  // 在IE11的不同小版本下, requestA.protocol的值有的是`:`, 有的是空字符串, 太奇葩啦!
  {
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
function _extend(receiver, supplier, deepCopy) {
  if ( receiver === void 0 ) receiver = {};
  if ( supplier === void 0 ) supplier = {};
  if ( deepCopy === void 0 ) deepCopy = FALSE$1;

  for (var key in supplier) {
    // `supplier`中不是未定义的键 都可以执行扩展
    if (supplier.hasOwnProperty(key) && supplier[key] !== undefined) {
      if (deepCopy === TRUE$1) {
        if (isArray$1(supplier[key])) {
          receiver[key] = [].concat(supplier[key]);
        } else if (isPlainObject$1(supplier[key])) {
          receiver[key] = extend$1({}, supplier[key]);
        } else {
          receiver[key] = supplier[key];
        }
      } else {
        receiver[key] = supplier[key];
      }
    }
  }
  return receiver
}
/**
 * FormData对象合并
 * @param  {FormData || Object} fd1
 * @param  {FormData || Object} fd2
 * @return {FormData} 合并后的FormData
 */
function _fdAssign(fd1, fd2) {
  if ( fd1 === void 0 ) fd1 = {};
  if ( fd2 === void 0 ) fd2 = {};

  var formData = new FormData;
  var loop = function(fd) {
    if(fd.constructor === FormData) {
      var iterator = fd.entries();
      var s = iterator.next();
      while(!s.done) {
        formData.set(s.value[0], s.value[1]);
        s = iterator.next();
      }
    }else {
      for(var key in fd) {
        formData.set(key, fd[key]);
      }
    }
  };
  loop(fd1);
  loop(fd2);
  return formData;
}
var extend$1 = redo(_extend);
var fdAssign$1 = redo(_fdAssign);
// export function likeArray(v) {
//   if (!v) {
//     return false
//   }
//   return typeof v.length === NUMBER
// }

/**
 *
 * @param v {Array|Object} 遍历目标对象
 * @param fn {Function} 遍历器 会被传入两个参数, 分别是`value`和`key`
 */
function each(v, fn) {
  var i, l;
  if (isArray$1(v)) {
    for (i = 0, l = v.length; i < l; i++) {
      if (fn.call(v[i], v[i], i) === false) { return }
    }
  } else {
    for (i in v) {
      if (fn.call(v[i], v[i], i) === false) { return }
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
function sortPlainObjectKey$1(obj) {
  var clone = {};
  var key;
  var keyArray = [];
  for (key in obj) {
    if (obj.hasOwnProperty(key)) {
      keyArray.push(key);
      if (isPlainObject$1(obj[key])) {
        obj[key] = sortPlainObjectKey$1(obj[key]);
      }
    }
  }
  keyArray.sort();
  for (var i=0, l=keyArray.length; i<l; i++) {
    clone[keyArray[i]] = obj[keyArray[i]];
  }
  return clone
}

function serialize(params, obj, traditional, scope) {
  var type, array = isArray$1(obj), hash = isPlainObject$1(obj);
  each(obj, function(value, key) {
    type = toString.call(value);
    if (scope) {
      key = traditional ? scope : scope + '[' + (hash || type === OBJECT_TYPE || type === ARRAY_TYPE ? key : '') + ']';
    }

    // 递归
    if (!scope && array) {
      params.add(value.name, value.value);
    }
    // recurse into nested objects
    else if (type == ARRAY_TYPE || (!traditional && type == OBJECT_TYPE)) {
      serialize(params, value, traditional, key);
    } else {
      params.add(key, value);
    }
  });
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
function param(obj, traditional) {
  var params = [];
  params.add = function (key, value) {
    if (isFunction$1(value)) { value = value(); }
    if (value == NULL$1) { value = ''; }
    params.push(escape(key) + '=' + escape(value));
  };
  serialize(params, obj, traditional);
  return params.join('&').replace(/%20/g, '+')
}

function decodeParam(str) {
  return decodeURIComponent(str.replace(/\+/g, ' '))
}

// 给URL追加查询字符串
function appendQueryString(url, obj, urlStamp, traditional) {
  // 是否添加时间戳
  if (urlStamp) {
    obj[isBoolean$1(urlStamp) ? '_stamp' : urlStamp] = +new Date();
  }
  var queryString = param(obj, traditional);

  if (queryString) {
    return url + (~url.indexOf('?') ? '&' : '?') + queryString
  } else {
    return url
  }
}

// 随机字符串字符集
var chars = 'ABCDEFGHJKMNPQRSTWXYZabcdefhijkmnprstwxyz2345678';

// 创建随机字符串
function makeRandom$1(n) {
  if ( n === void 0 ) n = 6;

  var str = '';
  for (var i = 0; i < n; i++) {
    str += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return str
}

function makeMessage(str, obj, log) {
  if ( log === void 0 ) log = false;

  log && hasConsole$1 && console.log(str + '\n' + JSON.stringify(obj, null, 2));
  return str
}

var util = Object.freeze({
	hasWindow: hasWindow,
	hasConsole: hasConsole$1,
	doc: doc,
	escape: escape,
	NULL: NULL$1,
	TRUE: TRUE$1,
	FALSE: FALSE$1,
	UNDEFINED: UNDEFINED,
	EMPTY: EMPTY,
	dummyPromise: dummyPromise$1,
	isIE: isIE,
	noop: noop,
	redo: redo,
	isAbsoluteUrl: isAbsoluteUrl,
	isRelativeUrl: isRelativeUrl,
	isBoolean: isBoolean$1,
	isString: isString$1,
	isFunction: isFunction$1,
	runAsFn: runAsFn$1,
	isNumber: isNumber,
	isObject: isObject,
	isWindow: isWindow,
	isPlainObject: isPlainObject$1,
	isEmptyObject: isEmptyObject$1,
	isArray: isArray$1,
	isCrossDomain: isCrossDomain,
	extend: extend$1,
	fdAssign: fdAssign$1,
	each: each,
	sortPlainObjectKey: sortPlainObjectKey$1,
	serialize: serialize,
	param: param,
	decodeParam: decodeParam,
	appendQueryString: appendQueryString,
	makeRandom: makeRandom$1,
	makeMessage: makeMessage
});

var GET = 'GET';
var SCRIPT = 'script';
var XML = 'xml';
var JS0N = 'json'; // NOTE 不能使用`JSON`，这里用数字零`0`代替了字母`O`

var xhrTester = UNDEFINED !== typeof XMLHttpRequest ? new XMLHttpRequest() : {};
var hasXDR = UNDEFINED !== typeof XDomainRequest;
var fallback = hasWindow ? (!('withCredentials' in xhrTester) && hasXDR) : NULL$1;
var supportCORS = hasWindow ? (('withCredentials' in xhrTester) || hasXDR) : NULL$1;

// minetype的简写映射
// TODO 考虑是否优化
var acceptToRequestHeader = {
  // IIS returns `application/x-javascript` 但应该不需要支持
  '*':  '*/' + '*',
  script: 'text/javascript, application/javascript, application/ecmascript, application/x-ecmascript',
  json:   'application/json, text/json',
  xml:  'application/xml, text/xml',
  html:   'text/html',
  text:   'text/plain',
};

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
var setHeaders = function (xhr, options) {
  // IE下如果跨域 xhr对象是不允许设置自定义header的 也没有setRequestHeader方法
  if (!xhr.setRequestHeader) {
    return {}
  }

  var header = {
    Accept: acceptToRequestHeader[options.accept],
  };

  // 如果没有跨域 则打该标识 业界通用做法
  if (!isCrossDomain(options.url)) {
    header['X-Requested-With'] = 'XMLHttpRequest';
  }

  // 如果POST方法，没有明确指定编码方式，默认urlencoded，
  // TODO v3.x将去掉改处理！！！需要文档强调
  if (options.method === 'POST' && !header['Content-Type']) {
    header['Content-Type'] = 'application/x-www-form-urlencoded';
  }

  extend$1(header, options.header);

  for (var key in header) {
    xhr.setRequestHeader(key, header[key]);
  }

  return header
};

// 绑定事件
var setEvents = function (xhr, options, isCrossDomain$$1) {

  var completeFn = function() {
    if (xhr._completed) {
      return
    }
    xhr._completed = true;
    //options.log && console.info('~loadend')
    options.complete();
    xhr._aborted = null;
    delete xhr._aborted;
  };

  var onLoadFn = function() {

    if (xhr._completed) {
      return
    }

    var data = xhr.responseText;

    switch (options.accept) {
      case JS0N:
        try {
          data = JSON.parse(data);
        } catch (e) {
          console.warn('The response can NOT be parsed to JSON object.', data);
        }
        break
      case SCRIPT:
        (1, eval)(data);
        break
      case XML:
        data = xhr.responseXML;
        break
      default:
        break
    }

    options.success(data, xhr);
    //C.log('complete after load')
    completeFn();
  };

  var onErrorFn = function () {
    if (xhr._completed) {
      return
    }
    options.error(xhr.status, xhr);
    //C.log('complete after error')
    completeFn();
  };

  var abortFn = function() {
    if (xhr._completed) {
      return
    }
    options.abort();
    completeFn();
  };

  // 如果是IE8/9 且 如果是跨域请求
  if (fallback && isCrossDomain$$1) {

    // `XDomainRequest`实例是没有`onreadystatechange`方法的!!!
    xhr.onload = onLoadFn;
  } else {
    // readyState value:
    //   0: UNSET 未初始化
    //   1: OPENED
    //   2: HEADERS_RECEIVED
    //   3: LOADING
    //   4: DONE 此时触发load事件
    xhr.onreadystatechange = function () {

      if (xhr._completed) {
        return
      }
      //console.log('xhr.readyState', xhr.readyState, 'xhr.status', xhr.status, xhr)
      if (xhr.readyState == 4) {

        // 如果请求被取消(aborted) 则`xhr.status`会是0 所以不会进入`success`回调
        if ((xhr.status >= 200 && xhr.status < 300) || xhr.status === 304) {
          onLoadFn();
        } else {
          // 因为取消时会先触发原生的`onreadystatechange`响应，后触发`onAbort`回调，所以
          // 如果请求被取消(aborted) 则`xhr.status`会是0 程序走到这里的时候，`xhr._aborted`状态是false，
          // 需要排除，不应该触发`error`回调
          !xhr._aborted && onErrorFn();
        }
      }
    };
  }

  xhr.onerror = onErrorFn;

  // 重写`abort`方法
  var originAbort = xhr.abort;
  xhr.abort = function() {
    if (xhr._completed) {
      return
    }
    xhr._aborted = true;
    // NOTE 直接调用`originAbort()`时 浏览器会报 `Illegal invocation` 错误

    // 非IE浏览器才会真正的调用原生`abort`
    // https://github.com/jias/natty-fetch/issues/27
    if (!isIE) {
      originAbort.call(xhr);
    }

    // `XDomainRequest`对象实例居然没有`onabort`方法
    abortFn();
  };

  // IE9 bug
  xhr.onprogress = xhr.ontimeout = noop;
};

var defaultOptions = {
  url: '',
  mark: {},
  urlMark: TRUE$1,
  method: GET,
  accept: '*',
  data: NULL$1,
  header: {},
  withCredentials: NULL$1, // 根据`url`是否跨域决定默认值. 如果显式配置该值(必须是布尔值), 则个使用配置值
  urlStamp: TRUE$1,
  success: noop,
  error: noop,
  complete: noop,
  abort: noop,
  query: {},
  log: FALSE$1,
  traditional: FALSE$1,
  // postDataFormat: 'FORM'
};

function ajax(options) {

  options = extend$1({}, defaultOptions, options);

  // 是否跨域
  var isCD = isCrossDomain(options.url);

  // H5版本
  // `IE10+`和标准浏览器的`XMLHttpRequest`都原生支持跨域
  var xhr = new XMLHttpRequest();

  // `IE8/9`使用`XDomainRequest`来实现跨域, `IE10+`的`XMLHttpRequest`对象直接支持跨域
  if (fallback && isCD) {
    // NOTE `XDomainRequest`仅支持`GET`和`POST`两个方法
    // 支持的事件有: onerror, onload, onprogress, ontimeout, 注意没有`onloadend`
    // https://developer.mozilla.org/zh-CN/docs/Web/API/XDomainRequest
    xhr = new XDomainRequest();
  }

  // 再高级的浏览器都有低级错误! 已经不能在相信了!
  // MAC OSX Yosemite Safari上的低级错误: 一次`ajax`请求的`loadend`事件完成之后,
  // 如果执行`xhr.abort()`, 居然还能触发一遍`abort`和`loadend`事件!!!
  // `_completed`标识一次完整的请求是否结束, 如果已结束, 则不再触发任何事件
  xhr._completed = FALSE$1;

  setEvents(xhr, options, isCD);

  xhr.open(options.method, appendQueryString(
    options.url,
    extend$1({}, options.urlMark ? options.mark : {}, options.method === GET ? options.data : {}, options.query),
    options.urlStamp,
    options.traditional
  ));

  // NOTE 生产环境的Server端, `Access-Control-Allow-Origin`的值一定不要配置成`*`!!! 而且`Access-Control-Allow-Credentials`应该是true!!!
  // NOTE 如果Server端的`responseHeader`配置了`Access-Control-Allow-Origin`的值是通配符`*` 则前端`withCredentials`是不能使用true值的
  // NOTE 如果Client端`withCredentials`使用了true值 则后端`responseHeader`中必须配置`Access-Control-Allow-Credentials`是true
  if (!fallback) {
    xhr.withCredentials = isBoolean$1(options.withCredentials) ? options.withCredentials : isCD;
  }
  
  // 设置requestHeader
  var header = setHeaders(xhr, options);

  var data;

  if(options.data.constructor === FormData) {
    data = options.data;
  }else if (header['Content-Type'] && ~header['Content-Type'].indexOf('application/x-www-form-urlencoded')) {
    data = param(options.data, options.traditional);
  } else {
    data = JSON.stringify(options.data);
  }
  
  // 文档建议说 send方法如果不发送请求体数据 则null参数在某些浏览器上是必须的
  xhr.send(options.method === GET ? NULL$1 : data === NULL$1 ? NULL$1 : data);

  return xhr
}

ajax.fallback = fallback;
ajax.supportCORS = supportCORS;

var win = hasWindow ? window : NULL$1;
var doc$1 = hasWindow ? document : NULL$1;
var SCRIPT$1 = 'script';
var IE8 = hasWindow ? navigator.userAgent.indexOf('MSIE 8.0') > -1 : FALSE$1;

var removeScript = function (script) {
  if (IE8 && script.readyState) {
    script.onreadystatechange = NULL$1;
  } else {
    script.onerror = NULL$1;
  }
  script.parentNode.removeChild(script);
  script = NULL$1;
};
var head = NULL$1;
var insertScript = function (url, options) {
  var script = doc$1.createElement(SCRIPT$1);
  script.type = 'text/javascript';
  script.src = url;
  script.async = TRUE$1;

  if (options.crossOrigin) {
    script.crossorigin = true;
  }

  // 绑定`error`事件
  if (IE8 && script.readyState) {
    script.onreadystatechange = function () {
      // IE8下script标签不支持`onerror`事件, 通过JSONP的执行顺序来模拟触发:
      // 1:   script.readyState状态值为`loading`
      // 2.1: 如果脚本加载成功, 浏览器就会先执行脚本内容, 即调用JSONP函数, 如: `jsonp2327905726()`,
      //    (该函数执行之后会立即被设置成`null`值, 用于第3步的判断), JSONP函数执行完成后, 会进入第3步.
      // 2.2: 如果脚本加载不成功, 也会进入第3步.
      // 3:   无论脚本是否加载成功, `script.readyState`状态值都变化为`loaded`,
      //    如果加载不成功, 可以通过判断JSONP函数一定是存在, 即可模拟`error`回调了.
      if (script.readyState === 'loaded' && win[options.callbackName]) {
        win[options.callbackName] = NULL$1;
        options.error();
        options.complete();
      }
    };
  } else {
    script.onerror = function (e) {
      win[options.callbackName] = NULL$1;
      options.error(e);
      options.complete();
    };
  }

  head = head || doc$1.getElementsByTagName('head')[0];
  head.insertBefore(script, head.firstChild);
  return script
};

var defaultOptions$1 = {
  url: '',
  mark: {},
  urlMark: TRUE$1,
  data: {},
  urlStamp: TRUE$1,
  success: noop,
  error: noop,
  complete: noop,
  log: FALSE$1,
  flag: 'callback',
  callbackName: 'jsonp{id}',
  traditional: FALSE$1,
  crossOrigin: FALSE$1,
};

function jsonp(options) {

  options = extend$1({}, defaultOptions$1, options);

  var callbackName = options.callbackName = options.callbackName.replace(/\{id\}/, makeRandom$1(6));

  var originComplete = options.complete;

  var script;

  // 二次包装的`complete`回调
  options.complete = function () {
    // 删除脚本
    removeScript(script);
    originComplete();
  };

  // 成功回调
  win[callbackName] = function (data) {
    // JSONP函数需要立即删除 用于`IE8`判断是否触发`onerror`
    win[callbackName] = NULL$1;
    options.success(data);
    options.complete();
  };

  // 生成`url`
  var obj;
  var url = appendQueryString(
    options.url,
    extend$1(( obj = {}, obj[options.flag] = callbackName, obj ), options.urlMark ? options.mark : {}, options.data),
    options.urlStamp,
    options.traditional
  );

  // 插入脚本
  script = insertScript(url, options);
  
  return {
    abort: function abort() {
      // 覆盖成功回调为无数据处理版本
      win[callbackName] = function () {
        win[callbackName] = NULL$1;
      };
      removeScript(script);
    },
  }
}

var Request = function Request(apiInstance) {
  var _path = apiInstance._path;
  var config = apiInstance.config;
  var api = apiInstance.api;
  var contextId = apiInstance.contextId;

  this._apiInstance = apiInstance;

  // 单次请求实例的id，用于从`api`实例的`_pendingList`中删除请求实例
  this._rid = [contextId, _path, makeRandom$1(6)].join('-');

  this._path = _path;
  this.config = config;
  this.storage = api.storage;
  this.contextId = contextId;

  // 工作状态
  this.pending = FALSE$1;
  this._requester = NULL$1;
};

// 发起网络请求 返回一个Promise实例
Request.prototype.send = function send (ref) {
    var this$1 = this;
    var vars = ref.vars;
    var onSuccess = ref.onSuccess;
    var onError = ref.onError;
    var onComplete = ref.onComplete;


  this.vars = vars;

  this.onSuccess = onSuccess;
  this.onError = onError;
  this.onComplete = onComplete;

  var ref$1 = this;
    var config = ref$1.config;

  // 调用 willFetch 钩子
  config.willFetch(vars, config, 'remote');

  // 等待状态在此处开启 在相应的`requester`的`complete`回调中关闭
  this.pending = TRUE$1;

  // 创建请求实例requester
  if (config.customRequest) {
    // 使用私有的request方法
    this._requester = config.customRequest(vars, config, function (isSuccess, response) {
      // 当isSuccess为false时，response的结构应该是 {message: 'xxx'}
      isSuccess ? this$1.processResponse(response) : this$1.onError(response);
    });
  } else if (config.jsonp) {
    this._requester = this.jsonp();
  } else {
    this._requester = this.ajax();
  }

  vars.requester = this._requester;

  // 超时处理
  if (0 !== config.timeout) {
    setTimeout(function () {
      if (this$1.pending) {
        // 取消请求
        this$1.abort();

        var error = {
          timeout: TRUE$1,
          message: makeMessage('Request Timeout', {
            context: this$1.contextId,
            api: ("" + (vars.api)),
            timeout: config.timeout + 'ms',
          }, config.log),
        };

        this$1.onError(error);
      }
    }, config.timeout);
  }
};

// 处理结构化的响应数据
Request.prototype.processResponse = function processResponse (response) {
  var ref = this;
    var config = ref.config;
    var vars = ref.vars;
  // 调用 didFetch 钩子函数
  config.didFetch(vars, config);

  // 非标准格式数据的预处理
  response = config.fit(response, vars);

  if (response.success) {
    // 数据处理
    var content = config.process(response.content, vars);
    this.onSuccess(content);
  } else {
    var error = extend$1({
      message: 'Error in request: ' + this._path,
    }, response.error);
    // NOTE response是只读的对象!!!
    this.onError(error);
  }
};

// 获取正式接口的完整`url`
// @param config {Object}
Request.prototype.getFinalUrl = function getFinalUrl () {
  var ref = this;
    var config = ref.config;
    var vars = ref.vars;
  var url = config.mock ? config.mockUrl : config.url;
  if (!url) { return EMPTY }
  var prefixKey = config.mock ? 'mockUrlPrefix' : 'urlPrefix';
  var suffixKey = config.mock ? 'mockUrlSuffix' : 'urlSuffix';
  var prefix = config[prefixKey] && !isAbsoluteUrl(url) && !isRelativeUrl(url) ? config[prefixKey] : EMPTY;
  var suffix = config[suffixKey] ? config[suffixKey]: EMPTY;

  url = prefix + url + suffix;

  // 如果是RESTFul API，填充所有的':x'参数
  if (config.rest) {
    var restData = vars.data;
    for (var param$$1 in restData) {
      if (restData.hasOwnProperty(param$$1) && ~param$$1.indexOf(':')) {
        url = url.replace(new RegExp('\\/' + param$$1), '/' + restData[param$$1]);
        delete restData[param$$1];
      }
    }
  }

  return url
};

// 发起Ajax请求
// @returns {Object} xhr对象实例
Request.prototype.ajax = function ajax$1 () {
    var this$1 = this;

  var ref = this;
    var config = ref.config;
    var vars = ref.vars;

  var url = this.getFinalUrl();

  return ajax({
    traditional: config.traditional,
    urlStamp: config.urlStamp,
    mark: vars.mark,
    urlMark: config.urlMark,
    log: config.log,
    url: url,
    method: config.method,
    data: vars.data,
    header: config.header,
    query: config.query,
    withCredentials: config.withCredentials,
    // 强制约定json
    accept: 'json',
    success: function (response) {
      this$1.processResponse(response);
    },
    error: function (status) {
      // 如果跨域使用了自定义的header，且服务端没有配置允许对应的header，此处status为0，目前无法处理。
      var error = {
        status: status,
        message: makeMessage(("Request Error(Status: " + status + ")"), {
          status: status,
          context: this$1.contextId,
          api: vars.api,
          url: url,
        }, config.log),
      };
      this$1.onError(error);
    },
    complete: function () {
      this$1.onComplete();
      this$1.pending = FALSE$1;
      this$1._requester = NULL$1;
    },
  })
};

// 发起jsonp请求
// @returns {Object} 带有abort方法的对象
Request.prototype.jsonp = function jsonp$1 () {
    var this$1 = this;

  var ref = this;
    var config = ref.config;
    var vars = ref.vars;

  var url = this.getFinalUrl();

  return jsonp({
    traditional: config.traditional,
    log: config.log,
    mark: vars.mark,
    urlMark: config.urlMark,
    url: url,
    data: vars.data,
    urlStamp: config.urlStamp,
    flag: config.jsonpFlag,
    callbackName: config.jsonpCallbackName,
    crossOrigin: config.jsonpCrossOrigin,
    success: function (response) {
      this$1.processResponse(response);
    },
    error: function () {
      var error = {
        message: makeMessage('Request Error(Not Accessable JSONP)', {
          context: this$1.contextId,
          api: vars.api,
          url: url,
        }, config.log),
      };
      this$1.onError(error);
    },
    complete: function () {
      this$1.onComplete();
      this$1.pending = FALSE$1;
      this$1._requester = NULL$1;
    },
  })
};

// 取消请求
Request.prototype.abort = function abort () {
  if (this._requester) {
    this._requester.abort();
  }
};

var Defer = function Defer(Promise) {
  var t = this;
  t.promise = new Promise(function (resolve, reject) {
    t._resolve = resolve;
    t._reject = reject;
  });
};

Defer.prototype.resolve = function resolve (value) {
  this._resolve.call(this.promise, value);
};

Defer.prototype.reject = function reject (reason) {
  this._reject.call(this.promise, reason);
};

var PREFIX = '_';
function rename (type) {
  return PREFIX + type
}

var event = {
  on: function () {
    var this$1 = this;

    var args = arguments;
    if (typeof args[0] === 'string' && typeof args[1] === 'function') {
      var type = rename(args[0]);
      this[type]  = this[type] || [];
      this[type].push(args[1]);
    } else if (typeof args[0] === 'object') {
      var hash = args[0];
      for (var i in hash) {
        if (hash.hasOwnProperty(i)) {
          this$1.on(i, hash[i]);
        }
      }
    }
  },
  off: function (type, fn) {
    type = rename(type);
    if (!fn) {
      delete this[type];
    } else {
      var fns = this[type];
      fns.splice(fns.indexOf(fn), 1);
      if (!this[type].length) {
        delete this[type];
      }
    }
  },
  // @param {array} args
  fire: function (type, args, context) {
    var this$1 = this;

    var fns = this[rename(type)];
    if (!fns) { return 'NO_EVENT' }
    for (var i=0, l=fns.length; i<l; i++) {
      fns[i].apply(context || this$1, [].concat(args));
    }
  },
  hasEvent: function (type) {
    return !!this[rename(type)]
  },
};

/**
 * 创建轮询支持
 * @param api {Function} 需要轮询的函数
 */
var pluginLoop = function() {
  var ref = this;
  var api = ref.api;

  api.loop = function (options, resolveFn, rejectFn) {
    if ( resolveFn === void 0 ) resolveFn = noop;
    if ( rejectFn === void 0 ) rejectFn = noop;

    if (!options.duration || !isNumber(options.duration)) {
      throw new Error('Illegal `duration` value for `startLoop` method.')
    }

    var loopTimer = NULL$1;

    var stop = function () {
      clearTimeout(loopTimer);
      loopTimer = NULL$1;
      stop.looping = FALSE$1;
    };

    var sleepAndRequest = function () {
      stop.looping = TRUE$1;
      api(options.data).then(resolveFn, rejectFn);
      loopTimer = setTimeout(function () {
        sleepAndRequest();
      }, options.duration);
    };

    sleepAndRequest();
    
    return stop
  };
};

var pluginSoon = function() {
  var this$1 = this;

  var ref = this;
  var api = ref.api;
  api.soon = function (data, successFn, errorFn) {
    if ( successFn === void 0 ) successFn = noop;
    if ( errorFn === void 0 ) errorFn = noop;

    var vars = this$1.makeVars(data);

    // 先尝试用`storage`数据快速响应
    if (api.storageUseable) {

      var result = api.storage.has(vars.queryString);

      if (result.has) {
        successFn({
          fromStorage: TRUE$1,
          content: result.value,
        });
      }
    }

    // 再发起网络请求(内部会更新`storage`)
    this$1.send(vars).then(function (content) {
      successFn({
        fromStorage: FALSE$1,
        content: content,
      });
    }, function (error) {
      errorFn(error);
    })['catch'](function (e) {
      hasConsole$1 && console.error(e);
    });
  };
};

var config = {

  // 默认参数
  data: {},

  // 请求完成钩子函数
  didFetch: noop,

  // 预处理回调
  fit: noop,

  // 自定义header, 只针对非跨域的ajax有效, 跨域时将忽略自定义header
  header: {},

  // 是否忽律接口自身的并发请求
  ignoreSelfConcurrent: FALSE$1,

  // 有两种格式配置`jsonp`的值
  // {Boolean}
  // {Array} eg: [TRUE, 'cb', 'j{id}']
  jsonp: FALSE$1,

  // 是否在`jsonp`的`script`的标签上加`crossorigin`属性
  jsonpCrossOrigin: FALSE$1,

  // 是否开启log信息
  log: FALSE$1,

  // 非GET方式对JSONP无效
  method: 'GET',

  // 是否开启mock模式
  mock: FALSE$1,

  mockUrl: EMPTY,

  // 全局`mockUrl`前缀
  mockUrlPrefix: EMPTY,

  // 全局`mockUrl`后缀
  mockUrlSuffix: EMPTY,

  // 成功回调
  process: noop,

  // 私有Promise对象, 如果不想用浏览器原生的Promise对象的话
  Promise: hasWindow ? window.Promise : NULL$1,

  // 是否是rest风格
  rest: FALSE$1,

  // 默认不执行重试
  retry: 0,

  query: {},

  // 使用已有的request方法
  customRequest: NULL$1,

  // 0表示不启动超时处理
  timeout: 0,

  // http://zeptojs.com/#$.param
  traditional: FALSE$1,

  url: EMPTY,

  // 全局`url`前缀
  urlPrefix: EMPTY,

  // 是否在`url`上添加辅助开发的标记，如`_api=xxx&_mock=false`
  urlMark: true,

  // 是否在`url`上添加时间戳，如`_stamp=xxx`，用于避免浏览器的304缓存
  urlStamp: TRUE$1,

  // 全局`url`后缀
  urlSuffix: EMPTY,

  // TODO 文档中没有暴露
  withCredentials: NULL$1,

  // 请求之前调用的钩子函数
  willFetch: noop,

  // 扩展: storage
  storage: FALSE$1,

  // 插件，已内置两种
  // plugins: [
  //   nattyFetch.plugin.loop
  //   nattyFetch.plugin.soon
  // ]
  plugins: FALSE$1,
};

var extend$$1 = extend$1;
var fdAssign$$1 = fdAssign$1;
var runAsFn$$1 = runAsFn$1;
var isBoolean$$1 = isBoolean$1;
var isArray$$1 = isArray$1;
var isFunction$$1 = isFunction$1;
var sortPlainObjectKey$$1 = sortPlainObjectKey$1;
var isEmptyObject$$1 = isEmptyObject$1;
var isPlainObject$$1 = isPlainObject$1;
var dummyPromise$$1 = dummyPromise$1;
var isString$$1 = isString$1;
var NULL$$1 = NULL$1;
var TRUE$$1 = TRUE$1;
var FALSE$$1 = FALSE$1;
var hasConsole$$1 = hasConsole$1;
var makeRandom$$1 = makeRandom$1;

// 内置插件
// 全局默认配置
// 随`setGlobal`方法而变化的运行时全局配置
var runtimeGlobalConfig = extend$$1({}, config);

var API = function API(path, options, contextConfig, contextId) {
  var this$1 = this;

  this._path = path;

  this.contextConfig = contextConfig;

  this.contextId = contextId;

  // 进行中的请求列队
  this._pendingList = [];

  this.storage = NULL$$1;

  var config$$1 = this.config = this.processAPIOptions(options);

  // `api`的实现
  // @param data {Object|Function}
  // @returns {Object} Promise Object
  this.api = function (data) {

    // 处理列队中的请求
    if (this$1._pendingList.length) {
      // 是否忽略自身的并发请求
      if (config$$1.ignoreSelfConcurrent) {
        return dummyPromise$$1
      }
      // 是否取消上一个请求
      if (config$$1.overrideSelfConcurrent) {
        this$1._pendingList[0].abort();
      }
    }
    var vars = this$1.makeVars(data);

    if (this$1.api.storageUseable) {
      var result = this$1.api.storage.has(vars.queryString);
      if (result.has) {
        return new config$$1.Promise(function (resolve) {
          resolve(result.value);
        })
      } else {
        return config$$1.retry === 0 ? this$1.send(vars) : this$1.sendWithRetry(vars)
      }
    } else {
      return config$$1.retry === 0 ? this$1.send(vars) : this$1.sendWithRetry(vars)
    }
  };

  this.api.config = config$$1;

  this.api.hasPending = function () {
    return !!this$1._pendingList.length
  };

  // 要删除的方法，这个地方是`v2.3.0`版本之前都存在的设计错误，因为：
  // io.get().then(...) 发送第一次
  // io.get().then(...) 发送第二次
  // io.get.abort() 取消哪一次? 并发情况复杂的业务，结果不明确。
  // 当前的解决方式是取消所有，不完美
  this.api.abort = function () {
    hasConsole$$1 && console.warn('`abort` method will be deleted later!');
    for (var i=0, l=this$1._pendingList.length; i<l; i++) {
      this$1._pendingList[i].abort();
    }
  };

  this.initStorage();

  // 启动插件
  var plugins = isArray$$1(config$$1.plugins) ? config$$1.plugins : [];

  for (var i=0, l=plugins.length; i<l; i++) {
    isFunction$$1(plugins[i]) && plugins[i].call(this$1, this$1);
  }
};

// @param {Object} 一次独立的请求数据
API.prototype.makeVars = function makeVars (data) {
  var ref = this;
    var config$$1 = ref.config;
  // 每次请求私有的相关数据
  var vars = {
    // `url`中的标记
    mark: {
      _api: this._path,
      _mock: config$$1.mock,
    },
    // 此api是定义接口时的多层级命名路径(如：'foo.bar.getList')，不是发起请求时的url地址
    api: this._path,
    mock: config$$1.mock,
    // 上下文id值，如果在调用nattyFetch.context方法时没有指定上下文的名称，默认采用c0，c1
    contextId: this.contextId,
  };

  // `data`必须在请求发生时实时创建
  // 另外，将数据参数存在私有标记中, 方便API的`process`方法内部使用
  data = ((data||{}).constructor === FormData || (config$$1.data||{}).constructor === FormData) ? fdAssign$$1(runAsFn$$1(config$$1.data), runAsFn$$1(data))
    : extend$$1({}, runAsFn$$1(config$$1.data), runAsFn$$1(data));

  // 承载请求参数数据
  vars.data = data;

  // 根据`data`创建`storage`查询用的`key`
  if (this.api.storageUseable) {
    vars.queryString = isEmptyObject$$1(data) ? 'no-query-string' : JSON.stringify(sortPlainObjectKey$$1(data));
  }

  return vars
};

// 发送真正的网络请求
API.prototype.send = function send (vars) {
    var this$1 = this;

  var ref = this;
    var config$$1 = ref.config;

  // 每次请求都创建一个请求实例
  var request = new Request(this);

  this._pendingList.push(request);

  var defer = new Defer(config$$1.Promise);

  request.send({
    vars: vars,
    onSuccess: function (content) {
      if (this$1.api.storageUseable) {
        this$1.api.storage.set(vars.queryString, content);
      }
      defer.resolve(content);
      event.fire('g.resolve', [content, config$$1], config$$1);
      event.fire(this$1.contextId + '.resolve', [content, config$$1], config$$1);
    },
    onError: function (error) {
      defer.reject(error);
      event.fire('g.reject', [error, config$$1, vars], config$$1);
      event.fire(this$1.contextId + '.reject', [error, config$$1, vars], config$$1);
    },
    onComplete: function () {
      var indexToRemove;
      for (var i=0, l=this$1._pendingList.length; i<l; i++) {
        if (this$1._pendingList[i] === request) {
          indexToRemove = i;
          break
        }
      }
      indexToRemove !== undefined && this$1._pendingList.splice(indexToRemove, 1);
    },
  });

  return defer.promise
};

API.prototype.sendWithRetry = function sendWithRetry (vars) {
    var this$1 = this;

  var ref = this;
    var config$$1 = ref.config;

  return new config$$1.Promise(function (resolve, reject) {

    var retryTime = 0;
    var sendOneTime = function () {
      // 更新的重试次数
      vars.mark._retryTime = retryTime;
      this$1.send(vars).then(function (content) {
        resolve(content);
      }, function (error) {
        if (retryTime === config$$1.retry) {
          reject(error);
        } else {
          retryTime++;
          sendOneTime();
        }
      });
    };
    sendOneTime();
  })
};

// 处理API的配置
// @param options {Object}
API.prototype.processAPIOptions = function processAPIOptions (options) {

  // 插件是不能覆盖的, 应该追加
  var plugins = [].concat(this.contextConfig.plugins || [], options.plugins || []);

  var config$$1 = extend$$1({}, this.contextConfig, options, {
    plugins: plugins,
  });

  // 按照[boolean, callbackKeyWord, callbackFunctionName]格式处理
  if (isArray$$1(options.jsonp)) {
    config$$1.jsonp = isBoolean$$1(options.jsonp[0]) ? options.jsonp[0] : FALSE$$1;
    // 这个参数只用于jsonp
    if (config$$1.jsonp) {
      config$$1.jsonpFlag = options.jsonp[1];
      config$$1.jsonpCallbackName = options.jsonp[2];
    }
  }

  // 配置自动增强 如果`url`的值有`.jsonp`结尾 则认为是`jsonp`请求
  // NOTE jsonp是描述正式接口的 不影响mock接口!!!
  if (!config$$1.mock && !!config$$1.url.match(/\.jsonp(\?.*)?$/)) {
    config$$1.jsonp = TRUE$$1;
  }

  return config$$1
};

// 初始化缓存对象
API.prototype.initStorage = function initStorage () {
  var ref = this;
    var config$$1 = ref.config;

  // 简易开启缓存的写法
  if (config$$1.storage === TRUE$$1) {
    config$$1.storage = {
      type: 'variable',
    };
  }

  // 综合判断缓存是不是可以启用
  this.api.storageUseable = isPlainObject$$1(config$$1.storage)
    && (config$$1.method === 'GET' || config$$1.jsonp)
    && (
      nattyStorage.supportStorage
      && (
        ['localStorage', 'sessionStorage'].indexOf(config$$1.storage.type) > -1
        || config$$1.storage.type === 'variable'
      )
    );

  // 创建缓存实例
  if (this.api.storageUseable) {
    // 当使用`localStorage`时, 强制指定`key`值。如果没指定, 抛错!
    // 当使用`variable`或`sessionStorage`时, 如果没指定`key`, 则自动生成内部`key`
    // !!!为什么在使用`localStorage`时必须指定`key`值???
    // !!!因为当key发生变化时, `localStorage`很容易产生死数据, 必须强制开发者有意识的去维护`key`值
    if (config$$1.storage.type === 'localStorage') {
      if (!config$$1.storage.hasOwnProperty('key') || !config$$1.storage.key) {
        throw new Error('`key` is required when `storage.type` is `localStorage`.')
      }
    } else {
      config$$1.storage.key = config$$1.storage.key || [this.contextId, this._path].join('_');
    }

    // `key`和`tag`的选择原则:
    // `key`只选用相对稳定的值, 减少因为`key`的改变而增加的残留缓存
    // 经常变化的值用于`tag`, 如一个接口在开发过程中可能使用方式不一样, 会在`jsonp`和`get`之间切换。
    this.api.storage = nattyStorage(extend$$1({}, config$$1.storage, {
      tag: [
        config$$1.storage.tag,
        config$$1.jsonp ? 'jsonp' : config$$1.method,
        config$$1.url,
      ].join('_'), // 使用者的`tag`和内部的`tag`, 要同时生效
    }));
  }
};

var context = function (contextId, options) {
  if (isString$$1(contextId)) {
    options = options || {};
  } else {
    options = contextId || {};
    contextId = 'c' + makeRandom$$1();
  }

  var storage = nattyStorage({
    type: 'variable',
    key: contextId,
  });

  var ctx = {};

  ctx.api = storage.get();

  ctx._contextId = contextId;

  // 插件是不能覆盖的, 应该追加
  var plugins = [].concat(runtimeGlobalConfig.plugins || [], options.plugins || []);

  ctx._config = extend$$1({}, runtimeGlobalConfig, options, {
    plugins: plugins,
  });

  // 创建api
  // @param namespace {String} optional
  // @param APIs {Object} 该`namespace`下的`api`配置
  ctx.create = function(namespace, APIs) {
    var hasNamespace = arguments.length === 2 && isString$$1(namespace);

    if (!hasNamespace) {
      APIs = namespace;
    }

    for (var path in APIs) {
      if (APIs.hasOwnProperty(path)) {
        storage.set(
          hasNamespace ? namespace + '.' + path : path,
          new API(
            hasNamespace ? namespace + '.' + path : path,
            runAsFn$$1(APIs[path]),
            ctx._config,
            contextId
          ).api
        );
      }
    }

    ctx.api = storage.get();
  };

  // 绑定上下文事件
  ctx.on = function(name, fn) {
    if (!isFunction$$1(fn)) { return }
    event.on(ctx._contextId + '.' + name, fn);
    return ctx
  };

  return ctx
};

var nattyFetch = {};

// 简易接口
// @param options
nattyFetch.create = function (options) {
  return new API('nattyFetch', runAsFn$$1(options), config, 'global').api
};

extend$$1(nattyFetch, {
  onlyForModern: !true, // eslint-disable-line
  version: '2.5.5',
  _util: util,
  _event: event,
  _ajax: ajax,
  context: context,

  // 执行全局配置
  // @param options
  setGlobal: function setGlobal(options) {
    runtimeGlobalConfig = extend$$1({}, config, options);
    return this
  },

  // 获取全局配置
  // @param property {String} optional
  // @returns {*}
  getGlobal: function getGlobal(property) {
    return property ? runtimeGlobalConfig[property] : runtimeGlobalConfig
  },

  // 绑定全局事件
  on: function on(name, fn) {
    if (!isFunction$$1(fn)) { return }
    event.on('g.' + name, fn);
    return this
  },

  // 插件名称空间
  plugin: {
    loop: pluginLoop,
    soon: pluginSoon,
  },
});

// 内部直接将运行时的全局配置初始化到默认值
nattyFetch.setGlobal(config);

return nattyFetch;

})));
//# sourceMappingURL=natty-fetch.pc.js.map
