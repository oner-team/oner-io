## 配置层级

NattyFetch中一共有三个层级的配置，由上至下分别是全局配置(Global Setting)，上下文配置(Context Setting)和接口配置(API Setting)，上游配置作为下游配置的默认值，同时又被下游配置所覆盖。

TODO: 配图

##### 全局配置

操作NattyFetch最顶配置有两个方法：`setGlobal` 和 `getGlobal`

```js
// 设置
NattyFetch.setGlobal({/*全局配置*/});
// 获取所有全局配置
NattyFetch.getGlobal();
// 获取一项全局配置
NattyFetch.getGlobal('jsonp');
```

##### 上下文配置

上下文配置就是一个DB上下文实例在初始化时的配置，即传入到NattyFetch.Context构造函数的参数。

```js
let DBContext = new NattyFetch.Context({/*上下文配置*/});
```

##### 接口配置

一个DB上下文实例可以创建多个DB对象，一个DB对象是由多个接口构成的。接口配置就是用于描述单个DB接口的。

```js
DBContext.create('Order', {
    create: {/*接口配置*/},
    close: function () {
        return {/*接口配置*/};
    }
});
```
