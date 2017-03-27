// Field Reducer
// Extract the fields from the current dataset

const field_reducer = require('../../src/utils/field_reducer');

describe('Field Reducer', () => {

	describe('should split the current fields belonging to the current and joined tables', () => {

		// These are all related to the current item
		// And should return an array item with the item as given
		[
			// Test 1
			[
				['field', 'b_table.b_field'],
				['field'],
				['b_table.b_field']
			],

			// Test 2
			[
				[{
					'Field': 'COUNT(DISTINCT field)'
				}],
			],

			// Test 3
			[
				['field']
			],

			// Test 4
			[
				[{
					'Field': 'field',
					'Another Field': 'b_table.b_field'
				}],
				[{
					'Field': 'field'
				}],
				[{
					'Another Field': 'b_table.b_field'
				}]
			],

			// Test 5
			[
				[{
					'Field': 'COUNT(DISTINCT field)',
					'Another Field': 'COUNT(DISTINCT b_table.b_field)'
				}],
				[{
					'Field': 'COUNT(DISTINCT field)'
				}],
				[{
					'Another Field': 'COUNT(DISTINCT b_table.b_field)'
				}]
			],

			// Test 6
			[
				[{
					'Field': 'COUNT(DISTINCT asset.field)'
				}],
				[{
					'Field': 'COUNT(DISTINCT asset.field)'
				}]
			],

		].forEach(test => {

			const input = test[0]; // Test request fields array to process
			const expected = test[1] || test[0]; // Test expected || or return the test request untouched
			const expect_join_fields = test[2]; // Expect Joined fields


			// Mock instance of Dare
			const inst = {};

			// Details about the current table...
			const alias = 'something.asset.';
			const joined = {};

			// Schema
			const schema = {
				'asset': {}
			};

			// Curry the field_reducer
			const fr = field_reducer.call(inst, alias, joined, schema);


			it(`where ${JSON.stringify(input)}`, () => {

				// Call the field with the
				const f = input.reduce(fr, []);

				// Expect the formatted list of fields to be identical to the inputted value
				expect(f).to.eql(expected);

				if (expect_join_fields) {
					expect(joined.b_table.fields).to.eql(expect_join_fields);
				}
			});
		});
	});
});

