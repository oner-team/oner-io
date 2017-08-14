import {host} from '../config/host'


describe('plugin', function () {

  it('options.plugins should been merged, NOT overrided.', function () {

    let context = nattyFetch.context({
      urlPrefix: host,
      plugins: [
        nattyFetch.plugin.soon
      ]
    });

    context.create({
      foo: {
        url: host + 'api/return-success',
        plugins: [
          nattyFetch.plugin.loop
        ]
      }
    });

    expect(context.api.foo.soon).to.be.a('function');
    expect(context.api.foo.loop).to.be.a('function');
  });
});