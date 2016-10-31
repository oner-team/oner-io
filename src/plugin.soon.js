/**
 * src/plugin.soon.js
 *
 * @license MIT License
 * @author jias (https://github.com/jias/natty-fetch)
 */
import {noop, isEmptyObject, sortPlainObjectKey, FALSE, TRUE} from './util';

export default function(apiInstance) {
    let t = this;
    let api = apiInstance.api;
    let {config} = api;
    api.soon = function(data, successFn = noop, errorFn = noop) {

        // 是否忽略自身的并发请求
        // NOTE 这个地方和内置的api方法不一致
        if (config.ignoreSelfConcurrent && config.pending) {
            return;
        }

        if (config.overrideSelfConcurrent && config._lastRequester) {
            config._lastRequester.abort();
            delete config._lastRequester;
        }

        // 一次请求的私有相关数据
        let vars = t.makeVars(data);

        let remoteRequest = function () {
            t.remoteRequest(vars, config).then(function (content) {
                successFn({
                    fromStorage: FALSE,
                    content
                });
            })['catch'](function (e) {
                errorFn(e);
            });
        }

        if (api.storageUseable) {

            // 只有GET和JSONP才会有storage生效
            vars.queryString = isEmptyObject(vars.data) ? 'no-query-string' : JSON.stringify(sortPlainObjectKey(vars.data));

            api.storage.has(vars.queryString).then(function (result) {

                // console.warn('has cached: ', hasValue);
                if (result.has) {
                    successFn({
                        fromStorage: TRUE,
                        content: result.value
                    });
                }

                // 在`storage`可用的情况下, 远程请求返回的数据会同步到`storage`
                remoteRequest();
            });
        } else {
            remoteRequest();
        }
    };
};