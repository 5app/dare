
// deciding on how to connect two tables depends on which one holds the connection
// The join_handler here looks columns on both tables to find one which has a reference field to the other.
module.exports = function join_handler(joinMap) {

	let joins = [];

	for (let joinAlias in joinMap) {
		let rootAlias = joinMap[joinAlias];
		joins = joins.concat(join_table.call(this, joinAlias, rootAlias));
	}

	// Mark as many if it is joined
	joins.forEach(join => {
		if (!join.many) {
			join.many = !!joins.filter(item => ((join.root === item.alias) && item.many)).length;
		}
	});

	return joins;
};

function links(tableObj, joinTable) {

	let map = {};

	// Loop through the table fields
	for (let field in tableObj) {
		let column = tableObj[field];

		let ref = [];

		if (typeof column === 'string' || Array.isArray(column)) {
			ref = column;
		}
		else if (column.references) {
			ref = column.references;
		}

		if (typeof ref === 'string') {
			ref = [ref];
		}

		ref.forEach(ref => {
			let a = ref.split('.');
			if (a[0] === joinTable) {
				map[field] = ref;
			}
		});
	}

	return Object.keys(map).length ? map : null;
}

function join_table(joinAlias, rootAlias) {

	let joins = [];

	let joinTable = this.table_alias_handler(joinAlias);
	let rootTable = this.table_alias_handler(rootAlias);
	let joinCond = links(this.options.schema[joinTable], rootTable);
	let rootCond = links(this.options.schema[rootTable], joinTable);

	// If there is no way to join these two tables... lets find an intermediary
	if (!joinCond && !rootCond) {
		// Find a table other than these in the schema which connects these two tables
		for (let linkTable in this.options.schema) {

			// do nothing if this is the same table
			if (linkTable === joinTable || linkTable === rootTable) {
				continue;
			}

			// Is there a link from this new table too the joinTable?
			rootCond = links(this.options.schema[linkTable], joinTable);
			joinCond = links(this.options.schema[joinTable], linkTable);

			// Great lets double check that this table also joins to the other table
			if (rootCond || joinCond) {
				// is there also a link from rootTable
				let nextCond = links(this.options.schema[linkTable], rootTable) || links(this.options.schema[rootTable], linkTable);

				// Awesome, this table (tbl) is the link table and can be used to join up both these tables.
				if (nextCond) {
					// Add this link table
					joins = joins.concat(join_table.call(this, linkTable, rootAlias));

					// Update the current rootTable to point to this linkTable
					rootTable = linkTable;
					rootAlias = linkTable;

					// Stop looking for more tables
					break;
				}
				else {
					// Reset the join
					joinCond = null;
					rootCond = null;
				}
			}
		}
	}

	// Get the Join Condition
	let join_condition = {};

	if (joinCond) {
		for (let i in joinCond) {
			let a = joinAlias + '.' + i;
			let b = rootAlias + '.' + joinCond[i].split('.')[1];
			join_condition[b] = a;
		}
	}
	else if (rootCond) {
		for (let i in rootCond) {
			let a = joinAlias + '.' + rootCond[i].split('.')[1];
			let b = rootAlias + '.' + i;
			join_condition[a] = b;
		}
	}


	// Reject if the join has no condition
	if (!join_condition || Object.keys(join_condition).length === 0) {
		throw 'Could not understand field "' + joinAlias + '"';
	}

	// Is there an alias for this table
	if (!joinTable) {
		throw `Unrecognized reference '${joinAlias}'`;
	}

	// Should return a join array
	joins.push({
		table: joinTable,
		alias: joinAlias,
		root: rootAlias,
		conditions: join_condition,
		many: !!joinCond
	});

	return joins;

}
