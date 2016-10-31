/**
 * src/jsonp.js
 *
 * @license MIT License
 * @author jias (https://github.com/jias/natty-fetch)
 */
import {appendQueryString, noop, extend, makeRandom, hasWindow, NULL, FALSE} from './util';
const win = hasWindow ? window : NULL;
const doc = hasWindow ? document : NULL;
const SCRIPT = 'script';

const removeScript = (script) => {
    script.onerror = NULL;
    script.parentNode.removeChild(script);
    script = NULL;
};
let head = NULL;
const insertScript = (url, options) => {
    let script = doc.createElement(SCRIPT);
    script.src = url;
    script.async = true;

    script.onerror = (e) => {
        win[options.callbackName] = NULL;
        options.error(e);
        options.complete();
    };

    head = head || doc.getElementsByTagName('head')[0];
    head.insertBefore(script, head.firstChild);
    return script;
}

const defaultOptions = {
    url: '',
    mark: {},
    useMark: true,
    data: {},
    urlStamp: true,
    success: noop,
    error: noop,
    complete: noop,
    log: false,
    flag: 'callback',
    callbackName: 'jsonp{id}',
    traditional: FALSE
};

export default function jsonp(options) {

    options = extend({}, defaultOptions, options);

    let callbackName = options.callbackName = options.callbackName.replace(/\{id\}/, makeRandom());

    let originComplete = options.complete;

    let script;

    // 二次包装的`complete`回调
    options.complete = () => {
        // 删除脚本
        removeScript(script);
        originComplete();
    }

    // 成功回调
    win[callbackName] = (data) => {
        // JSONP函数需要立即删除 用于`IE8`判断是否触发`onerror`
        win[callbackName] = NULL;
        options.success(data);
        options.complete();
    };

    // 生成`url`
    let url = appendQueryString(
        options.url,
        extend({[options.flag]: callbackName}, options.useMark ? options.mark : {}, options.data),
        options.urlStamp,
        options.traditional
    );

    // 插入脚本
    script = insertScript(url, options);
    
    return {
        abort() {
            // 覆盖成功回调为无数据处理版本
            win[callbackName] = () => {
                win[callbackName] = NULL;
            };
            removeScript(script);
        }
    };
}
