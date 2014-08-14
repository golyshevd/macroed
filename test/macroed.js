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
});
