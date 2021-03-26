const DareError = require('./error');

module.exports = function validate_label(label) {

	const reg = /^[^'"?`]+$/;

	// Capture errors in the key
	if (!label.match(reg)) {

		throw new DareError(DareError.INVALID_REFERENCE, `The label '${label}' must match ${reg}`);

	}

};
