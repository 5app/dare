const DareError = require('./error');

module.exports = function validate_alias(key) {

	const [name, label] = key.split('$');

	// Capture errors in the key
	if (!name.match(/^[a-z_]+$/i) || (label && !label.match(/^\w+$/))) {

		throw new DareError(DareError.INVALID_REFERENCE, `The table reference '${key}' must match [a-z_]+($[a-z0-9_]+)`);

	}

};
