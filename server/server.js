var express = require('express');
var app = express();

app.all('/api/:method/:accept', function (req, res) {
    console.log(req.params);
    res.set({
        "Access-Control-Allow-Origin": "*",
        //"Access-Control-Allow-Headers": "Content-Type,Content-Length,Authorization,Accept,X-Requested-With",
        "Access-Control-Allow-Methods": "PUT,POST,GET,DELETE,OPTIONS",

        "Access-Control-Allow-Credentials": true
    });

    if (req.params.accept == 500) {
        res.status(500).json({error: '500'})
    } else if (req.params.accept == 404) {
        res.status(404).json({error: '404'})
    } else if (req.params.accept == 'abort') {
        setTimeout(function () {
            res.send('abort');
        }, 10000);
    } else {
        var data;
        var method = 'send';
        switch(req.params.accept) {
            case 'script':
                data = 'window.__test__ = 1;';
                break;
            case 'json':
                data = {tool:'natty-db'};
                method = 'json';
                break;
            case 'html':
                data = '<div>html</div>';
                break;
            case 'xml':
                data = '<div>xml</div>';
                break;
            case 'text':
            default :
                data = 'text';
                break;
        }

        switch(req.params.method) {
            case 'get':
                res[method](data);
                break;
            case 'post':
                res[method](data);
                break;
            default :
                res[method](data);
        }
    }
});

var server = app.listen(8001, function () {
    var host = server.address().address;
    var port = server.address().port;

    console.log('Example app listening at http://%s:%s', host, port);
});
// http://www.bennadel.com/blog/2327-cross-origin-resource-sharing-cors-ajax-requests-between-jquery-and-node-js.htm
// http://kodemaniak.de/2010/07/cross-domain-ajax-with-restlet-and-jquery/
// http://stackoverflow.com/questions/21783079/ajax-in-chrome-sending-options-instead-of-get-post-put-delete
// http://stackoverflow.com/questions/1256593/why-am-i-getting-an-options-request-instead-of-a-get-request