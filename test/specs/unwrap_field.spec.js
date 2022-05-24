/*
 * Field Reducer
 * Extract the fields from the current dataset
 */

import unwrap_field from '../../src/utils/unwrap_field.js';
import DareError from '../../src/utils/error.js';

describe('utils/unwrap_field', () => {

	// Should unwrap SQL Formating to underlying column name
	[
		'field',
		'DATE(field)',
		'!field',
		'!DATE(field)',
		'DATE_FORMAT(field, "%Y-%m-%dT%T.%fZ")',
		'DATE_SUB(field, INTERVAL 10 DAY)',
		'COUNT(DISTINCT field)',
		'GROUP_CONCAT(DISTINCT field)',
		'GROUP_CONCAT(DISTINCT field ORDER BY 1)',
		'MAX(DAY(field))',
		'EXTRACT(YEAR_MONTH FROM field)',
		'IF(field, "yes", "no")',
		'IF(field = 1, "yes", "no")',
		'IF(field > 1, "yes", "no")',
		'IF(field < 1, "yes", "no")',
		'IF(field >= 1, "yes", "no")',
		'IF(field <= 1, "yes", "no")',
		'IF(field != 1, "yes", "no")',
		'IF(field <> 1, "yes", "no")',
		'IF(field = "string", "yes", "no")',
		'IF(field != \'string\', "yes", "no")',
		'COALESCE(field, "")',
		'NULLIF(field, "is null")',
		'ROUND(field, 2)',
		'ROUND(AVG(field) * 100, 2)',
		'RIGHT(field, 4)',
		'FORMAT(field,\'en_GB\')',
		'CONCAT(ROUND(field * 100, 2), \'%\')',
		'FORMAT(ROUND(field * 5, 2), \'en_GB\')',
		'FORMAT(ROUND(field * 5.5, 2), \'en_GB\')',
		'FORMAT(ROUND(field / 5, 2), \'en_GB\')'
	].forEach(test => {

		it(`where ${JSON.stringify(test)}`, () => {

			// Call the field with the
			const unwrapped = unwrap_field(test);

			// Expect the formatted list of fields to be identical to the inputted value
			expect(unwrapped.field).to.eql('field');

		});

	});

	// Should unwrap SQL Formating to underlying column name
	[
		'field(',
		'CONCAT(field, secret)',
		'IF(field < field2, "yes", "no")',
		'IF(field IS NOT NULL, "yes", "no")',
		'IF(field < "string"str, "yes", "no")',
		'IF(field = \'string", "yes", "no")',
		'IF(field <<< 123, "yes", "no")',
		'IF(field<123, "yes", "no")',
		'DATE_FORMAT(field, '
	].forEach(test => {

		it(`errors: ${JSON.stringify(test)}`, () => {

			// Expect the formatted list of fields to be identical to the inputted value
			expect(unwrap_field.bind(null, test)).to.throw(DareError);

		});

	});

});

