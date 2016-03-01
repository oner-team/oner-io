/**
 * ref https://xhr.spec.whatwg.org
 * ref https://developer.mozilla.org/en-US/docs/Web/API/XMLHttpRequest
 * ref https://developer.mozilla.org/en-US/docs/Web/API/XMLHttpRequest/Using_XMLHttpRequest
 * ref https://developer.mozilla.org/en-US/docs/Web/HTTP/Access_control_CORS
 * ref https://hacks.mozilla.org/2009/07/cross-site-xmlhttprequest-with-cors/
 * ref http://www.html5rocks.com/en/tutorials/cors/
 * @link http://enable-cors.org/index.html
 */
const {extend, appendQueryString, noop, isCrossDomain, isBoolean, param} = require('./util');

const hasWindow = 'undefined' !== typeof window;
const doc = hasWindow ? document : null;
const FALSE = false;
const UNDEFINED = 'undefined';
const NULL = null;
const GET = 'GET';
const SCRIPT = 'script';
const XML = 'xml';
const HTML = 'html';
const TEXT = 'text';
const JS0N = 'json'; // NOTE 不能使用`JSON`，这里用数字零`0`代替了字母`O`

const APPLICATION_JSON = 'application/json';
const TEXT_HTML = 'text/html';

let xhrTester = UNDEFINED !== typeof XMLHttpRequest ? new XMLHttpRequest() : {};
let hasXDR = UNDEFINED !== typeof XDomainRequest;
let fallback = hasWindow ? (!('withCredentials' in xhrTester) && hasXDR) : null;
let supportCORS = hasWindow ? (('withCredentials' in xhrTester) || hasXDR) : null;

// minetype的简写映射
// TODO 考虑是否优化
let acceptToRequestHeader = {
    // IIS returns `application/x-javascript` 但应该不需要支持
    '*':    '*/' + '*',
    script: 'text/javascript, application/javascript, application/ecmascript, application/x-ecmascript',
    json:   'application/json, text/json',
    xml:    'application/xml, text/xml',
    html:   'text/html',
    text:   'text/plain'
};

// 设置请求头
// 没有处理的事情：跨域时使用者传入的多余的Header没有屏蔽 没必要
let setHeaders = (xhr, options) => {
    if (!xhr.setRequestHeader) {
        return;
    }

    let header = {
        Accept: acceptToRequestHeader[options.accept]
    };

    // 如果没有跨域 则打该标识 业界通用做法
    // TODO 如果是跨域的 只有有限的requestHeader是可以使用的 待补充注释
    if (!isCrossDomain(options.url)) {
        header['X-Requested-With'] = 'XMLHttpRequest';
    }

    extend(header, options.header);

    // 如果是`POST`请求，需要`urlencode`
    if (options.method === 'POST' && !options.header['Content-Type']) {
        header['Content-Type'] = 'application/x-www-form-urlencoded; charset=UTF-8';
    }

    for (var key in header) {
        xhr.setRequestHeader(key, header[key]);
    }
};

// 绑定事件
let setEvents = (xhr, options, isCrossDomain) => {

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

    // 如果是IE8/9 且 如果是跨域请求
    if (fallback && isCrossDomain) {
        // `XDomainRequest`实例是没有`onreadystatechange`方法的!!!
        xhr.onload = onLoadFn;
    } else {
        // readyState value:
        //   0: UNSET 未初始化
        //   1: OPENED
        //   2: HEADERS_RECEIVED
        //   3: LOADING
        //   4: DONE 此时触发load事件
        xhr.onreadystatechange = () => {
            //console.log('xhr.readyState', xhr.readyState, 'xhr.status', xhr.status, xhr);
            if (xhr.readyState == 4) {
                // 如果请求被取消(aborted) 则`xhr.status`会是0 所以不会进入`success`回调
                if ((xhr.status >= 200 && xhr.status < 300) || xhr.status === 304) {
                    onLoadFn();
                } else {
                    // 如果请求被取消(aborted) 则`xhr.status`会是0 程序也会到达这里 需要排除 不应该触发error
                    !xhr.__aborted && onErrorFn();
                }
            }
        }
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
    mark: {},
    method: GET,
    accept: TEXT,
    data: null,
    header: {},
    withCredentials: NULL, // 根据`url`是否跨域决定默认值. 如果显式配置该值(必须是布尔值), 则个使用配置值
    cache: true,
    success: noop,
    error: noop,
    complete: noop,
    abort: noop,
    log: FALSE,
    traditional: FALSE
};

let ajax = (options) => {

    options = extend({}, defaultOptions, options);

    // 是否跨域
    let isCD = isCrossDomain(options.url);

    // 如果跨域了, 则禁止发送自定义的`header`信息
    if (isCD) {
        // 重置`header`, 统一浏览器的行为.
        // 如果在跨域时发送了自定义`header`, 则:
        //   标准浏览器会报错: Request header field xxx is not allowed by Access-Control-Allow-Headers in preflight response.
        //   IE浏览器不报错
        options.header = {};
    }

    // H5版本
    // `IE10+`和标准浏览器的`XMLHttpRequest`都原生支持跨域
    let xhr = new XMLHttpRequest();

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
    // `__completed`标识一次完整的请求是否结束, 如果已结束, 则不再触发任何事件
    xhr.__completed = FALSE;

    setEvents(xhr, options, isCD);

    xhr.open(options.method, appendQueryString(options.url, extend({}, options.mark, options.method === GET ? options.data : {}), options.cache, options.traditional));

    // NOTE 生产环境的Server端, `Access-Control-Allow-Origin`的值一定不要配置成`*`!!! 而且`Access-Control-Allow-Credentials`应该是true!!!
    // NOTE 如果Server端的`responseHeader`配置了`Access-Control-Allow-Origin`的值是通配符`*` 则前端`withCredentials`是不能使用true值的
    // NOTE 如果Client端`withCredentials`使用了true值 则后端`responseHeader`中必须配置`Access-Control-Allow-Credentials`是true
    if (!fallback) {
        xhr.withCredentials = isBoolean(options.withCredentials) ? options.withCredentials : isCD;
    }

    // 设置requestHeader
    setHeaders(xhr, options);

    // 文档建议说 send方法如果不发送请求体数据 则null参数在某些浏览器上是必须的

    xhr.send(options.method === GET ? NULL : options.data !== NULL ? param(options.data, options.traditional) : NULL);

    return xhr;
};

ajax.fallback = fallback;
ajax.supportCORS = supportCORS;

module.exports = ajax;
