import './natty-fetch.spec'
import './util.spec'
import './ajax.spec'
import './event.spec'
import './storage.spec'
import './plugin.spec'
import './plugin-soon.spec'
import './plugin-loop.spec'
import './plugin-custom-request.spec'
import './simple.spec'
import './private-promise.spec'
import './timeout-with-self-concurrent.spec'
import './restful.spec'
import './header-content-type-application-json.spec'




/*

import io from 'io'

let abortHandler
io.getList

    // 给restful url填充数据
    .rest({
        id: 1
    })

    // 在url上追加query string
    .query({
        pageNo: 1,
        pageSize: 10
    })

    // POST, PUT, PATCH请求的body数据
    .body({
        title: 'foo',
        content: 'hello'
    })

    // 创建取消函数
    use(abort(handler => abortHandler = handler))

    // 发起请求行为，返回promise对象
    .send()

    .use(loop({
        duration: 5000
    }))

    .loop({
        
    })


// 取消请求
abortHandler()
*/