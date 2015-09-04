"use strict";
// https://github.com/Automattic/expect.js
var expect = chai.expect;

var DB = NattyDB;

describe('version',function() {

    it('yes',function() {
        expect(DB.version).to.equal('1.0.0');
    });

});