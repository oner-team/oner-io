# NattyDB.js
A natty little data fetching tool for react project that no longer needs to use jQuery/Zepto's Ajax. 

## Install

先将NattyDB和[RSVP](https://github.com/tildeio/rsvp.js)安装到项目本地

> RSVP小而美地实现了`Promise`的概念。

```bash
$ npm install natty-db rsvp --save
```

#### 版本说明

NattyDB同时包含H5和PC两个版本，请根据项目具体需求来选用。两个版本分别对应的文件路径为：

* H5版本：node_modules/dist/natty-db.min.js
* PC版本：node_modules/dist/natty-db.pc.min.js (文件名中加上了`.pc`)

#### 引入方式(一)：直接使用`script`标签

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

#### 引入方式(二)：模块化的开发方式

> 此处的文档，是假设了项目中使用Webpack作为模块管理工具。

##### 配置`RSVP`依赖

如果以模块方式(非`script`标签方式)加载RSVP依赖，需要在Webpack配置中使用[ProvidePlugin](http://webpack.github.io/docs/list-of-plugins.html#provideplugin)插件将全局RSVP变量引用转换为`require('rsvp')`模块引用。

```js
plugins: [
    new webpack.ProvidePlugin({
       RSVP: 'rsvp'
    })
]
```

##### 引入H5版NattyDB

在NattyDB模块的`package.json`中配置的默认版本就是H5版本，文件路径为：`dist/natty-db.min.js`。

```js
$ let NattyDB = require('natty-db');
```

##### 引入PC版NattyDB

如果项目需要同时兼容移动端和PC端(目前NattyDB支持到`IE8+`)，需要在Webpack中配置[resolve.alias](http://webpack.github.io/docs/configuration.html#resolve-alias)，将NattyDB指向PC版，引用方式保持和H5版本一样。

Webpack中的配置：

```js
resolve: {
    alias: {
        'natty-db': 'natty-db/dist/natty-db.pc.min.js'
    }
}
```

## Setting Levels

NattyDB中一共有三个层级的配置，由上至下分别是全局配置(Global Setting)，上下文配置(Context Setting)和接口配置(API Setting)，上游配置作为下游配置的默认值，同时又被下游配置所覆盖。

##### 全局配置



##### 上下文配置

##### 接口配置

## Usage

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

## Develop

启动数据端服务器，用于测试返回的数据。

```bash
$ npm run server
```

启动实时编译的开发环境

```bash
$ npm start
```

## Important References

* [Using CORS](http://www.html5rocks.com/en/tutorials/cors/) on html5rocks, very good!
* [Browser support for CORS](http://enable-cors.org/client.html)
* [XDomainRequest on MSDN](https://msdn.microsoft.com/en-us/library/cc288060(VS.85).aspx)

## Credits

(The MIT License)

Copyright (c) 2015 jias <gnosaij@yeah.net>

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the 'Software'), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED 'AS IS', WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

### 3rd-party

NattyDB heavily depends on [RSVP](https://github.com/tildeio/rsvp.js) from [tilde.io](http://www.tilde.io/) - [LICENSE](https://github.com/tildeio/rsvp.js/blob/master/LICENSE).
