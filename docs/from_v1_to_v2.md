## 从`v1.x`升级到`v2.x`

#### 1. 添加`natty-storage`依赖

```shell
npm install natty-storage --save
```

> 团队内部项目升级请见内部群公告

#### 2. 切换名称空间

所有的`NattyDB`切换成`nattyFetch`

#### 3. 升级创建上下文对象的方法

`v1.x`中通过创建类实例实现

```js
let context = new NattyDB.Context(options);
```

`v2.x`中通过调用静态方法实现

```js
let context = nattyFetch.context(options);
```

#### 4. 升级接口模块的输出值

`v1.x`中，将`上下文对象`直接作为接口模块的输出值

```js
let context = new NattyDB.Context(options);

// 省略的代码

module.exports = context;
```

`v2.x`，将`上下文对象`的`api`属性作为接口模块的输出值

```js
let context = nattyFetch.context(options);

// 省略的代码

module.exports = context.api; // 变化在这里，加上`.api`
```

#### 5. 升级两个Hook的名称

* `willRequest`改为`willFetch`
* `didRequest`改为`didFetch`

#### 6. (按需)升级接口名称的定义方式

> 这一点，`v2.x`是完全兼容`v1.x`的。

`v1.x`中的`context.create()`方法强制所有接口都要提取一层名称空间，出现了以下情况：

1. 导致没必要使用名称空间的情况写出牵强的代码。比如，唯一的独立意义的接口。
1. 令一些不习惯使用名称空间的开发者不舒服。
1. 令一些具有代码洁癖的开发者感觉仅有的一层名称空间不够用，太死板，不足以好好地维护接口的层级，好吧。

😌 如果项目中没有上面的三种情况，可以略过这部分的升级。[`context.create()`](clear_api.md)方法的灵活性完全兼容`v1.x`的接口定义方式。

##### 对于前2点，从`v2.x`开始，不强制提取接口的名称空间

比如整个项目只有唯一一个与报销相关的接口，在`1.x`版本中，接口的定义和使用的代码可能是这样：

定义: `db.js`

```js
context.create('reimbursement', {
    getHistoryList: {}
});
module.exports = context;
```

使用: 

```js
const = require('path/to/db');
db.reimbursement.getHistoryList().then().catch();
```

从`v2.x`开始，不再强制提取名称空间，对于独立的接口特别合适：

定义: `db.js`

```js
context.create({
    getReimbursementHistoryList: {}
});
module.exports = context.api;
```

使用: 

```js
const = require('path/to/db');
db.getReimbursementHistoryList().then().catch();
```

##### 对于第3点，从`v2.x`开始，可以为接口声明多层级的名称空间：

定义: `db.js`

```js
context.create({
    'systemA.moduleB.getList': {}
});
module.exports = context.api;
```

使用: 

```js
const = require('path/to/db');
db.systemA.moduleB.getList().then().catch();
```
##### 总结，接口的方法名如何声明，决定了接口在业务场景下如何使用，按需索取吧。

#### 7. (按需)升级轮询接口

`v1.x`中，所有接口都默认开启轮询功能，浪费资源。

```js
context.create('driver', {
    getDistance: {
        url: '//example.com/getDriverDistance.do'
    }
});

// .startLoop() + .stopLoop() + .looping
context.driver.getDistance.startLoop({}, fn, fn)
context.driver.getDistance.stopLoop()
context.driver.getDistance.looping
```

`v2.x`，需要使用插件来开启轮询功能。

```js
context.create('driver', {
    getDistance: {
        url: '//example.com/getDriverDistance.do',
        plugins: [
            nattyFetch.plugin.loop
        ]
    }
});

// .startLoop() + .stopLoop() + .looping
context.api.driver.getDistance.startLoop({}, fn, fn)
context.api.driver.getDistance.stopLoop()
context.api.driver.getDistance.looping
```
