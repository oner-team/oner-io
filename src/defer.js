function Defer(Promise) {
  let t = this;
  t.promise = new Promise(function (resolve, reject) {
    t._resolve = resolve;
    t._reject = reject;
  });
}
Defer.prototype.resolve = function (value) {
  this._resolve.call(this.promise, value);
};
Defer.prototype.reject = function (reason) {
  this._reject.call(this.promise, reason);
};
module.exports = Defer;