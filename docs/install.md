## Installation

The fastest way to get started is to serve JavaScript from the CDN

```html
<!-- storage tool for natty-fetch -->
<script src="https://npmcdn.com/natty-storage@1.0.0/dist/natty-storage.min.js"></script>
<!-- core for natty-fetch -->
<script src="https://npmcdn.com/natty-fetch@2.1.2/dist/natty-fetch.min.js"></script>
```

Also, it's as easy as npm.

```
npm install natty-storage natty-fetch --save
```

如果需要支持非现代(Modern)的浏览器，请继续安装下面的`polyfill`。

## Polyfill old browsers!!!（Optional）

`natty-fetch`依赖了现代浏览器的两个全局对象。在非现代浏览器下，可以通过引入`polyfill`解决。

* `Promise`对象，推荐 [lie](https://github.com/calvinmetcalf/lie)，小而精美，而且对`js`异常的捕获很友好，遵循[Promises/A+ spec](https://promisesaplus.com/)。
* `JSON`对象，推荐 [json2](https://github.com/douglascrockford/JSON-js)。

## IE8/9的兼容

如果项目需要兼容`IE8/9`浏览器，需要在`natty-fetch`之前引入`es5-shim`和`es5-sham`扩展。

install by npm

```shell
npm install es5-shim --save
```

add to html

```html
<!--[if lt IE 10]>
<script type="text/javascript" src="path/to/es5-shim.min.js"></script>
<script type="text/javascript" src="path/to/es5-sham.min.js"></script>
<![endif]-->
```

> 经过[`Babel`](http://babeljs.io/)编译后的代码，如果想运行在`IE8/9`浏览上，就需要引入`es5-shim`和`es5-sham`扩展。
