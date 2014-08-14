'use strict';

var Macro = /** @type Macro */ require('./macro');
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

        /**
         * @private
         * @memberOf {Macroed}
         * @property
         * @type {Object}
         * */
        this.__macro = {};

        this.registerProc({
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
        var subj;
        var result = node.source;

        if ( 'macro' === node.type ) {
            subj = this.__macro[name];

            if ( subj instanceof Macro ) {
                subj = subj.generate(node.params);

                if ( !/%s/.test(subj) ) {

                    return subj;
                }

                if ( _.isArray(node.items) ) {
                    result = this.expandNodeSet(node.items);

                } else {
                    result = node.content;
                }

                return subj.replace(/%s/g, result);
            }

            //  unknown macro

            if ( _.isArray(node.items) && node.items.length ) {

                return result + this.parser.params.EOL +
                    this.expandNodeSet(node.items);
            }

            return result;
        }

        //  proc
        subj = this.__procs[name];

        if ( subj instanceof Processor ) {
            result = subj.process(node.content);

            return _.reduce(node.inline, this.__inline, result, this);
        }

        //  unknown proc
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
     * @param {Object} [members]
     *
     * @returns {Macroed}
     * */
    registerProc: function (members) {
        members = Object(members);
        this.__procs[members.name] = this.createComponent(Processor, members);

        return this;
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
    registerMacro: function (members) {
        members = Object(members);
        this.__macro[members.name] = this.createComponent(Macro, members);

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

        return result.replace(new RegExp(key, 'g'), this.expandNode(node));
    }

});

module.exports = Macroed;
