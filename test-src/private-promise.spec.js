"use strict";

const {host} = require('./config');

// https://github.com/Automattic/expect.js
const expect = require('expect.js');

// require('natty-fetch')已被`webpack`映射到全局`NattyDB`对象
const nattyFetch = require('natty-fetch');

let xit = function(ignore, fn) {
    fn();
}
xit.xonly = xit;

describe('use private `Promise` object', function () {

    this.timeout(1000*30);

    it('RSVP.Promise instance should have `finally` method', function () {
        let fooFetch = nattyFetch.create({
            urlPrefix: host,
            url: 'api/order-create',
            method: 'POST',
            Promise: RSVP.Promise
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
            Promise: RSVP.Promise
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