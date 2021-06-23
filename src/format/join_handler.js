const getFieldAttributes = require('../utils/field_attributes');

/**
 * Join Handler
 * Obtain the table join conditions which says how two tables reference one another
 * @param {object} join_object - The object being joined
 * @param {object} root_object - The root object, for which we want the join_object too attach
 * @param {object} dareInstance - Dare Instance
 * @returns {object} An updated join_object with new join_conditions attached
 */
module.exports = function(join_object, root_object, dareInstance) {

	const {models} = dareInstance.options;

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

	// Looks at the schema of both tables to find one which has a reference field to the other.
	for (const _a of a) {

		for (const _b of b) {

			join_conditions = links(models[_a]?.schema, _b) || invert_links(models[_b]?.schema, _a);
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

	// Crawl the schema for an intermediate table which is linked to both tables. link table, ... we're only going for a single Kevin Bacon. More than that and the process will deem this operation too hard.
	for (const linkTable in models) {

		// Well, this would be silly otherwise...
		if (linkTable === joinTable || linkTable === rootTable) {

			continue;

		}

		// LinkTable <> joinTable?
		const sjt = models[joinAlias]?.schema || models[joinTable]?.schema;
		const jt = models[joinAlias]?.schema ? joinAlias : joinTable;
		const join_conditions = links(sjt, linkTable) || invert_links(models[linkTable]?.schema, jt);


		if (!join_conditions) {

			continue;

		}

		// RootTable <> linkTable
		const root_conditions = links(models[linkTable]?.schema, rootTable) || invert_links(models[rootTable]?.schema, linkTable);

		if (!root_conditions) {

			continue;

		}

		/*
		 * Awesome, this table (tbl) is the link table and can be used to join up both these tables.
		 * Also give this link table a unique Alias
		 */
		return {
			alias: dareInstance.get_unique_alias(),
			table: linkTable,
			joins: [
				Object.assign(join_object, join_conditions)
			],
			...root_conditions
		};

	}

	// Return a falsy value
	return null;

};

function links(tableSchema, joinTable, flipped = false) {

	const map = {};

	// Loop through the table fields
	for (const field in tableSchema) {

		const {references} = getFieldAttributes(tableSchema[field]);

		let ref = references || [];

		if (!Array.isArray(ref)) {

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

function tidy(value, index, self) {

	// Remove empty and duplicate values
	return value && self.indexOf(value) === index;

}
