"use strict";

// https://github.com/Automattic/expect.js
var expect = require('expect.js');

var DB = NattyDB;

//var ajax = DB._ajax;

describe('version',function() {

    it('yes',function() {
        expect(DB.version).to.equal('1.0.0');
    });

    //it('xhr has onloadend method',function() {
    //    var xhr = new XMLHttpRequest();
    //    expect({'onloadend': null}).to.have.include.keys('onloadend');
    //});

});