

const validate_alias = require('../../src/utils/validate_field');

describe('validate field alias', () => {

	[
		'field',
		'Field',
		'AB_'
	]
		.forEach(key => {

			it(`should accept ${key} as a valid field reference`, () => {

				validate_alias(key);

			});

		});

	[
		'use rs',
		'users(1',
		'*',
		'a.*'
	]
		.forEach(key => {

			it(`should not accept ${key} as a valid field references`, () => {

				expect(() => validate_alias(key)).to.throw(Error);

			});

		});

});

