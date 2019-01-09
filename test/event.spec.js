import {host} from '../config/host'

describe('./hooks', function(){

  describe('willFetch', function(){

    this.timeout(1000*6)

    it('ajax willFetch call', function (done) {
      let context = nattyFetch.context({
        urlPrefix: host,
        willFetch() {
          done()
        },
      })
      context.create({
        getApi: {
          url: 'api/return-json',
          fit(resp) {
            return {
              success: true,
              content: resp,
            }
          },
        },
      })
      context.api.getApi().then(content => {})
    })

    it('extend config within willFetch', function (done) {
      let context = nattyFetch.context({
        urlPrefix: host,
      })
      context.create({
        getApi: {
          url: 'api/return-json',
          willFetch(vars, config) {
            if (vars.data.t === 1) {
              // 跨域不允许自定义header，断定下发报错，同时也说明自定义header生效了
              config.header.t = 1
            }
          },
          fit(resp) {
            return {
              success: true,
              content: resp,
            }
          },
        },
      })
      context.api.getApi({
        t: 1
      }).then(content => {
      }).catch(e => {
        done()
      })
    })

    it('jsonp willFetch call', function (done) {
      let context = nattyFetch.context({
        urlPrefix: host,
        willFetch() {
          done()
        },
      })
      context.create({
        getApi: {
          url: 'api/jsonp-order-create',
          jsonp: true,
          fit(resp) {
            return resp
          },
        },
      })
      context.api.getApi().then(content => {})
    })

  })

  describe('didFetch', function(){

    it('ajax success didFetch', function (done) {
      let context = nattyFetch.context({
        urlPrefix: host,
      })
      context.create({
        getApi: {
          url: 'api/return-json',
          fit(resp) {
            return {
              success: true,
              content: resp,
            }
          },
          didFetch(config) {
            //console.log(config)
            done()
          },
        },
      })
      context
        .api
        .getApi()
        .then(content => {
        })
    })

    it('jsonp success didFetch long time', function (done) {
      let context = nattyFetch.context({
        urlPrefix: host,
      })
      context.create({
        getApi: {
          url: 'api/jsonp-timeout',
          jsonp: true,
          timeout: 2000,
          fit(resp) {
            return {
              success: true,
              content: resp,
            }
          },
          didFetch(config) {
            //console.log(config)
            done()
          },
        },
      })
      context
        .api
        .getApi()
        .then(content => {
        })
    })

    it('ajax error didFetch', function (done) {
      let context = nattyFetch.context({
        urlPrefix: host,
      })
      context.create({
        getApi: {
          url: 'api/return-error',
          fit(resp) {
            return resp
          },
          didFetch(config) {
            //console.log(config)
            done()
          },
        },
      })
      context
        .api
        .getApi()
        .then(content => {
        }, reason => {
          //console.log(reason)
        })
    })

    it('jsonp error didFetch', function (done) {
      let context = nattyFetch.context({
        urlPrefix: host,
        jsonp: true,
      })
      context.create({
        getApi: {
          url: 'api/jsonp-order-create-error',
          fit(resp) {
            return resp
          },
          didFetch(config) {
            //console.log(config)
            done()
          },
        },
      })
      context
        .api
        .getApi()
        .then(content => {
        }, reason => {
          //console.log(reason)
        })
    })

    it('ajax timeout should NOT fire `didFetch`', function (done) {
      let context = nattyFetch.context({
        urlPrefix: host,
        timeout: 300,
      })
      let count = 0
      context.create({
        getApi: {
          url: 'api/timeout',
          didFetch() {
            // timeout时不应该调用didFetch
            count++
          },
        },
      })

      context.api.getApi().then(function () {

      })['catch'](function () {
        try {
          expect(count).to.be(0)
          done()
        } catch (e) {
          done(e)
        }
      })
    })

    it('jsonp timeout should NOT fire `didFetch`', function (done) {
      let context = nattyFetch.context({
        urlPrefix: host,
        jsonp: true,
        timeout: 300,
      })

      let count = 0
      context.create({
        getApi: {
          url: 'api/jsonp-timeout',
          didFetch() {
            // timeout时不应该调用didFetch
            count++
          },
        },
      })

      context.api.getApi().then(function () {

      })['catch'](function () {
        try {
          expect(count).to.be(0)
          done()
        } catch (e) {
          done(e)
        }
      })
    })

  })

})
