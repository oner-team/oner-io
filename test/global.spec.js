"use strict";

// https://github.com/Automattic/expect.js
const expect = require('expect.js');
const NattyDB = require('../src/natty-db');

const urlPrefix = 'http://localhost:8001/';

describe('NattyDB', function() {

    describe('static',function() {

        it('version',function() {
            expect(NattyDB.version).to.equal('1.0.0');
        });
    });

    describe('api config', function () {

        let DBC = new NattyDB.Context({
            urlPrefix: urlPrefix,
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

            expect(Order.pay.config.url).to.equal(urlPrefix + 'path');
            expect(Order.create.config.url).to.be('//foo.com/path');
            expect(Order.close.config.url).to.be('http://foo.com/path');
            expect(Order.update.config.url).to.be('https://foo.com/path');
        });


    });

    describe('ajax', function() {
        let DBC = new NattyDB.Context({
            urlPrefix: urlPrefix,
            mock: false
        });

        beforeEach('reset', function () {
            DBC.context = {};
        })

        it('play with standard data structure', function (done) {
            let Order = DBC.create('Order', {
                create: {
                    url: urlPrefix + 'api/order-create',
                    method: 'POST'
                }
            });
            Order.create().then(function(data) {
                try{
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
                    url: urlPrefix + 'api/order-create-non-standard',
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
                try{
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
                    url: urlPrefix + 'api/order-create',
                    method: 'POST',
                    process: function (response) {
                        return {
                            orderId: response.id
                        };
                    }
                }
            });
            Order.create().then(function(data) {
                try{
                    expect(data.orderId).to.be(1);
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