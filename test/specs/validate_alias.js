'use strict';

const validate_alias = require('../../src/utils/validate_alias');

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

				try {
					validate_alias(key);
				}
				catch (e) {
					return;
				}

				throw new Error('is not valid alias');

			});
		});

});

