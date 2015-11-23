# NattyDB.js
A natty little data fetching tool for react project that no longer needs to use jQuery/Zepto's Ajax. 

## 加载

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

#### 数据结构

NattyDB内部接受的数据结构约定如下：

```js
{
    "success": true,
    "content": {},
    "error": {
        "code": "100",
        "message": "error string"
    }
}
```

说明：

* [强制] 以`success`键值表示返回的数据是否有错误，以布尔值表示。
  - [强制] 当值为`true`时，返回的数据中必须包含`content`内容。
  - [强制] 当值为`false`时，返回的数据中必须包含`error`内容。
* [强制] 以`content`键值表示数据正确时的数据内容。格式**必须**是一个对象。
* [强制] 以`error`键值表示数据有错误时的错误信息，格式**必须**是一个对象。
  - [建议] 错误信息中建议使用`code`，`message`等非缩写单词。


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

#### Q：我的项目需要对接两个不同的后端系统，但两个系统返回的数据结构完全不同，该如何使用NattyDB？

A：假设两个系统分别用`A`和`B`表示，返回是数据格式分别如下(仅使用数据正确的情况举例，数据有错的情况同理)：

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
    fit: function (response) {
        return {
            success: response.success,
            content: response.data, // 适配点
            ...
        };
    }
});

// 在新的DB上下文中配置适用于B系统的fit函数
let systemBContext = new NattyDB.Context({
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

// 只要其他的DB上下文没有配置fit函数，则该DB上下文的数据适配方式就会使用全局(即A系统)的
let otherContext = new NattyDB.Context();
otherContext.create('Foo', {...});

```

二：如果`A`和`B`两个系统分不出主次，那建议直接为两个系统分别创建各自的DB上下文，代码如下：

```js
// 适用于A系统的DB上下文
let systemAContext = new NattyDB.Context({
    fit: function () {
        return {
            success: response.success, // 适配点
            content: response.data,
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

```

## Credits

(The MIT License)

Copyright (c) 2015 jias <gnosaij@yeah.net>

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the 'Software'), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED 'AS IS', WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

### 3rd-party

NattyDB heavily depends on [RSVP](https://github.com/tildeio/rsvp.js) from [tilde.io](http://www.tilde.io/) - [LICENSE](https://github.com/tildeio/rsvp.js/blob/master/LICENSE).
