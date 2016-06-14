const expect = require('expect.js')
const config = require('./config');
const NattyFetch = require('natty-fetch');

describe('./hooks', function(){

    describe('willRequest', function(){

        this.timeout(1000*60);

        it('ajax willRequest call', function (done) {
            let DBC = new NattyFetch.Context({
                urlPrefix: config.host,
                willRequest() {
                    done()
                }
            })
            DBC.create('Api', {
                getApi: {
                    url: 'api/return-json',
                    fit(resp) {
                        return {
                            success: true,
                            content: resp
                        }
                    }
                }
            })
            DBC
                .Api
                .getApi()
                .then((content) => {
                })
        })

        it('jsonp willRequest call', function (done) {
            let DBC = new NattyFetch.Context({
                urlPrefix: config.host,
                willRequest() {
                    done()
                }
            })
            DBC.create('Api', {
                getApi: {
                    url: 'api/jsonp-order-create',
                    jsonp: true,
                    fit(resp) {
                        return resp
                    }
                }
            })
            DBC
                .Api
                .getApi()
                .then((content) => {
                })
        })

    })

    describe('didRequest', function(){

        it('ajax success didRequest', function (done) {
            let DBC = new NattyFetch.Context({
                urlPrefix: config.host
            })
            DBC.create('Api', {
                getApi: {
                    url: 'api/return-json',
                    fit(resp) {
                        return {
                            success: true,
                            content: resp
                        }
                    },
                    didRequest(config) {
                        //console.log(config)
                        done()
                    }
                }
            })
            DBC
                .Api
                .getApi()
                .then((content) => {
                })
        })

        it('jsonp success didRequest long time', function (done) {
            let DBC = new NattyFetch.Context({
                urlPrefix: config.host
            })
            DBC.create('Api', {
                getApi: {
                    url: 'api/jsonp-timeout',
                    jsonp: true,
                    timeout: 2000,
                    fit(resp) {
                        return {
                            success: true,
                            content: resp
                        }
                    },
                    didRequest(config) {
                        //console.log(config)
                        done()
                    }
                }
            })
            DBC
                .Api
                .getApi()
                .then((content) => {
                })
        })

        it('ajax error didRequest', function (done) {
            let DBC = new NattyFetch.Context({
                urlPrefix: config.host
            })
            DBC.create('Api', {
                getApi: {
                    url: 'api/return-error',
                    fit(resp) {
                        return resp
                    },
                    didRequest(config) {
                        //console.log(config)
                        done()
                    }
                }
            })
            DBC
                .Api
                .getApi()
                .then((content) => {
                }, (reason) => {
                    //console.log(reason)
                })
        })

        it('jsonp error didRequest', function (done) {
            let DBC = new NattyFetch.Context({
                urlPrefix: config.host,
                jsonp: true
            })
            DBC.create('Api', {
                getApi: {
                    url: 'api/jsonp-order-create-error',
                    fit(resp) {
                        return resp
                    },
                    didRequest(config) {
                        //console.log(config)
                        done()
                    }
                }
            })
            DBC
                .Api
                .getApi()
                .then((content) => {
                }, (reason) => {
                    //console.log(reason)
                })
        })

        it('ajax timeout didRequest', function (done) {
            let DBC = new NattyFetch.Context({
                urlPrefix: config.host,
                timeout: 500
            })
            DBC.create('Api', {
                getApi: {
                    url: 'api/timeout',
                    fit(resp) {
                        return {
                            success: true,
                            content: resp
                        }
                    },
                    didRequest(config) {
                        //console.log(config)
                        done()
                    }
                }
            })
            DBC
                .Api
                .getApi()
                .then((content) => {
                }, (reason) => {
                    //console.log(reason)
                })
        })

        it('jsonp timeout didRequest', function (done) {
            let DBC = new NattyFetch.Context({
                urlPrefix: config.host,
                jsonp: true,
                timeout: 500
            })
            DBC.create('Api', {
                getApi: {
                    url: 'api/jsonp-timeout',
                    fit(resp) {
                        return {
                            success: true,
                            content: resp
                        }
                    },
                    didRequest(config) {
                        //console.log(config)
                        done()
                    }
                }
            })
            DBC
                .Api
                .getApi()
                .then((content) => {
                }, (reason) => {
                    //console.log(reason)
                })
        })

    })

})
