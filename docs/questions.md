## 常见问答

#### Q：我的项目需要对接两个不同的后端系统，但两个系统返回的数据结构完全不同，该如何使用NattyFetch？

假设两个系统分别用`A`和`B`表示，返回是数据格式分别如下(仅使用数据正确的情况举例，数据有错的情况同理)：

```js
// A系统的数据结构
{
    "success": true,
    "data": {...},
    ...
}

// B系统的数据结构
{
    "hasError": false,
    "content": {...},
    ...
}
```

针对上面的两种数据结构，在NattyFetch中可以有两种方案可以选择：

一：如果项目中对`A`和`B`两个系统的依赖有主次之分，比如以`A`系统为主，则可以把针对`A`系统的数据结构适配作为全局配置。然后用一个新的数据上下文(Context)配置`B`系统的数据结构。如：

```js
const nattyFetch = require('natty-fetch');

// 把A系统的配置作为全局配置
nattyFetch.setGlobal({
    // A系统的数据结构适配函数
    fit: function (response) {
        return {
            success: response.success,
            content: response.data, // 适配点
            ...
        };
    }
});

// 如果创建新的DB上下文时没有配置fit函数，则会继承全局(即A系统)的
const systemAContext = nattyFetch.context();
systemAContext.create('Foo', {...});

// 创建适用于B系统的DB上下文
const systemBContext = nattyFetch.context({
    // B系统的数据结构适配函数
    fit: function () {
        return {
            success: !response.hasError, // 适配点
            content: response.content,
            ...
        };
    }
});
// 使用B系统的上下文创建DB
systemBContext.create('Boo', {...});

module.exports = {systemAContext, systemBContext};
```

二：如果`A`和`B`两个系统分不出主次，那建议直接为两个系统分别创建各自的上下文，代码如下：

```js
const nattyFetch = require('natty-fetch');

// 适用于A系统的DB上下文
const systemAContext = nattyFetch.context({
    fit: function () {
        return {
            success: response.success,
            content: response.data, // 适配点
            ...
        };
    }
});

// 适用于B系统的DB上下文
const systemBContext = nattyFetch.context({
    fit: function () {
        return {
            success: !response.hasError, // 适配点
            content: response.content,
            ...
        };
    }
});

module.exports = {systemAContext, systemBContext};
```


