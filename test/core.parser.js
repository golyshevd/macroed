/*global describe, it*/
'use strict';

var _ = require('lodash-node');
var assert = require('chai').assert;
//var util = require('util');

describe.only('Parser', function () {

    var Parser = require('../core/parser');

    /*eslint max-nested-callbacks: 0*/
    describe('Parser.splitByComma', function () {

        var fixtures = [
            ['a', ['a']],
            ['a,b', ['a', 'b']],
            ['a,b,"c"', ['a', 'b', '"c"']],
            ['a,"b,c"', ['a', '"b,c"']],
            ['a,"\\",,,"', ['a', '"\\",,,"']],
            ['a\\,b', ['a\\,b']],
            ['a\\\\,b', ['a\\\\', 'b']],
            ['a\\",b', ['a\\"', 'b']]
        ];

        var errors = [
            'a,"asd',
            'a\\'
        ];

        _.forEach(fixtures, function (f) {
            it('Should split "' + f[0] + '" onto ' + JSON.stringify(f[1]),
                function () {
                    assert.deepEqual(Parser.splitByComma(f[0]), f[1]);
                });
        });

        _.forEach(errors, function (f) {
            it('Should throw a SyntaxError on "' + f + '"', function () {
                assert.throws(function () {
                    Parser.splitByComma(f);
                }, SyntaxError);
            });
        });
    });

    describe('Parser.parseParams', function () {

        var fixtures = [
            ['a', {a: void 0}],
            ['a=5', {a: '5'}],
            [' a = 5 ', {a: '5'}],
            ['a="5"', {a: '5'}],
            [' a = "5" ', {a: '5'}],
            [' a = "\\5" ', {a: '5'}],
            ['a=5 , a=6, a=7', {a: ['5', '6', '7']}]
        ];

        var errors = [
            '1=5',
            'a=5 5',
            'a=5,'
        ];

        _.forEach(fixtures, function (f) {
            it('Should parse "' + f[0] + '" into ' + JSON.stringify(f[1]),
                function () {
                    assert.deepEqual(Parser.parseParams(f[0]), f[1]);
                });
        });

        _.forEach(errors, function (f) {
            it('Should throw SyntaxError on "' + f + '"', function () {
                assert.throws(function () {
                    Parser.parseParams(f);
                }, SyntaxError);
            });
        });
    });

    describe('Parser.createAst', function () {

        var fixtures = [
            [
                [
                    'hello'
                ],
                [
                    {
                        type: 'inline',
                        name: 'default',
                        source: 'hello',
                        inline: {},
                        content: 'hello'
                    }
                ]
            ],
            [
                [
                    'hello',
                    'world!'
                ],
                [
                    {
                        type: 'inline',
                        name: 'default',
                        source: [
                            'hello',
                            'world!'
                        ].join('\n'),
                        inline: {},
                        content: [
                            'hello',
                            'world!'
                        ].join('\n')
                    }
                ]
            ],
            [
                [
                    'a',
                    '\t   ',
                    'b'
                ],
                [
                    {
                        type: 'inline',
                        name: 'default',
                        source: [
                            'a',
                            '',
                            'b'
                        ].join('\n'),
                        inline: {},
                        content: [
                            'a',
                            '',
                            'b'
                        ].join('\n')
                    }
                ]
            ],
            [
                [
                    'x',
                    '   ||m()',
                    '       test'
                ],
                [
                    {
                        type: 'inline',
                        name: 'default',
                        source: 'x',
                        inline: {},
                        content: 'x'
                    },
                    {
                        type: 'macro',
                        source: '||m()',
                        name: 'm',
                        params: {},

                        items: [
                            {
                                type: 'inline',
                                name: 'default',
                                source: 'test',
                                inline: {},
                                content: 'test'
                            }
                        ]
                    }
                ]
            ],
            [
                [
                    'x',
                    '   ||m()',
                    '       test',
                    '   xxx'
                ],
                [
                    {
                        type: 'inline',
                        name: 'default',
                        source: 'x',
                        inline: {},
                        content: 'x'
                    },
                    {
                        type: 'macro',
                        source: '||m()',
                        name: 'm',
                        params: {},

                        items: [
                            {
                                type: 'inline',
                                name: 'default',
                                source: 'test',
                                inline:{},
                                content: 'test'
                            }
                        ]
                    },
                    {
                        type: 'inline',
                        name: 'default',
                        source: '   xxx',
                        inline:{},
                        content: '   xxx'
                    }
                ]
            ],

            [
                [
                    'x',
                    '   ||m()',
                    '       test',
                    '   xxx',
                    '   xxx'
                ],
                [
                    {
                        type: 'inline',
                        name: 'default',
                        source: 'x',
                        inline:{},
                        content: 'x'
                    },
                    {
                        type: 'macro',
                        source: '||m()',
                        name: 'm',
                        params: {},

                        items: [
                            {
                                type: 'inline',
                                name: 'default',
                                source: 'test',
                                inline:{},
                                content: 'test'
                            }
                        ]
                    },
                    {
                        type: 'inline',
                        name: 'default',
                        source: [
                            '   xxx',
                            '   xxx'
                        ].join('\n'),
                        inline:{},
                        content: [
                            '   xxx',
                            '   xxx'
                        ].join('\n')
                    }
                ]
            ],
            [
                [
                    '||m()',
                    '   test',
                    '       xxx',
                    '   xxx'
                ],
                [
                    {
                        type: 'macro',
                        source: '||m()',
                        name: 'm',
                        params: {},

                        items: [
                            {
                                type: 'inline',
                                name: 'default',
                                source: [
                                    'test',
                                    '    xxx',
                                    'xxx'
                                ].join('\n'),
                                inline:{},
                                content: [
                                    'test',
                                    '    xxx',
                                    'xxx'
                                ].join('\n')
                            }
                        ]
                    }
                ]
            ],
            [
                [
                    '||m()',
                    '   ||x()',
                    '       42',
                    '   777'
                ],
                [
                    {
                        type: 'macro',
                        source: '||m()',
                        name: 'm',
                        params: {},

                        items: [
                            {
                                type: 'macro',
                                source: '||x()',
                                name: 'x',
                                params: {},

                                items: [
                                    {
                                        type: 'inline',
                                        name: 'default',
                                        source: '42',
                                        inline:{},
                                        content: '42'
                                    }
                                ]
                            },
                            {
                                type: 'inline',
                                name: 'default',
                                source: '777',
                                inline:{},
                                content: '777'
                            }
                        ]
                    }
                ]
            ],
            [
                [
                    '||a()',
                    '   ||b()',
                    '       ||c()',
                    '   a'
                ],
                [
                    {
                        type: 'macro',
                        name: 'a',
                        source: '||a()',
                        params: {},
                        items: [
                            {
                                type: 'macro',
                                source: '||b()',
                                name: 'b',
                                params: {},
                                items: [
                                    {
                                        type: 'macro',
                                        source: '||c()',
                                        name: 'c',
                                        params: {},
                                        items: []
                                    }
                                ]
                            },
                            {
                                type: 'inline',
                                name: 'default',
                                source: 'a',
                                inline:{},
                                content: 'a'
                            }
                        ]
                    }
                ]
            ],
            //  processors
            [
                [
                    '||m():'
                ],
                [
                    {
                        type: 'proc',
                        source: '||m():',
                        name: 'm',
                        params: {},
                        content: ''
                    }
                ]
            ],
            [
                [
                    '||m(a=5):',
                    ''
                ],
                [
                    {
                        type: 'proc',
                        name: 'm',
                        source: '||m(a=5):',
                        params: {
                            a: '5'
                        },
                        content: ''
                    }
                ]
            ],
            [
                [
                    '||x():',
                    '   ||m()',
                    '       ||m()'
                ],
                [
                    {
                        type: 'proc',
                        name: 'x',
                        source: '||x():',
                        params: {},
                        content: [
                            '||m()',
                            '    ||m()'
                        ].join('\n')
                    }
                ]
            ]
        ];

        var errors = [
            [
                '||m()',
                '   test',
                '  bad indent'
            ],
            [
                '||m()',
                '   ||x()',
                '       text',
                '      bad indent'
            ]
        ];

        _.forEach(fixtures, function (f) {
            it('Should create expected ast from \n' + f[0].join('\n'),
                function () {
                    var actual = Parser.createAst(f[0].join('\n'));

                    assert.deepEqual(actual, f[1]);
                });
        });

        _.forEach(errors, function (f) {
            it('Should throw SyntaxError while parsing\n' + f.join('\n'),
                function () {
                    assert.throws(function () {
                        Parser.createAst(f.join('\n'));
                    }, SyntaxError);
                });
        });
    });

    describe('Parser.markInline', function () {

        var fixtures = [
            [
                '',
                {
                    type: 'inline',
                    name: 'default',
                    source: '',
                    content: '',
                    inline: {}
                }
            ],
            [
                'asd',
                {
                    type: 'inline',
                    name: 'default',
                    source: 'asd',
                    content: 'asd',
                    inline: {}
                }
            ],
            [
                '{{pic()}}',
                {
                    type: 'inline',
                    name: 'default',
                    source: '{{pic()}}',
                    content: '0',
                    inline: {
                        0: {
                            type: 'macro',
                            source: '{{pic()}}',
                            params: {},
                            name: 'pic'
                        }
                    }
                }
            ],
            [
                'a{{pic()}}b',
                {
                    type: 'inline',
                    name: 'default',
                    source: 'a{{pic()}}b',
                    content: 'a0b',
                    inline: {
                        0: {
                            type: 'macro',
                            source: '{{pic()}}',
                            params: {},
                            name: 'pic'
                        }
                    }
                }
            ],
            [
                'a{{pic()}}b{{pic()}}',
                {
                    type: 'inline',
                    name: 'default',
                    content: 'a0b1',
                    source: 'a{{pic()}}b{{pic()}}',
                    inline: {
                        0: {
                            type: 'macro',
                            source: '{{pic()}}',
                            params: {},
                            name: 'pic'
                        },
                        1: {
                            type: 'macro',
                            source: '{{pic()}}',
                            params: {},
                            name: 'pic'
                        }
                    }
                }
            ],
            [
                '{{pic()}}{{pic()}}',
                {
                    type: 'inline',
                    name: 'default',
                    source: '{{pic()}}{{pic()}}',
                    content: '01',
                    inline: {
                        0: {
                            type: 'macro',
                            source: '{{pic()}}',
                            params: {},
                            name: 'pic'
                        },
                        1: {
                            type: 'macro',
                            source: '{{pic()}}',
                            params: {},
                            name: 'pic'
                        }
                    }
                }
            ],
            [
                'inline {{proc(theme=bold): content}}',
                {
                    type: 'inline',
                    name: 'default',
                    source: 'inline {{proc(theme=bold): content}}',
                    content: 'inline 0',
                    inline: {
                        0: {
                            type: 'proc',
                            source: '{{proc(theme=bold): content}}',
                            params: {
                                theme: 'bold'
                            },
                            name: 'proc',
                            content: ' content'
                        }
                    }
                }
            ]
        ];

        _.forEach(fixtures, function (f) {
            it('Should parse "' + f[0] + '" to expected ast', function () {
                var i = -1;
                var genPlaceholder = Parser.genPlaceholder;

                Parser.genPlaceholder = function () {
                    i += 1;

                    return i;
                };

                var actual = Parser.markInline(f[0]);

                Parser.genPlaceholder = genPlaceholder;

                assert.deepEqual(actual, f[1]);
            });
        });
    });

    it('Should parse text', function () {
        var parser = new Parser({}, '');

        assert.deepEqual(parser.items, [
            {
                type: 'inline',
                name: 'default',
                source: '',
                content: '',
                inline: {}
            }
        ]);

        assert.isObject(parser.params);
        assert.strictEqual(parser.type, 'ast');
    });

});
