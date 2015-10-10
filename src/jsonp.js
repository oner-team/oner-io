const {appendQueryString, noop, extend, makeRandom} = require('./util');
const win = window;
const doc = document;
const random = Math.random;

let createTag = function () {
    return doc.createElement('script');
}

let defaultOptions = {
    url: '',
    data: {},
    cache: true,
    success: noop,
    error: noop,
    complete: noop,
    log: false,
    callbackQuery: {
        callback: 'jsonp{id}'
    }
};

let jsonp = (options) => {
    options = extend({}, defaultOptions, options);
    console.log(options);



    //let url = appendQueryString(options.url, options.data, options.cache);
    //let callbackKey =
}

module.exports = jsonp;