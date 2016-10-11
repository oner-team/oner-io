(function () {
'use strict';

var host = 'http://localhost:8010/'

describe('nattyFetch v2.2.0 Unit Test', function() {

    describe('static',function() {
        it('version v2.2.0', function() {
            expect(nattyFetch.version).to.equal('2.2.0');
        });
    });

    describe('global setting',function() {
        this.timeout(1000*10);
        var defaultGlobalConfig = nattyFetch.getGlobal();
        var defaultGlobalConfigProperties = [
            'data',
            'fit',
            'header',
            'ignoreSelfConcurrent',
            'jsonp',
            'log',
            'method',
            'mock',
            'mockUrl',
            'mockUrlPrefix',
            'process',
            'retry',
            'timeout',
            'url',
            'urlPrefix',
            'withCredentials',
            'traditional'
        ];

        var emptyEvent = nattyFetch._event;

        var resetNattyDBGlobalConfig = function () {
            nattyFetch.setGlobal(defaultGlobalConfig);
        };

        beforeEach(function () {
            resetNattyDBGlobalConfig();
        });

        afterEach(function () {
            // 清理所有事件
            var i;
            for (i in nattyFetch._event) {
                if (i.indexOf('__') === 0) {
                    delete nattyFetch._event[i];
                }
            }
        });

        it('check default global config properties: `nattyFetch.getGlobal()`',function() {
            defaultGlobalConfigProperties.forEach(function (property) {
                expect(defaultGlobalConfig).to.have.key(property);
            });
        });

        it('check `nattyFetch.getGlobal("property")`', function () {
            expect(nattyFetch.getGlobal('jsonp')).to.be(false);
        });

        it('check `nattyFetch.setGlobal(obj)`', function () {
            nattyFetch.setGlobal({
                data: {
                    '_csrf_token': 1
                }
            });
            expect(nattyFetch.getGlobal('data')).to.eql({
                '_csrf_token': 1
            });
            // 还原
            nattyFetch.setGlobal({data: {}});
        });

        it('Context instance would inherit and extend the global config', function () {

            var urlPrefix = 'http://test.com/api';
            var context = nattyFetch.context({
                urlPrefix: urlPrefix
            });

            // 继承了所有的全局配置
            // defaultGlobalConfigProperties.forEach(function (property) {
            //     expect(DBC.config).to.have.key(property);
            // });
            // 也扩展了全局配置
            expect(context._config.urlPrefix).to.be(urlPrefix);
        });

        it('Context instance would inherit and extend the global config 2', function () {
            var urlPrefix = 'http://test.com/api';
            nattyFetch.setGlobal({
                urlPrefix: urlPrefix
            });

            var context = nattyFetch.context();

            context.create('order', {
                create: {}
            });

            expect(context.api.order.create.config.urlPrefix).to.be(urlPrefix);
        });

        it('catch error', function (done) {
            nattyFetch.setGlobal({
                urlPrefix: host
            });

            var context = new nattyFetch.context();
            context.create('order', {
                create: {
                    url: 'api/order-create',
                    method: 'POST'
                }
            });
            context.api.order.create().then(function(data) {
                // 调用一个不存在的函数, 触发一个js错误
                notExistedFn();
            })['catch'](function (error) {
                if (window.console) {
                    console.log(error.message);
                    console.error(error.stack);
                } else {
                    C.log(error.message, error.stack);
                }
                done();
            });
        });

        it('check global `resolve`', function (done) {
            nattyFetch.setGlobal({
                urlPrefix: host
            });

            nattyFetch.on('resolve', function (data, config) {
                try {
                    expect(data.id).to.be(1);
                    done();
                } catch(e) {
                    done(e);
                }
            });



            var context = nattyFetch.context();
            context.create('order', {
                create: {
                    url: 'api/order-create',
                    method: 'POST'
                }
            });

            context.api.order.create().then(function(data) {}, function () {});
        });

        it('check global `reject`', function (done) {
            nattyFetch.setGlobal({
                urlPrefix: host
            });

            nattyFetch.on('reject', function (error, config) {
                try {
                    expect(error.code).to.be(1);
                    done();
                } catch(e) {
                    done(e);
                }
            });

            var context = nattyFetch.context();
            context.create('order', {
                create: {
                    url: 'api/return-error',
                    method: 'POST'
                }
            });
            context.api.order.create().then(function(data) {}, function () {});
        });

        it('check context `resolve`', function (done) {
            var context = nattyFetch.context({
                urlPrefix: host
            });

            context.on('resolve', function (data, config) {
                try {
                    expect(data.id).to.be(1);
                    done();
                } catch(e) {
                    done(e);
                }
            });

            context.create('order', {
                create: {
                    url: 'api/order-create',
                    method: 'POST'
                }
            });
            context.api.order.create().then(function(data) {
            }, function () {

            });
        });

        it('check context `reject`', function (done) {
            var context = nattyFetch.context({
                urlPrefix: host
            });

            context.on('reject', function (error, config) {
                try {
                    expect(error.code).to.be(1);
                    done();
                } catch(e) {
                    done(e);
                }
            });

            context.create('order', {
                create: {
                    url: 'api/return-error',
                    method: 'POST'
                }
            });
            context.api.order.create().then(function(data) {}, function () {});
        });

        it('check both global and context `resolve`', function (done) {
            var globalResolve = false;
            nattyFetch.setGlobal({
                urlPrefix: host
            });

            nattyFetch.on('resolve', function (content) {
                //console.log(1, content);
                globalResolve = true;
            });

            var context = nattyFetch.context({});

            context.on('resolve', function (content) {
                //console.log(2, content);
                try {
                    expect(globalResolve).to.be(true);
                    expect(content.id).to.be(1);
                    done();
                } catch(e) {
                    done(e);
                }
            });

            context.create('order', {
                create: {
                    url: 'api/order-create',
                    method: 'POST'
                }
            });
            context.api.order.create().then(function(data) {}, function () {});
        });

        it('check both global and context `reject`', function (done) {
            var globalReject = false;
            nattyFetch.setGlobal({
                urlPrefix: host
            });

            nattyFetch.on('reject', function (error) {
                //console.log(1, error);
                globalReject = true;
            });


            var context = nattyFetch.context({
                urlPrefix: host
            });

            context.on('reject', function (error, config) {
                //console.log(2, error);
                try {
                    expect(globalReject).to.be(true);
                    expect(error.code).to.be(1);
                    done();
                } catch(e) {
                    done(e);
                }
            });

            context.create('order', {
                create: {
                    url: 'api/return-error',
                    method: 'POST'
                }
            });
            context.api.order.create().then(function(data) {}, function () {});
        });

    });

    describe('api config', function () {
        this.timeout(1000*10);
        var context;

        beforeEach('reset NattyDB context', function () {
            context = nattyFetch.context({
                urlPrefix: host,
                jsonp: true,
                mock: false
            });
        });

        it('both object and function can be used as api\'s config', function () {
            context.create('order', {
                // api 对应 配置
                pay: {},
                // api 对应 返回配置的函数
                create: function () {
                    return {}
                }
            });

            expect(context.api.order).to.be.a('object');
            expect(context.api.order.pay).to.be.a('function');
            expect(context.api.order.create).to.be.a('function');
        });

        it('`mock` option', function () {
            context.create('order', {
                pay: {
                    mock: true
                },
                create: {
                    mock: false
                },
                close: {
                    // 此处mock的值等于context.mock
                }
            });

            expect(context.api.order.pay.config.mock).to.be(true);
            expect(context.api.order.create.config.mock).to.be(false);
            expect(context.api.order.close.config.mock).to.be(false);
        });

        it('`mock` value from global', function () {
            var context = nattyFetch.context();
            context.create('order', {
                pay: {
                    // 这个mock等于全局mock值
                }
            });

            expect(context.api.order.pay.config.mock).to.be(false);
        });


        it('`mockUrlPrefix` value from context', function () {
            var context  = nattyFetch.context({
                // NOTE 当`mock`为true时, 才会处理`mockUrl`的值
                mock: true,
                mockUrlPrefix: './mock/'
            });
            context.create('order', {
                pay: {
                    mockUrl: 'pay'
                },
                create: {
                    mockUrl: '../create'
                },
                close: {
                    mockUrl: 'https://www.demo.com/close'
                }
            });

            expect(context.api.order.pay.config.mockUrl).to.be('./mock/pay');
            expect(context.api.order.create.config.mockUrl).to.be('../create');
            expect(context.api.order.close.config.mockUrl).to.be('https://www.demo.com/close');
        });

        it('`jsonp` option', function () {
            context.create('order', {
                pay: {
                    url: 'path'
                },
                transfer: {
                    jsonp: false,
                    url: 'path'
                },
                create: {
                    url: 'path.jsonp'
                },
                close: {
                    url: 'path.jsonp?foo'
                },
                delay: {
                    mock: true,
                    mockUrl: 'foo',
                    jsonp: false, // mock为true时, jsonp的值不会根据url的值自动纠正
                    url: 'path.jsonp?foo'
                }
            });

            expect(context.api.order.pay.config.jsonp).to.be(true);
            expect(context.api.order.transfer.config.jsonp).to.be(false);
            expect(context.api.order.create.config.jsonp).to.be(true);
            expect(context.api.order.close.config.jsonp).to.be(true);
            expect(context.api.order.delay.config.jsonp).to.be(false);
        });

        it('auto `urlPrefix`', function () {
            context.create('order', {
                method1: {
                    url: 'path'
                },
                method2: {
                    url: '//foo.com/path'
                },
                method3: {
                    url: 'http://foo.com/path'
                },
                method4: {
                    url: 'https://foo.com/path'
                },
                method5: {
                    url: './path'
                },
                method6: {
                    url: '../path'
                },
                method7: {
                    url: '/path'
                }
            });

            expect(context.api.order.method1.config.url).to.equal(host + 'path');
            expect(context.api.order.method2.config.url).to.be('//foo.com/path');
            expect(context.api.order.method3.config.url).to.be('http://foo.com/path');
            expect(context.api.order.method4.config.url).to.be('https://foo.com/path');
            expect(context.api.order.method5.config.url).to.be('./path');
            expect(context.api.order.method6.config.url).to.be('../path');
            expect(context.api.order.method7.config.url).to.be('/path');
        });
    });

    describe.skip('request config', function () {
        this.timeout(1000*10);
        var context;

        beforeEach('reset', function () {
            context = nattyFetch.context();
        });
        // 当使用request参数时, 只有data, retry, ignoreSelfConcurrent起作用
        it('`request` config with success', function (done) {
            var getPayId = function (successFn) {
                setTimeout(function () {
                    successFn({id: 1});
                }, 200);
            };
            context.create('order', {
                getSign: {
                    data: {
                        a: 1
                    },
                    request: function (vars, config, defer) {
                        // 验证参数是否正确合并
                        expect(vars.data.a).to.be(1);
                        expect(vars.data.b).to.be(1);
                        getPayId(function (content) {
                            defer.resolve(content);
                        });
                    }
                }
            });

            context.api.order.getSign({
                b: 1
            }).then(function (content) {
                expect(content.id).to.be(1);
                done();
            });
        });

        it('`request` config with error', function (done) {
            var getPayId = function (successFn, errorFn) {
                setTimeout(function () {
                    errorFn({message: 1});
                }, 200);
            };
            context.create('order', {
                getSign: {
                    request: function (data, config, defer, retryTime) {
                        getPayId(function (content) {
                            defer.resolve(content);
                        }, function (error) {
                            defer.reject(error);
                        });
                    }
                }
            });

            context.api.order.getSign().then(function (content) {
            }, function (error) {
                expect(error.message).to.be(1);
                done();
            });
        });

        it('`request` config with retry', function (done) {
            var getPayId = function (successFn, errorFn) {
                setTimeout(function () {
                    errorFn({message: 1});
                }, 200);
            };
            context.create('order', {
                getSign: {
                    retry: 1,
                    request: function (data, config, defer, retryTime) {
                        //console.log(retryTime);

                        getPayId(function (content) {
                            defer.resolve(content);
                        }, function (error) {
                            defer.reject(error);
                        });
                    }
                }
            });

            context.api.order.getSign().then(function (content) {
            }, function (error) {
                expect(error.message).to.be(1);
                done();
            });
        });

        it('`request` config with ignoreSelfConcurrent', function (done) {
            var count = 0;
            var getPayId = function (successFn, errorFn) {
                count++;
                setTimeout(function () {
                    errorFn({message:1});
                }, 200);
            };

            context.create('order', {
                getSign: {
                    ignoreSelfConcurrent: true,
                    request: function (data, config, defer, retryTime) {
                        //console.log(retryTime);

                        getPayId(function (content) {
                            defer.resolve(content);
                        }, function (error) {
                            defer.reject(error);
                        });
                    }
                }
            });

            context.api.order.getSign().then(function (content) {
            }, function (error) {
                expect(error.message).to.be(1);
            });

            context.api.order.getSign().then(function (content) {
            }, function (error) {
            });

            setTimeout(function () {
                expect(count).to.be(1);
                done();
            }, 1000);
        });
    });

    describe('ajax', function() {
        // NOTE 重要: 为了能够测试完整的场景, 默认已经全局关闭所有请求的浏览器缓存!!!  比如: ignoreSelfConcurrent
        //nattyFetch.setGlobal({
        //    cache: false,
        //    traditional: true
        //});

        this.timeout(1000*10);
        var context;

        beforeEach('reset', function () {
            context = nattyFetch.context({
                urlPrefix: host,
                mock: false
            });
        });

        it('play with standard data structure', function (done) {

            context.create('order', {
                create: {
                    url: 'api/order-create',
                    method: 'POST',
                    //traditional: true
                }
            });

            context.api.order.create().then(function(data) {
                try {
                    expect(data.id).to.be(1);
                    done();
                } catch(e) {
                    done(e);
                }
            });
        });

        it('play with non-standard data structure by `fit`', function (done) {
            context.create('order', {
                create: {
                    url: host + 'api/order-create-non-standard',
                    method: 'POST',
                    fit: function (response) {
                        return {
                            success: !response.hasError,
                            content: response.content
                        };
                    }
                }
            });
            context.api.order.create().then(function(data) {
                try {
                    expect(data.id).to.be(1);
                    done();
                } catch(e) {
                    done(e);
                }
            });
        });

        it('process data', function (done) {
            context.create('order', {
                create: {
                    url: host + 'api/order-create',
                    method: 'POST',
                    process: function (response) {
                        return {
                            orderId: response.id
                        };
                    }
                }
            });
            context.api.order.create().then(function(data) {
                try {
                    expect(data.orderId).to.be(1);
                    done();
                } catch(e) {
                    done(e);
                }
            });
        });

        // 固定参数和动态参数 在process和fix方法中都可以正确获取到
        it('`vars.data` in process or fix method', function (done) {
            context.create('order', {
                create: {
                    url: host + 'api/order-create',
                    method: 'POST',
                    data: {
                        fixData: 1
                    },
                    willFetch: function (vars, config) {
                        vars.data.hookData = 1;
                        // console.log(vars);
                        // console.log(config);
                        // console.log(this);
                    },
                    process: function (content, vars) {
                        expect(vars.data.fixData).to.be(1);
                        expect(vars.data.liveData).to.be(1);
                        expect(vars.data.hookData).to.be(1);
                        return {
                            orderId: content.id
                        };
                    },
                    fit: function (response, vars) {
                        expect(vars.data.fixData).to.be(1);
                        expect(vars.data.liveData).to.be(1);
                        expect(vars.data.hookData).to.be(1);
                        return response;
                    }
                }
            });

            context.api.order.create({
                liveData: 1
            }).then(function(data) {
                try {
                    expect(data.orderId).to.be(1);
                    done();
                } catch(e) {
                    done(e);
                }
            });
        });


        it('skip process data when it is mocking ', function (done) {
            context.create('order', {
                create: {
                    mock: true,
                    mockUrl: host + 'api/order-create',
                    process: function (response) {
                        if (this.mock) {
                            return response;
                        } else {
                            return {
                                orderId: response.id
                            };
                        }
                    }
                }
            });
            context.api.order.create().then(function(data) {
                try {
                    expect(data.id).to.be(1);
                    done();
                } catch(e) {
                    done(e);
                }
            });
        });

        it('error by requesting cross-domain with disabled header [NOTE: IE的行为已被标准化]', function (done) {
            context.create('order', {
                create: {
                    //log: true,
                    url: host + 'api/order-create',
                    method: 'POST',
                    header: {foo: 'foo'} // 跨域时, 自定义的`header`将被忽略
                }
            });

            context.api.order.create().then(function (data) {
                try {
                    expect(data.id).to.be(1);
                    done();
                } catch (e) {
                    done(e.message);
                }
            }, function(error) {
                // can not go here
            });
        });

        it('error by timeout', function (done) {
            context.create('order', {
                create: {
                    //log: true,
                    url: host + 'api/timeout',
                    method: 'POST',
                    timeout: 100
                }
            });
            context.api.order.create().then(function () {
                // can not go here
            }, function(error) {
                try {
                    expect(error.timeout).to.be(true);
                    done();
                } catch(e) {
                    done(e);
                }
            });
        });

        it('pending status checking', function (done) {
            context.create('order', {
                create: {
                    //log: true,
                    url: host + 'api/timeout',
                    method: 'POST',
                    timeout: 200
                }
            });
            context.api.order.create().then(function () {
                // can not go here
            }, function(error) {
                try {
                    expect(context.api.order.create.pending).to.be(false);
                    done();
                } catch(e) {
                    done(e);
                }
            });
            expect(context.api.order.create.pending).to.be(true);
        });

        it('error by 500', function (done) {
            context.create('order', {
                create: {
                    //log: true,
                    url: host + 'api/500',
                    method: 'POST'
                }
            });
            context.api.order.create().then(function () {
                // can not go here
            }, function(error) {
                try {
                    expect(error.status).to.be(nattyFetch.ajax.fallback ? undefined : 500);
                    done();
                } catch(e) {
                    done(e);
                }
            });
        });

        it('error by 404', function (done) {
            context.create('order', {
                create: {
                    url: host + 'api/404',
                    method: 'POST'
                }
            });

            // TODO
            context.on('reject', function (error) {
                console.warn(error);
            })
            context.api.order.create().then(function () {
                // can not go here
            })['catch'](function (error) {
                try {
                    if (!nattyFetch.ajax.fallback) {
                        // 即使是现代浏览器,也有status为0的情况
                        expect(error.status === 0 || error.status === 404).to.be(true);
                    } else {
                        expect(error.status).to.be(undefined);
                    }
                    done();
                } catch(e) {
                    done(e);
                }
            });
        });

        it('`GET` resolving after retry', function (done) {
            context.create('order', {
                create: {
                    url: host + 'api/retry-success',
                    method: 'GET',
                    retry: 2
                }
            });

            context.api.order.create().then(function (data) {
                try {
                    expect(data.id).to.be(1);
                    done();
                } catch(e) {
                    done(e);
                }
            }, function() {
                // can not go here
            });
        });

        it('`GET` with fn-data resolving after retry', function (done) {
            context.create('order', {
                create: {
                    url: host + 'api/retry-success',
                    method: 'GET',
                    retry: 2
                }
            });

            var count = 0;

            context.api.order.create(function () {
                return {
                    count: count++
                }
            }).then(function (data) {
                try {
                    expect(data.id).to.be(1);
                    done();
                } catch(e) {
                    done(e);
                }
            }, function() {
                // can not go here
            });
        });

        it('`POST` resolving after retry', function (done) {
            context.create('order', {
                create: {
                    url: host + 'api/retry-success',
                    method: 'POST',
                    retry: 2
                }
            });

            context.api.order.create().then(function (data) {
                try {
                    expect(data.id).to.be(1);
                    done();
                } catch(e) {
                    done(e);
                }
            }, function() {
                // can not go here
            });
        });

        it('rejecting after retry', function (done) {
            context.create('order', {
                create: {
                    url: host + 'api/return-error',
                    retry: 1
                }
            });
            context.api.order.create().then(function (data) {
                // can not go here
            }, function(error) {
                try {
                    expect(error.code).to.be(1);
                    done();
                } catch(e) {
                    done(e);
                }
            });
        });

        // 连发两次请求，第二次应该被忽略
        it('ignore seft concurrent', function (done) {

            context.create('order', {
                create: {
                    cache: false,
                    url: host + 'api/timeout', // 请求延迟返回的接口
                    ignoreSelfConcurrent: true
                }
            });

            context.api.order.create().then(function (data) {
                try {
                    expect(data.id).to.be(1);
                    done();
                } catch (e) {
                    done(e);
                }
            });

            // 第一次请求未完成之前 第二次请求返回的是一个伪造的promise对象
            var dummyPromise = context.api.order.create().then(function(){
                throw new Error('unexpected `resolved`');
            });
            expect(dummyPromise).to.have.property('dummy');

            // 伪造的promise对象要保证支持链式调用
            expect(dummyPromise.then()).to.be(dummyPromise);
            expect(dummyPromise.then().catch()).to.be(dummyPromise);
        });

        // 连发两次请求, 第二次请求发起时, 如果第一次请求还没有返回, 则取消掉第一次请求(即: 返回时不响应)
        it('override seft concurrent(XHR)', function (done) {

            context.create('order', {
                create: {
                    cache: false,
                    url: host + 'api/timeout', // 请求延迟返回的接口
                    overrideSelfConcurrent: true,
                    process: function(content, vars) {
                        // vars不应该混淆
                        expect(vars.data.d).to.be(2);
                    }
                }
            });

            var count = 0;

            // 第一次请求, 不应该有响应
            context.api.order.create({
                d: 1
            }).then(function (data) {
                count++
            });

            // 第二次请求, 只响应这次请求
            setTimeout(function(){
                context.api.order.create({
                    d:2
                }).then(function (data) {
                    try {
                        expect(count).to.be(0);
                        done();
                    } catch (e) {
                        done(e);
                    }
                });
            }, 300);
        });

        // 连发两次请求, 第二次请求发起时, 如果第一次请求还没有响应, 则取消掉第一次请求(的响应)
        it('override seft concurrent(JSONP)', function (done) {

            context.create('order', {
                create: {
                    cache: false,
                    jsonp: true,
                    url: host + 'api/jsonp-timeout', // 请求延迟返回的接口
                    overrideSelfConcurrent: true,
                    process: function(content, vars) {
                        // vars不应该混淆
                        expect(vars.data.d).to.be(2);
                    }
                }
            });

            var count = 0;

            // 第一次请求, 不应该有响应
            context.api.order.create({
                d: 1
            }).then(function (data) {
                count++
            });

            // 第二次请求, 只响应这次请求
            setTimeout(function(){
                context.api.order.create({
                    d:2
                }).then(function (data) {
                    try {
                        expect(count).to.be(0);
                        done();
                    } catch (e) {
                        done(e);
                    }
                });
            }, 300);
        });
    });


    describe('jsonp', function () {
        // NOTE 重要: 为了能够测试完整的场景, 默认已经全局关闭所有请求的浏览器缓存!!!  比如: ignoreSelfConcurrent
        //nattyFetch.setGlobal({
        //    cache: false
        //});

        this.timeout(1000*10);
        var context;

        beforeEach('reset', function () {
            context = nattyFetch.context({
                urlPrefix: host,
                mock: false
            });
        });

        it('check default jsonpCallbackQuery', function () {
            context.create('order', {
                create: {
                    url: host + 'api/order-create',
                    jsonp: true
                }
            });

            expect(context.api.order.create.config.jsonpCallbackQuery).to.be(undefined);
        });

        it('check custom jsonpCallbackQuery', function () {
            context.create('order', {
                create: {
                    url: host + 'api/order-create',
                    jsonp: [true, 'cb', 'j{id}']
                }
            });

            expect(context.api.order.create.config.jsonp).to.be(true);
            expect(context.api.order.create.config.jsonpFlag).to.be('cb');
            expect(context.api.order.create.config.jsonpCallbackName).to.be('j{id}');
        });

        it('auto detect jsonp option', function () {
            context.create('order', {
                create: {
                    url: host + 'api/order-create.jsonp'
                }
            });

            expect(context.api.order.create.config.jsonp).to.be(true);
        });

        it('jsonp response.success is true', function (done) {
            context.create('order', {
                create: {
                    traditional: true,
                    data: {
                        a: [1,2,3]
                    },
                    //log: true,
                    url: host + 'api/jsonp-order-create',
                    jsonp: true
                }
            });

            context.api.order.create().then(function (data) {

                try {
                    expect(data.id).to.be(1);
                    done();
                } catch (e) {
                    done(e);
                }
            });
        });

        it('jsonp response.success is false ', function (done) {
            context.create('order', {
                create: {
                    //log: true,
                    url: host + 'api/jsonp-order-create-error',
                    jsonp: true
                }
            });

            context.api.order.create().then(function (data) {
                // can not go here
            }, function (error) {
                try {
                    expect(error).to.have.property('message');
                    done();
                } catch (e) {
                    done(e);
                }
            });
        });

        // jsonp无法使用状态吗识别出具体的404、500等错误，都统一成`无法连接`的错误信息
        it('jsonp with error url', function (done) {
            context.create('order', {
                create: {
                    url: host + 'error-url',
                    jsonp: true
                }
            });

            // TODO
            context.on('reject', function (error) {
                console.warn(error);
            });

            context.api.order.create().then(function (data) {
                // can not go here
            }, function (error) {
                try {
                    expect(error.message).to.contain('Not Accessable JSONP');
                    done();
                } catch (e) {
                    done(e);
                }
            });
        });

        it('jsonp timeout', function (done) {
            context.create('order', {
                create: {
                    //log: true,
                    url: host + 'api/jsonp-timeout',
                    jsonp: true,
                    timeout: 300
                }
            });
            context.api.order.create().then(function () {
                // can not go here
            }, function(error) {
                try {
                    expect(error.timeout).to.be(true);
                    done();
                } catch(e) {
                    done(e);
                }
            });
        });

        it('`JSONP` resolving after retry', function (done) {
            context.create('order', {
                create: {
                    url: host + 'api/jsonp-retry-success',
                    jsonp: true,
                    retry: 2
                }
            });

            context.api.order.create().then(function (data) {
                try {
                    expect(data.id).to.be(1);
                    done();
                } catch(e) {
                    done(e);
                }
            }, function() {
                // can not go here
            });
        });

        it('rejecting after retry', function (done) {
            context.create('order', {
                create: {
                    url: host + 'api/jsonp-error',
                    jsonp: true,
                    retry: 1
                }
            });
            context.api.order.create().then(function (data) {
                // can not go here
            }, function(error) {
                try {
                    expect(error.code).to.be(1);
                    done();
                } catch(e) {
                    done(e);
                }
            });
        });

        it('ignore self concurrent', function (done) {
            context.create('order', {
                create: {
                    url: host + 'api/jsonp-timeout', // 请求延迟返回的接口
                    jsonp: true,
                    ignoreSelfConcurrent: true
                }
            });

            // 连发两次请求，第二次应该被忽略
            context.api.order.create().then(function (data) {
                try {
                    expect(data.id).to.be(1);
                    done();
                } catch (e) {
                    done(e);
                }
            });

            // 第一次请求未完成之前 第二次请求返回的是一个伪造的promise对象
            var dummyPromise = context.api.order.create();
            expect(dummyPromise).to.have.property('dummy');

            // 伪造的promise对象要保证支持链式调用
            expect(dummyPromise.then()).to.be(dummyPromise);
            expect(dummyPromise.then().catch()).to.be(dummyPromise);
        });
    });

});

var ref = nattyFetch._util;
var appendQueryString = ref.appendQueryString;
var isAbsoluteUrl = ref.isAbsoluteUrl;
var isNumber = ref.isNumber;
var param = ref.param;
var decodeParam = ref.decodeParam;
var isIE = ref.isIE;
var isCrossDomain = ref.isCrossDomain;
var sortPlainObjectKey = ref.sortPlainObjectKey;

describe('./util', function () {
    describe('param', function () {
        it("{a:'b c', d:['e+f',{g:'h', i:['j','k']}]}", function () {
            expect(decodeParam(param({a:'b c', d:['e+f',{g:'h', i:['j','k']}], l:true, m:0})))
                .to.be("a=b c&d[]=e+f&d[1][g]=h&d[1][i][]=j&d[1][i][]=k&l=true&m=0");
        });
        it("{ id: function(){ return 1 + 2 } }", function () {
            expect(param({ id: function(){ return 1 + 2 } })).to.be('id=3');
        });
        it("param({ foo: 'bar', nested: { will: 'be ignored' }}, true)", function () {
            expect(decodeParam(param({ foo: 'bar', nested: { will: 'be ignored' }}, true)))
                .to.be("foo=bar&nested=[object Object]");
        });
        it("param({ foo: [1, 2]}, true)", function () {
            expect(decodeParam(param({ foo: [1, 2]}, true))).to.be("foo=1&foo=2");
        });
        it("param({ foo: [1, 2]})", function () {
            expect(decodeParam(param({ foo: [1, 2]}))).to.be("foo[]=1&foo[]=2");
        });
    });
    describe('appendQueryString', function () {
        it("appendQueryString('./p', {})", function () {
            expect(appendQueryString('./p', {})).to.be('./p');
        });
        it("appendQueryString('./p', {foo:'foo'})", function () {
            expect(appendQueryString('./p', {foo:'foo'})).to.be('./p?foo=foo');
        });
        it("appendQueryString('./p?bar=bar', {foo:'foo'})", function () {
            expect(appendQueryString('./p?bar=bar', {foo:'foo'})).to.be('./p?bar=bar&foo=foo');
         });
    });
    describe('isAbsoluteUrl', function () {
        it('`https://path` should be a absolute url', function () {
            expect(isAbsoluteUrl('https://path')).to.be(true);
        });
        it('`http://path` should be a absolute url', function () {
            expect(isAbsoluteUrl('http://path')).to.be(true);
        });
        it('`//path` should be a absolute url', function () {
            expect(isAbsoluteUrl('//path')).to.be(true);
        });
        it('`path//path` should not be a absolute url', function () {
            expect(isAbsoluteUrl('foo//path')).to.be(false);
        });
    });
    describe('isNumber', function () {
        it('NaN', function () {
            expect(isNumber(NaN)).to.be(false);
        });
        it('1', function () {
            expect(isNumber(1)).to.be(true);
        })
    });

    describe('protocol', function(){

        it('location protocol', function () {
            var link = document.createElement('a');
            link.href = location.href;
            expect(link.protocol).to.be('http:');
        });

        it('foo.json protocol (IE diff)', function () {
            var link = document.createElement('a');
            link.href = 'foo.json';
            expect(link.protocol).to.be(isIE ? ':' : 'http:');
        });

        it('//www.foo.com/json protocol (IE diff)', function () {
            var link = document.createElement('a');
            link.href = '//www.foo.com/json';
            expect(link.protocol).to.be(isIE ? ':' : 'http:');
        });

        it('https://www.foo.com/json protocol', function () {
            var link = document.createElement('a');
            link.href = 'https://www.foo.com/json';
            expect(link.protocol).to.be('https:');
        });
    });

    describe('hostname', function(){

        var originA = document.createElement('a');
        originA.href = location.href;

        it('location hostname', function () {
            var link = document.createElement('a');
            link.href = location.href;
            expect(link.hostname).to.be(originA.hostname);
        });

        it('foo.json hostname (IE diff)', function () {
            var link = document.createElement('a');
            link.href = 'foo.json';
            expect(link.hostname).to.be(isIE ? '' : originA.hostname);
        });

        it('//www.foo.com/json hostname', function () {
            var link = document.createElement('a');
            link.href = '//www.foo.com/json';
            expect(link.hostname).to.be('www.foo.com');
        });

        it('https://www.foo.com/json hostname', function () {
            var link = document.createElement('a');
            link.href = 'https://www.foo.com/json';
            expect(link.hostname).to.be('www.foo.com');
        });
    });

    describe('isCrossDomain', function(){
        var originA = document.createElement('a');
        originA.href = location.href;

        it('foo.json', function () {
            expect(isCrossDomain('foo.json')).to.be(false);
        });

        it('../foo.json', function () {
            expect(isCrossDomain('../foo.json')).to.be(false);
        });

        it('www.foo.com/json', function () {
            expect(isCrossDomain('www.foo.com/json')).to.be(false);
        });

        it('//www.foo.com/json', function () {
            expect(isCrossDomain('//www.foo.com/json')).to.be(true);
        });

        it('absolute path', function () {
            expect(isCrossDomain(originA.protocol + '//' + originA.hostname + ':' + originA.port)).to.be(false);
        });

        it('different protocal', function () {
            expect(isCrossDomain('https://' + originA.hostname)).to.be(true);
        });

        it('different port', function () {
            expect(isCrossDomain(originA.protocol + '//' + originA.hostname + ':9876')).to.be(true);
        });

        it('https://www.foo.com/json', function () {
            expect(isCrossDomain('https://www.foo.com/json')).to.be(true);
        });
    });

    describe('isSameQueryStringFromObject', function () {

        var isSameQueryStringFromObject = function (obj1, obj2) {
            return JSON.stringify(sortPlainObjectKey(obj1)) === JSON.stringify(sortPlainObjectKey(obj2));
        };

        it('turn to the same query string', function () {
            // 两个对象, 只有键的顺序不一样, 应该转出一样的`query string`
            expect(isSameQueryStringFromObject({
                c: 'c',
                b: 'b',
                a: {
                    c:'c',
                    a:'a'
                },
                d: ['b', 'a']
            }, {
                b: 'b',
                c: 'c',
                d: ['b', 'a'],
                a: {
                    a:'a',
                    c:'c'
                }
            })).to.be(true);
        });
    })
});

function ExpectAction() {
    this.reset();
}

ExpectAction.prototype.do = function (action) {
    this.actualEvents.push(action);
}

ExpectAction.prototype.count = function () {
    this.count++;
}

ExpectAction.prototype.expect = function (events) {
    this.expectEvents = events;
}

ExpectAction.prototype.reset = function () {
    var t = this;
    t.expectEvents = [];
    t.actualEvents = [];
    t.count = 0;
}

ExpectAction.prototype.check = function () {
    expect(this.actualEvents).to.eql(this.expectEvents);
}

var ajax = nattyFetch.ajax;

describe('./ajax', function () {

    describe('dependent detects', function () {
        it('support `CORS`', function () {
            expect(nattyFetch.ajax.supportCORS).to.be(true);
        });
    });

    describe('browser detects：NOT used in nattyFetch', function () {
        var xhr = new XMLHttpRequest();

        var methods = ['loadstart', 'load', 'progress', 'error', 'timeout'];

        methods.forEach(function (method) {
            it('support `' + method + '` event: ' + ('on' + method in xhr), function () {
                
            });
        });

        // http://enable-cors.org/index.html
        it('support `CORS`: ' + ('withCredentials' in xhr), function () {
            
        });
    });

    describe('post', function () {
        it('accept text', function (done) {
            ajax({
                url: host + 'api/return-text',
                method: 'POST',
                data: {
                    'return-text': 1
                },
                success: function (res, xhr) {
                    expect(res).to.be('text');
                    done();
                }
            });
        });

        it('accept json', function (done) {
            ajax({
                url: host + 'api/return-json',
                method: 'POST',
                data: {
                    'return-json': 1
                },
                accept: 'json',
                success: function (res, xhr) {
                    expect(res).to.eql({tool: 'natty-fetch'});
                    done();
                }
            });
        });

        it('accept script', function (done) {
            ajax({
                url: host + 'api/return-script',
                method: 'POST',
                data: {
                    'return-script': 1
                },
                accept: 'script',
                success: function (res, xhr) {
                    expect(__test__).to.be(1);
                    window.__test__ = null;
                    done();
                }
            });
        });
    });


    describe('event', function () {
        var ea = new ExpectAction();

        beforeEach('reset expectEvents', function () {
            ea.reset();
        });

        afterEach('check expectEvents', function () {
            ea.check();
        });

        it('should trigger success and complete', function (done) {

            ea.expect(['success', 'complete']);

            ajax({
                url: host + 'api/return-json',
                method: 'POST',
                data: {
                    'return-json-success': 1
                },
                success: function (res, xhr) {
                    ea.do('success');
                },
                complete: function () {
                    ea.do('complete');
                    done();
                }
            });
        });

        it('should trigger success and complete when request the cross-domain with disabled header', function (done) {

            ea.expect(['success', 'complete']);

            ajax({
                //log: true,
                url: host + 'api/return-json',
                method: 'POST',
                data: {
                    'cross-domain-with-disabled-header': 1
                },
                // 使用不合法的Header来触发跨域失败
                header: {foo: 'foo'},
                accept: 'json',
                success: function (status, xhr) {
                    ea.do('success');
                },
                complete: function () {
                    ea.do('complete');
                    done();
                }
            });
        });

        it('should trigger error and complete when 500', function (done) {

            ea.expect(['error', 'complete']);

            ajax({
                //log: true,
                url: host + 'api/500',
                method: 'POST',
                accept: 'json',
                error: function (status, xhr) {
                    ea.do('error');
                },
                complete: function () {
                    ea.do('complete');
                    done();
                }
            });
        });

        it('should trigger error and complete when 404', function (done) {
            ea.expect(['error', 'complete']);

            ajax({
                //log: true,
                url: host + 'api/404',
                method: 'POST',
                accept: 'json',
                error: function (status, xhr) {
                    ea.do('error');
                },
                complete: function () {
                    ea.do('complete');
                    done();
                }
            });
        });

        it('should trigger abort and complete when request is aborted', function (done) {

            ea.expect(['abort', 'complete']);

            var xhr = ajax({
                //log: true,
                url: host + 'api/abort',
                method: 'POST',
                abort: function () {
                    ea.do('abort');
                },
                complete: function () {
                    ea.do('complete');
                }
            });
            setTimeout(function () {
                xhr.abort();
                done();
            }, 100);
        });

        it('calling `abort` after `complete` event should be ignored', function (done) {
            this.timeout(5000);
            ea.expect(['success', 'complete']);

            var xhr = ajax({
                log: true,
                url: host + 'api/return-json',
                method: 'POST',
                success: function () {
                    ea.do('success');
                },
                complete: function () {
                    ea.do('complete');
                }
            });
            setTimeout(function () {
                xhr.abort();
                done();
            }, 1000);
        });
    });
});

describe('./hooks', function(){

    describe('willFetch', function(){

        this.timeout(1000*60);

        it('ajax willFetch call', function (done) {
            var context = nattyFetch.context({
                urlPrefix: host,
                willFetch: function willFetch() {
                    done()
                }
            })
            context.create({
                getApi: {
                    url: 'api/return-json',
                    fit: function fit(resp) {
                        return {
                            success: true,
                            content: resp
                        }
                    }
                }
            })
            context.api.getApi().then(function (content) {})
        })

        it('jsonp willFetch call', function (done) {
            var context = nattyFetch.context({
                urlPrefix: host,
                willFetch: function willFetch() {
                    done()
                }
            })
            context.create({
                getApi: {
                    url: 'api/jsonp-order-create',
                    jsonp: true,
                    fit: function fit(resp) {
                        return resp
                    }
                }
            })
            context.api.getApi().then(function (content) {})
        })

    })

    describe('didFetch', function(){

        it('ajax success didFetch', function (done) {
            var context = nattyFetch.context({
                urlPrefix: host
            })
            context.create({
                getApi: {
                    url: 'api/return-json',
                    fit: function fit(resp) {
                        return {
                            success: true,
                            content: resp
                        }
                    },
                    didFetch: function didFetch(config) {
                        //console.log(config)
                        done()
                    }
                }
            })
            context
                .api
                .getApi()
                .then(function (content) {
                })
        })

        it('jsonp success didFetch long time', function (done) {
            var context = nattyFetch.context({
                urlPrefix: host
            })
            context.create({
                getApi: {
                    url: 'api/jsonp-timeout',
                    jsonp: true,
                    timeout: 2000,
                    fit: function fit(resp) {
                        return {
                            success: true,
                            content: resp
                        }
                    },
                    didFetch: function didFetch(config) {
                        //console.log(config)
                        done()
                    }
                }
            })
            context
                .api
                .getApi()
                .then(function (content) {
                })
        })

        it('ajax error didFetch', function (done) {
            var context = nattyFetch.context({
                urlPrefix: host
            })
            context.create({
                getApi: {
                    url: 'api/return-error',
                    fit: function fit(resp) {
                        return resp
                    },
                    didFetch: function didFetch(config) {
                        //console.log(config)
                        done()
                    }
                }
            })
            context
                .api
                .getApi()
                .then(function (content) {
                }, function (reason) {
                    //console.log(reason)
                })
        })

        it('jsonp error didFetch', function (done) {
            var context = nattyFetch.context({
                urlPrefix: host,
                jsonp: true
            })
            context.create({
                getApi: {
                    url: 'api/jsonp-order-create-error',
                    fit: function fit(resp) {
                        return resp
                    },
                    didFetch: function didFetch(config) {
                        //console.log(config)
                        done()
                    }
                }
            })
            context
                .api
                .getApi()
                .then(function (content) {
                }, function (reason) {
                    //console.log(reason)
                })
        })

        it('ajax timeout should NOT fire `didFetch`', function (done) {
            var context = nattyFetch.context({
                urlPrefix: host,
                timeout: 300
            });
            var count = 0;
            context.create({
                getApi: {
                    url: 'api/timeout',
                    didFetch: function didFetch() {
                        // timeout时不应该调用didFetch
                        count++
                    }
                }
            });

            context.api.getApi().then(function () {

            }).catch(function () {
                try {
                    expect(count).to.be(0);
                    done();
                } catch (e) {
                    done(e);
                }
            });
        })

        it('jsonp timeout should NOT fire `didFetch`', function (done) {
            var context = nattyFetch.context({
                urlPrefix: host,
                jsonp: true,
                timeout: 300
            });

            var count = 0;
            context.create({
                getApi: {
                    url: 'api/jsonp-timeout',
                    didFetch: function didFetch() {
                        // timeout时不应该调用didFetch
                        count++
                    }
                }
            });

            context.api.getApi().then(function () {

            }).catch(function () {
                try {
                    expect(count).to.be(0);
                    done();
                } catch (e) {
                    done(e);
                }
            });
        })

    })

})

describe('storage', function () {

    this.timeout(1000*10);
    var context;

    beforeEach('reset', function () {
        context = nattyFetch.context({
            urlPrefix: host,
            mock: false,
        });
    });

    it('query string is same: localStorage', function (done) {
        var requestTime = 0;
        context.create('user', {
            getPhone: {
                url: host + 'api/return-success',
                willFetch: function (vars, config, from) {
                    if (from === 'remote') {
                        requestTime++;
                    }
                },
                storage: {
                    type: 'localStorage',
                    tag: 'v1.0',
                    key: 'test-query-string'
                }
            }
        });

        // 第一次请求走网络
        context.api.user.getPhone({
            b:1,
            a:1
        }).then(function (r) {
            // 第二次请求走storage
            return context.api.user.getPhone({
                a:1,
                b:1
            });
        }).then(function (data) {
            try {
                expect(data.id).to.be(1);
                expect(requestTime).to.be(1);
                done();
            } catch (e) {
                done(e);
            }
            // 特别注意 expect不管是否成功, 都要销毁storage, 避免下次刷新后的测试
            context.api.user.getPhone.storage.destroy();

        }).catch();
    });

    it('query string is same: sessionStorage', function (done) {
        var requestTime = 0;
        context.create('user', {
            getPhone: {
                url: host + 'api/return-success',
                willFetch: function (vars, config, from) {
                    if (from === 'remote') {
                        requestTime++;
                    }
                },
                storage: {
                    type: 'sessionStorage',
                    tag: 'v1.0'
                }
            }
        });

        // 第一次请求走网络
        context.api.user.getPhone({
            b:1,
            a:1
        }).then(function (r) {
            // 第二次请求走storage
            return context.api.user.getPhone({
                a:1,
                b:1
            });
        }).then(function (data) {
            try {
                expect(data.id).to.be(1);
                expect(requestTime).to.be(1);
                done();
            } catch (e) {
                done(e);
            }
            // 特别注意 expect不管是否成功, 都要销毁storage, 避免下次刷新后的测试
            context.api.user.getPhone.storage.destroy();

        }).catch();
    });

    //
    it('query string is same: variable', function (done) {
        var requestTime = 0;
        context.create('user', {
            getPhone: {
                url: host + 'api/return-success',
                willFetch: function (vars, config, from) {
                    if (from === 'remote') {
                        requestTime++;
                    }
                },
                storage: {
                    type: 'variable',
                    tag: 'v1.0'
                }
            }
        });

        // 第一次请求走网络
        context.api.user.getPhone({
            b:1,
            a:1
        }).then(function (r) {
            // 第二次请求走storage
            return context.api.user.getPhone({
                a:1,
                b:1
            });
        }).then(function (data) {
            try {
                expect(data.id).to.be(1);
                expect(requestTime).to.be(1);
                done();
            } catch (e) {
                done(e);
            }
        }).catch();
    });

    it('query string is same with jsonp', function (done) {
        var requestTime = 0;
        context.create('user', {
            getPhone: {
                jsonp: true,
                url: host + 'api/jsonp-order-create',
                willFetch: function (vars, config, from) {
                    if (from === 'remote') {
                        requestTime++;
                    }
                },
                storage: {
                    type: 'localStorage',
                    tag: 'v1.0',
                    key: 'test-jsonp-with-storage'
                }
            }
        });

        // 第一次请求走网络
        context.api.user.getPhone({
            b:1,
            a:1
        }).then(function (r) {
            // 第二次请求走storage
            return context.api.user.getPhone({
                a:1,
                b:1
            });
        }).then(function (data) {
            try {
                expect(data.id).to.be(1);
                expect(requestTime).to.be(1);
                done();
            } catch (e) {
                done(e);
            }
            // 特别注意 expect不管是否成功, 都要销毁storage, 避免下次刷新后的测试
            context.api.user.getPhone.storage.destroy();
        }).catch();
    });

    it('query string is different', function (done) {
        var requestTime = 0;
        context.create({
            get: {
                url: host + 'api/return-success',
                willFetch: function (vars, config, from) {
                    if (from === 'remote') {
                        requestTime++;
                    }
                },
                storage: true
            }
        });

        // 第一次请求走网络
        context.api.get({
            b:1,
            a:1
        }).then(function () {
            // 第二次请求, 参数不一样, 依然走网络
            return context.api.get({
                a:1
            });
        }).then(function (data) {
            try {
                expect(data.id).to.be(1);
                expect(requestTime).to.be(2);
                done();
            } catch (e) {
                done(e);
            }
            // 特别注意 expect不管是否成功, 都要销毁storage, 避免下次刷新后的测试
            context.api.get.storage.destroy();
        }).catch();
    });


    it('no query string', function (done) {
        var requestTime = 0;
        context.create({
            get: {
                url: host + 'api/return-success',
                willFetch: function (vars, config, from) {
                    if (from === 'remote') {
                        requestTime++;
                    }
                },
                storage: true
            }
        });

        // 第一次请求走网络
        context.api.get().then(function () {
            // 第二次请求, 走storage
            return context.api.get();
        }).then(function (data) {
            try {
                expect(data.id).to.be(1);
                expect(requestTime).to.be(1);
                done();
            } catch (e) {
                done(e);
            }
            // 特别注意 expect不管是否成功, 都要销毁storage, 避免下次刷新后的测试
            context.api.get.storage.destroy();
        }).catch();
    });

    it('`POST` request with `storage` on should throw an error', function () {
        var requestTime = 0;
        var errorFn = function () {
            context.create({
                get: {
                    url: host + 'api/return-success',
                    method: 'POST',
                    storage: true
                }
            })
        }
        expect(errorFn).to.throwError();
    });
});

describe('plugin', function () {

    it('options.plugins should been merged, NOT overrided.', function () {

        var context = nattyFetch.context({
            urlPrefix: host,
            plugins: [
                nattyFetch.plugin.soon
            ]
        });

        context.create({
            foo: {
                url: host + 'api/return-success',
                plugins: [
                    nattyFetch.plugin.loop
                ]
            }
        });

        expect(context.api.foo.soon).to.be.a('function');
        expect(context.api.foo.loop).to.be.a('function');
    });
});

describe('plugin soon', function () {
    it('`soon` method with `storage` is open', function (done) {
        var context = nattyFetch.context({
            urlPrefix: host,
            mock: false
        });

        var outerCount = 0;
        var innerCount = 0;
        var requestCount = 0;

        context.create({
            'foo.get': {
                url: host + 'api/return-stamp',
                storage: true,
                willFetch: function (vars, config, from) {
                    if (from === 'remote') {
                        requestCount++;
                    }
                },
                plugins: [
                    nattyFetch.plugin.soon
                ]
            }
        });

        // 外层请求, 首次请求没有storage缓存, success回调只应该执行一次, 数据来自远程服务器
        var outerData;
        var innerDataFromStorage;
        
        context.api.foo.get.soon({
            q: 1
        }, function (data) {
            outerCount++;
            outerData = data;
            // console.log('data', JSON.stringify(data));
            // 内层请求, 参数一致, 应该有storage缓存, success回调应该执行2次,
            context.api.foo.get.soon({
                q:1
            }, function (data2) {
                innerCount++;
                if (innerCount === 1) {
                    innerDataFromStorage = data2;
                }
                // console.log('data2', JSON.stringify(data2));
            });
        }, function (e) {
            done(e);
        });

        setTimeout(function () {
            try {
                expect(outerCount).to.be(1);
                expect(innerCount).to.be(2);
                expect(requestCount).to.be(2);
                expect(outerData.fromStorage).to.be(false);
                expect(innerDataFromStorage.fromStorage).to.be(true);
                expect(JSON.stringify(outerData.content)).to.be(JSON.stringify(innerDataFromStorage.content));
                context.api.foo.get.storage.destroy();
                done();
            } catch (e) {
                done(e);
            }
        }, 800);
    });

    it('`soon` method with `storage` is closed', function (done) {

        var context = nattyFetch.context({
            urlPrefix: host,
            mock: false
        });

        var outerCount = 0;
        var innerCount = 0;
        var requestCount = 0;

        context.create({
            'foo.get': {
                url: host + 'api/return-stamp',
                storage: false,
                willFetch: function (vars, config, from) {
                    if (from === 'remote') {
                        requestCount++;
                    }
                },
                plugins: [
                    nattyFetch.plugin.soon
                ]
            }
        });

        // 外层请求, 首次请求没有storage缓存, success回调只应该执行一次, 数据来自远程服务器
        var outerData;
        var innerDataFromStorage;
        context.api.foo.get.soon({
            q: 1
        }, function (data) {
            outerCount++;
            outerData = data;
            // console.log('data', JSON.stringify(data));
            // 内层请求, 没有storage缓存, success回调只应该执行一次,
            context.api.foo.get.soon({
                q:1
            }, function (data2) {
                innerCount++;
                innerDataFromStorage = data2;
                // console.log('data2', JSON.stringify(data2));
            });
        }, function (e) {
            done(e);
        });

        setTimeout(function () {
            try {
                expect(outerCount).to.be(1);
                expect(innerCount).to.be(1);
                expect(requestCount).to.be(2);
                expect(outerData.fromStorage).to.be(false);
                expect(innerDataFromStorage.fromStorage).to.be(false);
                expect(JSON.stringify(outerData.content)).not.to.be(JSON.stringify(innerDataFromStorage.content));
                done();
            } catch (e) {
                done(e);
            }
        }, 800);
    });
});

describe('plugin loop', function () {
    // it('loop 2x', function (done) {
    //     this.timeout(1000*600);
    //     let context = nattyFetch.context({
    //         urlPrefix: host,
    //         mock: false
    //     });
    //
    //     context.create('taxi', {
    //         getDriverNum: {
    //             url: host + 'api/return-success',
    //             plugins: [
    //                 nattyFetch.plugin.loop
    //             ]
    //         }
    //     });
    //
    //     let time = 0;
    //
    //     // 开始轮询
    //     let stop1 = context.api.taxi.getDriverNum.loop({
    //         data: {
    //             loop: '__1__'
    //         },
    //         duration: 1000
    //     }, function (data) {
    //         // 成功回掉
    //         time++;
    //     }, function (error) {
    //         // 失败回调
    //     });
    //
    //     // 开始轮询
    //     let stop2 = context.api.taxi.getDriverNum.loop({
    //         data: {
    //             loop: '__2__'
    //         },
    //         duration: 1000
    //     }, function (data) {
    //         // 成功回掉
    //         time++;
    //     }, function (error) {
    //         // 失败回调
    //     });
    //
    //     setTimeout(function () {
    //         // expect(time).to.be.above(1);
    //         // 验证状态
    //         // expect(context.api.taxi.getDriverNum.looping).to.be(true);
    //         // 停止轮询
    //         stop1();
    //         // 验证状态
    //         // expect(context.api.taxi.getDriverNum.looping).to.be(false);
    //         // done();
    //     }, 5000);
    //
    //     setTimeout(function () {
    //         // expect(time).to.be.above(1);
    //         // 验证状态
    //         // expect(context.api.taxi.getDriverNum.looping).to.be(true);
    //         // 停止轮询
    //         stop2();
    //         // 验证状态
    //         // expect(context.api.taxi.getDriverNum.looping).to.be(false);
    //         // done();
    //     }, 8000);
    //
    //
    //     setInterval(function () {
    //         console.log('1:', stop1.looping);
    //         console.log('2:', stop2.looping);
    //     }, 1000)
    // });



    it('loop', function (done) {

        var context = nattyFetch.context({
            urlPrefix: host,
            mock: false
        });

        context.create('taxi', {
            getDriverNum: {
                url: host + 'api/return-success',
                plugins: [
                    nattyFetch.plugin.loop
                ]
            }
        });

        var time = 0;

        // 开始轮询
        var stop = context.api.taxi.getDriverNum.loop({
            data: {},
            duration: 200
        }, function (data) {
            // 成功回掉
            time++;
        }, function (error) {
            // 失败回调
        });

        setTimeout(function () {
            expect(time).to.be.above(1);
            // 验证状态
            expect(stop.looping).to.be(true);
            // 停止轮询
            stop();
            // 验证状态
            expect(stop.looping).to.be(false);
            done();
        }, 1000);
    });
});

describe.skip('plugin customRequest', function () {
    this.timeout(1000*10);
    it('customRequest', function (done) {

        var context = nattyFetch.context({
            urlPrefix: host,
            mock: false
        });

        var ref = nattyFetch._util;
        var appendQueryString = ref.appendQueryString;
        var extend = ref.extend;
        var param = ref.param;
        var lwp = function (apiInstance) {
            // 只有get/post才使用lwp
            if (apiInstance.config.jsonp) {
                return;
            }
            apiInstance.config.customRequest = function (vars, config, defer) {
                var isPOST = config.method === 'POST';

                var lwpOptions = {
                    uri: isPOST ? config.url : appendQueryString(config.url, extend(vars.mark, vars.data, config.traditional)),
                    method: config.method,
                    headers: config.header,
                    body: isPOST ? param(vars.data, config.traditional) : '',
                    onSuccess: function (res) {
                        if (res.statusCode == 200) {
                            apiInstance.processResponse(vars, config, defer, JSON.parse(res.responseText));
                        } else {
                            defer.reject({
                                statusCode: res.statusCode,
                                message: res.statusText
                            });
                        }
                    },
                    onError: function (error) {
                        defer.reject(error);
                    }
                };
                dd.internal.request.httpOverLWP(lwpOptions);
            }
        }

        context.create({
            foo: {
                url: 'http://120.26.213.24:3000/api/xhr-success',
                method: 'POST',
                data: {gg:'a'},
                plugins: [
                    lwp
                ]
            },
            boo: {
                url: 'http://120.26.213.24:3000/api/xhr-failed',
                plugins: [
                    lwp
                ]
            },
            boo500: {
                url: 'http://120.26.213.24:3000/api/500',
                plugins: [
                    lwp
                ]
            },
            boo404: {
                url: 'http://example404.com/',
                plugins: [
                    lwp
                ]
            },
        });

        context.api.foo({hh:'a'}).then(function (content) {
            console.log('foo');
            console.log(content);
            done();
        });

        // context.api.boo().then(function (content) {
        //
        // }).catch(function (error) {
        //     console.log('boo');
        //     console.log(error);
        //     // done();
        // });
        //
        // context.api.boo500().then(function (content) {
        //
        // }).catch(function (error) {
        //     console.log('500');
        //     console.log(error);
        //
        // });
        //
        // context.api.boo404().then(function (content) {
        //
        // }).catch(function (error) {
        //     console.log('404');
        //     console.log(error);
        //
        // });
    });
});

var xit = function(ignore, fn) {
    fn();
}
xit.xonly = xit;

describe('nattyFetch.create', function () {

    this.timeout(1000*30);

    it('play with standard data structure', function (done) {
        var fooFetch = nattyFetch.create({
            urlPrefix: host,
            url: 'api/order-create',
            method: 'POST',
            //traditional: true
        });

        fooFetch().then(function(data) {
            try {
                expect(data.id).to.be(1);
                done();
            } catch(e) {
                done(e);
            }
        });
    });

    it('play with non-standard data structure by `fit`', function (done) {
        var fooFetch = nattyFetch.create({
            url: host + 'api/order-create-non-standard',
            method: 'POST',
            fit: function (response) {
                return {
                    success: !response.hasError,
                    content: response.content
                };
            }
        });

        fooFetch().then(function(data) {
            try {
                expect(data.id).to.be(1);
                done();
            } catch(e) {
                done(e);
            }
        });
    });

    it('process data', function (done) {

        var fooFetch = nattyFetch.create({
            url: host + 'api/order-create',
            method: 'POST',
            process: function (content) {
                return {
                    orderId: content.id
                };
            }
        });

        fooFetch().then(function(content) {
            try {
                expect(content.orderId).to.be(1);
                done();
            } catch(e) {
                done(e);
            }
        });
    });

    // 固定参数和动态参数 在process和fix方法中都可以正确获取到
    it('`vars.data` in process or fix method', function (done) {
        var fooFetch = nattyFetch.create({
            url: host + 'api/order-create',
            method: 'POST',
            data: {
                liveData: 1
            },
            willFetch: function (vars, config) {
                vars.data.hookData = 1;
                // console.log(vars);
                // console.log(config);
                // console.log(this);
            },
            process: function (content, vars) {
                expect(vars.data.liveData).to.be(1);
                expect(vars.data.hookData).to.be(1);
                return {
                    orderId: content.id
                };
            },
            fit: function (response, vars) {
                expect(vars.data.liveData).to.be(1);
                expect(vars.data.hookData).to.be(1);
                return response;
            }
        });

        fooFetch().then(function(data) {
            try {
                expect(data.orderId).to.be(1);
                done();
            } catch(e) {
                done(e);
            }
        });
    });


    it('skip process data when it is mocking ', function (done) {
        var fooFetch = nattyFetch.create({
            mock: true,
            mockUrl: host + 'api/order-create',
            process: function (response) {
                if (this.mock) {
                    return response;
                } else {
                    return {
                        orderId: response.id
                    };
                }
            }
        });

        fooFetch().then(function(data) {
            try {
                expect(data.id).to.be(1);
                done();
            } catch(e) {
                done(e);
            }
        });
    });

    it('error by requesting cross-domain with disabled header [NOTE: IE的行为已被标准化]', function (done) {
        var fooFetch = nattyFetch.create({
            //log: true,
            url: host + 'api/order-create',
            method: 'POST',
            header: {foo: 'foo'} // 跨域时, 自定义的`header`将被忽略
        });

        fooFetch().then(function (data) {
            try {
                expect(data.id).to.be(1);
                done();
            } catch (e) {
                done(e);
            }
        }, function(error) {
            // can not go here
        });
    });

    it('error by timeout', function (done) {
        var fooFetch = nattyFetch.create({
            //log: true,
            url: host + 'api/timeout',
            method: 'POST',
            timeout: 100
        });

        fooFetch().then(function () {
            // can not go here
        }, function(error) {
            try {
                expect(error.timeout).to.be(true);
                done();
            } catch(e) {
                done(e);
            }
        });
    });

    it('error by 500', function (done) {
        var fooFetch = nattyFetch.create({
            //log: true,
            url: host + 'api/500',
            method: 'POST'
        });

        fooFetch().then(function () {
            // can not go here
        }, function(error) {
            try {
                expect(error.status).to.be(nattyFetch.ajax.fallback ? undefined : 500);
                done();
            } catch(e) {
                done(e);
            }
        });
    });

    it('error by 404', function (done) {
        var fooFetch = nattyFetch.create({
            url: host + 'api/404',
            method: 'POST'
        });

        fooFetch().then(function () {
            // can not go here
        })['catch'](function (error) {
            try {
                if (!nattyFetch.ajax.fallback) {
                    // 即使是现代浏览器,也有status为0的情况
                    expect(error.status === 0 || error.status === 404).to.be(true);
                } else {
                    expect(error.status).to.be(undefined);
                }
                done();
            } catch(e) {
                done(e);
            }
        });
    });

    it('`GET` resolving after retry', function (done) {
        var fooFetch = nattyFetch.create({
            url: host + 'api/retry-success',
            method: 'GET',
            retry: 2
        });

        fooFetch().then(function (data) {
            try {
                expect(data.id).to.be(1);
                done();
            } catch(e) {
                done(e);
            }
        }, function() {
            // can not go here
        });
    });

    it('`GET` with fn-data resolving after retry', function (done) {

        var count = 0;

        var fooFetch = nattyFetch.create({
            url: host + 'api/retry-success',
            method: 'GET',
            retry: 2,
            data: function () {
                return {
                    count: count++
                }
            }
        });

        fooFetch().then(function (data) {
            try {
                expect(data.id).to.be(1);
                done();
            } catch(e) {
                done(e);
            }
        }, function() {
            // can not go here
        });
    });

    it('`POST` resolving after retry', function (done) {
        var fooFetch = nattyFetch.create({
            url: host + 'api/retry-success',
            method: 'POST',
            retry: 2
        });

        fooFetch().then(function (data) {
            try {
                expect(data.id).to.be(1);
                done();
            } catch(e) {
                done(e);
            }
        }, function() {
            // can not go here
        });
    });

    it('rejecting after retry', function (done) {
        var fooFetch = nattyFetch.create({
            url: host + 'api/return-error',
            retry: 1
        });

        fooFetch().then(function (data) {
            // can not go here
        }, function(error) {
            try {
                expect(error.code).to.be(1);
                done();
            } catch(e) {
                done(e);
            }
        });
    });

    // 简单请求的`ignoreSelfConcurrent`不会起作用, 连发两次请求，第二次依然有效
    it('`ignoreSeftConcurrent` should work', function (done) {
        var fooFetch = nattyFetch.create({
            cache: false,
            url: host + 'api/timeout', // 请求延迟返回的接口
            ignoreSelfConcurrent: true
        });

        fooFetch().then(function (data) {
            try {
                expect(data.id).to.be(1);
                done();
            } catch (e) {
                done(e);
            }
        });

        // 第一次请求未完成之前 第二次请求返回的是一个伪造的promise对象
        var dummyPromise = fooFetch().then(function(){
            throw new Error('unexpected `resolved`');
        });
        expect(dummyPromise).to.have.property('dummy');

        // 伪造的promise对象要保证支持链式调用
        expect(dummyPromise.then()).to.be(dummyPromise);
        expect(dummyPromise.then().catch()).to.be(dummyPromise);
    });

    // 连发两次请求, 第二次请求发起时, 如果第一次请求还没有返回, 则取消掉第一次请求(即: 返回时不响应)
    it('`overrideSeftConcurrent` should work (XHR)', function (done) {

        // 第一次请求, 不应该有响应
        var fooFetch = nattyFetch.create({
            url: host + 'api/timeout', // 请求延迟返回的接口
            data: {
                d: 0
            },
            overrideSelfConcurrent: true,
            process: function(content, vars) {
                // vars不应该混淆
                expect(vars.data.d).to.be(2);
            }
        });

        var count = 0;

        // 第一次请求, 不应该有响应
        fooFetch({
            d: 1
        }).then(function (data) {
            count++
        });

        // 第二次请求, 只响应这次请求
        setTimeout(function(){
            fooFetch({
                d:2
            }).then(function (data) {
                try {
                    expect(count).to.be(0);
                    done();
                } catch (e) {
                    done(e);
                }
            });
        }, 300);
    });

    // 取消响应
    it('calling `abort`', function (done) {

        var count = 0;

        var fooFetch = nattyFetch.create({
            url: host + 'api/success'
        });

        fooFetch().then(function () {
            // 不应该执行到这里
            count++
        });

        expect(fooFetch.pending).to.be(true);

        // 马上取消
        fooFetch.abort();

        setTimeout(function () {
            try {
                expect(count).to.be(0);
                expect(fooFetch.pending).to.be(false);
                done();
            } catch (e) {
                done(e);
            }
        }, 300);
    });
});

var xit$1 = function(ignore, fn) {
    fn();
}
xit$1.xonly = xit$1;

var noop = function () {

}

/**
 * 伪造的带有`finally`方法的`promise`对象
 * new MyPromise(function(resolve, reject) {})
 */
var MyPromise = function MyPromise(f) {
    // 对应的`resolve`和`reject`需要是函数
    f(noop, noop)
};
MyPromise.prototype.then = function then () {
    return this
};
MyPromise.prototype.catch = function catch$1 () {
    return this
};
MyPromise.prototype.finally = function finally$1 () {
    return this
};

describe('use private `Promise` object', function () {

    this.timeout(1000*30);

    it('MyPromise instance should have `finally` method', function () {
        var fooFetch = nattyFetch.create({
            urlPrefix: host,
            url: 'api/order-create',
            method: 'POST',
            Promise: MyPromise
        });

        expect(fooFetch().finally).to.be.a('function');
    });


    it('origin Promise instance dose NOT have `finally` method', function () {
        var fooFetch = nattyFetch.create({
            urlPrefix: host,
            url: 'api/order-create',
            method: 'POST'
        });

        expect(fooFetch().finally).to.be(undefined);
    });


    it('set RSVP Promise on context', function () {
        var context = nattyFetch.context({
            Promise: MyPromise
        });

        context.create({
            fooFetch: {
                urlPrefix: host,
                url: 'api/order-create',
                method: 'POST'
            }
        });

        expect(context.api.fooFetch().finally).to.be.a('function');
    });
});

}());
//# sourceMappingURL=bundle.js.map
