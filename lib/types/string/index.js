'use strict';

const Address = require('@hapi/address');
const Hoek = require('@hapi/hoek');

const Any = require('../any');
const Common = require('../../common');

const Ip = require('./ip');
const Uri = require('./uri');


const internals = {
    base64Regex: {
        // paddingRequired
        true: {
            // urlSafe
            true: /^(?:[\w\-]{2}[\w\-]{2})*(?:[\w\-]{2}==|[\w\-]{3}=)?$/,
            false: /^(?:[A-Za-z0-9+\/]{2}[A-Za-z0-9+\/]{2})*(?:[A-Za-z0-9+\/]{2}==|[A-Za-z0-9+\/]{3}=)?$/
        },
        false: {
            true: /^(?:[\w\-]{2}[\w\-]{2})*(?:[\w\-]{2}(==)?|[\w\-]{3}=?)?$/,
            false: /^(?:[A-Za-z0-9+\/]{2}[A-Za-z0-9+\/]{2})*(?:[A-Za-z0-9+\/]{2}(==)?|[A-Za-z0-9+\/]{3}=?)?$/
        }
    },
    dataUriRegex: {
        format: /^data:[\w+.-]+\/[\w+.-]+;((charset=[\w-]+|base64),)?(.*)$/,
        base64: {
            // paddingRequired
            true: /^(?:[A-Za-z0-9+\/]{4})*(?:[A-Za-z0-9+\/]{2}==|[A-Za-z0-9+\/]{3}=)?$/,
            false: /^(?:[A-Za-z0-9+\/]{4})*(?:[A-Za-z0-9+\/]{2}(==)?|[A-Za-z0-9+\/]{3}=?)?$/
        }
    },
    hexRegex: /^[a-f0-9]+$/i,
    hostRegex: /^(([a-zA-Z0-9]|[a-zA-Z0-9][a-zA-Z0-9\-]*[a-zA-Z0-9])\.)*([A-Za-z0-9]|[A-Za-z0-9][A-Za-z0-9\-]*[A-Za-z0-9])$/,
    ipRegex: Ip.createIpRegex(['ipv4', 'ipv6', 'ipvfuture'], 'optional'),
    isoDurationRegex: /^P(?!$)(\d+Y)?(\d+M)?(\d+W)?(\d+D)?(T(?=\d)(\d+H)?(\d+M)?(\d+S)?)?$/,

    guidBrackets: {
        '{': '}', '[': ']', '(': ')', '': ''
    },
    guidVersions: {
        uuidv1: '1',
        uuidv2: '2',
        uuidv3: '3',
        uuidv4: '4',
        uuidv5: '5'
    },

    cidrPresences: ['required', 'optional', 'forbidden'],
    normalizationForms: ['NFC', 'NFD', 'NFKC', 'NFKD']
};


module.exports = Any.extend({

    type: 'string',

    // Initialize

    initialize: function (schema) {

        schema.$_terms.replacements = null;
    },

    // Coerce

    coerce: {
        from: 'string',
        method: function (schema, value, { state, prefs }) {

            const normalize = schema.$_getRule('normalize');
            if (normalize) {
                value = value.normalize(normalize.args.form);
            }

            const casing = schema.$_getRule('case');
            if (casing) {
                value = casing.args.direction === 'upper' ? value.toLocaleUpperCase() : value.toLocaleLowerCase();
            }

            const trim = schema.$_getRule('trim');
            if (trim &&
                trim.args.enabled) {

                value = value.trim();
            }

            if (schema.$_terms.replacements) {
                for (const replacement of schema.$_terms.replacements) {
                    value = value.replace(replacement.pattern, replacement.replacement);
                }
            }

            const hex = schema.$_getRule('hex');
            if (hex &&
                hex.args.options.byteAligned &&
                value.length % 2 !== 0) {

                value = `0${value}`;
            }

            if (schema.$_getRule('isoDate')) {
                let valid = false;
                if (Common.isIsoDate(value)) {
                    const date = new Date(value);
                    if (!isNaN(date.getTime())) {
                        value = date.toISOString();
                        valid = true;
                    }
                }

                if (!valid) {
                    return { value, errors: schema.$_createError('string.isoDate', value, null, state, prefs) };
                }
            }

            if (schema._flags.truncate) {
                const rule = schema.$_getRule('max');
                if (rule) {
                    let limit = rule.args.limit;
                    if (Common.isResolvable(limit)) {
                        limit = limit.resolve(value, state, prefs);
                        if (!Common.limit(limit)) {
                            return { value, errors: schema.$_createError('any.ref', limit, { ref: rule.args.limit, arg: 'limit', reason: 'must be a positive integer' }, state, prefs) };
                        }
                    }

                    value = value.slice(0, limit);
                }
            }

            return { value };
        }
    },

    // Base validation

    validate: function (schema, value, { error }) {

        if (typeof value !== 'string') {
            return { value, errors: error('string.base') };
        }

        if (value === '') {
            return { value, errors: error('string.empty') };
        }
    },

    // Rules

    rules: {

        alphanum: {
            method: function () {

                return this.$_addRule('alphanum');
            },
            validate: function (value, helpers) {

                if (/^[a-zA-Z0-9]+$/.test(value)) {
                    return value;
                }

                return helpers.error('string.alphanum');
            }
        },

        base64: {
            method: function (options = {}) {

                Common.assertOptions(options, ['paddingRequired', 'urlSafe']);

                options = { urlSafe: false, paddingRequired: true, ...options };
                Hoek.assert(typeof options.paddingRequired === 'boolean', 'paddingRequired must be boolean');
                Hoek.assert(typeof options.urlSafe === 'boolean', 'urlSafe must be boolean');

                return this.$_addRule({ name: 'base64', args: { options } });
            },
            validate: function (value, helpers, { options }) {

                const regex = internals.base64Regex[options.paddingRequired][options.urlSafe];
                if (regex.test(value)) {
                    return value;
                }

                return helpers.error('string.base64');
            }
        },

        case: {
            method: function (direction) {

                Hoek.assert(['lower', 'upper'].includes(direction), 'Invalid case:', direction);

                return this.$_addRule({ name: 'case', args: { direction } });
            },
            validate: function (value, helpers, { direction }) {

                if (direction === 'lower' && value === value.toLocaleLowerCase() ||
                    direction === 'upper' && value === value.toLocaleUpperCase()) {

                    return value;
                }

                return helpers.error(`string.${direction}case`);
            },
            convert: true
        },

        creditCard: {
            method: function () {

                return this.$_addRule('creditCard');
            },
            validate: function (value, helpers) {

                let i = value.length;
                let sum = 0;
                let mul = 1;

                while (i--) {
                    const char = value.charAt(i) * mul;
                    sum = sum + (char - (char > 9) * 9);
                    mul = mul ^ 3;
                }

                if (sum > 0 &&
                    sum % 10 === 0) {

                    return value;
                }

                return helpers.error('string.creditCard');
            }
        },

        dataUri: {
            method: function (options = {}) {

                Common.assertOptions(options, ['paddingRequired']);

                options = { paddingRequired: true, ...options };
                Hoek.assert(typeof options.paddingRequired === 'boolean', 'paddingRequired must be boolean');

                return this.$_addRule({ name: 'dataUri', args: { options } });
            },
            validate: function (value, helpers, { options }) {

                const matches = value.match(internals.dataUriRegex.format);

                if (matches) {
                    if (!matches[2]) {
                        return value;
                    }

                    if (matches[2] !== 'base64') {
                        return value;
                    }

                    const base64regex = internals.dataUriRegex.base64[options.paddingRequired];
                    if (base64regex.test(matches[3])) {
                        return value;
                    }
                }

                return helpers.error('string.dataUri');
            }
        },

        domain: {
            method: function (options) {

                if (options) {
                    Common.assertOptions(options, ['allowUnicode', 'minDomainSegments', 'tlds']);
                    options = internals.addressOptions(options);
                }

                return this.$_addRule({ name: 'domain', args: { options } });
            },
            validate: function (value, helpers, { options }) {

                if (Address.domain.isValid(value, options)) {
                    return value;
                }

                return helpers.error('string.domain');
            }
        },

        email: {
            method: function (options = {}) {

                Common.assertOptions(options, ['allowUnicode', 'minDomainSegments', 'multiple', 'separator', 'tlds']);
                Hoek.assert(options.multiple === undefined || typeof options.multiple === 'boolean', 'multiple option must be an boolean');

                options = internals.addressOptions(options);
                const regex = new RegExp(`\\s*[${options.separator ? Hoek.escapeRegex(options.separator) : ','}]\\s*`);

                return this.$_addRule({ name: 'email', args: { options }, regex });
            },
            validate: function (value, helpers, { options }, { regex }) {

                const emails = options.multiple ? value.split(regex) : [value];
                const invalids = [];
                for (const email of emails) {
                    if (!Address.email.isValid(email, options)) {
                        invalids.push(email);
                    }
                }

                if (!invalids.length) {
                    return value;
                }

                return helpers.error('string.email', { value, invalids });
            }
        },

        guid: {
            alias: 'uuid',
            method: function (options = {}) {

                Common.assertOptions(options, ['version']);

                let versionNumbers = '';

                if (options.version) {
                    const versions = [].concat(options.version);

                    Hoek.assert(versions.length >= 1, 'version must have at least 1 valid version specified');
                    const set = new Set();

                    for (let i = 0; i < versions.length; ++i) {
                        const version = versions[i];
                        Hoek.assert(typeof version === 'string', 'version at position ' + i + ' must be a string');
                        const versionNumber = internals.guidVersions[version.toLowerCase()];
                        Hoek.assert(versionNumber, 'version at position ' + i + ' must be one of ' + Object.keys(internals.guidVersions).join(', '));
                        Hoek.assert(!set.has(versionNumber), 'version at position ' + i + ' must not be a duplicate');

                        versionNumbers += versionNumber;
                        set.add(versionNumber);
                    }
                }

                const regex = new RegExp(`^([\\[{\\(]?)[0-9A-F]{8}([:-]?)[0-9A-F]{4}\\2?[${versionNumbers || '0-9A-F'}][0-9A-F]{3}\\2?[${versionNumbers ? '89AB' : '0-9A-F'}][0-9A-F]{3}\\2?[0-9A-F]{12}([\\]}\\)]?)$`, 'i');

                return this.$_addRule({ name: 'guid', args: { options }, regex });
            },
            validate: function (value, helpers, args, { regex }) {

                const results = regex.exec(value);

                if (!results) {
                    return helpers.error('string.guid');
                }

                // Matching braces

                if (internals.guidBrackets[results[1]] !== results[results.length - 1]) {
                    return helpers.error('string.guid');
                }

                return value;
            }
        },

        hex: {
            method: function (options = {}) {

                Common.assertOptions(options, ['byteAligned']);

                options = { byteAligned: false, ...options };
                Hoek.assert(typeof options.byteAligned === 'boolean', 'byteAligned must be boolean');

                return this.$_addRule({ name: 'hex', args: { options } });
            },
            validate: function (value, helpers, { options }) {

                if (!internals.hexRegex.test(value)) {
                    return helpers.error('string.hex');
                }

                if (options.byteAligned &&
                    value.length % 2 !== 0) {

                    return helpers.error('string.hexAlign');
                }

                return value;
            }
        },

        hostname: {
            method: function () {

                return this.$_addRule('hostname');
            },
            validate: function (value, helpers) {

                if (value.length <= 255 && internals.hostRegex.test(value) ||
                    internals.ipRegex.test(value)) {

                    return value;
                }

                return helpers.error('string.hostname');
            }
        },

        insensitive: {
            method: function () {

                return this.$_setFlag('insensitive', true);
            }
        },

        ip: {
            method: function (options = {}) {

                Common.assertOptions(options, ['cidr', 'version']);

                options = Object.assign({}, options);       // Shallow cloned

                let regex = internals.ipRegex;
                if (options.cidr) {
                    Hoek.assert(typeof options.cidr === 'string', 'cidr must be a string');
                    options.cidr = options.cidr.toLowerCase();

                    Hoek.assert(Hoek.contain(internals.cidrPresences, options.cidr), 'cidr must be one of ' + internals.cidrPresences.join(', '));

                    if (!options.version &&
                        options.cidr !== 'optional') {

                        regex = Ip.createIpRegex(['ipv4', 'ipv6', 'ipvfuture'], options.cidr);
                    }
                }
                else {
                    options.cidr = 'optional';
                }

                let versions;
                if (options.version) {
                    if (!Array.isArray(options.version)) {
                        options.version = [options.version];
                    }

                    Hoek.assert(options.version.length >= 1, 'version must have at least 1 version specified');

                    versions = [];
                    for (let i = 0; i < options.version.length; ++i) {
                        let version = options.version[i];
                        Hoek.assert(typeof version === 'string', 'version at position ' + i + ' must be a string');
                        version = version.toLowerCase();
                        Hoek.assert(Ip.versions[version], 'version at position ' + i + ' must be one of ' + Object.keys(Ip.versions).join(', '));
                        versions.push(version);
                    }

                    versions = Array.from(new Set(versions));
                    regex = Ip.createIpRegex(versions, options.cidr);
                }

                return this.$_addRule({ name: 'ip', args: { options }, versions, regex });
            },
            validate: function (value, helpers, { options }, { versions, regex }) {

                if (regex.test(value)) {
                    return value;
                }

                if (versions) {
                    return helpers.error('string.ipVersion', { value, cidr: options.cidr, version: versions });
                }

                return helpers.error('string.ip', { value, cidr: options.cidr });
            }
        },

        isoDate: {
            method: function () {

                return this.$_addRule('isoDate');
            },
            validate: function (value, { error }) {

                if (Common.isIsoDate(value)) {
                    return value;
                }

                return error('string.isoDate');
            },
            convert: true
        },

        isoDuration: {
            method: function () {

                return this.$_addRule('isoDuration');
            },
            validate: function (value, helpers) {

                if (internals.isoDurationRegex.test(value)) {
                    return value;
                }

                return helpers.error('string.isoDuration');
            }
        },

        length: {
            method: function (limit, encoding) {

                return internals.length(this, 'length', limit, '=', encoding);
            },
            validate: function (value, helpers, { limit, encoding }, { name, operator, args }) {

                const length = encoding ? Buffer.byteLength(value, encoding) : value.length;
                if (Common.compare(length, limit, operator)) {
                    return value;
                }

                return helpers.error('string.' + name, { limit: args.limit, value, encoding });
            },
            args: [
                {
                    name: 'limit',
                    ref: true,
                    assert: Common.limit,
                    message: 'must be a positive integer'
                },
                'encoding'
            ]
        },

        lowercase: {
            method: function () {

                return this.case('lower');
            }
        },

        max: {
            method: function (limit, encoding) {

                return internals.length(this, 'max', limit, '<=', encoding);
            },
            args: ['limit', 'encoding']
        },

        min: {
            method: function (limit, encoding) {

                return internals.length(this, 'min', limit, '>=', encoding);
            },
            args: ['limit', 'encoding']
        },

        normalize: {
            method: function (form = 'NFC') {

                Hoek.assert(Hoek.contain(internals.normalizationForms, form), 'normalization form must be one of ' + internals.normalizationForms.join(', '));

                return this.$_addRule({ name: 'normalize', args: { form } });
            },
            validate: function (value, { error }, { form }) {

                if (value === value.normalize(form)) {
                    return value;
                }

                return error('string.normalize', { value, form });
            },
            convert: true
        },

        pattern: {
            alias: 'regex',
            method: function (regex, options = {}) {

                Hoek.assert(regex instanceof RegExp, 'regex must be a RegExp');
                Hoek.assert(!regex.flags.includes('g') && !regex.flags.includes('y'), 'regex should not use global or sticky mode');

                if (typeof options === 'string') {
                    options = { name: options };
                }

                Common.assertOptions(options, ['invert', 'name']);

                const errorCode = ['string.pattern', options.invert ? '.invert' : '', options.name ? '.name' : '.base'].join('');
                return this.$_addRule({ name: 'pattern', args: { regex, options }, errorCode });
            },
            validate: function (value, helpers, { regex, options }, { errorCode }) {

                const patternMatch = regex.test(value);

                if (patternMatch ^ options.invert) {
                    return value;
                }

                return helpers.error(errorCode, { name: options.name, regex, value });
            },
            args: ['regex', 'options'],
            multi: true
        },

        replace: {
            method: function (pattern, replacement) {

                if (typeof pattern === 'string') {
                    pattern = new RegExp(Hoek.escapeRegex(pattern), 'g');
                }

                Hoek.assert(pattern instanceof RegExp, 'pattern must be a RegExp');
                Hoek.assert(typeof replacement === 'string', 'replacement must be a String');

                const obj = this.clone();

                if (!obj.$_terms.replacements) {
                    obj.$_terms.replacements = [];
                }

                obj.$_terms.replacements.push({ pattern, replacement });
                return obj;
            }
        },

        token: {
            method: function () {

                return this.$_addRule('token');
            },
            validate: function (value, helpers) {

                if (/^\w+$/.test(value)) {
                    return value;
                }

                return helpers.error('string.token');
            }
        },

        trim: {
            method: function (enabled = true) {

                Hoek.assert(typeof enabled === 'boolean', 'enabled must be a boolean');

                return this.$_addRule({ name: 'trim', args: { enabled } });
            },
            validate: function (value, helpers, { enabled }) {

                if (!enabled ||
                    value === value.trim()) {

                    return value;
                }

                return helpers.error('string.trim');
            },
            convert: true
        },

        truncate: {
            method: function (enabled = true) {

                Hoek.assert(typeof enabled === 'boolean', 'enabled must be a boolean');

                return this.$_setFlag('truncate', enabled);
            }
        },

        uppercase: {
            method: function () {

                return this.case('upper');
            }
        },

        uri: {
            method: function (options = {}) {

                Common.assertOptions(options, ['allowRelative', 'allowQuerySquareBrackets', 'domain', 'relativeOnly', 'scheme']);

                const unknownOptions = Object.keys(options).filter((key) => !['scheme', 'allowRelative', 'relativeOnly', 'allowQuerySquareBrackets', 'domain'].includes(key));
                Hoek.assert(unknownOptions.length === 0, `options contain unknown keys: ${unknownOptions}`);

                if (options.domain) {
                    options = Object.assign({}, options);                   // Shallow cloned
                    options.domain = internals.addressOptions(options.domain);
                }

                const regex = Uri.createRegex(options);
                return this.$_addRule({ name: 'uri', args: { options }, regex });
            },
            validate: function (value, helpers, { options }, { regex }) {

                if (['http:/', 'https:/'].includes(value)) {            // scheme:/ is technically valid but makes no sense
                    return helpers.error('string.uri');
                }

                const match = regex.exec(value);
                if (match) {
                    if (options.domain &&
                        !Address.domain.isValid(match[1], options.domain)) {

                        return helpers.error('string.domain', { value: match[1] });
                    }

                    return value;
                }

                if (options.relativeOnly) {
                    return helpers.error('string.uriRelativeOnly');
                }

                if (options.scheme) {
                    return helpers.error('string.uriCustomScheme', { scheme: regex.scheme, value });
                }

                return helpers.error('string.uri');
            }
        }
    },

    // Build

    build: function (obj, desc) {

        for (const { pattern, replacement } of desc.replacements) {
            obj = obj.replace(pattern, replacement);
        }

        return obj;
    },

    // Errors

    messages: {
        'string.alphanum': '"{{#label}}" must only contain alpha-numeric characters',
        'string.base': '"{{#label}}" must be a string',
        'string.base64': '"{{#label}}" must be a valid base64 string',
        'string.creditCard': '"{{#label}}" must be a credit card',
        'string.dataUri': '"{{#label}}" must be a valid dataUri string',
        'string.domain': '"{{#label}}" must contain a valid domain name',
        'string.email': '"{{#label}}" must be a valid email',
        'string.empty': '"{{#label}}" is not allowed to be empty',
        'string.guid': '"{{#label}}" must be a valid GUID',
        'string.hex': '"{{#label}}" must only contain hexadecimal characters',
        'string.hexAlign': '"{{#label}}" hex decoded representation must be byte aligned',
        'string.hostname': '"{{#label}}" must be a valid hostname',
        'string.ip': '"{{#label}}" must be a valid ip address with a {{#cidr}} CIDR',
        'string.ipVersion': '"{{#label}}" must be a valid ip address of one of the following versions {{#version}} with a {{#cidr}} CIDR',
        'string.isoDate': '"{{#label}}" must be a valid ISO 8601 date',
        'string.isoDuration': '"{{#label}}" must be a valid ISO 8601 duration',
        'string.length': '"{{#label}}" length must be {{#limit}} characters long',
        'string.lowercase': '"{{#label}}" must only contain lowercase characters',
        'string.max': '"{{#label}}" length must be less than or equal to {{#limit}} characters long',
        'string.min': '"{{#label}}" length must be at least {{#limit}} characters long',
        'string.normalize': '"{{#label}}" must be unicode normalized in the {{#form}} form',
        'string.token': '"{{#label}}" must only contain alpha-numeric and underscore characters',
        'string.pattern.base': '"{{#label}}" with value "{[.]}" fails to match the required pattern: {{#regex}}',
        'string.pattern.name': '"{{#label}}" with value "{[.]}" fails to match the {{#name}} pattern',
        'string.pattern.invert.base': '"{{#label}}" with value "{[.]}" matches the inverted pattern: {{#regex}}',
        'string.pattern.invert.name': '"{{#label}}" with value "{[.]}" matches the inverted {{#name}} pattern',
        'string.trim': '"{{#label}}" must not have leading or trailing whitespace',
        'string.uri': '"{{#label}}" must be a valid uri',
        'string.uriCustomScheme': '"{{#label}}" must be a valid uri with a scheme matching the {{#scheme}} pattern',
        'string.uriRelativeOnly': '"{{#label}}" must be a valid relative uri',
        'string.uppercase': '"{{#label}}" must only contain uppercase characters'
    }
});


// Helpers

internals.addressOptions = function (options) {

    if (options.tlds &&
        typeof options.tlds === 'object') {

        Hoek.assert(options.tlds.allow === undefined ||
            options.tlds.allow === false ||
            options.tlds.allow === true ||
            Array.isArray(options.tlds.allow) ||
            options.tlds.allow instanceof Set, 'tlds.allow must be an array, Set, or boolean');

        Hoek.assert(options.tlds.deny === undefined ||
            Array.isArray(options.tlds.deny) ||
            options.tlds.deny instanceof Set, 'tlds.deny must be an array or Set');

        const normalizeTable = (table) => {

            if (table === undefined ||
                typeof table === 'boolean' ||
                table instanceof Set) {

                return table;
            }

            return new Set(table);
        };

        options = Object.assign({}, options);       // Shallow cloned
        options.tlds = {
            allow: normalizeTable(options.tlds.allow),
            deny: normalizeTable(options.tlds.deny)
        };
    }

    Hoek.assert(options.minDomainSegments === undefined ||
        Number.isSafeInteger(options.minDomainSegments) && options.minDomainSegments > 0, 'minDomainSegments must be a positive integer');

    return options;
};


internals.length = function (schema, name, limit, operator, encoding) {

    Hoek.assert(!encoding || Buffer.isEncoding(encoding), 'Invalid encoding:', encoding);

    return schema.$_addRule({ name, method: 'length', args: { limit, encoding }, operator });
};
