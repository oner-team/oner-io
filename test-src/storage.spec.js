"use strict";
const {host} = require('./config');
const NattyFetch = require('natty-fetch');

// https://github.com/Automattic/expect.js
var expect = require('expect.js');

var {
    appendQueryString, isAbsoluteUrl, isNumber,
    loadScript, param, decodeParam, isIE, isCrossDomain,
    sortPlainObjectKey
} = NattyFetch._util;

describe('storage', function () {

    this.timeout(1000*30);
    let DBC;

    beforeEach('reset', function () {
        DBC = new NattyFetch.Context({
            urlPrefix: host,
            mock: false
        });
    });

    it('query string is same', function (done) {
        let requestTime = 0;
        let User = DBC.create('User', {
            getPhone: {
                url: host + 'api/return-success',
                willRequest: function (vars, config, from) {
                    if (from === 'remote') {
                        requestTime++;
                    }
                },
                storage: {
                    type: 'localStorage'
                }
            }
        });

        // 第一次请求走网络
        User.getPhone({
            b:1,
            a:1
        }).then(function (r) {
            // 第二次请求走storage
            return User.getPhone({
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
            User.getPhone.config.storage.destroy();
        }).catch();
    });

    it('query string is different', function (done) {
        let requestTime = 0;
        let Foo = DBC.create('Foo', {
            get: {
                url: host + 'api/return-success',
                willRequest: function (vars, config, from) {
                    if (from === 'remote') {
                        requestTime++;
                    }
                },
                storage: true
            }
        });

        // 第一次请求走网络
        Foo.get({
            b:1,
            a:1
        }).then(function () {
            // 第二次请求, 参数不一样, 依然走网络
            return Foo.get({
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
            Foo.get.config.storage.destroy();
        }).catch();
    });


    it('no query string', function (done) {
        let requestTime = 0;
        let Faa = DBC.create('Faa', {
            get: {
                url: host + 'api/return-success',
                willRequest: function (vars, config, from) {
                    if (from === 'remote') {
                        requestTime++;
                    }
                },
                storage: true
            }
        });

        // 第一次请求走网络
        Faa.get().then(function () {
            // 第二次请求, 走storage
            return Faa.get();
        }).then(function (data) {
            try {
                expect(data.id).to.be(1);
                expect(requestTime).to.be(1);
                done();
            } catch (e) {
                done(e);
            }
            // 特别注意 expect不管是否成功, 都要销毁storage, 避免下次刷新后的测试
            Faa.get.config.storage.destroy();
        }).catch();
    });

    it('`POST` request with `storage` on should throw an error', function () {
        let requestTime = 0;
        let errorFn = function () {
            DBC.create('Faa', {
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