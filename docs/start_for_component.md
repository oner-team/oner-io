## 使用概览-组件级

组件级接口的配置需要完全独立，不受项目环境全局配置的影响。

```js
// 创建接口实例
const fetchFoo = nattyFetch.create({
    url: 'xxx',
    data: {
        foo: 1
    },
    fit: function(response) {
        // 数据结构适配
    },
    process: function(content) {
        // 成功时的数据预处理
    }
});

// 调用接口实例
fetchFoo().then(function(content){
    // 预处理后的数据
}).catch(function(error){
    // 错误处理
});
```

这种使用方式只适用于比较简单的场景，如组件内部或迷你项目。不建议大型项目使用，大型项目应该从一开始就做好可扩展的准备，请务必启动`nattyFetch.context`划分项目接口的上下文。
