## Develop

启动实时编译的开发环境

```bash
$ npm start
```

## Build

```bash
$ npm run build
```

## 非现代浏览器开发注意

`browser-sync`不支持`IE8`，所以如果要调试`IE8`，需要在项目根目录下另外启动一个静态服务，比如使用`anywhere`。

```
anywhere 8888
```