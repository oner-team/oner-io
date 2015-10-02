"use strict";

// https://github.com/Automattic/expect.js
var expect = require('expect.js');
var NattyDB = require('../src/natty-db');

describe('global',function() {

    it('version',function() {
        expect(NattyDB.version).to.equal('1.0.0');
    });
});

describe('api', function () {

    beforeEach('reset NattyDB context', function () {
        NattyDB.context = {};
    });

    it('both object and function can be used as api\'s config', function () {
        let Order = NattyDB.create('Order', {
            // api 对应 配置
            pay: {},
            // api 对应 返回配置的函数
            create: function () {
                return {}
            }
        });

        expect(Order).to.be.a('object');
        expect(Order.pay).to.be.a('function');
        expect(Order.create).to.be.a('function');
    });

    it('`mock` option', function () {
        let Order = NattyDB.create('Order', {
            pay: {
                mock: true
            },
            create: {
                mock: false
            },
            close: {
                // 此处mock使用全局配置
            }
        });

        expect(Order.pay.config.mock).to.be(true);
        expect(Order.create.config.mock).to.be(false);
        expect(Order.close.config.mock).to.be(!!location.search.match(/\bm=1\b/));
    });

    it('`jsonp` option', function () {
        let Order = NattyDB.create('Order', {
            pay: {
                url: 'path'
            },
            create: {
                url: 'path.jsonp'
            },
            close: {
                url: 'path.jsonp?foo'
            }
        });

        expect(Order.pay.config.jsonp).to.be(false);
        expect(Order.create.config.jsonp).to.be(true);
        expect(Order.close.config.jsonp).to.be(true);
    });

});

require('./util.spec');
require('./ajax.spec');