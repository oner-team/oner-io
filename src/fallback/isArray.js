if (util.isArray) {
    const toString = Object.prototype.toString;
    const ARRAY_TYPE = '[object Array]';
    util.isArray = function(arg) {
        return toString.call(arg) === ARRAY_TYPE;
    };
}