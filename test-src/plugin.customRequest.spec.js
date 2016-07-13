"use strict";
const {host} = require('./config');
const nattyFetch = require('natty-fetch');

// https://github.com/Automattic/expect.js
var expect = require('expect.js');

// dd.ready(function () {

describe.skip('plugin customRequest', function () {
    this.timeout(1000*10);
    it('customRequest', function (done) {

        let context = nattyFetch.context({
            urlPrefix: host,
            mock: false
        });

        const {appendQueryString, extend, param} = nattyFetch._util;
        let lwp = function (apiInstance) {
            // 只有get/post才使用lwp
            if (apiInstance.config.jsonp) {
                return;
            }
            apiInstance.config.customRequest = function (vars, config, defer) {
                let isPOST = config.method === 'POST';

                let lwpOptions = {
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

// });