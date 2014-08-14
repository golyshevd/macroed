macroed [![Build Status](https://travis-ci.org/golyshevd/macroed.svg)](https://travis-ci.org/golyshevd/macroed)
=========

macroed is a powerful and flexible macros expand tool for nodejs

Usage
---------
```js
var macroed = require('macroed');

//  just like inline macros
macroed.setProcessor({
    name: 'smile',
    process: function () {
      
        return ':)';
    }
});

macroed.expandString('Hello {{smile()}}'); // -> 'Hello :)'

//  block macros
macroed.setProcessor({
    name: 'wrapper',
    process: function (params) {
        
        return '<div class="wrapper wrapper_align_' + params.align + '">\s%</div>';
    }
});

var string = [
    '||wrapper(align=right)',
    '   I am at right!'
].join('\n');

macroed.expandString(string); // -> <div class="wrapper wrapper_align_right">I am at right!</div>

//  inline processor
macroed.setProcessor({
    name: 'bolder',
    process: function (params, content) {
        
        return '<b style="font-weight: ' + params.weight + '">' + content + '</b>';
    }
});

macroed.expandString('{{bolder(weight=700):This text is bolder}} than that');
//  <b style="font-weight: 700">This text is bolder</b> than that


// Aaand block processors
macroed.setProcessor({
    name: 'xslt',
    process: function (params, content) {
        
        return applyXslt(params.stylesheet, content);
    }
});

string = [
    '||xslt(stylesheet=index.xsl):',
    '   <xml>',
    '       <OMG/>',
    '   </xml>'
].join('\n');

macroed.expandString(string);   //  <result of xslt>

//  default processor
var marked = require('marked');

macroed.setProcessor({
    name: 'default',
    params: {
        smartypants: true
    },
    process: function (params, content) {
        
        return marked(this.params, content);
    }
});

macroed.expandString('##{{bolder(weight=bold):This}} is awesome!');
//  <h2 id="this-is-awesome"><b style="font-weight: bold">This</b> is awesome!</h2>

//  so poor?
string = [
    'Ok, lets write something!',
    '-------------------------',
    'First, {{accent(type=bold):media-slider}}!',
    '||media-viewer(effect=fade)'
    '   ![sea](/sea.png)',
    '   ||note()',
    '       ![cat](/cat.png)',
    '       it is my crazy fat cat!',
    '   ![car](/car.png)',
    '   {{youtube():yJOs7pgdf_g}}',
    '   ||diagram():',
    '       some->crazy->syntax',
    '       parse->it->how->you->want',
    '',
    'Is not it cool?',
    'Tired from markdown, lets switch to docbook',
    '||docbook():',
    '   <para>',
    '       Omg xml is so difficult',
    '   </para>'
].join('\n');

macroed.expandString(string); // -> Booo!

```

License
------
[MIT](LICENSE)
