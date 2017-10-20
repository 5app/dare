const checkFormat = require('./unwrap_field');
const checkLabel = require('./validate_label');
const checkKey = require('./validate_field');

// Return a reducer function
module.exports = function fieldReducer(current_address, join, table_schema = {}) {

	const addToJoin = (field, label) => {

		// Get the full address of the field from the expression
		const address = checkFormat(field).field;

		// Does the path exist at the end of the current_address
		// e.g. Our current address might be grandparent.parent.
		// Then we'd break down the new address "parent.tbl.field" => "parent.tbl." => "parent."
		// And see that that actually the path is the bit we've removed... aka tbl.field
		const a = overlap(current_address, address);
		const relative = a[2].split('.');

		if (relative.length > 1) {
			const key = relative[0];
			const d = label ? {[label]: field} : field;
			const a = join[key] || {};
			a.fields = (a.fields || []);
			a.fields.push(d);
			join[key] = a;
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
					// This field has an alias
					// i.e. latest: MAX(created_time)

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

			// This is also a field, so check that its a valid field
			// + If it contains a nested value: create a join.
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


// Overlap strings
// Given two strings, e.g. 'this.is.not' and 'is.not.over'
// Find the over laping section in this case 'is.not'
// Return the various parts as an array ['this', '.is.not', '.over']
function overlap(a, b) {

	let path = b;

	// Remove chunks off the end of the second string and see if it matches the end of the first
	// Continue to do this
	while (path && !a.endsWith(path)) {

		// What is the position of the separator
		const i = path.lastIndexOf('.', path.length - 2);

		if (i <= 0) {
			// No, this is relative field
			path = '';
			break;
		}

		path = path.slice(0, i + 1);
	}

	return [a.slice(0, a.lastIndexOf(path)), path, b.slice(path.length)];
}


// Is Empty
function isEmpty(value) {
	return !value || (Array.isArray(value) ? value : Object.keys(value)).length === 0;
}