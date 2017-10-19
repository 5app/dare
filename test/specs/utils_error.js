// Field Reducer
// Extract the fields from the current dataset

const DareError = require('../../src/utils/error');

describe('utils/error', () => {


	it('should return instance of DareError with code and message property', () => {

		// Call the field with the
		const error = new DareError(DareError.INVALID_REFERENCE);

		// Expect the formatted list of fields to be identical to the inputted value
		expect(error).to.have.property('code', 'INVALID_REFERENCE');
		expect(error).to.have.property('status', 500);
		expect(error).to.have.property('message', 'Invalid request');
	});
});

