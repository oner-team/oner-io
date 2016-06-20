const FALSE = false;
const TRUE = true;
const {noop, isEmptyObject, sortPlainObjectKey, extend, runAsFn} = require('./util');

module.exports = function(api) {
    let t = this;
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
        let vars = {
            mark: {
                __api: t.name + '.' + config.API
            }
        };

        if (config.mock) {
            vars.mark.__mock = true;
        }

        // `data`必须在请求发生时实时创建
        data = extend({}, config.data, runAsFn(data));

        // 将数据参数存在私有标记中, 方便API的`process`方法内部使用
        vars.data = data;

        if (api.storageUseable) {

            // 只有GET和JSONP才会有storage生效
            vars.queryString = isEmptyObject(vars.data) ? 'no-query-string' : JSON.stringify(sortPlainObjectKey(vars.data));

            api.storage.has(vars.queryString).then(function (result) {
                // console.warn('has cached: ', hasValue);
                if (result.has) {
                    // 调用 willRequest 钩子
                    config.willRequest(vars, config, 'storage');
                    successFn({
                        fromStorage: TRUE,
                        content: result.value
                    });
                }

                // 在`storage`可用的情况下, 远程请求返回的数据会同步到`storage`
                return t.remoteRequest(vars, config);
            }).then(function (content) {
                successFn({
                    fromStorage: FALSE,
                    content
                });
            }).catch(function (e) {
                errorFn(e);
            });
        } else {
            t.remoteRequest(vars, config).then(function (content) {
                successFn({
                    fromStorage: FALSE,
                    content
                });
            }).catch(function (e) {
                errorFn(e);
            });
        }
    };
};