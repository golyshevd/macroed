/*global describe, it*/
'use strict';

var _ = require('lodash-node');
var assert = require('chai').assert;
var inherit = require('inherit');

describe('Parser', function () {
    var Parser = require('../core/parser');
    var EOL = new Parser().params.EOL;

    /*eslint max-nested-callbacks: 0*/
    describe('Parser.prototype.splitParams', function () {

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
                    var p = new Parser();
                    assert.deepEqual(p.splitParams(f[0]), f[1]);
                });
        });

        _.forEach(errors, function (f) {
            it('Should return null on "' + f + '"', function () {
                var p = new Parser(f);
                assert.isNull(p.splitParams(f));
            });
        });
    });

    describe('Parser.prototype.parseParams', function () {

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
            'a="',
            '1=5',
            'a=5 5',
            'a=5,'
        ];

        _.forEach(fixtures, function (f) {
            it('Should parse "' + f[0] + '" into ' + JSON.stringify(f[1]),
                function () {
                    var p = new Parser();
                    assert.deepEqual(p.parseParams(f[0]), f[1]);
                });
        });

        _.forEach(errors, function (f) {
            it('Should return null on "' + f + '"', function () {
                var p = new Parser();
                assert.isNull(p.parseParams(f));
            });
        });
    });

    describe('Parser.prototype.parse', function () {

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
                        ].join(EOL),
                        inline: {},
                        content: [
                            'hello',
                            'world!'
                        ].join(EOL)
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
                        ].join(EOL),
                        inline: {},
                        content: [
                            'a',
                            '',
                            'b'
                        ].join(EOL)
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
                        ].join(EOL),
                        inline:{},
                        content: [
                            '   xxx',
                            '   xxx'
                        ].join(EOL)
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
                                ].join(EOL),
                                inline:{},
                                content: [
                                    'test',
                                    '    xxx',
                                    'xxx'
                                ].join(EOL)
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
                        ].join(EOL)
                    }
                ]
            ]
        ];

        var errors = [
            [
                [
                    '||m()',
                    '   test',
                    '  bad indent',
                    '  bad indent'
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
                                source: 'test',
                                content: 'test',
                                inline: {}
                            }
                        ]
                    },
                    {
                        type: 'inline',
                        name: 'default',
                        source: [
                            '  bad indent',
                            '  bad indent'
                        ].join(EOL),
                        content: [
                            '  bad indent',
                            '  bad indent'
                        ].join(EOL),
                        inline: {}
                    }
                ]
            ],
            [
                [
                    '||m()',
                    '   ||x()',
                    '       text',
                    '       text',
                    '      bad indent',
                    '   text'
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
                                        inline: {},
                                        source: [
                                            'text',
                                            'text'
                                        ].join(EOL),
                                        content: [
                                            'text',
                                            'text'
                                        ].join(EOL)
                                    }
                                ]
                            },
                            {
                                type: 'inline',
                                name: 'default',
                                inline: {},
                                source: [
                                    '   bad indent',
                                    'text'
                                ].join(EOL),
                                content: [
                                    '   bad indent',
                                    'text'
                                ].join(EOL)
                            }
                        ]
                    }
                ]
            ],
            [
                [
                    '||m(1=5)'
                ],
                [
                    {
                        type: 'inline',
                        name: 'default',
                        inline: {},
                        source: '||m(1=5)',
                        content: '||m(1=5)'
                    }
                ]
            ],
            [
                [
                    '||m()',
                    '   ||x(1)',
                    '       text'
                ],
                [
                    {
                        type: 'macro',
                        name: 'm',
                        source: '||m()',
                        params: {},
                        items: [
                            {
                                type: 'inline',
                                name: 'default',
                                inline: {},
                                source: [
                                    '||x(1)',
                                    '    text'
                                ].join(EOL),
                                content: [
                                    '||x(1)',
                                    '    text'
                                ].join(EOL)
                            }
                        ]
                    }
                ]
            ]
        ];

        _.forEach(fixtures, function (f) {
            it('Should create expected ast from \n' + f[0].join(EOL),
                function () {
                    var p = new Parser();
                    var actual = p.parse(f[0].join(EOL));

                    assert.deepEqual(actual, f[1]);
                });
        });

        _.forEach(errors, function (f) {
            it('Should close block ', function () {
                var p = new Parser();
                assert.deepEqual(p.parse(f[0].join(EOL)), f[1]);
            });
        });
    });

    describe('Parser.prototype.markInline', function () {

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
                            inline: true,
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
                            inline: true,
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
                            inline: true,
                            source: '{{pic()}}',
                            params: {},
                            name: 'pic'
                        },
                        1: {
                            type: 'macro',
                            inline: true,
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
                            inline: true,
                            source: '{{pic()}}',
                            params: {},
                            name: 'pic'
                        },
                        1: {
                            type: 'macro',
                            inline: true,
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
                            inline: true,
                            source: '{{proc(theme=bold): content}}',
                            params: {
                                theme: 'bold'
                            },
                            name: 'proc',
                            content: ' content'
                        }
                    }
                }
            ],
            //  should save bad macro body
            [
                'inline {{proc(1=5)}} here',
                {
                    type: 'inline',
                    name: 'default',
                    source: 'inline {{proc(1=5)}} here',
                    content: 'inline {{proc(1=5)}} here',
                    inline: {}
                }
            ]
        ];

        _.forEach(fixtures, function (f) {
            it('Should parse "' + f[0] + '" to expected ast', function () {
                var P = inherit(Parser, {
                    __constructor: function (params) {
                        this.__base(params);
                        this.i = -1;
                    },
                    __genPlaceholder: function () {
                        this.i += 1;

                        return this.i;
                    }
                });

                var p = new P();
                var actual = p.markInline(f[0]);

                assert.deepEqual(actual, f[1]);
            });
        });
    });

});
