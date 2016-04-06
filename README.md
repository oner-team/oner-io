# NattyDB

A natty semantic data-fetching tool for project that no longer needs to use jQuery/Zepto's Ajax.

## 特点

* 接口风格和`Fetch`保持一致，但在语义上更加优雅。
* 以超简洁的配置，赋予接口最常见的，但`Fetch`中不支持的强大功能。
* 承载一套编码约定，大大提高团队的沟通效率。
* 同时兼容移动端，PC端和Node环境，PC端最低支持到IE8。
* 有专门针对移动端的优化版本，而且使用方式完全一致。

## 安装

安装`natty-db`

```
npm install natty-db --save
```

[可选] 安装`ES2015 Promise`的`polyfill`实现库。

NattyDB是基于`ES2015`中全局`Promise`对象实现的，所以，如果需要在非原生支持`Promise`对象的浏览器中使用NattyDB，需要引入`Promise polyfill`实现库。

推荐使用[`lie`](https://github.com/calvinmetcalf/lie)，小而精美，而且对`js`异常的捕获很友好，遵循[Promises/A+ spec](https://promisesaplus.com/)。

```
npm install lie --save
```

如果不方便引入`Promise polyfill`实现库，比如项目中已经引入了其他的Promise库，可以直接将现有库的`Promise`构造函数直接赋给`window`对象即可，建议采用`polyfill`模式。

```js
window.Promise = window.Promise || RSVP.Promise;
```

> 注意：RSVP对`js`异常的捕获不够友好。

### 版本说明

`NattyDB`包含三个`build`版本，请根据项目具体需求来选用。

|| 文件名 |兼容性|
|-----------|-------------|---------------|
|Mobile| natty-db.js (`package.json`中`main`的默认值) |Modern Browser|
|PC| natty-db.pc.js |Modern Browser，IE8~IE11|
|Node|natty-db.node.js|Modern Browser，IE8~IE11, Node|

### 以标签方式引入

#### 移动版：

```html
<script src="path/to/lie.polyfill.min.js"></script><!--if needed-->
<script src="path/to/natty-db.min.js"></script>
```

#### PC版：

```html
<script src="path/to/lie.polyfill.min.js"></script><!--if needed-->
<script src="path/to/natty-db.pc.min.js"></script>
```

#### 对IE8/9的兼容，需要注意！

如果项目需要兼容`IE8/9`浏览器，需要在NattyDB之前引入`es5-shim`和`es5-sham`扩展。

```html
<!--[if lt IE 10]>
<script type="text/javascript" src="path/to/es5-shim.min.js"></script>
<script type="text/javascript" src="path/to/es5-sham.min.js"></script>
<![endif]-->
```

> `NattyDB`最初是为了一个基于`React`的项目而开发的，所以使用了和项目一样的开发环境，即`ES6 + Webpack + Babel`组合，而经过`Babel`编译后的代码，如果想运行在`IE8/9`浏览上，就需要引入`es5-shim`和`es5-sham`扩展。

### 以模块方式引入

无论是移动版，PC版还是Node版本的NattyDB，都可以使用模块化的方式引入。NattyDB模块默认指向的build版本是node版本。

```js
var NattyDB = require('natty-db');
```

如果想使用其他`build`版本，可以通过`Webpack`的`alias`配置，指向到需要的版本。

## 使用总览

这一节先总览一下使用`NattyDB`的完整流程，这一部分的注释和说明是重点，其中`...`的部分表示详细配置，这里先不用关注，下文会展开讲。

下面的示例假设当前业务的需求是，创建和使用一个名为`Order`(订单)的数据模块。

#### 第一步，创建名为`Order`的数据模块，如`db.order.js`

```js
// 创建一个`DB上下文`，用于多个`DB`共享配置。
const DBContext = new NattyDB.Context({...});

// 使用`DB上下文`创建一个名为`Order`的`DB`，同时配置该`DB`所具有的`API`。
DBContext.create('Order', {
    create: {...}, // 创建订单
    close: {...}   // 结束订单
});

// 输出`DB上下文`
module.exports = DBContext;
```

特别注意，一个数据模块的输出值，永远是一个或多个`DB`上下文对象，这是NattyDB的使用约定。

#### 第二步，在业务场景中使用

```js
// 引入上面创建的订单数据模块
const DB = require('path/to/db.order');

// 创建一个订单
DB.Order.create({
    // 动态参数
}).then((content) => {
    // 成功
}).catch((error) => {
    // 失败 or 有异常被捕获
});
```

简单吗？如此简单！但不仅如此！NattyDB不是`Fetch`接口的简单封装，而是承载了更多的强大配置和使用约定，从以下几个方面提高个人和团队的开发效率，详见下文。


## 配置层级

NattyDB中一共有三个层级的配置，由上至下分别是全局配置(Global Setting)，上下文配置(Context Setting)和接口配置(API Setting)，上游配置作为下游配置的默认值，同时又被下游配置所覆盖。

TODO: 配图

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

上下文配置就是一个DB上下文实例在初始化时的配置，即传入到NattyDB.Context构造函数的参数。

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

## 配置参数

上面提到全局配置，上下文配置和接口配置，都可以传入以下参数。

##### cache

* 类型：Boolean
* 默认：false

是否允许浏览器默认的缓存，值为`false`时，会在请求的`url`中加入`noCache`参数，屏蔽浏览器的缓存机制。

##### data

* 类型：Object / Function
* 默认：{}

请求的默认参数。在全局配置或上下文配置中通常会设置和后端约定的参数，比如`token`。在接口配置中，`data`参数用于定义该接口的固定参数。

##### didRequest

* 类型：Function
* 默认：`function(){}`

钩子函数，会在请求执行完成后调用。

##### fit

* 类型：Function
* 默认：function (response) { return response }

数据结构预处理函数，接收完整的后端数据作为参数，只应该用于解决后端数据结构不一致的问题。

NattyDB接受的标准数据结构是

```js
// 正确
{
    success: true,
    content: {}
}
// 错误
{
    success: false,
    error: {}
}
```

实际项目中的返回数据结构是

```js
{
    hasError: false, // or true
    content: {},
    error: 'some message'
}
```

这时候需要用`fit`来适配，转换成NattyDB约定的数据结构返回。

```js
fit: function (response) {
    let ret = {
        success: !response.hasError
    };
    
    if (ret.success) {
        ret.content = response.content;
    } else {
        ret.error = {
            message: response.error;
        }
    }
    return ret;
}
```

##### header

* 类型：Object
* 默认：{}
* 注意：只针对非跨域的`ajax`请求有效

自定义`ajax`请求的头部信息。当`ajax`请求跨域时，该配置将被忽略。

##### ignoreSelfConcurrent

* 类型：Boolean
* 默认：false

是否忽略接口自身的并发请求，即是否开启请求锁。

示例：假设有一个创建订单的按钮，点击即发起请求，最理想的情况，这个"创建订单"的请求必定要做客户端的请求锁，来避免相同的信息被意外地创建了多份订单。在NattyDB中，只需要一个参数即可开启请求锁。

```js
DBContext.create('Order', {
    create: {
        url: 'api/createOrder',
        // 开启请求锁
        // 该接口在服务端返回响应之前，如果再次被调用，将被忽略。
        ignoreSelfConcurrent: true
    }
});
```

##### jsonp

* 类型：Boolean / Array
* 默认：false
* 示例：[true, 'cb', 'j{id}']

请求方式是否使用jsonp，当值为true时，默认的url参数形如`?callback=jsonp3879494623`，如果需要自定义jsonp的url参数，可以通过数组参数配置。

##### method

* 类型：String
* 默认：'GET'
* 可选：'GET'、'POST'

配置ajax的请求方式。

> 如果浏览器是IE8/9，则NattyDB内部使用的是`XDomainRequest`对象，以便支持跨域功能，但`XDomainRequest`对象仅支持`GET`和`POST`两个方法。

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


##### overrideSelfConcurrent

* 类型：Boolean
* 默认：false

是否取消上一次没有完成的请求。即：在当上一次请求结束之前，如果又发起了下一次请求，则只执行后一次请求的响应。更多次数以此类推。

示例：假设有一个自动补全输入框，当每次有新的字符输入时，都会向服务端发起新请求，取得匹配的备选列表，当输入速度很快时，期望的是只执行最后一次请求的响应，因为最后一次的字符最全，匹配的列表更精准。这种业务场景下，可以通过配置`overrideSelfConcurrent`为`true`，一是可以节省响应次数。二次能避免先发出的请求却最后响应(并发异步请求的响应顺序不一定和请求顺序一致)，导致推荐的数据列表不准确。

```js
DBContext.create('City', {
    getSuggestion: {
        url: 'api/getCitySuggestion',
        // 开启覆盖响应
        overrideSelfConcurrent: true
    }
});

// 并发
DB.City.getSuggestion({key:'a'}).then(...); // 不响应
DB.City.getSuggestion({key:'ab'}).then(...); // 响应
```

##### process

* 类型：Function
* 默认：function (content) {return content}

请求成功时的数据处理函数，该函数接收到的参数是下文的"数据结构约定"中`content`的值。

##### retry

* 类型：Number
* 默认：0

在请求失败(网络错误，超时，success为false等)时是否进行请求重试。

##### timeout

* 类型：Number
* 默认：0

超时时间，0表示不启动超时处理。

##### traditional

* 类型：Boolean
* 默认：false

和`jQuery/Zepto`的`param`方法的第二个参数一样的效果。

##### url

* 类型：String
* 默认：''(空字符串)

请求地址

##### urlPrefix

* 类型：String
* 默认：''(空字符串)

请求地址前缀，如果url的值是"绝对路径"或"相对路径"，则不会自动添加该前缀。

##### willRequest

* 类型：Function
* 默认：`function(){}`

钩子函数，会在请求执行前调用。

## 编码约定

#### 数据结构约定

请记住NattyDB在数据结构上的约定，当一个项目的服务端数据结构不一致的时候，比如需要对接多个系统，这里的约定就是将各种数据结构统一后的焦点。

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

在NattyDB内部，严格按照上面约定的结构接收和处理数据。项目中可以通过适配函数`fit`将数据结构方便地转换成约定的格式。`fit`函数的使用详见下文。


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
DB.User.getPhone({...}).then(function (content) {
  // 成功
}, function (error) {
  // 失败
});

// 请求用户花名
DB.User.getNickName({...}).then(function (content) {
  // 成功
}, function (error) {
  // 失败
});
```

从上面的代码可以看出，如果严格根据语义化的约定来命名DB和API，那么一次数据请求的代码中是不会出现`ajax`，`jsonp`，`fetch`等具体的底层技术关键字的，在业务场景中，尽可能少的关注数据接口的底层技术实现。这样，假设底层技术升级了，对应地修改定义部分的代码即可，使用场景的语义并没有被破坏。

#### DB模块设计约定

其实在上文的"使用流程总览"一节中已经有过说明

## 轮询请求

创建轮询请求从来就没有这么简单过！

```js
// 开始轮询
DB.Driver.getDistance.startLoop({
  // 轮询使用的参数
  data: {...},
  // 间隔时间
  duration: 5000
}, function (content) {
  // 成功回调
}, function (error) {
  // 失败回调
});

// 结束轮询
DB.Driver.getDistance.stopLoop();

// 轮询状态
DB.Driver.getDistance.looping; // true or false
```

## 开发(Develop)

启动数据端服务器，用于开发环境下测试返回数据。

```bash
$ npm run server
```

启动实时编译的开发环境，并生成非压缩版的`natty-db.js`文件

```bash
$ npm run dev
```

## 构建

生成用于发布压缩版的`natty-db.js`文件。

```bash
$ npm run build
```

## 兼容性

* H5版本：iPhone4+、Android？(还没找到底线)
* PC版本：IE8+、Edge、Chrome、Safari、Firefox

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
