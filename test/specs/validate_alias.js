

import validate_alias from '../../src/utils/validate_alias.js';

describe('validate table alias', () => {

	[
		'users',
		'users$1',
		'users_table',
		'usersTable'
	]
		.forEach(key => {

			it(`should accept ${key} as a valid table references`, () => {

				validate_alias(key);

			});

		});

	[
		'use rs',
		'users(1'
	]
		.forEach(key => {

			it(`should not accept ${key} as a valid table references`, () => {

				expect(() => validate_alias(key)).to.throw(Error);

			});

		});

});

