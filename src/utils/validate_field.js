const error = require('./error');

module.exports = function validate_field(key) {
	const reg = /^([a-z_]+\.)?([a-z_]+|\*)+$/i;

	// Capture errors in the key
	if (!key.match(reg)) {
		throw Object.assign(error.INVALID_REFERENCE, {
			message: `The key '${key}' must match ${reg}`
		});
	}
};
