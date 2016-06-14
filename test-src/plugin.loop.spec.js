"use strict";
const {host} = require('./config');
const NattyFetch = require('natty-fetch');

// https://github.com/Automattic/expect.js
var expect = require('expect.js');


describe('plugin loop', function () {
    it('loop', function (done) {

        let DBC = new NattyFetch.Context({
            urlPrefix: host,
            mock: false
        });

        let Taxi = DBC.create('Taxi', {
            getDriverNum: {
                url: host + 'api/return-success',
                plugins: [
                    NattyFetch.plugin.loop
                ]
            }
        });

        let time = 0;

        // 开始轮询
        Taxi.getDriverNum.startLoop({
            data: {},
            duration: 200
        }, function (data) {
            // 成功回掉
            time++;
        }, function (error) {
            // 失败回调
        });

        setTimeout(function () {
            expect(time).to.be.above(1);
            // 验证状态
            expect(Taxi.getDriverNum.looping).to.be(true);
            // 停止轮询
            Taxi.getDriverNum.stopLoop();
            // 验证状态
            expect(Taxi.getDriverNum.looping).to.be(false);
            done();
        }, 1000);
    });
});