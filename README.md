# NattyDB.js

A natty semantic data-fetching tool for project that no longer needs to use jQuery/Zepto's Ajax.

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

## 使用流程总览

这一节先总览一下使用NattyDB的完整流程，代码中和代码后的注释说明是重点。

第一步，创建DB模块(如：`DB.js`)，内容大致如下，其中`...`的部分表示详细配置，这里先不用关注，下文会展开讲。

```js
// 引入`NattyDB`
const NattyDB = request('natty-db');

// 创建一个`DB上下文`，用于多个`DB`共享配置。
let DBContext = new NattyDB.Context({...});

// 使用`DB上下文`创建一个`DB`，同时指定该`DB`所具有的`API`。
DBContext.create('User', {
    getPhone: {...},
    getNickName: {...}
});

// 创建更多`DB`
DBContext.create('Order', {
    create: {...},
    close: {...}
});

// 创建更多`DB上下文`
let DBContext2 = new NattyDB.Context({...});

// 省略的代码

// 输出`DB上下文`
module.exports = {DBContext, DBContext2};
```

特别注意，一个DB模块的输出值，永远是一个或多个DB上下文对象，这是NattyDB的一个使用约定。

第二步，在业务场景中使用DB模块

```js
// 引入上面创建的`DB`模块
const {DB, DB2} = require('path/to/DB');

// 调用一个DB的具体的API
DB.User.getPhone({
    // 动态参数
}).then(function (data) {
    // 成功回调
}, function (error) {
    // 失败回调
});

// 调用一个DB的具体的API
DB.Order.create({
    // 动态参数
}).then(function (data) {
    // 成功回调
}, function (error) {
    // 失败回调
});

// 省略的DB2的代码
```

特别注意，在上面的代码中，接收DB模块的输出值时，用的变量是`DB`和`DB2`，而不是`DBContext`和`DBContext2`，因为对于业务模块来说，根本不需要关注DB模块的内部实现层级，DB上下文的概念只存在于DB模块内部，一旦输出到业务模块中，都是等待调用的数据集合的含义。

## 配置

#### 配置层级

NattyDB中一共有三个层级的配置，由上至下分别是全局配置(Global Setting)，上下文配置(Context Setting)和接口配置(API Setting)，上游配置作为下游配置的默认值，同时又被下游配置所覆盖。

##### 全局配置

操作NattyDB最顶配置有两个方法：`setGlobal` 和 `getGlobal`

```js
// 设置
NattyDB.setGlobal({/*全局配置*/});
// 获取所有全局配置
NattyDB.getGlobal();
// 获取一项全局配置
NattyDB.getGlobal('jsonp');
```

##### 上下文配置

上下文配置就是一个DB上下文实例在初始化时的配置，即传入到NattyDB.Context类的参数。

```js
let DBContext = new NattyDB.Context({/*上下文配置*/});
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

#### 配置参数

上面提到全局配置，上下文配置和接口配置，都可以传入以下参数。

##### cache

* 类型：Boolean
* 默认：true

是否允许(浏览器默认的)缓存，值为`true`时，会在请求的`url`中加入`noCache`参数，屏蔽浏览器的缓存机制。

##### data

* 类型：Object / Function
* 默认：{}

请求的默认参数。在全局配置或上下文配置中通常会设置和后端约定的参数，比如`token`。在接口配置中，data参数用于定义该接口的固定参数。

##### fit

* 类型：Function
* 默认：function (response) {return response}

数据结构预处理函数

##### header

* 类型：Object
* 默认：{}

自定义ajax请求的header，所以只对ajax请求生效，当ajax请求跨域时，该配置将被忽略。

##### ignoreSelfConcurrent

* 类型：Boolean
* 默认：false

是否忽律接口自身的并发请求，即请求锁。

##### jsonp

* 类型：Boolean / Array
* 默认：false
* 示例：[true, 'cb', 'j{id}']

请求方式是否使用jsonp，当值为true时，默认的url参数形如`?callback=jsonp3879494623`，如果需要自定义jsonp的url参数，可以通过数组参数配置。

##### method

* 类型：String
* 默认：'GET'
* 可选：'GET、POST'

配置ajax的请求方式。

##### mock

* 类型：Boolean
* 默认：false

是否开启mock模式

##### mockUrl

* 类型：String
* 默认：''(空字符串)

mock模式开启时的请求地址

##### mockUrlPrefix

* 类型：String
* 默认：''(空字符串)

mock模式开启时的请求地址前缀，如果mockUrl的值是"绝对路径"或"相对路径"，则不会自动添加该前缀。

##### once

* 类型：Boolean
* 默认：false

是否对请求的数据进行缓存，开启之后，第二次(及以后)请求该接口时，会直接使用缓存的数据触发回调。

##### process

* 类型：Function
* 默认：function (data) {return data}

请求成功时的数据处理函数，该函数接收到的参数是下文的"数据结构约定"中`content`的值。

##### retry

* 类型：Number
* 默认：0

在请求失败(网络错误，超时，success为false等)时是否进行请求重试。

##### timeout

* 类型：Number
* 默认：0

超时时间，0表示不启动超时处理。

##### url

* 类型：String
* 默认：''(空字符串)

请求地址

##### urlPrefix

* 类型：String
* 默认：''(空字符串)

请求地址前缀，如果url的值是"绝对路径"或"相对路径"，则不会自动添加该前缀。

## 编码约定

#### 数据结构约定

NattyDB内部接受的数据结构约定如下：

```js
{
    "success": true,
    "content": {},
    "error": {}
}
```

说明：

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

#### DB模块设计约定

其实在上文的"使用流程总览"一节中已经有过说明

## 开发(Develop)

启动数据端服务器，用于测试返回的数据。

```bash
$ npm run server
```

启动实时编译的开发环境

```bash
$ npm start
```

## 常见问答

#### Q：我的项目需要对接两个不同的后端系统，但两个系统返回的数据结构完全不同，该如何使用NattyDB？

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

#### Q：当前项目是大型项目，一个DB上下文中包含的DB数量有很多，可以拆分成多个模块吗，拆分后又如何共享全局配置的？

在设计NattyDB的时候就已经考虑了大型项目，一个数据模块的粒度，即可以是单个DB上下文，也可以是多个DB上下文，甚至可以是单个DB(如果这个DB太多接口)。至于拆分成多个模块以后如何共享全局配置，这个就是模块化编程的常(经)见(典)问题了。下面的代码仅供参考，不属于NattyDB本身的文档。

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

`FooDBContext.js`中的代码

```js
module.exports = function init(NattyDB) {
    let FooDBContext = new NattyDB.Context({...});
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

## Important References

* [Using CORS](http://www.html5rocks.com/en/tutorials/cors/) on html5rocks, very good!
* [Browser support for CORS](http://enable-cors.org/client.html)
* [XDomainRequest on MSDN](https://msdn.microsoft.com/en-us/library/cc288060(VS.85).aspx)

## Issues

[https://github.com/Jias/natty-db/issues](https://github.com/Jias/natty-db/issues)

## Credits

(The MIT License)

Copyright (c) 2015 jias <gnosaij@yeah.net>

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the 'Software'), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED 'AS IS', WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

### 3rd-party

NattyDB heavily depends on [RSVP](https://github.com/tildeio/rsvp.js) from [tilde.io](http://www.tilde.io/) - [LICENSE](https://github.com/tildeio/rsvp.js/blob/master/LICENSE).
