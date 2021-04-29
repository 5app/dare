

const JSONparse = require('./utils/JSONparse');

// Response
module.exports = function responseHandler(resp) {

	const dareInstance = this;

	// Iterate over the response array and trigger formatting
	return resp.reduce((items, row, index) => {

		// Expand row...
		let item = formatHandler(row);

		// Add generate fields for generating fields etc...

		this.generated_fields.forEach(obj => {

			// Split the address of the item up...
			const address = obj.field_alias_path.split('.').filter(Boolean);

			// Generate the fields handler
			generatedFieldsHandler({...obj, address, item}, dareInstance);

		});


		// Add custom response_row_handler, for handling the record
		if (this.response_row_handler) {

			item = this.response_row_handler(item, index);

		}

		// Push to the out going
		if (typeof item !== 'undefined') {

			items.push(item);

		}
		return items;

	}, []);

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

			/*
			 * Ensure this is an Array
			 * Subqueries may return NULL if they do not match any records
			 */
			if (Array.isArray(value)) {

				label.split(',').forEach((label, index) => {

					explodeKeyValue(item, label.split('.'), value[index]);

				});

			}

		}

		else {

			// This has multiple parts
			const r = /^([a-z0-9.\s_-]*)\[(.*?)\]$/i;
			const m = label.match(r);

			if (!m) {

				/*
				 * We do not know how to handle this response
				 * silently error, return the response as is...
				 */
				continue;

			}

			if (value) {

				// Remove tabs then parse the value
				value = JSONparse(value);

				/*
				 * Create a dummy array
				 * And insert into the dataset...
				 */
				const a = [];
				const alabel = m[1];
				explodeKeyValue(item, alabel.split('.'), a);

				// Loop through the value entries
				const keys = m[2].split(',');

				value && value.forEach(values => {

					/*
					 * This is a workaround/tidy up for GROUP_CONCAT/CONCAT_WS
					 * If we can't find a non-empty value...
					 */
					if (!values.find(val => val !== '')) {

						// Continue
						return;

					}

					const obj = {};
					keys.forEach((label, index) => {

						obj[label] = values[index];

					});
					formatHandler(obj);
					a.push(obj);

				});

			}

		}

		delete item[label];

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

/**
 * Generate Fields Handler
 * @param {object} obj - Request Object
 * @param {string} obj.label - Name of the property to be created
 * @param {Function} obj.handler - Function to process the request
 * @param {Array} obj.address - Paths of the item
 * @param {obj} obj.item - Obj where the new prop will be appended
 * @param {obj} obj.extraFields - List of fields which can be removed from the response
 * @param {obj} dareInstance - Dare Instance
 * @returns {void} Modifies the incoming request with new props
 */
function generatedFieldsHandler({label, handler, address, item, extraFields = []}, dareInstance) {

	if (address.length === 0) {

		item[label] = handler.call(dareInstance, item);

		// Remove the extra fields
		extraFields.forEach(field => {

			delete item[field];

		});

		return;

	}

	// Get the current position in the address
	const [modelname] = address;

	// Shift the item off the address, creating a new address
	const next_address = address.slice(1);

	// Get the nested object
	const nested = item[modelname];

	// Assuming it's a valid resource...
	if (nested) {

		// And treat single and array items the same for simplicity
		(Array.isArray(nested) ? nested : [nested])
			.forEach(item => generatedFieldsHandler({label, handler, extraFields, address: next_address, item}, dareInstance));

	}

}
