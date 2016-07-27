## Next TODO

* 外部插件：mtop
* 外部插件：dingtalk lwp可以自动降级
* 文档补充：
  - 关于一个接口只应该用于一个场景的文档说明
  - 服务端的共享接口，前端应该使用语义化定义成多个接口的说明

## Change Log

### v2.1.2 / 2016-07-27

*  支持传入非原生的`Promise`对象，满足特殊场景的需求。([@eternalsky](https://github.com/eternalsky) in [#21](https://github.com/jias/natty-fetch/issues/21))

Case 1：希望`Promise`实例有`finally`方法：

```js
const RSVP = require("rsvp");
let fooFetch = nattyFetch.create({
    url: 'example.com/api/foo',
    Promise: RSVP.Promise // 用`RSVP.Promise`代替原生`Promise`
});

fooFetch().then().finally(function(){
    // 这个`finally`方法是`RSVP.Promise`扩展出来的非`Promise A+`标准的方法。
})

```

Case 2：原生的`Promise`弱爆了，我要使用高配的[`bluebird`](https://github.com/petkaantonov/bluebird) (我的项目很复杂，根本没有配置`Promise A+ polyfill`，我要继续使用`bluebird`)：

```js
const Promise = require("bluebird");

// 全局启用(不影响`nattyFetch.create()`方法，因为这个方法是独立的)
nattyFetch.setGlobal({
    Promise: Promise
});

// 上下文启用
let context = nattyFetch.context({
    Promise: Promise
});
```



### v2.1.1 / 2016-07-17

* 补充内部缺失的全局`reject`回调。([@xuguogang](https://github.com/xuguogang) in [#18](https://github.com/Jias/natty-fetch/issues/18))

### v2.1.0 / 2016-07-17

* 升级[简易方式](https://github.com/Jias/natty-fetch/blob/master/docs/start_for_component.md)的调用方法。这一点是和`v2.0.2`版本的主要变化。表现为：
  - 添加`nattyFetch.create`方法。
  - `nattyFetch`名称空间不再支持直接调用，因为没有接口实例就无法开启`ignoreSelfConcurrent`、`overrideSelfConcurrent`和`storage`等高级功能。
* `didFetch`在超时时不应该被调用。([#19](https://github.com/Jias/natty-fetch/issues/19))

### v2.0.2 / 2016-07-13

* 插件接口内部升级, 无使用上的变化。

### v2.0.1 / 2016-06-30

* 升级：[`loop`](docs/options.md#loop)插件
* 增强：当`storage`的`type`设置为`localStorage`时，强制检测是否同时设置了`key`值。
* 修复：当`storage`的`type`设置为`variable`时，缓存没有启用。
* 同步：[`natty-storage`](https://github.com/Jias/natty-storage)升级到[`v1.1.1`](https://github.com/Jias/natty-storage/blob/master/CHANGELOG.md)

### v2.0.0 / 2016-06-24

该版本是非向后兼容的版本，从`v1.x.x`升级到`v2.x.x`，请参考[v1到v2升级指南](docs/from_v1_to_v2.md)

* 新的名称空间`nattyFetch`
* 支持[简易方式](https://github.com/Jias/natty-fetch/blob/master/docs/start_for_component.md)调用 ([@eternalsky](https://github.com/eternalsky) in [#15](https://github.com/Jias/natty-fetch/issues/15))
* 添加插件功能 ([@yize](https://github.com/yize) in [#12](https://github.com/Jias/natty-fetch/issues/12))
* 添加缓存功能 ([@yize](https://github.com/yize) in [#12](https://github.com/Jias/natty-fetch/issues/12), [#13](https://github.com/Jias/natty-fetch/issues/13))
* `NattyDB.Context`类变为`nattyFetch.context`静态方法
* `NattyDB.onlyForHTML5`变为`nattyFetch.onlyForModern`
* 删除了有歧义的`cache`配置，由`urlStamp`替代
* 不再强制提取接口的名称空间，也不限制接口的名称空间层级数，解决众口难调的使用习惯。

### v1.0.2 / 2016-05-27

* `willRequest`和`didRequest`在调用时传入了参数`vars`和`config`，解决以下两个需求：
  - 希望在发送请求之前有机会修改原本的配置
  - 希望在发送请求之前有机会修改发送的数据

### v1.0.1 / 2016-04-14

* 修复`IE11`的一个小版本(11.0.9600.18230)下判断是否跨域不正确的问题。

```js
let requestA = doc.createElement('a');
    requestA.href = url;
// 在IE11的不同小版本下, `requestA.protocol`的值有的是`:`, 有的是空字符串, 太奇葩啦!
```

### v1.0.0 / 2016-04-07

* 不再强依赖`RSVP`，改为使用`Promise Polyfill`库`lie`。如果项目只运行在原生支撑`Promise`对象的浏览器或`WebView`中，则`NattyDB`可以不需要任何依赖。
* `package.json`中，`main`的值改为`natty-db.node.js`。

### v0.4.0 / 2016-03-24

* 添加`willRequest`和`didRequest` hook。

### v0.3.16 / 2016-03-10

* 解决`IE8`下`ajax`模块不触发`complete`的`bug`。

### v0.3.15 / 2016-03-10

* 打包脚本添加`natty-db.pc.node.js`。

### v0.3.13 / 2016-03-02

* 优化`Ajax`请求头的`Accept`和`Content-Type`字段的默认值，解决 [issue#6](https://github.com/Jias/natty-db/issues/6) 提到的乱码问题。

### v0.3.11 / 2016-02-26

* 添加`overrideSelfConcurrent`参数，详见文档。
* API的`process`和`fix`方法中，传入了第二个参数，保存该次请求相关的数据，也为后续扩展做准备。

```js
let Order = DBContext.create('Order', {
  create: {
    url: 'api/for/searchAddress',
    data: {
      fixData: '固参'
    },
    fit: function(response, vars) {
      // `vars.data`的值是: {fixData: '固参', liveData: '动参'}
      console.log(vars.data);
    },
    process: function(content, vars) {
      // `vars.data`的值是: {fixData: '固参', liveData: '动参'}
      console.log(vars.data);
    }
  }
});
```

* 单元测试`case`数量加到94个。

### v0.3.10 / 2016-02-23

* 开始支持node环境，文件名为`natty-db.node.js`和`natty-db.node.min.js`，感谢昊帧。


### v0.3.9 / 2016-02-21

* API的`process`和`fix`方法中，现在可以获取到当前请求的参数了。

> 这个版本的方案不严谨，被v0.3.11替换了。

* 单元测试`case`数量加到92个。

### v0.3.8 / 2016-02-17

* PC版：优化`IE8~11`下的`isCrossDomain`函数，修复`url`为相对路径且没有设置`urlPrefix`时的判断错误。
* 单元测试`case`数量加到91个。

### v0.3.7 / 2016-02-14

* 发版出错。

### v0.3.6 / 2016-01-27

* PC版：修复`IE8/9`下`ajax`请求丢`cookie`的情况。
* PC+H5版：添加试用版全局事件和上下文事件。支持的事件包括：`resolve`，`reject`，`error`。

全局事件注册方法

```js
NattyDB.on('resolve', fn);
NattyDB.on('reject', fn);
NattyDB.on('error', fn);
```

DB上下文事件注册方法

```js
var DBC = new NattyDB.Context();
DBC.on('resolve', fn);
DBC.on('reject', fn);
DBC.on('error', fn);
```

### v0.3.4, v0.3.5 / 2016-01-20

* 添加`traditional`参数，功能和`jQuery`的`ajax`方法的`traditional`参数一致。

### v0.3.3 / 2016-01-05

* 修复: `POST`格式错误

### v0.3.2 / 2016-01-05

* 修復: `POST`请求时`url`参数追加了多余`data`数据被修复。
* 能够和已有的异步功能进行对接

### v0.3.0 / 2015-12-11

* 修复：接口(API)的`jsonp`配置的值没有正确继承上下文(Context)的配置。
* 增强：轮询设计得更加友好。
* 当`ajax`跨域时，允许自定义`withCredentials`的值。(之前只要跨域，就强制`withCredentials`为true)

### v0.2.2 / 2015-12-06

* 增加对PC浏览器(IE8+)的支持。

### v0.1.0 / 2015-11-11

* 首个版本(H5)，仅支持移动端浏览器。
