## Installation

The fastest way to get started is to serve JavaScript from the CDN

```html
<!-- storage tool for natty-fetch -->
<script src="https://npmcdn.com/natty-storage@1.0.0/dist/natty-storage.js"></script>
<!-- core for natty-fetch -->
<script src="https://npmcdn.com/natty-fetch@2.0.0-rc1/dist/natty-fetch.js"></script>
```

Also, it's as easy as npm.

```
npm install natty-storage natty-fetch --save
```


## Polyfill old browsers!!!（Optional）

`natty-fetch` depends on Promise and JSON which are available in modern browser. 
here are some recommended `polyfill` to support `natty-fetch` in old browser:

*  [lie](https://github.com/calvinmetcalf/lie): a small, performant, exception-friendly,  promise library implementing the [Promises/A+ spec Version 1.1](http://promises-aplus.github.com/promises-spec/)。
* [json2](https://github.com/douglascrockford/JSON-js): support JSON encoders/decoders in JavaScript。

## Compatible with IE8/9

include `es5-shim` and `es5-sham` before `natty-fetch` 


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

> `es5-shim` and `es5-sham` are required when the code which is transpiling by [`Babel`](http://babeljs.io/) runs on `IE8/9`。
