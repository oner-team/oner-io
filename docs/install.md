## 安装

安装`natty-fetch`

```
npm install natty-fetch@1.1.0-rc3 --save
```

[可选] 安装`ES2015 Promise`的`polyfill`实现库。

NattyFetch是基于`ES2015`中全局`Promise`对象实现的，所以，如果需要在非原生支持`Promise`对象的浏览器中使用NattyFetch，需要引入`Promise polyfill`实现库。

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

`NattyFetch@2.0.0-rc1`目前只支持移动端使用。PC端兼容版正在开发中。

|| 文件名 |兼容性|
|-----------|-------------|---------------|
|Mobile| natty-fetch.js (`package.json`中`main`的默认值) |Modern Browser|

### 以标签方式引入

#### 移动版：

```html
<script src="path/to/lie.polyfill.min.js"></script><!--if needed-->
<script src="path/to/natty-fetch.min.js"></script>
```

#### PC版(暂不可用)：

```html
<script src="path/to/lie.polyfill.min.js"></script><!--if needed-->
<script src="path/to/natty-fetch.pc.min.js"></script>
```

#### 对IE8/9的兼容，需要注意！

如果项目需要兼容`IE8/9`浏览器，需要在NattyFetch之前引入`es5-shim`和`es5-sham`扩展。

```html
<!--[if lt IE 10]>
<script type="text/javascript" src="path/to/es5-shim.min.js"></script>
<script type="text/javascript" src="path/to/es5-sham.min.js"></script>
<![endif]-->
```

> `NattyFetch`最初是为了一个基于`React`的项目而开发的，所以使用了和项目一样的开发环境，即`ES6 + Webpack + Babel`组合，而经过`Babel`编译后的代码，如果想运行在`IE8/9`浏览上，就需要引入`es5-shim`和`es5-sham`扩展。

### 以模块方式引入

无论是移动版，PC版还是Node版本的NattyFetch，都可以使用模块化的方式引入。NattyFetch模块默认指向的build版本是node版本。

```js
var NattyFetch = require('natty-fetch');
```

如果想使用其他`build`版本，可以通过`Webpack`的`alias`配置，指向到需要的版本。

