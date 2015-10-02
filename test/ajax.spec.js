"use strict";

// https://github.com/Automattic/expect.js
const expect = require('expect.js');
const ExpectAction = require('./expect-action');


let ajax = require('../src/ajax');

describe('ajax', function () {
    describe('browser detects', function () {
        let xhr = new XMLHttpRequest();

        let methods = ['loadstart', 'load', 'loadend', 'progress', 'error', 'readystatechange', 'timeout', 'abort'];

        methods.forEach(function (method) {
            it('support `' + method + '` event',function() {
                expect(xhr).to.have.property('on' + method);
            });
        });

        // http://enable-cors.org/index.html
        it('support `CORS`', function () {
            expect(xhr).to.have.property('withCredentials');
        });
    });

    describe('post', function () {

        it('accept text', function (done) {
            ajax({
                url: 'http://localhost:8001/api/post/json',
                method: 'POST',
                query: {
                    'return-text': 1
                },
                success: function (res, xhr) {
                    expect(res).to.be(JSON.stringify({tool: 'natty-db'}));
                    done();
                }
            });
        });

        it('accept json', function (done) {
            ajax({
                url: 'http://localhost:8001/api/post/json',
                method: 'POST',
                query: {
                    'return-json': 1
                },
                accept: 'json',
                success: function (res, xhr) {
                    expect(res).to.eql({tool: 'natty-db'});
                    done();
                }
            });
        });

        it('accept script', function (done) {
            ajax({
                url: 'http://localhost:8001/api/post/script',
                method: 'POST',
                query: {
                    'return-script': 1
                },
                accept: 'script',
                success: function (res, xhr) {
                    expect(__test__).to.be(1);
                    window.__test__ = 0;
                    done();
                }
            });
        });

    });


    describe('event', function () {

        let ea = new ExpectAction();

        beforeEach('reset expectEvents', function () {
            ea.reset();
        });

        afterEach('check expectEvents', function () {
            ea.check();
        });

        it('should trigger success and complete', function (done) {

            ea.expect(['success', 'complete']);

            ajax({
                url: 'http://localhost:8001/api/post/json',
                method: 'POST',
                query: {
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

        let isIE = ~navigator.userAgent.indexOf('Edge') || ~navigator.userAgent.indexOf('MSIE');
        // 如果是IE11 在跨域时使用了非法的Header 仍然是请求成功的
        !isIE && it('should trigger error and complete when request the cross-domain with disabled header', function (done) {

            ea.expect(['error', 'complete']);

            ajax({
                log: true,
                url: 'http://localhost:8001/api/post/json',
                method: 'POST',
                query: {
                    'cross-domain-with-disabled-header': 1
                },
                // 使用不合法的Header来触发跨域失败
                header: {foo: 'foo'},
                accept: 'json',
                error: function (status, xhr) {
                    ea.do('error');
                    expect(status).to.be(0);
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
                url: 'http://localhost:8001/api/post/500',
                method: 'POST',
                accept: 'json',
                error: function (status, xhr) {
                    ea.do('error');
                    expect(status).to.be(500);
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
                url: 'http://localhost:8001/api/post/404',
                method: 'POST',
                accept: 'json',
                error: function (status, xhr) {
                    ea.do('error');
                    expect(status).to.be(404);
                },
                complete: function () {
                    ea.do('complete');
                    done();
                }
            });
        });

        it('should trigger abort and complete when request is aborted', function (done) {

            ea.expect(['abort', 'complete']);

            var toAbort = ajax({
                //log: true,
                url: 'http://localhost:8001/api/post/abort',
                method: 'POST',
                abort: function () {
                    ea.do('abort');
                },
                complete: function () {
                    ea.do('complete');
                    done();
                }
            });
            setTimeout(function () {
                toAbort.abort();
            }, 1000);
        });
    });
});

