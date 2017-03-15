const error = require('./error');

module.exports = function validate_label(label) {
	const reg = /^[^\'\"]+$/i;

	// Capture errors in the key
	if (!label.match(reg)) {
		throw Object.assign(error.INVALID_REFERENCE, {
			message: `The label '${label}' must match ${reg}`
		});
	}
};
