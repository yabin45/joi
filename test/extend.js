'use strict';

const Code = require('@hapi/code');
const Hoek = require('@hapi/hoek');
const Joi = require('..');
const Lab = require('@hapi/lab');

const Helper = require('./helper');


const internals = {};


const { describe, it } = exports.lab = Lab.script();
const { expect } = Code;


describe('extension', () => {

    it('extends string locally', () => {

        const special = Joi.string().extend({
            type: 'special',
            rules: {
                hello: {
                    validate: function (value, helpers, args, options) {

                        if (value === 'hello') {
                            return value;
                        }

                        return helpers.error('special.hello');
                    }
                }
            },
            messages: {
                'special.hello': '"{{#label}}" must say hello'
            }
        });

        expect(special.type).to.equal('special');
        expect(special.hello().validate('HELLO').error).to.be.an.error('"value" must say hello');
        expect(special.lowercase().hello().validate('HELLO').error).to.not.exist();
    });

    it('extends string globally', () => {

        const custom = Joi.extend({
            type: 'special',
            base: Joi.string(),
            rules: {
                hello: {
                    validate: function (value, helpers, args, options) {

                        if (value === 'hello') {
                            return value;
                        }

                        return helpers.error('special.hello');
                    }
                }
            },
            messages: {
                'special.hello': '"{{#label}}" must say hello'
            }
        });

        const special = custom.special();
        expect(special.type).to.equal('special');
        expect(special.hello().validate('HELLO').error).to.be.an.error('"value" must say hello');
        expect(special.lowercase().hello().validate('HELLO').error).to.not.exist();
    });

    it('aliases a type', () => {

        const custom = Joi.extend({
            type: 'special',
            base: Joi.string()
        });

        const special = custom.special();
        expect(special.type).to.equal('special');
        expect(special.validate(1).error).to.be.an.error('"value" must be a string');
    });

    it('errors on missing error code', () => {

        const special = Joi.string().extend({
            type: 'special',
            rules: {
                fail: {
                    method: function () {

                        return this.$_addRule('fail');
                    },
                    validate: function (value, helpers) {

                        return helpers.error('special.fail');
                    }
                }
            }
        });

        expect(special.fail().validate('anything').error).to.be.an.error('Error code "special.fail" is not defined, your custom type is missing the correct messages definition');
    });

    it('extends with a custom base', () => {

        const custom = Joi.extend({
            type: 'special',
            base: Joi.string().min(2)
        });

        expect(Joi.special).to.not.exist();
        expect(custom.special).to.be.a.function();

        const schema = custom.special();
        Helper.validate(schema, [
            [123, false, null, {
                message: '"value" must be a string',
                details: [{
                    message: '"value" must be a string',
                    path: [],
                    type: 'string.base',
                    context: { value: 123, label: 'value' }
                }]
            }],
            ['a', false, null, {
                message: '"value" length must be at least 2 characters long',
                details: [{
                    message: '"value" length must be at least 2 characters long',
                    path: [],
                    type: 'string.min',
                    context: {
                        limit: 2,
                        value: 'a',
                        encoding: undefined,
                        label: 'value'
                    }
                }]
            }],
            ['abc', true]
        ]);
    });

    it('extends with constructor arguments', () => {

        const custom = Joi.extend({
            type: 'special',
            base: Joi.string(),
            args: function (schema, limit) {

                return schema.min(limit);
            }
        });

        expect(Joi.special).to.not.exist();
        expect(custom.special).to.be.a.function();

        const schema = custom.special(2);
        Helper.validate(schema, [
            [123, false, null, {
                message: '"value" must be a string',
                details: [{
                    message: '"value" must be a string',
                    path: [],
                    type: 'string.base',
                    context: { value: 123, label: 'value' }
                }]
            }],
            ['a', false, null, {
                message: '"value" length must be at least 2 characters long',
                details: [{
                    message: '"value" length must be at least 2 characters long',
                    path: [],
                    type: 'string.min',
                    context: {
                        limit: 2,
                        value: 'a',
                        encoding: undefined,
                        label: 'value'
                    }
                }]
            }],
            ['abc', true]
        ]);
    });

    it('extends with a custom base while preserving its original constructor arguments', () => {

        const custom = Joi.extend({
            type: 'special',
            base: Joi.object()
        });

        expect(Joi.special).to.not.exist();
        expect(custom.special).to.be.a.function();

        const schema = custom.special({ a: custom.number() });
        Helper.validate(schema, [
            [undefined, true],
            [{}, true],
            [{ a: 1 }, true],
            [{ a: 'a' }, false, null, {
                message: '"a" must be a number',
                details: [{
                    message: '"a" must be a number',
                    path: ['a'],
                    type: 'number.base',
                    context: { key: 'a', label: 'a', value: 'a' }
                }]
            }]
        ]);
    });

    it('extends with a custom base and validate (object)', () => {

        const custom = Joi.extend({
            type: 'special',
            base: Joi.object(),
            validate: function (schema, value, helpers) {

                return { value };
            }
        });

        expect(Joi.special).to.not.exist();
        expect(custom.special).to.be.a.function();

        const schema = custom.special({ a: custom.number() });
        Helper.validate(schema, [
            [undefined, true],
            [{}, true],
            [{ a: 1 }, true],
            [{ a: 'a' }, false, null, {
                message: '"a" must be a number',
                details: [{
                    message: '"a" must be a number',
                    path: ['a'],
                    type: 'number.base',
                    context: { key: 'a', label: 'a', value: 'a' }
                }]
            }]
        ]);
    });

    it('extends with a custom base and validate (number)', () => {

        const custom = Joi.extend({
            type: 'special',
            base: Joi.number(),
            validate: function (schema, value, helpers) {

                return { value };
            }
        });

        expect(Joi.special).to.not.exist();
        expect(custom.special).to.be.a.function();

        const schema = custom.special({ a: custom.number() });
        Helper.validate(schema, [
            [undefined, true],
            [1, true],
            ['1', true],
            [{}, false, null, {
                message: '"value" must be a number',
                details: [{
                    message: '"value" must be a number',
                    path: [],
                    type: 'number.base',
                    context: { label: 'value', value: {} }
                }]
            }]
        ]);
    });

    it('extends with a custom base and validate (boolean)', () => {

        const custom = Joi.extend({
            type: 'special',
            base: Joi.boolean(),
            validate: function (schema, value, helpers) {

                return { value };
            }
        });

        expect(Joi.special).to.not.exist();
        expect(custom.special).to.be.a.function();

        const schema = custom.special();
        Helper.validate(schema, [
            [undefined, true],
            [true, true],
            [false, true],
            [{}, false, null, {
                message: '"value" must be a boolean',
                details: [{
                    message: '"value" must be a boolean',
                    path: [],
                    type: 'boolean.base',
                    context: { label: 'value', value: {} }
                }]
            }]
        ]);
    });

    it('extends with new rules', () => {

        const custom = Joi.extend({
            type: 'special',
            rules: {
                foo: {
                    validate: function (value, helpers, args, options) {

                        return null;
                    }
                },
                bar: {
                    validate: function (value, helpers, args, options) {

                        return helpers.error('special.bar');
                    }
                }
            },
            messages: {
                'special.bar': '"{#label}" oh no bar !'
            }
        });

        const original = Joi.any();
        expect(original.foo).to.not.exist();
        expect(original.bar).to.not.exist();

        const schema = custom.special();
        expect(schema.foo().validate({})).to.equal({ value: null });
        expect(schema.bar().validate({}).error).to.be.an.error('"value" oh no bar !');
    });

    it('concats custom type', () => {

        const custom = Joi.extend({
            type: 'special',
            rules: {
                test: {
                    validate: function (value, helpers, args, options) {

                        return value;
                    },
                    multi: true
                }
            }
        });

        const schema = custom.special();
        const base = schema.test();
        const merged = base.concat(base);

        expect(merged.describe()).to.equal({
            type: 'special',
            rules: [{ name: 'test' }, { name: 'test' }]
        });
    });

    it('adds a new rule with the correct this', () => {

        const custom = Joi.extend({
            type: 'special',
            rules: {
                foo: {
                    validate(value, { error }) {

                        return error('special.bar');
                    }
                }
            },
            messages: {
                'special.bar': '"{#label}" oh no bar !'
            }
        });

        const schema = custom.special().foo().label('baz');
        expect(schema.validate({}).error).to.be.an.error('"baz" oh no bar !');
    });

    it('extends with flag rule', () => {

        const custom = Joi.extend({
            type: 'special',
            validate(schema, value, helpers) {

                return { value: schema.$_getFlag('foo') };
            },
            rules: {
                foo: {
                    method: function (first, second) {

                        Joi.assert(first, Joi.string());
                        Joi.assert(second, Joi.object().ref());

                        return this.$_setFlag('foo', { first, second });
                    }
                }
            }
        });

        const schema = custom.special();
        expect(schema.foo('bar').validate(null)).to.equal({ value: { first: 'bar', second: undefined } });
        expect(schema.foo('bar', Joi.ref('a.b')).validate(null).value.first).to.equal('bar');
        expect(Joi.isRef(schema.foo('bar', Joi.ref('a.b')).validate(null).value.second)).to.be.true();
    });

    it('defines a rule that can change the value', () => {

        const custom = Joi.extend({
            type: 'number',
            base: Joi.number(),
            rules: {
                double: {
                    validate: function (value, helpers, args, options) {

                        return value * 2;
                    }
                }
            }
        });

        const original = Joi.number();
        expect(original.double).to.not.exist();

        const schema = custom.number().double();
        expect(schema.validate(3)).to.contain({ value: 6 });
    });

    it('overrides all error messages with string', () => {

        const custom = Joi.extend({
            type: 'special',
            base: Joi.string(),
            messages: 'shit happens'
        });

        const special = custom.special();
        expect(special.type).to.equal('special');
        expect(special.validate(1).error).to.be.an.error('shit happens');
    });

    it('overrides all error messages with a template', () => {

        const custom = Joi.extend({
            type: 'special',
            base: Joi.string(),
            messages: Joi.x('shit happens')
        });

        const special = custom.special();
        expect(special.type).to.equal('special');
        expect(special.validate(1).error).to.be.an.error('shit happens');
    });

    it('overrides specific error messages with string', () => {

        const custom = Joi.extend({
            type: 'special',
            base: Joi.string(),
            messages: {
                'string.base': 'shit happens'
            }
        });

        const special = custom.special();
        expect(special.type).to.equal('special');
        expect(special.validate(1).error).to.be.an.error('shit happens');
    });

    it('overrides specific error messages with template', () => {

        const custom = Joi.extend({
            type: 'special',
            base: Joi.string(),
            messages: {
                'string.base': Joi.x('shit happens')
            }
        });

        const special = custom.special();
        expect(special.type).to.equal('special');
        expect(special.validate(1).error).to.be.an.error('shit happens');
    });

    it('overrides specific error messages with string (language)', () => {

        const custom = Joi.extend(
            {
                type: 'special',
                base: Joi.string(),
                messages: {
                    root: 'thing',
                    en: {
                        root: 'stuff',
                        'string.base': '{{#label}} shit happens'
                    }
                }
            },
            (joi) => {

                return {
                    type: 'special',
                    base: joi.special(),
                    messages: {
                        en: {
                            'string.base': '{{#label}} bad shit happens'
                        }
                    }
                };
            }
        );

        const special = custom.special();
        expect(special.validate(1, { errors: { language: 'en' } }).error).to.be.an.error('stuff bad shit happens');
    });

    it('overrides specific error messages with template (language)', () => {

        const custom = Joi.extend({
            type: 'special',
            base: Joi.string(),
            messages: {
                root: 'thing',
                en: {
                    root: 'stuff',
                    'string.base': Joi.x('{{#label}} shit happens')
                }
            }
        });

        const special = custom.special();
        expect(special.type).to.equal('special');
        expect(special.validate(1, { errors: { language: 'en' } }).error).to.be.an.error('stuff shit happens');
        expect(special.validate(1).error).to.be.an.error('"thing" must be a string');
    });

    it('errors on invalid message overrides (language)', () => {

        expect(() => {

            Joi.extend({
                type: 'special',
                base: Joi.string(),
                messages: {
                    root: 'thing',
                    en: 10
                }
            });
        }).to.throw('Invalid message for en');
    });

    it('retains base predefined options', () => {

        const custom = Joi.extend({
            type: 'special',
            base: Joi.number().prefs({ abortEarly: false }),
            rules: {
                foo: {
                    validate: function (value, { error }, args, options) {

                        return error('special.foo');
                    }
                }
            },
            messages: {
                'special.foo': '"{#label}" foo'
            }
        });

        const schema = custom.special().min(10).max(0).foo();
        expect(schema.validate(5).error).to.be.an.error('"value" must be larger than or equal to 10. "value" must be less than or equal to 0. "value" foo');
    });

    it('extends coerce', () => {

        const custom = Joi.extend({
            type: 'special',
            base: Joi.string(),
            coerce: function (schema, value, helpers) {

                return { value: 'foobar' };
            }
        });

        const schema = custom.special();
        expect(schema.validate(true)).to.equal({ value: 'foobar' });
    });

    it('extends coerce (from different types)', () => {

        const type1 = Joi.any().extend({
            type: 'type1',
            coerce: {
                from: 'string',
                method: function (schema, value, { error }) {

                    if (value === '1') {
                        return { errors: error('type1.error') };
                    }

                    if (value === '2') {
                        return { value: 2 };
                    }
                }
            },
            messages: {
                'type1.error': 'failed1'
            }
        });

        const type2 = type1.extend({
            type: 'type2',
            coerce: {
                from: 'number',
                method: function (schema, value, { error }) {

                    if (value === 4) {
                        return { errors: error('type2.error') };
                    }

                    if (value === 2) {
                        return { value: 'x' };
                    }
                }
            },
            messages: {
                'type2.error': 'failed2'
            }
        });

        expect(type2.validate('2')).to.equal({ value: 'x' });
        expect(type2.validate(2)).to.equal({ value: 'x' });
        expect(type2.validate('3')).to.equal({ value: '3' });
        expect(type2.validate(5)).to.equal({ value: 5 });
        expect(type2.validate('1').error).to.be.an.error('failed1');
        expect(type2.validate(4).error).to.be.an.error('failed2');
    });

    it('extends coerce (no from on parent)', () => {

        const type1 = Joi.any().extend({
            type: 'type1',
            coerce: {
                method: function (schema, value, { error }) {

                    if (value === '1') {
                        return { errors: error('type1.error') };
                    }

                    if (value === '2') {
                        return { value: 2 };
                    }
                }
            },
            messages: {
                'type1.error': 'failed1'
            }
        });

        const type2 = type1.extend({
            type: 'type2',
            coerce: {
                from: 'number',
                method: function (schema, value, { error }) {

                    if (value === 4) {
                        return { errors: error('type2.error') };
                    }

                    if (value === 2) {
                        return { value: 'x' };
                    }
                }
            },
            messages: {
                'type2.error': 'failed2'
            }
        });

        expect(type2.validate('2')).to.equal({ value: 'x' });
        expect(type2.validate(2)).to.equal({ value: 'x' });
        expect(type2.validate('3')).to.equal({ value: '3' });
        expect(type2.validate(5)).to.equal({ value: 5 });
        expect(type2.validate('1').error).to.be.an.error('failed1');
        expect(type2.validate(4).error).to.be.an.error('failed2');
    });

    it('extends coerce (undefined)', () => {

        const type1 = Joi.any().extend({
            type: 'type1',
            coerce: function (schema, value, { error }) {

                if (value === '1') {
                    return { value: undefined };

                }
            }
        });

        const type2 = type1.extend({
            type: 'type2',
            coerce: function (schema, value, { error }) {

                if (value === '2') {
                    return { value: undefined };
                }
            }
        });

        const type3 = type2.extend({
            type: 'type3',
            coerce: function (schema, value, { error }) {

                if (value === '3') {
                    return { value: undefined };
                }
            }
        });

        expect(type3.validate('1')).to.equal({ value: undefined });
        expect(type3.validate('2')).to.equal({ value: undefined });
        expect(type3.validate('3')).to.equal({ value: undefined });
    });

    it('extends with a failing validate', () => {

        const custom = Joi.extend({
            type: 'special',
            validate(schema, value, { error }) {

                return { errors: error('any.invalid') };
            }
        });

        const schema = custom.special();
        expect(schema.validate('foo').error).to.be.an.error('"value" contains an invalid value');
    });

    it('returns a custom Joi with types not inheriting root properties', () => {

        const custom = Joi.extend({
            type: 'special'
        });

        const schema = custom.valid(true);
        expect(schema.isRef).to.not.exist();
    });

    it('uses types defined in the same extend call', () => {

        const custom = Joi.extend(
            {
                type: 'special'
            },
            (joi) => ({
                type: 'second',
                base: joi.special()
            })
        );

        expect(() => custom.second()).to.not.throw();
    });

    it('merges rules when type is defined several times in the same extend call', () => {

        const custom = Joi.extend(
            (joi) => ({
                type: 'special',
                base: joi.number(),
                rules: {
                    foo: {
                        validate: function (schema, value, helpers) {

                            return 1;
                        }
                    }
                }
            }),
            (joi) => ({
                type: 'special',
                base: joi.special(),
                rules: {
                    bar: {
                        validate: function (schema, value, helpers) {

                            return 2;
                        }
                    }
                }
            })
        );

        expect(() => custom.special().foo().bar()).to.not.throw();
        expect(custom.attempt({ a: 123, b: 456 }, Joi.object({ a: custom.special().foo(), b: custom.special().bar() }))).to.equal({ a: 1, b: 2 });
    });

    it('uses last definition when type is defined several times with different bases', () => {

        const custom = Joi.extend(
            (joi) => ({
                type: 'special',
                base: Joi.number(),
                rules: {
                    foo: {
                        validate(value, { error }) {

                            return 1;
                        }
                    }
                }
            }),
            (joi) => ({
                type: 'special',
                base: Joi.string(),
                rules: {
                    bar: {
                        validate(value, { error }) {

                            return 2;
                        }
                    }
                }
            })
        );

        expect(() => custom.special().foo()).to.throw();
        expect(() => custom.special().bar()).to.not.throw();
    });

    it('merges languages when multiple extensions extend the same type', () => {

        const customJoiWithBoth = Joi.extend(
            (joi) => ({
                type: 'number',
                base: joi.number(),
                messages: { 'number.foo': '"{#label}" foo' },
                rules: {
                    foo: {
                        validate(value, { error }) {

                            return error('number.foo');
                        }
                    }
                }
            }),
            (joi) => ({
                type: 'number',
                base: joi.number(),
                messages: { 'number.bar': '"{#label}" bar' },
                rules: {
                    bar: {
                        validate(value, { error }) {

                            return error('number.bar');
                        }
                    }
                }
            })
        );

        expect(customJoiWithBoth.number().foo().validate(0).error).to.be.an.error('"value" foo');
        expect(customJoiWithBoth.number().bar().validate(0).error).to.be.an.error('"value" bar');

        const customJoiWithFirst = Joi.extend(
            (joi) => ({
                type: 'number',
                base: joi.number(),
                messages: { 'number.foo': '"{#label}" foo' },
                rules: {
                    foo: {
                        validate(value, { error }) {

                            return error('number.foo');
                        }
                    }
                }
            }),
            (joi) => ({
                type: 'number',
                base: joi.number(),
                rules: {
                    bar: {
                        validate(value, { error }) {

                            return error('number.base');
                        }
                    }
                }
            })
        );

        expect(customJoiWithFirst.number().foo().validate(0).error).to.be.an.error('"value" foo');
        expect(customJoiWithFirst.number().bar().validate(0).error).to.be.an.error('"value" must be a number');

        const customJoiWithSecond = Joi.extend(
            (joi) => ({
                type: 'number',
                base: joi.number(),
                rules: {
                    foo: {
                        validate(value, { error }) {

                            return error('number.base');
                        }
                    }
                }
            }),
            (joi) => ({
                type: 'number',
                base: joi.number(),
                messages: { 'number.bar': '"{#label}" bar' },
                rules: {
                    bar: {
                        validate(value, { error }) {

                            return error('number.bar');
                        }
                    }
                }
            })
        );

        expect(customJoiWithSecond.number().foo().validate(0).error).to.be.an.error('"value" must be a number');
        expect(customJoiWithSecond.number().bar().validate(0).error).to.be.an.error('"value" bar');
    });

    it('returns extended shortcuts', () => {

        const custom = Joi.extend({
            base: Joi.string(),
            type: 'special'
        });

        expect(() => {

            const string = custom.string;
            string();
        }).to.throw('Must be invoked on a Joi instance.');

        const { string, special } = custom.types();
        expect(() => string.allow('x')).to.not.throw();
        expect(string.validate(0).error).to.be.an.error('"value" must be a string');

        expect(() => special.allow('x')).to.not.throw();
        expect(special.validate(0).error).to.be.an.error('"value" must be a string');

        expect(custom._types.size).to.equal(Joi._types.size + 1);
    });

    it('supports rule()', () => {

        const custom = Joi.extend({
            type: 'ext',
            base: Joi.number(),
            messages: {
                'ext.big': 'Not big enough'
            },
            rules: {
                big: {
                    validate(value, { error }) {

                        if (value > 100) {
                            return value;
                        }

                        return error('ext.big');
                    }
                }
            }
        });

        expect(() => custom.ext().big().rule({})).to.not.throw();
        expect(() => custom.ext().big().rule({}).big()).to.not.throw();
    });

    it('extends rule with complex example', () => {

        const custom = Joi.extend((joi) => {

            return {
                type: 'million',
                base: joi.number(),
                messages: {
                    'million.base': '"{{#label}}" must be at least a million',
                    'million.big': '"{{#label}}" must be at least five millions',
                    'million.round': '"{{#label}}" must be a round number',
                    'million.dividable': '"{{#label}}" must be dividable by {{#q}}'
                },
                coerce: function (schema, value, helpers) {

                    // Only called when prefs.convert is true

                    if (schema.$_getRule('round')) {
                        return { value: Math.round(value) };
                    }
                },
                validate: function (schema, value, helpers) {

                    // Base validation regardless of the rules applied

                    if (value < 1000000) {
                        return { value, errors: helpers.error('million.base') };
                    }

                    // Check flags for global state

                    if (schema.$_getFlag('big') &&
                        value < 5000000) {

                        return { value, errors: helpers.error('million.big') };
                    }
                },
                rules: {
                    big: {
                        alias: 'large',
                        method: function () {

                            return this.$_setFlag('big', true);
                        }
                    },
                    round: {
                        convert: true,              // Dual rule: converts or validates
                        method: function () {

                            return this.$_addRule('round');
                        },
                        validate: function (value, helpers, args, options) {

                            // Only called when prefs.convert is false (due to rule convert option)

                            if (value % 1 !== 0) {
                                return helpers.error('million.round');
                            }
                        }
                    },
                    dividable: {
                        multi: true,                // Rule supports multiple invocations
                        method: function (q) {

                            return this.$_addRule({ name: 'dividable', args: { q } });
                        },
                        args: [
                            {
                                name: 'q',
                                ref: true,
                                assert: (value) => typeof value === 'number' && !isNaN(value),
                                message: 'must be a number'
                            }
                        ],
                        validate: function (value, helpers, args, options) {

                            if (value % args.q === 0) {
                                return value;       // Value is valid
                            }

                            return helpers.error('million.dividable', { q: args.q });
                        }
                    },
                    even: {
                        method: function () {

                            // Rule with only method used to alias another rule

                            return this.dividable(2);
                        }
                    }
                }
            };
        });

        const schema = custom.object({
            a: custom.million().round().dividable(Joi.ref('b')),
            b: custom.number(),
            c: custom.million().even().dividable(7),
            d: custom.million().round().prefs({ convert: false }),
            e: custom.million().large()
        });

        Helper.validate(schema, [
            [{ a: 3000000, b: 3 }, true],
            [{ a: 1000000.1, b: 10 }, true, null, { a: 1000000, b: 10 }],
            [{ a: 3000, b: 3 }, false, null, {
                message: '"a" must be at least a million',
                key: 'a',
                details: [{
                    message: '"a" must be at least a million',
                    path: ['a'],
                    type: 'million.base',
                    context: { value: 3000, label: 'a', key: 'a' }
                }]
            }],
            [{ c: 14000000 }, true],
            [{ c: 1000000 }, false, null, {
                message: '"c" must be dividable by 7',
                key: 'c',
                details: [{
                    message: '"c" must be dividable by 7',
                    path: ['c'],
                    type: 'million.dividable',
                    context: { value: 1000000, label: 'c', key: 'c', q: 7 }
                }]
            }],
            [{ d: 1000000.1 }, false, null, {
                message: '"d" must be a round number',
                key: 'd',
                details: [{
                    message: '"d" must be a round number',
                    path: ['d'],
                    type: 'million.round',
                    context: { value: 1000000.1, label: 'd', key: 'd' }
                }]
            }],
            [{ e: 6000000 }, true],
            [{ e: 1000000 }, false, null, {
                message: '"e" must be at least five millions',
                key: 'e',
                details: [{
                    message: '"e" must be at least five millions',
                    path: ['e'],
                    type: 'million.big',
                    context: { value: 1000000, label: 'e', key: 'e' }
                }]
            }]
        ]);
    });

    it('extends rule with schema ref validation', () => {

        const custom = Joi.extend((joi) => {

            return {
                type: 'number',
                base: joi.number(),
                messages: {
                    'number.dividable': '"{{#label}}" must be dividable by {{#q}}'
                },
                rules: {
                    dividable: {
                        method: function (q) {

                            return this.$_addRule({ name: 'dividable', args: { q } });
                        },
                        args: [
                            {
                                name: 'q',
                                ref: true,
                                assert: Joi.number().required()
                            }
                        ],
                        validate: function (value, helpers, args, options) {

                            if (value % args.q === 0) {
                                return value;       // Value is valid
                            }

                            return helpers.error('number.dividable', { q: args.q });
                        }
                    }
                }
            };
        });

        const ref = Joi.ref('b');
        const schema = custom.object({
            a: custom.number().dividable(ref),
            b: custom.number()
        });

        Helper.validate(schema, [
            [{ a: 30, b: 3 }, true],
            [{ a: 30 }, false, null, {
                message: '"a" q references "ref:b" which "value" is required',
                key: 'a',
                details: [{
                    message: '"a" q references "ref:b" which "value" is required',
                    path: ['a'],
                    type: 'any.ref',
                    context: { label: 'a', key: 'a', ref, arg: 'q', reason: '"value" is required' }
                }]
            }]
        ]);
    });

    it('extends modify', () => {

        const custom = Joi.extend((joi) => {

            return {
                type: 'special',
                base: joi.object(),
                initialize: function (schema) {

                    schema.$_terms.tests = [];
                },
                rules: {
                    test: {
                        method: function (schema) {

                            const obj = this.clone();
                            obj.$_terms.tests.push(schema);
                            obj.$_mutateRegister(schema);
                            return obj;
                        }
                    }
                },
                modify: function (schema, id, replacement) {

                    for (let i = 0; i < schema.$_terms.tests.length; ++i) {
                        const item = schema.$_terms.tests[i];
                        if (id === item._flags.id) {
                            const obj = schema.clone();
                            obj.$_terms.tests[i] = replacement;
                            return obj.$_mutateRebuild();
                        }
                    }
                },
                rebuild: function (schema) {

                    for (const item of schema.$_terms.tests) {
                        schema.$_mutateRegister(item);
                    }
                }
            };
        });

        const schema = custom.special().keys({ y: Joi.number() }).test(Joi.number().id('x'));

        const modified1 = schema.fork('x', (s) => s.min(10));
        expect(modified1.describe()).to.equal({
            type: 'special',
            keys: {
                y: { type: 'number' }
            },
            tests: [
                {
                    type: 'number',
                    flags: { id: 'x' },
                    rules: [
                        {
                            name: 'min',
                            args: { limit: 10 }
                        }
                    ]
                }
            ]
        });

        const modified2 = schema.fork('y', (s) => s.min(10));
        expect(modified2.describe()).to.equal({
            type: 'special',
            keys: {
                y: {
                    type: 'number',
                    rules: [
                        {
                            name: 'min',
                            args: { limit: 10 }
                        }
                    ]
                }
            },
            tests: [
                {
                    type: 'number',
                    flags: { id: 'x' }
                }
            ]
        });
    });

    it('extends with rules override', () => {

        const custom = Joi.extend({
            type: 'special',
            base: Joi.number(),
            rules: {
                factor: {
                    method: function (n) {

                        return this.$_replaceRules('min', (rule) => {

                            const clone = Hoek.clone(rule);
                            clone.options.args.limit *= n;
                            return clone;
                        });
                    }
                }
            }
        });

        const schema = custom.special().min(1).keep().min(10).factor(2);
        expect(schema.validate(20)).to.equal({ value: 20 });
        expect(schema.validate(19).error).to.be.an.error('"value" must be larger than or equal to 20');
    });
});
