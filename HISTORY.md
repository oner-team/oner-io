## Next TODO

#### 增加缓存机制

以相同的参数调用相同的`API`时，在配置指定的时间内，不发出网络请求。

示例说明(仅为草稿)：

```js
DBContext.create('Address', {
  search: {
    cacheLevel: 'session', // 缓存级别可选：session/localstorage
    cacheExpired: null, // 缓存时间可选：null/1000*60*60*24
    url: 'api/for/searchAddress'
  }
});
```

## History

#### v0.3.9 / 2016-02-21 [diff](https://github.com/Jias/natty-db/commit/691ad0bcf5ca7451fe765ab4b079ca85629ee877)

* API的`process`和`fix`方法中，现在可以获取到当前请求的参数了。这个参数是固定参数与动态参数的合集。存储在`this.vars`中。


```js
let Order = DBContext.create('Order', {
  create: {
    url: 'api/for/searchAddress',
    data: {
      fixData: '固参'
    },
    process: function() {
      // `this.vars.data`的值是: {fixData: '固参', liveData: '动参'}
      console.log(this.vars.data);
    }
  }
});

Order.create({
  liveData: '动参'
}).then(function(){
  ...
});
```

* 单元测试`case`数量加到92个。

#### v0.3.8 / 2016-02-17

* PC版：优化`IE8~11`下的`isCrossDomain`函数，修复`url`为相对路径且没有设置`urlPrefix`时的判断错误。
* 单元测试`case`数量加到91个。

#### v0.3.7 / 2016-02-14

* 发版出错。

#### v0.3.6 / 2016-01-27

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

#### v0.3.4, v0.3.5 / 2016-01-20

* 添加`traditional`参数，功能和`jQuery`的`ajax`方法的`traditional`参数一致。

#### v0.3.3 / 2016-01-05

* 修复: `POST`格式错误

#### v0.3.2 / 2016-01-05

* 修復: `POST`请求时`url`参数追加了多余`data`数据被修复。
* 能够和已有的异步功能进行对接

#### v0.3.0 / 2015-12-11

* 修复：接口(API)的`jsonp`配置的值没有正确继承上下文(Context)的配置。
* 增强：轮询设计得更加友好。
* 当`ajax`跨域时，允许自定义`withCredentials`的值。(之前只要跨域，就强制`withCredentials`为true)

#### v0.2.2 / 2015-12-06

* 增加对PC浏览器(IE8+)的支持。

#### v0.1.0 / 2015-11-11

* 首个版本(H5)，仅支持移动端浏览器。