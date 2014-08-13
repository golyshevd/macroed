/*global describe, it*/
'use strict';

var _ = require('lodash-node');
var assert = require('chai').assert;
//var util = require('util');

describe('Macroed', function () {
    /*eslint max-nested-callbacks: 0*/
    var Macroed = require('../core/macroed');
    var Processor = require('../core/processor');

    describe('Macroed.prototype.createProcessor', function () {

        it('Should be an instance of Processor', function () {
            var m = new Macroed();
            var p = m.createProcessor({
                name: 'test'
            });

            assert.instanceOf(p, Processor);
        });

        it('Should override Macroed params', function () {
            var m = new Macroed({
                a: 42,
                b: 777
            });

            var p = m.createProcessor({
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
                    type: 'inline',
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
                    type: 'proc',
                    name: 'proc',
                    params: {},
                    source: '||proc():',
                    content: 'a'
                },
                [
                    '||proc():',
                    'a'
                ]
            ],
            [
                {
                    type: 'proc',
                    name: 'proc',
                    inline: true,
                    params: {},
                    source: '{{proc():a}}'
                },
                [
                    '{{proc():a}}'
                ]
            ],
            [
                {
                    type: 'macro',
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
                    type: 'macro',
                    name: 'm',
                    params: {},
                    source: '{{m()}}',
                    inline: true
                },
                [
                    '{{m()}}'
                ]
            ],
            [
                {
                    type: 'inline',
                    name: 'default',
                    inline: {
                        0: {
                            type: 'macro',
                            inline: true,
                            name: 'm',
                            params: {},
                            source: '{{m()}}'
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
                    name: 'm',
                    params: {},
                    source: '||m()',
                    items: [
                        {
                            type: 'inline',
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
            m.setProcessor({
                name: 'm',
                process: function (params) {

                    return params.a;
                }
            });
            var s = m.expandNode({
                type: 'inline',
                name: 'default',
                source: 'a {{m(a=42)}} b',
                content: 'a 0 b',
                inline: {
                    0: {
                        type: 'macro',
                        name: 'm',
                        inline: true,
                        params: {
                            a: '42'
                        },
                        source: '{{m(a=42)}}'
                    }
                }
            });

            assert.strictEqual(s, 'a 42 b');
        });

        it('Should expand block macro', function () {
            var m = new Macroed();
            m.setProcessor({
                name: 'm',
                process: function (params) {

                    return params.x + '*(%s)';
                }
            });
            var s = m.expandNode({
                type: 'macro',
                name: 'm',
                source: '||m(x=42)',
                params: {
                    x: '42'
                },
                items: [
                    {
                        type: 'inline',
                        name: 'default',
                        source: 'a',
                        content: 'a',
                        inline: {}
                    }
                ]
            });

            assert.strictEqual(s, '42*(a)');
        });

        it('Should expand processor', function () {
            var m = new Macroed();
            m.setProcessor({
                name: 'json',
                process: function (params, content) {
                    content = JSON.parse(content);

                    return JSON.stringify(content, null, +params.indent);
                }
            });
            var s = m.expandNode({
                type: 'proc',
                name: 'json',
                source: '||json(indent=4):',
                params: {
                    indent: '4'
                },
                content: '{"a":42}'
            });

            assert.strictEqual(s, JSON.stringify({a: 42}, null, 4));
        });

    });

    describe('Macroed.prototype.expandString', function () {
        it('Should expand string', function () {
            var m = new Macroed();
            m.setProcessor({
                name: 'json',
                process: function (params, content) {
                    content = JSON.parse(content);

                    return JSON.stringify(content, null, +params.indent);
                }
            });
            var s = m.expandString([
                '||json(indent=4):',
                '   {"a": 42}'
            ].join(m.parser.params.EOL));

            assert.strictEqual(s, JSON.stringify({a: 42}, null, 4));
        });
    });
});
