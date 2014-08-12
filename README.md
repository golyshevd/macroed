macroed [![Build Status](https://travis-ci.org/golyshevd/macroed.svg)](https://travis-ci.org/golyshevd/macroed)
=========

macroed is simple macros expand tool for nodejs

Usage
---------
```js
var Macroed = require('macroed');
var macroed = new Macroed();

macroed.register('smile', function () {
  
    return ':)';
});

macroed.expand('{{smile()}}'); // -> ':)'

macroed.register('wrapper', function () {

    return 'This is a %s!';
});

macroed.expand('{{wrapper() {\n{{smile()}}\n}}}'); // -> This is a :)!

macroed.register('params-demo', function (params) {
    assert.deepEqual(params, {a: '42', b: '146'});
});

macroed.expand('{{params-demo(a=42,b=146)}}');

//  macros can generate.... macros

macroed.register('widget', function () {
    
    return '{{wrapper(){\n{{smile()}}\n}}}';
});

macroed.expand('{{widget()}}'); // -> This is a :)!
```

License
------
[MIT](LICENSE)
