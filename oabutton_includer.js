javascript:(function(){
apikey='test';
api='https://dev.api.cottagelabs.com/service/oab/';
url='http://oabb.test.cottagelabs.com/';
js=['oab.js','oabutton_bookmarklet.js'];
css=['oabutton_bookmarklet.css'];
for (var j=0;j<js.length;j++){
_ms=document.createElement('SCRIPT');_ms.type='text/javascript';_ms.src=url+js[j];document.getElementsByTagName('head')[0].appendChild(_ms);
}
for (var c=0;c<css.length;c++){
_cs=document.createElement('link');_cs.rel='stylesheet';_cs.href=url+css[c];document.getElementsByTagName('head')[0].appendChild(_cs);
}
});