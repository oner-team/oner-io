/**
 * ref https://xhr.spec.whatwg.org
 * ref https://developer.mozilla.org/en-US/docs/Web/API/XMLHttpRequest
 * ref https://developer.mozilla.org/en-US/docs/Web/API/XMLHttpRequest/Using_XMLHttpRequest
 * ref https://developer.mozilla.org/en-US/docs/Web/HTTP/Access_control_CORS
 * ref https://hacks.mozilla.org/2009/07/cross-site-xmlhttprequest-with-cors/
 * ref http://www.html5rocks.com/en/tutorials/cors/
 * @link http://enable-cors.org/index.html
 */
const {extend, appendQueryString, noop, isCrossDomain} = require('./util');

const doc = document;
const FALSE = false;
const UNDEFINED = undefined;
const NULL = null;
const GET = 'GET';
const SCRIPT = 'script';
const XML = 'xml';
const HTML = 'html';
const TEXT = 'text';
const JS0N = 'json'; // NOTE 不能使用`JSON`，这里用数字零`0`代替了字母`O`

const APPLICATION_JSON = 'application/json';
const TEXT_HTML = 'text/html';

let xhrTester = new XMLHttpRequest();
let hasXDR = typeof XDomainRequest != UNDEFINED;
let fallback = (!('withCredentials' in xhrTester) && hasXDR);
let supportCORS = ('withCredentials' in xhrTester) || hasXDR;

// minetype的简写映射
// TODO 考虑是否优化
let acceptToRequestHeader = {
    // IIS returns `application/x-javascript`
    script: 'text/javascript, application/javascript, application/x-javascript',
    json:   APPLICATION_JSON,
    xml:    'application/xml, text/xml',
    html:   TEXT_HTML,
    text:   'text/plain'
};

//let responseHeaderToAccept = {
//    'application/javascript': SCRIPT,
//    'application/x-javascript': SCRIPT,
//    'text/javascript': SCRIPT,
//    [APPLICATION_JSON]: JS0N,
//    'application/xml': XML,
//    'text/xml': XML,
//    [TEXT_HTML]: HTML,
//    'text/plain': TEXT
//};
//
//// 根据服务端返回的`Content-Type`的值 返回应该使用的`accept`的值
//let getAccept = (mime) => {
//    if (mime) mime = mime.split(';')[0];
//    return responseHeaderToAccept[mime] || TEXT;
//}
//let addEvent = function(xhr, event, fn) {
//    if (xhr.addEventListener) {
//        xhr.addEventListener(event, fn, FALSE);
//    } else if (xhr.attachEvent) {
//        xhr.attachEvent('on' + event, fn);
//    } else {
//        xhr['on' + event] = fn;
//    }
//};

// 设置请求头
// 没有处理的事情：跨域时使用者传入的多余的Header没有屏蔽 没必要
let setHeaders = function(xhr, options) {
    // 如果没有跨域 则打该标识 业界通用做法
    // TODO 如果是跨域的 只有有限的requestHeader是可以使用的 待补充注释
    if (!isCrossDomain(options.url)) {
        xhr.setRequestHeader('X-Requested-With', 'XMLHttpRequest');
    }

    xhr.setRequestHeader('Accept', acceptToRequestHeader[options.accept] || '*/*');

    for (var key in options.header) {
        xhr.setRequestHeader(key, options.header[key]);
    }

    // 如果是`POST`请求，需要`urlencode`
    if (options.method === 'POST' && !options.header['Content-Type']) {
        xhr.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
    }
};

// 绑定事件
let setEvents = function(xhr, options) {

    let completeFn = function() {
        if (xhr.__completed) {
            return;
        }
        xhr.__completed = true;
        //options.log && console.info('~loadend');
        options.complete(xhr.status, xhr);
        xhr.__aborted = null;
        delete xhr.__aborted;
    }

    let onLoadFn = function() {

        let data = xhr.responseText;

        switch (options.accept) {
            case JS0N:
                try {
                    data = JSON.parse(data)
                } catch (e) {
                    console.warn('The response can NOT be parsed to JSON object.', data);
                }
                break;
            case SCRIPT:
                (1, eval)(data);
                break;
            case XML:
                data = xhr.responseXML;
                break;
            //case HTML:
            //case TEXT:
            default:
                break;
        }
        options.success(data, xhr);
        //C.log('complete after load');
        completeFn();
    };

    let onErrorFn = function () {
        options.error(xhr.status, xhr);
        //C.log('complete after error');
        completeFn();
    }

    let abortFn = function() {
        if (xhr.__completed) {
            return;
        }
        //options.log && console.info('~abort');
        options.abort(xhr.status, xhr);
        //C.log('complete after abort');
        completeFn();
    };

    if (!fallback) {
        // readyState value:
        //   0: UNSET 未初始化
        //   1: OPENED
        //   2: HEADERS_RECEIVED
        //   3: LOADING
        //   4: DONE 此时触发load事件
        xhr.onreadystatechange = () => {
            //console.log('xhr.readyState', xhr.readyState, 'xhr.status', xhr.status, xhr);
            if (xhr.readyState === 4) {
                // 如果请求被取消(aborted) 则`xhr.status`会是0 所以不会进入`success`回调
                if ((xhr.status >= 200 && xhr.status < 300) || xhr.status === 304) {
                    onLoadFn();
                } else {
                    // 如果请求被取消(aborted) 则`xhr.status`会是0 程序也会到达这里 需要排除 不应该触发error
                    !xhr.__aborted && onErrorFn();
                }
            }
        }
    } else {
        xhr.onload = onLoadFn;
    }

    xhr.onerror = onErrorFn;

    // 重写`abort`方法
    let originAbort = xhr.abort;
    xhr.abort = function() {
        xhr.__aborted = true;
        // NOTE 直接调用`originAbort()`时 浏览器会报 `Illegal invocation` 错误
        originAbort.call(xhr);

        // `XDomainRequest`对象实例居然没有`onabort`方法
        abortFn();
    };

    // IE9 bug
    xhr.onprogress = xhr.ontimeout = noop;
};

let defaultOptions = {
    url: '',
    method: GET,
    accept: TEXT,
    data: null,
    header: {},
    //withCredentials: false, 这个值由url是否跨域决定
    cache: true,
    success: noop,
    error: noop,
    complete: noop,
    abort: noop,
    log: FALSE
};

let ajax = function(options) {

    options = extend({}, defaultOptions, options);


    // 如果跨域了, 则禁止发送自定义的`header`信息
    if (isCrossDomain(options.url)) {
        // 重置`header`, 统一浏览器的行为.
        // 如果在跨域时发送了自定义`header`, 则:
        //   标准浏览器会报错: Request header field xxx is not allowed by Access-Control-Allow-Headers in preflight response.
        //   IE浏览器不报错
        options.header = {};
    }

    // H5版本
    // `IE10+`和标准浏览器的`XMLHttpRequest`都原生支持跨域
    let xhr = new XMLHttpRequest();

    let isFallback = FALSE;

    // `IE8/9`使用`XDomainRequest`来实现跨域, `IE10+`的`XMLHttpRequest`对象直接支持跨域
    if (!('withCredentials' in xhr) && typeof XDomainRequest != UNDEFINED) {
        // NOTE `XDomainRequest`仅支持`GET`和`POST`两个方法
        // 支持的事件有: onerror, onload, onprogress, ontimeout, 注意没有`onloadend`
        // https://developer.mozilla.org/zh-CN/docs/Web/API/XDomainRequest
        xhr = new XDomainRequest();
        isFallback = true;
    }

    // 再高级的浏览器都有低级错误! 已经不能在相信了!
    // MAC OSX Yosemite Safari上的低级错误: 一次`ajax`请求的`loadend`事件完成之后,
    // 如果执行`xhr.abort()`, 居然还能触发一遍`abort`和`loadend`事件!!!
    // `__completed`标识一次完整的请求是否结束, 如果已结束, 则不再触发任何事件
    xhr.__completed = FALSE;

    setEvents(xhr, options);

    xhr.open(options.method, appendQueryString(options.url, options.data, options.cache));

    // NOTE 生产环境的Server端, `Access-Control-Allow-Origin`的值一定不要配置成`*`!!! 而且`Access-Control-Allow-Credentials`应该是true!!!
    // NOTE 如果Server端的`responseHeader`配置了`Access-Control-Allow-Origin`的值是通配符`*` 则前端`withCredentials`是不能使用true值的
    // NOTE 如果Client端`withCredentials`使用了true值 则后端`responseHeader`中必须配置`Access-Control-Allow-Credentials`是true
    //xhr.withCredentials = isCrossDomain(options.url);

    // 设置requestHeader
    //setHeaders(xhr, options);

    // 文档建议说 send方法如果不发送请求体数据 则null参数在某些浏览器上是必须的
    xhr.send(options.method === GET ? NULL : options.data !== NULL ? JSON.stringify(options.data) : NULL);



    return xhr;
};

ajax.fallback = fallback;
ajax.supportCORS = supportCORS;

module.exports = ajax;