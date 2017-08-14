const PREFIX = '_'
function rename (type) {
  return PREFIX + type
}

export default {
  on: function () {
    const args = arguments
    if (typeof args[0] === 'string' && typeof args[1] === 'function') {
      const type = rename(args[0])
      this[type]  = this[type] || []
      this[type].push(args[1])
    } else if (typeof args[0] === 'object') {
      const hash = args[0]
      for (let i in hash) {
        if (hash.hasOwnProperty(i)) {
          this.on(i, hash[i])
        }
      }
    }
  },
  off: function (type, fn) {
    type = rename(type)
    if (!fn) {
      delete this[type]
    } else {
      const fns = this[type]
      fns.splice(fns.indexOf(fn), 1)
      if (!this[type].length) {
        delete this[type]
      }
    }
  },
  // @param {array} args
  fire: function (type, args, context) {
    const fns = this[rename(type)]
    if (!fns) return 'NO_EVENT'
    for (let i=0, l=fns.length; i<l; i++) {
      fns[i].apply(context || this, [].concat(args))
    }
  },
  hasEvent: function (type) {
    return !!this[rename(type)]
  },
}