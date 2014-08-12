macroed [![Build Status](https://travis-ci.org/golyshevd/macroed.svg)](https://travis-ci.org/golyshevd/macroed)
=========

macroed is simple macros expand tool for nodejs

Usage
---------
```js
var Macroed = require('macroed');
var macroed = new Macroed();

//  just like inline macros
macroed.register('smile', function () {
  
    return ':)';
});

macroed.expand('Hello {{smile()}}'); // -> 'Hello :)'

//  block macros
macroed.register('greet', function () {

    return 'Hello, %s!';
});

macroed.expand('{{greet() {{golyshevd {smile()}}}}}'); // -> Hello, golyshevd :)!

//  macros supports params
macroed.register('params-demo', function (params) {
    assert.deepEqual(params, {a: '42', b: '146'});
});

macroed.expand('{{params-demo(a=42,b=146)}}');

//  macros can generate.... macros
macroed.register('widget', function () {
    
    return '{{greet(){golyshevd {{smile()}}}}}';
});

macroed.expand('{{widget()}}'); // -> Hello, golyshevd :)!

// macroed easy to use with other processors
var marked = require('marked');

macroed.register('wrapper', function (params) {
  
    return '<div id="' + params.id + '" class="my-wrapper">%s</div>';
});

var markdown = macroed.expand('{{wrapper(id=42)}{[Yandex](http://www.yandex.ru)}}');

marked(markdown); // <div id="42" class="my-wrapper"><a href="http://www.yandex.ru">Yandex</a></div>

```

License
------
[MIT](LICENSE)
