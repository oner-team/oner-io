
import {host} from '../config/host'

const noop = function () {

}
const _it = function(s, f) {
  f(noop)
}

describe('nattyFetch v__VERSION__ Unit Test', function() {

  describe('static',function() {
    it('version v__VERSION__', function() {
      expect(nattyFetch.version).to.equal('__VERSION__')
    })
  })

  describe('global setting',function() {
    this.timeout(1000*10)
    let defaultGlobalConfig = nattyFetch.getGlobal()
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
      'mockUrlSuffix',
      'process',
      'retry',
      'timeout',
      'url',
      'urlPrefix',
      'urlSuffix',
      'withCredentials',
      'traditional',
    ]

    let emptyEvent = nattyFetch._event

    let resetNattyDBGlobalConfig = function () {
      nattyFetch.setGlobal(defaultGlobalConfig)
    }

    beforeEach(function () {
      resetNattyDBGlobalConfig()
    })

    afterEach(function () {
      // 清理所有事件
      let i
      for (i in nattyFetch._event) {
        if (i.indexOf('_') === 0) {
          delete nattyFetch._event[i]
        }
      }
    })

    it('check default global config properties: `nattyFetch.getGlobal()`',function() {
      defaultGlobalConfigProperties.forEach(function (property) {
        expect(defaultGlobalConfig).to.have.key(property)
      })
    })

    it('check `nattyFetch.getGlobal("property")`', function () {
      expect(nattyFetch.getGlobal('jsonp')).to.be(false)
    })

    it('check `nattyFetch.setGlobal(obj)`', function () {
      nattyFetch.setGlobal({
        data: {
          '_csrf_token': 1,
        },
      })
      expect(nattyFetch.getGlobal('data')).to.eql({
        '_csrf_token': 1,
      })
      // 还原
      nattyFetch.setGlobal({data: {}})
    })

    it('Context instance would inherit and extend the global config', function () {
      let urlPrefix = 'http://test.com/api'
      let urlSuffix = '.json'
      let context = nattyFetch.context({
        urlPrefix,
        urlSuffix,
      })

      // 继承了所有的全局配置
      // defaultGlobalConfigProperties.forEach(function (property) {
      //   expect(DBC.config).to.have.key(property);
      // });
      // 也扩展了全局配置
      expect(context._config.urlPrefix).to.be(urlPrefix)
      expect(context._config.urlSuffix).to.be(urlSuffix)
    })

    it('Context instance would inherit and extend the global config 2', function () {
      let urlPrefix = 'http://test.com/api'
      let urlSuffix = '.json'
      nattyFetch.setGlobal({
        urlPrefix,
        urlSuffix,
      })

      let context = nattyFetch.context()

      context.create('order', {
        create: {},
      })

      expect(context.api.order.create.config.urlPrefix).to.be(urlPrefix)
      expect(context.api.order.create.config.urlSuffix).to.be(urlSuffix)
    })

    it('catch error', function (done) {
      nattyFetch.setGlobal({
        urlPrefix: host,
      })

      let context = new nattyFetch.context()
      context.create('order', {
        create: {
          url: 'api/order-create',
          method: 'POST',
        },
      })
      context.api.order.create().then(function(data) {
        // 调用一个不存在的函数, 触发一个js错误
        notExistedFn()
      })['catch'](function (error) {
        if (window.console) {
          console.log(error.message)
          console.error(error.stack)
        } else {
          C.log(error.message, error.stack)
        }
        done()
      })
    })

    it('check global `resolve`', function (done) {
      nattyFetch.setGlobal({
        urlPrefix: host,
      })

      nattyFetch.on('resolve', function (data, config) {
        try {
          expect(data.id).to.be(1)
          done()
        } catch(e) {
          done(e)
        }
      })

      let context = nattyFetch.context()
      context.create('order', {
        create: {
          url: 'api/order-create',
          method: 'POST',
        },
      })

      context.api.order.create().then(function(data) {}, function () {})
    })

    it('check global `reject`', function (done) {
      nattyFetch.setGlobal({
        urlPrefix: host,
      })

      nattyFetch.on('reject', function (error, config, vars) {
        try {
          expect(error.code).to.be(1)
          expect(vars.data.foo).to.be('foo')
          expect(vars.data.name).to.be('name')
          done()
        } catch(e) {
          done(e)
        }
      })

      let context = nattyFetch.context()
      context.create('order', {
        create: {
          url: 'api/return-error',
          method: 'POST',
          data: {
            foo: 'foo',
          },
        },
      })
      context.api.order.create({
        name: 'name',
      }).then(function(data) {}).catch(function () {
      })
    })

    it('check context `resolve`', function (done) {
      let context = nattyFetch.context({
        urlPrefix: host,
      })

      context.on('resolve', function (data, config) {
        try {
          expect(data.id).to.be(1)
          done()
        } catch(e) {
          done(e)
        }
      })

      context.create('order', {
        create: {
          url: 'api/order-create',
          method: 'POST',
        },
      })
      context.api.order.create().then(function(data) {
      }, function () {

      })
    })

    it('check context `reject`', function (done) {
      let context = nattyFetch.context({
        urlPrefix: host,
      })

      context.on('reject', function (error, config) {
        try {
          expect(error.code).to.be(1)
          done()
        } catch(e) {
          done(e)
        }
      })

      context.create('order', {
        create: {
          url: 'api/return-error',
          method: 'POST',
        },
      })
      context.api.order.create().then(function(data) {}, function () {})
    })

    it('check both global and context `resolve`', function (done) {
      let globalResolve = false
      nattyFetch.setGlobal({
        urlPrefix: host,
      })

      nattyFetch.on('resolve', function (content) {
        //console.log(1, content);
        globalResolve = true
      })

      let context = nattyFetch.context({})

      context.on('resolve', function (content) {
        //console.log(2, content);
        try {
          expect(globalResolve).to.be(true)
          expect(content.id).to.be(1)
          done()
        } catch(e) {
          done(e)
        }
      })

      context.create('order', {
        create: {
          url: 'api/order-create',
          method: 'POST',
        },
      })
      context.api.order.create().then(function(data) {}, function () {})
    })

    it('check both global and context `reject`', function (done) {
      let globalReject = false
      nattyFetch.setGlobal({
        urlPrefix: host,
      })

      nattyFetch.on('reject', function (error) {
        //console.log(1, error);
        globalReject = true
      })


      let context = nattyFetch.context({
        urlPrefix: host,
      })

      context.on('reject', function (error, config) {
        //console.log(2, error);
        try {
          expect(globalReject).to.be(true)
          expect(error.code).to.be(1)
          done()
        } catch(e) {
          done(e)
        }
      })

      context.create('order', {
        create: {
          url: 'api/return-error',
          method: 'POST',
        },
      })
      context.api.order.create().then(function(data) {}, function () {})
    })

  })

  describe('api config', function () {
    this.timeout(1000*10)
    let context

    beforeEach('reset context', function () {
      context = nattyFetch.context({
        urlPrefix: host,
        jsonp: true,
        mock: false,
      })
    })

    it('both object and function can be used as api\'s config', function () {
      context.create('order', {
        // api 对应 配置
        pay: {},
        // api 对应 返回配置的函数
        create: function () {
          return {}
        },
      })

      expect(context.api.order).to.be.a('object')
      expect(context.api.order.pay).to.be.a('function')
      expect(context.api.order.create).to.be.a('function')
    })

    it('`mock` option', function () {
      context.create('order', {
        pay: {
          mock: true,
        },
        create: {
          mock: false,
        },
        close: {
          // 此处mock的值等于context.mock
        },
      })

      expect(context.api.order.pay.config.mock).to.be(true)
      expect(context.api.order.create.config.mock).to.be(false)
      expect(context.api.order.close.config.mock).to.be(false)
    })

    it('`mock` value from global', function () {
      let context = nattyFetch.context()
      context.create('order', {
        pay: {
          // 这个mock等于全局mock值
        },
      })

      expect(context.api.order.pay.config.mock).to.be(false)
    })

    it('`jsonp` option', () => {
      context.create('order', {
        pay: {
          url: 'path',
        },
        transfer: {
          jsonp: false,
          url: 'path',
        },
        create: {
          url: 'path.jsonp',
        },
        close: {
          url: 'path.jsonp?foo',
        },
        delay: {
          mock: true,
          mockUrl: 'foo',
          jsonp: false, // mock为true时, jsonp的值不会根据url的值自动纠正
          url: 'path.jsonp?foo',
        },
      })

      expect(context.api.order.pay.config.jsonp).to.be(true)
      expect(context.api.order.transfer.config.jsonp).to.be(false)
      expect(context.api.order.create.config.jsonp).to.be(true)
      expect(context.api.order.close.config.jsonp).to.be(true)
      expect(context.api.order.delay.config.jsonp).to.be(false)
    })

  })

  describe.skip('request config', function () {
    this.timeout(1000*10)
    let context

    beforeEach('reset', function () {
      context = nattyFetch.context('Test')
    })
    // 当使用request参数时, 只有data, retry, ignoreSelfConcurrent起作用
    it('`request` config with success', function (done) {
      let getPayId = successFn => {
        setTimeout(function () {
          successFn({id: 1})
        }, 200)
      }
      context.create('order', {
        getSign: {
          data: {
            a: 1,
          },
          request: function (vars, config, defer) {
            // 验证参数是否正确合并
            expect(vars.data.a).to.be(1)
            expect(vars.data.b).to.be(1)
            getPayId(function (content) {
              defer.resolve(content)
            })
          },
        },
      })

      context.api.order.getSign({
        b: 1,
      }).then(function (content) {
        expect(content.id).to.be(1)
        done()
      })
    })

    it('`request` config with error', function (done) {
      let getPayId = (successFn, errorFn) => {
        setTimeout(function () {
          errorFn({message: 1})
        }, 200)
      }
      context.create('order', {
        getSign: {
          request: function (data, config, defer, retryTime) {
            getPayId(function (content) {
              defer.resolve(content)
            }, function (error) {
              defer.reject(error)
            })
          },
        },
      })

      context.api.order.getSign().then(function (content) {
      }, function (error) {
        expect(error.message).to.be(1)
        done()
      })
    })

    it('`request` config with retry', function (done) {
      let getPayId = (successFn, errorFn) => {
        setTimeout(function () {
          errorFn({message: 1})
        }, 200)
      }
      context.create('order', {
        getSign: {
          retry: 1,
          request: function (data, config, defer, retryTime) {
            //console.log(retryTime);

            getPayId(function (content) {
              defer.resolve(content)
            }, function (error) {
              defer.reject(error)
            })
          },
        },
      })

      context.api.order.getSign().then(function (content) {
      }, function (error) {
        expect(error.message).to.be(1)
        done()
      })
    })

    it('`request` config with ignoreSelfConcurrent', function (done) {
      let count = 0
      let getPayId = (successFn, errorFn) => {
        count++
        setTimeout(function () {
          errorFn({message:1})
        }, 200)
      }

      context.create('order', {
        getSign: {
          ignoreSelfConcurrent: true,
          request: function (data, config, defer, retryTime) {
            //console.log(retryTime);

            getPayId(function (content) {
              defer.resolve(content)
            }, function (error) {
              defer.reject(error)
            })
          },
        },
      })

      context.api.order.getSign().then(function (content) {
      }, function (error) {
        expect(error.message).to.be(1)
      })

      context.api.order.getSign().then(function (content) {
      }, function (error) {
      })

      setTimeout(function () {
        expect(count).to.be(1)
        done()
      }, 1000)
    })
  })

  describe('ajax', function() {
    // NOTE 重要: 为了能够测试完整的场景, 默认已经全局关闭所有请求的浏览器缓存!!!  比如: ignoreSelfConcurrent
    //nattyFetch.setGlobal({
    //  cache: false,
    //  traditional: true
    //});

    this.timeout(1000*10)
    let context

    beforeEach('reset', function () {
      context = nattyFetch.context('Test', {
        urlPrefix: host,
        mock: false,
      })
    })

    it('play with standard data structure', function (done) {

      context.create('order', {
        create: {
          url: 'api/order-create',
          method: 'POST',
          data: {
            foo: 'foo',
          },
          query: {
            token: 'boo',
          },
          fit(r, vars) {
            // console.log(vars.requester.getResponseHeader('Content-Type'))
            return r
          },
          //traditional: true
        },
      })

      context.api.order.create().then(function(data) {
        try {
          expect(data.id).to.be(1)
          done()
        } catch(e) {
          done(e)
        }
      })
    })

    it('xhr status', function (done) {

      context.create('order', {
        create: {
          url: 'api/order-create',
          method: 'POST',
          fit(response, vars) {
            expect(vars.requester.status).to.be(200)
            return response
          },
        },
      })

      context.api.order.create().then(function(data) {
        try {
          expect(data.id).to.be(1)
          done()
        } catch(e) {
          done(e)
        }
      })
    })

    it('play with non-standard data structure by `fit`', function (done) {
      context.create('order', {
        create: {
          url: host + 'api/order-create-non-standard',
          method: 'POST',
          fit: function (response) {
            return {
              success: !response.hasError,
              content: response.content,
            }
          },
        },
      })
      context.api.order.create().then(function(data) {
        try {
          expect(data.id).to.be(1)
          done()
        } catch(e) {
          done(e)
        }
      })
    })

    it('process data', function (done) {
      context.create('order', {
        create: {
          url: host + 'api/order-create',
          method: 'POST',
          process: function (response) {
            return {
              orderId: response.id,
            }
          },
        },
      })
      context.api.order.create().then(function(data) {
        try {
          expect(data.orderId).to.be(1)
          done()
        } catch(e) {
          done(e)
        }
      })
    })

    

    it('fix data is object', function (done) {
      context.create('order', {
        create: {
          url: host + 'api/order-create',
          method: 'POST',
          data: {
            fixData: 1,
          },
          willFetch: function (vars, config) {
            vars.data.hookData = 1
            // console.log(vars);
            // console.log(config);
            // console.log(this);
          },
          process: function (content, vars) {
            expect(vars.data.fixData).to.be(1)
            expect(vars.data.liveData).to.be(1)
            expect(vars.data.hookData).to.be(1)
            return {
              orderId: content.id,
            }
          },
          fit: function (response, vars) {
            expect(vars.data.fixData).to.be(1)
            expect(vars.data.liveData).to.be(1)
            expect(vars.data.hookData).to.be(1)
            return response
          },
        },
      })

      context.api.order.create({
        liveData: 1,
      }).then(function(data) {
        try {
          expect(data.orderId).to.be(1)
          done()
        } catch(e) {
          done(e)
        }
      })
    })

    // 固定参数和动态参数 在process和fix方法中都可以正确获取到
    it('fix data is wrapped in fn', function (done) {
      context.create('order', {
        create: {
          url: host + 'api/order-create',
          method: 'POST',
          data: function(){
            return {
              fixData: 1,
            }
          },
          willFetch: function (vars, config) {
            vars.data.hookData = 1
            // console.log(vars);
            // console.log(config);
            // console.log(this);
          },
          process: function (content, vars) {
            expect(vars.data.fixData).to.be(1)
            expect(vars.data.liveData).to.be(1)
            expect(vars.data.hookData).to.be(1)
            expect(vars.contextId).to.be('Test')
            return {
              orderId: content.id,
            }
          },
          fit: function (response, vars) {
            expect(vars.data.fixData).to.be(1)
            expect(vars.data.liveData).to.be(1)
            expect(vars.data.hookData).to.be(1)
            // console.log('vars', vars)
            
            return response
          },
        },
      })

      context.api.order.create({
        liveData: 1,
      }).then(function(data) {
        try {
          expect(data.orderId).to.be(1)
          done()
        } catch(e) {
          done(e)
        }
      })
    })


    it('skip process data when it is mocking ', function (done) {

      // const context = nattyFetch.context({
      //   urlPrefix: host,
      //   mock: false
      // });

      context.create('order', {
        create: {
          mock: true,
          mockUrl: host + 'api/order-create',
          process: function (response) {
            if (this.mock) {
              return response
            } else {
              return {
                orderId: response.id,
              }
            }
          },
        },
      })
      context.api.order.create().then(function(data) {
        try {
          expect(data.id).to.be(1)
          done()
        } catch(e) {
          done(e)
        }
      })
    })

    it('error by 404', function (done) {
      context.create('order', {
        create: {
          //log: true,
          url: host + 'api/404',
          method: 'POST',
          timeout: 100,
          fit(r) {
            expect().fail('状态码404不应该执行到这里')
            return r
          },
        },
      })

      context.api.order.create().then(function () {

      }).catch(function(error) {
        try {
          expect(error.status).to.be(404)
          done()
        } catch(e) {
          done(e)
        }
      })
    })

    it('error by timeout', function (done) {
      context.create('order', {
        create: {
          //log: true,
          url: host + 'api/timeout',
          method: 'POST',
          timeout: 100,
        },
      })
      context.api.order.create().then(function () {
        // can not go here
        // debugger
      }, function(error) {
        try {
          expect(error.timeout).to.be(true)
          done()
        } catch(e) {
          done(e)
        }
      })
    })

    it('pending status checking', function (done) {

      const myContext = nattyFetch.context()
      myContext.create('order', {
        create: {
          //log: true,
          url: host + 'api/timeout',
          method: 'POST',
          timeout: 200,
        },
      })

      myContext.api.order.create().then(function () {
        // can not go here
      }, function(error) {
        try {
          expect(myContext.api.order.create.hasPending()).to.be(false)
          done()
        } catch(e) {
          done(e)
        }
      })

      expect(myContext.api.order.create.hasPending()).to.be(true)
    })

    it('mark data (TODO ADD SERVER CHECK)', function (done) {
      context.create('order', {
        create: {
          url: host + 'api/order-create',
          method: 'POST',
          data: {
            foo: 'foo',
          },
          urlMark: false,
          urlStamp: false,
        },
      })

      context.api.order.create().then(function (data) {
        try {
          expect(data.id).to.be(1)
          done()
        } catch(e) {
          done(e)
        }
      }, function() {
      // can not go here
      })
    })

    it('`GET` resolving after retry', function (done) {
      context.create('order', {
        create: {
          url: host + 'api/retry-success',
          method: 'GET',
          retry: 2,
        },
      })

      context.api.order.create().then(function (data) {
        try {
          expect(data.id).to.be(1)
          done()
        } catch(e) {
          done(e)
        }
      }, function() {
        // can not go here
      })
    })

    it('`GET` with fn-data resolving after retry', function (done) {
      context.create('order', {
        create: {
          url: host + 'api/retry-success',
          method: 'GET',
          retry: 2,
        },
      })

      let count = 0

      context.api.order.create(function () {
        return {
          count: count++,
        }
      }).then(function (data) {
        try {
          expect(data.id).to.be(1)
          done()
        } catch(e) {
          done(e)
        }
      }, function() {
        // can not go here
      })
    })

    it('`POST` resolving after retry', function (done) {
      // console.log('~~~~~~~~~')
      const context = nattyFetch.context({
        urlPrefix: host,
        mock: false,
      })

      context.create('order', {
        create: {
          url: host + 'api/post-retry-success',
          method: 'POST',
          retry: 2,
          header: {
            // 如果不设置，默认的Content-Type是text/plain，发出的数据是JSON.stringify(data)
            // 'Content-Type': 'application/x-www-form-urlencoded;chartset=utf-8' // foo=bar&x=y
            // 如果设置了自定义的`application/json`值，浏览器会发送OPTIONS请求
            // 'Content-Type': 'application/json;chartset=utf-8' // '{"foo":"bar","x":"y"}'
          },
        },
      })

      context.api.order.create({
        foo: 'bar',
        x: 'y',
      }).then(function (data) {
        try {
          expect(data.id).to.be(1)
          done()
        } catch(e) {
          done(e)
        }
      }, function() {
        // can not go here
      })
    })

    it('rejecting after retry', function (done) {
      context.create('order', {
        create: {
          url: host + 'api/return-error',
          retry: 1,
        },
      })
      context.api.order.create().then(function (data) {
        // can not go here
      }, function(error) {
        try {
          expect(error.code).to.be(1)
          done()
        } catch(e) {
          done(e)
        }
      })
    })

    it.skip('load svg', function (done) {
      context.create('order', {
        create: {
          url: host + 'api/svg',
          fit(response) {
            return {
              success: true,
              content: response,
            }
          },
        },
      })
      context.api.order.create().then(function (content) {
        // console.log(content)
      }, function(error) {

      })
    })

    // 连发两次请求，第二次应该被忽略
    it('ignore seft concurrent', function (done) {

      context.create('order', {
        create: {
          cache: false,
          url: host + 'api/timeout', // 请求延迟返回的接口
          ignoreSelfConcurrent: true,
        },
      })

      context.api.order.create().then(function (data) {
        try {
          expect(data.id).to.be(1)
          done()
        } catch (e) {
          done(e)
        }
      })

      // 第一次请求未完成之前 第二次请求返回的是一个伪造的promise对象
      let dummyPromise = context.api.order.create().then(function(){
        throw new Error('unexpected `resolved`')
      })
      expect(dummyPromise).to.have.property('dummy')

      // 伪造的promise对象要保证支持链式调用
      expect(dummyPromise.then()).to.be(dummyPromise)
      expect(dummyPromise.then()['catch']()).to.be(dummyPromise)
    })

    // 连发两次请求, 第二次请求发起时, 如果第一次请求还没有返回, 则取消掉第一次请求(即: 返回时不响应)
    it('override seft concurrent(XHR)', function (done) {

      context.create('order', {
        create: {
          cache: false,
          url: host + 'api/timeout', // 请求延迟返回的接口
          overrideSelfConcurrent: true,
          process: function(content, vars) {

            // vars不应该混淆
            expect(vars.data.d).to.be(2)
          },
        },
      })

      let count = 0

      // 第一次请求, 不应该有响应
      context.api.order.create({
        d: 1,
      }).then(function (data) {
        count++
      })

      // 第二次请求, 只响应这次请求
      setTimeout(function(){
        context.api.order.create({
          d:2,
        }).then(function (data) {
          try {
            expect(count).to.be(0)
            done()
          } catch (e) {
            done(e)
          }
        })
      }, 300)
    })

    // 连发两次请求, 第二次请求发起时, 如果第一次请求还没有响应, 则取消掉第一次请求(的响应)
    it('override seft concurrent(JSONP)', function (done) {

      context.create('order', {
        create: {
          cache: false,
          jsonp: true,
          url: host + 'api/jsonp-timeout', // 请求延迟返回的接口
          overrideSelfConcurrent: true,
          process: function(content, vars) {
            // vars不应该混淆
            expect(vars.data.d).to.be(2)
          },
        },
      })

      let count = 0

      // 第一次请求, 不应该有响应
      context.api.order.create({
        d: 1,
      }).then(function (data) {
        count++
      })

      // 第二次请求, 只响应这次请求
      setTimeout(function(){
        context.api.order.create({
          d:2,
        }).then(function (data) {
          try {
            expect(count).to.be(0)
            done()
          } catch (e) {
            done(e)
          }
        })
      }, 300)
    })
  })


  describe('jsonp', function () {
    // NOTE 重要: 为了能够测试完整的场景, 默认已经全局关闭所有请求的浏览器缓存!!!  比如: ignoreSelfConcurrent
    //nattyFetch.setGlobal({
    //  cache: false
    //});

    this.timeout(1000*10)
    let context

    beforeEach('reset', function () {
      context = nattyFetch.context({
        urlPrefix: host,
        mock: false,
      })
    })

    it('check default jsonpCallbackQuery', function () {
      context.create('order', {
        create: {
          url: host + 'api/order-create',
          jsonp: true,
        },
      })

      expect(context.api.order.create.config.jsonpCallbackQuery).to.be(undefined)
    })

    it('check custom jsonpCallbackQuery', function () {
      context.create('order', {
        create: {
          url: host + 'api/order-create',
          jsonp: [true, 'cb', 'j{id}'],
        },
      })

      expect(context.api.order.create.config.jsonp).to.be(true)
      expect(context.api.order.create.config.jsonpFlag).to.be('cb')
      expect(context.api.order.create.config.jsonpCallbackName).to.be('j{id}')
    })

    it('auto detect jsonp option', function () {
      context.create('order', {
        create: {
          url: host + 'api/order-create.jsonp',
        },
      })

      expect(context.api.order.create.config.jsonp).to.be(true)
    })

    it('jsonp response empty', function (done) {
      context.create('order', {
        create: {
          url: host + 'api/empty.jsonp',
        },
      })

      context.api.order.create().catch(function(data) {
        try {
          expect(data.message).to.contain('返回值错误')
          done()
        } catch (e) {
          done(e)
        }
      })
    })

    it('jsonp response.success is true', function (done) {
      context.create('order', {
        create: {
          traditional: true,
          data: {
            a: [1,2,3],
          },
          //log: true,
          url: host + 'api/jsonp-order-create',
          jsonp: true,
          fit(r, vars) {
            // console.log('vars', vars)
            return r
          },
        },
      })

      context.api.order.create().then(function (data) {

        try {
          expect(data.id).to.be(1)
          done()
        } catch (e) {
          done(e)
        }
      })
    })

    it('jsonp response.success is false ', function (done) {
      context.create('order', {
        create: {
          //log: true,
          url: host + 'api/jsonp-order-create-error',
          jsonp: true,
        },
      })

      context.api.order.create().then(function (data) {
        // can not go here
      }, function (error) {
        try {
          expect(error).to.have.property('message')
          done()
        } catch (e) {
          done(e)
        }
      })
    })

    // jsonp无法使用状态吗识别出具体的404、500等错误，都统一成`无法连接`的错误信息
    it('jsonp with error url', function (done) {
      context.create('order', {
        create: {
          url: host + 'error-url',
          jsonp: true,
        },
      })

      // TODO
      context.on('reject', function (error) {
        console.warn(error)
      })

      context.api.order.create().then(function (data) {
        // can not go here
      }, function (error) {
        try {
          expect(error.message).to.contain('Not Accessable JSONP')
          done()
        } catch (e) {
          done(e)
        }
      })
    })

    it('jsonp timeout', function (done) {
      context.create('order', {
        create: {
          //log: true,
          url: host + 'api/jsonp-timeout',
          jsonp: true,
          timeout: 300,
        },
      })
      context.api.order.create().then(function () {
        // can not go here
      }, function(error) {
        try {
          expect(error.timeout).to.be(true)
          done()
        } catch(e) {
          done(e)
        }
      })
    })

    it('`JSONP` resolving after retry', function (done) {
      context.create('order', {
        create: {
          url: host + 'api/jsonp-retry-success',
          jsonp: true,
          retry: 2,
        },
      })

      context.api.order.create().then(function (data) {
        try {
          expect(data.id).to.be(1)
          done()
        } catch(e) {
          done(e)
        }
      }, function() {
        // can not go here
      })
    })

    it('rejecting after retry', function (done) {
      context.create('order', {
        create: {
          url: host + 'api/jsonp-error',
          jsonp: true,
          retry: 1,
        },
      })
      context.api.order.create().then(function (data) {
        // can not go here
      }, function(error) {
        try {
          expect(error.code).to.be(1)
          done()
        } catch(e) {
          done(e)
        }
      })
    })

    it('ignore self concurrent', function (done) {
      context.create('order', {
        create: {
          url: host + 'api/jsonp-timeout', // 请求延迟返回的接口
          jsonp: true,
          ignoreSelfConcurrent: true,
        },
      })

      // 连发两次请求，第二次应该被忽略
      context.api.order.create().then(function (data) {
        try {
          expect(data.id).to.be(1)
          done()
        } catch (e) {
          done(e)
        }
      })

      // 第一次请求未完成之前 第二次请求返回的是一个伪造的promise对象
      let dummyPromise = context.api.order.create()
      expect(dummyPromise).to.have.property('dummy')

      // 伪造的promise对象要保证支持链式调用
      expect(dummyPromise.then()).to.be(dummyPromise)
      expect(dummyPromise.then()['catch']()).to.be(dummyPromise)
    })
  })




})
