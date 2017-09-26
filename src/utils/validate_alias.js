const DareError = require('./error');

module.exports = function validate_alias(key) {
	const reg = /^[a-z_]+(\$[a-z0-9_]*)?$/i;

	// Capture errors in the key
	if (!key.match(reg)) {
		throw new DareError(DareError.INVALID_REFERENCE, `The table reference '${key}' must match ${reg}`);
	}
};
