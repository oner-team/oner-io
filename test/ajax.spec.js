import ExpectAction from './expect-action'
import {host} from '../config/host'
const {_ajax} = onerIO

describe('./ajax', function () {

  describe('dependent detects', function () {
    it('support `CORS`', function () {
      expect(_ajax.supportCORS).to.be(true)
    })
  })

  describe('browser detects：NOT used in onerIO', function () {
    let xhr = new XMLHttpRequest()

    let methods = ['loadstart', 'load', 'progress', 'error', 'timeout']

    methods.forEach(function (method) {
      it('support `' + method + '` event: ' + ('on' + method in xhr), function () {
        
      })
    })

    // http://enable-cors.org/index.html
    it('support `CORS`: ' + ('withCredentials' in xhr), function () {
      
    })
  })

  describe('post', function () {
    it('accept text', function (done) {
      _ajax({
        url: host + 'api/return-text',
        method: 'POST',
        data: {
          'return-text': 1,
        },
        success: function (res, xhr) {
          expect(res).to.be('text')
          done()
        },
      })
    })

    it('accept json', function (done) {
      _ajax({
        url: host + 'api/return-json',
        method: 'POST',
        data: {
          'return-json': 1,
        },
        accept: 'json',
        success: function (res, xhr) {
          expect(res).to.eql({tool: 'oner-io'})
          done()
        },
      })
    })

    it('accept script', function (done) {
      _ajax({
        url: host + 'api/return-script',
        method: 'POST',
        data: {
          'return-script': 1,
        },
        accept: 'script',
        success: function (res, xhr) {
          expect(__test__).to.be(1)
          window.__test__ = null
          done()
        },
      })
    })
  })


  describe('event', function () {
    let ea = new ExpectAction()

    beforeEach('reset expectEvents', function () {
      ea.reset()
    })

    afterEach('check expectEvents', function () {
      ea.check()
    })

    it('should trigger success and complete', function (done) {

      ea.expect(['success', 'complete'])

      _ajax({
        url: host + 'api/return-json',
        method: 'POST',
        data: {
          'return-json-success': 1,
        },
        success: function (res, xhr) {
          ea.do('success')
        },
        complete: function () {
          ea.do('complete')
          done()
        },
      })
    })

    it('should trigger error and complete when 500', function (done) {

      ea.expect(['error', 'complete'])

      _ajax({
        //log: true,
        url: host + 'api/500',
        method: 'POST',
        accept: 'json',
        error: function (status, xhr) {
          ea.do('error')
        },
        complete: function () {
          ea.do('complete')
          done()
        },
      })
    })

    it('should trigger error and complete when 404', function (done) {
      ea.expect(['error', 'complete'])

      _ajax({
        //log: true,
        url: host + 'api/404',
        method: 'POST',
        accept: 'json',
        error: function (status, xhr) {
          ea.do('error')
        },
        complete: function () {
          ea.do('complete')
          done()
        },
      })
    })

    it('should trigger abort and complete when request is aborted', function (done) {

      ea.expect(['abort', 'complete'])

      var xhr = _ajax({
        //log: true,
        url: host + 'api/abort',
        method: 'POST',
        abort: function () {
          ea.do('abort')
        },
        complete: function () {
          ea.do('complete')
        },
      })
      setTimeout(function () {
        xhr.abort()
        done()
      }, 100)
    })

    it('calling `abort` after `complete` event should be ignored', function (done) {
      this.timeout(4000)
      ea.expect(['success', 'complete'])

      var xhr = _ajax({
        log: true,
        url: host + 'api/return-json',
        method: 'POST',
        success: function () {
          ea.do('success')
        },
        complete: function () {
          ea.do('complete')
        },
      })
      setTimeout(function () {
        xhr.abort()
        done()
      }, 1000)
    })
  })
})

