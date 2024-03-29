import {expect} from 'chai';
/*
 * Field Reducer
 * Extract the fields from the current dataset
 */

import DareError from '../../src/utils/error.js';

describe('utils/error', () => {
	it('should return instance of DareError with code and message property', () => {
		// Call the field with the
		const error = new DareError(DareError.INVALID_REFERENCE);

		// Expect the formatted list of fields to be identical to the inputted value
		expect(error).to.have.property('code', 'INVALID_REFERENCE');
		expect(error).to.have.property('status', 400);
		expect(error).to.have.property('message', 'Invalid request');
	});
});
