import {host} from '../config/host'


describe('plugin', function () {

  it('options.plugins should been merged, NOT overrided.', function () {

    let context = onerIO.context({
      urlPrefix: host,
      plugins: [
        onerIO.plugin.soon,
      ],
    })

    context.create({
      foo: {
        url: host + 'api/return-success',
        plugins: [
          onerIO.plugin.loop,
        ],
      },
    })

    expect(context.api.foo.soon).to.be.a('function')
    expect(context.api.foo.loop).to.be.a('function')
  })
})