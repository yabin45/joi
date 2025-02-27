'use strict';

const Hoek = require('@hapi/hoek');

const Base = require('../base');


const internals = {};


module.exports = Base.extend({

    type: 'any',

    // Rules

    rules: {
        warning: {
            method: function (code, local) {

                Hoek.assert(code && typeof code === 'string', 'Invalid warning code');

                return this.$_addRule({ name: 'warning', args: { code, local }, warn: true });
            },
            validate: function (value, helpers, { code, local }) {

                return helpers.error(code, local);
            },
            args: ['code', 'local'],
            multi: true
        }
    },

    // Errors

    messages: {
        'any.default': '"{{#label}}" threw an error when running default method',
        'any.failover': '"{{#label}}" threw an error when running failover method',
        'any.invalid': '"{{#label}}" contains an invalid value',
        'any.only': '"{{#label}}" must be one of {{#valids}}',
        'any.ref': '"{{#label}}" {{#arg}} references "{{#ref}}" which {{#reason}}',
        'any.required': '"{{#label}}" is required',
        'any.unknown': '"{{#label}}" is not allowed'
    }
});
