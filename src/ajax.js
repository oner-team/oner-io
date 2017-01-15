/**
 * src/ajax.js
 *
 * @license MIT License
 * @author jias (https://github.com/jias/natty-fetch)
 */
import {
    extend, appendQueryString, noop, isCrossDomain, isBoolean, param,
    FALSE, NULL, UNDEFINED
} from './util';

const supportCORS = UNDEFINED !== typeof XMLHttpRequest && 'withCredentials' in (new XMLHttpRequest());
const GET = 'GET';
const POST = 'POST';
const SCRIPT = 'script';
const XML = 'xml';
const JS0N = 'json'; // NOTE 不能使用`JSON`，这里用数字零`0`代替了字母`O`

// minetype的简写映射
// TODO 考虑是否优化
const acceptToRequestHeader = {
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
const setHeaders = (xhr, options) => {

    let header = {
        Accept: acceptToRequestHeader[options.accept]
    };
    // 如果没有跨域 则打该标识 业界通用做法
    // TODO 如果是跨域的 只有有限的requestHeader是可以使用的 待补充注释
    if (!isCrossDomain(options.url)) {
        header['X-Requested-With'] = 'XMLHttpRequest';
    }

    extend(header, options.header);

    // 如果是`POST`请求，根据options.postDataFormat设置对应的Content-Type
    // FORM和JSON都强制使用对应的Content-Type，RAW则不改动Content-Type的值，由调用者指定
    if (options.method === 'POST') {
        let pdf = options.postDataFormat;
        let contentType = (pdf === 'FORM')
            ? 'application/x-www-form-urlencoded; charset=UTF-8'
            : (pdf === 'JSON')
                ? 'application/json; charset=UTF-8'
                : NULL;
        if (contentType !== NULL)
            header['Content-Type'] = contentType;
    }

    for (let key in header) {
        xhr.setRequestHeader(key, header[key]);
    }
};

// 绑定事件
// NOTE 还得继续使用readystatechange事件
//      比较遗憾 到现在了依然不能安全的使用load和error等事件 就连PC端的chrome都有下面的问题
//      500: 触发load loadend 不触发error
//      404: 触发load loadend 不触发error
const setEvents = (xhr, options) => {

    // 再高级的浏览器都有低级错误! 已经不能在相信了!
    // MAC OSX Yosemite Safari上的低级错误: 一次`ajax`请求的`loadend`事件完成之后,
    // 如果执行`xhr.abort()`, 居然还能触发一遍`abort`和`loadend`事件!!!
    // `_finished`标识一次完整的请求是否结束, 如果已结束, 则不再触发任何事件
    xhr._finished = FALSE;

    const readyStateChangeFn = () => {
        if (xhr._finished) {
            return;
        }
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
                // 因为取消时会先触发原生的`onreadystatechange`响应，后触发`onAbort`回调，所以
                // 如果请求被取消(aborted) 则`xhr.status`会是0 程序走到这里的时候，`xhr._aborted`状态是false，
                // 需要排除，不应该触发`error`回调
                !xhr._aborted && options.error(xhr.status, xhr);
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

    const abortFn = () => {
        if (xhr._finished) {
            return;
        }
        //options.log && console.info('~abort');
        options.abort(xhr.status, xhr);
    };

    xhr.addEventListener('abort', abortFn);

    const loadedFn = () => {
        if (xhr._finished) {
            return;
        }
        xhr._finished = true;
        //options.log && console.info('~loadend');
        options.complete(xhr.status, xhr);
        delete xhr._aborted;
    }

    xhr.addEventListener('loadend', loadedFn);
};

const defaultOptions = {
    url: '',
    mark: {},
    useMark: true,
    method: GET,
    accept: '*',
    data: null,
    header: {},
    withCredentials: NULL, // 根据`url`是否跨域决定默认值. 如果显式配置该值(必须是布尔值), 则个使用配置值
    urlStamp: true,
    success: noop,
    error: noop,
    complete: noop,
    abort: noop,
    log: FALSE,
    traditional: FALSE,
    postDataFormat: 'FORM'
};

export default function ajax(options) {

    options = extend({}, defaultOptions, options);

    // 是否跨域
    let isCD = isCrossDomain(options.url);

    let xhr = new XMLHttpRequest();

    setEvents(xhr, options);

    xhr.open(options.method, appendQueryString(
        options.url,
        extend({}, options.useMark ? options.mark : {}, options.method === GET ? options.data : {}),
        options.urlStamp,
        options.traditional
    ));

    // NOTE 生产环境的Server端, `Access-Control-Allow-Origin`的值一定不要配置成`*`!!! 而且`Access-Control-Allow-Credentials`应该是true!!!
    // NOTE 如果Server端的`responseHeader`配置了`Access-Control-Allow-Origin`的值是通配符`*` 则前端`withCredentials`是不能使用true值的
    // NOTE 如果Client端`withCredentials`使用了true值 则后端`responseHeader`中必须配置`Access-Control-Allow-Credentials`是true
        xhr.withCredentials = isBoolean(options.withCredentials) ? options.withCredentials : isCD;

    // 设置requestHeader
    setHeaders(xhr, options);

    // 根据postDataFormat来格式化要发送的数据
    let pdf = options.postDataFormat;
    let sendData;
    if (options.method === GET || options.data === NULL)
        sendData = NULL;
    else
        sendData = (pdf === 'FORM')
            ? param(options.data, options.traditional)
            : (pdf === 'JSON')
                ? JSON.stringify(options.data)
                : options.data;

    // 文档建议说 send方法如果不发送请求体数据 则null参数在某些浏览器上是必须的
    xhr.send(sendData);

    let originAbort = xhr.abort;

    // 重写`abort`方法
    xhr.abort = () => {
        xhr._aborted = true;
        // NOTE 直接调用`originAbort()`时 浏览器会报 `Illegal invocation` 错误
        originAbort.call(xhr);
    };

    return xhr;
};

// 移动端不需要fallback
ajax.fallback = false;
ajax.supportCORS = supportCORS;

/**
 * file: ajax.js
 * ref https://xhr.spec.whatwg.org
 * ref https://developer.mozilla.org/en-US/docs/Web/API/XMLHttpRequest
 * ref https://developer.mozilla.org/en-US/docs/Web/API/XMLHttpRequest/Using_XMLHttpRequest
 * ref https://developer.mozilla.org/en-US/docs/Web/HTTP/Access_control_CORS
 * ref https://hacks.mozilla.org/2009/07/cross-site-xmlhttprequest-with-cors/
 * ref http://www.html5rocks.com/en/tutorials/cors/
 * @link http://enable-cors.org/index.html
 */
