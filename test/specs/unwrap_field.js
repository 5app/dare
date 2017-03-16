// Field Reducer
// Extract the fields from the current dataset

const unwrap_field = require('../../src/utils/unwrap_field');

describe('utils/unwrap_field', () => {

	// Should unwrap SQL Formating to underlying column name
	[
		'field',
		'DATE(field)',
		'COUNT(DISTINCT field)',
		'GROUP_CONCAT(DISTINCT field)',
		'MAX(DAY(field))',
		'EXTRACT(YEAR_MONTH FROM field)'
	].forEach(test => {

		it(`where ${JSON.stringify(test)}`, () => {

			// Call the field with the
			const unwrapped = unwrap_field(test);

			// Expect the formatted list of fields to be identical to the inputted value
			expect(unwrapped.field).to.eql('field');
		});
	});
});

