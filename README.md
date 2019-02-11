# oner-io

[![npm version](https://img.shields.io/npm/v/oner-io.svg?style=flat)](https://www.npmjs.com/package/oner-io) [![download](https://img.shields.io/npm/dm/oner-io.svg?style=flat)](https://www.npmjs.com/package/oner-io) [![license](https://img.shields.io/badge/license-MIT-blue.svg?style=flat)](https://raw.githubusercontent.com/jias/oner-io/master/LICENSE)

## v3.x（新名字，还未发布） 

新名字`oner-io`，名称空间`onerIO`，还未发布！

`oner-io`是这个工具的新名字(原名叫`natty-fetch`)，新名字意为着新起点，从此，该工具从原来的个人([jias](https://github.com/jias))维护，变为团队([oner-team](https://github.com/oner-team))维护。

- `oner-io`从`v3.0.0`开始发布(还未发布)，就是`natty-fetch@3.0.0`的计划，有破坏性升级，当然也更好用了。
- 🍉 原`natty-fetch`的一切内容都在当前仓库的[`natty-fetch`](https://github.com/oner-team/oner-io/tree/natty-fetch)分支中。
- 🍉 原`natty-fetch`的`bug`，在`2019`年依然会继续修复并发包。

## 定位

🍔 很多人问起，`oner-io`是原生`fetch`的扩展吗？，或者`oner-io`和[`axios`](https://github.com/axios/axios)有什么区别？所以统一回答一下：

`oner-io`的定位并不是另一个`ajax/jsonp`工具，而是多人协作时定义接口和使用接口的一套规范，特别是项目接口来至多个后台系统时。

界面有名气的`ajax`工具，功能强大的有很多，如果只是找工具，轻量级的可以使用[`axios`](https://github.com/axios/axios)，重量级的可以使用[bluebird](http://bluebirdjs.com/docs/getting-started.html)。如果是希望找到团队多人协作的规范，使用`oner-io`！

那么，知道了`oner-io`的定位，小伙伴们就可以理解，使用这套规范(多人协作时定义接口和使用接口的规范)，一定是会有一点点代价的，一定会比`axios`这种纯工具，在使用时，多出一点点配置，但非常值得！

> 目前功能的缺失：文件上传功能，建议使用专业文件上传组件。

> 🍻 开发者的体验至关重要！在微小的技术点上追求极致的开发体验。如果对你有帮助，请考虑Star一下。


## 特点

#### 强大的缓存

项目中经常遇到一些相对稳定的数据，如省市列表、差旅性质、任务类别、币种类别等等。这些数据通常根据业务需要或客观变化才更新一次，虽然更新慢，但又必须更新。在请求这些数据时，可以借助`oner-io`强大的缓存(如：缓存的三种有效性判断，缓存的降级处理)，分分钟完成异步数据的缓存实现。

#### 名称空间支持

我们在大型项目中会经常碰见一种情况，不同的业务模块有着很多非常相似(甚至相同)的数据接口。这种级别的项目，如果在一开始没有做好足够的名称空间规划，后期一定会逐步进入"命名冲突"的大坑。`oner-io`专为大项目而生，在[名称空间](https://github.com/jias/oner-io/blob/master/docs/clear_api.md)方面做足了设计，层级不限，书写灵活，使用者只需关心如何规划即可。

> 很多老项目，各种原因，经历过多个团队的开发，后续的接手人，要么梳理得很辛苦，要么以更特殊的命名方式继续堆接口...，吐槽是不解决问题的，`oner-io`走起吧！

#### 数据适配约定

无论是`XMLHttpRequest`，还是`fetch`，业务逻辑的错误都是作为成功响应(`response`)的数据一起返回的，但通常情况我们需要将这种错误从`response`中分离出来，进而`reject`这次请求。这是一项重复的工作。`oner-io`把这种重复的工作提取为一项配置，即数据适配([`fit`](https://github.com/jias/oner-io/blob/master/docs/options.md#fit))，让业务逻辑错误直接走向`reject`，进而`resolve`拿到的数据是代表业务逻辑成功的数据，无需判断，直接可用。

> 业务逻辑错误的举例："您已投过票啦，不能重复投票！"，"您的操作权限不够！"

#### 多上下文支持

当项目需要调用多个后台系统的数据接口时，清晰地实现各自系统的通用配置是非常好的编程习惯(利人利己)。想象一下，假设其中一个系统的所有接口需要添加`token`参数时，在该系统的上下文配置中修改一处即可实现，是多么惬意的事情。不仅如此，`oner-io`还提供了[三个层级的配置](https://github.com/jias/oner-io/blob/master/docs/option_levels.md)，由上至下分别是全局配置(`Global`)，上下文配置(`Context`)和接口配置(`API`)，上游配置作为下游配置的默认值，同时又被下游配置所覆盖。

#### 插件机制

一方面，借助插件机制，可以将项目中已经存在的任何(是的，不管有多少种)数据获取方案统一化。统一后的原有方案直接拥有"名称空间支持"、"多上下文支持"、"数据适配约定"、"强大的缓存"等`oner-io`特色功能。另一方面，插件机制也可以用于扩展接口的使用方式，比如内置的[`loop`](https://github.com/jias/oner-io/blob/master/docs/options.md#loop)插件，只需一行配置，就可以快速让一个接口拥有轮询功能。

#### 兼容至IE8

如果项目仅支持现代(`Modern`)浏览器，推荐使用`oner-io.min.js`。如果需要兼容到`IE8`，则必须使用`oner-io.pc.min.js`和`Promise Polyfill`。

## v2.x docs

* [安装 (Installation)](docs/install.md)
* [使用概览-项目级 (Start for Project)](docs/start_for_project.md)
* [使用概览-组件级 (Start for Component)](docs/start_for_component.md)
* [配置层级 (Option Levels)](docs/option_levels.md)
* [配置选项 (Options)](docs/options.md)
* [使用约定 (Rules)](docs/rules.md)
* [创建清晰的接口层级 (Api)](docs/clear_api.md)
* [共建 (Contribute)](docs/dev.md)
* [常见问题 (QA)](docs/questions.md) old


## Compatibility

* H5版本：iPhone4+、Android2.3+
* PC版本：IE8+、Edge、Chrome、Safari、Firefox

## Get help

* 钉钉账号：拂山
* 微信账号：加拂山的微信(gnosaij)，备注一下`oner`，会被拉到`oner`工具群。

## Dev && Build

Node需要7以上的版本

```
启动开发环境
$ npm install
$ npm start

构建
$ npm build
```


## Important References

* [Using CORS](http://www.html5rocks.com/en/tutorials/cors/) on html5rocks, very good!
* [Browser support for CORS](http://enable-cors.org/client.html)
* [XDomainRequest on MSDN](https://msdn.microsoft.com/en-us/library/cc288060(VS.85).aspx)