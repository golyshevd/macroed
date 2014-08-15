/*global describe, it*/
'use strict';

var assert = require('chai').assert;

describe('macroed', function () {
    var Macroed = require('../core/macroed');
    var macroed = require('../lib/macroed');

    macroed.registerMacro({
        name: 'host',
        generate: function (params) {

            switch ( params.id ) {

                case 'y':

                    return 'www.yandex.ru';

                default:

                    return 'www.google.com';
            }
        }
    });

    it('Should be on instance of Macroed', function () {
        assert.instanceOf(macroed, Macroed);
    });

    it('Should have a reference to Macroed', function () {
        assert.strictEqual(macroed.Macroed, Macroed);
    });

    it('Should support markdown by default', function () {
        assert.strictEqual(macroed.expandString('http://{{host(id=y)}}'),
            '<p><a href="http://www.yandex.ru">http://www.yandex.ru</a></p>\n');

        assert.strictEqual(macroed.expandString('http://{{host()}}'),
            '<p><a href="http://www.google.com">' +
            'http://www.google.com</a></p>\n');
    });
});
