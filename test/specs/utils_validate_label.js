

const validate_label = require('../../src/utils/validate_label');

describe('validate field label', () => {

	[
		'field',
		'Field',
		'AB_'
	]
		.forEach(key => {

			it(`should accept ${key} as a valid field label`, () => {

				validate_label(key);

			});

		});

	[
		'"',
		'\'',
		'`',
		'?'
	]
		.forEach(key => {

			it(`should not accept ${key} as a valid field label`, () => {

				try {

					validate_label(key);

				}
				catch (e) {

					return;

				}

				throw new Error('is not valid alias');

			});

		});

});

