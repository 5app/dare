const DareError = require('./error');
const validate_alias = require('./validate_alias');

module.exports = function validate_field(key) {

	const a = key.split('.');
	const field = a.pop();

	const reg = /^([a-z_]+|\*)+$/i;

	// Capture errors in the key
	if (!field.match(reg)) {
		throw new DareError(DareError.INVALID_REFERENCE, `The key '${key}' must match ${reg}`);
	}

	// Validate the path
	const path = a.join('.');

	if (path) {
		validate_alias(path);
	}
};
