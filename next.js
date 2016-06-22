let Didi = new NattyFetch.Context({});

// script标签使用方式
let storage = NattyFetch.plugin.storage;
let loop    = NattyFetch.plugin.loop;


// 模块化引用方式
let storage = require('./natty-fetch/dist/natty-fetch.plugin.storage');
let loop    = require('./natty-fetch/dist/natty-fetch.plugin.loop');

/**
 * demo-1-1: 获取用户手机号, 声明了1天有效期的缓存
 */
// 配置插件
Didi.namespace('user', {
	getPhone: {
		// ...其他省略的配置
		plugins: [
			storage({
				type: 'localStorage', // sessionStorage
				expire: 1000*60*60*60*24 // 1天 单位ms
			})
		]
	}
});



let context = nattyFetch.context({
	// 财务的系统参数
	urlPrefix: 'finance/'
});

// v2.0的变化
//    1. create方法增强
//    2. 插件支持
//    3. 组件场景的简单使用方式? 还没思路

// create方法增强
// 之前只有一种语法, 强制提取`namespace`, 导致部分开发者不舒服, 众口难调啊
Didi.create('user', {
	getPhone: {},
	getPos: {}
});

let context = nattyFetch.context({
	// 滴滴的系统参数
	urlPrefix: 'didi/'
});

// 现在添加一种写法, 以`路径`方式定义接口, 有没有`namespace`自己决定, 定义多层也没关系
context.create({
	// 不定义`namespace`
	// 使用场景: Didi.getDriverNum().then().catch();
	'getDriverNum': {},

	// `namespace`为`用户`的接口
	// 使用场景的代码: Didi.user.getPhone().then().catch();
	'user.getPhone': {},
	'user.getPos': {},

	// `namespace`为`订单`的接口
	// 使用场景场景的代码: Didi.oreder.create().then().catch();
	'order.create': {},
	'order.pay': {},

    // 当然可以有任意多层的`namespace`, 不限制
	// 使用场景场景的代码: Didi.taxi.order.create().then().catch();
	'taxi.order.create': {},
	'specialCar.order.create': {}
});

module.exports = context.api;













// 使用场景
// 第一次调用会发起网络请求
Didi.user.getPhone().then(function(){});

// 第二次调用不会发起网络请求, 但语法完全一样
Didi.user.getPhone().then(function(){});


/**
 * demo-1-2: 获取国内城市列表, 通过版本号判断缓存是否失效, 如果版本号一致, 则缓存一直不失效
 */
// 配置插件
Didi.namespace('user', {
	getCityList: {
		// ...其他省略的配置
		plugins: [
			storage({
				type: 'localStorage', // sessionStorage
				version: '1.0'
			}),
			retry({
				time: 3
			})
		]
	}
});


// 使用场景
// 第一次调用
// 情况1:
//      如果插件storage的版本号和本地缓存中的版本号不一致, 会发起网络请求, 数据返回后
//      将新的数据和版本号同步到本地缓存, 执行回调
// 情况2:
//      如果插件storage的版本号和本地缓存中的版本号一致, 不会发起网络请求, 直接执行回调
Didi.user.getCityList().then(function(){});

// 第二次调用, 版本号一定一样, 不会发起网络请求
Didi.user.getCityList().then(function(){});


/**
 * demo-2-1: 获取我的历史订单列表, 先用缓存的旧数据渲染view, 再用请求回来的新数据升级view
 * 组合使用了`storage`和`soon`插件
 */
// 配置插件
Didi.namespace('order', {
	getList: {
		// ...其他省略的配置
		plugins: [
			storage({
				type: 'localStorage', // sessionStorage,

			}),
			link() // `soon`插件用于尽可能第一时间显示`view`的场景
		]
	}
});


// 使用场景
// 如果`storage`的版本号和本地缓存中的版本号不一致, 先用缓存中的列表数据渲染view, 同时发出
// 网络请求获取新数据, 然后用新数据更新view
Didi.order.getList.link({}, function (content, isFromStorage) {
	// 如果本地缓存失效了, 该回调将渲染两次, 第一次用缓存数据, 第二次用新数据
	// 如果本地缓存有效, 该回调只执行一次
}, function (error) {

});







/**
 * demo-3-1: 轮询获取司机距目的地的距离
 * 使用了loop插件, 该插件为`api`扩展了`startLoop`和`stopLoop`方法, 和`looping`属性
 */
// 配置轮询插件
Didi.namespace('driver', {
	getDistance: {
		// ...其他省略的配置
		plugins: [
			loop({
				duration: 5000
			})
		]
	}
});


// 开始轮询
let stop = Didi.driver.getDistance.startLoop({}, function (content) {
	// 这里的代码5秒执行一次!!! 原生的`promise`对象是达不到这个效果的
}, function (error) {
	// 任何错误
});

// 停止轮询
stop();
// or
Didi.driver.getDistance.stopLoop();


let api = nattyFetch({
	url: 'xxx'
});

api().then(function () {
	
});






