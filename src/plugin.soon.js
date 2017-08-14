import {noop, FALSE, TRUE, hasConsole} from './util'

export default function() {
  const {api} = this
  api.soon = (data, successFn = noop, errorFn = noop) => {
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
    this.send(vars).then(content => {
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