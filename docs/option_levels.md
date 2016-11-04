## 配置层级

`natty-fetch`中一共有三个层级的配置，由上至下分别是全局配置(`Global`)，上下文配置(`Context`)和接口配置(`API`)，上游配置作为下游配置的默认值，同时又被下游配置所覆盖。

> 🍻 无论是用于哪个层级的配置，所有配置的可选项都是一样的，可参考[`配置选项(options)`](options.md)

TODO: 配图

#### 全局配置

设置全局配置，使用`nattyFetch.setGlobal(options)`方法。

```js
nattyFetch.setGlobal({/*全局配置*/});
```

获取全局配置，使用`nattyFetch.getGlobal()`方法。

```js
// 获取所有全局配置
nattyFetch.getGlobal();
// 获取一项全局配置
nattyFetch.getGlobal('urlPrefix');
```

#### 上下文配置

通过`nattyFetch.context(options)`方法，可以创建一个上下文对象，创建这个对象的参数就是上下文配置。

```js
let context = nattyFetch.context({/*上下文配置*/});
```

#### 接口配置

一个上下文对象可以包含若干个接口，每个接口都是由接口配置来定义的。

```js
context.create({
    'getSomething': {/*接口配置*/}
});
```
