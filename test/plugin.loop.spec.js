import {host} from '../config/host'

describe('plugin loop', function () {
  // it('loop 2x', function (done) {
  //   this.timeout(1000*600);
  //   let context = nattyFetch.context({
  //     urlPrefix: host,
  //     mock: false
  //   });
  //
  //   context.create('taxi', {
  //     getDriverNum: {
  //       url: host + 'api/return-success',
  //       plugins: [
  //         nattyFetch.plugin.loop
  //       ]
  //     }
  //   });
  //
  //   let time = 0;
  //
  //   // 开始轮询
  //   let stop1 = context.api.taxi.getDriverNum.loop({
  //     data: {
  //       loop: '__1__'
  //     },
  //     duration: 1000
  //   }, function (data) {
  //     // 成功回掉
  //     time++;
  //   }, function (error) {
  //     // 失败回调
  //   });
  //
  //   // 开始轮询
  //   let stop2 = context.api.taxi.getDriverNum.loop({
  //     data: {
  //       loop: '__2__'
  //     },
  //     duration: 1000
  //   }, function (data) {
  //     // 成功回掉
  //     time++;
  //   }, function (error) {
  //     // 失败回调
  //   });
  //
  //   setTimeout(function () {
  //     // expect(time).to.be.above(1);
  //     // 验证状态
  //     // expect(context.api.taxi.getDriverNum.looping).to.be(true);
  //     // 停止轮询
  //     stop1();
  //     // 验证状态
  //     // expect(context.api.taxi.getDriverNum.looping).to.be(false);
  //     // done();
  //   }, 5000);
  //
  //   setTimeout(function () {
  //     // expect(time).to.be.above(1);
  //     // 验证状态
  //     // expect(context.api.taxi.getDriverNum.looping).to.be(true);
  //     // 停止轮询
  //     stop2();
  //     // 验证状态
  //     // expect(context.api.taxi.getDriverNum.looping).to.be(false);
  //     // done();
  //   }, 8000);
  //
  //
  //   setInterval(function () {
  //     console.log('1:', stop1.looping);
  //     console.log('2:', stop2.looping);
  //   }, 1000)
  // });



  it('loop', function (done) {

    let context = nattyFetch.context({
      urlPrefix: host,
      mock: false,
    })

    context.create('taxi', {
      getDriverNum: {
        url: host + 'api/return-success',
        plugins: [
          nattyFetch.plugin.loop,
        ],
      },
    })

    let time = 0

    // 开始轮询
    let stop = context.api.taxi.getDriverNum.loop({
      data: {},
      duration: 200,
    }, function (data) {
      // 成功回掉
      time++
    }, function (error) {
      // 失败回调
    })

    setTimeout(function () {
      expect(time).to.be.above(1)
      // 验证状态
      expect(stop.looping).to.be(true)
      // 停止轮询
      stop()
      // 验证状态
      expect(stop.looping).to.be(false)
      done()
    }, 1000)
  })
})