'use strict';

var Macroed = require('./core/macroed');

var marked = require('marked');
var macroed = new Macroed();

macroed.registerProc({
    name: 'default',
    params: {
        gfm: true,
        breaks: true,
        pedantic: false,
        sanitize: true,
        smartLists: true,
        smartypants: true
    },
    process: function (content) {

        return marked(content, this.params);
    }
});

macroed.Macroed = Macroed;

module.exports = macroed;
