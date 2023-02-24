/*
 * Field Reducer
 * Extract the fields from the current dataset
 */

import field_reducer from '../../src/format/field_reducer.js';

describe('Field Reducer', () => {
	let dareInstance;

	// Mock instance of Dare
	beforeEach(() => {
		dareInstance = {
			generated_fields: [],
		};
	});

	describe('should split the current fields belonging to the current and joined tables', () => {
		/*
		 * These are all related to the current item
		 * And should return an array item with the item as given
		 */
		[
			// Test 1
			[['field', 'b_table.b_field'], ['field'], ['b_table.b_field']],

			// Test 2
			[
				[
					{
						Field: 'COUNT(DISTINCT field)',
					},
				],
			],

			// Test 3
			[['field']],

			// Test 4
			[
				[
					{
						Field: 'field',
						'Another Field': 'b_table.b_field',
					},
				],
				[
					{
						Field: 'field',
					},
				],
				[
					{
						'Another Field': 'b_table.b_field',
					},
				],
			],

			// Test 5
			[
				[
					{
						Field: 'COUNT(DISTINCT field)',
						'Another Field': 'COUNT(DISTINCT b_table.b_field)',
					},
				],
				[
					{
						Field: 'COUNT(DISTINCT field)',
					},
				],
				[
					{
						'Another Field': 'COUNT(DISTINCT b_table.b_field)',
					},
				],
			],

			// Test 6
			[
				[
					{
						Field: 'COUNT(DISTINCT asset.field)',
					},
				],
				[
					{
						Field: 'COUNT(DISTINCT asset.field)',
					},
				],
			],
			// Test 7
			[
				[
					{
						Field: 'asset.field',
						b_table: {},
					},
				],
				[
					{
						Field: 'asset.field',
					},
				],
			],
			// Test 8
			[
				[
					{
						Field: 'asset.field',
						b_table: [],
					},
				],
				[
					{
						Field: 'asset.field',
					},
				],
			],

			// Test 8
			[
				[
					{
						Field: 'asset.field',
						b_table: [],
					},
				],
				[
					{
						Field: 'asset.field',
					},
				],
			],
			/*
			 * Alias to another
			 * Taps into an alias on the current model which maps to another table field
			 */
			[
				['crossTableAlias'],
				[],
				[
					{
						crossTableAlias: 'b_table.realField',
					},
				],
			],
			[
				[
					{
						Field: 'COUNT(crossTableAlias)',
					},
				],
				[],
				[
					{
						Field: 'COUNT(b_table.realField)',
					},
				],
			],

			// Should ignore trailing $suffix
			[['field$suffix'], ['field']],
		].forEach(test => {
			const input = test[0]; // Test request fields array to process
			const expected = test[1] || test[0]; // Test expected || or return the test request untouched
			const expect_join_fields = test[2]; // Expect Joined fields

			// Details about the current table...
			const field_alias_path = 'something.asset.';
			const table_schema = {
				crossTableAlias: {
					alias: 'b_table.realField',
				},
			};
			const joined = {};

			function extract(key, value) {
				if (!(key in joined)) {
					joined[key] = {fields: value};
				} else {
					joined[key].fields.push(...value);
				}
			}

			// Curry the field_reducer
			const fr = field_reducer({
				field_alias_path,
				extract,
				table_schema,
				dareInstance,
			});

			it(`where ${JSON.stringify(input)}`, () => {
				// Call the field with the
				const f = input.reduce(fr, []);

				// Expect the formatted list of fields to be identical to the inputted value
				expect(f).to.eql(expected);

				if (expect_join_fields) {
					expect(joined.b_table.fields).to.eql(expect_join_fields);
				} else {
					expect(joined).to.not.have.property('b_table');
				}
			});
		});
	});

	it('should return generated fields', () => {
		const table_schema = {
			generated_field() {
				expect(this).to.be.equal(dareInstance);
				return 'another_field';
			},
		};

		const field_alias_path = 'alias';

		// Curry the field_reducer
		const fr = field_reducer({
			field_alias_path,
			table_schema,
			dareInstance,
		});

		// Call the field with the
		const f = ['generated_field'].reduce(fr, []);

		// Expect the formatted list of fields to be identical to the inputted value
		expect(f[0]).to.have.property('generated_field', 'another_field');
	});

	it('should format datetime fields', () => {
		const table_schema = {
			created: {
				type: 'datetime',
			},
		};

		const field_alias_path = 'created';

		// Curry the field_reducer
		const fr = field_reducer({
			field_alias_path,
			table_schema,
			dareInstance,
		});

		// Call the field with the
		const f = ['created'].reduce(fr, []);

		// Expect the formatted list of fields to be identical to the inputted value
		expect(f[0]).to.have.property(
			'created',
			"DATE_FORMAT(created,'%Y-%m-%dT%TZ')"
		);
	});

	it('should format type=json fields', () => {
		const table_schema = {
			meta: {
				type: 'json',
			},
		};

		const field_alias_path = 'created';

		// Curry the field_reducer
		const fr = field_reducer({
			field_alias_path,
			table_schema,
			dareInstance,
		});

		// Call the field with the
		const f = ['meta'].reduce(fr, []);

		// Expect the formatted list of fields to be identical to the inputted value
		expect(f[0]).to.equal('meta');

		const [postProcessing] = dareInstance.generated_fields;

		expect(postProcessing).to.be.a('object');

		expect(postProcessing).to.have.property('label', 'meta');
		expect(postProcessing).to.have.property(
			'field_alias_path',
			field_alias_path
		);
		expect(postProcessing).to.have.property('handler');
	});

	it('should format aliased fields', () => {
		const table_schema = {
			fieldAlias: 'field',
		};

		const field_alias_path = 'joinTable.';

		// Curry the field_reducer
		const fr = field_reducer({
			field_alias_path,
			table_schema,
			dareInstance,
		});

		// Call the field with the
		const f = [
			{
				'Label Alias': 'joinTable.fieldAlias',
			},
		].reduce(fr, []);

		// Expect the formatted list of fields to be identical to the inputted value
		expect(f[0]).to.have.property('Label Alias', 'joinTable.field');
	});
});
