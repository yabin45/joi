'use strict';

const Code = require('@hapi/code');
const Joi = require('..');


const internals = {};


const { expect } = Code;


exports.validate = function (schema, config) {

    return exports.validateOptions(schema, config, null);
};


exports.validateOptions = function (schema, config, options) {

    try {
        const compiled = Joi.compile(schema);
        if (compiled._root === Joi) {
            expect(Joi.build(compiled.describe())).to.equal(compiled, { skip: ['_ruleset'] });
        }

        for (let i = 0; i < config.length; ++i) {

            const item = config[i];
            const input = item[0];
            const shouldValidate = item[1];
            const validationOptions = item[2];
            const expectedValueOrError = item[3];

            if (!shouldValidate) {
                expect(expectedValueOrError, 'Failing tests messages must be tested').to.be.an.object();
                expect(expectedValueOrError.message).to.be.a.string();
                expect(expectedValueOrError.details).to.be.an.array();
            }

            const result = compiled.validate(input, validationOptions || options);

            const err = result.error;
            const value = result.value;

            if (err &&
                shouldValidate) {

                console.log(err);
            }

            if (!err &&
                !shouldValidate) {

                console.log(input);
            }

            expect(!err).to.equal(shouldValidate);

            if (item.length >= 4) {
                if (shouldValidate) {
                    expect(value).to.equal(expectedValueOrError);
                }
                else {
                    const message = expectedValueOrError.message || expectedValueOrError;
                    if (message instanceof RegExp) {
                        expect(err.message).to.match(message);
                    }
                    else {
                        expect(err.message).to.equal(message);
                    }

                    if (expectedValueOrError.details) {
                        expect(err.details).to.equal(expectedValueOrError.details);
                    }
                }
            }
        }
    }
    catch (err) {

        console.error(err.stack);
        err.at = internals.thrownAt();      // Reframe the error location since we don't care about the helper
        throw err;
    }
};


internals.thrownAt = function () {

    const error = new Error();
    const frame = error.stack.replace(error.toString(), '').split('\n').slice(1).filter((line) => !line.includes(__filename))[0];
    const at = frame.match(/^\s*at \(?(.+)\:(\d+)\:(\d+)\)?$/);
    return {
        filename: at[1],
        line: at[2],
        column: at[3]
    };
};
