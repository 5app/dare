const DareError = require('./utils/error');

// Execute per table handler to augment the request
//
module.exports = function table_handler(item) {

	// Get the table handlers defined in the options
	const table_conditions = this.options && this.options.table_conditions;

	// Does this table have conditions?
	if (table_conditions && item.table in table_conditions) {

		// Get the function
		const func = table_conditions[item.table];

		// This table requires another to be joined to limit the query.
		if (typeof func !== 'string') {
			throw new DareError(DareError.INVALID_IMPLEMENTATION, `Table condition must be a string: table_conditions[${item.table}] is not`);
		}

		// Require another table
		let done = false;
		item.joined = item.joined || {};
		for (const key in item.joined) {
			if (this.table_alias_handler(key) === func) {
				item.joined[key].required_join = true;
				done = true;
			}
		}

		if (!done) {
			// Add another table
			item.joined[this.get_unique_alias()] = {table: func, required_join: true};
		}
	}

	return item;
};
