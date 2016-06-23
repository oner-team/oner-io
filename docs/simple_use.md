## nattyFetch([options](https://github.com/Jias/natty-fetch/docs/options.md))

从`v2.0.0`开始，全局名称空间`nattyFetch`本身就是一个静态函数，可以直接调用。

```js
nattyFetch({
    url: 'http://example.com/api/foo',
    data: {
        foo: 1
    },
    fit: function(response) {
        // 数据结构适配
    },
    process: function(content) {
        // 成功时的数据预处理
    }
}).then(function(content) {
    // 预处理后的数据
}).catch(function(error) {
    // 错误处理
})
```

简单方式发起的请求不支持以下功能：

* ignoreSelfConcurrent
* overrideSelfConcurrent
* storage
* plugins

为什么不支持？  

因为`nattyFetch`方法没有可用于识别`api`唯一性的标记，无法准确的识别两次`nattyFetch`调用是否是同一个请求。

比如下面的两个请求，虽然`url`完全相同，但请求一没有`process`处理，请求二有，所以不能当做同样的请求。

```js
// 请求一
nattyFetch({
    url: 'http://example.com/order/create'
}).then(function(content) {
    // ...
}).catch(function(error) {
    // ...
});

// 请求二
nattyFetch({
    url: 'http://example.com/order/create',
    process: function(content) {
        return {
            id: content.orderId
        }
    }
}).then(function(content) {
    // ...
}).catch(function(error) {
    // ...
})
```

简单方式调用只适用于比较简单的场景，如组件内部或迷你项目。不建议大型项目使用，大型项目应该从一开始就做好可扩展的准备，请务必启动`nattyFetch.context`划分项目接口的上下文。