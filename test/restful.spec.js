import {host} from '../config/host'

const noop = function () {

}
const _it = function(s, f) {
    f(noop)
}

describe('restful', function () {

    it('GET', function (done) {
        let context = nattyFetch.context({
            urlPrefix: host + 'rest/:version/',
            data: {
                ':version': 'v1'
            }
        });

        context.create('foo', {
            get: {
                url: 'posts/:id',
                rest: true,
                method: 'GET'
                // header: {
                //     'Content-Type': 'application/json;charset=utf-8'
                // }
            }
        });

        context.api.foo.get({
            // rest参数
            ':id': 2,
            // 多余的rest参数应该被删掉
            ':name': 'foo',
            //
            foo: 'foo',
            boo: 'boo'
        }).then(() => {
            done()
        }, error => {
        })
    })

    it('POST', function (done) {
        let context = nattyFetch.context({
            urlPrefix: host + 'rest/:version/',
            data: {
                ':version': 'v1'
            },
        });

        context.create('foo', {
            get: {
                url: 'posts',
                rest: true,
                method: 'POST',
                header: {
                    'Content-Type': 'application/json;charset=utf-8'
                }
            }
        });

        context.api.foo.get({
            // 多余的rest参数应该被删掉
            ':name': 'foo',
            foo: 'foo',
            boo: 'boo'
        }).then(() => {
            done()
        }, error => {
        })
    })

    it('PUT', function (done) {
        let context = nattyFetch.context({
            urlPrefix: host + 'rest/:version/',
            data: {
                ':version': 'v1'
            }
        });

        context.create('foo', {
            get: {
                url: 'posts/:id',
                rest: true,
                method: 'PUT',
                header: {
                    'Content-Type': 'application/json;charset=utf-8'
                }
            }
        });

        context.api.foo.get({
            ':id': 2,
            // 多余的rest参数应该被删掉
            ':name': 'foo',
            foo: 'foo',
            boo: 'boo'
        }).then(() => {
            done()
        }, error => {
        })
    })

    it('PATCH', function (done) {
        let context = nattyFetch.context({
            urlPrefix: host + 'rest/:version/',
            data: {
                ':version': 'v1'
            }
        });

        context.create('foo', {
            get: {
                url: 'posts/:id',
                rest: true,
                method: 'PATCH',
                header: {
                    'Content-Type': 'application/json;charset=utf-8'
                }
            }
        });

        context.api.foo.get({
            ':id': 2,
            // 多余的rest参数应该被删掉
            ':name': 'foo',
            foo: 'foo',
            boo: 'boo'
        }).then(() => {
            done()
        }, error => {
        })
    })

    it('DELETE', function (done) {
        let context = nattyFetch.context({
            urlPrefix: host + 'rest/:version/',
            data: {
                ':version': 'v1'
            },
            rest: true
        });

        context.create('foo', {
            get: {
                url: 'posts/:id',
                method: 'DELETE'
            }
        });

        context.api.foo.get({
            ':id': 2,
            // 多余的rest参数应该被删掉
            ':name': 'foo',
            foo: 'foo',
            boo: 'boo'
        }).then(() => {
            done()
        }, error => {
        })
    })

})