import {host} from '../config/host'

const noop = function () {

}
const _it = function(s, f) {
    f(noop)
}

describe('timeout with self concurrent', function () {

    it('timeout with self concurrent', function (done) {
        this.timeout(1000*10)
        let context = nattyFetch.context({
            urlPrefix: host,
            mock: false
        });

        context.create('foo', {
            get: {
                url: host + 'api/return-with-delay',
                timeout: 300
            }
        });

        let timeoutCount = 0

        // 第一个请求超时时，不应该取消掉第二个请求
        context.api.foo.get({delay: 500}).then(() => {}, error => {
            timeoutCount++
        })

        // 第二个请求
        context.api.foo.get({delay: 1000}).then(() => {}, error => {
            timeoutCount++
            expect(timeoutCount).to.be(2)
            done()
        })
    })
})