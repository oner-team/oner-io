# NattyDB.js
A natty little data fetching tool for react project that no longer needs to use jQuery/Zepto. 

## 安装(请详细阅读)

先将`NattyDB`安装到项目本地

```bash
$ npm install natty-db --save
```

### 选择版本

`NattyDB`发布时包含`H5`和`PC`两个版本，请根据项目情况来选用。

#### H5版：natty-db.js

在`package.json`中配置的默认版本就是移动端版本，文件路径为：`dist/natty-db.min.js`，所以，移动端项目中，直接`require`即可。

```js
$ let NattyDB = require('natty-db');
```

#### PC版：natty-db.pc.js

如过项目需要同时兼容移动端和PC端，请使用PC版。推荐下面的使用方式。

`require`方式不变：

```js
$ let NattyDB = require('natty-db');
```

但同时在`Webpack`中配置`alias`的路径到`PC`版`NattyDB`。





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

## dev

```bash
$ npm start
```

and

```bash
$ node server/server.js
```

## Important Refs

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
