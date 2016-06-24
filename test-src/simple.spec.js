"use strict";

const {host} = require('./config');

// https://github.com/Automattic/expect.js
const expect = require('expect.js');

// require('natty-fetch')已被`webpack`映射到全局`NattyDB`对象
const nattyFetch = require('natty-fetch');

let xit = function(ignore, fn) {
    fn();
}
xit.xonly = xit;

describe('nattyFetch method', function () {

        this.timeout(1000*30);

        it('play with standard data structure', function (done) {
            nattyFetch({
                urlPrefix: host,
                url: 'api/order-create',
                method: 'POST',
                //traditional: true
            }).then(function(data) {
                try {
                    expect(data.id).to.be(1);
                    done();
                } catch(e) {
                    done(e);
                }
            });
        });

        it('play with non-standard data structure by `fit`', function (done) {
            nattyFetch({
                url: host + 'api/order-create-non-standard',
                method: 'POST',
                fit: function (response) {
                    return {
                        success: !response.hasError,
                        content: response.content
                    };
                }
            }).then(function(data) {
                try {
                    expect(data.id).to.be(1);
                    done();
                } catch(e) {
                    done(e);
                }
            });
        });

        it('process data', function (done) {

            nattyFetch({
                url: host + 'api/order-create',
                method: 'POST',
                process: function (content) {
                    return {
                        orderId: content.id
                    };
                }
            }).then(function(content) {
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
            nattyFetch({
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
            nattyFetch({
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
            }).then(function(data) {
                try {
                    expect(data.id).to.be(1);
                    done();
                } catch(e) {
                    done(e);
                }
            });
        });

        it('error by requesting cross-domain with disabled header [NOTE: IE的行为已被标准化]', function (done) {
            nattyFetch({
                //log: true,
                url: host + 'api/order-create',
                method: 'POST',
                header: {foo: 'foo'} // 跨域时, 自定义的`header`将被忽略
            }).then(function (data) {
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
            nattyFetch({
                //log: true,
                url: host + 'api/timeout',
                method: 'POST',
                timeout: 100
            }).then(function () {
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
            nattyFetch({
                //log: true,
                url: host + 'api/500',
                method: 'POST'
            }).then(function () {
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
            nattyFetch({
                url: host + 'api/404',
                method: 'POST'
            }).then(function () {
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
            nattyFetch({
                url: host + 'api/retry-success',
                method: 'GET',
                retry: 2
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

        it('`GET` with fn-data resolving after retry', function (done) {

            let count = 0;

            nattyFetch({
                url: host + 'api/retry-success',
                method: 'GET',
                retry: 2,
                data: function () {
                    return {
                        count: count++
                    }
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
            nattyFetch({
                url: host + 'api/retry-success',
                method: 'POST',
                retry: 2
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

        it('rejecting after retry', function (done) {
            nattyFetch({
                url: host + 'api/return-error',
                retry: 1
            }).then(function (data) {
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
        it('`ignoreSeftConcurrent` should NOT work', function (done) {
            nattyFetch({
                cache: false,
                url: host + 'api/timeout', // 请求延迟返回的接口
                ignoreSelfConcurrent: true
            }).then(function (data) {

                // 第一次请求未完成之前 发起第二次请求
                nattyFetch({
                    cache: false,
                    url: host + 'api/timeout', // 请求延迟返回的接口
                    ignoreSelfConcurrent: true
                }).then(function(data){
                    try {
                        expect(data.id).to.be(1);
                        done();
                    } catch (e) {
                        done(e);
                    }
                });
            });
        });

        // 连发两次请求, 第二次请求发起时, 如果第一次请求还没有返回, 则取消掉第一次请求(即: 返回时不响应)
        it('`overrideSeftConcurrent` should NOT work (XHR)', function (done) {

            let count = 0;

            // 第一次请求, 不应该有响应
            nattyFetch({
                url: host + 'api/timeout', // 请求延迟返回的接口
                data: {
                    d: 1
                },
                overrideSelfConcurrent: true
            }).then(function (data) {
                count++
            });

            // 第二次请求, 只响应这次请求
            setTimeout(function(){
                nattyFetch({
                    url: host + 'api/timeout', // 请求延迟返回的接口
                    data: {
                        d: 2
                    },
                    overrideSelfConcurrent: true
                }).then(function (data) {
                    count++
                    try {
                        expect(count).to.be(2);
                        done();
                    } catch (e) {
                        done(e);
                    }
                });
            }, 300);
        });
});