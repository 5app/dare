/*
 * Field Reducer
 * Extract the fields from the current dataset
 */

const extend = require('../../src/utils/extend');

describe('utils/extend', () => {


	it('should not extend prototype', () => {

		extend({}, JSON.parse('{"__proto__": {"devMode": true}}'));

		expect({}.devMode).to.not.be.ok;

	});

});

