"use strict";
const {host} = require('./config');

// https://github.com/Automattic/expect.js
var expect = require('expect.js');

var {appendQueryString, isAbsoluteUrl, isNumber, loadScript, param, decodeParam} = NattyDB._util;

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
        it("appendQueryString('./p', {}, fales)", function () {
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
});