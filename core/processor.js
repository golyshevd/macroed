'use strict';

var Component = /** @class Component */ require('./component');

var inherit = require('inherit');

/**
 * @class Processor
 * @extends Component
 * */
var Processor = inherit(Component, /** @lends Processor.prototype */ {

    /**
     * @public
     * @memberOf {Processor}
     * @method
     *
     * @param {String} [content]
     *
     * @returns {String}
     * */
    process: function (content) {

        return content;
    }

});

module.exports = Processor;
