'use strict';

var R_EMPTY = /^\s*$/;
var R_ESCAPED = /\\([\s\S])/g;
var R_TRIMMER = /^ */;

var R_BLOCK_MACRO = /^ *\|\|([\w-]+) *\(([^()]*)\)(?: *(:))? *$/;
var R_INLINE_MACRO = /{{([\w-]+) *\(([^()]*)\)(?: *(:)([^{}]*))?}}/g;

var R_PARAM = /^ *([a-z]\w*)(?: *= *(?:"((?:\\[\s\S]|[^"])*)"|([^" ]+)))? *$/i;
var S_EOL = require('os').EOL;

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
        var params;

        R_INLINE_MACRO.lastIndex = 0;

        /*eslint no-cond-assign: 0*/
        while ( m = R_INLINE_MACRO.exec(s) ) {
            i = m.index;

            if ( pos !== i ) {
                result.content += s.substring(pos, i);
            }

            pos = i + m[0].length;
            params = this.parseParams(m[2]);

            if ( _.isNull(params) ) {
                result.content += m[0];

                continue;
            }

            ph = this.__genPlaceholder();

            if ( m[3] ) {
                result.inline[ph] = {
                    type: 'proc',
                    source: m[0],
                    name: m[1],
                    params: params,
                    content: m[4]
                };

            } else {
                result.inline[ph] = {
                    type: 'macro',
                    source: m[0],
                    name: m[1],
                    params: params
                };
            }

            result.content += ph;
        }

        if ( pos !== s.length ) {
            result.content += s.substring(pos);
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
     * @returns {Array}
     * */
    parse: function (s) {
        var currIndent;
        var i;
        var inline = '';
        var items = [];
        var indent = 0;
        var l;
        var line;
        var lines = this.__splitByLines(s);
        var m;
        var prevIndent = 0;
        var proc = null;
        var params;
        var result = items;
        var self = this;
        var stack = [];

        function pushStack () {
            stack.push({
                //  current block indent
                indent: indent,
                //  current block items
                items: items,
                // parent block indent
                prevIndent: prevIndent
            });
        }

        function popStack () {
            items = stack.pop();
            indent = items.indent;
            prevIndent = items.prevIndent;
            items = items.items;
            proc = null;
        }

        function pushLines () {

            if ( '' !== inline ) {
                items.push(self.markInline(inline));
                inline = '';
            }
        }

        function closeBlock () {
            pushLines();
            popStack();
        }

        function openBlock() {
            pushLines();
            pushStack();
        }

        function addLine () {
            inline = self.__addLine(inline, line.substring(indent));
        }

        /* eslint no-labels: 0*/
        overLines: for ( i = 0, l = lines.length; i < l; i += 1 ) {
            line = lines[i];

            //  Like empty line. Should not close block
            if ( this.__isEmpty(line) ) {
                line = '';
                addLine();

                continue;
            }

            //  get current line indentation
            currIndent = line.match(R_TRIMMER)[0].length;

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
                    //    ||x()
                    // // ^ prevIndent
                    //          a
                    //      // ^ indent
                    //        bad indent
                    //    // ^ currIndent
                    //  we should close the block

                    closeBlock();
                    addLine();

                    //  this is eslint bug! what else var!??
                    /*eslint block-scoped-var: 0*/
                    continue overLines;
                }

                closeBlock();
            }

            if ( proc ) {
                line = line.substring(indent);

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
                addLine();

                continue;
            }

            params = this.parseParams(m[2]);

            //  if the params are bad, then it is like just line!
            if ( _.isNull(params) ) {
                addLine();

                continue;
            }

            //  block-macro
            openBlock();

            //  push node to ast
            if ( m[3] ) {
                proc = {
                    type: 'proc',
                    source: m[0].substring(currIndent),
                    name: m[1],
                    params: params,
                    content: ''
                };

                items.push(proc);
                items = [];

            } else {
                items.push({
                    type: 'macro',
                    source: m[0].substring(currIndent),
                    name: m[1],
                    params: params,
                    items: items = []
                });
            }

            prevIndent = currIndent;
            indent = -1;
        }

        pushLines();

        return result;
    },

    /**
     * @public
     * @memberOf {Parser}
     * @method
     *
     * @param {String} s
     *
     * @returns {Object|null} null as SyntaxError
     * */
    parseParams: function (s) {
        /*eslint complexity: 0*/
        var i;
        var l;
        var params;
        var param;
        var result = {};

        if ( this.__isEmpty(s) ) {

            return result;
        }

        params = this.splitParams(s);

        if ( _.isNull(params) ) {

            return null;
        }

        for ( i = 0, l = params.length; i < l; i += 1 ) {
            param = params[i].match(R_PARAM);

            if ( _.isNull(param) ) {

                return null;
            }

            if ( !param[2] ) {
                param[2] = param[3];
            }

            if ( param[2] ) {
                param[2] = this.__unescape(param[2]);
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
     * @returns {Array<String>|null} null like SyntaxError
     * */
    splitParams: function (s) {
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

            return null;
        }

        result.push(buf);

        return result;
    },

    /**
     * @private
     * @memberOf {Parser}
     * @method
     *
     * @param {String} content
     * @param {String} line
     * */
    __addLine: function (content, line) {

        if ( '' === content ) {

            return line;
        }

        return content + '\n' + line;
    },

    /**
     * @private
     * @memberOf {Parser}
     * @method
     *
     * @returns {String}
     * */
    __genPlaceholder: /* istanbul ignore next */ function () {

        return uniqueId();
    },

    /**
     * @private
     * @memberOf {Parser}
     * @method
     *
     * @param {String} s
     *
     * @returns {Boolean}
     * */
    __isEmpty: function (s) {

        return R_EMPTY.test(s);
    },

    /**
     * @private
     * @memberOf {Parser}
     * @method
     *
     * @param {String} s
     *
     * @returns {Array<String>}
     * */
    __splitByLines: function (s) {

        return s.split(S_EOL);
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
    __unescape: function (s) {

        return s.replace(R_ESCAPED, '$1');
    }

});

module.exports = Parser;
