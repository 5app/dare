/* eslint quotes: ["error", "single", { "avoidEscape": true, "allowTemplateLiterals": true }]*/
import {expect} from 'chai';

// Test Generic DB functions
import group_concat from '../../src/utils/group_concat.js';

const rowid = '_rowid';

const MYSQL_56 = 'mysql:5.6';

['', MYSQL_56].forEach(DB_ENGINE => {
	describe(`utils/group_concat: (mysql ${DB_ENGINE})`, () => {
		before(() => {
			// Set the mysql version...
			process.env.DB_ENGINE = DB_ENGINE;
		});

		after(() => {
			delete process.env.DB_ENGINE;
		});

		it('should return a function', () => {
			expect(group_concat).to.be.a('function');
		});

		it('should reduce an array of fields to a GROUP_CONCAT statement', () => {
			const gc = group_concat(
				[
					{
						expression: 'table.a',
						label: 'collection.a',
					},
					{
						expression: 'table.b',
						label: 'collection.b',
					},
				],
				'collection.',
				'a',
				rowid
			);

			const expectSQLEqual =
				DB_ENGINE === MYSQL_56
					? `CONCAT('[', GROUP_CONCAT(IF(a._rowid IS NOT NULL, CONCAT_WS('', '[', '"', REPLACE(REPLACE(table.a, '\\\\', '\\\\\\\\'), '"', '\\\\"'), '"', ',', '"', REPLACE(REPLACE(table.b, '\\\\', '\\\\\\\\'), '"', '\\\\"'), '"', ']'), NULL)), ']')`
					: `JSON_ARRAYAGG(IF(a._rowid IS NOT NULL, JSON_ARRAY(table.a,table.b), NULL))`;

			expect(gc.expression).to.eql(expectSQLEqual);
			expect(gc.label).to.eql('collection[a,b]');
		});

		it('should not wrap fields which are marked as aggregating the row', () => {
			const gc = group_concat([
				{
					expression: 'table.a',
					label: 'a',
					agg: true,
				},
				{
					expression: 'table.b',
					label: 'b',
				},
			]);

			const expectSQLEqual =
				DB_ENGINE === MYSQL_56
					? `CONCAT_WS('', '[', '"', REPLACE(REPLACE(table.a, '\\\\', '\\\\\\\\'), '"', '\\\\"'), '"', ',', '"', REPLACE(REPLACE(table.b, '\\\\', '\\\\\\\\'), '"', '\\\\"'), '"', ']')`
					: `JSON_ARRAY(table.a,table.b)`;

			expect(gc.expression).to.eql(expectSQLEqual);
			expect(gc.label).to.eql('a,b');
		});

		it('should return a single value if one is given and is an aggregate', () => {
			const gc = group_concat([
				{
					expression: 'table.a',
					label: 'a',
					agg: true,
				},
			]);

			expect(gc.expression).to.eql('table.a');
			expect(gc.label).to.eql('a');
		});

		it('should return an array of values for many results', () => {
			const gc = group_concat(
				[
					{
						expression: 'table.a',
						label: 'collection.a',
					},
				],
				'collection.',
				'a',
				rowid
			);

			const expectSQLEqual =
				DB_ENGINE === MYSQL_56
					? `CONCAT('[', GROUP_CONCAT(IF(a._rowid IS NOT NULL, CONCAT_WS('', '[', '"', REPLACE(REPLACE(table.a, '\\\\', '\\\\\\\\'), '"', '\\\\"'), '"', ']'), NULL)), ']')`
					: `JSON_ARRAYAGG(IF(a._rowid IS NOT NULL, JSON_ARRAY(table.a), NULL))`;

			expect(gc.expression).to.eql(expectSQLEqual);

			expect(gc.label).to.eql('collection[a]');
		});

		it('should infer from the label whether results are implicitly aggregated', () => {
			const gc = group_concat(
				[
					{
						expression: 'table.a',
						label: 'a',
					},
				],
				'collection.'
			);

			expect(gc.expression).to.eql('table.a');
			expect(gc.label).to.eql('a');

			const gc_many = group_concat(
				[
					{
						expression: 'table.a',
						label: 'a',
					},
					{
						expression: 'table.b',
						label: 'b',
					},
				],
				'collection.'
			);

			const expectSQLEqual =
				DB_ENGINE === MYSQL_56
					? `CONCAT_WS('', '[', '"', REPLACE(REPLACE(table.a, '\\\\', '\\\\\\\\'), '"', '\\\\"'), '"', ',', '"', REPLACE(REPLACE(table.b, '\\\\', '\\\\\\\\'), '"', '\\\\"'), '"', ']')`
					: `JSON_ARRAY(table.a,table.b)`;

			expect(gc_many.expression).to.eql(expectSQLEqual);
			expect(gc_many.label).to.eql('a,b');
		});
	});
});
