/*global describe, it*/
'use strict';

var _ = require('lodash-node');
var assert = require('chai').assert;

describe('Macroed', function () {
    /*eslint max-nested-callbacks: 0*/
    var Macroed = require('../core/macroed');
    var Component = require('../core/component');

    describe('Macroed.prototype.createComponent', function () {

        it('Should be an instance of Component', function () {
            var m = new Macroed();
            var p = m.createComponent(Component, {
                name: 'test'
            });

            assert.instanceOf(p, Component);
        });

        it('Should override Macroed params', function () {
            var m = new Macroed({
                a: 42,
                b: 777
            });

            var p = m.createComponent(Component, {
                name: 'test',
                params: {
                    a: 43
                }
            });

            assert.deepEqual(p.params, {
                a: 43,
                b: 777
            });
        });

    });

    describe('Macroed.prototype.expandNode', function () {
        var fixtures = [
            [
                {
                    type: 'context',
                    name: 'default',
                    inline: {},
                    content: 'a',
                    source: 'a'
                },
                [
                    'a'
                ]
            ],
            [
                {
                    type: 'context',
                    name: 'unknown',
                    inline: {},
                    content: 'a',
                    source: 'a'
                },
                [
                    'a'
                ]
            ],
            [
                {
                    type: 'macro',
                    context: 'default',
                    name: 'm',
                    params: {},
                    source: '||proc:m()',
                    items: [
                        {
                            type: 'context',
                            name: 'unknown',
                            inline: {},
                            content: 'a',
                            source: 'a'
                        }
                    ]
                },
                [
                    '||proc:m()',
                    'a'
                ]
            ],
            [
                {
                    type: 'macro',
                    context: 'default',
                    name: 'm',
                    params: {},
                    source: '{{m():a}}',
                    content: 'a'
                },
                [
                    '{{m():a}}'
                ]
            ],
            [
                {
                    type: 'macro',
                    context: 'default',
                    name: 'm',
                    params: {},
                    source: '||m()',
                    items: []
                },
                [
                    '||m()'
                ]
            ],
            [
                {
                    type: 'context',
                    name: 'default',
                    inline: {
                        0: {
                            type: 'macro',
                            context: 'default',
                            name: 'm',
                            params: {},
                            source: '{{m()}}',
                            content: ''
                        }
                    },
                    content: 'a 0 b',
                    source: 'a {{m()}} b'
                },
                [
                    'a {{m()}} b'
                ]
            ],
            [
                {
                    type: 'macro',
                    context: 'default',
                    name: 'm',
                    params: {},
                    source: '||m()',
                    items: [
                        {
                            type: 'context',
                            name: 'default',
                            inline: {},
                            content: 'a',
                            source: 'a'
                        }
                    ]
                },
                [
                    '||m()',
                    'a'
                ]
            ]
        ];

        _.forEach(fixtures, function (f) {
            var m = new Macroed();
            var node = JSON.stringify(f[0], null, 4);
            var text = f[1].join(m.parser.params.EOL);

            it('Should expand \n' + node + '\n to \n' + text, function () {
                assert.strictEqual(m.expandNode(f[0]), text);
            });
        });

        it('Should expand inline macro', function () {
            var m = new Macroed();

            m.registerMacro({
                name: 'm',
                generate: function (params) {

                    return params.a;
                }
            });

            m.registerMacro({
                name: 's',
                generate: function () {

                    return '(%s)';
                }
            });

            var s = m.expandNode({
                type: 'context',
                name: 'default',
                source: 'a {{m(a=42)}} b',
                content: 'a 0 b',
                inline: {
                    0: {
                        type: 'macro',
                        context: 'default',
                        name: 'm',
                        params: {
                            a: '42'
                        },
                        source: '{{m(a=42)}}',
                        content: ''
                    }
                }
            });

            assert.strictEqual(s, 'a 42 b');

            s = m.expandNode({
                type: 'context',
                name: 'default',
                source: 'a {{s():!}} b',
                content: 'a 0 b',
                inline: {
                    0: {
                        type: 'macro',
                        context: 'default',
                        name: 's',
                        params: {},
                        source: '{{s():!}}',
                        content: '!'
                    }
                }
            });

            assert.strictEqual(s, 'a (!) b');
        });

        it('Should expand block macro', function () {
            var m = new Macroed();
            m.registerMacro({
                name: 's',
                generate: function (params) {

                    return params.x + '*(%s)';
                }
            });
            var s = m.expandNode({
                type: 'macro',
                context: 'default',
                name: 's',
                source: '||s(x=42)',
                params: {
                    x: '42'
                },
                items: [
                    {
                        type: 'context',
                        name: 'default',
                        source: 'a',
                        content: 'a',
                        inline: {}
                    }
                ]
            });

            assert.strictEqual(s, '42*(a)');
        });

        it('Should use processor', function () {
            var m = new Macroed();
            m.registerContext({
                name: 'json',
                process: function (content) {
                    content = JSON.parse(content);

                    return JSON.stringify(content, null, 4);
                }
            });
            var s = m.expandNode({
                type: 'context',
                name: 'json',
                inline: {},
                source: '{"a":42}',
                content: '{"a":42}'
            });

            assert.strictEqual(s, JSON.stringify({a: 42}, null, 4));
        });

    });

    describe('Macroed.prototype.expandString', function () {
        it('Should expand string', function () {
            var m = new Macroed();
            m.registerContext({
                name: 'json',
                process: function (content) {
                    content = JSON.parse(content);

                    return JSON.stringify(content, null, 4);
                }
            });
            m.registerMacro({
                name: 'm',
                generate: function () {

                    return '%s';
                }
            });

            var s = m.expandString([
                '||json:m()',
                '   {"a": 42}'
            ].join(m.parser.params.EOL));

            assert.strictEqual(s, JSON.stringify({a: 42}, null, 4));
        });
    });
});
