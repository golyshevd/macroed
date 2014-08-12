'use strict';

var R_MACRO = /\{\{([\w-]+)(?:\s*\(([^()]*)\))?(?:\s*\{([\s\S]*)\}\s*)?\}\}/g;

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
        var self = this;

        if ( _.isUndefined(s) || _.isNull(s) ) {

            return '';
        }

        s = String(s);

        return s.replace(R_MACRO, function ($0, name, params, contents) {
            var macro = self.__macros[name];
            var wrapper;

            contents = self.expand(contents);

            if ( _.isFunction(macro) ) {
                params = self._parseMacroParams(params);
                wrapper = self.__callMacro(macro, params);

                contents = wrapper.replace(/%s/g, contents);
            }

            return contents;
        });
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
    }

});

module.exports = Macroed;
