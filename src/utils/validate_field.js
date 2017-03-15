const error = require('./error');

module.exports = function validate_field(key) {
	const reg = /^([a-z\_]+\.)?([a-z\_]+|\*)+$/i;

	// Capture errors in the key
	if (!key.match(reg)) {
		throw Object.assign(error.INVALID_REFERENCE, {
			message: `The key '${key}' must match ${reg}`
		});
	}
};
