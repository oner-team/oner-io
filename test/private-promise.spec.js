import {host} from '../config/host'

const xit = function(ignore, fn) {
    fn();
}
xit.xonly = xit;

const noop = function () {

}

/**
 * 伪造的带有`finally`方法的`promise`对象
 * new MyPromise(function(resolve, reject) {})
 */
class MyPromise {
    constructor(f) {
        // 对应的`resolve`和`reject`需要是函数
        f(noop, noop)
    }
    then() {
        return this
    }
    catch() {
        return this
    }
    finally() {
        return this
    }
}

describe('use private `Promise` object', function () {

    this.timeout(1000*10);

    it('MyPromise instance should have `finally` method', function () {
        let fooFetch = nattyFetch.create({
            urlPrefix: host,
            url: 'api/order-create',
            method: 'POST',
            Promise: MyPromise
        });

        expect(fooFetch().finally).to.be.a('function');
    });


    it('origin Promise instance dose NOT have `finally` method', function () {
        let fooFetch = nattyFetch.create({
            urlPrefix: host,
            url: 'api/order-create',
            method: 'POST'
        });

        expect(fooFetch().finally).to.be(undefined);
    });


    it('set RSVP Promise on context', function () {
        let context = nattyFetch.context({
            Promise: MyPromise
        });

        context.create({
            fooFetch: {
                urlPrefix: host,
                url: 'api/order-create',
                method: 'POST'
            }
        });

        expect(context.api.fooFetch().finally).to.be.a('function');
    });
});