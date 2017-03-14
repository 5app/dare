'use strict';

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

		expect(gc.expression).to.eql('CONCAT(\'[\', GROUP_CONCAT(CONCAT(\'[\', \'"\', REPLACE(table.a, \'"\', \'\\"\'), \'"\', \',\', \'"\', REPLACE(table.b, \'"\', \'\\"\'), \'"\', \']\')), \']\')');
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

		expect(gc.expression).to.eql('CONCAT(\'[\', \'"\', REPLACE(table.a, \'"\', \'\\"\'), \'"\', \',\', \'"\', REPLACE(table.b, \'"\', \'\\"\'), \'"\', \']\')');
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

		expect(gc.expression).to.eql('CONCAT(\'[\', GROUP_CONCAT(CONCAT(\'[\', \'"\', REPLACE(table.a, \'"\', \'\\"\'), \'"\', \']\')), \']\')');
		expect(gc.label).to.eql('collection[a]');
	});
});

