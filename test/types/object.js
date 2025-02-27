'use strict';

const Code = require('@hapi/code');
const Lab = require('@hapi/lab');
const Joi = require('../..');

const Helper = require('../helper');


const internals = {};


const { describe, it } = exports.lab = Lab.script();
const { expect } = Code;


describe('object', () => {

    it('converts a json string to an object', () => {

        expect(Joi.object().validate('{"hi":true}')).to.equal({ value: { hi: true } });
    });

    it('converts a json string with whitespace to an object', () => {

        expect(Joi.object().validate(' \n\r\t{ \n\r\t"hi" \n\r\t: \n\r\ttrue \n\r\t} \n\r\t')).to.equal({ value: { hi: true } });
    });

    it('fails on json string in strict mode', () => {

        expect(Joi.object().strict().validate('{"hi":true}').error).to.be.an.error('"value" must be of type object');
    });

    it('errors on non-object string', () => {

        const err = Joi.object().validate('a string').error;
        expect(err).to.be.an.error('"value" must be of type object');
        expect(err.details).to.equal([{
            message: '"value" must be of type object',
            path: [],
            type: 'object.base',
            context: { label: 'value', value: 'a string', type: 'object' }
        }]);
    });

    it('validates an object', () => {

        const schema = Joi.object().required();
        Helper.validate(schema, [
            [{}, true],
            [{ hi: true }, true],
            ['', false, null, {
                message: '"value" must be of type object',
                details: [{
                    message: '"value" must be of type object',
                    path: [],
                    type: 'object.base',
                    context: { label: 'value', value: '', type: 'object' }
                }]
            }]
        ]);
    });

    it('validates references', () => {

        const schema = Joi.object().ref();

        Helper.validate(schema, [
            [{}, false, null, {
                message: '"value" must be a Joi reference',
                details: [{
                    message: '"value" must be a Joi reference',
                    path: [],
                    type: 'object.refType',
                    context: { label: 'value', value: {} }
                }]
            }],
            [Joi.ref('a.b'), true]
        ]);
    });

    it('returns object reference when no rules specified', () => {

        const schema = Joi.object({
            a: Joi.object()
        });

        const item = { x: 5 };
        expect(schema.validate({ a: item })).to.equal({ value: { a: item } });
    });

    it('retains ignored values', () => {

        const schema = Joi.object();
        expect(schema.validate({ a: 5 })).to.equal({ value: { a: 5 } });
    });

    it('retains skipped values', () => {

        const schema = Joi.object({ b: 5 }).unknown(true);
        expect(schema.validate({ b: '5', a: 5 })).to.equal({ value: { a: 5, b: 5 } });
    });

    it('retains symbols', () => {

        const schema = Joi.object({ a: Joi.number() });

        const symbol = Symbol();
        expect(schema.validate({ [symbol]: 5, a: 5 })).to.equal({ value: { [symbol]: 5, a: 5 } });
    });

    it('retains non-enumerable', () => {

        const schema = Joi.object({ a: Joi.number() });

        const obj = { a: 100 };
        Object.defineProperty(obj, 'test', { value: 42, enumerable: false });
        expect(obj.test).to.equal(42);
        expect(schema.validate(obj, { nonEnumerables: true })).to.equal({ value: { a: 100 } });
    });

    it('retains prototype', () => {

        const schema = Joi.object({ a: Joi.number() });

        const Test = class {
            constructor() {

                this.a = 5;
            }
        };

        expect(schema.validate(new Test()).value).to.be.instanceof(Test);
    });

    it('allows any key when schema is undefined', () => {

        expect(Joi.object().validate({ a: 4 }).error).to.not.exist();
        expect(Joi.object(undefined).validate({ a: 4 }).error).to.not.exist();
    });

    it('allows any key when schema is null', () => {

        expect(Joi.object(null).validate({ a: 4 }).error).to.not.exist();
    });

    it('throws on invalid object schema', () => {

        expect(() => {

            Joi.object(4);
        }).to.throw('Object schema must be a valid object');
    });

    it('throws on joi object schema', () => {

        expect(() => {

            Joi.object(Joi.object());
        }).to.throw('Object schema cannot be a joi schema');
    });

    it('skips conversion when value is undefined', () => {

        expect(Joi.object({ a: Joi.object() }).validate(undefined)).to.equal({ value: undefined });
    });

    it('errors on array', () => {

        const err = Joi.object().validate([1, 2, 3]).error;
        expect(err).to.be.an.error('"value" must be of type object');
        expect(err.details).to.equal([{
            message: '"value" must be of type object',
            path: [],
            type: 'object.base',
            context: { label: 'value', value: [1, 2, 3], type: 'object' }
        }]);
    });

    it('should prevent extra keys from existing by default', () => {

        const schema = Joi.object({ item: Joi.string().required() }).required();
        Helper.validate(schema, [
            [{ item: 'something' }, true],
            [{ item: 'something', item2: 'something else' }, false, null, {
                message: '"item2" is not allowed',
                details: [{
                    message: '"item2" is not allowed',
                    path: ['item2'],
                    type: 'object.unknown',
                    context: { child: 'item2', label: 'item2', key: 'item2', value: 'something else' }
                }]
            }],
            ['', false, null, {
                message: '"value" must be of type object',
                details: [{
                    message: '"value" must be of type object',
                    path: [],
                    type: 'object.base',
                    context: { label: 'value', value: '', type: 'object' }
                }]
            }]
        ]);
    });

    it('validates count when min is set', () => {

        const schema = Joi.object().min(3);
        Helper.validate(schema, [
            [{ item: 'something' }, false, null, {
                message: '"value" must have at least 3 keys',
                details: [{
                    message: '"value" must have at least 3 keys',
                    path: [],
                    type: 'object.min',
                    context: { limit: 3, label: 'value', value: { item: 'something' } }
                }]
            }],
            [{ item: 'something', item2: 'something else' }, false, null, {
                message: '"value" must have at least 3 keys',
                details: [{
                    message: '"value" must have at least 3 keys',
                    path: [],
                    type: 'object.min',
                    context: {
                        limit: 3,
                        label: 'value',
                        value: { item: 'something', item2: 'something else' }
                    }
                }]
            }],
            [{ item: 'something', item2: 'something else', item3: 'something something else' }, true],
            ['', false, null, {
                message: '"value" must be of type object',
                details: [{
                    message: '"value" must be of type object',
                    path: [],
                    type: 'object.base',
                    context: { label: 'value', value: '', type: 'object' }
                }]
            }]
        ]);
    });

    it('validates count when max is set', () => {

        const schema = Joi.object().max(2);
        Helper.validate(schema, [
            [{ item: 'something' }, true],
            [{ item: 'something', item2: 'something else' }, true],
            [{ item: 'something', item2: 'something else', item3: 'something something else' }, false, null, {
                message: '"value" must have less than or equal to 2 keys',
                details: [{
                    message: '"value" must have less than or equal to 2 keys',
                    path: [],
                    type: 'object.max',
                    context: {
                        limit: 2,
                        label: 'value',
                        value: { item: 'something', item2: 'something else', item3: 'something something else' }
                    }
                }]
            }],
            ['', false, null, {
                message: '"value" must be of type object',
                details: [{
                    message: '"value" must be of type object',
                    path: [],
                    type: 'object.base',
                    context: { label: 'value', value: '', type: 'object' }
                }]
            }]
        ]);
    });

    it('validates count when min and max is set', () => {

        const schema = Joi.object().max(3).min(2);
        Helper.validate(schema, [
            [{ item: 'something' }, false, null, {
                message: '"value" must have at least 2 keys',
                details: [{
                    message: '"value" must have at least 2 keys',
                    path: [],
                    type: 'object.min',
                    context: { limit: 2, label: 'value', value: { item: 'something' } }
                }]
            }],
            [{ item: 'something', item2: 'something else' }, true],
            [{ item: 'something', item2: 'something else', item3: 'something something else' }, true],
            [{
                item: 'something',
                item2: 'something else',
                item3: 'something something else',
                item4: 'item4'
            }, false, null, {
                message: '"value" must have less than or equal to 3 keys',
                details: [{
                    message: '"value" must have less than or equal to 3 keys',
                    path: [],
                    type: 'object.max',
                    context: {
                        limit: 3,
                        label: 'value',
                        value: {
                            item: 'something',
                            item2: 'something else',
                            item3: 'something something else',
                            item4: 'item4'
                        }
                    }
                }]
            }],
            ['', false, null, {
                message: '"value" must be of type object',
                details: [{
                    message: '"value" must be of type object',
                    path: [],
                    type: 'object.base',
                    context: { label: 'value', value: '', type: 'object' }
                }]
            }]
        ]);
    });

    it('validates count when length is set', () => {

        const schema = Joi.object().length(2);
        Helper.validate(schema, [
            [{ item: 'something' }, false, null, {
                message: '"value" must have 2 keys',
                details: [{
                    message: '"value" must have 2 keys',
                    path: [],
                    type: 'object.length',
                    context: { limit: 2, label: 'value', value: { item: 'something' } }
                }]
            }],
            [{ item: 'something', item2: 'something else' }, true],
            [{ item: 'something', item2: 'something else', item3: 'something something else' }, false, null, {
                message: '"value" must have 2 keys',
                details: [{
                    message: '"value" must have 2 keys',
                    path: [],
                    type: 'object.length',
                    context: {
                        limit: 2,
                        label: 'value',
                        value: { item: 'something', item2: 'something else', item3: 'something something else' }
                    }
                }]
            }],
            ['', false, null, {
                message: '"value" must be of type object',
                details: [{
                    message: '"value" must be of type object',
                    path: [],
                    type: 'object.base',
                    context: { label: 'value', value: '', type: 'object' }
                }]
            }]
        ]);
    });

    it('validates constructor when type is set', () => {

        const schema = Joi.object().instance(RegExp);
        const d = new Date();
        Helper.validate(schema, [
            [{ item: 'something' }, false, null, {
                message: '"value" must be an instance of "RegExp"',
                details: [{
                    message: '"value" must be an instance of "RegExp"',
                    path: [],
                    type: 'object.instance',
                    context: { type: 'RegExp', label: 'value', value: { item: 'something' } }
                }]
            }],
            ['', false, null, {
                message: '"value" must be of type object',
                details: [{
                    message: '"value" must be of type object',
                    path: [],
                    type: 'object.base',
                    context: { label: 'value', value: '', type: 'object' }
                }]
            }],
            [d, false, null, {
                message: '"value" must be an instance of "RegExp"',
                details: [{
                    message: '"value" must be an instance of "RegExp"',
                    path: [],
                    type: 'object.instance',
                    context: { type: 'RegExp', label: 'value', value: d }
                }]
            }],
            [/abcd/, true],
            [new RegExp(), true]
        ]);
    });

    it('should traverse an object and validate all properties in the top level', () => {

        const schema = Joi.object({
            num: Joi.number()
        });

        Helper.validate(schema, [
            [{ num: 1 }, true],
            [{ num: [1, 2, 3] }, false, null, {
                message: '"num" must be a number',
                details: [{
                    message: '"num" must be a number',
                    path: ['num'],
                    type: 'number.base',
                    context: { label: 'num', key: 'num', value: [1, 2, 3] }
                }]
            }]
        ]);
    });

    it('should traverse an object and child objects and validate all properties', () => {

        const schema = Joi.object({
            num: Joi.number(),
            obj: Joi.object({
                item: Joi.string()
            })
        });

        Helper.validate(schema, [
            [{ num: 1 }, true],
            [{ num: [1, 2, 3] }, false, null, {
                message: '"num" must be a number',
                details: [{
                    message: '"num" must be a number',
                    path: ['num'],
                    type: 'number.base',
                    context: { label: 'num', key: 'num', value: [1, 2, 3] }
                }]
            }],
            [{ num: 1, obj: { item: 'something' } }, true],
            [{ num: 1, obj: { item: 123 } }, false, null, {
                message: '"obj.item" must be a string',
                details: [{
                    message: '"obj.item" must be a string',
                    path: ['obj', 'item'],
                    type: 'string.base',
                    context: { value: 123, label: 'obj.item', key: 'item' }
                }]
            }]
        ]);
    });

    it('should traverse an object several levels', () => {

        const schema = Joi.object({
            obj: Joi.object({
                obj: Joi.object({
                    obj: Joi.object({
                        item: Joi.boolean()
                    })
                })
            })
        });

        Helper.validate(schema, [
            [{ num: 1 }, false, null, {
                message: '"num" is not allowed',
                details: [{
                    message: '"num" is not allowed',
                    path: ['num'],
                    type: 'object.unknown',
                    context: { child: 'num', label: 'num', key: 'num', value: 1 }
                }]
            }],
            [{ obj: {} }, true],
            [{ obj: { obj: {} } }, true],
            [{ obj: { obj: { obj: {} } } }, true],
            [{ obj: { obj: { obj: { item: true } } } }, true],
            [{ obj: { obj: { obj: { item: 10 } } } }, false, null, {
                message: '"obj.obj.obj.item" must be a boolean',
                details: [{
                    message: '"obj.obj.obj.item" must be a boolean',
                    path: ['obj', 'obj', 'obj', 'item'],
                    type: 'boolean.base',
                    context: { label: 'obj.obj.obj.item', key: 'item', value: 10 }
                }]
            }]
        ]);
    });

    it('should traverse an object several levels with required levels', () => {

        const schema = Joi.object({
            obj: Joi.object({
                obj: Joi.object({
                    obj: Joi.object({
                        item: Joi.boolean()
                    })
                }).required()
            })
        });

        Helper.validate(schema, [
            [null, false, null, {
                message: '"value" must be of type object',
                details: [{
                    message: '"value" must be of type object',
                    path: [],
                    type: 'object.base',
                    context: { label: 'value', value: null, type: 'object' }
                }]
            }],
            [undefined, true],
            [{}, true],
            [{ obj: {} }, false, null, {
                message: '"obj.obj" is required',
                details: [{
                    message: '"obj.obj" is required',
                    path: ['obj', 'obj'],
                    type: 'any.required',
                    context: { label: 'obj.obj', key: 'obj' }
                }]
            }],
            [{ obj: { obj: {} } }, true],
            [{ obj: { obj: { obj: {} } } }, true],
            [{ obj: { obj: { obj: { item: true } } } }, true],
            [{ obj: { obj: { obj: { item: 10 } } } }, false, null, {
                message: '"obj.obj.obj.item" must be a boolean',
                details: [{
                    message: '"obj.obj.obj.item" must be a boolean',
                    path: ['obj', 'obj', 'obj', 'item'],
                    type: 'boolean.base',
                    context: { label: 'obj.obj.obj.item', key: 'item', value: 10 }
                }]
            }]
        ]);
    });

    it('should traverse an object several levels with required levels (without Joi.obj())', () => {

        const schema = {
            obj: {
                obj: {
                    obj: {
                        item: Joi.boolean().required()
                    }
                }
            }
        };

        Helper.validate(schema, [
            [null, false, null, {
                message: '"value" must be of type object',
                details: [{
                    message: '"value" must be of type object',
                    path: [],
                    type: 'object.base',
                    context: { label: 'value', value: null, type: 'object' }
                }]
            }],
            [undefined, true],
            [{}, true],
            [{ obj: {} }, true],
            [{ obj: { obj: {} } }, true],
            [{ obj: { obj: { obj: {} } } }, false, null, {
                message: '"obj.obj.obj.item" is required',
                details: [{
                    message: '"obj.obj.obj.item" is required',
                    path: ['obj', 'obj', 'obj', 'item'],
                    type: 'any.required',
                    context: { label: 'obj.obj.obj.item', key: 'item' }
                }]
            }],
            [{ obj: { obj: { obj: { item: true } } } }, true],
            [{ obj: { obj: { obj: { item: 10 } } } }, false, null, {
                message: '"obj.obj.obj.item" must be a boolean',
                details: [{
                    message: '"obj.obj.obj.item" must be a boolean',
                    path: ['obj', 'obj', 'obj', 'item'],
                    type: 'boolean.base',
                    context: { label: 'obj.obj.obj.item', key: 'item', value: 10 }
                }]
            }]
        ]);
    });

    it('errors on unknown keys when functions allows', () => {

        const schema = Joi.object({ a: Joi.number() }).prefs({ skipFunctions: true });
        const obj = { a: 5, b: 'value' };
        const err = schema.validate(obj).error;
        expect(err).to.be.an.error('"b" is not allowed');
        expect(err.details).to.equal([{
            message: '"b" is not allowed',
            path: ['b'],
            type: 'object.unknown',
            context: { child: 'b', label: 'b', key: 'b', value: 'value' }
        }]);
    });

    it('validates both valid() and with()', () => {

        const schema = Joi.object({
            first: Joi.valid('value'),
            second: Joi.any()
        }).with('first', 'second');

        Helper.validate(schema, [
            [{ first: 'value' }, false, null, {
                message: '"first" missing required peer "second"',
                details: [{
                    message: '"first" missing required peer "second"',
                    path: [],
                    type: 'object.with',
                    context: {
                        main: 'first',
                        mainWithLabel: 'first',
                        peer: 'second',
                        peerWithLabel: 'second',
                        label: 'value',
                        value: { first: 'value' }
                    }
                }]
            }]
        ]);
    });

    it('validates referenced arrays in valid()', () => {

        const ref = Joi.ref('$x');
        const schema = Joi.object({
            foo: Joi.valid(ref)
        });

        Helper.validate(schema, [
            [{ foo: 'bar' }, true, { context: { x: 'bar' } }],
            [{ foo: 'bar' }, true, { context: { x: ['baz', 'bar'] } }],
            [{ foo: 'bar' }, false, { context: { x: 'baz' } }, {
                message: '"foo" must be one of [ref:global:x]',
                details: [{
                    message: '"foo" must be one of [ref:global:x]',
                    path: ['foo'],
                    type: 'any.only',
                    context: { value: 'bar', valids: [ref], label: 'foo', key: 'foo' }
                }]
            }],
            [{ foo: 'bar' }, false, { context: { x: ['baz', 'qux'] } }, {
                message: '"foo" must be one of [ref:global:x]',
                details: [{
                    message: '"foo" must be one of [ref:global:x]',
                    path: ['foo'],
                    type: 'any.only',
                    context: { value: 'bar', valids: [ref], label: 'foo', key: 'foo' }
                }]
            }],
            [{ foo: 'bar' }, false, null, {
                message: '"foo" must be one of [ref:global:x]',
                details: [{
                    message: '"foo" must be one of [ref:global:x]',
                    path: ['foo'],
                    type: 'any.only',
                    context: { value: 'bar', valids: [ref], label: 'foo', key: 'foo' }
                }]
            }]
        ]);
    });

    it('errors on unknown nested keys with the correct path', () => {

        const schema = Joi.object({ a: Joi.object().keys({}) });
        const obj = { a: { b: 'value' } };
        const err = schema.validate(obj).error;
        expect(err).to.be.an.error('"a.b" is not allowed');
        expect(err.details).to.equal([{
            message: '"a.b" is not allowed',
            path: ['a', 'b'],
            type: 'object.unknown',
            context: { child: 'b', label: 'a.b', key: 'b', value: 'value' }
        }]);
    });

    it('errors on unknown nested keys with the correct path at the root level', () => {

        const schema = Joi.object({ a: Joi.object().keys({}) });
        const obj = { c: 'hello' };
        const err = schema.validate(obj).error;
        expect(err).to.be.an.error('"c" is not allowed');
        expect(err.details).to.equal([{
            message: '"c" is not allowed',
            path: ['c'],
            type: 'object.unknown',
            context: { child: 'c', label: 'c', key: 'c', value: 'hello' }
        }]);
    });

    it('should work on prototype-less objects', () => {

        const input = Object.create(null);
        const schema = Joi.object().keys({
            a: Joi.number()
        });

        input.a = 1337;

        expect(schema.validate(input).error).to.not.exist();
    });

    it('should be able to use rename safely with a fake hasOwnProperty', () => {

        const schema = Joi.object()
            .rename('b', 'a');

        const input = { b: 2, a: 1, hasOwnProperty: 'foo' };

        const err = schema.validate(input).error;
        expect(err).to.be.an.error('"value" cannot rename "b" because override is disabled and target "a" exists');
        expect(err.details).to.equal([{
            message: '"value" cannot rename "b" because override is disabled and target "a" exists',
            path: [],
            type: 'object.rename.override',
            context: { from: 'b', to: 'a', label: 'value', pattern: false, value: input }
        }]);
    });

    it('should be able to use object.with() safely with a fake hasOwnProperty', () => {

        const input = { a: 1, hasOwnProperty: 'foo' };
        const schema = Joi.object({ a: 1 }).with('a', 'b');

        const err = schema.validate(input, { abortEarly: false }).error;
        expect(err).to.be.an.error();
        expect(err).to.be.an.error('"hasOwnProperty" is not allowed. "a" missing required peer "b"');
        expect(err.details).to.equal([
            {
                message: '"hasOwnProperty" is not allowed',
                path: ['hasOwnProperty'],
                type: 'object.unknown',
                context: {
                    child: 'hasOwnProperty',
                    label: 'hasOwnProperty',
                    key: 'hasOwnProperty',
                    value: 'foo'
                }
            },
            {
                message: '"a" missing required peer "b"',
                path: [],
                type: 'object.with',
                context: {
                    main: 'a',
                    mainWithLabel: 'a',
                    peer: 'b',
                    peerWithLabel: 'b',
                    label: 'value',
                    value: input
                }
            }
        ]);
    });

    it('aborts early on unknown keys', () => {

        const input = { a: 1, unknown: 2 };
        const schema = Joi.object({ a: 1 }).with('a', 'b');

        expect(schema.validate(input).error).to.be.an.error('"unknown" is not allowed');
    });

    it('should apply labels with nested objects', () => {

        const schema = Joi.object({
            a: Joi.number().label('first'),
            b: Joi.object({
                c: Joi.string().label('second'),
                d: Joi.number()
            })
        })
            .with('a', ['b.c']);

        const error = schema.validate({ a: 1, b: { d: 2 } }).error;
        expect(error).to.be.an.error('"first" missing required peer "b.second"');
        expect(error.details).to.equal([{
            message: '"first" missing required peer "b.second"',
            path: [],
            type: 'object.with',
            context: {
                main: 'a',
                mainWithLabel: 'first',
                peer: 'b.c',
                peerWithLabel: 'b.second',
                label: 'value',
                value: { a: 1, b: { d: 2 } }
            }
        }]);
    });

    describe('and()', () => {

        it('should apply labels', () => {

            const schema = Joi.object({
                a: Joi.number().label('first'),
                b: Joi.string().label('second')
            }).and('a', 'b');
            const error = schema.validate({ a: 1 }).error;
            expect(error).to.be.an.error('"value" contains [first] without its required peers [second]');
            expect(error.details).to.equal([{
                message: '"value" contains [first] without its required peers [second]',
                path: [],
                type: 'object.and',
                context: {
                    present: ['a'],
                    presentWithLabels: ['first'],
                    missing: ['b'],
                    missingWithLabels: ['second'],
                    label: 'value',
                    value: { a: 1 }
                }
            }]);
        });

        it('allows nested objects', () => {

            const schema = Joi.object({
                a: Joi.string(),
                b: Joi.object({ c: Joi.string(), d: Joi.number() }),
                d: Joi.number()
            }).and('a', 'b.c');

            const sampleObject = { a: 'test', b: { c: 'test2' } };
            const sampleObject2 = { a: 'test', b: { d: 80 } };

            const error = schema.validate(sampleObject).error;
            expect(error).to.not.exist();

            const error2 = schema.validate(sampleObject2).error;
            expect(error2).to.be.an.error('"value" contains [a] without its required peers [b.c]');
            expect(error2.details).to.equal([{
                message: '"value" contains [a] without its required peers [b.c]',
                path: [],
                type: 'object.and',
                context: {
                    present: ['a'],
                    presentWithLabels: ['a'],
                    missing: ['b.c'],
                    missingWithLabels: ['b.c'],
                    label: 'value',
                    value: sampleObject2
                }
            }]);
        });

        it('allows nested keys in functions', () => {

            const schema = Joi.object({
                a: Joi.string(),
                b: Joi.func().keys({ c: Joi.string(), d: Joi.number() }),
                d: Joi.number()
            }).and('a', 'b.c');

            const sampleObject = { a: 'test', b: Object.assign(() => { }, { c: 'test2' }) };
            const sampleObject2 = { a: 'test', b: Object.assign(() => { }, { d: 80 }) };

            const error = schema.validate(sampleObject).error;
            expect(error).to.not.exist();

            const error2 = schema.validate(sampleObject2).error;
            expect(error2).to.be.an.error('"value" contains [a] without its required peers [b.c]');
            expect(error2.details).to.equal([{
                message: '"value" contains [a] without its required peers [b.c]',
                path: [],
                type: 'object.and',
                context: {
                    present: ['a'],
                    presentWithLabels: ['a'],
                    missing: ['b.c'],
                    missingWithLabels: ['b.c'],
                    label: 'value',
                    value: error2.details[0].context.value
                }
            }]);
        });

        it('should apply labels with nested objects', () => {

            const schema = Joi.object({
                a: Joi.number().label('first'),
                b: Joi.object({
                    c: Joi.string().label('second'),
                    d: Joi.number()
                })
            })
                .and('a', 'b.c');

            const error = schema.validate({ a: 1 }).error;
            expect(error).to.be.an.error('"value" contains [first] without its required peers [b.second]');
            expect(error.details).to.equal([{
                message: '"value" contains [first] without its required peers [b.second]',
                path: [],
                type: 'object.and',
                context: {
                    present: ['a'],
                    presentWithLabels: ['first'],
                    missing: ['b.c'],
                    missingWithLabels: ['b.second'],
                    label: 'value',
                    value: { a: 1 }
                }
            }]);
        });

        it('should apply labels with invalid nested peers', () => {

            const schema = Joi.object({
                a: Joi.number().label('first'),
                b: Joi.object({
                    c: Joi.string().label('second'),
                    d: Joi.number()
                })
            })
                .and('a', 'c.d');

            const error = schema.validate({ a: 1, b: { d: 1 } }).error;
            expect(error).to.be.an.error('"value" contains [first] without its required peers [c.d]');
            expect(error.details).to.equal([{
                message: '"value" contains [first] without its required peers [c.d]',
                path: [],
                type: 'object.and',
                context: {
                    present: ['a'],
                    presentWithLabels: ['first'],
                    missing: ['c.d'],
                    missingWithLabels: ['c.d'],
                    label: 'value',
                    value: { a: 1, b: { d: 1 } }
                }
            }]);
        });
    });

    describe('append()', () => {

        it('should append schema', () => {

            const schema = Joi.object()
                .keys({ a: Joi.string() })
                .append({ b: Joi.string() });

            expect(schema.validate({ a: 'x', b: 'y' }).error).to.not.exist();
        });

        it('should not change schema if it is null', () => {

            const schema = Joi.object()
                .keys({ a: Joi.string() })
                .append(null);

            expect(schema.validate({ a: 'x' }).error).to.not.exist();
        });

        it('should not change schema if it is undefined', () => {

            const schema = Joi.object()
                .keys({ a: Joi.string() })
                .append(undefined);

            expect(schema.validate({ a: 'x' }).error).to.not.exist();
        });

        it('should not change schema if it is empty-object', () => {

            const schema = Joi.object()
                .keys({ a: Joi.string() })
                .append({});

            expect(schema.validate({ a: 'x' }).error).to.not.exist();
        });
    });

    describe('assert()', () => {

        it('shows path to errors in schema', () => {

            expect(() => {

                Joi.object().assert('a.b', {
                    a: {
                        b: {
                            c: {
                                d: undefined
                            }
                        }
                    }
                });
            }).to.throw('Invalid schema content: (a.b.c.d)');
        });

        it('shows errors in schema', () => {

            expect(() => {

                Joi.object().assert('a.b', undefined);
            }).to.throw('Invalid schema content: ');
        });

        it('validates upwards reference', () => {

            const schema = Joi.object({
                a: {
                    b: Joi.string(),
                    c: Joi.number()
                },
                d: {
                    e: Joi.any()
                }
            }).assert(Joi.ref('d/e', { separator: '/' }), Joi.ref('a.c'), 'equal to a.c');

            expect(schema.validate({ a: { b: 'x', c: 5 }, d: { e: 6 } }).error).to.be.an.error('"value" is invalid because "d.e" failed to equal to a.c');

            Helper.validate(schema, [
                [{ a: { b: 'x', c: 5 }, d: { e: 5 } }, true]
            ]);
        });

        it('validates upwards reference with implicit context', () => {

            const schema = Joi.object({
                a: {
                    b: Joi.string(),
                    c: Joi.number()
                },
                d: {
                    e: Joi.any()
                }
            }).assert('d.e', Joi.ref('a.c'), 'equal to a.c');

            const err = schema.validate({ a: { b: 'x', c: 5 }, d: { e: 6 } }).error;
            expect(err).to.be.an.error('"value" is invalid because "d.e" failed to equal to a.c');
            expect(err.details).to.equal([{
                message: '"value" is invalid because "d.e" failed to equal to a.c',
                path: [],
                type: 'object.assert',
                context: { ref: 'd.e', message: 'equal to a.c', label: 'value', value: { a: { b: 'x', c: 5 }, d: { e: 6 } } }
            }]);

            Helper.validate(schema, [
                [{ a: { b: 'x', c: 5 }, d: { e: 5 } }, true]
            ]);
        });

        it('throws when context is at root level', () => {

            expect(() => {

                Joi.object({
                    a: {
                        b: Joi.string(),
                        c: Joi.number()
                    },
                    d: {
                        e: Joi.any()
                    }
                }).assert('a', Joi.ref('d.e'), 'equal to d.e');
            }).to.throw('Cannot use assertions for root level references - use direct key rules instead');
        });

        it('allows root level context ref', () => {

            expect(() => {

                Joi.object({
                    a: {
                        b: Joi.string(),
                        c: Joi.number()
                    },
                    d: {
                        e: Joi.any()
                    }
                }).assert('$a', Joi.ref('d.e'), 'equal to d.e');
            }).to.not.throw();
        });

        it('provides a default message for failed assertions', () => {

            const schema = Joi.object({
                a: {
                    b: Joi.string(),
                    c: Joi.number()
                },
                d: {
                    e: Joi.any()
                }
            }).assert('d.e', Joi.boolean());

            const err = schema.validate({ d: { e: [] } }).error;
            expect(err).to.be.an.error('"value" is invalid because "d.e" failed to pass the assertion test');
            expect(err.details).to.equal([{
                message: '"value" is invalid because "d.e" failed to pass the assertion test',
                path: [],
                type: 'object.assert',
                context: {
                    ref: 'd.e',
                    message: 'pass the assertion test',
                    label: 'value',
                    value: { d: { e: [] } }
                }
            }]);
        });

        it('works with keys()', () => {

            const schema = Joi.object({ a: { b: Joi.any() } })
                .min(2)
                .assert('a.b', Joi.number())
                .keys({ b: { c: Joi.any() } })
                .assert('b.c', Joi.number());

            expect(schema.validate({ a: { b: 1 }, b: { c: 2 } }).error).to.not.exist();
        });
    });

    describe('cast()', () => {

        it('casts value to map', () => {

            const schema = Joi.object({ a: Joi.number(), b: Joi.number() }).cast('map');
            expect(schema.validate({ a: '1', b: '2' }).value).to.equal(new Map([['a', 1], ['b', 2]]));
        });

        it('ignores null', () => {

            const schema = Joi.object({ a: Joi.number(), b: Joi.number() }).allow(null).cast('map');
            expect(schema.validate(null).value).to.be.null();
        });

        it('ignores string', () => {

            const schema = Joi.object({ a: Joi.number(), b: Joi.number() }).allow('x').cast('map');
            expect(schema.validate('x').value).to.equal('x');
        });

        it('does not leak casts to any', () => {

            expect(() => Joi.any().cast('map')).to.throw('Type any does not support casting to map');
        });
    });

    describe('describe()', () => {

        it('return empty description when no schema defined', () => {

            const schema = Joi.object();
            const desc = schema.describe();
            expect(desc).to.equal({
                type: 'object'
            });
        });

        it('describes patterns', () => {

            const schema = Joi.object({
                a: Joi.string()
            }).pattern(/\w\d/i, Joi.boolean());

            expect(schema.describe()).to.equal({
                type: 'object',
                keys: {
                    a: {
                        type: 'string'
                    }
                },
                patterns: [
                    {
                        regex: '/\\w\\d/i',
                        rule: {
                            type: 'boolean'
                        }
                    }
                ]
            });
        });

        it('describes patterns with schema', () => {

            const schema = Joi.object({
                a: Joi.string()
            }).pattern(Joi.string().uuid({ version: 'uuidv4' }), Joi.boolean());

            expect(schema.describe()).to.equal({
                type: 'object',
                keys: {
                    a: {
                        type: 'string'
                    }
                },
                patterns: [
                    {
                        schema: {
                            rules: [{
                                args: { options: { version: 'uuidv4' } },
                                name: 'guid'
                            }],
                            type: 'string'
                        },
                        rule: {
                            type: 'boolean'
                        }
                    }
                ]
            });
        });
    });

    describe('keys()', () => {

        it('allows any key', () => {

            const a = Joi.object({ a: 4 });
            const b = a.keys();
            const err = a.validate({ b: 3 }).error;
            expect(err).to.be.an.error('"b" is not allowed');
            expect(err.details).to.equal([{
                message: '"b" is not allowed',
                path: ['b'],
                type: 'object.unknown',
                context: { child: 'b', label: 'b', key: 'b', value: 3 }
            }]);

            expect(b.validate({ b: 3 }).error).to.not.exist();
        });

        it('forbids all keys', () => {

            const a = Joi.object();
            const b = a.keys({});
            expect(a.validate({ b: 3 }).error).to.not.exist();
            const err = b.validate({ b: 3 }).error;
            expect(err).to.be.an.error('"b" is not allowed');
            expect(err.details).to.equal([{
                message: '"b" is not allowed',
                path: ['b'],
                type: 'object.unknown',
                context: { child: 'b', label: 'b', key: 'b', value: 3 }
            }]);
        });

        it('adds to existing keys', () => {

            const a = Joi.object({ a: 1 });
            const b = a.keys({ b: 2 });
            const err = a.validate({ a: 1, b: 2 }).error;
            expect(err).to.be.an.error('"b" is not allowed');
            expect(err.details).to.equal([{
                message: '"b" is not allowed',
                path: ['b'],
                type: 'object.unknown',
                context: { child: 'b', label: 'b', key: 'b', value: 2 }
            }]);

            expect(b.validate({ a: 1, b: 2 }).error).to.not.exist();
        });

        it('overrides existing keys', () => {

            const a = Joi.object({ a: 1 });
            const b = a.keys({ a: Joi.string() });

            Helper.validate(a, [
                [{ a: 1 }, true, null, { a: 1 }],
                [{ a: '1' }, true, null, { a: 1 }],
                [{ a: '2' }, false, null, {
                    message: '"a" must be one of [1]',
                    details: [{
                        message: '"a" must be one of [1]',
                        path: ['a'],
                        type: 'any.only',
                        context: { value: 2, valids: [1], label: 'a', key: 'a' }
                    }]
                }]
            ]);

            Helper.validate(b, [
                [{ a: 1 }, false, null, {
                    message: '"a" must be a string',
                    details: [{
                        message: '"a" must be a string',
                        path: ['a'],
                        type: 'string.base',
                        context: { value: 1, label: 'a', key: 'a' }
                    }]
                }],
                [{ a: '1' }, true, null, { a: '1' }]
            ]);
        });

        it('strips keys flagged with strip', () => {

            const schema = Joi.object({
                a: Joi.string().strip(),
                b: Joi.string()
            });

            expect(schema.validate({ a: 'test', b: 'test' })).to.equal({ value: { b: 'test' } });
        });

        it('strips keys after validation', () => {

            const schema = Joi.object({
                a: Joi.string().strip(),
                b: Joi.string().default(Joi.ref('a'))
            });

            expect(schema.validate({ a: 'test' })).to.equal({ value: { b: 'test' } });
        });

        it('strips keys while preserving transformed values', () => {

            const ref = Joi.ref('a');
            const schema = Joi.object({
                a: Joi.number().strip(),
                b: Joi.number().min(ref)
            });

            const result = schema.validate({ a: '1', b: '2' });
            expect(result.error).to.not.exist();
            expect(result.value.a).to.not.exist();
            expect(result.value.b).to.equal(2);

            const result2 = schema.validate({ a: '1', b: '0' });
            expect(result2.error).to.be.an.error('"b" must be larger than or equal to ref:a');
            expect(result2.error.details).to.equal([{
                message: '"b" must be larger than or equal to ref:a',
                path: ['b'],
                type: 'number.min',
                context: { limit: ref, value: 0, label: 'b', key: 'b' }
            }]);
        });

        it('does not alter the original object when stripping keys', () => {

            const schema = Joi.object({
                a: Joi.string().strip(),
                b: Joi.string()
            });

            const valid = {
                a: 'test',
                b: 'test'
            };

            expect(schema.validate(valid)).to.equal({ value: { b: 'test' } });
            expect(valid.a).to.equal('test');
            expect(valid.b).to.equal('test');
        });

        it('should strip from an alternative', () => {

            const schema = Joi.object({
                a: [Joi.boolean().strip()]
            });

            expect(schema.validate({ a: true })).to.equal({ value: {} });
        });
    });

    describe('rename()', () => {

        it('allows renaming multiple times with multiple enabled', () => {

            const schema = Joi.object({
                test: Joi.string()
            }).rename('test1', 'test').rename('test2', 'test', { multiple: true });

            expect(Joi.compile(schema).validate({ test1: 'a', test2: 'b' }).error).to.not.exist();
        });

        it('errors renaming multiple times with multiple disabled', () => {

            const schema = Joi.object({
                test: Joi.string()
            }).rename('test1', 'test').rename('test2', 'test');

            const err = Joi.compile(schema).validate({ test1: 'a', test2: 'b' }).error;
            expect(err).to.be.an.error('"value" cannot rename "test2" because multiple renames are disabled and another key was already renamed to "test"');
            expect(err.details).to.equal([{
                message: '"value" cannot rename "test2" because multiple renames are disabled and another key was already renamed to "test"',
                path: [],
                type: 'object.rename.multiple',
                context: { from: 'test2', to: 'test', label: 'value', pattern: false, value: { test: 'a', test2: 'b' } }
            }]);
        });

        it('errors multiple times when abortEarly is false', () => {

            const schema = Joi.object()
                .rename('a', 'b')
                .rename('c', 'b')
                .rename('d', 'b')
                .prefs({ abortEarly: false });

            const err = schema.validate({ a: 1, c: 1, d: 1 }).error;
            expect(err).to.be.an.error('"value" cannot rename "c" because multiple renames are disabled and another key was already renamed to "b". "value" cannot rename "d" because multiple renames are disabled and another key was already renamed to "b"');
            expect(err.details).to.equal([
                {
                    message: '"value" cannot rename "c" because multiple renames are disabled and another key was already renamed to "b"',
                    path: [],
                    type: 'object.rename.multiple',
                    context: { from: 'c', to: 'b', label: 'value', pattern: false, value: { b: 1 } }
                },
                {
                    message: '"value" cannot rename "d" because multiple renames are disabled and another key was already renamed to "b"',
                    path: [],
                    type: 'object.rename.multiple',
                    context: { from: 'd', to: 'b', label: 'value', pattern: false, value: { b: 1 } }
                }
            ]);
        });

        it('aliases a key', () => {

            const schema = Joi.object({
                a: Joi.number(),
                b: Joi.number()
            }).rename('a', 'b', { alias: true });

            const obj = { a: 10 };
            expect(Joi.compile(schema).validate(obj)).to.equal({ value: { a: 10, b: 10 } });
        });

        it('with override disabled should not allow overwriting existing value', () => {

            const schema = Joi.object({
                test1: Joi.string()
            }).rename('test', 'test1');

            const err = schema.validate({ test: 'b', test1: 'a' }).error;
            expect(err).to.be.an.error('"value" cannot rename "test" because override is disabled and target "test1" exists');
            expect(err.details).to.equal([{
                message: '"value" cannot rename "test" because override is disabled and target "test1" exists',
                path: [],
                type: 'object.rename.override',
                context: { from: 'test', to: 'test1', label: 'value', pattern: false, value: { test: 'b', test1: 'a' } }
            }]);
        });

        it('with override enabled should allow overwriting existing value', () => {

            const schema = Joi.object({
                test1: Joi.string()
            }).rename('test', 'test1', { override: true });

            expect(schema.validate({ test: 'b', test1: 'a' }).error).to.not.exist();
        });

        it('renames when data is nested in an array via items', () => {

            const schema = {
                arr: Joi.array().items(Joi.object({
                    one: Joi.string(),
                    two: Joi.string()
                }).rename('uno', 'one').rename('dos', 'two'))
            };

            const data = { arr: [{ uno: '1', dos: '2' }] };
            expect(Joi.object(schema).validate(data)).to.equal({ value: { arr: [{ one: '1', two: '2' }] } });
        });

        it('applies rename and validation in the correct order regardless of key order', () => {

            const schema1 = Joi.object({
                a: Joi.number()
            }).rename('b', 'a');

            const input1 = { b: '5' };
            expect(schema1.validate(input1)).to.equal({ value: { a: 5 } });

            const schema2 = Joi.object({ a: Joi.number(), b: Joi.any() }).rename('b', 'a');
            const input2 = { b: '5' };
            expect(schema2.validate(input2)).to.equal({ value: { a: 5 } });
        });

        it('sets the default value after key is renamed', () => {

            const schema = Joi.object({
                foo2: Joi.string().default('test')
            }).rename('foo', 'foo2');

            const input = {};
            expect(schema.validate(input)).to.equal({ value: { foo2: 'test' } });
        });

        it('renames keys that are empty strings', () => {

            const schema = Joi.object().rename('', 'notEmpty');
            const input = {
                '': 'something'
            };

            expect(schema.validate(input)).to.equal({ value: { notEmpty: 'something' } });
        });

        it('should not create new keys when the key in question does not exist', () => {

            const schema = Joi.object()
                .rename('b', '_b');

            const input = {
                a: 'something'
            };

            expect(schema.validate(input)).to.equal({ value: input });
        });

        it('ignores a key with ignoredUndefined if from does not exist', () => {

            const schema = Joi.object().rename('b', 'a', { ignoreUndefined: true });

            const input = {
                a: 'something'
            };

            expect(schema.validate(input)).to.equal({ value: { a: 'something' } });
        });

        it('deletes a key with override and ignoredUndefined if from exists', () => {

            const schema = Joi.object()
                .rename('b', 'a', { ignoreUndefined: true, override: true });

            const input = {
                a: 'something',
                b: 'something else'
            };

            expect(schema.validate(input)).to.equal({ value: { a: 'something else' } });
        });

        it('deletes a key with override if present and undefined', () => {

            const schema = Joi.object()
                .rename('b', 'a', { override: true });

            const input = {
                a: 'something',
                b: undefined
            };

            expect(schema.validate(input)).to.equal({ value: {} });
        });

        it('leaves target if source is present and undefined and ignoreUndefined is set', () => {

            const schema = Joi.object()
                .rename('b', 'a', { override: true, ignoreUndefined: true });

            const input = {
                a: 'something',
                b: undefined
            };

            expect(schema.validate(input)).to.equal({ value: input });
        });

        it('should fulfill describe() with defaults', () => {

            const schema = Joi.object().rename('b', 'a');
            const desc = schema.describe();

            expect(desc).to.equal({
                type: 'object',
                renames: [{
                    from: 'b',
                    to: 'a',
                    options: {
                        alias: false,
                        multiple: false,
                        override: false
                    }
                }]
            });
        });

        it('should fulfill describe() with non-defaults', () => {

            const schema = Joi.object().rename('b', 'a', { alias: true, multiple: true, override: true });
            const desc = schema.describe();

            expect(desc).to.equal({
                type: 'object',
                renames: [{
                    from: 'b',
                    to: 'a',
                    options: {
                        alias: true,
                        multiple: true,
                        override: true
                    }
                }]
            });
        });

        it('should leave key if from does not exist regardless of override', () => {

            const schema = Joi.object()
                .rename('b', 'a', { override: true });

            const input = {
                a: 'something'
            };

            expect(schema.validate(input)).to.equal({ value: input });
        });

        describe('using regex', () => {

            it('renames using a regular expression', () => {

                const regex = /foobar/i;

                const schema = Joi.object({
                    fooBar: Joi.string()
                }).rename(regex, 'fooBar');

                expect(Joi.compile(schema).validate({ FOOBAR: 'a' }).error).to.not.exist();
            });

            it('aliases a key', () => {

                const regex = /^a$/i;

                const schema = Joi.object({
                    other: Joi.any(),
                    A: Joi.number(),
                    b: Joi.number(),
                    c: Joi.number()
                }).rename(regex, 'b', { alias: true });

                expect(Joi.compile(schema).validate({ other: 'here', A: 100, c: 50 })).to.equal({ value: { other: 'here', A: 100, b: 100, c: 50 } });
            });

            it('uses template', () => {

                const schema = Joi.object()
                    .rename(/^(\d+)$/, Joi.x('x{#1}x'))
                    .pattern(/^x\d+x$/, Joi.any());

                const input = {
                    123: 'x',
                    1: 'y',
                    0: 'z',
                    x4x: 'test'
                };

                expect(Joi.compile(schema).validate(input)).to.equal({
                    value: {
                        x123x: 'x',
                        x1x: 'y',
                        x0x: 'z',
                        x4x: 'test'
                    }
                });

                expect(schema.describe()).to.equal({
                    type: 'object',
                    patterns: [{
                        regex: '/^x\\d+x$/',
                        rule: { type: 'any' }
                    }],
                    renames: [{
                        from: { regex: '/^(\\d+)$/' },
                        to: {
                            template: 'x{#1}x'
                        },
                        options: {
                            alias: false,
                            multiple: false,
                            override: false
                        }
                    }]
                });
            });

            it('uses template with prefix override', () => {

                const schema = Joi.object()
                    .rename(/^(\d+)$/, Joi.x('x{@1}x', { prefix: { local: '@' } }))
                    .pattern(/^x\d+x$/, Joi.any());

                const input = {
                    123: 'x',
                    1: 'y',
                    0: 'z',
                    x4x: 'test'
                };

                expect(Joi.compile(schema).validate(input)).to.equal({
                    value: {
                        x123x: 'x',
                        x1x: 'y',
                        x0x: 'z',
                        x4x: 'test'
                    }
                });

                expect(schema.describe()).to.equal({
                    type: 'object',
                    patterns: [{
                        regex: '/^x\\d+x$/',
                        rule: { type: 'any' }
                    }],
                    renames: [{
                        from: { regex: '/^(\\d+)$/' },
                        to: {
                            template: 'x{@1}x',
                            options: { prefix: { local: '@' } }
                        },
                        options: {
                            alias: false,
                            multiple: false,
                            override: false
                        }
                    }]
                });
            });

            it('uses template that references another sibling key', () => {

                const schema = Joi.object({
                    prefix: Joi.string().lowercase().required()
                })
                    .rename(/^(\d+)$/, Joi.x('{.prefix}{#1}'))
                    .unknown();

                const input = {
                    123: 'x',
                    1: 'y',
                    0: 'z',
                    prefix: 'TEST'
                };

                expect(Joi.compile(schema).validate(input)).to.equal({
                    value: {
                        TEST123: 'x',
                        TEST1: 'y',
                        TEST0: 'z',
                        prefix: 'test'
                    }
                });
            });

            it('uses template that references peer key', () => {

                const schema = Joi.object({
                    a: Joi.object()
                        .rename(/^(\d+)$/, Joi.x('{b.prefix}{#1}'))
                        .unknown(),
                    b: {
                        prefix: Joi.string().lowercase()
                    }
                });

                Helper.validate(schema, [
                    [{ a: { 5: 'x' }, b: { prefix: 'p' } }, true, null, { a: { p5: 'x' }, b: { prefix: 'p' } }],
                    [{ a: { 5: 'x' }, b: { prefix: 'P' } }, true, null, { a: { p5: 'x' }, b: { prefix: 'p' } }],
                    [{ b: { prefix: 'P' }, a: { 5: 'x' } }, true, null, { a: { p5: 'x' }, b: { prefix: 'p' } }],
                    [{ b: {}, a: { 5: 'x' } }, true, null, { a: { 5: 'x' }, b: {} }],
                    [{ a: { 5: 'x' } }, true, null, { a: { 5: 'x' } }]
                ]);
            });

            it('uses template without refs', () => {

                const schema = Joi.object()
                    .rename(/^(\d+)$/, Joi.x('x'))
                    .unknown();

                expect(Joi.compile(schema).validate({ 1: 'x' })).to.equal({ value: { x: 'x' } });
            });

            it('deletes a key with override if present and undefined', () => {

                const schema = Joi.object()
                    .rename(/b/, 'a', { override: true });

                const input = {
                    a: 'something',
                    b: undefined
                };

                expect(schema.validate(input)).to.equal({ value: {} });
            });

            it('with override disabled it should not allow overwriting existing value', () => {

                const schema = Joi.object({
                    test1: Joi.string()
                })
                    .rename(/^test1$/i, 'test');

                const item = {
                    test: 'b',
                    test1: 'a'
                };

                const err = Joi.compile(schema).validate(item).error;
                expect(err).to.be.an.error('"value" cannot rename "test1" because override is disabled and target "test" exists');
                expect(err.details).to.equal([{
                    message: '"value" cannot rename "test1" because override is disabled and target "test" exists',
                    path: [],
                    type: 'object.rename.override',
                    context: { from: 'test1', to: 'test', label: 'value', pattern: true, value: item }
                }]);
            });

            it('with override enabled should allow overwriting existing value', () => {

                const regex = /^test$/i;

                const schema = Joi.object({
                    test1: Joi.string()
                }).rename(regex, 'test1', { override: true });

                expect(schema.validate({ test: 'b', test1: 'a' }).error).to.not.exist();
            });

            it('renames when data is nested in an array via items', () => {

                const regex1 = /^uno$/i;
                const regex2 = /^dos$/i;

                const schema = {
                    arr: Joi.array().items(Joi.object({
                        one: Joi.string(),
                        two: Joi.string()
                    }).rename(regex1, 'one').rename(regex2, 'two'))
                };

                const data = { arr: [{ uno: '1', dos: '2' }] };
                expect(Joi.object(schema).validate(data)).to.equal({ value: { arr: [{ one: '1', two: '2' }] } });
            });

            it('skips when existing name matches', () => {

                const regex = /^abc$/i;

                const schema = Joi.object({ abc: Joi.string() }).rename(regex, 'abc', { override: true });

                expect(schema.validate({ ABC: 'x' })).to.equal({ value: { abc: 'x' } });
                expect(schema.validate({ abc: 'x' })).to.equal({ value: { abc: 'x' } });
            });

            it('applies rename and validation in the correct order regardless of key order', () => {

                const regex = /^b$/i;

                const schema1 = Joi.object({
                    a: Joi.number()
                }).rename(regex, 'a');

                const input1 = { b: '5' };
                expect(schema1.validate(input1)).to.equal({ value: { a: 5 } });

                const schema2 = Joi.object({ a: Joi.number(), b: Joi.any() }).rename('b', 'a');
                const input2 = { b: '5' };
                expect(schema2.validate(input2)).to.equal({ value: { a: 5 } });
            });

            it('sets the default value after key is renamed', () => {

                const regex = /^foo$/i;

                const schema = Joi.object({
                    foo2: Joi.string().default('test')
                }).rename(regex, 'foo2');

                const input = {};
                expect(schema.validate(input)).to.equal({ value: { foo2: 'test' } });
            });

            it('should not create new keys when the key in question does not exist', () => {

                const schema = Joi.object()
                    .rename(/^b$/i, '_b');

                const input = {
                    a: 'something'
                };

                expect(schema.validate(input)).to.equal({ value: { a: 'something' } });
            });

            it('should leave key if from does not exist regardless of override', () => {

                const schema = Joi.object()
                    .rename(/^b$/i, 'a', { override: true });

                const input = {
                    a: 'something'
                };

                expect(schema.validate(input)).to.equal({ value: input });
            });

            it('skips when all matches are undefined and ignoredUndefined is true', () => {

                const schema = Joi.object().keys({
                    a: Joi.any(),
                    b: Joi.any()
                })
                    .rename(/^b$/i, 'a', { ignoreUndefined: true });

                const input = {
                    b: undefined
                };

                expect(schema.validate(input)).to.equal({ value: { b: undefined } });
            });

            it('deletes a key with override and ignoredUndefined if from exists', () => {

                const schema = Joi.object().keys({
                    c: Joi.any(),
                    a: Joi.any()
                })
                    .rename(/^b$/, 'a', { ignoreUndefined: true, override: true });

                const input = {
                    a: 'something',
                    b: 'something else'
                };

                expect(schema.validate(input)).to.equal({ value: { a: 'something else' } });
            });

            it('should fulfill describe() with non-defaults', () => {

                const regex = /^b$/i;

                const schema = Joi.object().rename(regex, 'a', { alias: true, multiple: true, override: true });
                const desc = schema.describe();

                expect(desc).to.equal({
                    type: 'object',
                    renames: [{
                        from: { regex: regex.toString() },
                        to: 'a',
                        options: {
                            alias: true,
                            multiple: true,
                            override: true
                        }
                    }]
                });
            });

            it('should fulfill describe() with defaults', () => {

                const regex = /^b$/i;

                const schema = Joi.object().rename(regex, 'a');
                const desc = schema.describe();

                expect(desc).to.equal({
                    type: 'object',
                    renames: [{
                        from: { regex: regex.toString() },
                        to: 'a',
                        options: {
                            alias: false,
                            multiple: false,
                            override: false
                        }
                    }]
                });
            });

            it('allows renaming multiple times with multiple enabled', () => {

                const schema = Joi.object({
                    fooBar: Joi.string()
                }).rename(/foobar/i, 'fooBar', { multiple: true });

                expect(Joi.compile(schema).validate({ FOOBAR: 'a', FooBar: 'b' })).to.equal({ value: { fooBar: 'b' } });
            });

            it('errors renaming multiple times with multiple disabled', () => {

                const schema = Joi.object({
                    fooBar: Joi.string()
                })
                    .rename(/foobar/i, 'fooBar')
                    .rename(/foobar/i, 'fooBar');

                const err = Joi.compile(schema).validate({ FOOBAR: 'a', FooBar: 'b' }).error;
                expect(err.message).to.equal('"value" cannot rename "FooBar" because multiple renames are disabled and another key was already renamed to "fooBar"');
                expect(err.details).to.equal([{
                    message: '"value" cannot rename "FooBar" because multiple renames are disabled and another key was already renamed to "fooBar"',
                    path: [],
                    type: 'object.rename.multiple',
                    context: { from: 'FooBar', to: 'fooBar', label: 'value', pattern: true, value: { FooBar: 'b', fooBar: 'a' } }
                }]);
            });

            it('errors multiple times when abortEarly is false', () => {

                const schema = Joi.object({
                    z: Joi.string()
                })
                    .rename(/a/i, 'b')
                    .rename(/c/i, 'b')
                    .rename(/z/i, 'z')
                    .prefs({ abortEarly: false });

                const err = schema.validate({ a: 1, c: 1, d: 1, z: 1 }).error;
                expect(err).to.be.an.error('"value" cannot rename "c" because multiple renames are disabled and another key was already renamed to "b". "z" must be a string. "d" is not allowed. "b" is not allowed');
                expect(err.details).to.equal([
                    {
                        message: '"value" cannot rename "c" because multiple renames are disabled and another key was already renamed to "b"',
                        path: [],
                        type: 'object.rename.multiple',
                        context: { from: 'c', to: 'b', label: 'value', pattern: true, value: { b: 1, d: 1, z: 1 } }
                    },
                    {
                        message: '"z" must be a string',
                        path: ['z'],
                        type: 'string.base',
                        context: { value: 1, key: 'z', label: 'z' }
                    },
                    {
                        message: '"d" is not allowed',
                        path: ['d'],
                        type: 'object.unknown',
                        context: { child: 'd', key: 'd', label: 'd', value: 1 }
                    },
                    {
                        message: '"b" is not allowed',
                        path: ['b'],
                        type: 'object.unknown',
                        context: { child: 'b', key: 'b', label: 'b', value: 1 }
                    }
                ]);
            });
        });
    });

    describe('length()', () => {

        it('throws when length is not a number', () => {

            expect(() => {

                Joi.object().length('a');
            }).to.throw('limit must be a positive integer or reference');
        });
    });

    describe('max()', () => {

        it('throws when limit is not a number', () => {

            expect(() => {

                Joi.object().max('a');
            }).to.throw('limit must be a positive integer or reference');
        });
    });

    describe('min()', () => {

        it('throws when limit is not a number', () => {

            expect(() => {

                Joi.object().min('a');
            }).to.throw('limit must be a positive integer or reference');
        });
    });

    describe('nand()', () => {

        it('should apply labels', () => {

            const schema = Joi.object({
                a: Joi.number().label('first'),
                b: Joi.string().label('second')
            }).nand('a', 'b');
            const error = schema.validate({ a: 1, b: 'b' }).error;
            expect(error).to.be.an.error('"first" must not exist simultaneously with [second]');
            expect(error.details).to.equal([{
                message: '"first" must not exist simultaneously with [second]',
                path: [],
                type: 'object.nand',
                context: {
                    main: 'a',
                    mainWithLabel: 'first',
                    peers: ['b'],
                    peersWithLabels: ['second'],
                    label: 'value',
                    value: { a: 1, b: 'b' }
                }
            }]);
        });

        it('allows nested objects', () => {

            const schema = Joi.object({
                a: Joi.string(),
                b: Joi.object({ c: Joi.string(), d: Joi.number() }),
                d: Joi.number()
            }).nand('a', 'b.c');

            const sampleObject = { a: 'test', b: { d: 80 } };
            const sampleObject2 = { a: 'test', b: { c: 'test2' } };

            const error = schema.validate(sampleObject).error;
            expect(error).to.not.exist();

            const error2 = schema.validate(sampleObject2).error;
            expect(error2).to.be.an.error('"a" must not exist simultaneously with [b.c]');
            expect(error2.details).to.equal([{
                message: '"a" must not exist simultaneously with [b.c]',
                path: [],
                type: 'object.nand',
                context: {
                    main: 'a',
                    mainWithLabel: 'a',
                    peers: ['b.c'],
                    peersWithLabels: ['b.c'],
                    label: 'value',
                    value: sampleObject2
                }
            }]);
        });

        it('allows nested keys in functions', () => {

            const schema = Joi.object({
                a: Joi.string(),
                b: Joi.func().keys({ c: Joi.string(), d: Joi.number() }),
                d: Joi.number()
            })
                .nand('a', 'b.c');

            const sampleObject = { a: 'test', b: Object.assign(() => { }, { d: 80 }) };
            const sampleObject2 = { a: 'test', b: Object.assign(() => { }, { c: 'test2' }) };

            const error = schema.validate(sampleObject).error;
            expect(error).to.not.exist();

            const error2 = schema.validate(sampleObject2).error;
            expect(error2).to.be.an.error('"a" must not exist simultaneously with [b.c]');
            expect(error2.details).to.equal([{
                message: '"a" must not exist simultaneously with [b.c]',
                path: [],
                type: 'object.nand',
                context: {
                    main: 'a',
                    mainWithLabel: 'a',
                    peers: ['b.c'],
                    peersWithLabels: ['b.c'],
                    label: 'value',
                    value: error2.details[0].context.value
                }
            }]);
        });

        it('should apply labels with nested objects', () => {

            const schema = Joi.object({
                a: Joi.number().label('first'),
                b: Joi.object({
                    c: Joi.string().label('second'),
                    d: Joi.number()
                })
            })
                .nand('a', 'b.c');

            const error = schema.validate({ a: 1, b: { c: 'c' } }).error;
            expect(error).to.be.an.error('"first" must not exist simultaneously with [b.second]');
            expect(error.details).to.equal([{
                message: '"first" must not exist simultaneously with [b.second]',
                path: [],
                type: 'object.nand',
                context: {
                    main: 'a',
                    mainWithLabel: 'first',
                    peers: ['b.c'],
                    peersWithLabels: ['b.second'],
                    label: 'value',
                    value: { a: 1, b: { c: 'c' } }
                }
            }]);
        });
    });

    describe('or()', () => {

        it('errors when a parameter is not a string', () => {

            let error;
            try {
                Joi.object().or({});
                error = false;
            }
            catch (e) {
                error = true;
            }

            expect(error).to.equal(true);

            try {
                Joi.object().or(123);
                error = false;
            }
            catch (e) {
                error = true;
            }

            expect(error).to.equal(true);
        });

        it('errors multiple levels deep', () => {

            const schema = Joi.object({
                a: {
                    b: Joi.object().or('x', 'y')
                }
            });

            const err = schema.validate({ a: { b: { c: 1 } } }).error;
            expect(err).to.be.an.error('"a.b" must contain at least one of [x, y]');
            expect(err.details).to.equal([{
                message: '"a.b" must contain at least one of [x, y]',
                path: ['a', 'b'],
                type: 'object.missing',
                context: {
                    peers: ['x', 'y'],
                    peersWithLabels: ['x', 'y'],
                    label: 'a.b',
                    key: 'b',
                    value: { c: 1 }
                }
            }]);
        });

        it('should apply labels', () => {

            const schema = Joi.object({
                a: Joi.number().label('first'),
                b: Joi.string().label('second')
            }).or('a', 'b');
            const error = schema.validate({}).error;
            expect(error).to.be.an.error('"value" must contain at least one of [first, second]');
            expect(error.details).to.equal([{
                message: '"value" must contain at least one of [first, second]',
                path: [],
                type: 'object.missing',
                context: {
                    peers: ['a', 'b'],
                    peersWithLabels: ['first', 'second'],
                    label: 'value',
                    value: {}
                }
            }]);
        });

        it('allows nested objects', () => {

            const schema = Joi.object({
                a: Joi.string(),
                b: Joi.object({ c: Joi.string() }),
                d: Joi.number()
            }).or('a', 'b.c');

            const sampleObject = { b: { c: 'bc' } };
            const sampleObject2 = { d: 90 };

            const error = schema.validate(sampleObject).error;
            expect(error).to.not.exist();

            const error2 = schema.validate(sampleObject2).error;
            expect(error2).to.be.an.error('"value" must contain at least one of [a, b.c]');
            expect(error2.details).to.equal([{
                message: '"value" must contain at least one of [a, b.c]',
                path: [],
                type: 'object.missing',
                context: {
                    peers: ['a', 'b.c'],
                    peersWithLabels: ['a', 'b.c'],
                    label: 'value',
                    value: sampleObject2
                }
            }]);
        });

        it('allows nested keys in functions', () => {

            const schema = Joi.object({
                a: Joi.string(),
                b: Joi.func().keys({ c: Joi.string() }),
                d: Joi.number()
            }).or('a', 'b.c');

            const sampleObject = { b: Object.assign(() => { }, { c: 'bc' }) };
            const sampleObject2 = { d: 90 };

            const error = schema.validate(sampleObject).error;
            expect(error).to.not.exist();

            const error2 = schema.validate(sampleObject2).error;
            expect(error2).to.be.an.error('"value" must contain at least one of [a, b.c]');
            expect(error2.details).to.equal([{
                message: '"value" must contain at least one of [a, b.c]',
                path: [],
                type: 'object.missing',
                context: {
                    peers: ['a', 'b.c'],
                    peersWithLabels: ['a', 'b.c'],
                    label: 'value',
                    value: sampleObject2
                }
            }]);
        });

        it('should apply labels with nested objects', () => {

            const schema = Joi.object({
                a: Joi.number().label('first'),
                b: Joi.object({
                    c: Joi.string().label('second'),
                    d: Joi.number()
                })
            })
                .or('a', 'b.c');

            const error = schema.validate({}).error;
            expect(error).to.be.an.error('"value" must contain at least one of [first, b.second]');
            expect(error.details).to.equal([{
                message: '"value" must contain at least one of [first, b.second]',
                path: [],
                type: 'object.missing',
                context: {
                    peers: ['a', 'b.c'],
                    peersWithLabels: ['first', 'b.second'],
                    label: 'value',
                    value: {}
                }
            }]);
        });
    });

    describe('oxor()', () => {

        it('errors when a parameter is not a string', () => {

            let error;
            try {
                Joi.object().oxor({});
                error = false;
            }
            catch (e) {
                error = true;
            }

            expect(error).to.equal(true);

            try {
                Joi.object().oxor(123);
                error = false;
            }
            catch (e) {
                error = true;
            }

            expect(error).to.equal(true);
        });

        it('allows none of optional peers', () => {

            const schema = Joi.object({
                a: Joi.number(),
                b: Joi.string()
            }).oxor('a', 'b');

            const error = schema.validate({}).error;
            expect(error).to.not.exist();
        });

        it('should apply labels with too many peers', () => {

            const schema = Joi.object({
                a: Joi.number().label('first'),
                b: Joi.string().label('second')
            }).oxor('a', 'b');
            const error = schema.validate({ a: 1, b: 'b' }).error;
            expect(error).to.be.an.error('"value" contains a conflict between optional exclusive peers [first, second]');
            expect(error.details).to.equal([{
                message: '"value" contains a conflict between optional exclusive peers [first, second]',
                path: [],
                type: 'object.oxor',
                context: {
                    peers: ['a', 'b'],
                    peersWithLabels: ['first', 'second'],
                    present: ['a', 'b'],
                    presentWithLabels: ['first', 'second'],
                    label: 'value',
                    value: { a: 1, b: 'b' }
                }
            }]);
        });

        it('allows nested objects', () => {

            const schema = Joi.object({
                a: Joi.string(),
                b: Joi.object({ c: Joi.string(), d: Joi.number() }),
                d: Joi.number()
            }).oxor('a', 'b.c');

            const sampleObject = { a: 'test', b: { d: 80 } };
            const sampleObject2 = { a: 'test', b: { c: 'test2' } };

            const error = schema.validate(sampleObject).error;
            expect(error).to.not.exist();

            const error2 = schema.validate(sampleObject2).error;
            expect(error2).to.be.an.error('"value" contains a conflict between optional exclusive peers [a, b.c]');
            expect(error2.details).to.equal([{
                message: '"value" contains a conflict between optional exclusive peers [a, b.c]',
                path: [],
                type: 'object.oxor',
                context: {
                    peers: ['a', 'b.c'],
                    peersWithLabels: ['a', 'b.c'],
                    present: ['a', 'b.c'],
                    presentWithLabels: ['a', 'b.c'],
                    label: 'value',
                    value: sampleObject2
                }
            }]);
        });

        it('allows nested keys in functions', () => {

            const schema = Joi.object({
                a: Joi.string(),
                b: Joi.func().keys({ c: Joi.string(), d: Joi.number() }),
                d: Joi.number()
            }).oxor('a', 'b.c');

            const sampleObject = { a: 'test', b: Object.assign(() => { }, { d: 80 }) };
            const sampleObject2 = { a: 'test', b: Object.assign(() => { }, { c: 'test2' }) };

            const error = schema.validate(sampleObject).error;
            expect(error).to.not.exist();

            const error2 = schema.validate(sampleObject2).error;
            expect(error2).to.be.an.error('"value" contains a conflict between optional exclusive peers [a, b.c]');
            expect(error2.details).to.equal([{
                message: '"value" contains a conflict between optional exclusive peers [a, b.c]',
                path: [],
                type: 'object.oxor',
                context: {
                    peers: ['a', 'b.c'],
                    peersWithLabels: ['a', 'b.c'],
                    present: ['a', 'b.c'],
                    presentWithLabels: ['a', 'b.c'],
                    label: 'value',
                    value: error2.details[0].context.value
                }
            }]);
        });
    });

    describe('pattern()', () => {

        it('shows path to errors in schema', () => {

            expect(() => {

                Joi.object().pattern(/.*/, {
                    a: {
                        b: {
                            c: {
                                d: undefined
                            }
                        }
                    }
                });
            }).to.throw('Invalid schema content: (a.b.c.d)');

            expect(() => {

                Joi.object().pattern(/.*/, () => {

                });
            }).to.throw('Invalid schema content: ');

        });

        it('validates unknown keys using a regex pattern', () => {

            const schema = Joi.object({
                a: Joi.number()
            }).pattern(/\d+/, Joi.boolean()).pattern(/\w\w+/, 'x');

            const err = schema.validate({ bb: 'y', 5: 'x' }, { abortEarly: false }).error;
            expect(err).to.be.an.error('"5" must be a boolean. "bb" must be one of [x]');
            expect(err.details).to.equal([
                {
                    message: '"5" must be a boolean',
                    path: ['5'],
                    type: 'boolean.base',
                    context: { label: '5', key: '5', value: 'x' }
                },
                {
                    message: '"bb" must be one of [x]',
                    path: ['bb'],
                    type: 'any.only',
                    context: { value: 'y', valids: ['x'], label: 'bb', key: 'bb' }
                }
            ]);

            Helper.validate(schema, [
                [{ a: 5 }, true],
                [{ a: 'x' }, false, null, {
                    message: '"a" must be a number',
                    details: [{
                        message: '"a" must be a number',
                        path: ['a'],
                        type: 'number.base',
                        context: { label: 'a', key: 'a', value: 'x' }
                    }]
                }],
                [{ b: 'x' }, false, null, {
                    message: '"b" is not allowed',
                    details: [{
                        message: '"b" is not allowed',
                        path: ['b'],
                        type: 'object.unknown',
                        context: { child: 'b', label: 'b', key: 'b', value: 'x' }
                    }]
                }],
                [{ bb: 'x' }, true],
                [{ 5: 'x' }, false, null, {
                    message: '"5" must be a boolean',
                    details: [{
                        message: '"5" must be a boolean',
                        path: ['5'],
                        type: 'boolean.base',
                        context: { label: '5', key: '5', value: 'x' }
                    }]
                }],
                [{ 5: false }, true],
                [{ 5: undefined }, true]
            ]);
        });

        it('validates unknown keys using a schema pattern', () => {

            const schema = Joi.object({
                a: Joi.number()
            }).pattern(Joi.number().positive(), Joi.boolean())
                .pattern(Joi.string().length(2), 'x');

            const err = schema.validate({ bb: 'y', 5: 'x' }, { abortEarly: false }).error;
            expect(err).to.be.an.error('"5" must be a boolean. "bb" must be one of [x]');
            expect(err.details).to.equal([
                {
                    message: '"5" must be a boolean',
                    path: ['5'],
                    type: 'boolean.base',
                    context: { label: '5', key: '5', value: 'x' }
                },
                {
                    message: '"bb" must be one of [x]',
                    path: ['bb'],
                    type: 'any.only',
                    context: { value: 'y', valids: ['x'], label: 'bb', key: 'bb' }
                }
            ]);

            Helper.validate(schema, [
                [{ a: 5 }, true],
                [{ a: 'x' }, false, null, {
                    message: '"a" must be a number',
                    details: [{
                        message: '"a" must be a number',
                        path: ['a'],
                        type: 'number.base',
                        context: { label: 'a', key: 'a', value: 'x' }
                    }]
                }],
                [{ b: 'x' }, false, null, {
                    message: '"b" is not allowed',
                    details: [{
                        message: '"b" is not allowed',
                        path: ['b'],
                        type: 'object.unknown',
                        context: { child: 'b', label: 'b', key: 'b', value: 'x' }
                    }]
                }],
                [{ bb: 'x' }, true],
                [{ 5: 'x' }, false, null, {
                    message: '"5" must be a boolean',
                    details: [{
                        message: '"5" must be a boolean',
                        path: ['5'],
                        type: 'boolean.base',
                        context: { label: '5', key: '5', value: 'x' }
                    }]
                }],
                [{ 5: false }, true],
                [{ 5: undefined }, true]
            ]);
        });

        it('validates unknown keys using a schema pattern with a reference', () => {

            const schema = Joi.object({
                a: Joi.string(),
                b: Joi.object().pattern(Joi.valid(Joi.ref('a')), Joi.boolean())
            });

            Helper.validate(schema, [
                [{ a: 'x' }, true],
                [{ a: 5 }, false, null, {
                    message: '"a" must be a string',
                    details: [{
                        message: '"a" must be a string',
                        path: ['a'],
                        type: 'string.base',
                        context: { label: 'a', key: 'a', value: 5 }
                    }]
                }],
                [{ b: 'x' }, false, null, {
                    message: '"b" must be of type object',
                    details: [{
                        message: '"b" must be of type object',
                        path: ['b'],
                        type: 'object.base',
                        context: { label: 'b', key: 'b', value: 'x', type: 'object' }
                    }]
                }],
                [{ b: {} }, true],
                [{ b: { foo: true } }, false, null, {
                    message: '"b.foo" is not allowed',
                    details: [{
                        message: '"b.foo" is not allowed',
                        path: ['b', 'foo'],
                        type: 'object.unknown',
                        context: { child: 'foo', value: true, key: 'foo', label: 'b.foo' }
                    }]
                }],
                [{ a: 'x', b: { foo: true } }, false, null, {
                    message: '"b.foo" is not allowed',
                    details: [{
                        message: '"b.foo" is not allowed',
                        path: ['b', 'foo'],
                        type: 'object.unknown',
                        context: { child: 'foo', value: true, key: 'foo', label: 'b.foo' }
                    }]
                }],
                [{ a: 'x', b: { x: 'y' } }, false, null, {
                    message: '"b.x" must be a boolean',
                    details: [{
                        message: '"b.x" must be a boolean',
                        path: ['b', 'x'],
                        type: 'boolean.base',
                        context: { value: 'y', key: 'x', label: 'b.x' }
                    }]
                }]
            ]);
        });

        it('validates unknown keys using a pattern (nested)', () => {

            const schema = Joi.object({
                x: Joi.object({
                    a: Joi.number()
                }).pattern(/\d+/, Joi.boolean()).pattern(/\w\w+/, 'x')
            });

            const err = schema.validate({
                x: {
                    bb: 'y',
                    5: 'x'
                }
            }, { abortEarly: false }).error;
            expect(err).to.be.an.error('"x.5" must be a boolean. "x.bb" must be one of [x]');
            expect(err.details).to.equal([
                {
                    message: '"x.5" must be a boolean',
                    path: ['x', '5'],
                    type: 'boolean.base',
                    context: { label: 'x.5', key: '5', value: 'x' }
                },
                {
                    message: '"x.bb" must be one of [x]',
                    path: ['x', 'bb'],
                    type: 'any.only',
                    context: { value: 'y', valids: ['x'], label: 'x.bb', key: 'bb' }
                }
            ]);
        });

        it('validates unknown keys using a pattern (nested)', () => {

            const schema = Joi.object({
                x: Joi.object({
                    a: Joi.number()
                }).pattern(Joi.number().positive(), Joi.boolean()).pattern(Joi.string().length(2), 'x')
            });

            const err = schema.validate({
                x: {
                    bb: 'y',
                    5: 'x'
                }
            }, { abortEarly: false }).error;
            expect(err).to.be.an.error('"x.5" must be a boolean. "x.bb" must be one of [x]');
            expect(err.details).to.equal([
                {
                    message: '"x.5" must be a boolean',
                    path: ['x', '5'],
                    type: 'boolean.base',
                    context: { label: 'x.5', key: '5', value: 'x' }
                },
                {
                    message: '"x.bb" must be one of [x]',
                    path: ['x', 'bb'],
                    type: 'any.only',
                    context: { value: 'y', valids: ['x'], label: 'x.bb', key: 'bb' }
                }
            ]);
        });

        it('errors when using a pattern on empty schema with unknown(false) and regex pattern mismatch', () => {

            const schema = Joi.object().pattern(/\d/, Joi.number()).unknown(false);

            const err = schema.validate({ a: 5 }, { abortEarly: false }).error;
            expect(err).to.be.an.error('"a" is not allowed');
            expect(err.details).to.equal([{
                message: '"a" is not allowed',
                path: ['a'],
                type: 'object.unknown',
                context: { child: 'a', label: 'a', key: 'a', value: 5 }
            }]);
        });

        it('errors when using a pattern on empty schema with unknown(false) and schema pattern mismatch', () => {

            const schema = Joi.object().pattern(Joi.number().positive(), Joi.number()).unknown(false);

            const err = schema.validate({ a: 5 }, { abortEarly: false }).error;
            expect(err).to.be.an.error('"a" is not allowed');
            expect(err.details).to.equal([{
                message: '"a" is not allowed',
                path: ['a'],
                type: 'object.unknown',
                context: { child: 'a', label: 'a', key: 'a', value: 5 }
            }]);
        });

        it('reject global and sticky flags from patterns', () => {

            expect(() => Joi.object().pattern(/a/g, Joi.number())).to.throw('pattern should not use global or sticky mode');
            expect(() => Joi.object().pattern(/a/y, Joi.number())).to.throw('pattern should not use global or sticky mode');
        });

        it('allows using empty() on values', () => {

            const schema = Joi.object().pattern(/a/, Joi.any().empty(null));
            expect(schema.validate({ a1: undefined, a2: null, a3: 'test' })).to.equal({ value: { a1: undefined, a2: undefined, a3: 'test' } });
        });

        it('errors if pattern is not regex or instance of Any', () => {

            let error;
            try {
                Joi.object().pattern(17, Joi.boolean());
                error = false;
            }
            catch (e) {
                error = true;
            }

            expect(error).to.equal(true);
        });

        it('allows using refs in .valid() schema pattern', () => {

            const schema = Joi.object().pattern(Joi.string().valid(Joi.ref('$keys')), Joi.any());
            expect(schema.validate({ a: 'test' }, { context: { keys: ['a'] } })).to.equal({ value: { a: 'test' } });
        });

        it('enforces pattern matches rule', () => {

            const ref1 = Joi.ref('a');
            const ref2 = Joi.x('{a - 1}');

            const schema = Joi.object({
                a: Joi.number().required()
            })
                .pattern(/^x\d+$/, Joi.boolean(), { matches: Joi.array().length(ref1), exclusive: true })
                .pattern(/^z\w+$/, Joi.number())
                .pattern(/^x\w+$/, Joi.number(), { matches: Joi.array().max(ref2) });

            Helper.validate(schema, [
                [{ a: 1, x1: true }, true],
                [{ a: 2, x1: true, x2: true, xx: 1 }, true],
                [{ a: 3, x1: true, x2: true, x3: false, xx: 1 }, true],
                [{ a: 0, x1: true }, false, null, {
                    message: '"value" keys failed to match pattern requirements',
                    details: [{
                        message: '"value" keys failed to match pattern requirements',
                        path: [],
                        type: 'object.pattern.match',
                        context: {
                            message: '"value" must contain ref:a items',
                            label: 'value',
                            value: { a: 0, x1: true },
                            matches: ['x1'],
                            details: [
                                {
                                    context: {
                                        label: 'value',
                                        limit: ref1,
                                        value: ['x1']
                                    },
                                    message: '"value" must contain ref:a items',
                                    path: [],
                                    type: 'array.length'
                                }
                            ]
                        }
                    }]
                }]
            ]);

            const description = schema.describe();
            expect(description).to.equal({
                type: 'object',
                keys: {
                    a: {
                        type: 'number',
                        flags: {
                            presence: 'required'
                        }
                    }
                },
                patterns: [
                    {
                        rule: {
                            type: 'boolean'
                        },
                        regex: '/^x\\d+$/',
                        matches: {
                            type: 'array',
                            rules: [
                                {
                                    name: 'length',
                                    args: {
                                        limit: {
                                            ref: {
                                                path: ['a']
                                            }
                                        }
                                    }
                                }
                            ]
                        },
                        exclusive: true
                    },
                    {
                        rule: {
                            type: 'number'
                        },
                        regex: '/^z\\w+$/'
                    },
                    {
                        rule: {
                            type: 'number'
                        },
                        regex: '/^x\\w+$/',
                        matches: {
                            type: 'array',
                            rules: [
                                {
                                    name: 'max',
                                    args: {
                                        limit: {
                                            template: '{a - 1}'
                                        }
                                    }
                                }
                            ]
                        }
                    }
                ]
            });
        });

        it('enforces pattern matches rule (abortEarly false)', () => {

            const schema = Joi.object({
                a: Joi.number().required()
            })
                .pattern(/^x\d+$/, Joi.boolean(), { matches: Joi.array().length(Joi.ref('a')), exclusive: true })
                .pattern(/^x\w+$/, Joi.number(), { matches: Joi.array().max(Joi.x('{a - 1}')) });

            const err = schema.validate({ a: 0, x1: true, xx: 1 }, { abortEarly: false }).error;
            expect(err).to.be.an.error('"value" keys failed to match pattern requirements');
            expect(err.details).to.have.length(2);
        });

        it('works with keys()', () => {

            const schema = Joi.object()
                .pattern(/a/, Joi.any())
                .keys({ b: Joi.any() });

            expect(schema.validate({ a: { b: 1 }, b: { c: 2 } }).error).to.not.exist();
        });
    });

    describe('schema()', () => {

        it('should detect joi instances', () => {

            const schema = Joi.object().schema();
            Helper.validate(schema, [
                [{}, false, null, {
                    message: '"value" must be a Joi schema of any type',
                    details: [{
                        message: '"value" must be a Joi schema of any type',
                        path: [],
                        type: 'object.schema',
                        context: { label: 'value', type: 'any', value: {} }
                    }]
                }],
                [{ isJoi: true }, false, null, {
                    message: '"value" must be a Joi schema of any type',
                    details: [{
                        message: '"value" must be a Joi schema of any type',
                        path: [],
                        type: 'object.schema',
                        context: { label: 'value', type: 'any', value: { isJoi: true } }
                    }]
                }],
                [Joi.number().max(2), true]
            ]);
        });

        it('validated schema type', () => {

            const schema = Joi.object().schema('number');
            Helper.validate(schema, [
                [Joi.number().max(2), true],
                [{}, false, null, {
                    message: '"value" must be a Joi schema of number type',
                    details: [{
                        message: '"value" must be a Joi schema of number type',
                        path: [],
                        type: 'object.schema',
                        context: { label: 'value', type: 'number', value: {} }
                    }]
                }],
                [{ isJoi: true }, false, null, {
                    message: '"value" must be a Joi schema of number type',
                    details: [{
                        message: '"value" must be a Joi schema of number type',
                        path: [],
                        type: 'object.schema',
                        context: { label: 'value', type: 'number', value: { isJoi: true } }
                    }]
                }],
                [Joi.string(), false, null, {
                    message: '"value" must be a Joi schema of number type',
                    details: [{
                        message: '"value" must be a Joi schema of number type',
                        path: [],
                        type: 'object.schema',
                        context: { label: 'value', type: 'number', value: Joi.string() }
                    }]
                }]
            ]);
        });
    });

    describe('tailor()', () => {

        it('customizes schema', () => {

            const alterations = {
                x: (s) => s.min(10),
                y: (s) => s.max(50),
                z: (s) => s.integer()
            };

            const before = Joi.object({
                a: {
                    b: Joi.number().alter(alterations)
                },
                b: Joi.object()
                    .pattern(/.*/, Joi.number().alter(alterations)),
                c: Joi.object({
                    x: Joi.number(),
                    y: Joi.number()
                })
                    .assert('c.x', Joi.number().alter(alterations))
            });

            const bd = before.describe();

            const first = before.tailor('x');

            const c = Joi.object({
                x: Joi.number(),
                y: Joi.number()
            })
                .assert('c.x', Joi.number().min(10).alter(alterations));

            const after1 = Joi.object({
                a: {
                    b: Joi.number().min(10).alter(alterations)
                },
                b: Joi.object()
                    .pattern(/.*/, Joi.number().min(10).alter(alterations)),
                c
            });

            expect(first.describe()).to.equal(after1.describe());
            expect(before.describe()).to.equal(bd);
        });

        it('customizes schema on object and keys', () => {

            const alterations = {
                x: (s) => s.min(10),
                y: (s) => s.max(50),
                z: (s) => s.integer()
            };

            const before = Joi.object({
                a: {
                    b: Joi.number().alter(alterations)
                },
                b: Joi.object()
                    .pattern(/.*/, Joi.number().alter(alterations)),
                c: Joi.object({
                    x: Joi.number(),
                    y: Joi.number()
                })
                    .assert('c.x', Joi.number().alter(alterations))
                    .alter(alterations)
            });

            const bd = before.describe();

            const first = before.tailor('x');

            const after1 = Joi.object({
                a: {
                    b: Joi.number().min(10).alter(alterations)
                },
                b: Joi.object()
                    .pattern(/.*/, Joi.number().min(10).alter(alterations)),
                c: Joi.object({
                    x: Joi.number(),
                    y: Joi.number()
                })
                    .alter(alterations)
                    .assert('c.x', Joi.number().min(10).alter(alterations))
                    .min(10)
            });

            expect(first.describe()).to.equal(after1.describe());
            expect(first).to.equal(after1, { skip: ['_ruleset'] });
            expect(before.describe()).to.equal(bd);
        });
    });

    describe('type()', () => {

        it('uses constructor name for default type name', () => {

            const Foo = function Foo() {
            };

            const schema = Joi.object().instance(Foo);
            const err = schema.validate({}).error;
            expect(err).to.be.an.error('"value" must be an instance of "Foo"');
            expect(err.details).to.equal([{
                message: '"value" must be an instance of "Foo"',
                path: [],
                type: 'object.instance',
                context: { type: 'Foo', label: 'value', value: {} }
            }]);
        });

        it('uses custom type name if supplied', () => {

            const Foo = function () {
            };

            const schema = Joi.object().instance(Foo, 'Bar');
            const err = schema.validate({}).error;
            expect(err).to.be.an.error('"value" must be an instance of "Bar"');
            expect(err.details).to.equal([{
                message: '"value" must be an instance of "Bar"',
                path: [],
                type: 'object.instance',
                context: { type: 'Bar', label: 'value', value: {} }
            }]);
        });

        it('overrides constructor name with custom name', () => {

            const Foo = function Foo() {
            };

            const schema = Joi.object().instance(Foo, 'Bar');
            const err = schema.validate({}).error;
            expect(err).to.be.an.error('"value" must be an instance of "Bar"');
            expect(err.details).to.equal([{
                message: '"value" must be an instance of "Bar"',
                path: [],
                type: 'object.instance',
                context: { type: 'Bar', label: 'value', value: {} }
            }]);
        });

        it('throws when constructor is not a function', () => {

            expect(() => Joi.object().instance('')).to.throw('constructor must be a function');
        });

        it('uses the constructor name in the schema description', () => {

            const description = Joi.object().instance(RegExp).describe();

            expect(description.rules[0]).to.equal({ name: 'instance', args: { name: 'RegExp', constructor: RegExp } });
        });

        it('uses the constructor reference in the schema description', () => {

            const Foo = function Foo() { };

            const description = Joi.object().instance(Foo).describe();

            expect(new Foo()).to.be.an.instanceof(description.rules[0].args.constructor);
        });
    });

    describe('unknown()', () => {

        it('avoids unnecessary cloning when called twice', () => {

            const schema = Joi.object().unknown();
            expect(schema.unknown()).to.shallow.equal(schema);
        });

        it('allows local unknown without applying to keys', () => {

            const schema = Joi.object({
                a: {
                    b: Joi.number()
                }
            }).unknown();

            Helper.validate(schema, [
                [{ a: { b: 5 } }, true],
                [{ a: { b: 'x' } }, false, null, {
                    message: '"a.b" must be a number',
                    details: [{
                        message: '"a.b" must be a number',
                        path: ['a', 'b'],
                        type: 'number.base',
                        context: { label: 'a.b', key: 'b', value: 'x' }
                    }]
                }],
                [{ a: { b: 5 }, c: 'ignore' }, true],
                [{ a: { b: 5, c: 'ignore' } }, false, null, {
                    message: '"a.c" is not allowed',
                    details: [{
                        message: '"a.c" is not allowed',
                        path: ['a', 'c'],
                        type: 'object.unknown',
                        context: { child: 'c', label: 'a.c', key: 'c', value: 'ignore' }
                    }]
                }]
            ]);
        });

        it('forbids local unknown without applying to keys', () => {

            const schema = Joi.object({
                a: Joi.object({
                    b: Joi.number()
                }).unknown()
            }).prefs({ allowUnknown: false });

            Helper.validate(schema, [
                [{ a: { b: 5 } }, true],
                [{ a: { b: 'x' } }, false, null, {
                    message: '"a.b" must be a number',
                    details: [{
                        message: '"a.b" must be a number',
                        path: ['a', 'b'],
                        type: 'number.base',
                        context: { label: 'a.b', key: 'b', value: 'x' }
                    }]
                }],
                [{ a: { b: 5 }, c: 'ignore' }, false, null, {
                    message: '"c" is not allowed',
                    details: [{
                        message: '"c" is not allowed',
                        path: ['c'],
                        type: 'object.unknown',
                        context: { child: 'c', label: 'c', key: 'c', value: 'ignore' }
                    }]
                }],
                [{ a: { b: 5, c: 'ignore' } }, true]
            ]);
        });

        it('overrides stripUnknown at a local level', () => {

            const schema = Joi.object({
                a: Joi.object({
                    b: Joi.number(),
                    c: Joi.object({
                        d: Joi.number()
                    })
                }).unknown()
            }).prefs({ allowUnknown: false, stripUnknown: true });

            Helper.validate(schema, [
                [{ a: { b: 5 } }, true, null, { a: { b: 5 } }],
                [{ a: { b: 'x' } }, false, null, {
                    message: '"a.b" must be a number',
                    details: [{
                        message: '"a.b" must be a number',
                        path: ['a', 'b'],
                        type: 'number.base',
                        context: { label: 'a.b', key: 'b', value: 'x' }
                    }]
                }],
                [{ a: { b: 5 }, d: 'ignore' }, true, null, { a: { b: 5 } }],
                [{ a: { b: 5, d: 'ignore' } }, true, null, { a: { b: 5, d: 'ignore' } }],
                [{ a: { b: 5, c: { e: 'ignore' } } }, true, null, { a: { b: 5, c: {} } }]
            ]);
        });
    });

    describe('with()', () => {

        it('errors when a parameter is not a string', () => {

            let error;
            try {
                Joi.object().with({});
                error = false;
            }
            catch (e) {
                error = true;
            }

            expect(error).to.equal(true);

            try {
                Joi.object().with(123);
                error = false;
            }
            catch (e) {
                error = true;
            }

            expect(error).to.equal(true);
        });

        it('validates correctly when key is an empty string', () => {

            const schema = Joi.object().with('', 'b');
            Helper.validate(schema, [
                [{ c: 'hi', d: 'there' }, true]
            ]);
        });

        it('should apply labels', () => {

            const schema = Joi.object({
                a: Joi.number().label('first'),
                b: Joi.string().label('second')
            }).with('a', ['b']);
            const error = schema.validate({ a: 1 }).error;
            expect(error).to.be.an.error('"first" missing required peer "second"');
            expect(error.details).to.equal([{
                message: '"first" missing required peer "second"',
                path: [],
                type: 'object.with',
                context: {
                    main: 'a',
                    mainWithLabel: 'first',
                    peer: 'b',
                    peerWithLabel: 'second',
                    label: 'value',
                    value: { a: 1 }
                }
            }]);
        });

        it('allows nested objects', () => {

            const schema = Joi.object({
                a: Joi.string(),
                b: Joi.object({ c: Joi.string(), d: Joi.number() }),
                d: Joi.number()
            }).with('a', 'b.c');

            Helper.validate(schema, [
                [{ a: 'test', b: { c: 'test2' } }, true],
                [{ a: 'test', b: { d: 80 } }, false, null, {
                    message: '"a" missing required peer "b.c"',
                    details: [{
                        message: '"a" missing required peer "b.c"',
                        path: [],
                        type: 'object.with',
                        context: {
                            main: 'a',
                            mainWithLabel: 'a',
                            peer: 'b.c',
                            peerWithLabel: 'b.c',
                            label: 'value',
                            value: { a: 'test', b: { d: 80 } }
                        }
                    }]
                }]
            ]);

            const schema2 = Joi.object({
                a: Joi.object({ b: Joi.string() }),
                b: Joi.object({ c: Joi.string() })
            }).with('a.b', 'b.c');

            Helper.validate(schema2, [
                [{ a: { b: 'test' }, b: { c: 'test2' } }, true],
                [{ a: { b: 'test' }, b: {} }, false, null, {
                    message: '"a.b" missing required peer "b.c"',
                    details: [{
                        message: '"a.b" missing required peer "b.c"',
                        path: [],
                        type: 'object.with',
                        context: {
                            main: 'a.b',
                            mainWithLabel: 'a.b',
                            peer: 'b.c',
                            peerWithLabel: 'b.c',
                            label: 'value',
                            value: { a: { b: 'test' }, b: {} }
                        }
                    }]
                }]
            ]);
        });

        it('allows nested keys in functions', () => {

            const schema = Joi.object({
                a: Joi.string(),
                b: Joi.func().keys({ c: Joi.string(), d: Joi.number() }),
                d: Joi.number()
            }).with('a', 'b.c');

            Helper.validate(schema, [
                [{ a: 'test', b: Object.assign(() => { }, { c: 'test2' }) }, true]
            ]);

            const error = schema.validate({ a: 'test', b: Object.assign(() => { }, { d: 80 }) }).error;
            expect(error).to.be.an.error('"a" missing required peer "b.c"');
            expect(error.details).to.equal([{
                message: '"a" missing required peer "b.c"',
                path: [],
                type: 'object.with',
                context: {
                    main: 'a',
                    mainWithLabel: 'a',
                    peer: 'b.c',
                    peerWithLabel: 'b.c',
                    label: 'value',
                    value: error.details[0].context.value
                }
            }]);
        });

        it('should apply labels with nested objects', () => {

            const schema = Joi.object({
                a: Joi.number().label('first'),
                b: Joi.object({
                    c: Joi.string().label('second'),
                    d: Joi.number()
                })
            })
                .with('a', ['b.c']);

            const error = schema.validate({ a: 1, b: { d: 2 } }).error;
            expect(error).to.be.an.error('"first" missing required peer "b.second"');
            expect(error.details).to.equal([{
                message: '"first" missing required peer "b.second"',
                path: [],
                type: 'object.with',
                context: {
                    main: 'a',
                    mainWithLabel: 'first',
                    peer: 'b.c',
                    peerWithLabel: 'b.second',
                    label: 'value',
                    value: { a: 1, b: { d: 2 } }
                }
            }]);

            const schema2 = Joi.object({
                a: Joi.object({
                    b: Joi.string().label('first')
                }),
                b: Joi.object({
                    c: Joi.string().label('second')
                })
            })
                .with('a.b', ['b.c']);

            const error2 = schema2.validate({ a: { b: 'test' }, b: {} }).error;
            expect(error2).to.be.an.error('"a.first" missing required peer "b.second"');
            expect(error2.details).to.equal([{
                message: '"a.first" missing required peer "b.second"',
                path: [],
                type: 'object.with',
                context: {
                    main: 'a.b',
                    mainWithLabel: 'a.first',
                    peer: 'b.c',
                    peerWithLabel: 'b.second',
                    label: 'value',
                    value: { a: { b: 'test' }, b: {} }
                }
            }]);
        });

        it('handles period in key names', () => {

            const schema = Joi.object({
                'x.from': Joi.string().lowercase().email(),
                'x.url': Joi.string().uri({ scheme: ['https'] })
            })
                .with('x.from', 'x.url', { separator: false });

            const test = { 'x.url': 'https://example.com', 'x.from': 'test@example.com' };
            expect(schema.validate(test)).to.equal({ value: test });
        });
    });

    describe('without()', () => {

        it('errors when a parameter is not a string', () => {

            let error;
            try {
                Joi.object().without({});
                error = false;
            }
            catch (e) {
                error = true;
            }

            expect(error).to.equal(true);

            try {
                Joi.object().without(123);
                error = false;
            }
            catch (e) {
                error = true;
            }

            expect(error).to.equal(true);
        });

        it('validates correctly when key is an empty string', () => {

            const schema = Joi.object().without('', 'b');
            Helper.validate(schema, [
                [{ a: 'hi', b: 'there' }, true]
            ]);
        });

        it('validates correctly when key is stripped', () => {

            const schema = Joi.object({
                a: Joi.any().strip(),
                b: Joi.any()
            }).without('a', 'b');

            Helper.validate(schema, [
                [{ a: 'hi', b: 'there' }, true]
            ]);
        });

        it('should apply labels', () => {

            const schema = Joi.object({
                a: Joi.number().label('first'),
                b: Joi.string().label('second')
            }).without('a', ['b']);
            const error = schema.validate({ a: 1, b: 'b' }).error;
            expect(error).to.be.an.error('"first" conflict with forbidden peer "second"');
            expect(error.details).to.equal([{
                message: '"first" conflict with forbidden peer "second"',
                path: [],
                type: 'object.without',
                context: {
                    main: 'a',
                    mainWithLabel: 'first',
                    peer: 'b',
                    peerWithLabel: 'second',
                    label: 'value',
                    value: { a: 1, b: 'b' }
                }
            }]);
        });

        it('allows nested objects', () => {

            const schema = Joi.object({
                a: Joi.string(),
                b: Joi.object({ c: Joi.string(), d: Joi.number() }),
                d: Joi.number()
            }).without('a', ['b.c', 'b.d']);

            const sampleObject = { a: 'test', d: 9000 };
            const sampleObject2 = { a: 'test', b: { d: 80 } };

            const error = schema.validate(sampleObject).error;
            expect(error).to.not.exist();

            const error2 = schema.validate(sampleObject2).error;
            expect(error2).to.be.an.error('"a" conflict with forbidden peer "b.d"');
            expect(error2.details).to.equal([{
                message: '"a" conflict with forbidden peer "b.d"',
                path: [],
                type: 'object.without',
                context: {
                    main: 'a',
                    mainWithLabel: 'a',
                    peer: 'b.d',
                    peerWithLabel: 'b.d',
                    label: 'value',
                    value: sampleObject2
                }
            }]);
        });

        it('allows nested keys in functions', () => {

            const schema = Joi.object({
                a: Joi.string(),
                b: Joi.func().keys({ c: Joi.string(), d: Joi.number() }),
                d: Joi.number()
            })
                .without('a', ['b.c', 'b.d']);

            const sampleObject = { a: 'test', d: 9000 };
            const sampleObject2 = { a: 'test', b: Object.assign(() => { }, { d: 80 }) };

            const error = schema.validate(sampleObject).error;
            expect(error).to.not.exist();

            const error2 = schema.validate(sampleObject2).error;
            expect(error2).to.be.an.error('"a" conflict with forbidden peer "b.d"');
            expect(error2.details).to.equal([{
                message: '"a" conflict with forbidden peer "b.d"',
                path: [],
                type: 'object.without',
                context: {
                    main: 'a',
                    mainWithLabel: 'a',
                    peer: 'b.d',
                    peerWithLabel: 'b.d',
                    label: 'value',
                    value: error2.details[0].context.value
                }
            }]);
        });

        it('should apply labels with nested objects', () => {

            const schema = Joi.object({
                a: Joi.number().label('first'),
                b: Joi.object({
                    c: Joi.string().label('second'),
                    d: Joi.number()
                })
            })
                .without('a', ['b.c']);

            const error = schema.validate({ a: 1, b: { c: 'c' } }).error;
            expect(error).to.be.an.error('"first" conflict with forbidden peer "b.second"');
            expect(error.details).to.equal([{
                message: '"first" conflict with forbidden peer "b.second"',
                path: [],
                type: 'object.without',
                context: {
                    main: 'a',
                    mainWithLabel: 'first',
                    peer: 'b.c',
                    peerWithLabel: 'b.second',
                    label: 'value',
                    value: { a: 1, b: { c: 'c' } }
                }
            }]);
        });
    });

    describe('xor()', () => {

        it('errors when a parameter is not a string', () => {

            let error;
            try {
                Joi.object().xor({});
                error = false;
            }
            catch (e) {
                error = true;
            }

            expect(error).to.equal(true);

            try {
                Joi.object().xor(123);
                error = false;
            }
            catch (e) {
                error = true;
            }

            expect(error).to.equal(true);
        });

        it('should apply labels without any peer', () => {

            const schema = Joi.object({
                a: Joi.number().label('first'),
                b: Joi.string().label('second')
            }).xor('a', 'b');
            const error = schema.validate({}).error;
            expect(error).to.be.an.error('"value" must contain at least one of [first, second]');
            expect(error.details).to.equal([{
                message: '"value" must contain at least one of [first, second]',
                path: [],
                type: 'object.missing',
                context: {
                    peers: ['a', 'b'],
                    peersWithLabels: ['first', 'second'],
                    label: 'value',
                    value: {}
                }
            }]);
        });

        it('should apply labels with too many peers', () => {

            const schema = Joi.object({
                a: Joi.number().label('first'),
                b: Joi.string().label('second')
            }).xor('a', 'b');
            const error = schema.validate({ a: 1, b: 'b' }).error;
            expect(error).to.be.an.error('"value" contains a conflict between exclusive peers [first, second]');
            expect(error.details).to.equal([{
                message: '"value" contains a conflict between exclusive peers [first, second]',
                path: [],
                type: 'object.xor',
                context: {
                    peers: ['a', 'b'],
                    peersWithLabels: ['first', 'second'],
                    present: ['a', 'b'],
                    presentWithLabels: ['first', 'second'],
                    label: 'value',
                    value: { a: 1, b: 'b' }
                }
            }]);
        });

        it('should apply labels with too many peers', () => {

            const schema = Joi.object({
                a: Joi.number().label('first'),
                b: Joi.string().label('second'),
                c: Joi.string().label('third'),
                d: Joi.string().label('fourth')
            }).xor('a', 'b', 'c', 'd');
            const error = schema.validate({ a: 1, b: 'b', d: 'd' }).error;
            expect(error).to.be.an.error('"value" contains a conflict between exclusive peers [first, second, third, fourth]');
            expect(error.details).to.equal([{
                message: '"value" contains a conflict between exclusive peers [first, second, third, fourth]',
                path: [],
                type: 'object.xor',
                context: {
                    peers: ['a', 'b', 'c', 'd'],
                    peersWithLabels: ['first', 'second', 'third', 'fourth'],
                    present: ['a', 'b', 'd'],
                    presentWithLabels: ['first', 'second', 'fourth'],
                    label: 'value',
                    value: { a: 1, b: 'b', d: 'd' }
                }
            }]);
        });

        it('allows nested objects', () => {

            const schema = Joi.object({
                a: Joi.string(),
                b: Joi.object({ c: Joi.string(), d: Joi.number() }),
                d: Joi.number()
            }).xor('a', 'b.c');

            const sampleObject = { a: 'test', b: { d: 80 } };
            const sampleObject2 = { a: 'test', b: { c: 'test2' } };

            const error = schema.validate(sampleObject).error;
            expect(error).to.not.exist();

            const error2 = schema.validate(sampleObject2).error;
            expect(error2).to.be.an.error('"value" contains a conflict between exclusive peers [a, b.c]');
            expect(error2.details).to.equal([{
                message: '"value" contains a conflict between exclusive peers [a, b.c]',
                path: [],
                type: 'object.xor',
                context: {
                    peers: ['a', 'b.c'],
                    peersWithLabels: ['a', 'b.c'],
                    present: ['a', 'b.c'],
                    presentWithLabels: ['a', 'b.c'],
                    label: 'value',
                    value: sampleObject2
                }
            }]);
        });

        it('allows nested keys in functions', () => {

            const schema = Joi.object({
                a: Joi.string(),
                b: Joi.func().keys({ c: Joi.string(), d: Joi.number() }),
                d: Joi.number()
            }).xor('a', 'b.c');

            const sampleObject = { a: 'test', b: Object.assign(() => { }, { d: 80 }) };
            const sampleObject2 = { a: 'test', b: Object.assign(() => { }, { c: 'test2' }) };

            const error = schema.validate(sampleObject).error;
            expect(error).to.not.exist();

            const error2 = schema.validate(sampleObject2).error;
            expect(error2).to.be.an.error('"value" contains a conflict between exclusive peers [a, b.c]');
            expect(error2.details).to.equal([{
                message: '"value" contains a conflict between exclusive peers [a, b.c]',
                path: [],
                type: 'object.xor',
                context: {
                    peers: ['a', 'b.c'],
                    peersWithLabels: ['a', 'b.c'],
                    present: ['a', 'b.c'],
                    presentWithLabels: ['a', 'b.c'],
                    label: 'value',
                    value: error2.details[0].context.value
                }
            }]);
        });

        it('should apply labels without any nested peers', () => {

            const schema = Joi.object({
                a: Joi.number().label('first'),
                b: Joi.object({
                    c: Joi.string().label('second'),
                    d: Joi.number()
                })
            })
                .xor('a', 'b.c');

            const error = schema.validate({}).error;
            expect(error).to.be.an.error('"value" must contain at least one of [first, b.second]');
            expect(error.details).to.equal([{
                message: '"value" must contain at least one of [first, b.second]',
                path: [],
                type: 'object.missing',
                context: {
                    peers: ['a', 'b.c'],
                    peersWithLabels: ['first', 'b.second'],
                    label: 'value',
                    value: {}
                }
            }]);
        });

        it('should apply labels with too many nested peers', () => {

            const schema = Joi.object({
                a: Joi.number().label('first'),
                b: Joi.object({
                    c: Joi.string().label('second'),
                    d: Joi.number()
                })
            })
                .xor('a', 'b.c');

            const error = schema.validate({ a: 1, b: { c: 'c' } }).error;
            expect(error).to.be.an.error('"value" contains a conflict between exclusive peers [first, b.second]');
            expect(error.details).to.equal([{
                message: '"value" contains a conflict between exclusive peers [first, b.second]',
                path: [],
                type: 'object.xor',
                context: {
                    peers: ['a', 'b.c'],
                    peersWithLabels: ['first', 'b.second'],
                    present: ['a', 'b.c'],
                    presentWithLabels: ['first', 'b.second'],
                    label: 'value',
                    value: { a: 1, b: { c: 'c' } }
                }
            }]);
        });

        it('handles period in key names', () => {

            const schema = Joi.object({
                'x.from': Joi.string().lowercase().email(),
                'x.url': Joi.string().uri({ scheme: ['https'] })
            })
                .xor('x.from', 'x.url', { separator: false });

            const test = { 'x.url': 'https://example.com' };
            expect(schema.validate(test)).to.equal({ value: test });
        });
    });
});
