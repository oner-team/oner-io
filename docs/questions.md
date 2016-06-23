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
let NattyFetch = require('natty-fetch');

// 把A系统的配置作为全局配置
NattyFetch.setGlobal({
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
let systemAContext = new NattyFetch.Context();
systemAContext.create('Foo', {...});

// 创建适用于B系统的DB上下文
let systemBContext = new NattyFetch.Context({
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

二：如果`A`和`B`两个系统分不出主次，那建议直接为两个系统分别创建各自的DB上下文，代码如下：

```js
let NattyFetch = require('natty-fetch');

// 适用于A系统的DB上下文
let systemAContext = new NattyFetch.Context({
    fit: function () {
        return {
            success: response.success,
            content: response.data, // 适配点
            ...
        };
    }
});

// 适用于B系统的DB上下文
let systemBContext = new NattyFetch.Context({
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

#### Q：当前项目是大型项目，一个DB上下文中包含的DB数量有很多，可以拆分成多个模块吗，拆分后又如何共享全局配置的？

在设计NattyFetch的时候就已经考虑了大型项目，一个数据模块的粒度，即可以是单个DB上下文，也可以是多个DB上下文，甚至可以是单个DB(如果这个DB太多接口)。至于拆分成多个模块以后如何共享全局配置，这个就是模块化编程的常(经)见(典)问题了。下面的代码仅供参考，不属于NattyFetch本身的文档。

方式一：将NattyFetch模块设置为全局变(对)量(象)共享。(如果不想引入全局变量，请直接看方式二)

```js
// 将NattyFetch挂载到全局
let NattyFetch = window.NattyFetch = require('natty-fetch');

// 设置全局配置
NattyFetch.setGlobal({...});
```

其他的数据模块都直接使用全局NattyFetch变(对)量(象)

```js
let FooContext = new NattyFetch.Context();
FooContext.create('Foo', {...});
module.exports = {FooContext};
```

方式二：为项目添加一个DB模块总入口，然后将NattyFetch模块传入各个子级的DB模块。

DB模块总入口代码：`DB.js`

```js
let NattyFetch = require('natty-fetch');
// 将NattyFetch共享到子级模块中
let FooDBContext = require('./FooDBContext').init(NattyFetch);
// DB上下文也可以共享到子级模块中
let HooDB = require('./HooDB').init(FooDBContext);
module.exports = {FooDBContext}
```

`FooDBContext.js`中的代码

```js
module.exports = function init(NattyFetch) {
    let FooDBContext = new NattyFetch.Context({...});
    FooDBContext.create('Foo', {...});
    return FooDBContext;
};
```

`HooDB.js`中的代码

```js
module.exports = function init(DBContext) {
    DBContext.create('Foo', {...});
    return DBContext;
};
```
