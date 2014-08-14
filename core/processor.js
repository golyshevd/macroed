'use strict';

var inherit = require('inherit');

/**
 * @class Processor
 * */
var Processor = inherit(/** @lends Processor.prototype */ {

    /**
     * @private
     * @memberOf {Processor}
     * @method
     *
     * @constructs
     *
     * @param {Object} [params]
     * */
    __constructor: function (params) {

        /**
         * @public
         * @memberOf {Processor}
         * @property
         * @type {Object}
         * */
        this.params = params;
    },

    /**
     * @public
     * @memberOf {Processor}
     * @method
     *
     * @param {Object} params
     * @param {String} [content]
     *
     * @returns {String}
     * */
    process: function (params, content) {

        return content;
    }

});

module.exports = Processor;
