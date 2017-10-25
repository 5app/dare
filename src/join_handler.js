// deciding on how to connect two tables depends on which one holds the connection
// The join_handler here looks at the schema of both tables to find one which has a reference field to the other.

module.exports = function (join_table, rootTable) {

	const schema = this.options.schema;
	const joinTable = join_table.table;

	let joinAlias = join_table.alias;
	if (joinAlias) {
		joinAlias = joinAlias.split('$')[0];
	}

	const sjt = schema[joinAlias] || schema[joinTable];
	const jt = schema[joinAlias] ? joinAlias : joinTable;
	const join_conditions = links(sjt, rootTable) || invert_links(schema[rootTable], jt);

	// Yes, no, Yeah!
	if (join_conditions) {
		return Object.assign(join_table, join_conditions);
	}

	// Crawl the schema for a link table, ... we're only going for a single Kevin Bacon.
	for (const linkTable in schema) {

		// Well, this would be silly otherwise...
		if (linkTable === joinTable || linkTable === rootTable) {
			continue;
		}

		// linkTable <> joinTable?
		const sjt = schema[joinAlias] || schema[joinTable];
		const jt = schema[joinAlias] ? joinAlias : joinTable;
		const join_conditions = links(sjt, linkTable) || invert_links(schema[linkTable], jt);

		if (!join_conditions) {
			continue;
		}

		// rootTable <> linkTable
		const root_conditions = links(schema[linkTable], rootTable) || invert_links(schema[rootTable], linkTable);

		if (!root_conditions) {
			continue;
		}

		// Awesome, this table (tbl) is the link table and can be used to join up both these tables.
		// Also give this link table a unique Alias
		return Object.assign({
			alias: this.get_unique_alias(),
			table: linkTable,
			joins: [
				Object.assign(join_table, join_conditions)
			]
		}, root_conditions);
	}

	// Return a falsy value
	return null;
};

function links(tableObj, joinTable, flipped = false) {

	const map = {};

	// Loop through the table fields
	for (const field in tableObj) {
		const column = tableObj[field];

		let ref = [];

		if (typeof column === 'string' || Array.isArray(column)) {
			ref = column;
		}
		else if (typeof column === 'object' && column.references) {
			ref = column.references;
		}

		if (typeof ref === 'string') {
			ref = [ref];
		}

		ref.forEach(ref => {
			const a = ref.split('.');
			if (a[0] === joinTable) {
				map[field] = a[1];
			}
		});
	}

	return Object.keys(map).length ? {
		join_conditions: flipped ? invert(map) : map,
		many: !flipped
	} : null;
}

function invert_links(...args) {
	return links(...args, true);
}

function invert(o) {
	const r = {};
	for (const x in o) {
		r[o[x]] = x;
	}
	return r;
}
