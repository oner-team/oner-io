## 配置选项

`natty-fetch`中【任何】层级的配置都可以传入以下参数。

#### data

* 类型：Object / Function
* 默认：{}

请求的固定参数。在全局配置或上下文配置中通常会设置和后端约定的参数，比如`token`。在接口配置中，`data`参数用于定义该接口的固定参数。

##### 示例一

假设有一个接口，用于获取附近的出租车数量，这个接口接受两种参数，一个是查询半径，一个是地理坐标，很显然，可以把查询半径定义为固定参数，这样在调用接口的时候就不需要反复传入了。

定义接口

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

调用接口

```js
db.taxi.getNumber({
    longitude: 120.0190524487949, // 动态参数：经度
    latitude:  30.28173475473827, // 动态参数：纬度
}).then(function(content){...}).catch(function(error){...});
```

#### didRequest

* 类型：Function
* 默认：`function(){}`

钩子函数，会在请求执行完成后调用。

#### fit

* 类型：Function
* 默认：function (response) { return response }

数据结构预处理函数，接收完整的后端数据作为参数，只应该用于解决后端数据结构不一致的问题。

natty-fetch接受的标准数据结构是

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

这时候需要用`fit`来适配，转换成natty-fetch约定的数据结构返回。

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

#### header

* 类型：Object
* 默认：{}
* 注意：只针对非跨域的`ajax`请求有效

自定义`ajax`请求的头部信息。当`ajax`请求跨域时，该配置将被忽略。

#### ignoreSelfConcurrent

* 类型：Boolean
* 默认：false

是否忽略接口自身的并发请求，即是否开启请求锁。

示例：假设有一个创建订单的按钮，点击即发起请求，最理想的情况，这个"创建订单"的请求必定要做客户端的请求锁，来避免相同的信息被意外地创建了多份订单。在natty-fetch中，只需要一个参数即可开启请求锁。

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

#### jsonp

* 类型：Boolean / Array
* 默认：false
* 示例：[true, 'cb', 'j{id}']

请求方式是否使用jsonp，当值为true时，默认的url参数形如`?callback=jsonp3879494623`，如果需要自定义jsonp的url参数，可以通过数组参数配置。

#### method

* 类型：String
* 默认：'GET'
* 可选：'GET'、'POST'

配置ajax的请求方式。

> 如果浏览器是IE8/9，则natty-fetch内部使用的是`XDomainRequest`对象，以便支持跨域功能，但`XDomainRequest`对象仅支持`GET`和`POST`两个方法。

#### mock

* 类型：Boolean
* 默认：false

是否开启mock模式

#### mockUrl

* 类型：String
* 默认：''(空字符串)

mock模式开启时的请求地址

#### mockUrlPrefix

* 类型：String
* 默认：''(空字符串)

mock模式开启时的请求地址前缀，如果mockUrl的值是"绝对路径"或"相对路径"，则不会自动添加该前缀。


#### overrideSelfConcurrent

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

#### process

* 类型：Function
* 默认：function (content) {return content}

请求成功时的数据处理函数，该函数接收到的参数是下文的"数据结构约定"中`content`的值。

#### retry

* 类型：Number
* 默认：0

在请求失败(网络错误，超时，success为false等)时是否进行请求重试。

#### timeout

* 类型：Number
* 默认：0

超时时间，0表示不启动超时处理。

#### traditional

* 类型：Boolean
* 默认：false

和`jQuery/Zepto`的`param`方法的第二个参数一样的效果。

#### url

* 类型：String
* 默认：''(空字符串)

请求地址

#### urlPrefix

* 类型：String
* 默认：''(空字符串)

请求地址前缀，如果url的值是"绝对路径"或"相对路径"，则不会自动添加该前缀。

#### urlStamp

* 类型：Boolean
* 默认：true

是否在`url`的`search`中加入时间戳(`__stamp`)参数，屏蔽浏览器默认的缓存(304)机制。

#### willRequest

* 类型：Function
* 默认：`function(){}`

钩子函数，会在请求执行前调用。

#### plugins

* 类型：Array
* 默认：[]
* 可用值：
  - natty-fetch.plugin.soon
  - natty-fetch.plugin.loop

`soon`插件：在`storage`开启的情况下，会马上使用`storage`缓存的数据执行回调，并同时发起远程请求，并将请求回来的新数据同步到`storage`中，再第二次执行回调。

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

Order.getList.soon({}, function(content){
    // 如果是首次请求，该回调只会执行一次，`content`来自远程接口
    // 如果是非首次请求，该回调会执行两次，`content`分别来自缓存和远程接口
}, function(error){
    // 任何异常
})
```

`loop`插件：创建轮询请求从来就没有这么简单过！

```js
Driver = DBContext.create('Driver', {
    getDistance: {
        url: '...',
        plugins: [
            natty-fetch.plugin.loop
        ]
    }
});

// 开始轮询
Driver.getDistance.startLoop({
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
Driver.getDistance.stopLoop();

// 轮询状态
Driver.getDistance.looping; // true or false
```

配置可用的插件。
