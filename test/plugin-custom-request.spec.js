"use strict"
import {host} from '../config/host'

describe('plugin customRequest', function () {
  it('customRequest success', function (done) {

    let context = nattyFetch.context({
      urlPrefix: host,
      mock: false,
    })


    const fakeRequestWithSuccess = function () {

      this.config.fit = function (response) {
        const ret = {
          success: response.success,
        }
        if (response.success) {
          ret.content = response.data
        } else {
          ret.error = {
            message: response.message,
          }
        }

        return ret
      }

      this.config.customRequest = function (vars, config, process) {
        console.log('vars', vars)
        console.log('config', config)

        process(true, {
          success: true,
          data: {
            id: '1',
          },
        })
      }
    }

    context.create({
      getSuccess: {
        url: 'get-success',
        method: 'POST',
        data: {gg:'a'},
        plugins: [
          fakeRequestWithSuccess,
        ],
      },
    })

    context.api.getSuccess({hh:'a'}).then(function (content) {
      try {
        expect(content.id).to.be('1')
        done()
      } catch(e) {
        done(e)
      }
    })

  })

  it('customRequest failed', function (done) {



    let context = nattyFetch.context({
      urlPrefix: host,
      mock: false,
    })

    context.on('reject', function (error) {
      expect(error.message).to.be('fake message')
    })


    const fakeRequestWithFailed = function () {

      this.config.fit = function (response) {
        const ret = {
          success: response.success,
        }
        if (response.success) {
          ret.content = response.data
        } else {
          ret.error = {
            message: response.message,
          }
        }

        return ret
      }

      this.config.customRequest = function (vars, config, process) {
        console.log('vars', vars)
        console.log('config', config)

        process(false, {
          message: 'fake message',
        })
      }
    }



    context.create({
      getFailed: {
        url: 'get-failed',
        plugins: [
          fakeRequestWithFailed,
        ],
      },
    })

    context.api.getFailed({hh:'a'}).then(function (content) {
      //  can not go here
    }, function (error) {
      try{
        expect(error.message).to.be('fake message')
        done()
      } catch(e) {
        done(e)
      }
    })

  })
})
