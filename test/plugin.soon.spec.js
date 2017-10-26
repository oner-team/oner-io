import {host} from '../config/host'

const noop = function () {

}
const _it = function(s, f) {
  f(noop)
}

describe('plugin soon', function () {
  it('`soon` method with `storage` is open', function (done) {
    let context = nattyFetch.context({
      urlPrefix: host,
      mock: false,
    })

    let outerCount = 0
    let innerCount = 0
    let requestCount = 0

    context.create({
      'foo.get': {
        url: host + 'api/return-stamp',
        storage: {
          type: 'variable',
        },
        willFetch: function (vars, config, from) {
          if (from === 'remote') {
            requestCount++
          }
        },
        plugins: [
          nattyFetch.plugin.soon,
        ],
      },
    })

    // 外层请求, 首次请求没有storage缓存, success回调只应该执行一次, 数据来自远程服务器
    let outerData
    let innerDataFromStorage
    
    context.api.foo.get.soon({
      q: 1,
    }, function (data) {
      outerCount++
      outerData = data
      // console.log('data', JSON.stringify(data));
      // 内层请求, 参数一致, 应该有storage缓存, success回调应该执行2次,
      context.api.foo.get.soon({
        q:1,
      }, function (data2) {
        innerCount++
        if (innerCount === 1) {
          innerDataFromStorage = data2
        }
        // console.log('data2', JSON.stringify(data2));
      })
    }, function (e) {
      done(e)
    })

    setTimeout(function () {
      try {
        expect(outerCount).to.be(1)
        expect(innerCount).to.be(2)
        expect(requestCount).to.be(2)
        expect(outerData.fromStorage).to.be(false)
        expect(innerDataFromStorage.fromStorage).to.be(true)
        expect(JSON.stringify(outerData.content)).to.be(JSON.stringify(innerDataFromStorage.content))
        context.api.foo.get.storage.destroy()
        done()
      } catch (e) {
        done(e)
      }
    }, 800)
  })

  it('`soon` method with `storage` is closed', function (done) {

    let context = nattyFetch.context({
      urlPrefix: host,
      mock: false,
    })

    let outerCount = 0
    let innerCount = 0
    let requestCount = 0

    context.create({
      'foo.get': {
        url: host + 'api/return-stamp',
        storage: false,
        willFetch: function (vars, config, from) {
          if (from === 'remote') {
            requestCount++
          }
        },
        plugins: [
          nattyFetch.plugin.soon,
        ],
      },
    })

    // 外层请求, 首次请求没有storage缓存, success回调只应该执行一次, 数据来自远程服务器
    let outerData
    let innerDataFromStorage
    context.api.foo.get.soon({
      q: 1,
    }, function (data) {
      outerCount++
      outerData = data
      // console.log('data', JSON.stringify(data));
      // 内层请求, 没有storage缓存, success回调只应该执行一次,
      context.api.foo.get.soon({
        q:1,
      }, function (data2) {
        innerCount++
        innerDataFromStorage = data2
        // console.log('data2', JSON.stringify(data2));
      })
    }, function (e) {
      done(e)
    })

    setTimeout(function () {
      try {
        expect(outerCount).to.be(1)
        expect(innerCount).to.be(1)
        expect(requestCount).to.be(2)
        expect(outerData.fromStorage).to.be(false)
        expect(innerDataFromStorage.fromStorage).to.be(false)
        expect(JSON.stringify(outerData.content)).not.to.be(JSON.stringify(innerDataFromStorage.content))
        done()
      } catch (e) {
        done(e)
      }
    }, 800)
  })
})