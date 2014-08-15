'use strict';

var Macro = /** @type Macro */ require('./macro');
var Parser = /** @type Parser */ require('./parser');
var Context = /** @type Context */ require('./context');

var _ = require('lodash-node');
var inherit = require('inherit');

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
         * @public
         * @memberOf {Macroed}
         * @property
         * @type {Parser}
         * */
        this.parser = new Parser(this.params.parser);

        /**
         * @private
         * @memberOf {Macroed}
         * @property
         * @type {Object}
         * */
        this.__procs = {};

        /**
         * @private
         * @memberOf {Macroed}
         * @property
         * @type {Object}
         * */
        this.__macro = {};

        this.registerContext({
            name: 'default'
        });
    },

    /**
     * @public
     * @memberOf {Macroed}
     * @method
     *
     * @param {Function} Parent
     * @param {Object} members
     *
     * @returns {Parent}
     * */
    createComponent: function (Parent, members) {
        var Component = inherit(Parent, members);
        var params = Component.prototype.params;

        delete Component.prototype.params;

        params = _.extend({}, this.params, params);

        return new Component(params);
    },

    /**
     * @public
     * @memberOf {Macroed}
     * @method
     *
     * @param {Object} node
     *
     * @returns {String}
     * */
    expandNode: function (node) {

        if ( 'macro' === node.type ) {

            return this.__expandMacro(node);
        }

        return this.__applyProc(node);
    },

    /**
     * @public
     * @memberOf {Macroed}
     * @method
     *
     * @param {Array} items
     *
     * @returns {String}
     * */
    expandNodeSet: function (items) {
        var result = _.map(items, this.expandNode, this);

        result = result.join(this.parser.params.EOL);

        return result;
    },

    /**
     * @public
     * @memberOf {Macroed}
     * @method
     *
     * @param {String} source
     *
     * @returns {String}
     * */
    expandString: function (source) {
        var items = this.parser.parse(source);

        return this.expandNodeSet(items);
    },

    /**
     * @public
     * @memberOf {Macroed}
     * @method
     *
     * @param {Object} members
     *
     * @returns {Macroed}
     * */
    registerMacro: function (members) {
        this.__macro[members.name] = this.createComponent(Macro, members);

        return this;
    },

    /**
     * @public
     * @memberOf {Macroed}
     * @method
     *
     * @param {Object} members
     *
     * @returns {Macroed}
     * */
    registerContext: function (members) {
        this.__procs[members.name] = this.
            createComponent(Context, members);

        return this;
    },

    /**
     * @private
     * @memberOf {Macroed}
     * @method
     *
     * @param {Object} node
     *
     * @returns {String}
     * */
    __applyProc: function (node) {
        var result = node.source;
        var proc = this.__procs[node.name];

        if ( proc instanceof Context ) {
            result = proc.process(node.content);

            return _.reduce(node.inline, this.__inline, result, this);
        }

        //  unknown proc
        return result;
    },

    /**
     * @private
     * @memberOf {Macroed}
     * @method
     *
     * @param {Object} node
     *
     * @returns {String}
     * */
    __expandMacro: function (node) {
        var result = node.source;
        var macro;

        if ( !_.has(this.__macro, node.name) ) {
            //  unknown macro
            if ( _.isArray(node.items) && node.items.length ) {

                return result + this.parser.params.EOL +
                       this.expandNodeSet(node.items);
            }

            return result;
        }

        macro = this.__macro[node.name].generate(node.params);

        if ( !/%s/.test(macro) ) {

            return macro;
        }

        if ( _.isArray(node.items) ) {
            result = this.expandNodeSet(node.items);

        } else {
            result = node.content;
        }

        return macro.replace(/%s/g, result);
    },

    /**
     * @private
     * @memberOf {Macroed}
     * @method
     *
     * @param {String} result
     * @param {Object} node
     * @param {String} key
     *
     * @returns {String}
     * */
    __inline: function (result, node, key) {

        return result.replace(new RegExp(key, 'g'), this.expandNode(node));
    }

});

module.exports = Macroed;
