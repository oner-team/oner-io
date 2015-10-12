"use strict";
const {host} = require('./config');

// https://github.com/Automattic/expect.js
var expect = require('expect.js');

var {appendQueryString, isAbsoluteUrl, isNumber, loadScript} = require('../src/util');

describe('./util', function () {
    describe('appendQueryString', function () {
        it("appendQueryString('./p', {}, fales)", function () {
            expect(appendQueryString('./p', {}, false).indexOf('./p?noCache=')).to.be(0);
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