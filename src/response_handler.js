'use strict';

// Response
module.exports = function responseHandler(resp) {
	// Iterate over the response array and trigger formatting
	return resp.map(formatHandler.bind(this));
};

// Format
function formatHandler(item) {

	// Some of the names were prefixed to ensure uniqueness, e.g., [{name: name, 'asset:name': name}]
	for (const label in item) {

		let value = item[label];

		// Is this a simple field?
		if (!(label.includes(',') || label.includes('['))) {

			// Is this a very simple field...
			if (!label.includes('.')) {

				continue; // Dont do anything
			}

			// Create new object
			explodeKeyValue(item, label.split('.'), value);
		}

		// Does this contain multiples
		else if (!label.includes('[')) {

			// Lets split the value up
			value = JSON.parse(value);

			label.split(',').forEach((label, index) => {

				explodeKeyValue(item, label.split('.'), value[index]);

			});
		}

		else {

			// This has multiple parts
			const r = /([a-z0-9\s\_\-]*)(\[(.*?)\])?/i;
			const m = label.match(r);

			if (!m) {
				// We do not know how to handle this response
				// silently error, return the response as is...
				continue;
			}

			if (value) {

				// Explode the value...
				value = JSON.parse(value);

				// Create a dummy array
				// And insert into the dataset...
				const a = [];
				const alabel = m[1];
				explodeKeyValue(item, alabel.split('.'), a);

				// Loop through the value entries
				const keys = m[3].split(',');

				value.forEach(values => {
					const obj = {};
					keys.forEach((label, index) => obj[label] = values[index]);
					formatHandler(obj);
					a.push(obj);
				});
			}
		}

		delete item[label];
	}

	if (this && this.response_handlers) {
		this.response_handlers.forEach(callback => callback(item));
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

	}
	else {
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
