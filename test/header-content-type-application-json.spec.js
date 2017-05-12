import {host} from '../config/host'


describe('header', function(){

  this.timeout(1000*6);

  it('post with application/json', function (done) {

    const context = nattyFetch.context({
      urlPrefix: host
    })

    context.create({
      create: {
        url: 'api/order-create',
        method: 'POST',
        header: {
          'Content-Type': 'application/json;charset=utf-8'
        },
        data: {
          // 静态数据
          foo: 'foo-value',
        },
      }
    })

    context.api.create({
      // 动态数据
      bar: 'bar-value',
      // 就算stringify了
      boo: JSON.stringify({boo: 'boo-value'})
    }).then((content) => {
      done()
    })

  })

})

