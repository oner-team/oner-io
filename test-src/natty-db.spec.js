"use strict";

const {host} = require('./config');
const ExpectAction = require('./expect-action');

// https://github.com/Automattic/expect.js
const expect = require('expect.js');

// require('natty-db')已被`webpack`映射到全局`NattyDB`对象
const NattyDB = require('natty-db');

let VERSION;
__BUILD_VERSION__

describe('NattyDB v' + VERSION + ' Unit Test', function() {

    describe('static',function() {
        it('version v' + VERSION, function() {
            expect(NattyDB.version).to.equal(VERSION);
        });
    });

    describe('NattyDB is a special Context', function () {
        it('NattyDB is an instance of NattyDB.Context', function () {
            expect(NattyDB instanceof NattyDB.Context).to.be(true);
        });
    })

    describe('global setting',function() {
        let defaultGlobalConfig = NattyDB.getGlobal();
        let defaultGlobalConfigProperties = [
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
            'once',
            'process',
            'retry',
            'timeout',
            'url',
            'urlPrefix'
        ];

        let resetNattyDBGlobalConfig = function () {
            NattyDB.setGlobal(defaultGlobalConfig);
        };

        beforeEach(function () {
            resetNattyDBGlobalConfig();
        });

        it('check default global config properties: `NattyDB.getGlobal()`',function() {
            defaultGlobalConfigProperties.forEach(function (property) {
                expect(defaultGlobalConfig).to.have.key(property);
            });
        });

        it('check `NattyDB.getGlobal("property")`', function () {
            expect(NattyDB.getGlobal('jsonp')).to.be(false);
        });

        it('check `NattyDB.setGlobal(obj)`', function () {
            NattyDB.setGlobal({
                data: {
                    '_csrf_token': 1
                }
            });
            expect(NattyDB.getGlobal('data')).to.eql({
                '_csrf_token': 1
            });
            // 还原
            NattyDB.setGlobal({data: {}});
        });

        it('Context instance would inherit and extend the global config', function () {
            let urlPrefix = 'http://test.com/api';
            let DBC = new NattyDB.Context({
                urlPrefix: urlPrefix
            });

            // 继承了所有的全局配置
            defaultGlobalConfigProperties.forEach(function (property) {
                expect(DBC.config).to.have.key(property);
            });
            // 也扩展了全局配置
            expect(DBC.config.urlPrefix).to.be(urlPrefix);
        });

        it('Context instance would inherit and extend the global config', function () {
            let urlPrefix = 'http://test.com/api';
            NattyDB.setGlobal({
                urlPrefix: urlPrefix
            });

            let DBC = new NattyDB.Context();
            let Order = DBC.create('Order', {
                create: {}
            });
            expect(Order.create.config.urlPrefix).to.be(urlPrefix);
        });
    });

    describe('api config', function () {

        let DBC;

        beforeEach('reset NattyDB context', function () {
            DBC = new NattyDB.Context({
                urlPrefix: host,
                mock: false
            });
        });

        it('both object and function can be used as api\'s config', function () {
            let Order = DBC.create('Order', {
                // api 对应 配置
                pay: {},
                // api 对应 返回配置的函数
                create: function () {
                    return {}
                }
            });

            expect(Order).to.be.a('object');
            expect(Order.pay).to.be.a('function');
            expect(Order.create).to.be.a('function');
        });

        it('`mock` option', function () {
            let Order = DBC.create('Order', {
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

            expect(Order.pay.config.mock).to.be(true);
            expect(Order.create.config.mock).to.be(false);
            expect(Order.close.config.mock).to.be(false);
        });

        it('`mock` and `method` option', function () {
            let Order = DBC.create('Order', {
                pay: {
                    mock: true,
                    method: 'POST' // 当`mock`为`true`时 `method`的配置会被纠正到`GET`
                }
            });

            expect(Order.pay.config.method).to.be('GET');
        });

        it('`mock` value from global', function () {
            let DBCWithoutMock  = new NattyDB.Context();
            let Order = DBCWithoutMock.create('Order', {
                pay: {
                    // 这个mock等于全局mock值
                }
            });

            expect(Order.pay.config.mock).to.be(false);
        });

        it('`mockUrlPrefix` value from context', function () {
            let DBC  = new NattyDB.Context({
                // NOTE 当`mock`为true时, 才会处理`mockUrl`的值
                mock: true,
                mockUrlPrefix: './mock/'
            });
            let Order = DBC.create('Order', {
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

            expect(Order.pay.config.mockUrl).to.be('./mock/pay');
            expect(Order.create.config.mockUrl).to.be('../create');
            expect(Order.close.config.mockUrl).to.be('https://www.demo.com/close');
        });

        it('`jsonp` option', () => {
            let Order = DBC.create('Order', {
                pay: {
                    url: 'path'
                },
                create: {
                    url: 'path.jsonp'
                },
                close: {
                    url: 'path.jsonp?foo'
                }
            });

            expect(Order.pay.config.jsonp).to.be(false);
            expect(Order.create.config.jsonp).to.be(true);
            expect(Order.close.config.jsonp).to.be(true);
        });

        it('auto `urlPrefix`', function () {
            let Order = DBC.create('Order', {
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

            expect(Order.method1.config.url).to.equal(host + 'path');
            expect(Order.method2.config.url).to.be('//foo.com/path');
            expect(Order.method3.config.url).to.be('http://foo.com/path');
            expect(Order.method4.config.url).to.be('https://foo.com/path');
            expect(Order.method5.config.url).to.be('./path');
            expect(Order.method6.config.url).to.be('../path');
            expect(Order.method7.config.url).to.be('/path');
        });
    });

    describe("DBC.create", function () {
        let DBC = new NattyDB.Context();

        it('structure for DBC', function () {
            DBC.create('Order', {
                create: {}
            });

            DBC.create('User', {
                getPhone: {}
            });
            expect(DBC).to.have.keys(['Order', 'User', 'config']);
        });

        it('create existed DB should throw error', function () {
            // crete相同的DB
            let createExistedDB = function () {
                DBC.create('Order', {
                    create: {}
                })
            };
            expect(createExistedDB).to.throwError();
        });
    });

    describe('ajax', function() {
        // NOTE 重要: 为了能够测试完整的场景, 默认已经全局关闭所有请求的浏览器缓存!!!  比如: ignoreSelfConcurrent
        NattyDB.setGlobal({
            cache: false
        });

        this.timeout(1000*60);
        let DBC;

        beforeEach('reset', function () {
            DBC = new NattyDB.Context({
                urlPrefix: host,
                mock: false
            });
        });

        it('play with standard data structure', function (done) {
            let Order = DBC.create('Order', {
                create: {
                    url: 'api/order-create',
                    method: 'POST'
                }
            });
            Order.create().then(function(data) {
                try {
                    expect(data.id).to.be(1);
                    done();
                } catch(e) {
                    done(new Error(e.message));
                }
            });
        });

        it('play with non-standard data structure by `fit`', function (done) {
            let Order = DBC.create('Order', {
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
            Order.create().then(function(data) {
                try {
                    expect(data.id).to.be(1);
                    done();
                } catch(e) {
                    done(new Error(e.message));
                }
            });
        });

        it('process data', function (done) {
            let Order = DBC.create('Order', {
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
            Order.create().then(function(data) {
                try {
                    expect(data.orderId).to.be(1);
                    done();
                } catch(e) {
                    done(new Error(e.message));
                }
            });
        });

        it('skip process data when it is mocking ', function (done) {
            let Order = DBC.create('Order', {
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
            Order.create().then(function(data) {
                try {
                    expect(data.id).to.be(1);
                    done();
                } catch(e) {
                    done(new Error(e.message));
                }
            });
        });

        it('error by requesting cross-domain with disabled header [NOTE: IE的行已被标准化]', function (done) {
            let Order = DBC.create('Order', {
                create: {
                    //log: true,
                    url: host + 'api/order-create',
                    method: 'POST',
                    header: {foo: 'foo'} // 跨域时, 自定义的`header`将被忽略
                }
            });

            Order.create().then(function (data) {
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
            let Order = DBC.create('Order', {
                create: {
                    //log: true,
                    url: host + 'api/timeout',
                    method: 'POST',
                    timeout: 100
                }
            });
            Order.create().then(function () {
                // can not go here
            }, function(error) {
                try {
                    expect(error.timeout).to.be(true);
                    done();
                } catch(e) {
                    done(new Error(e.message));
                }
            });
        });

        it('pending status checking', function (done) {
            let Order = DBC.create('Order', {
                create: {
                    //log: true,
                    url: host + 'api/timeout',
                    method: 'POST',
                    timeout: 200
                }
            });
            Order.create().then(function () {
                // can not go here
            }, function(error) {
                try {
                    expect(Order.create.config.pending).to.be(false);
                    done();
                } catch(e) {
                    done(new Error(e.message));
                }
            });
            expect(Order.create.config.pending).to.be(true);
        });

        it('error by 500', function (done) {
            let Order = DBC.create('Order', {
                create: {
                    //log: true,
                    url: host + 'api/500',
                    method: 'POST'
                }
            });
            Order.create().then(function () {
                // can not go here
            }, function(error) {
                try {
                    expect(error.status).to.be(NattyDB.ajax.fallback ? undefined : 500);
                    done();
                } catch(e) {
                    done(new Error(e.message));
                }
            });
        });

        it('error by 404', function (done) {
            let Order = DBC.create('Order', {
                create: {
                    url: host + 'api/404',
                    method: 'POST'
                }
            });
            Order.create().then(function () {
                // can not go here
            }, function(error) {
                try {
                    expect(error.status).to.be(NattyDB.ajax.fallback ? undefined : 404);
                    done();
                } catch(e) {
                    done(new Error(e.message));
                }
            });
        });

        it('resolving after retry', function (done) {
            let Order = DBC.create('Order', {
                create: {
                    url: host + 'api/retry-success',
                    method: 'GET',
                    retry: 2
                }
            });

            Order.create(function (obj) {
                return {
                    retry: obj.retryTime
                };
            }).then(function (data) {
                try {
                    expect(data.id).to.be(1);
                    done();
                } catch(e) {
                    C.dir(e);
                    done(new Error(e.message));
                }
            }, function() {
                // can not go here
            });
        });

        it('rejecting after retry', function (done) {
            let Order = DBC.create('Order', {
                create: {
                    url: host + 'api/return-error',
                    retry: 1
                }
            });
            Order.create().then(function (data) {
                // can not go here
            }, function(error) {
                try {
                    expect(error.code).to.be(1);
                    done();
                } catch(e) {
                    done(new Error(e.message));
                }
            });
        });

        // 连发两次请求，第二次应该被忽略
        it('ignore seft concurrent', function (done) {

            let Order = DBC.create('Order', {
                create: {
                    url: host + 'api/timeout', // 请求延迟返回的接口
                    ignoreSelfConcurrent: true
                }
            });

            Order.create().then(function (data) {
                try {
                    expect(data.id).to.be(1);
                    done();
                } catch (e) {
                    done(new Error(e.message));
                }
            });

            // 第一次请求未完成之前 第二次请求返回的是一个伪造的promise对象
            let dummyPromise = Order.create();
            expect(dummyPromise).to.have.property('dummy');

            // 伪造的promise对象要保证支持链式调用
            expect(dummyPromise.then()).to.be(dummyPromise);
            expect(dummyPromise.then().catch()).to.be(dummyPromise);
            expect(dummyPromise.then().catch().finally()).to.be(dummyPromise);
        });

        it('loop', function (done) {
            let Taxi = DBC.create('Taxi', {
                getDriverNum: {
                    url: host + 'api/return-success'
                }
            });

            let time = 0;

            // 开始轮询
            Taxi.getDriverNum.startLoop({
                data: {},
                duration: 200,
                process: function(data) {
                    time++;
                }
            });

            setTimeout(function () {
                expect(time).to.be.above(1);
                // 验证状态
                expect(Taxi.getDriverNum.looping).to.be(true);
                // 停止轮询
                Taxi.getDriverNum.stopLoop();
                // 验证状态
                expect(Taxi.getDriverNum.looping).to.be(false);
                done();
            }, 1000);
        });
    });


        describe('jsonp', function () {
        // NOTE 重要: 为了能够测试完整的场景, 默认已经全局关闭所有请求的浏览器缓存!!!  比如: ignoreSelfConcurrent
        NattyDB.setGlobal({
            cache: false
        });

        this.timeout(1000*60);
        let DBC;

        beforeEach('reset', function () {
            DBC = new NattyDB.Context({
                urlPrefix: host,
                mock: false
            });
        });

        it('check default jsonpCallbackQuery', function () {
            let Order = DBC.create('Order', {
                create: {
                    url: host + 'api/order-create',
                    jsonp: true
                }
            });

            expect(Order.create.config.jsonpCallbackQuery).to.be(undefined);
        });

        it('check custom jsonpCallbackQuery', function () {
            let Order = DBC.create('Order', {
                create: {
                    url: host + 'api/order-create',
                    jsonp: [true, 'cb', 'j{id}']
                }
            });

            expect(Order.create.config.jsonp).to.be(true);
            expect(Order.create.config.jsonpFlag).to.be('cb');
            expect(Order.create.config.jsonpCallbackName).to.be('j{id}');
        });

        it('auto detect jsonp option', function () {
            let Order = DBC.create('Order', {
                create: {
                    url: host + 'api/order-create.jsonp'
                }
            });

            expect(Order.create.config.jsonp).to.be(true);
        });

        it('jsonp response.success is true', function (done) {
            let Order = DBC.create('Order', {
                create: {
                    //log: true,
                    url: host + 'api/jsonp-order-create',
                    jsonp: true
                }
            });

            Order.create().then(function (data) {

                try {
                    expect(data.id).to.be(1);
                    done();
                } catch (e) {
                    done(new Error(e.message));
                }
            });
        });

        it('jsonp response.success is false ', function (done) {
            let Order = DBC.create('Order', {
                create: {
                    //log: true,
                    url: host + 'api/jsonp-order-create-error',
                    jsonp: true
                }
            });

            Order.create().then(function (data) {
                // can not go here
            }, function (error) {
                try {
                    expect(error).to.have.property('message');
                    done();
                } catch (e) {
                    done(new Error(e.message));
                }
            });
        });

        // jsonp无法使用状态吗识别出具体的404、500等错误，都统一成`无法连接`的错误信息
        it('jsonp with error url', function (done) {
            let Order = DBC.create('Order', {
                create: {
                    url: host + 'error-url',
                    jsonp: true
                }
            });

            Order.create().then(function (data) {
                // can not go here
            }, function (error) {
                try {
                    expect(error.message).to.contain('Not Accessable JSONP');
                    done();
                } catch (e) {
                    done(new Error(e.message));
                }
            });
        });

        it('jsonp timeout', function (done) {
            let Order = DBC.create('Order', {
                create: {
                    //log: true,
                    url: host + 'api/jsonp-timeout',
                    jsonp: true,
                    timeout: 300
                }
            });
            Order.create().then(function () {
                // can not go here
            }, function(error) {
                try {
                    expect(error.timeout).to.be(true);
                    done();
                } catch(e) {
                    done(new Error(e.message));
                }
            });
        });

        it('resolving after retry', function (done) {
            let Order = DBC.create('Order', {
                create: {
                    url: host + 'api/jsonp-retry-success',
                    jsonp: true,
                    retry: 2
                }
            });

            Order.create(function (obj) {
                return {
                    retry: obj.retryTime
                };
            }).then(function (data) {
                try {
                    expect(data.id).to.be(1);
                    done();
                } catch(e) {
                    done(new Error(e.message));
                }
            }, function() {
                // can not go here
            });
        });

        it('rejecting after retry', function (done) {
            let Order = DBC.create('Order', {
                create: {
                    url: host + 'api/jsonp-error',
                    jsonp: true,
                    retry: 1
                }
            });
            Order.create().then(function (data) {
                // can not go here
            }, function(error) {
                try {
                    expect(error.code).to.be(1);
                    done();
                } catch(e) {
                    done(new Error(e.message));
                }
            });
        });

        it('ignore self concurrent', function (done) {
            let Order = DBC.create('Order', {
                create: {
                    url: host + 'api/jsonp-timeout', // 请求延迟返回的接口
                    jsonp: true,
                    ignoreSelfConcurrent: true
                }
            });

            // 连发两次请求，第二次应该被忽略
            Order.create().then(function (data) {
                try {
                    expect(data.id).to.be(1);
                    done();
                } catch (e) {
                    done(new Error(e.message));
                }
            });

            // 第一次请求未完成之前 第二次请求返回的是一个伪造的promise对象
            let dummyPromise = Order.create();
            expect(dummyPromise).to.have.property('dummy');

            // 伪造的promise对象要保证支持链式调用
            expect(dummyPromise.then()).to.be(dummyPromise);
            expect(dummyPromise.then().catch()).to.be(dummyPromise);
            expect(dummyPromise.then().catch().finally()).to.be(dummyPromise);
        });
    });
    //    run();
    //}, 4000);
});