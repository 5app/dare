/*
 * Field Reducer
 * Extract the fields from the current dataset
 */

import groupby_reducer from '../../src/format/groupby_reducer.js';

describe('Groupby Reducer', () => {
	describe('should split the current fields belonging to the current and joined tables', () => {
		/*
		 * These are all related to the current item
		 * And should return an array item with the item as given
		 */
		[
			// Test 1
			[['field', 'b_table.b_field'], ['field'], ['b_field']],

			// Test 2
			[['field', 'DATE(DISTINCT field)']],

			// Test 3
			[['DATE(b_table.b_field)'], [], ['DATE(b_field)']],
		].forEach(test => {
			const input = test[0]; // Test request fields array to process
			const expected = test[1] || test[0]; // Test expected || or return the test request untouched
			const expect_join_fields = test[2]; // Expect Joined fields

			it(`where ${JSON.stringify(input)}`, () => {
				// Set joined...
				const joined = {};
				const current_path = '';
				function extract(key, value) {
					joined[key] = joined[key] || {groupby: []};
					joined[key].groupby.push(...value);
				}

				// Curry the field_reducer
				const reducer = groupby_reducer({current_path, extract});

				// Call the field with the
				const f = input.reduce(reducer, []);

				// Expect the formatted list of fields to be identical to the inputted value
				expect(f).to.eql(expected);

				if (expect_join_fields) {
					expect(joined.b_table.groupby).to.eql(expect_join_fields);
				} else {
					expect(joined).to.not.have.property('b_table');
				}
			});
		});
	});
});
