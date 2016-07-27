# nattyFetch

[![npm version](https://img.shields.io/npm/v/natty-fetch.svg?style=flat)](https://www.npmjs.com/package/natty-fetch) [![license](https://img.shields.io/badge/license-MIT-blue.svg?style=flat)](https://raw.githubusercontent.com/jias/natty-fetch/master/LICENSE)

A natty data-fetching tool for project that no longer needs to use jQuery/Zepto's Ajax.

> 🍻 开发者的体验至关重要！  
> `natty`系列的小工具，以垂直的思路和工匠的精神，在微小的技术点上追求极致的开发体验。如果对你有帮助，考虑支持一下吧 :D

## Features

* 接口风格和原生的`fetch`保持一致，都是`Promise`风格。
* 以超简洁的配置开启最常见的强大功能(`fetch`不支持)。
* 承载一套编码约定，可以将已有的任何方案转换成统一的开发体验。对，任何已有的，已封装好的，自成体系的方案。
* 支持配置多个数据接口上下文，大型项目的接口管理再也不用乱成一团。
* 同时兼容移动端和`PC`端，PC端最低支持到`IE8`。
* 支持自动判断跨域请求，跨域时，不强制手动传入`withcredentials:false`。

## v1.x docs

`v1.0.2`之前的名称空间为`NattyDB`，对应的文档请移步[这里](https://github.com/Jias/natty-fetch/tree/v1.0.2)。

## v1.x to v2.x

* [从1.x升级到2.x](docs/from_v1_to_v2.md)

## v2.x docs

* [安装 (Installation)](docs/install.md)
* [使用概览-项目级 (Start for Project)](docs/start_for_project.md)
* [使用概览-组件级 (Start for Component)](docs/start_for_component.md)
* [配置层级 (Option Levels)](docs/option_levels.md)
* [配置选项 (Options)](docs/options.md)
* [使用约定 (Rules)](docs/rules.md)
* [创建清晰的接口层级 (Api)](docs/clear_api.md)
* [共建 (Contribute)](docs/dev.md) old
* [常见问题 (QA)](docs/questions.md) old

## Compatibility

* H5版本：iPhone4+、Android2.3+
* PC版本：IE8+、Edge、Chrome、Safari、Firefox


## Important References

* [Using CORS](http://www.html5rocks.com/en/tutorials/cors/) on html5rocks, very good!
* [Browser support for CORS](http://enable-cors.org/client.html)
* [XDomainRequest on MSDN](https://msdn.microsoft.com/en-us/library/cc288060(VS.85).aspx)