import JSONparse from './utils/JSONparse.js';

// Response
export default function responseHandler(resp) {
	const dareInstance = this;

	// Iterate over the response array and trigger formatting
	return resp.reduce((items, row, index) => {
		const item = responseRowHandler.call(dareInstance, row, index);

		// Push to the out going
		if (typeof item !== 'undefined') {
			items.push(item);
		}

		return items;
	}, []);
}

export function responseRowHandler(row, index) {
	const dareInstance = this;

	// Expand row...
	let item = formatHandler(row, dareInstance);

	// Add generate fields for generating fields etc...

	this.generated_fields.forEach(obj => {
		// Generate the fields handler
		generatedFieldsHandler({...obj, target: item}, dareInstance);
	});

	// Add custom response_row_handler, for handling the record
	if (this.response_row_handler) {
		item = this.response_row_handler(item, index);
	}
	return item;
}

// Format
function formatHandler(item, dareInstance) {
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
			/*
			 * Lets split the value up
			 */
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
		} else {
			// This has multiple parts
			// eslint-disable-next-line security/detect-unsafe-regex
			const m = label.match(/^(?<label>[\s\w$.-]*)\[(?<keys>.*?)]$/i);

			if (!m) {
				/*
				 * We do not know how to handle this response
				 * silently error, return the response as is...
				 */
				continue;
			}

			if (value) {
				/*
				 * Lets split the value up
				 */
				value = JSONparse(value);

				/*
				 * Create a dummy array
				 * And insert into the dataset...
				 */
				const a = [];
				const alabel = m.groups.label;
				explodeKeyValue(item, alabel.split('.'), a);

				// Loop through the value entries
				const keys = m.groups.keys.split(',');

				if (Array.isArray(value)) {
					value.filter(Boolean).forEach(values => {
						/*
						 * This is a workaround/tidy up for GROUP_CONCAT with JSON_ARRAY/CONCAT_WS
						 * JSON_ARRAY can include a NULL value even if there is no matching join
						 * CONCAT_WS would in the same circumstance return an empty string
						 */
						const emptyValues = dareInstance.engine.startsWith(
							'mysql:5.6'
						)
							? ''
							: null;

						if (!values.some(val => val !== emptyValues)) {
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
 * @param {string} obj.field - Name of the property to be created
 * @param {Function} obj.handler - Function to process the request
 * @param {Array} obj.targetAddress - Paths of the target item
 * @param {object} obj.target - Obj where the new prop will be appended
 * @param {object} obj.extraFields - List of fields which can be removed from the response
 * @param {object} dareInstance - Dare Instance
 * @returns {void} Modifies the incoming request with new props
 */
function generatedFieldsHandler(
	{label, field, handler, targetAddress, target, extraFields = []},
	dareInstance
) {
	if (targetAddress.length === 0) {
		// Get the handler props
		const props = getHandlerPropsByAddress(field, target, extraFields);

		// Get the item
		target[label] = handler.call(dareInstance, props);

		return;
	}

	// Get the current position in the address
	const [modelname] = targetAddress;

	// Shift the item off the address, creating a new address
	const next_address = targetAddress.slice(1);

	// Get the nested object
	const nested = target[modelname];

	// Assuming it's a valid resource...
	if (nested) {
		// And treat single and array items the same for simplicity
		(Array.isArray(nested) ? nested : [nested]).forEach(target => {
			generatedFieldsHandler(
				{
					targetAddress: next_address,
					target,
					label,
					field,
					handler,
					extraFields,
				},
				dareInstance
			);
		});
	}
}

/**
 * GetHandlerPropsByAddress
 *
 * @param {string} requestPath - String denoting the path of the props
 * @param {object} item - Item with the nested props
 * @param {Array} extraFields - extrafields which can be removed afterwards
 * @returns {object} Props object
 */
function getHandlerPropsByAddress(requestPath, item, extraFields) {
	// Remove the field from the request Path
	const requestModelAddress = requestPath
		.slice(0, requestPath.lastIndexOf('.') + 1)
		.split('.')
		.filter(Boolean);

	// Get the nested object
	const [props] = getNestedObject(item, requestModelAddress);

	// Clone the props...
	const handler_props = {...props};

	// End early is there is no results
	if (props) {
		// Remove attributes from the props
		extraFields.forEach(key => delete props[key]);
	}

	// Walk the object and remove empty objects...
	removeEmptyObject(item, requestModelAddress);

	return handler_props;
}

function getNestedObject(obj, address, arr = []) {
	if (address.length === 0) {
		arr.push(obj);
		return arr;
	}

	// Get the current position in the address
	const [modelname] = address;

	// Shift the item off the address, creating a new address
	const next_address = address.slice(1);

	// Get the nested object
	const nested = obj[modelname];

	// Assuming it's a valid resource...
	if (nested) {
		// And treat single and array items the same for simplicity
		(Array.isArray(nested) ? nested : [nested]).forEach(next_obj =>
			getNestedObject(next_obj, next_address, arr)
		);
	}

	return arr;
}

function removeEmptyObject(obj, address) {
	if (address.length === 0) {
		return Object.keys(obj).length === 0;
	}

	// Get the current position in the address
	const [modelname] = address;

	// Shift the item off the address, creating a new address
	const next_address = address.slice(1);

	// Get the nested object
	const nested = obj[modelname];

	// Assuming it's a valid resource...
	if (nested) {
		if (Array.isArray(nested)) {
			// Find and remove empties from the array...
			obj[modelname] = nested.filter(
				next_obj => !removeEmptyObject(next_obj, next_address)
			);

			if (obj[modelname].length === 0) {
				delete obj[modelname];
			}
		}

		if (removeEmptyObject(nested, next_address)) {
			delete obj[modelname];
		}
	}

	return false;
}
