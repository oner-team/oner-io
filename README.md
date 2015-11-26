# NattyDB.js
A natty little data fetching tool for react project that no longer needs to use jQuery/Zepto's Ajax. 

## 安装

先将NattyDB和[RSVP](https://github.com/tildeio/rsvp.js)安装到项目本地

> RSVP小而美地实现了`Promise`的概念。

```bash
$ npm install natty-db rsvp --save
```

### 版本说明

NattyDB同时包含H5和PC两个版本，请根据项目具体需求来选用。两个版本分别对应的文件路径为：

* H5版本：node_modules/dist/natty-db.min.js
* PC版本：node_modules/dist/natty-db.pc.min.js (文件名中加上了`.pc`)

### 使用`script`标签引入

RSVP + H5版NattyDB

```html
<script src="./node_modules/rsvp/dist/rsvp.min.js"></script>
<script src="./node_modules/natty-db/dist/natty-db.min.js"></script>
```

RSVP + PC版NattyDB

```html
<script type="text/javascript" src="./node_modules/rsvp/dist/rsvp.min.js"></script>
<script type="text/javascript" src="./node_modules/natty-db/dist/natty-db.pc.min.js"></script>
```

### 以模块化的方式引入

> 此处的文档，是假设了项目中使用Webpack作为模块管理工具。

#### 配置`RSVP`依赖

如果以模块方式(非`script`标签方式)加载RSVP依赖，需要在Webpack配置中使用[ProvidePlugin](http://webpack.github.io/docs/list-of-plugins.html#provideplugin)插件将全局RSVP变量引用转换为`require('rsvp')`模块引用。

```js
plugins: [
    new webpack.ProvidePlugin({
       RSVP: 'rsvp'
    })
]
```

#### 引入H5版NattyDB

在NattyDB模块的`package.json`中配置的默认版本就是H5版本，文件路径为：`dist/natty-db.min.js`。

```js
$ let NattyDB = require('natty-db');
```

#### 引入PC版NattyDB

如果项目需要同时兼容移动端和PC端(目前NattyDB支持到`IE8+`)，需要在Webpack中配置[resolve.alias](http://webpack.github.io/docs/configuration.html#resolve-alias)，将NattyDB指向PC版，引用方式保持和H5版本一样。

Webpack中的配置：

```js
resolve: {
    alias: {
        'natty-db': 'natty-db/dist/natty-db.pc.min.js'
    }
}
```

## 约定

#### 数据结构约定

NattyDB内部接受的数据结构约定如下：

```js
{
    "success": true,
    "content": {},
    "error": {}
}
```

说明：下面所有的约定都是强制的。

* 以`success`键值表示返回的数据是否有错误，以布尔值表示。
  - 当值为`true`时，返回的数据中必须包含`content`对象。
  - 当值为`false`时，返回的数据中必须包含`error`对象。
* 以`content`键值表示数据正确时的数据内容。格式**必须**是一个对象。
* 以`error`键值表示数据有错误时的错误信息，格式**必须**是一个对象。

> 在NattyDB内部，严格按照上面约定的结构处理数据。项目中可以通过适配函数`fit`将数据结构方便地转换成约定的格式。`fit`函数的使用详见下文。


#### 语义化约定

NattyDB中约定的语义化，是指一个数据接口在业务场景下被调用时，应该更贴近自然语言，让人一眼即懂。语义化的具体约定表现针对DB和API的命名约定。

假设有一组数据接口，它们有共同的宿主或行为目标，那这里的宿主或目标就可以被设计成一个DB，而这些接口就是这个DB下的一套API。

> DB和API的关系，可以用一句话概括："一个DB是由若干个API所构成的对象"。

命名约定

* DB的命名必须使用名词词性。
* API的命名必须使用动词词性或动宾短语。

命名目标，即调用场景是怎样用的。

```js
// 指定的DB.主语.谓语({参数})
DB.Order.create({...}).then(...);
// 指定的DB.主语.谓语宾语({参数})
DB.User.getPhone({...}).then(...);
```

简单举例

假设项目需要新增两个接口，"获取用户手机号" 和 "获取用户花名"。很明显，这两个接口所请求的内容有共同的宿主—"用户"，即DB的命名已有选择。而"获取手机号" 和 "获取花名"就是这个DB的两个具体的接口，即API。

定义场景：假设文件名是`db.js`

```js
let NattyDB = require('natty-db');
// 上下文的概念下文会详细讲，这里只知道所有DB都有上下文即可。
let DBContext = new NattyDB.Context({...});
// 定义DB
DBContext.create('User', {
  getPhone: {...},
  getNickName: {...}
});
module.exports = DBContext;
```

使用场景：通常位于业务逻辑的代码中

```js
// 引用上面定义的模块
let DB = require('path/to/db');

// 请求用户手机号
DB.User.getPhone({...}).then(function (data) {
  // 成功
}, function (error) {
  // 失败
});

// 请求用户花名
DB.User.getNickName({...}).then(function (data) {
  // 成功
}, function (error) {
  // 失败
});
```

从上面的代码可以看出，如果严格根据语义化的约定来命名DB和API，那么一次数据请求的代码中是不会出现`ajax`，`jsonp`，`fetch`等具体的底层技术关键字的，在业务场景中，尽可能少的关注数据接口的底层技术实现。这样，假设底层技术升级了，对应地修改定义部分的代码即可，使用场景的语义并没有被破坏。



## 配置层级

NattyDB中一共有三个层级的配置，由上至下分别是全局配置(Global Setting)，上下文配置(Context Setting)和接口配置(API Setting)，上游配置作为下游配置的默认值，同时又被下游配置所覆盖。

#### 全局配置



#### 上下文配置

#### 接口配置

## 使用

#### 第一步：定义数据接口

创建项目或模块的`db`文件。如`db.js`

```js
// 引入`natty-db`模块
const NattyDB = request('natty-db');

// 创建一个`DB上下文(DB-Context)`，用于多个`DB`共享默认配置。
let DBC = new NattyDB.Context({
     urlPrefix: 'your-url-prefix',
     mock: false,
     data: {
         token: 'your-token'
     },
     timeout: 5000,
     // 数据格式预处理
     fix: function(resp) {
         return {
             success: !resp.hasError,
             content: resp.content,
             error: resp.error
         }
     } 
});

// 在一个DB上下文中创建一个`DB`，同时指定该`DB`所具有的方法。
DBC.create('User', {
    getPhone: {
        url: 'xxx',
        method: 'GET', // GET|POST
        data: {}, // 静态参数
        header: {}, // 非jsonp时才生效
        timeout: 5000, // 如果超时了，会触发error
        jsonp: false, // true
        jsonp: [true, 'cb', 'j{id}'], // 自定义的jsonp        fit: fn,
        process: fn, 
        once: false,
        retry: 0,
        ignoreSelfConcurrent: true
    },
    ...
});

// 创建更多`DB`
DBC.create('Order', {...});

// 返回DB上下文，供业务逻辑调用
module.exports = DBC;
```

#### 第二步：使用数据接口

```js
// 引入`db`文件
const DB = require('path/to/db');

DB.User.getPhone({
    // 动态参数
}).then(function (data) {
    // 成功回调，`data`是`process`处理后的数据
}, function (error) {
    // 失败回调
    if (error.status == 404) {} // ajax方法才有error.status
    if (error.status == 500) {} // ajax方法才有error.status
    if (error.status == 0)      // ajax方法才有error.status 0表示不确定的错误 可能是跨域时使用了非法Header
    if (error.timeout) {
        console.log(error.message)
    }

    // 服务器端返回的约定错误，以具体项目而定
    if (error.code == 10001) {}
});

```

## 开发(Develop)

启动数据端服务器，用于测试返回的数据。

```bash
$ npm run server
```

启动实时编译的开发环境

```bash
$ npm start
```

## 参考文档(Important References)

* [Using CORS](http://www.html5rocks.com/en/tutorials/cors/) on html5rocks, very good!
* [Browser support for CORS](http://enable-cors.org/client.html)
* [XDomainRequest on MSDN](https://msdn.microsoft.com/en-us/library/cc288060(VS.85).aspx)

## 常见问答

##### 问：我的项目需要对接两个不同的后端系统，但两个系统返回的数据结构完全不同，该如何使用NattyDB？

答：假设两个系统分别用`A`和`B`表示，返回是数据格式分别如下(仅使用数据正确的情况举例，数据有错的情况同理)：

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

针对上面的两种数据结构，在NattyDB中可以有两种方案可以选择：

一：如果项目中对`A`和`B`两个系统的依赖有主次之分，比如以`A`系统为主，则可以把针对`A`系统的数据结构适配作为全局配置。然后用一个新的数据上下文(Context)配置`B`系统的数据结构。如：

```js
let NattyDB = require('natty-db');

// 把A系统的配置作为全局配置
NattyDB.setGlobal({
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
let systemAContext = new NattyDB.Context();
systemAContext.create('Foo', {...});

// 创建适用于B系统的DB上下文
let systemBContext = new NattyDB.Context({
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
let NattyDB = require('natty-db');

// 适用于A系统的DB上下文
let systemAContext = new NattyDB.Context({
    fit: function () {
        return {
            success: response.success, 
            content: response.data, // 适配点
            ...
        };
    }
});

// 适用于B系统的DB上下文
let systemBContext = new NattyDB.Context({
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

##### 问：当前项目是大型项目，一个DB上下文中包含的DB数量有很多，可以拆分成多个模块吗，拆分后又如何共享全局配置的？

答：在设计NattyDB的时候就已经考虑了大型项目，一个数据模块的粒度，即可以是单个DB上下文，也可以是多个DB上下文，甚至可以是单个DB(如果这个DB太多接口)。至于拆分成多个模块以后如何共享全局配置，这个就是模块化编程的常(经)见(典)问题了。下面的代码仅供参考，不属于NattyDB本身的文档。

方式一：将NattyDB模块设置为全局变(对)量(象)共享。(如果不想引入全局变量，请直接看方式二)

```js
// 将NattyDB挂载到全局
let NattyDB = window.NattyDB = require('natty-db');

// 设置全局配置
NattyDB.setGlobal({...});
```



其他的数据模块都直接使用全局NattyDB变(对)量(象)

```js
let FooContext = new NattyDB.Context();
FooContext.create('Foo', {...});
module.exports = {FooContext};
```

方式二：为项目添加一个DB模块总入口，然后将NattyDB模块传入各个子级的DB模块。

DB模块总入口代码：`DB.js`

```js
let NattyDB = require('natty-db');
// 将NattyDB共享到子级模块中
let FooDBContext = require('./FooDBContext').init(NattyDB);
// DB上下文也可以共享到子级模块中
let HooDB = require('./HooDB').init(FooDBContext);
module.exports = {FooDBContext}
```

`FooDBContext.js`中的代码，返回一个DB上下文

```js
module.exports = function init(NattyDB) {
    let FooDBContext = new NattyDB.Context({...});
    FooDBContext.create('Foo', {...});
    return FooDBContext;
};
```

`HooDB.js`中的代码，返回一个DB

```js
module.exports = function init(DBContext) {
    DBContext.create('Foo', {...});
    return DBContext;
};
```



## Credits

(The MIT License)

Copyright (c) 2015 jias <gnosaij@yeah.net>

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the 'Software'), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED 'AS IS', WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

### 3rd-party

NattyDB heavily depends on [RSVP](https://github.com/tildeio/rsvp.js) from [tilde.io](http://www.tilde.io/) - [LICENSE](https://github.com/tildeio/rsvp.js/blob/master/LICENSE).
