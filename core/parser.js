'use strict';

var R_EMPTY = /^\s*$/;
var R_ESCAPED = /\\([\s\S])/g;
var R_TRIMMER = /^ */;

//  ||proc:macro()
//      subject
//  ||macro()
//      subject
//                       1              2           3
var R_BLOCK_MACRO = /^ *\|\|(?:([\w-]+) *: *)?([\w-]+) *\(([^()]*)\) *$/;

//  {{macro()}}
//  {{macro():content}}
var R_INLINE_MACRO = /{{([\w-]+) *\(([^()]*)\)(?: *:([^{}]*))?}}/g;

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
        this.params = _.extend({
            EOL: require('os').EOL
        }, this.params, params);
    },

    /**
     * @public
     * @memberOf {Parser}
     * @method
     *
     * @param {String} source
     *
     * @returns {Object}
     * */
    markOut: function (source) {
        var inline = {};
        var self = this;

        function replacer (source, name, params, content) {
            var holder;

            params = self.parseParams(params);

            if ( _.isNull(params) ) {

                return source;
            }

            holder = self._genPlaceholder();

            inline[holder] = {
                source: source,
                name: name,
                params: params,
                content: content || '',
                type: 'macro'
            };

            return holder;
        }

        return {
            source: source,
            content: source.replace(R_INLINE_MACRO, replacer),
            inline: inline
        };
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
        var proc = 'default';
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
                //  parent block indent
                prevIndent: prevIndent,
                //  current processor
                proc: proc
            });
        }

        function popStack () {
            items = stack.pop();

            indent = items.indent;
            prevIndent = items.prevIndent;
            proc = items.proc;
            items = items.items;
        }

        function pushLines () {

            if ( '' === inline ) {

                return;
            }

            inline = self.markOut(inline);

            items.push(_.extend({
                type: 'proc',
                name: proc
            }, inline));

            inline = '';
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

            //  try to recognize block
            m = line.match(R_BLOCK_MACRO);

            //  no block recognized, just line
            if ( _.isNull(m) ) {
                addLine();

                continue;
            }

            //  ||(proc:)?macro()
            params = this.parseParams(m[3]);

            if ( _.isNull(params) ) {
                addLine();

                continue;
            }

            openBlock();

            if ( m[1] ) {
                proc = m[1];
            }

            items.push({
                type: 'macro',
                source: m[0].substring(currIndent),
                name: m[2],
                params: params,
                items: items = []
            });

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
     * @protected
     * @memberOf {Parser}
     * @method
     *
     * @returns {String}
     * */
    _genPlaceholder: function () {

        return uniqueId();
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

        return content + this.params.EOL + line;
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

        return s.split(this.params.EOL);
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
