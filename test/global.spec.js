"use strict";
const {host} = require('./config');

// https://github.com/Automattic/expect.js
const expect = require('expect.js');
const NattyDB = require('../src/natty-db');

// IE11+
const isIE = ~navigator.userAgent.indexOf('Edge') || ~navigator.userAgent.indexOf('MSIE');

describe('NattyDB(Mobile ONLY Version) Unit Test', function() {

    describe('static',function() {

        it('version',function() {
            expect(NattyDB.version).to.equal('1.0.0');
        });
    });

    describe('api config', function () {

        let DBC = new NattyDB.Context({
            urlPrefix: host,
            mock: false
        });

        beforeEach('reset NattyDB context', function () {
            DBC.context = {};
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
                    // 此处mock的值 context.mock > url search param
                }
            });

            expect(Order.pay.config.mock).to.be(true);
            expect(Order.create.config.mock).to.be(false);
            expect(Order.close.config.mock).to.be(false);
        });

        it('`mock` value from url search param', function () {
            let DBCWithoutMock  = new NattyDB.Context();
            let Order = DBCWithoutMock.create('Order', {
                pay: {
                }
            });

            expect(Order.pay.config.mock).to.be(!!location.search.match(/\bm=1\b/));
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
                pay: {
                    url: 'path'
                },
                create: {
                    url: '//foo.com/path'
                },
                close: {
                    url: 'http://foo.com/path'
                },
                update: {
                    url: 'https://foo.com/path'
                }
            });

            expect(Order.pay.config.url).to.equal(host + 'path');
            expect(Order.create.config.url).to.be('//foo.com/path');
            expect(Order.close.config.url).to.be('http://foo.com/path');
            expect(Order.update.config.url).to.be('https://foo.com/path');
        });


    });

    describe('ajax', function() {
        let DBC = new NattyDB.Context({
            urlPrefix: host,
            mock: false
        });

        beforeEach('reset', function () {
            DBC.context = {};
        })

        it('play with standard data structure', function (done) {
            let Order = DBC.create('Order', {
                create: {
                    url: host + 'api/order-create',
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

        it('error by requesting cross-domain with disabled header', function (done) {
            let Order = DBC.create('Order', {
                create: {
                    //log: true,
                    url: host + 'api/order-create',
                    method: 'POST',
                    header: {foo: 'foo'}
                }
            });
            Order.create().then(function () {
                // can not go here
            }, function(error) {
                try {
                    expect(error.status).to.be(0);
                    done();
                } catch(e) {
                    done(new Error(e.message));
                }
            });
        });

        it('error by timeout', function (done) {
            let Order = DBC.create('Order', {
                create: {
                    //log: true,
                    url: host + 'api/timeout',
                    method: 'POST',
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
                    expect(error.status).to.be(500);
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
                    expect(error.status).to.be(404);
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
            Order.create().then(function (data) {
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
                    url: host + 'api/retry-error',
                    method: 'GET',
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

    });

    describe('jsonp', function () {
        let DBC = new NattyDB.Context({
            urlPrefix: host,
            mock: false
        });

        beforeEach('reset', function () {
            DBC.context = {};
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
                    expect(error.message).to.contain('Not Accessable JSONP URL');
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
    });
});

require('./util.spec');
require('./ajax.spec');



