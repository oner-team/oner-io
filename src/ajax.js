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

const FALSE = false;
const UNDEFINED = 'undefined';
const NULL = null;
const GET = 'GET';
const SCRIPT = 'script';
const XML = 'xml';
const JS0N = 'json'; // NOTE 不能使用`JSON`，这里用数字零`0`代替了字母`O`

let supportCORS = UNDEFINED !== typeof XMLHttpRequest && 'withCredentials' in (new XMLHttpRequest());

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
// NOTE 还得继续使用readystatechange事件
//      比较遗憾 到现在了依然不能安全的使用load和error等事件 就连PC端的chrome都有下面的问题
//      500: 触发load loadend 不触发error
//      404: 触发load loadend 不触发error
let setEvents = (xhr, options) => {

    // 再高级的浏览器都有低级错误! 已经不能在相信了!
    // MAC OSX Yosemite Safari上的低级错误: 一次`ajax`请求的`loadend`事件完成之后,
    // 如果执行`xhr.abort()`, 居然还能触发一遍`abort`和`loadend`事件!!!
    // `__finished`标识一次完整的请求是否结束, 如果已结束, 则不再触发任何事件
    xhr.__finished = FALSE;

    let readyStateChangeFn = (e) => {

        //console.log('xhr.readyState', xhr.readyState, 'xhr.status', xhr.status, xhr);
        if (xhr.readyState === 4) {
            // 如果请求被取消(aborted) 则`xhr.status`会是0 所以不会进入`success`回调
            if ((xhr.status >= 200 && xhr.status < 300) || xhr.status === 304) {
                //let mime = xhr.getResponseHeader('Content-Type');
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
            } else {
                // 如果请求被取消(aborted) 则`xhr.status`会是0 程序也会到达这里 需要排除 不应该触发error
                !xhr.__aborted && options.error(xhr.status, xhr);
            }
        }
    };


    // readyState value:
    //   0: UNSET 未初始化
    //   1: OPENED
    //   2: HEADERS_RECEIVED
    //   3: LOADING
    //   4: DONE 此时触发load事件
    xhr.addEventListener("readystatechange", readyStateChangeFn);

    //xhr.addEventListener('error', function () {
    //    console.log('xhr event: error');
    //});

    //xhr.addEventListener('load', function () {
    //    console.log('xhr event: load');
    //});

    let abortFn = () => {
        if (xhr.__finished) {
            return;
        }
        //options.log && console.info('~abort');
        options.abort(xhr.status, xhr);
    };

    xhr.addEventListener('abort', abortFn);

    let loadedFn = () => {
        if (xhr.__finished) {
            return;
        }
        xhr.__finished = true;
        //options.log && console.info('~loadend');
        options.complete(xhr.status, xhr);
        delete xhr.__aborted;
    }

    xhr.addEventListener('loadend', loadedFn);
};

let defaultOptions = {
    url: '',
    mark: {},
    method: GET,
    accept: '*',
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


    // 如果跨域了, 则禁止发送自定义的`header`信息
    if (isCrossDomain(options.url)) {
        // 重置`header`, 统一浏览器的行为.
        // 如果在跨域时发送了自定义`header`, 则:
        //   标准浏览器会报错: Request header field xxx is not allowed by Access-Control-Allow-Headers in preflight response.
        //   IE浏览器不报错
        options.header = {};
    }

    let xhr = new XMLHttpRequest();

    setEvents(xhr, options);

    xhr.open(options.method, appendQueryString(options.url, extend({}, options.mark, options.method === GET ? options.data : {}), options.cache, options.traditional));

    // NOTE 生产环境的Server端, `Access-Control-Allow-Origin`的值一定不要配置成`*`!!! 而且`Access-Control-Allow-Credentials`应该是true!!!
    // NOTE 如果Server端的`responseHeader`配置了`Access-Control-Allow-Origin`的值是通配符`*` 则前端`withCredentials`是不能使用true值的
    // NOTE 如果Client端`withCredentials`使用了true值 则后端`responseHeader`中必须配置`Access-Control-Allow-Credentials`是true
    xhr.withCredentials = isBoolean(options.withCredentials) ? options.withCredentials : isCrossDomain(options.url);

    // 设置requestHeader
    setHeaders(xhr, options);

    // 文档建议说 send方法如果不发送请求体数据 则null参数在某些浏览器上是必须的
    xhr.send(options.method === GET ? NULL : options.data !== NULL ? param(options.data, options.traditional) : NULL);

    let originAbort = xhr.abort;

    // 重写`abort`方法
    xhr.abort = () => {
        xhr.__aborted = true;
        // NOTE 直接调用`originAbort()`时 浏览器会报 `Illegal invocation` 错误
        originAbort.call(xhr);
    };

    return xhr;
};

// 移动端不需要fallback
ajax.fallback = false;
ajax.supportCORS = supportCORS;

module.exports = ajax;
