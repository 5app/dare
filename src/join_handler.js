/*
 * Deciding on how to connect two tables depends on which one holds the connection
 * The join_handler here looks at the schema of both tables to find one which has a reference field to the other.
 */

function tidy(value, index, self) {

	// Remove empty and duplicate values
	return value && self.indexOf(value) === index;

}


module.exports = function(join_object, root_object) {

	const schema = this.options.schema;

	const {table: rootTable, alias: _rootAlias} = root_object;
	const {table: joinTable, alias: _joinAlias} = join_object;

	// Remove the join alias label
	const joinAlias = _joinAlias.split('$')[0];

	// Remove the root alias label
	const rootAlias = _rootAlias.split('$')[0];

	// Get the Join Conditions...
	let join_conditions;

	/*
	 * The preference is to match in order:
	 * joinAlias to rootAlias
	 * rootAlias to joinAlias (inverted)
	 * joinAlias to rootTable
	 * rootTable to joinAlias (inverted)
	 * joinTable to rootAlias
	 * rootAlias to joinTable (inverted)
	 * joinTable to rootTable
	 * rootTable to joinTable (inverted)
	 */

	// Does the alias exist...
	const a = [joinAlias, joinTable].filter(tidy);
	const b = [rootAlias, rootTable].filter(tidy);

	for (const _a of a) {

		for (const _b of b) {

			join_conditions = links(schema[_a], _b) || invert_links(schema[_b], _a);
			if (join_conditions) {

				break;

			}

		}
		if (join_conditions) {

			break;

		}

	}

	// Yes, no, Yeah!
	if (join_conditions) {

		return Object.assign(join_object, join_conditions);

	}

	// Crawl the schema for a link table, ... we're only going for a single Kevin Bacon.
	for (const linkTable in schema) {

		// Well, this would be silly otherwise...
		if (linkTable === joinTable || linkTable === rootTable) {

			continue;

		}

		// LinkTable <> joinTable?
		const sjt = schema[joinAlias] || schema[joinTable];
		const jt = schema[joinAlias] ? joinAlias : joinTable;
		const join_conditions = links(sjt, linkTable) || invert_links(schema[linkTable], jt);


		if (!join_conditions) {

			continue;

		}

		// RootTable <> linkTable
		const root_conditions = links(schema[linkTable], rootTable) || invert_links(schema[rootTable], linkTable);

		if (!root_conditions) {

			continue;

		}

		/*
		 * Awesome, this table (tbl) is the link table and can be used to join up both these tables.
		 * Also give this link table a unique Alias
		 */
		return Object.assign({
			alias: this.get_unique_alias(),
			table: linkTable,
			joins: [
				Object.assign(join_object, join_conditions)
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
