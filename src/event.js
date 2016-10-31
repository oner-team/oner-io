/**
 * src/event.js
 *
 * @license MIT License
 * @author jias (https://github.com/jias/natty-fetch)
 */
const PREFIX = '_';
function rename (type) { return PREFIX + type; }

export default {
    on : function () {
        var t    = this;
        var args = arguments;
        if (typeof args[0] === 'string' && typeof args[1] === 'function') {
            var type = rename(args[0]);
            t[type]  = t[type] || [];
            t[type].push(args[1]);
        } else if (typeof args[0] === 'object') {
            var hash = args[0];
            for (var i in hash) {
                t.on(i, hash[i]);
            }
        }
    },
    off : function (type, fn) {
        var t = this;
        var type = rename(type);
        if (!fn) {
            delete t[type];
        } else {
            var fns = t[type];
            fns.splice(fns.indexOf(fn), 1);
            if (!t[type].length) delete t[type];
        }
    },
    // @param {array} args
    fire : function (type, args, context) {
        var t = this;
        var fns = t[rename(type)];
        if (!fns) return 'NO_EVENT';
        for (var i=0, fn; fn = fns[i]; i++) {
            fn.apply(context || t, [].concat(args));
        }
    },
    hasEvent : function (type) {
        return !!this[rename(type)];
    }
}