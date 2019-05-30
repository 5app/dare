const checkFormat = require('./unwrap_field');
const checkLabel = require('./validate_label');
const checkKey = require('./validate_field');
const fieldRelativePath = require('./field_relative');

// Return a reducer function
module.exports = function fieldReducer(current_address, join, table_schema = {}) {

	const addToJoin = (field, label) => {

		// Get the full address of the field from the expression
		const address = checkFormat(field).field;

		/*
		 * Does the path exist at the end of the current_address
		 * e.g. Our current address might be grandparent.parent.
		 * Then we'd break down the new address "parent.tbl.field" => "parent.tbl." => "parent."
		 * And see that that actually the path is the bit we've removed... aka tbl.field
		 */
		const path = fieldRelativePath(current_address, address);
		const relative = path.split('.');

		if (relative.length > 1) {

			const key = relative[0];
			const d = label ? {[label]: field} : field;

			if (!join[key]) {

				join[key] = {};

			}

			if (!join[key].fields) {

				join[key].fields = [];

			}
			else if (!Array.isArray(join[key].fields)) {

				join[key].fields = [join[key].fields];

			}

			join[key].fields.push(d);
			return true;

		}

	};

	// Handle each field property
	return (a, field) => {

		if (typeof field !== 'string') {

			for (const key in field) {

				const value = field[key];
				if (typeof value === 'object') {

					// Ensure this isn't empty
					if (isEmpty(value)) {

						// Skip these empty objects
						continue;

					}

					join[key] = join[key] || {};
					join[key].fields = value;

				}
				else {

					/*
					 * This field has an alias
					 * i.e. latest: MAX(created_time)
					 */

					// Check errors in the key field
					checkLabel(key);

					// Check the new value field parents, aka `parent_table.field`
					if (addToJoin(value, key)) {

						continue;

					}

					a.push({
						[key]: value
					});

				}

			}

		}

		else {

			// Check errors in the key field
			checkKey(field);

			/*
			 * This is also a field, so check that its a valid field
			 * + If it contains a nested value: create a join.
			 */
			if (addToJoin(field)) {

				return a;

			}

			// Does this field have a handler in the schema
			const def = table_schema[field];

			if (typeof def === 'function') {

				// Execute the handler, add the response to the field list
				a.push({
					[field]: def.call(this, a)
				});

			}
			else {

				// Add the field to the array
				a.push(field);

			}

		}

		return a;

	};

};

// Is Empty
function isEmpty(value) {

	return !value || (Array.isArray(value) ? value : Object.keys(value)).length === 0;

}