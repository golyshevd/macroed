'use strict';

var R_MACRO = new RegExp('\\{\\{' +
    // macro name
'([\\w-]+)' +
    // possible call params
'((?:\\s*\\(([^()]*)\\))?)' +
    // possible macro body
'(?:(\\s*\\{)([\\s\\S]*)(\\}\\s*))?' +
'\\}\\}', 'g');

var _ = require('lodash-node');
var inherit = require('inherit');
var querystring = require('querystring');

/**
 * @class Macroed
 * */
var Macroed = inherit(/** @lends Macroed.prototype */ {

    /**
     * @private
     * @memberOf {Macroed}
     * @method
     *
     * @constructs
     *
     * @param {Object} [params]
     * */
    __constructor: function (params) {

        /**
         * @public
         * @memberOf {Macroed}
         * @property
         * @type {Object}
         * */
        this.params = _.extend({}, this.params, params);

        /**
         * @private
         * @memberOf {Macroed}
         * @property
         * @type {Object}
         * */
        this.__macros = {};

        /**
         * @private
         * @memberOf {Macroed}
         * @property
         * @type {Function}
         * */
        this.__replacer = _.bind(this.__expander, this);
    },

    /**
     * @public
     * @memberOf {Macroed}
     * @method
     *
     * @param {String} s
     *
     * @returns {String}
     * */
    expand: function (s) {

        if ( _.isUndefined(s) || _.isNull(s) ) {

            return '';
        }

        s = String(s);

        return s.replace(R_MACRO, this.__replacer);
    },

    /**
     * @public
     * @memberOf {Macroed}
     * @method
     *
     * @param {String} name
     * @param {Function} func
     *
     * @returns {Macroed}
     * */
    register: function (name, func) {
        this.__macros[name] = func;

        return this;
    },

    /**
     * @protected
     * @memberOf {Macroed}
     * @method
     *
     * @param {String} params
     *
     * @returns {Object} params
     * */
    _parseMacroParams: function (params) {

        return querystring.parse(params, ',', '=');
    },

    /**
     * @private
     * @memberOf {Macroed}
     * @method
     *
     * @param {Function} macro
     * @param {*} params
     *
     * @returns {String}
     * */
    __callMacro: function (macro, params) {
        var result = '';
        var wrapper = macro.call(this, params);

        //  expand generated macros
        do {
            result = wrapper;
            wrapper = this.expand(result);

        } while ( result !== wrapper );

        return wrapper;
    },

    /**
     * @private
     * @memberOf {Macroed}
     * @method
     *
     * @returns {String}
     * */
    __expander: function ($0, name, $call, params, $bc, contents, $ac) {
        /*eslint max-params: 0*/
        var macro = this.__macros[name];
        var wrapper;

        contents = this.expand(contents);

        if ( _.isFunction(macro) ) {
            params = this._parseMacroParams(params);
            wrapper = this.__callMacro(macro, params);

            return wrapper.replace(/%s/g, contents);
        }

        //  macro is not supported
        //  it should save macro syntax
        return '{{' + name + $call + ($bc || '') +
        contents + ($ac || '') + '}}';
    }

});

module.exports = Macroed;
