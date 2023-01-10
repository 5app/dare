/*
 * Field Reducer
 * Extract the fields from the current dataset
 */

import extend from '../../src/utils/extend.js';

describe('utils/extend', () => {
	it('should not extend prototype', () => {
		extend({}, JSON.parse('{"__proto__": {"devMode": true}}'));

		// eslint-disable-next-line no-unused-expressions
		expect({}.devMode).to.not.be.ok;
	});
});
