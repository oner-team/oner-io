"use strict";
const {host} = require('./config');
const nattyFetch = require('natty-fetch');

// https://github.com/Automattic/expect.js
var expect = require('expect.js');


describe('plugin loop', function () {
    it('loop', function (done) {

        let context = nattyFetch.context({
            urlPrefix: host,
            mock: false
        });

        context.create('taxi', {
            getDriverNum: {
                url: host + 'api/return-success',
                plugins: [
                    nattyFetch.plugin.loop
                ]
            }
        });

        let time = 0;

        // 开始轮询
        context.api.taxi.getDriverNum.startLoop({
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
            expect(context.api.taxi.getDriverNum.looping).to.be(true);
            // 停止轮询
            context.api.taxi.getDriverNum.stopLoop();
            // 验证状态
            expect(context.api.taxi.getDriverNum.looping).to.be(false);
            done();
        }, 1000);
    });
});