'use strict';

var Component = /** @class Component */ require('./component');

var inherit = require('inherit');

/**
 * @class Context
 * @extends Component
 * */
var Context = inherit(Component, /** @lends Context.prototype */ {

    /**
     * @public
     * @memberOf {Context}
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

module.exports = Context;
