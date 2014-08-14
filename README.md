macroed [![Build Status](https://travis-ci.org/golyshevd/macroed.svg)](https://travis-ci.org/golyshevd/macroed)
=========

macroed is a powerful and flexible macros expand tool for nodejs

Usage
---------
```js
var Macroed = require('macroed').Macroed;
var macroed = new Macroed();

//  just like inline macros
macroed.registerMacro({
    name: 'smile',
    generate: function () {
      
        return ':)';
    }
});

macroed.expandString('Hello {{smile()}}'); // -> 'Hello :)'

macroed.registerMacro({
    name: 'bolder',
    generate: function (params) {
        
        return '<b style="font-weight: ' + params.weight + '">%s</b>';
    }
});

macroed.expandString('{{bolder(weight=700):This text is bolder}} than that');
//  <b style="font-weight: 700">This text is bolder</b> than that

//  block macros
macroed.registerMacro({
    name: 'wrapper',
    generate: function (params) {
        
        return '<div class="wrapper wrapper_align_' + params.align + '">%s</div>';
    }
});

var string = [
    '||wrapper(align=right)',
    '   I am at right!'
].join('\n');

macroed.expandString(string); // -> <div class="wrapper wrapper_align_right">I am at right!</div>

//  support processors
macroed.registerProc({
    name: 'docbook',
    params: {
        stylesheet: './xsl/common/docbook.xsl'
    },
    process: function (content) {
        
        return applyXslt(this.params.stylesheet, content);
    }
});

macroed.registerMacro({
    name: 'article',
    generate: function (params) {
        
        return '<article class="article article_theme_' + params.theme + '">%s</article>';
    }
});

string = [
    '||docbook:article(theme=docbook)',
    '   <xml>',
    '       <OMG/>',
    '   </xml>'
].join('\n');

macroed.expandString(string);   
//  <article class="article article_theme_docbook">
//      <% result of xslt %></article>
//  </article>

//  default processor
var marked = require('marked');

macroed.registerProc({
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

//  Note: macroed module provides an instance of Macroed that supports markdown by default (marked), 
//  but feel free to change it no another text based processor

//  supports markdown
var macroed = require('macroed');

//  so poor?
string = [
    'Ok, lets write something!',
    '-------------------------',
    'First, {{accent(type=red):media-slider}}!',
    '||media-viewer(effect=fade)'
    '   ![sea](/sea.png)',
    '   ||note()',
    '       ![cat](/cat.png)',
    '       it is my crazy fat cat!',
    '   ![car](/car.png)',
    '   {{youtube():yJOs7pgdf_g}}',
    '   ||diagram:diagram-wrapper(id=42)',
    '       some->crazy->syntax',
    '       parse->it->how->you->want',
    '       with->diagram->processor',
    '',
    'Is not it cool?',
    'Tired from markdown, lets switch to docbook',
    '||docbook:article(theme=nyan)',
    '   <para>',
    '       Omg xml is so difficult!',
    '   </para>'
].join('\n');

macroed.expandString(string); // -> Booo!

```

License
------
[MIT](LICENSE)
