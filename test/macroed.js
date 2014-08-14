/*global describe, it*/
'use strict';

var assert = require('chai').assert;

describe('macroed', function () {
    var Macroed = require('../core/macroed');
    var macroed = require('../macroed');

    it('Should be on instance of Macroed', function () {
        assert.instanceOf(macroed, Macroed);
    });

    it('Should have a reference to Macroed', function () {
        assert.strictEqual(macroed.Macroed, Macroed);
    });

    it('Should support markdown by default', function () {
        assert.strictEqual(macroed.expandString('http://www.yandex.ru'),
            '<p><a href="http://www.yandex.ru">http://www.yandex.ru</a></p>\n');
    });
});
