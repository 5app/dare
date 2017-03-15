const error = require('./error');

module.exports = function unwrap_field(str) {

	if (typeof str !== 'string') {
		throw Object.assign(error.INVALID_REFERENCE, {
			message: `The field definition '${str}' is invalid.`
		});
	}

	let s = str;
	let m;

	// strip away the `str(`...`)`
	while ((m = s.match(/^\s*[a-z\_]+\((DISTINCT\s)?(.*?)\)\s*$/i))) {
		// match
		s = m[2];
	}

	// Is this a valid field
	if (!s.match(/^([a-z\_\.]+|\*)$/i)) {
		throw Object.assign(error.INVALID_REFERENCE, {
			message: `The field definition '${str}' is invalid.`
		});
	}

	return s;
};
