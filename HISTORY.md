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

和其他的异步功能可以对接，如对接`Native`的地理位置接口。

## History

#### v0.3.0 / 2015-12-11

* 修复：接口(API)的`jsonp`配置的值没有正确继承上下文(Context)的配置。
* 增强：轮询设计得更加友好。
* 当`ajax`跨域时，允许自定义`withCredentials`的值。(之前只要跨域，就强制`withCredentials`为true)

#### v0.2.2 / 2015-12-06

* 增加对PC浏览器(IE8+)的支持。

#### v0.1.0 / 2015-11-11

* 首个版本(H5)，仅支持移动端浏览器。