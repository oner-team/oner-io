## 配置选项

`natty-fetch`中【任何】层级的配置都可以传入以下参数。

### Outline

Base options：

* [data](#data)
* [header](#header)
* [jsonp](#jsonp)
* [method](#method)
* [mock](#mock)
* [mockUrl](#mockurl)
* [mockUrlPrefix](#mockurlprefix)
* [timeout](#timeout)
* [traditional](#traditional)
* [url](#url)
* [urlPrefix](#urlprefix)
* [urlStamp](#urlstamp)
* [withCredentials](#withcredentials)

Hook options：

* [fit](#fit)
* [process](#process)
* [willFetch](#willfetch)
* [didFetch](#didfetch)

Powerful options：

* [ignoreSelfConcurrent](#ignoreselfconcurrent)
* [overrideSelfConcurrent](#overrideselfconcurrent)
* [plugins](#plugins)
* [storage](#storage)
* [retry](#retry)


### data

请求的固定参数。在全局配置或上下文配置中通常会设置和后端约定的参数，比如`token`。在接口配置中，`data`参数用于定义该接口的固定参数。

* 类型：Object | Function
* 默认：{}

##### 示例：固定参数 与 动态参数

假设有一个接口，用于获取附近的出租车数量，这个接口接受三参数，一个是查询半径，另两个是地理坐标的经纬度，很显然，可以把查询半径定义为固定参数，这样在调用接口的时候就不需要反复传入了。

在定义接口时声明固定参数，确定查询半径为3公里。

```js
context.create({
    'taxi.getNumber': {
        url: 'driver/getNearDrivers'
        data: {
            radius: 3 // 固定参数，指定查询半径为3公里
        }
    }
});
```

在调用接口时传入动态参数，以所在的经纬度为圆心，查群3公里范围内的出租车数量。

```js
db.taxi.getNumber({
    longitude: 120.0190524487949, // 动态参数：经度
    latitude:  30.28173475473827, // 动态参数：纬度
}).then(function(content){...}).catch(function(error){...});
```

> 🍻 尽可能的将固定参数声明在接口定义的模块中，让调用接口的业务代码更清爽。

### didFetch

请求执行完成后的回调函数。接受两个参数`vars`和`config`。

* 类型：Function
* 默认：`function(){}`

### fit

数据结构预处理函数，接收完整的响应数据作为参数，只用于解决数据结构不一致的问题。

* 类型：Function
* 默认：function (response) { return response }

`natty-fetch`接受的标准数据结构是

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

##### 示例

假设实际项目中，接口请求返回的数据结构是

```js
{
    hasError: false, // or true
    content: {},
    error: 'some message'
}
```

这时候需要用`fit`来适配，转换成`natty-fetch`约定的数据结构返回。

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

### header

自定义`ajax`请求的头部信息。当`ajax`请求跨域时，该配置将被忽略。

* 类型：Object
* 默认：{}
* 注意：只针对非跨域的`ajax`请求有效

### ignoreSelfConcurrent

是否忽略接口自身的并发请求，即是否开启请求锁。

* 类型：Boolean
* 默认：false

##### 示例

假设有一个创建订单的按钮，点击即发起请求，最理想的情况，这个"创建订单"的请求必定要做客户端的请求锁，来避免相同的信息被意外地创建了多份订单。在natty-fetch中，只需要一个参数即可开启请求锁。

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

### jsonp

请求方式是否使用`jsonp`，当值为`true`时，默认的url参数形如`?callback=jsonp3879494623`，如果需要自定义`jsonp`的`url`参数，可以通过数组参数配置。

* 类型：Boolean | Array
* 默认：false
* 示例：[true, 'cb', 'j{id}']

### method

配置ajax的请求方式。

* 类型：String
* 默认：'GET'
* 可选：'GET'、'POST'

> 如果浏览器是`IE8/9`，则`natty-fetch`内部使用的是`XDomainRequest`对象，以便支持跨域功能，但`XDomainRequest`对象仅支持`GET`和`POST`两个方法。

### mock

是否开启mock模式

* 类型：Boolean
* 默认：false

### mockUrl

mock模式开启时的请求地址

* 类型：String
* 默认：''(空字符串)

### mockUrlPrefix

mock模式开启时的请求地址前缀，如果mockUrl的值是"绝对路径"或"相对路径"，则不会自动添加该前缀。

* 类型：String
* 默认：''(空字符串)

### overrideSelfConcurrent

是否取消上一次没有完成的请求。即：在当上一次请求结束之前，如果又发起了下一次请求，则只执行后一次请求的响应。更多次数以此类推。

* 类型：Boolean
* 默认：false

##### 示例

假设有一个自动补全输入框，当每次有新的字符输入时，都会向服务端发起新请求，取得匹配的备选列表，当输入速度很快时，期望的是只执行最后一次请求的响应，因为最后一次的字符最全，匹配的列表更精准。这种业务场景下，可以通过配置`overrideSelfConcurrent`为`true`，一是可以节省响应次数。二次能避免先发出的请求却最后响应(并发异步请求的响应顺序不一定和请求顺序一致)，导致推荐的数据列表不准确。

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

### process

请求成功时的数据处理函数，该函数接收到的参数是下文的"数据结构约定"中`content`的值。

* 类型：Function
* 默认：function (content) {return content}

### retry

在请求失败(网络错误，超时，success为false等)时是否进行请求重试。

* 类型：Number
* 默认：0

### timeout

超时时间，0表示不启动超时处理。

* 类型：Number
* 默认：0

### traditional

和`jQuery/Zepto`的`param`方法的第二个参数一样的效果。

* 类型：Boolean
* 默认：false

### url

* 类型：String
* 默认：''(空字符串)

请求地址

### urlPrefix

请求地址前缀，如果url的值是"绝对路径"或"相对路径"，则不会自动添加该前缀。

* 类型：String
* 默认：''(空字符串)

### urlStamp

是否在`url`的`search`中加入时间戳(`__stamp`)参数，屏蔽浏览器默认的缓存(304)机制。

* 类型：Boolean
* 默认：true

### willFetch

请求执行前的回调函数。。接受两个参数`vars`和`config`。

* 类型：Function
* 默认：`function(){}`

### withCredentials

是否发送`cookie`，`natty-fetch`内部已经通过判断`url`是否跨域来自动设置该值，所以不建议手动设置。

* 类型：Boolean
* 默认：通过判断`url`是否跨域来自动设置该值，跨域时为`false`

### plugins

配置可用的插件。

* 类型：Array
* 默认：[]
* 可用值：
  - natty-fetch.plugin.soon
  - natty-fetch.plugin.loop

##### `soon`

在`storage`开启的情况下，会马上使用`storage`缓存的数据执行回调，并同时发起远程请求，并将请求回来的新数据同步到`storage`中，再第二次执行回调。

```js
let Order = DBContext.create('Order', {
    getList: {
        url: '...',
        storage: true,
        plugins: [
            natty-fetch.plugin.soon
        ]
    }
});

Order.getList.soon({}, function(data){
    // `data`的结构如下
    // {
    //     fromStorage: true, 
    //     content: {}
    // }
    //
    // 如果是首次请求，该回调只会执行一次，
    // `data.fromStorage`为`false`，`data.content`来自远程接口。
    //
    // 如果是非首次请求，该回调会执行两次，
    // 第一次的`data.fromStorage`为`true`，`data.content`来自缓存，所以会很快。
    // 第二次的`data.fromStorage`为`false`，`data.content`来自远程接口。
}, function(error){
    // 任何异常
})
```

##### `loop`

创建轮询请求从来就没有这么简单过！

```js
context.create('driver', {
    getDistance: {
        url: '...',
        plugins: [
            natty-fetch.plugin.loop
        ]
    }
});

// 开始轮询
let stopHandler = db.driver.getDistance.loop({
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
stopHandler();

// 轮询状态
stopHandler.looping; // true or false
```

### storage

是否开启缓存功能。该功能仅存在于`v2.0.0`以上的版本

* 类型：Boolean | Object
* 默认：false

`natty-fetch`的缓存功能由`natty-storage`提供，`storage`配置可参考`natty-storage`的[文档](https://github.com/Jias/natty-storage)。有两点需要注意：

1. 当`type`指定为`localStorage`时，必须同时配置`key`值！
2. `async`配置在此处无效，`natty-fetch`内部强制为`true`值！

> 💣💣💣 当使用`localStorage`作为缓存方式时，需要慎重选择`key`值。`key`值代表一份缓存数据的引用地址，开启`storage`功能前，一定要选好一个可长期使用的`key`值，且`key`值是不应该经常变化的。
> 
> 如果`key`值因某种原因(自己挖坑)必须变化，则需要将变化前的`key`值所对应的缓存删除。因为新的`key`值会创建一份新的缓存数据。而原有的`key`值对应的数据如果不删，将成为用户浏览器中的死数据！！！
