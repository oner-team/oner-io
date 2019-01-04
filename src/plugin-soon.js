import {noop, FALSE, TRUE, hasConsole, deepCopy} from './util'

export default function() {
  const {api} = this
  api.soon = (data, successFn = noop, errorFn = noop) => {
    const config = deepCopy(this.config)
    const vars = this.makeVars(data)

    // 先尝试用`storage`数据快速响应
    if (api.storageUseable) {

      const result = api.storage.has(vars.queryString)

      if (result.has) {
        successFn({
          fromStorage: TRUE,
          content: result.value,
        })
      }
    }

    // 再发起网络请求(内部会更新`storage`)
    // api方法是请求的入口方法，不一定会发起网络请求，api方法内部，通过调用send方法来发起真正的网络请求
    this.send(vars, config, {}).then(content => {
      successFn({
        fromStorage: FALSE,
        content,
      })
    }, error => {
      errorFn(error)
    })['catch'](function (e) {
      hasConsole && console.error(e)
    })
  }
}