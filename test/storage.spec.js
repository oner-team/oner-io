import {host} from '../config/host'

const noop = function () {

}
const _it = function(s, f) {
  f(noop)
}

describe('storage', function () {

  this.timeout(1000*4)

  it('query string is same: localStorage', function (done) {

    // localStorage.clear();
    const context = onerIO.context({
      urlPrefix: host,
      mock: false,
      fit: function (res) {
        if (res.success) {
          this.toResolve(res.content)
        } else {
          this.toReject(res.error)
        }
      }
    })

    let requestTime = 0
    context.create('user', {
      getPhone: {
        url: 'api/return-success',
        willFetch: function (vars, config, from) {
          if (from === 'remote') {
            requestTime++
          }
        },
        storage: {
          type: 'localStorage',
          tag: 'v1.0',
          key: 'test-query-string',
        },
      },
    })

    // 第一次请求走网络
    context.api.user.getPhone({
      b:2,
      a:2,
    }).then(function (r) {
      // 第二次请求走storage
      return context.api.user.getPhone({
        a:2,
        b:2,
      })
    }).then(function (data) {
      try {
        expect(data.id).to.be(1)
        expect('requestTime:' + requestTime).to.be('requestTime:'+1)
        done()
      } catch (e) {
        done(e)
      }

      // 特别注意 expect不管是否成功, 都要销毁storage, 避免下次刷新后的测试
      context.api.user.getPhone.storage.destroy()

    })['catch'](function(error){
      console.error(error)
      console.error('storage error: ' + error)
    })
  })

  it('query string is same: sessionStorage', function (done) {

    // localStorage.clear();
    const context = onerIO.context({
      urlPrefix: host,
      mock: false,
      fit: function (res) {
        if (res.success) {
          this.toResolve(res.content)
        } else {
          this.toReject(res.error)
        }
      }
    })

    let requestTime = 0
    context.create('user', {
      getPhone: {
        url: host + 'api/return-success',
        willFetch: function (vars, config, from) {
          if (from === 'remote') {
            requestTime++
          }
        },
        storage: {
          type: 'sessionStorage',
          tag: 'v1.0',
        },
      },
    })

    // 第一次请求走网络
    context.api.user.getPhone({
      b:1,
      a:1,
    }).then(function (r) {
      // 第二次请求走storage
      return context.api.user.getPhone({
        a:1,
        b:1,
      })
    }).then(function (data) {
      try {
        expect(data.id).to.be(1)
        expect(requestTime).to.be(1)
        done()
      } catch (e) {
        done(e)
      }
      // 特别注意 expect不管是否成功, 都要销毁storage, 避免下次刷新后的测试
      context.api.user.getPhone.storage.destroy()

    })['catch']()
  })

  //
  it('query string is same: variable', function (done) {

    // localStorage.clear();
    const context = onerIO.context({
      urlPrefix: host,
      mock: false,
      fit: function (res) {
        if (res.success) {
          this.toResolve(res.content)
        } else {
          this.toReject(res.error)
        }
      }
    })

    let requestTime = 0
    context.create('user', {
      getPhone: {
        url: host + 'api/return-success',
        willFetch: function (vars, config, from) {
          if (from === 'remote') {
            requestTime++
          }
        },
        storage: {
          type: 'variable',
          tag: 'v1.0',
        },
      },
    })



    // 第一次请求走网络
    context.api.user.getPhone({
      b:1,
      a:1,
    }).then(function (r) {
      // 第二次请求走storage
      return context.api.user.getPhone({
        a:1,
        b:1,
      })
    }).then(function (data) {
      try {
        expect(data.id).to.be(1)
        expect(requestTime).to.be(1)
        done()
      } catch (e) {
        done(e)
      }
    })['catch']()
  })

  it('query string is same with jsonp', function (done) {


    // localStorage.clear();
    const context = onerIO.context({
      urlPrefix: host,
      mock: false,
      fit: function (res) {
        if (res.success) {
          this.toResolve(res.content)
        } else {
          this.toReject(res.error)
        }
      }
    })

    let requestTime = 0
    context.create('user', {
      getPhone: {
        jsonp: true,
        url: host + 'api/jsonp-order-create',
        willFetch: function (vars, config, from) {
          if (from === 'remote') {
            requestTime++
          }
        },
        storage: {
          type: 'localStorage',
          tag: 'v1.0',
          key: 'test-jsonp-with-storage',
        },
      },
    })


    // 第一次请求走网络
    context.api.user.getPhone({
      b:1,
      a:1,
    }).then(function (r) {
      // 第二次请求走storage
      return context.api.user.getPhone({
        a:1,
        b:1,
      })
    }).then(function (data) {
      try {
        expect(data.id).to.be(1)
        expect(requestTime).to.be(1)
        done()
      } catch (e) {
        done(e)
      }
      // 特别注意 expect不管是否成功, 都要销毁storage, 避免下次刷新后的测试
      context.api.user.getPhone.storage.destroy()
    })['catch']()
  })

  it('query string is different', function (done) {

    // localStorage.clear();
    const context = onerIO.context({
      urlPrefix: host,
      mock: false,
      fit: function (res) {
        if (res.success) {
          this.toResolve(res.content)
        } else {
          this.toReject(res.error)
        }
      }
    })

    let requestTime = 0
    context.create({
      get: {
        url: host + 'api/return-success',
        willFetch: function (vars, config, from) {
          if (from === 'remote') {
            requestTime++
          }
        },
        storage: true,
      },
    })

    // 第一次请求走网络
    context.api.get({
      b:1,
      a:1,
    }).then(function () {
      // 第二次请求, 参数不一样, 依然走网络
      return context.api.get({
        a:1,
      })
    }).then(function (data) {
      try {
        expect(data.id).to.be(1)
        expect(requestTime).to.be(2)
        done()
      } catch (e) {
        done(e)
      }
      // 特别注意 expect不管是否成功, 都要销毁storage, 避免下次刷新后的测试
      context.api.get.storage.destroy()
    })['catch']()
  })


  it('no query string', function (done) {

    // localStorage.clear();
    const context = onerIO.context({
      urlPrefix: host,
      mock: false,
      fit: function (res) {
        if (res.success) {
          this.toResolve(res.content)
        } else {
          this.toReject(res.error)
        }
      }
    })

    let requestTime = 0
    context.create({
      get: {
        url: host + 'api/return-success',
        willFetch: function (vars, config, from) {
          if (from === 'remote') {
            requestTime++
          }
        },
        storage: {
          type: 'variable',
        },
      },
    })

    // 第一次请求走网络
    context.api.get().then(function () {
      // 第二次请求, 走storage
      return context.api.get()
    }).then(function (data) {
      try {
        expect(data.id).to.be(1)
        expect(requestTime).to.be(1)
        done()
      } catch (e) {
        done(e)
      }
      // 特别注意 expect不管是否成功, 都要销毁storage, 避免下次刷新后的测试
      context.api.get.storage.destroy()
    })['catch']()
  })
})