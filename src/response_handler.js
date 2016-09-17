'use strict';

// Response
module.exports = function responseHandler(resp) {
	// Iterate over the response array and trigger formatting
	return resp.map(formatHandler.bind(this));
};

// Format
function formatHandler(item) {

	// Some of the names were prefixed too ensure uniqueness, e.g., [{name: name, 'asset:name': name}]
	for (var x in item) {

		// Check the key for expansion key '.'
		let a = x.split('.');


		if (a.length > 1) {

			// Create new object
			explodeKeyValue(item, a, item[x]);

			// Delete the original key
			delete item[x];
		}
	}

	if (this.options.response_handlers) {
		this.options.response_handlers.forEach(callback => callback(item));
	}

	return item;
}

function explodeKeyValue(obj, a, value) {

	// Is this the end?
	if (a.length === 0) {
		return value;
	}

	// Clone
	a = a.slice(0);

	// Remove the last one from the iteration
	let key = a.shift();

	// Does the key contain a value delimiter
	let delimiter;
	key = key.replace(/\[(.*?)\]$/, (m, d) => {
		delimiter = d;
		return '';
	});

	// Should we expand the values and create mulitples
	if (delimiter && typeof value === 'string') {

		if (!(key in obj)) {
			// Create a new object
			obj[key] = [];
		}

		// Is there no results
		if (value === '') {
			return obj;
		}

		value.split(delimiter).forEach((value, i) => {

			if (!obj[key][i]) {
				// Create a new object
				obj[key][i] = {};
			}

			// Remove quotes
			value = value.replace(/^"(.*)"$/, '$1');

			obj[key][i] = explodeKeyValue(obj[key][i], a, value);
		});

	} else {
		// This is a regular object...
		if (!(key in obj)) {
			// Create a new object
			obj[key] = {};
		}

		// Update key value
		obj[key] = explodeKeyValue(obj[key], a, value);
	}


	return obj;
}
