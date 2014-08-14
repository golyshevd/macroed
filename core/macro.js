'use strict';

var Component = /** @type Component */ require('./component');

var inherit = require('inherit');

/**
 * @class Macro
 * @extends Component
 * */
var Macro = inherit(Component, /** @lends Macro.prototype */ {

    /**
     * @abstract
     * @memberOf {Macro}
     * @method
     *
     * @param {Object} params
     *
     * @returns {String}
     * */
    generate: /*istanbul ignore next */ function (params) {
        /*eslint no-unused-vars: 0*/

        return '';
    }
});

module.exports = Macro;
