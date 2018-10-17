import {noop, NULL, TRUE, FALSE, EMPTY, hasWindow} from './util'

const config = {
  // 是否异步，默认是，只针对ajax有效
  async: TRUE,

  // 默认参数
  data: {},

  // 请求完成钩子函数
  didFetch: noop,

  // 预处理回调
  fit: noop,

  // 自定义header, 只针对非跨域的ajax有效, 跨域时将忽略自定义header
  header: {},

  // 是否忽律接口自身的并发请求
  ignoreSelfConcurrent: FALSE,

  // 有两种格式配置`jsonp`的值
  // {Boolean}
  // {Array} eg: [TRUE, 'cb', 'j{id}']
  jsonp: FALSE,

  // 是否在`jsonp`的`script`的标签上加`crossorigin`属性
  jsonpCrossOrigin: FALSE,

  // 是否开启log信息
  log: FALSE,

  // 非GET方式对JSONP无效
  method: 'GET',

  // 是否开启mock模式
  mock: FALSE,

  mockUrl: EMPTY,

  // 全局`mockUrl`前缀
  mockUrlPrefix: EMPTY,

  // 全局`mockUrl`后缀
  mockUrlSuffix: EMPTY,

  // 成功回调
  process: noop,

  // 私有Promise对象, 如果不想用浏览器原生的Promise对象的话
  Promise: hasWindow ? window.Promise : NULL,

  // 是否是rest风格
  rest: FALSE,

  // 默认不执行重试
  retry: 0,

  query: {},

  // 使用已有的request方法
  customRequest: NULL,

  // 0表示不启动超时处理
  timeout: 0,

  // http://zeptojs.com/#$.param
  traditional: FALSE,

  url: EMPTY,

  // 全局`url`前缀
  urlPrefix: EMPTY,

  // 是否在`url`上添加辅助开发的标记，如`_api=xxx&_mock=false`
  urlMark: true,

  // 是否在`url`上添加时间戳，如`_stamp=xxx`，用于避免浏览器的304缓存
  urlStamp: TRUE,

  // 全局`url`后缀
  urlSuffix: EMPTY,

  // TODO 文档中没有暴露
  withCredentials: NULL,

  // 请求之前调用的钩子函数
  willFetch: noop,

  // 扩展: storage
  storage: FALSE,

  // 插件，已内置两种
  // plugins: [
  //   nattyFetch.plugin.loop
  //   nattyFetch.plugin.soon
  // ]
  plugins: FALSE,
}

export default config