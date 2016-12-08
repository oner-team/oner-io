## 使用概览-项目级

这一节先总览一下在项目中使用`natty-fetch`的关键步骤，为简单说明，示例中只使用了最基本的配置，全部配置的文档可以参考[`配置选项(options)`](docs/options.md)。

在项目环境下使用`natty-fetch`，主要分为三个步骤：

* 定义全局配置(可选)：用于声明【整个项目】的全部接口的共享配置。
* 定义接口模块，包含两个部分：
  - 创建接口的上下文：用于声明【当前模块】的全部接口的共享配置。
  - 在上下文对象下定义若干接口
* 使用接口：在业务模块中引用接口模块并调用接口。

## 示例

假设一个业务场景是，为项目添加购物车(`cart`)接口模块，包含三个接口：

* 添加商品: `//example.com/cart/addItem.do`
* 删除商品: `//example.com/cart/removeItem.do`
* 一键购买: `//example.com/cart/pay.do`，即付款

> 注意：为了让示例简单，这里不考虑购物车业务的其他细节。

#### 第一步，定义全局配置

全局配置通常只会发生在项目起步初期，当前示例要为项目添加购物车模块，一定是有商品模块已经先行开发了，所以全局配置应该早已配置完毕。

如果把全局配置的代码找出来，应该是下面的样子：

```js
nattyFetch.setGlobal({
    // 配置整个项目所有接口的参数中都包含`__token`字段
    data: {
        __token: 'project_token_string'
    }
});

```

#### 第二步，定义接口模块（io.cart.js）



```js
// 先创建一个上下文对象，这里配置了该场景下的三个接口所共享的地址前缀`urlPrefix`。
const context = nattyFetch.context({
    urlPrefix: '//example.com/cart/'
});

// 再使用上下文对象的`create()`方法，分别定义三个接口。
context.create({
    // 添加商品
    'cart.add': {
        url: 'addItem.do',
        data: {
            // 省略，如：收货地址
        }
    },
    // 删除商品
    'cart.remove': {
        url: 'removeItem.do',
        data: {
            // 省略，如：商品id
        }
    },
    // 付款
    'cart.pay': {
        url: 'pay.do'
    }
});

// 输出上下文的所有接口
export default context.api;
```

`context.create()`方法的使用方式很灵活，上面的写法，每个接口都重复声明了`cart`名称空间，但并不是强制的。接口的方法名如何声明，决定了接口在业务场景下如何使用，详见`context.create()`方法的[灵活性](https://github.com/jias/natty-fetch/blob/master/docs/clear_api.md)。

#### 第三步，在业务场景中使用

```js
// 引入购物车接口模块`io.cart.js`
import io from 'path/to/io.cart'

// 调用：添加商品
io.cart.add({
    // 动态参数，如：商品数量
    num: 1
}).then((content) => {
    // 成功
}).catch((error) => {
    // 失败 or 有异常被捕获
});

// 调用：删除商品
io.cart.remove({
    // 动态参数，如：商品id
    id: '100'
}).then((content) => {
    // 成功
}).catch((error) => {
    // 失败 or 有异常被捕获
});

// 调用：付款
io.cart.pay({
    // 动态参数，如：支付方式
    by: 'alipay'
}).then((content) => {
    // 成功
}).catch((error) => {
    // 失败 or 有异常被捕获
});
```

简单吗？如此简单！但不仅如此！

`nattyFetch`不是`fetch`接口的简单封装，而是承载了更多的[强大配置](options.md)和[使用约定](rules.md)。