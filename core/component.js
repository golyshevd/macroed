'use strict';

var inherit = require('inherit');

/**
 * @class Component
 * */
var Component = inherit(/** @lends Component.prototype */ {

    /**
     * @private
     * @memberOf {Component}
     * @param {Object} params
     *
     * @constructs
     * */
    __constructor: function (params) {

        /**
         * @public
         * @memberOf {Component}
         * @property
         * @type {Object}
         * */
        this.params = params;
    }

});

module.exports = Component;
