## Next TODO

#### 增加缓存机制

以相同的参数调用相同的`API`时，在配置指定的时间内，不发出网络请求。

```js
DBContext.create('Address', {
  search: {
    cacheLevel: 'session', // session/localstorage
    url: 'api/for/searchAddress'
  }
});
```

#### 和已有的异步功能对接

和已有的异步功能可以对接，如对接`Native`的地理位置接口。

```js
// 已有的异步功能：获取地理位置
JSAPI.get('GPS'，function (data) {
  // 成功
}, function (error) {
  // 失败
});

// 使用NattyDB对接
let User = DBContext.create('User', {
  getGPS: {
    promise: function (RSVP) {
      let defer = RSVP.defer();
      JSAPI.get('GPS'，function (data) {
        defer.resolev(data);
      }, function (error) {
        defer.reject(error);
      });
      return defer.promise;
    }
  }
});

// 使用场景
User.getGPS().then(function (content) {
  // 成功
}, function (error) {
  // 失败
});
```

## History

#### v0.3.6 / 2016-01-27

* 修复`IE8/9`下`ajax`请求丢`cookie`的情况。
* 添加试用版全局事件和上下文事件。支持的事件包括：`resolve`，`reject`，`error`。

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

* 添加`traditional`参数

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