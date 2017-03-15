const checkFormat = require('./unwrap_field');
const checkLabel = require('./validate_label');
const checkKey = require('./validate_field');

// Return a reducer function
module.exports = function fieldReducer(current_address, join, table_schema = {}) {

	const addToJoin = (field, label) => {

		// Get the full address of the field from the expression
		const address = checkFormat(field);

		// Truncate the response garner the join table to attach it too.
		const diff = address.replace(current_address, '').split('.');

		if (diff.length > 1) {
			const key = diff[0];
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
