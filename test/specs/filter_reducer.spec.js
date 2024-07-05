import {expect} from 'chai';
import Dare from '../../src/index.js';

/*
 * Filter Reducer
 * Extract the filter conditions from the given conditions
 */

import reduceConditions from '../../src/format/reducer_conditions.js';

describe('Filter Reducer', () => {
	let dareInstance;
	const conditional_operators_in_value = null;
	let table_schema = null;
	// eslint-disable-next-line func-style
	const extract = () => {
		// Do nothing
	};

	// Mock instance of Dare
	beforeEach(() => {
		dareInstance = new Dare();
		table_schema = {
			textsearch: 'givenname,lastname,email',
			jsonSettings: {
				type: 'json',
			},
			// Join with an arbitrary table
			a_id: 'a.id',
		};
	});

	describe('should prep conditions', () => {
		const testStr = 'string';

		const a = [
			[{prop: testStr}, 'a.prop = ?', [testStr]],

			// Across multiple fields: field1,field2,field3
			[
				{
					'givenname,lastname,email': testStr,
				},
				`(a.givenname = ? OR a.lastname = ? OR a.email = ?)`,
				[testStr, testStr, testStr],
			],
			[
				{
					'%givenname,lastname,email': testStr,
				},
				`(a.givenname LIKE ? OR a.lastname LIKE ? OR a.email LIKE ?)`,
				[testStr, testStr, testStr],
			],
			[
				{
					'-givenname,lastname,email': testStr,
				},
				`NOT (a.givenname = ? OR a.lastname = ? OR a.email = ?)`,
				[testStr, testStr, testStr],
			],

			// *: Full text
			[
				{
					'*givenname,lastname,email': testStr,
				},
				`MATCH(a.givenname, a.lastname, a.email) AGAINST(? IN BOOLEAN MODE)`,
				[testStr],
			],
			[
				{
					'-*givenname,lastname,email': testStr,
				},
				`NOT MATCH(a.givenname, a.lastname, a.email) AGAINST(? IN BOOLEAN MODE)`,
				[testStr],
			],
			[
				{
					'*textsearch': testStr,
				},
				`MATCH(a.givenname, a.lastname, a.email) AGAINST(? IN BOOLEAN MODE)`,
				[testStr],
			],

			// JSON
			[
				// Entire JSON field should be queryable as a string
				{
					'%jsonSettings': testStr,
				},
				`a.jsonSettings LIKE ?`,
				[testStr],
			],
			[
				{
					jsonSettings: {
						key: testStr,
					},
				},
				`(a.jsonSettings->? = ?)`,
				['$.key', testStr],
			],
			[
				{
					'-jsonSettings': {
						key: testStr,
					},
				},
				`NOT (a.jsonSettings->? = ?)`,
				['$.key', testStr],
			],
			[
				{
					jsonSettings: {
						'-key': testStr,
					},
				},
				`(a.jsonSettings->? != ?)`,
				['$.key', testStr],
			],
			[
				{
					jsonSettings: {
						'-key': null,
					},
				},
				`(a.jsonSettings->? IS NOT NULL)`,
				['$.key'],
			],
			[
				{
					jsonSettings: {
						key: ['a', 'b', 1],
					},
				},
				`(a.jsonSettings->? IN (?,?,?))`,
				['$.key', '"a"', '"b"', 1],
			],
		];

		a.forEach(async test => {
			const [filter, sql, values, options] = test;

			// Clone filter
			const filter_cloned = structuredClone(filter);

			it(`should transform condition ${JSON.stringify(
				filter
			)} -> ${JSON.stringify(sql)}`, async () => {
				if (options) {
					dareInstance = dareInstance.use(options);
				}
				const [query] = reduceConditions(filter, {
					extract,
					sql_alias: 'a',
					table_schema,
					conditional_operators_in_value,
					dareInstance,
				});

				expect(query.sql).to.equal(sql);
				expect(query.values).to.deep.equal(values);

				// Should not mutate the filters...
				expect(filter).to.deep.eql(filter_cloned);
			});
		});
	});

	describe('mysql engine version handling', () => {
		afterEach(() => {
			delete process.env.DB_ENGINE;
		});

		['mysql:5.7', 'mysql:8.0'].forEach(version => {
			const quote = version === 'mysql:5.7';

			it(`${version} should ${quote ? '' : 'NOT '}quote json list (IN) sting values`, () => {
				process.env.DB_ENGINE = version;

				const filter = {
					jsonSettings: {
						key: ['a', 'b', 1],
					},
				};

				const expectedValues = quote
					? ['"a"', '"b"', 1]
					: ['a', 'b', 1];

				const sql = `(a.jsonSettings->? IN (?,?,?))`;
				const values = ['$.key', ...expectedValues];

				const [query] = reduceConditions(filter, {
					extract,
					sql_alias: 'a',
					table_schema,
					conditional_operators_in_value,
					dareInstance,
				});

				expect(query.sql).to.equal(sql);
				expect(query.values).to.deep.equal(values);
			});
		});
	});

	describe('postgres engine version handling', () => {

		beforeEach(() => {
			process.env.DB_ENGINE = 'postgres:16.3';
		});
		afterEach(() => {
			delete process.env.DB_ENGINE;
		});

		it('should search fulltext - with an index', () => {
			const filter = {
				'*vector_index': 'string',
			};

			const sql = `a.vector_index @@ to_tsquery('english', ?)`;
			const values = ['string'];

			const [query] = reduceConditions(filter, {
				extract,
				sql_alias: 'a',
				table_schema,
				conditional_operators_in_value,
				dareInstance,
			});

			expect(query.sql).to.equal(sql);
			expect(query.values).to.deep.equal(values);
		});

		it('should search fulltext - and build an index', () => {
			const filter = {
				'*givenname,lastname,email': 'string',
			};

			const sql = `TO_TSVECTOR(a.givenname || ' ' || a.lastname || ' ' || a.email) @@ to_tsquery('english', ?)`;
			const values = ['string'];

			const [query] = reduceConditions(filter, {
				extract,
				sql_alias: 'a',
				table_schema,
				conditional_operators_in_value,
				dareInstance,
			});

			expect(query.sql).to.equal(sql);
			expect(query.values).to.deep.equal(values);
		});

		it(`quote json number and boolean values`, () => {

			const filter = {
				jsonSettings: {
					key: 1,
					'%str': 'string%',
				},
			};


			const [query] = reduceConditions(filter, {
				extract,
				sql_alias: 'a',
				table_schema,
				conditional_operators_in_value,
				dareInstance,
			});

			const sql = `(a.jsonSettings->>? = ? AND a.jsonSettings->>? ILIKE ?)`;
			const values = ['key', '1', 'str', 'string%'];

			expect(query.sql).to.equal(sql);
			expect(query.values).to.deep.equal(values);
		});



	});
});
