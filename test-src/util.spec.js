"use strict";
const {host} = require('./config');
const NattyFetch = require('natty-fetch');

// https://github.com/Automattic/expect.js
var expect = require('expect.js');

var {
    appendQueryString, isAbsoluteUrl, isNumber,
    loadScript, param, decodeParam, isIE, isCrossDomain,
    sortPlainObjectKey
} = NattyFetch._util;

describe('./util', function () {
    describe('param', function () {
        it("{a:'b c', d:['e+f',{g:'h', i:['j','k']}]}", function () {
            expect(decodeParam(param({a:'b c', d:['e+f',{g:'h', i:['j','k']}], l:true, m:0})))
                .to.be("a=b c&d[]=e+f&d[1][g]=h&d[1][i][]=j&d[1][i][]=k&l=true&m=0");
        });
        it("{ id: function(){ return 1 + 2 } }", function () {
            expect(param({ id: function(){ return 1 + 2 } })).to.be('id=3');
        });
        it("param({ foo: 'bar', nested: { will: 'be ignored' }}, true)", function () {
            expect(decodeParam(param({ foo: 'bar', nested: { will: 'be ignored' }}, true)))
                .to.be("foo=bar&nested=[object Object]");
        });
        it("param({ foo: [1, 2]}, true)", function () {
            expect(decodeParam(param({ foo: [1, 2]}, true))).to.be("foo=1&foo=2");
        });
        it("param({ foo: [1, 2]})", function () {
            expect(decodeParam(param({ foo: [1, 2]}))).to.be("foo[]=1&foo[]=2");
        });
    });
    describe('appendQueryString', function () {
        it.skip("appendQueryString('./p', {}, fales)", function () {
            expect(appendQueryString('./p', {}, false).indexOf('./p?__noCache=')).to.be(0);
        });
        it("appendQueryString('./p', {}, true)", function () {
            expect(appendQueryString('./p', {}, true)).to.be('./p');
        });
        it("appendQueryString('./p', {foo:'foo'}, true)", function () {
            expect(appendQueryString('./p', {foo:'foo'}, true)).to.be('./p?foo=foo');
        });
        it("appendQueryString('./p?bar=bar', {foo:'foo'}, true)", function () {
            expect(appendQueryString('./p?bar=bar', {foo:'foo'}, true)).to.be('./p?bar=bar&foo=foo');
         });
    });
    describe('isAbsoluteUrl', function () {
        it('`https://path` should be a absolute url', function () {
            expect(isAbsoluteUrl('https://path')).to.be(true);
        });
        it('`http://path` should be a absolute url', function () {
            expect(isAbsoluteUrl('http://path')).to.be(true);
        });
        it('`//path` should be a absolute url', function () {
            expect(isAbsoluteUrl('//path')).to.be(true);
        });
        it('`path//path` should not be a absolute url', function () {
            expect(isAbsoluteUrl('foo//path')).to.be(false);
        });
    });
    describe('isNumber', function () {
        it('NaN', function () {
            expect(isNumber(NaN)).to.be(false);
        });
        it('1', function () {
            expect(isNumber(1)).to.be(true);
        })
    });

    describe('protocol', function(){

        it('location protocol', function () {
            let link = document.createElement('a');
            link.href = location.href;
            expect(link.protocol).to.be('http:');
        });

        it('foo.json protocol (IE diff)', function () {
            let link = document.createElement('a');
            link.href = 'foo.json';
            expect(link.protocol).to.be(isIE ? ':' : 'http:');
        });

        it('//www.foo.com/json protocol (IE diff)', function () {
            let link = document.createElement('a');
            link.href = '//www.foo.com/json';
            expect(link.protocol).to.be(isIE ? ':' : 'http:');
        });

        it('https://www.foo.com/json protocol', function () {
            let link = document.createElement('a');
            link.href = 'https://www.foo.com/json';
            expect(link.protocol).to.be('https:');
        });
    });

    describe('hostname', function(){

        let originA = document.createElement('a');
        originA.href = location.href;

        it('location hostname', function () {
            let link = document.createElement('a');
            link.href = location.href;
            expect(link.hostname).to.be(originA.hostname);
        });

        it('foo.json hostname (IE diff)', function () {
            let link = document.createElement('a');
            link.href = 'foo.json';
            expect(link.hostname).to.be(isIE ? '' : originA.hostname);
        });

        it('//www.foo.com/json hostname', function () {
            let link = document.createElement('a');
            link.href = '//www.foo.com/json';
            expect(link.hostname).to.be('www.foo.com');
        });

        it('https://www.foo.com/json hostname', function () {
            let link = document.createElement('a');
            link.href = 'https://www.foo.com/json';
            expect(link.hostname).to.be('www.foo.com');
        });
    });

    describe('isCrossDomain', function(){
        let originA = document.createElement('a');
        originA.href = location.href;

        it('foo.json', function () {
            expect(isCrossDomain('foo.json')).to.be(false);
        });

        it('../foo.json', function () {
            expect(isCrossDomain('../foo.json')).to.be(false);
        });

        it('www.foo.com/json', function () {
            expect(isCrossDomain('www.foo.com/json')).to.be(false);
        });

        it('//www.foo.com/json', function () {
            expect(isCrossDomain('//www.foo.com/json')).to.be(true);
        });

        it('absolute path', function () {
            expect(isCrossDomain(originA.protocol + '//' + originA.hostname + ':' + originA.port)).to.be(false);
        });

        it('different protocal', function () {
            expect(isCrossDomain('https://' + originA.hostname)).to.be(true);
        });

        it('different port', function () {
            expect(isCrossDomain(originA.protocol + '//' + originA.hostname + ':9876')).to.be(true);
        });

        it('https://www.foo.com/json', function () {
            expect(isCrossDomain('https://www.foo.com/json')).to.be(true);
        });
    });

    describe('isSameQueryStringFromObject', function () {

        let isSameQueryStringFromObject = (obj1, obj2) => {
            return JSON.stringify(sortPlainObjectKey(obj1)) === JSON.stringify(sortPlainObjectKey(obj2));
        };

        it('turn to the same query string', function () {
            // 两个对象, 只有键的顺序不一样, 应该转出一样的`query string`
            expect(isSameQueryStringFromObject({
                c: 'c',
                b: 'b',
                a: {
                    c:'c',
                    a:'a'
                },
                d: ['b', 'a']
            }, {
                b: 'b',
                c: 'c',
                d: ['b', 'a'],
                a: {
                    a:'a',
                    c:'c'
                }
            })).to.be(true);
        });
    })
});
