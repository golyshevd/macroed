'use strict';

var Parser = /** @type Parser */ require('./parser');
var Processor = /** @type Processor */ require('./processor');

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

        this.setProcessor({
            name: 'default'
        });
    },

    /**
     * @public
     * @memberOf {Macroed}
     * @method
     *
     * @param {Object} node
     * */
    expandNode: function (node) {
        /*eslint complexity: 0*/
        var name = node.name;
        var proc = this.__procs[name];
        var result = node.source;

        if ( 'inline' === node.type ) {
            //  TODO: what runtime params we should pass to default processor?
            result = proc.process({}, node.content);

            return _.reduce(node.inline, this.__inline, result, this);
        }

        if ( 'proc' === node.type ) {

            if ( proc instanceof Processor ) {

                return proc.process(node.params, node.content);
            }

            if ( node.inline ) {

                return result;
            }

            //  save proc content
            return result + this.parser.params.EOL + node.content;
        }

        //  macro
        if ( proc instanceof Processor ) {
            result = proc.process(node.params);

            if ( _.isArray(node.items) ) {

                return result.replace(/%s/g, this.expandNodeSet(node.items));
            }

            return result;
        }

        //  only block macros has items
        if ( _.isArray(node.items) && node.items.length ) {

            return result + this.parser.params.EOL +
                   this.expandNodeSet(node.items);

        }

        return result;
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
        var content = _.map(items, this.expandNode, this);

        content = content.join(this.parser.params.EOL);

        return content;
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
    expandString: function (s) {
        var items = this.parser.parse(s);

        return this.expandNodeSet(items);
    },

    /**
     * @public
     * @memberOf {Macroed}
     * @method
     *
     * @param {Object} [members]
     *
     * @returns {Processor}
     * */
    createProcessor: function (members) {
        var Proc = inherit(Processor, members);
        var params = Proc.prototype.params;

        delete Proc.prototype.params;

        params = _.extend({}, this.params, params);

        return new Proc(params);
    },

    /**
     * @public
     * @memberOf {Macroed}
     * @method
     *
     * @param {Object} [members]
     *
     * @returns {Macroed}
     * */
    setProcessor: function (members) {
        members = Object(members);
        this.__procs[members.name] = this.createProcessor(members);

        return this;
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

        return result.replace(key, this.expandNode(node));
    }

});

module.exports = Macroed;
