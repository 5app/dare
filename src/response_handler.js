'use strict';

const JSONparse = require('./utils/JSONparse');

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
			value = JSONparse(value);

			label.split(',').forEach((label, index) => {

				explodeKeyValue(item, label.split('.'), value[index]);

			});
		}

		else {

			// This has multiple parts
			const r = /^([a-z0-9\s_-]*)\[(.*?)\]$/i;
			const m = label.match(r);

			if (!m) {
				// We do not know how to handle this response
				// silently error, return the response as is...
				continue;
			}

			if (value) {

				// Remove tabs then parse the value
				value = JSONparse(value);

				// Create a dummy array
				// And insert into the dataset...
				const a = [];
				const alabel = m[1];
				explodeKeyValue(item, alabel.split('.'), a);

				// Loop through the value entries
				const keys = m[2].split(',');

				value && value.forEach(values => {
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

	// Remove the first element of the array
	const key = a.shift();

	// This is a regular object...
	if (!(key in obj)) {
		// Create a new object
		obj[key] = {};
	}

	// Traverse and Update key value
	obj[key] = explodeKeyValue(obj[key], a, value);

	return obj;
}
