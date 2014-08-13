'use strict';

var R_ESCAPED = /\\([\s\S])/g;

var R_BLOCK_MACRO = /^ *\|\|([\w-]+) *\(([^()]*)\)(?: *(:))? *$/;
var R_INLINE_MACRO = /{{([\w-]+) *\(([^()]*)\)(?: *(:)([^{}]*))?}}/g;

var R_LINE_BREAK = /\r|\n|\r\n/;
var R_PARAM = /^ *([a-z]\w*)(?: *= *(?:"((?:\\[\s\S]|[^"])*)"|([^" ]+)))? *$/i;

var _ = require('lodash-node');
var inherit = require('inherit');
var uniqueId = require('unique-id');

/**
 * @class Parser
 * */
var Parser = inherit(/** @lends Parser.prototype */ {

    /**
     * @private
     * @memberOf {Parser}
     * @method
     * @constructs
     *
     * @param {Object} params
     * */
    __constructor: function (params) {

        /**
         * @public
         * @memberOf {Parser}
         * @property
         * @type {Object}
         * */
        this.params = _.extend({}, this.params, params);
    },

    /**
     * @public
     * @memberOf {Parser}
     *
     * @method
     *
     * @returns {String}
     * */
    genPlaceholder: /* istanbul ignore next */ function () {

        return uniqueId();
    },

    /**
     * @public
     * @memberOf {Parser}
     * @method
     *
     * @param {String} s
     *
     * @returns {Array<String>}
     * */
    splitByLines: function (s) {

        return s.split(R_LINE_BREAK);
    },

    /**
     * @public
     * @memberOf {Parser}
     * @method
     *
     * @param {String} s
     *
     * @returns {Boolean}
     * */
    isEmpty: function (s) {

        return /^\s*$/.test(s);
    },

    /**
     * @public
     * @memberOf {Parser}
     * @method
     *
     * @param {String} s
     *
     * @returns {Array}
     * */
    parse: function (s) {
        var currIndent;
        var i;
        var inline = [];
        var items = [];
        var indent = 0;
        var l;
        var line;
        var lines = this.splitByLines(s);
        var m;
        var prevIndent = 0;
        var proc = null;
        var result = items;
        var stack = [];

        for ( i = 0, l = lines.length; i < l; i += 1 ) {
            line = lines[i];

            //  Like empty line. Should not close block
            if ( this.isEmpty(line) ) {
                inline.push('');
                //items.push(Parser.markInline(''));

                continue;
            }

            //  get current line indentation
            currIndent = line.match(/^ */)[0].length;

            //  set initial indentation
            if ( -1 === indent ) {

                if ( prevIndent < currIndent ) {
                    //current indentation is valid for current block
                    indent = currIndent;

                } else {
                    //current indentation is less than
                    //minimal allowed for this block
                    //hack indent to make next expression truey
                    indent = prevIndent + 1;
                }
            }

            while ( currIndent < indent ) {

                if ( currIndent > prevIndent ) {
                    //    this is invalid!

                    //    ||x()
                    //          a
                    //        bad indent

                    //  NOTE: Should we degrade?
                    throw new SyntaxError(s);
                }

                if ( 0 < _.size(inline) ) {
                    items.push(this.markInline(inline.join('\n')));
                    inline = [];
                }

                items = stack.pop();
                indent = items.indent;
                prevIndent = items.prevIndent;
                items = items.items;
                proc = null;
            }

            if ( proc ) {
                line = line.substr(indent);

                if ( '' === proc.content ) {
                    proc.content = line;

                } else {
                    proc.content += '\n' + line;
                }

                continue;
            }

            //  try to recognize block
            m = line.match(R_BLOCK_MACRO);

            //  no block recognized, just line
            if ( _.isNull(m) ) {
                //  trim this line left according to initial indent
                line = line.substr(indent);
                //  add line to block
                inline.push(line);
                //items.push(Parser.markInline(line));

                continue;
            }

            if ( 0 < _.size(inline) ) {
                items.push(this.markInline(inline.join('\n')));
                inline = [];
            }

            //  block-macro
            //  push state to stack
            stack.push({
                //  current block indent
                indent: indent,
                //  current block items
                items: items,

                prevIndent: prevIndent
            });

            //  push node to ast
            if ( m[3] ) {
                proc = {
                    type: 'proc',
                    source: m[0].substring(currIndent),
                    name: m[1],
                    params: this.parseParams(m[2]),
                    content: ''
                };

                items.push(proc);
                items = [];

            } else {
                items.push({
                    type: 'macro',
                    source: m[0].substring(currIndent),
                    name: m[1],
                    params: this.parseParams(m[2]),
                    items: items = []
                });
            }

            prevIndent = currIndent;
            indent = -1;
        }

        if ( 0 < _.size(inline) ) {
            items.push(this.markInline(inline.join('\n')));
        }

        return result;
    },

    /**
     * @public
     * @memberOf {Parser}
     *
     * @param {String} s
     *
     * @returns {Object}
     * */
    markInline: function (s) {
        var i;
        var pos = 0;
        var m;
        var ph;
        var result = {
            name: 'default',
            type: 'inline',
            source: s,
            content: '',
            inline: {}
        };

        R_INLINE_MACRO.lastIndex = 0;

        /*eslint no-cond-assign: 0*/
        while ( m = R_INLINE_MACRO.exec(s) ) {
            i = m.index;

            if ( pos !== i ) {
                result.content += s.substring(pos, i);
            }

            pos = i + m[0].length;
            ph = this.genPlaceholder();

            if ( m[3] ) {
                result.inline[ph] = {
                    type: 'proc',
                    source: m[0],
                    name: m[1],
                    params: this.parseParams(m[2]),
                    content: m[4]
                };

            } else {
                result.inline[ph] = {
                    type: 'macro',
                    source: m[0],
                    name: m[1],
                    params: this.parseParams(m[2])
                };
            }

            result.content += ph;
        }

        if ( pos !== s.length ) {
            result.content += s.substr(pos);
        }

        return result;
    },

    /**
     * @public
     * @memberOf {Parser}
     * @method
     *
     * @param {String} s
     *
     * @returns {String}
     * */
    unescape: function (s) {

        return s.replace(R_ESCAPED, '$1');
    },

    /**
     * @public
     * @memberOf {Parser}
     * @method
     *
     * @param {String} s
     *
     * @returns {Object}
     * */
    parseParams: function (s) {
        /*eslint complexity: 0*/
        var i;
        var l;
        var params;
        var param;
        var result = {};

        if ( this.isEmpty(s) ) {

            return result;
        }

        params = this.splitByComma(s);

        for ( i = 0, l = params.length; i < l; i += 1 ) {
            param = params[i].match(R_PARAM);

            if ( _.isNull(param) ) {

                throw new SyntaxError(s);
            }

            if ( !param[2] ) {
                param[2] = param[3];
            }

            if ( param[2] ) {
                param[2] = this.unescape(param[2]);
            }

            if ( _.has(result, param[1]) ) {

                if ( _.isArray(result[param[1]]) ) {
                    result[param[1]].push(param[2]);

                    continue;
                }

                result[param[1]] = [result[param[1]], param[2]];

                continue;
            }

            result[param[1]] = param[2];
        }

        return result;
    },

    /**
     * @public
     * @memberOf {Parser}
     * @method
     *
     * @param {String} s
     *
     * @returns {Array<String>}
     * */
    splitByComma: function (s) {
        /*eslint complexity: 0*/
        var buf = '';
        var c;
        var i;
        var l;
        var result = [];
        var stQuot = false;
        var stEsc = false;

        for ( i = 0, l = s.length; i < l; i += 1 ) {
            c = s.charAt(i);

            //  escape
            if ( '\\' === c ) {
                buf += c;
                stEsc = !stEsc;

                continue;
            }

            if ( stEsc ) {
                buf += c;
                stEsc = false;

                continue;
            }

            //  quot
            if ( '"' === c ) {
                buf += c;
                stQuot = !stQuot;

                continue;
            }

            //  comma
            if ( ',' === c ) {

                //  quote
                if ( stQuot ) {
                    buf += c;

                    continue;
                }

                result.push(buf);
                buf = '';

                continue;
            }

            buf += c;
        }

        if ( stEsc + stQuot ) {

            throw new SyntaxError(s);
        }

        result.push(buf);

        return result;
    }

});

module.exports = Parser;
