import {host} from '../config/host'

let xit = function(ignore, fn) {
  fn()
}
xit.xonly = xit

describe('onerIO.create', function () {

  this.timeout(1000*4)

  it('play with standard data structure', function (done) {
    let fooFetch = onerIO.create({
      urlPrefix: host,
      url: 'api/order-create',
      method: 'POST',
      fit: function (res) {
        if (res.success) {
          this.toResolve(res.content)
        } else {
          this.toReject(res.error)
        }
      }
      //traditional: true
    })

    fooFetch().then(function(data) {
      try {
        expect(data.id).to.be(1)
        done()
      } catch(e) {
        done(e)
      }
    })
  })

  it('play with non-standard data structure by `fit`', function (done) {
    let fooFetch = onerIO.create({
      url: host + 'api/order-create-non-standard',
      method: 'POST',
      fit: function (response) {
        // return {
        //   success: !response.hasError,
        //   content: response.content,
        // }
        if (!response.hasError) {
          this.toResolve(response.content)
        } else {
          this.toReject({
            message: 'api failed !'
          })
        }
      },
    })

    fooFetch().then(function(data) {
      try {
        expect(data.id).to.be(1)
        done()
      } catch(e) {
        done(e)
      }
    })
  })

  it('process data', function (done) {

    let fooFetch = onerIO.create({
      url: host + 'api/order-create',
      method: 'POST',
      fit: function (res) {
        if (res.success) {
          this.toResolve(res.content)
        } else {
          this.toReject(res.error)
        }
      },
      process: function (content) {
        return {
          orderId: content.id,
        }
      },
    })

    fooFetch().then(function(content) {
      try {
        expect(content.orderId).to.be(1)
        done()
      } catch(e) {
        done(e)
      }
    })
  })

  // 固定参数和动态参数 在process和fix方法中都可以正确获取到
  it('`vars.data` in process or fix method', function (done) {
    let fooFetch = onerIO.create({
      url: host + 'api/order-create',
      method: 'POST',
      data: {
        liveData: 1,
      },
      willFetch: function (vars, config) {
        vars.data.hookData = 1
        // console.log(vars);
        // console.log(config);
        // console.log(this);
      },
      process: function (content, vars) {
        expect(vars.data.liveData).to.be(1)
        expect(vars.data.hookData).to.be(1)
        return {
          orderId: content.id,
        }
      },
      fit: function (response, vars) {
        expect(vars.data.liveData).to.be(1)
        expect(vars.data.hookData).to.be(1)
        // return response
        if (response.success) {
          this.toResolve(response.content)
        } else {
          this.toReject(response.error)
        }
      },
    })

    fooFetch().then(function(data) {
      try {
        expect(data.orderId).to.be(1)
        done()
      } catch(e) {
        done(e)
      }
    })
  })


  it('skip process data when it is mocking ', function (done) {
    let fooFetch = onerIO.create({
      mock: true,
      mockUrl: host + 'api/order-create',
      fit: function(res) {
        if (res.success) {
          this.toResolve(res.content)
        } else {
          this.toReject(res.error)
        }
      },
      process: function (response) {
        if (this.mock) {
          return response
        } else {
          return {
            orderId: response.id,
          }
        }
      },
    })

    fooFetch().then(function(data) {
      try {
        expect(data.id).to.be(1)
        done()
      } catch(e) {
        done(e)
      }
    })
  })

  it('error by requesting cross-domain with custom header', function (done) {
    let fooFetch = onerIO.create({
      //log: true,
      url: host + 'api/order-create',
      method: 'POST',
      header: {foo: 'foo'}, // 跨域时, 自定义的`header`将被忽略
      fit: function (res) {
        if (res.success) {
          this.toResolve(res.content)
        } else {
          this.toReject(res.error)
        }
      },
    })

    fooFetch().then(function (data) {
      // 微软系浏览器走到这里，允许跨域时使用自定义header
      try {
        expect(data.id).to.be(1)
        done()
      } catch (e) {
        done(e)
      }
    }, function(error) {
      // 现代浏览器走到这里
      done()
    })
  })

  it('error by timeout', function (done) {
    let fooFetch = onerIO.create({
      //log: true,
      url: host + 'api/timeout',
      method: 'POST',
      timeout: 100,
      fit: function (res) {
        if (res.success) {
          this.toResolve(res.content)
        } else {
          this.toReject(res.error)
        }
      },
    })

    fooFetch().then(function () {
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

  it('`GET` resolving after retry', function (done) {
    let fooFetch = onerIO.create({
      url: host + 'api/retry-success',
      method: 'GET',
      retry: 2,
      fit: function (res) {
        if (res.success) {
          this.toResolve(res.content)
        } else {
          this.toReject(res.error)
        }
      },
    })

    fooFetch().then(function (data) {
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

    let count = 0

    let fooFetch = onerIO.create({
      url: host + 'api/retry-success',
      method: 'GET',
      retry: 2,
      fit: function (res) {
        if (res.success) {
          this.toResolve(res.content)
        } else {
          this.toReject(res.error)
        }
      },
      data: function () {
        return {
          count: count++,
        }
      },
    })

    fooFetch().then(function (data) {
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
    let fooFetch = onerIO.create({
      url: host + 'api/retry-success',
      method: 'POST',
      retry: 2,
      fit: function (res) {
        if (res.success) {
          this.toResolve(res.content)
        } else {
          this.toReject(res.error)
        }
      },
    })

    fooFetch().then(function (data) {
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
    let fooFetch = onerIO.create({
      url: host + 'api/return-error',
      retry: 1,
      fit: function (res) {
        if (res.success) {
          this.toResolve(res.content)
        } else {
          this.toReject(res.error)
        }
      },
    })

    fooFetch().then(function (data) {
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

  // 简单请求的`ignoreSelfConcurrent`不会起作用, 连发两次请求，第二次依然有效
  it('`ignoreSeftConcurrent` should work', function (done) {
    const fooFetch = onerIO.create({
      cache: false,
      url: host + 'api/timeout', // 请求延迟返回的接口
      ignoreSelfConcurrent: true,
      fit: function (res) {
        if (res.success) {
          this.toResolve(res.content)
        } else {
          this.toReject(res.error)
        }
      },
    })

    fooFetch().then(function (data) {
      try {
        expect(data.id).to.be(1)
        done()
      } catch (e) {
        done(e)
      }
    })

    // 第一次请求未完成之前 第二次请求返回的是一个伪造的promise对象
    let dummyPromise = fooFetch().then(function(){
      throw new Error('unexpected `resolved`')
    })
    expect(dummyPromise).to.have.property('dummy')

    // 伪造的promise对象要保证支持链式调用
    expect(dummyPromise.then()).to.be(dummyPromise)
    expect(dummyPromise.then()['catch']()).to.be(dummyPromise)
  })

  // 连发两次请求, 第二次请求发起时, 如果第一次请求还没有返回, 则取消掉第一次请求(即: 返回时不响应)
  it('`overrideSeftConcurrent` should work (XHR)', function (done) {

    // 第一次请求, 不应该有响应
    let fooFetch = onerIO.create({
      url: host + 'api/timeout', // 请求延迟返回的接口
      data: {
        d: 0,
      },
      overrideSelfConcurrent: true,
      process: function(content, vars) {
        // vars不应该混淆
        expect(vars.data.d).to.be(2)
      },
      fit: function (res) {
        if (res.success) {
          this.toResolve(res.content)
        } else {
          this.toReject(res.error)
        }
      },
    })

    let count = 0

    // 第一次请求, 不应该有响应
    fooFetch({
      d: 1,
    }).then(function (data) {
      count++
    })

    // 第二次请求, 只响应这次请求
    setTimeout(function(){
      fooFetch({
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