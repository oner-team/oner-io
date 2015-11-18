// TODO 

;(function(){
var inited = false;
var C = {
    init : function () {
		if (inited) return;
        var wrapper = document.createElement('div');
        wrapper.id = 'mobile-console-wrapper';
        wrapper.style.cssText = 'font-size:11px;line-height:1.1;word-break:break-all;position:absolute;position:fixed;bottom:0;right:0;background-color:#fff;width:300px;opacity:0.8;z-index:999999999';

        var clear = document.createElement('div');
        clear.innerHTML = 'clear';
        clear.style.cssText = 'background-color:red;line-height:18px;text-align:center;color:#fff;';
        clear.onclick = function(){
            var r;
            while (r = C.el.firstChild) {
                C.el.removeChild(r);
            }
        };

        wrapper.appendChild(clear);


        var clearLS = document.createElement('div');
        clearLS.innerHTML = 'clearLS';
        clearLS.style.cssText = 'background-color:orange;line-height:20px;text-align:center;color:#fff;';
        clearLS.onclick = function(){
            for (var i in localStorage) {
                localStorage.removeItem(i);
            }
            C.log('ls clear');
        };

        wrapper.appendChild(clearLS);


        var el = document.createElement('div');
        el.id = 'mobile-console';
        wrapper.appendChild(el);

        // (document.getElementById('s_app') || document.body).appendChild(wrapper);
        (document.getElementById('sApp') || document.body).appendChild(wrapper);
        this.wrapper = wrapper;
        this.el = el;
        // setInterval(function(){
            // wrapper.style.top = window.pageYOffset + 'px';
        // }, 100);

        // window.addEventListener('resize', function () {
            // wrapper.style.display = 'none';
            // wrapper.style.display = 'block';
        // }, false);
        // window.addEventListener('scroll', function () {
            // wrapper.style.display = 'none';
            // wrapper.style.display = 'block';
        // }, false);
		inited = true;
    },
    debug : true,
    el  : null,
    log : function () {
        if (!this.debug) return;
		this.init();
            var args = Array.prototype.slice.call(arguments).join('<br />');
        var p = document.createElement('p');
            p.style.fontSize     = '12px';
            p.style.lineHeight   = '12px';
            p.style.margin       = 0;
            p.style.padding = 0;
        p.style.borderLeft = '3px solid green';
        p.innerHTML = args;
        this.el.appendChild(p);
    },
    dir : function (obj) {
        if (!this.debug) return;
		this.init();
        var str = [];
        for (var i in obj) {
            str.push(i + ':' + obj[i]);
        }
        this.log.apply(this, str);
    },
    ing : function (id) {
        if (!this.debug) return;
		this.init();
        var cid = '$' + id;

        var args = Array.prototype.slice.call(arguments);
        args.shift();
        args = '<div style="background-color:#333;color:#fff;font-weight:bold;">' + id + '</div>' + args.join('<br />');

        var p = document.getElementById(cid);
        if (p) {
            p.innerHTML = args;
        } else {
            p = document.createElement('p');
            p.id = cid
            p.style.fontSize     = '13px';
            p.style.lineHeight   = '15px';
            p.style.margin       = 0;
            p.style.padding = 0;
            p.style.borderLeft = '3px solid red';
            p.innerHTML = args;
            this.el.appendChild(p);
        }
    },
    ing2 : function (id) {
        if (!this.debug) return;
		this.init();
        var cid = '$' + id;

        var args = Array.prototype.slice.call(arguments);
        args.shift();

        for (var i=0, l = args.length; i<l; i++) {
            args[i] = args[i] + ':'+ (''+new Date().getTime()).slice(8);
        }
        args = '<div style="background-color:#333;color:#fff;font-weight:bold;">' + id + '</div>' + args.join('<br />');

        var p = document.getElementById(cid);
        if (p) {
            p.innerHTML = args;
        } else {
            p                    = document.createElement('p');
            p.id                 = cid
            p.style.fontSize     = '13px';
            p.style.lineHeight   = '15px';
            p.style.margin       = 0;
            p.style.padding = 0;
            p.style.borderLeft   = '3px solid red';
            p.innerHTML          = args;
            this.el.appendChild(p);
        }
    }
};
window.C = C;
window.onerror = function(message, url, lineNumber) {
  C.log(message, url, lineNumber);
  // return false;
};
})();