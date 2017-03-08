'use strict';

// Test Generic DB functions
const group_concat = require('../../src/utils/group_concat');

describe('utils/group_concat', () => {


	it('should return a function', () => {
		expect(group_concat).to.be.a('function');
	});

	it('should reduce an array of fields to a GROUP_CONCAT statement', () => {

		const gc = group_concat([{
			def: 'table.a',
			as: 'a'
		}, {
			def: 'table.b',
			as: 'b'
		}]);

		expect(gc.field).to.eql('CONCAT(\'[\', GROUP_CONCAT(CONCAT(\'[\', \'"\', REPLACE(table.a, \'"\', \'\\"\'), \'"\', \',\', \'"\', REPLACE(table.b, \'"\', \'\\"\'), \'"\', \']\')), \']\')');
	});

	it('should not wrap fields which are marked as aggregating the row', () => {

		const gc = group_concat([{
			def: 'table.a',
			as: 'a',
			agg: true
		}, {
			def: 'table.b',
			as: 'b'
		}]);

		expect(gc.field).to.eql('CONCAT(\'[\', \'"\', REPLACE(table.a, \'"\', \'\\"\'), \'"\', \',\', \'"\', REPLACE(table.b, \'"\', \'\\"\'), \'"\', \']\')');

	});

});

