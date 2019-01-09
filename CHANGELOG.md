

## Change Log

### 3.x / 没时间

* 从`v3.x`开始，`POST`请求的默认编码方式改为`application/json;utf-8`，如果需要使用`application/x-www-form-urlencoded;chartset=utf-8`编码，可以配置`header`的`Content-Type`值进行覆盖。
* todo 生命周期中所有回调函数中的`this`添加了`abort()`方法。([@pfdgithub](https://github.com/pfdgithub) in [#30](https://github.com/jias/natty-fetch/issues/26))
* todo `fit`的使用进一步简化，之前版本是在`fit`中返回约定结构的对象，现在升级为`api`调用，代码本身就很达意，减少额外思考。下面用一个具体的项目代码，对比一下`3.x`版本`fit`的变化：

`1.x` 和`2.x`版本的`fit`，对后端数据进行适配。

```
fit: function (response) {
    const fitted = {} // 3.x 开始，这行可以删掉了
    if (response.status !== 0) {
        fitted.success = true // 3.x 开始，这行可以删掉了
        fitted.content = response.data || {} // 3.x 开始，不需要记住`content`约定  
    } else {
        fitted.success = false // 3.x 开始，这行可以删掉了
        fitted.error = { // 3.x 开始，不需要记住`error`约定
            code: response.errorCode,
            message: response.errorDetail // 3.x 开始，`message`是唯一的约定
        }
    }
    return fitted // 从 3.x 开始，这行可以删掉了
}
```

用`3.x`版本的`fit`，实现同样的适配逻辑，简化了很多。

```
fit: function(response) {
    if (response.status !== 0) {
        this.toResolve(response.data || {})
    } else {
        this.toReject({
            code: response.errorCode, 
            message: response.errorDetail // `message`是`reject`数据必有的
        })
    }
}
```

> 经过复盘很多项目的实际使用情况，`1.x`和`2.x`版本的`fit`配置，虽然不是必选项，但使用率却是`100%`的，所以，从`3.x`开始，`fit`配置被设计成必选项，如果不配置，响应是无法完结(`resolve/reject`)的。

### v2.6.0 / 2019-01-09

* 接口添加第二个参数，允许动态设置`header`。

```js
io.getXxx({
  // 动态数据
}, {
  // 动态header配置
}).then(fn)
```

* 修复：如果在`willFetch`中修改了`config`，修改只对本次请求生效。([@alex-mm](https://github.com/alex-mm) in [#69](https://github.com/jias/natty-fetch/issues/69))

#### v2.5.7 / 2018-10-17

* 钉钉容器中`ajax`默认不是异步，`natty-fetch`明确默认行为设置为异步，之前没有设置，使用浏览器的默认行为。

### v2.5.4 / 2018-01-19

* 修复`GET`请求参数中包含`length`字段且值为数字时的解析错误。([@Edward67](https://github.com/Edward67) in [#59](https://github.com/jias/natty-fetch/issues/59))
* 新版`Chrome`的`Promise`实例已经有`finally`方法了，这一点没必要做差异测试了，删除对应的单测`case`。


### v2.5.3 / 2017-10-26

* 统一升级一下内置的错误提示，干掉了`success is false`字样，统一成`Request Error`和`Request Timeout`等。

### v2.5.0 / 2017-07-19

* `mark`参数修改为[`urlMark`](https://github.com/jias/natty-fetch/blob/master/docs/options.md#urlmark)参数

> 曾经在`v2.2.0`时添加过`mark`参数

### v2.4.5 / 2017-06-30

* 全局和上下文`reject`事件可以获得接口调用时的参数了，方便把导致`reject`的错误参数记录到日志中。

```
// 全局
nattyFetch.on('reject', function (error, config, vars) {
  // `vars`对象是被`reject`的接口的参数数据
})

// 上下文
context.on('reject', function (error, config, vars) {
  // `vars`对象是被`reject`的接口的参数数据
})
```

### v2.4.4 / 2017-06-29

* 配置项目加入`jsonpCrossOrigin`参数。([@lorrylockie](https://github.com/lorrylockie) in [#50](https://github.com/jias/natty-fetch/issues/50))

### v2.4.3 / 2017-06-08

* 修复`IE9`的一个问题。([@McLemore](https://github.com/McLemore) in [#47](https://github.com/jias/natty-fetch/issues/47))
* 修复使用了`customRequest`的插件在发生错误时没有触发全局的`reject`的问题。([@lorrylockie](https://github.com/lorrylockie) in [#48](https://github.com/jias/natty-fetch/issues/48))

### v2.4.2

* `v2.3.0`版将`POST`的默认编码取消了，影响范围较大，这个版本再加回来。即，如果是`POST`请求且用户自己没有配置`header`的`Content-Type`，会将`Content-Type`的值默认设置为`application/x-www-form-urlencoded`。

### v2.4.0, v2.4.1 / 2017-04-11

* 支持[`RESTFul API`](https://github.com/jias/natty-fetch/blob/master/docs/options.md#rest)。
* 警告性升级：natty-fetch定义的接口，发出请求后，如果调用了abort接口，内部会有`warning`。

### v2.3.0 / 2017-04-07

* 修复设置了`timeout`的接口在并发时下被自动取消的问题。([@ peng2e](https://github.com/peng2e) in [#38](https://github.com/jias/natty-fetch/issues/38))
* 删除了单测中针对`xhr`对象`status`的值的测试。
* [`natty-storage`](https://github.com/jias/natty-storage)升级到`v2.x`
* 针对自定义`customRequest`的插件的简化。
* 破坏性升级：删除了`postDataFormat`选项。如果需要`json`编码，配置`Content-Type`为`application/json`。如果需要`urlencoded`编码，配置`Content-Type`为`application/x-www-form-urlencoded`即可。内部不在针对`POST`请求做内置默认处理，为添加`RESTFul API`支持做好准备。


### v2.2.3 / 2017-01-17

* 合并来自[LiangZugeng](https://github.com/LiangZugeng)的[PR](https://github.com/jias/natty-fetch/pull/39)。

### v2.2.2 / 2016-12-27

* 合并来自[tommytroylin](https://github.com/tommytroylin)的[PR](https://github.com/jias/natty-fetch/pull/36)。

### v2.2.1 / 2016-12-13

* 修复固参为函数时没有执行，导致丢失参数的`bug`。这个`bug`居然能隐藏这么久才被发现。

```js
context.create({
  getXxx: {
    // 当`data`值为函数时，内部的参数丢失了
    data: function() {
      return {
        fixData: 'x' // 居然丢失了
      }
    }
  }
})
```

### v2.2.0 / 2016-10-31

* 修复`IE`下，跨域时调用`abort`没有生效的问题。`v2.1.3`引入的问题。
*  `webpack+babel`组合切换到了`rollup+buble`组合。无论是开发构建还是生产构建，都更快更小。
* 跨域时不再强制屏蔽自定义的`header`。([@pfdgithub](https://github.com/pfdgithub) in [#30](https://github.com/jias/natty-fetch/issues/30))
* 添加`mark`参数，默认为`true`，会在请求的`url`中追加标记信息(接口名称，`retry`次数等)，方便识别。当设置为`false`时，`url`中没有标记信息(`_stamp`除外，另见`urlStamp`配置)。([@pfdgithub](https://github.com/pfdgithub) in [#30](https://github.com/jias/natty-fetch/issues/30))
* `urlStamp`添加字符串类型的值(上个版本只允许布尔值)，如果配置了字符串值，则默认的`_stamp`将被替换为该字符串值。
* 发布文件的变动，删除了`node`版本(即`natty-fetch.node.js`和`natty-fetch.pc.node.js`)。`natty-fetch`采用`umd`方式打包，已不再需要独立的`node`版本。
* 修复`traditional:false`不生效的问题。


##### 附录

以下数据供参考，如果`rollup+buble`组合用在其他大型`js`项目上，可以更给力地减少文件体积。两个数字分别是`Bundle Size`和`Gzipped Size`。

||bundle use|natty-fetch.min.js|natty-fetch.pc.min.js||
|---|---|---|---|---|
|v2.1.3|webpack+babel|14.8KB, 6.5KB|15.5KB, 6.8KB||
|v2.2.0|rollup+buble|13.2KB, 5.19KB|13.7KB, 5.38KB|smaller|

### v2.1.3 / 2016-09-27

*  修复`IE`下调用`abort`后读取`xhr`对象属性导致的[c00c023f](http://stackoverflow.com/questions/7287706/ie-9-javascript-error-c00c023f)异常。([@eternalsky](https://github.com/eternalsky) in [#27](https://github.com/jias/natty-fetch/issues/27))

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
