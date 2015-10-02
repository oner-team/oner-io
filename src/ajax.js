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
const SCRIPT = 'script';
const XML = 'xml';
const HTML = 'html';
const TEXT = 'text';
const JS0N = 'json'; // NOTE 不能使用`JSON`，这里用数字零`0`代替了字母`O`


let defaultOptions = {
    url: '.',
    method: 'GET',
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


const APPLICATION_JSON = 'application/json';
const TEXT_HTML = 'text/html';

// minetype的简写映射
// TODO 考虑是否优化
let acceptToRequestHeader = {
    script: 'text/javascript, application/javascript, application/x-javascript', //  IIS returns "application/x-javascript"
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

    //xhr.addEventListener("progress", function (e) {
    //    options.log && console.log(e, xhr);
    //
    //    if (e.lengthComputable) {
    //        var percentComplete = e.loaded / e.total;
    //        options.log && console.warn('progress', percentComplete);
    //    } else {
    //        // Unable to compute progress information since the total size is unknown
    //    }
    //});
    //xhr.addEventListener("loadstart", function (e) {
    //    options.log && console.warn('loadstart');
    //    options.log && console.log(e, xhr);
    //});

    // readyState value:
    //      0: UNSET 未初始化
    //      1: OPENED
    //      2: HEADERS_RECEIVED
    //      3: LOADING
    //      4: DONE 此时触发load事件
    xhr.addEventListener("readystatechange", function (e) {
        options.log && console.log('xhr.readyState', xhr.readyState, 'xhr.status', xhr.status);
        if (xhr.readyState === 4) {
            if ((xhr.status >= 200 && xhr.status < 300) || xhr.status === 304) {
                //let mime = xhr.getResponseHeader('Content-Type');

                let data = xhr.responseText;
                switch (options.accept) {
                    case JS0N:
                        try {
                            data = JSON.parse(data);
                        } catch (e) {
                            console.error(data);
                            throw new Error('parse json error');
                        }
                        break;
                    case SCRIPT:
                        (1, eval)(data);
                        break;
                    case XML:
                        data = xhr.responseXML;
                        break;
                    case HTML:
                    case TEXT:
                    default:
                        break;
                }
                options.success(data, xhr);
            } else {
                if (typeof options.error === 'function') {
                    options.error(xhr.status, xhr);
                } else {

                }

            }
            options.complete(xhr);
        }
    });

    // 跨域请求被拒绝时：会触发`error + loadend`事件 不会触发`load`事件 此时 chrome中xhr.status是0
    // 404时：不触发`error`事件
    //xhr.addEventListener("error", function (e) {
    //    options.log && console.log('error', xhr);
    //    //options.error(xhr);
    //});
    //
    //xhr.addEventListener("load", function (e) {
    //    options.log && console.log('load', xhr);
    //    //options.complete(xhr);
    //});

    //xhr.addEventListener("abort", function (e) {
    //    options.log && console.warn('abort');
    //    options.log && console.log(e, xhr);
    //});
    //xhr.addEventListener("timeout", function (e) {
    //    options.log && console.warn('timeout');
    //    options.log && console.log(e, xhr);
    //});

    //xhr.addEventListener('readystatechange', function () {
    //    options.log && console.log('readystatechange: readyState', xhr.readyState, xhr.status);
    //    if (xhr.readyState === 4) {
    //        options.log && console.log('status', xhr.status);
                    //var result, dataType;
                    //
                    //if ((xhr.status >= 200 && xhr.status < 300) || xhr.status === 304) {
                    //    var mime = xhr.getResponseHeader('content-type');
                    //    dataType = mimeTypes[mime] || 'text';
                    //    result = xhr.responseText;
                    //
                    //    try {
                    //        if (dataType === 'json') {
                    //            result = JSON.parse(result);
                    //        }
                    //
                    //        success(result, xhr, settings);
                    //        return;
                    //    } catch (e) {
                    //
                    //    }
                    //}
                    //
                    //error(null, 'error', xhr, settings);
                    //return;
        //}
    //}, false);
}

let ajax = (options) => {

    options = extend({}, defaultOptions, options);

    let xhr = new XMLHttpRequest();

    setEvents(xhr, options);

    xhr.open(options.method, appendQueryString(options.url, options.query, options.cache));

    // NOTE 如果Server端的`responseHeader`配置了`Access-Control-Allow-Origin`的值是通配符`*` 则前端`withCredentials`是不能使用true值的
    // NOTE 如果Client端`withCredentials`使用了true值 则后端`responseHeader`中必须配置`Access-Control-Allow-Credentials`是true
    xhr.withCredentials = options.withCredentials;

    // 设置requestHeader
    setHeaders(xhr, options);

    // 文档建议说 send方法如果不发送请求体数据 则null参数在某些浏览器上是必须的
    xhr.send(options.method === 'GET' ? NULL : options.data !== NULL ? JSON.stringify(options.data) : NULL);

    return xhr;
}


module.exports = ajax;