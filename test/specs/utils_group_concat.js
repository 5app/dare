/* eslint quotes: ["error", "single", { "avoidEscape": true, "allowTemplateLiterals": true }]*/


// Test Generic DB functions
const group_concat = require('../../src/utils/group_concat');

describe('utils/group_concat', () => {


	it('should return a function', () => {

		expect(group_concat).to.be.a('function');

	});

	it('should reduce an array of fields to a GROUP_CONCAT statement', () => {

		const gc = group_concat([{
			expression: 'table.a',
			label: 'collection.a'
		}, {
			expression: 'table.b',
			label: 'collection.b'
		}], 'collection.');

		expect(gc.expression).to.eql(`CONCAT('[', GROUP_CONCAT(CONCAT_WS('', '[', '"', REPLACE(REPLACE(table.a, '\\\\', '\\\\\\\\'), '"', '\\\\"'), '"', ',', '"', REPLACE(REPLACE(table.b, '\\\\', '\\\\\\\\'), '"', '\\\\"'), '"', ']')), ']')`);
		expect(gc.label).to.eql('collection[a,b]');

	});

	it('should not wrap fields which are marked as aggregating the row', () => {

		const gc = group_concat([{
			expression: 'table.a',
			label: 'a',
			agg: true
		}, {
			expression: 'table.b',
			label: 'b'
		}]);

		expect(gc.expression).to.eql(`CONCAT_WS('', '[', '"', REPLACE(REPLACE(table.a, '\\\\', '\\\\\\\\'), '"', '\\\\"'), '"', ',', '"', REPLACE(REPLACE(table.b, '\\\\', '\\\\\\\\'), '"', '\\\\"'), '"', ']')`);
		expect(gc.label).to.eql('a,b');

	});


	it('should return a single value if one is given and is an aggregate', () => {

		const gc = group_concat([{
			expression: 'table.a',
			label: 'a',
			agg: true
		}]);

		expect(gc.expression).to.eql('table.a');
		expect(gc.label).to.eql('a');

	});

	it('should return an array of values for many results', () => {

		const gc = group_concat([{
			expression: 'table.a',
			label: 'collection.a'
		}], 'collection.');

		expect(gc.expression).to.eql(`CONCAT('[', GROUP_CONCAT(CONCAT_WS('', '[', '"', REPLACE(REPLACE(table.a, '\\\\', '\\\\\\\\'), '"', '\\\\"'), '"', ']')), ']')`);
		expect(gc.label).to.eql('collection[a]');

	});

	it('should infer from the label whether results are implicitly aggregated', () => {

		const gc = group_concat([{
			expression: 'table.a',
			label: 'a'
		}], 'collection.');

		expect(gc.expression).to.eql('table.a');
		expect(gc.label).to.eql('a');


		const gc_many = group_concat([{
			expression: 'table.a',
			label: 'a'
		}, {
			expression: 'table.b',
			label: 'b'
		}], 'collection.');

		expect(gc_many.expression).to.eql(`CONCAT_WS('', '[', '"', REPLACE(REPLACE(table.a, '\\\\', '\\\\\\\\'), '"', '\\\\"'), '"', ',', '"', REPLACE(REPLACE(table.b, '\\\\', '\\\\\\\\'), '"', '\\\\"'), '"', ']')`);
		expect(gc_many.label).to.eql('a,b');

	});

});

