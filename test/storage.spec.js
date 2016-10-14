import {host} from '../config/host'

describe('storage', function () {

    this.timeout(1000*10);
    let context;

    beforeEach('reset', function () {
        context = nattyFetch.context({
            urlPrefix: host,
            mock: false,
        });
    });

    it('query string is same: localStorage', function (done) {
        let requestTime = 0;
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

        })['catch']();
    });

    it('query string is same: sessionStorage', function (done) {
        let requestTime = 0;
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

        })['catch']();
    });

    //
    it('query string is same: variable', function (done) {
        let requestTime = 0;
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
        })['catch']();
    });

    it('query string is same with jsonp', function (done) {
        let requestTime = 0;
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
        })['catch']();
    });

    it('query string is different', function (done) {
        let requestTime = 0;
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
        })['catch']();
    });


    it('no query string', function (done) {
        let requestTime = 0;
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
        })['catch']();
    });

    it('`POST` request with `storage` on should throw an error', function () {
        let requestTime = 0;
        let errorFn = function () {
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