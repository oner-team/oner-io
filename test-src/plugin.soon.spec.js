"use strict";
const {host} = require('./config');
const NattyFetch = require('natty-fetch');

// https://github.com/Automattic/expect.js
var expect = require('expect.js');

describe('plugin soon', function () {
    it('`soon` method with `storage` is open', function (done) {
        let DBC = new NattyFetch.Context({
            urlPrefix: host,
            mock: false
        });

        let outerCount = 0;
        let innerCount = 0;
        let requestCount = 0;

        let Foo = DBC.create('Foo', {
            get: {
                url: host + 'api/return-stamp',
                storage: true,
                willRequest: function (vars, config, from) {
                    if (from === 'remote') {
                        requestCount++;
                    }
                },
                plugins: [
                    NattyFetch.plugin.soon
                ]
            }
        });

        // 外层请求, 首次请求没有storage缓存, success回调只应该执行一次, 数据来自远程服务器
        let outerData;
        let innerDataFromStorage;
        Foo.get.soon({
            q: 1
        }, function (data) {
            outerCount++;
            outerData = data;
            // console.log('data', JSON.stringify(data));
            // 内层请求, 参数一致, 应该有storage缓存, success回调只应该执行2次,
            Foo.get.soon({
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
                expect(JSON.stringify(outerData.data)).to.be(JSON.stringify(innerDataFromStorage.data));
                Foo.get.config.storage.destroy();
                done();
            } catch (e) {
                done(e);
            }
        }, 800);
    });

    it('`soon` method with `storage` is closed', function (done) {

        let DBC = new NattyFetch.Context({
            urlPrefix: host,
            mock: false
        });

        let outerCount = 0;
        let innerCount = 0;
        let requestCount = 0;

        let Foo = DBC.create('Foo', {
            get: {
                url: host + 'api/return-stamp',
                storage: false,
                willRequest: function (vars, config, from) {
                    if (from === 'remote') {
                        requestCount++;
                    }
                },
                plugins: [
                    NattyFetch.plugin.soon
                ]
            }
        });

        // 外层请求, 首次请求没有storage缓存, success回调只应该执行一次, 数据来自远程服务器
        let outerData;
        let innerDataFromStorage;
        Foo.get.soon({
            q: 1
        }, function (data) {
            outerCount++;
            outerData = data;
            // console.log('data', JSON.stringify(data));
            // 内层请求, 参数一致, 应该有storage缓存, success回调只应该执行2次,
            Foo.get.soon({
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
                expect(JSON.stringify(outerData.data)).not.to.be(JSON.stringify(innerDataFromStorage.data));
                done();
            } catch (e) {
                done(e);
            }
        }, 800);
    });
});