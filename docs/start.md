## 使用总览

这一节先总览一下使用`NattyFetch`的完整流程，这一部分的注释和说明是重点，其中`...`的部分表示详细配置，这里先不用关注，下文会展开讲。

下面的示例假设当前业务的需求是，创建和使用一个名为`Order`(订单)的数据模块。

#### 第一步，创建名为`Order`的数据模块，如`db.order.js`

```js
// 创建一个`DB上下文`，用于多个`DB`共享配置。
const DBContext = new NattyFetch.Context({
    urlPrefix: 'https://abc.com/api/',
    jsonp: true,
    // 更多配置见下面的`配置参数`一节
});

// 使用`DB上下文`创建一个名为`Order`的`DB`，同时配置该`DB`所具有的`API`。
DBContext.create('Order', {
    // 创建订单接口
    create: {
        url: 'createOrder',
        // 更多配置见下面的`配置参数`一节
    },
    // 关闭订单接口
    close: {
        url: 'closeOrder',
        // 更多配置见下面的`配置参数`一节
    }
});

// 输出`DB上下文`
module.exports = DBContext;
```

特别注意，一个数据模块的输出值，永远是一个或多个`DB`上下文对象，这是`NattyFetch`的使用约定。

#### 第二步，在业务场景中使用

```js
// 引入上面创建的订单数据模块
const DB = require('path/to/db.order');

// 创建一个订单
DB.Order.create({
    // 动态参数
}).then((content) => {
    // 成功
}).catch((error) => {
    // 失败 or 有异常被捕获
});
```

简单吗？如此简单！但不仅如此！NattyFetch不是`Fetch`接口的简单封装，而是承载了更多的强大配置和使用约定，从以下几个方面提高个人和团队的开发效率，详见下文。