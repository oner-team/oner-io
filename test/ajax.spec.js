"use strict";

// https://github.com/Automattic/expect.js
const expect = require('expect.js');
const ExpectAction = require('./expect-action');

const {host} = require('./config');


let ajax = require('../src/ajax');

describe('./ajax', function () {

    describe('dependent detects', function () {
        let xhr = new XMLHttpRequest();

        let methods = ['loadend', 'readystatechange', 'abort'];

        methods.forEach(function (method) {
            it('support `' + method + '` event',function() {
                expect(xhr).to.have.property('on' + method);
            });
        });

        // http://enable-cors.org/index.html
        it('support `CORS`', function () {
            expect(xhr).to.have.property('withCredentials');
        });

        it('`script` tag should have onload event', function (done) {
            let script = document.createElement('script');
            script.onload = function () {
                expect(__test__).to.be(1);
                window.__test__ = null;
                done();
            };
            script.src = host + 'api/return-script';
            let head = document.getElementsByTagName('head')[0];
            head.insertBefore(script, head.firstChild);
        });
    });

    describe('browser detects：NOT used in NattyDB', function () {
        let xhr = new XMLHttpRequest();

        let methods = ['loadstart', 'load', 'progress', 'error', 'timeout'];

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
                    expect(res).to.eql({tool: 'natty-db'});
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

        let isIE = ~navigator.userAgent.indexOf('Edge') || ~navigator.userAgent.indexOf('MSIE');
        // 如果是IE11 在跨域时使用了非法的Header 仍然是请求成功的
        !isIE && it('should trigger error and complete when request the cross-domain with disabled header', function (done) {

            ea.expect(['error', 'complete']);

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
                url: host + 'api/500',
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
                url: host + 'api/404',
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

            var xhr = ajax({
                //log: true,
                url: host + 'api/abort',
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
                xhr.abort();
            }, 100);
        });

        it('calling `abort` after `complete` event should be ignored', function (done) {

            ea.expect(['success', 'complete']);

            var xhr = ajax({
                //log: true,
                url: host + 'api/return-json',
                method: 'POST',
                success: function () {
                    ea.do('success');
                },
                complete: function () {
                    ea.do('complete');
                    done();
                }
            });
            setTimeout(function () {
                //
                xhr.abort();
            }, 100);
        });


    });
});

