// Field Reducer
// Extract the fields from the current dataset

const field_format = require('../../src/utils/field_format');

describe('utils/field_format', () => {

	// Should unwrap SQL Formating to underlying column name
	[
		// Expect the response to add the current alias to the field
		[
			['field', undefined, 'tbl'],
			['tbl.field']
		],

		// Update the expression even where it includes a function wrapper
		[
			['DATE(field)', '_date', 'tbl'],
			['DATE(tbl.field)', '_date']
		],

		// Mark items which contain COUNT, as an aggregate
		[
			['COUNT(DISTINCT field)', 'count', 'tbl'],
			['COUNT(DISTINCT tbl.field)', 'count', true]
		],

		// Prefix the label with the prefix label address
		[
			['field', 'label', 'nested', 'nested.'],
			['nested.field', 'nested.label']
		],

		// If the expression defines a nested field, take that away from the prefix label address
		[
			['nested.field', 'label', 'nested', 'nested.'],
			['nested.field', 'label']
		],

		// If the expression defines a nested field, take that away from the prefix label address
		[
			['SUM(nested.field)', 'count', 'nested', 'nested.'],
			['SUM(nested.field)', 'count', true]
		],
		[
			['COUNT(deep.nested.field)', 'count', 'nested', 'deep.nested.'],
			['COUNT(nested.field)', 'count', true]
		],
		[
			['COUNT(nested.field)', 'count', 'nested', 'deep.nested.'],
			['COUNT(nested.field)', 'deep.count', true]
		]

	].forEach(test => {

		// Test
		const input = test[0];

		// Expect
		const expected = test[1];

		it(`where ${input} => ${expected}`, () => {

			// Call the field with the
			const actual = field_format(...input);

			// Expect the formatted list of fields to be identical to the inputted value
			expect(actual).to.eql({
				expression: expected[0],
				label: expected[1] || undefined,
				agg: expected[2] || false
			});
		});
	});
});

