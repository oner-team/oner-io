/**
 * src/defer.js
 *
 * @license MIT License
 * @author jias (https://github.com/jias/natty-fetch)
 */
export default class Defer {
  constructor(Promise) {
    const t = this
    t.promise = new Promise(function (resolve, reject) {
      t._resolve = resolve
      t._reject = reject
    })
  }

  resolve(value) {
    this._resolve.call(this.promise, value)
  }

  reject(reason) {
    this._reject.call(this.promise, reason)
  }
}