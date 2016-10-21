
// deciding on how to connect two tables depends on which one holds the connection
// The join_handler here looks columns on both tables to find one which has a reference field to the other.
module.exports = function table_handler(tables) {

	// Convert to an array
	const a = Array.isArray(tables) ? tables : [tables];

	// Schema table handling
	const table_conditions = this.options && this.options.table_conditions;

	if (typeof table_conditions !== 'object') {
		return tables;
	}

	// Loop through the tables... and apply any conditions from the schema
	a.forEach(item => {
		// Does this table have conditions?
		if (item.table in table_conditions) {

			// Get the function
			const func = table_conditions[item.table];

			// Trigger the function
			func.call(this, item);
		}
	});

	return tables;
};
