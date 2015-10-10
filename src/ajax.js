/**
 * ref https://xhr.spec.whatwg.org
 * ref https://developer.mozilla.org/en-US/docs/Web/API/XMLHttpRequest
 * ref https://developer.mozilla.org/en-US/docs/Web/API/XMLHttpRequest/Using_XMLHttpRequest
 * ref https://developer.mozilla.org/en-US/docs/Web/HTTP/Access_control_CORS
 * ref https://hacks.mozilla.org/2009/07/cross-site-xmlhttprequest-with-cors/
 * ref http://www.html5rocks.com/en/tutorials/cors/
 * @link http://enable-cors.org/index.html
 */

const {extend, appendQueryString, noop} = require('./util');

const doc = document;

const NULL = null;
const GET = 'GET';
const SCRIPT = 'script';
const XML = 'xml';
const HTML = 'html';
const TEXT = 'text';
const JS0N = 'json'; // NOTE 不能使用`JSON`，这里用数字零`0`代替了字母`O`

const APPLICATION_JSON = 'application/json';
const TEXT_HTML = 'text/html';

// minetype的简写映射
// TODO 考虑是否优化
let acceptToRequestHeader = {
    // IIS returns `application/x-javascript`
    script: 'text/javascript, application/javascript, application/x-javascript',
    json:   APPLICATION_JSON,
    xml:    'application/xml, text/xml',
    html:   TEXT_HTML,
    text:   'text/plain'
}

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

// 判断是否跨域
let originA = doc.createElement('a');
originA.href = window.location.href;
let isCrossDomain = (url) => {
    let requestA = doc.createElement('a');
    requestA.href = url;
    return (originA.protocol + '//' + originA.host) !== (requestA.protocol + '//' + requestA.host);
}

// 设置请求头
// 没有处理的事情：跨域时使用者传入的多余的Header没有屏蔽 没必要
let setHeaders = (xhr, options) => {
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
}

// 绑定事件
// NOTE 还得继续使用readystatechange事件
//      比较遗憾 到现在了依然不能安全的使用load和error等事件 就连PC端的chrome都有下面的问题
//      500: 触发load loadend 不触发error
//      404: 触发load loadend 不触发error
let setEvents = (xhr, options) => {

    // readyState value:
    //   0: UNSET 未初始化
    //   1: OPENED
    //   2: HEADERS_RECEIVED
    //   3: LOADING
    //   4: DONE 此时触发load事件
    xhr.addEventListener("readystatechange", function (e) {
        options.log && console.log('xhr.readyState', xhr.readyState, 'xhr.status', xhr.status, xhr);
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
    });

    //xhr.addEventListener('error', function () {
    //    console.log('errorrrrr');
    //});
    //
    //xhr.addEventListener('load', function () {
    //    console.log('looooooad');
    //});

    xhr.addEventListener('abort', () => {
        options.log && console.log('abort');
        options.abort(xhr.status, xhr);
    });

    xhr.addEventListener('loadend', () => {
        options.log && console.log('loadend');
        options.complete(xhr.status, xhr);
        delete xhr.__aborted;
    });
}

let defaultOptions = {
    url: '',
    method: GET,
    accept: TEXT,
    data: null,
    header: {},
    withCredentials: false,
    cache: true,
    success: noop,
    error: noop,
    complete: noop,
    abort: noop,
    log: false
};

let ajax = (options) => {

    options = extend({}, defaultOptions, options);

    let xhr = new XMLHttpRequest();

    setEvents(xhr, options);

    xhr.open(options.method, appendQueryString(options.url, options.data, options.cache));

    // NOTE 如果Server端的`responseHeader`配置了`Access-Control-Allow-Origin`的值是通配符`*` 则前端`withCredentials`是不能使用true值的
    // NOTE 如果Client端`withCredentials`使用了true值 则后端`responseHeader`中必须配置`Access-Control-Allow-Credentials`是true
    xhr.withCredentials = options.withCredentials;

    // 设置requestHeader
    setHeaders(xhr, options);

    // 文档建议说 send方法如果不发送请求体数据 则null参数在某些浏览器上是必须的
    xhr.send(options.method === GET ? NULL : options.data !== NULL ? JSON.stringify(options.data) : NULL);

    let originAbort = xhr.abort;

    // 重写`abort`方法
    xhr.abort = () => {
        xhr.__aborted = true;
        // NOTE 直接调用`originAbort()`时 浏览器会报 `Illegal invocation` 错误
        originAbort.call(xhr);
    };

    return xhr;
}


module.exports = ajax;