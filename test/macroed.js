/*global describe, it*/
'use strict';

var Macroed = require('../macroed');
var assert = require('chai').assert;

describe('Macroed.prototype.expand', function () {

    it('Should expand simple macro', function () {
        var m = new Macroed();

        m.register('smile', function () {

            return ':)';
        });

        m.register('wrap', function () {
            return '(%s)';
        });

        assert.strictEqual(m.expand('{{smile()}}'), ':)');
        assert.strictEqual(m.expand('{{smile () {} }}'), ':)');

        assert.strictEqual(m.expand('{{wrap () {\n{{smile(){}}}\n}}}'),
            '(\n:)\n)');
    });

    it('Should support macro generation', function () {
        var m = new Macroed();

        m.register('widget', function () {

            return '{{wrap(){ {{smile()}} }}}';
        });

        m.register('wrap', function () {

            return '< %s >';
        });

        m.register('smile', function () {

            return ':)';
        });

        assert.strictEqual(m.expand('{{widget()}}'), '<  :)  >');
    });

    it('Should save not defined macros', function () {
        var m = new Macroed();

        m.register('poo', function () {

            return '!';
        });

        assert.strictEqual(m.expand('{{undef()}}'), '{{undef()}}');
        assert.strictEqual(m.expand('{{undef(){ :) }}}'), '{{undef(){ :) }}}');
        assert.strictEqual(m.expand('{{undef () { {{poo()}} }}}'),
            '{{undef () { ! }}}');
    });

    it('Should support params', function (done) {
        var m = new Macroed();

        m.register('test', function (params) {
            assert.deepEqual(params, {a: '42', b: '146'});
            done();
        });

        m.expand('{{test(a=42,b=146)}}');
    });

    it('Should support parenthesis omitting', function () {
        var m = new Macroed();

        m.register('smile', function (params) {
            assert.isObject(params);

            return ':)';
        });

        assert.strictEqual(m.expand('This is a smile {{smile}}!'),
            'This is a smile :)!');
    });

    it('Should support "-" in macro names', function () {
        var m = new Macroed();

        m.register('macro-like', function (params) {

            return '+' + params.plus;
        });

        assert.strictEqual(m.expand('{{macro-like(plus=1)}} for me'),
            '+1 for me');
    });

});
