/**
 * express config
 *
 * @license MIT License
 * @author jias (https://github.com/jias/natty-fetch)
 */
var express = require('express')
var app = express()

var bodyParser = require('body-parser')

// parse application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({extended: false}))

// parse application/json
app.use(bodyParser.json())

var getIp = require('get-ip')

var retryTime = 1

app.all('/rest/*', function(req, res) {
  // console.log('api/*')

  res.set({
    // NOTE 真实的生产环境一定不要写*, 如果是*, 则浏览器端的withCredentials不能设置为true, 浏览器端的cookie就无法带到后端
    //"Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Origin": req.headers.origin,
    // RESTFul方案在跨域使用时，服务端配置允许自定义的`Content-Type`值（通常为`application/json`），是推荐是最佳实战。
    "Access-Control-Allow-Headers": "Content-Type,Content-Length,Authorization,Accept,X-Requested-With",
    "Access-Control-Allow-Methods": "PUT,POST,GET,DELETE,PATCH",
    "Access-Control-Allow-Credentials": true,
    "Content-Type": "text/html",
  })

  res.json({
    success: true,
    content: {
      id: 1,
    },
  })
})

app.all('/api/:test', function (req, res) {

  // console.log('api/:test')

    
  res.set({
    // NOTE 真实的生产环境一定不要写*, 如果是*, 则浏览器端的withCredentials不能设置为true, 浏览器端的cookie就无法带到后端
    //"Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Origin": req.headers.origin,
    // RESTFul方案在跨域使用时，服务端配置允许自定义的`Content-Type`值（通常为`application/json`），是推荐是最佳实战。
    "Access-Control-Allow-Headers": "Content-Type,Content-Length,Authorization,Accept,X-Requested-With",
    "Access-Control-Allow-Methods": "PUT,POST,GET,DELETE,PATCH",
    "Access-Control-Allow-Credentials": true,
    "Content-Type": "text/html",
  })

  // 跨域情况下，如果请求头的Content-Type不是下面三种值，浏览器会先发送OPTIONS请求来询问服务端是否允许，此时应该直接返回200，
  // 表示允许
  //
  // NOTE：Any Content-Type other than application/x-www-form-urlencoded, multipart/form-data, or text/plain triggers the preflight.
  // preflight请求就是请求动词为OPTIONS的请求
  if (req.method === 'OPTIONS') {
    res.status(200).end()
  } else {

    switch (req.params.test) {
      case 'once':
        res.json({
          success: true,
          content: {
            phone: 1,
          },
        })
        break
        // simple test
      case '302':
        res.redirect(302, 'http://localhost:8010/api/create')
        break
      case '500':
        res.status(500).json({error: '500'})
        break
      case '404':
        res.status(404).json({error: '404'})
        break
      case 'abort':
        setTimeout(function () {
          res.send('abort')
        }, 1000000)
        break
      case 'timeout':
        setTimeout(function () {
          res.json({
            success: true,
            content: {
              id: 1,
            },
          })
        }, 1000) // 时间不要太大 否则单测太漫长
        break
      case 'return-with-delay':
        setTimeout(function () {
          res.json({
            success: true,
            content: {
              id: 1,
            },
          })
        }, req.query.delay) // 根据指定的时间返回
        break
      case 'timeout-long':
        setTimeout(function () {
          res.json({
            success: true,
            content: {
              id: 1,
            },
          })
        }, 1000 * 60810) // 时间足够长, 用于调试
        break
      case 'return-script':
        res.send('window.__test__ = 1;')
        break
      case 'return-json':
        res.json({tool: 'natty-fetch'})
        break
      case 'return-html':
        res.send('<div>html</div>')
        break
      case 'return-text':
        res.send('text')
        break
      case 'return-xml':
        res.send('<div>xml</div>')
        break
      case 'jsonp-order-create':
        res.jsonp({
          success: true,
          content: {
            id: 1,
          },
        })
        break
      case 'jsonp-order-create-error':
        res.jsonp({
          success: false,
          error: {
            code: 1,
            message: 'Permission Denied',
          },
        })
        break
      case 'jsonp-timeout':
        setTimeout(function () {
          res.jsonp({
            success: true,
            content: {
              id: 1,
            },
          })
        }, 1000)
        break

        // return standard data structure
      case 'order-create':
        res.json({
          success: true,
          content: {
            id: 1,
          },
        })
        break

        // return standard data structure
      case 'return-cookie':
        res.json({
          success: true,
          content: {
            cookieTime: 1,
          },
        })
        break

        // return standard error structure
      case 'return-error':
        res.json({
          success: false,
          error: {
            code: 1,
            message: 'Demo Server Error',
          },
        })
        break

        // return standard error structure
      case 'jsonp-error':
        res.jsonp({
          success: false,
          error: {
            code: 1,
            message: 'Demo Server Error',
          },
        })
        break

        // return non-standard data structure
      case 'order-create-non-standard':
        res.json({
          hasError: false,
          content: {
            id: 1,
          },
        })
        break

      case 'post-retry-success':

        // console.log('post req.query._retryTime', req.query._retryTime, retryTime)

        if (req.query._retryTime == '1') {
          retryTime = 1
        } else {
          retryTime++
        }
        res.json(retryTime == 2 ? {
          success: true,
          content: {
            id: 1,
          },
        } : {
          success: false,
          error: {
            code: 1,
            message: 'Demo Server Error',
          },
        })
        break

      case 'retry-success':

        // console.log('req.query', req.query)

        if (req.query._retryTime == '1') {
          retryTime = 1
        } else {
          retryTime++
        }
        res.json(retryTime === 2 ? {
          success: true,
          content: {
            id: 1,
          },
        } : {
          success: false,
          error: {
            code: 1,
            message: 'Demo Server Error',
          },
        })
        break
      case 'jsonp-retry-success':
        if (req.query._retryTime == '1') {
          retryTime = 1
        } else {
          retryTime++
        }
        res.jsonp(retryTime === 2 ? {
          success: true,
          content: {
            id: 1,
          },
        } : {
          success: false,
          error: {
            code: 1,
            message: 'Demo Server Error',
          },
        })
        break

      case 'empty': 
        res.jsonp()
        break
      case 'return-stamp':
        res.json({
          success: true,
          content: {
            time: +new Date(),
          },
        })
        break

      case 'svg':
        res.type('text/plain')
        res.send('hhh')
        break

      default:
        res.json({
          success: true,
          content: {
            id: 1,
          },
        })
        break
    }
  }

})

var ip = getIp()[0]

var server = app.listen(8010, function () {
  var port = server.address().port
  console.log('Example app listening at http://%s:%s', ip, port)
})

// http://www.bennadel.com/blog/2327-cross-origin-resource-sharing-cors-ajax-requests-between-jquery-and-node-js.htm
// http://kodemaniak.de/2010/07/cross-domain-ajax-with-restlet-and-jquery/
// http://stackoverflow.com/questions/21783079/ajax-in-chrome-sending-options-instead-of-get-post-put-delete
// http://stackoverflow.com/questions/1256593/why-am-i-getting-an-options-request-instead-of-a-get-request
