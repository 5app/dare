import getFieldAttributes from '../utils/field_attributes.js';

/**
 * Join Handler
 * Obtain the table join conditions which says how two tables reference one another
 * @param {object} join_object - The object being joined
 * @param {object} root_object - The root object, for which we want the join_object too attach
 * @param {object} dareInstance - Dare Instance
 * @returns {object} An updated join_object with new join_conditions attached
 */
export default function (join_object, root_object, dareInstance) {
	const {models, infer_intermediate_models} = dareInstance.options;

	const {table: rootModel} = root_object;
	const {table: joinModel} = join_object;

	/*
	 * The preference is to match in order:
	 * joinTable to rootTable
	 * rootTable to joinTable (inverted)
	 * Looks at the schema of both tables to find one which has a reference field to the other.
	 */

	const join_conditions =
		links(models[joinModel]?.schema, rootModel) ||
		invert_links(models[rootModel]?.schema, joinModel);

	// Yes, no, Yeah!
	if (join_conditions) {
		return Object.assign(join_object, join_conditions);
	}

	/**
	 * ModelAlias?
	 * now check whether this alias is defined as a modelAlias
	 * modelAlias is defined in the schema of the root table
	 * And desrcibes the path (model joins) needed for the given data set
	 */

	const {modelAlias} = getFieldAttributes(
		models[rootModel]?.schema?.[joinModel]
	);

	// The model alias is now present so we know we're on the right track
	if (modelAlias) {
		// Decode the modelAlias and construct the joins
		const [linkTable, joinModel] = modelAlias.split('.');

		// Update the underlying table
		join_object.table = joinModel;

		// Construct intermediate join
		const intermediateJoin = findIntermediateJoin({
			rootModel,
			linkTable,
			joinModel,
			models,
			join_object,
		});

		// Return, errors are thrown in format_request if this is undefined
		return intermediateJoin;
	}

	/*
	 * Is the infer_intermediate_models option is set to false?
	 * --> can't guess which table to use, return null
	 */
	if (infer_intermediate_models === false) {
		return null;
	}

	// Crawl the schema for an intermediate table which is linked to both tables. link table, ... we're only going for a single Kevin Bacon. More than that and the process will deem this operation too hard.
	for (const linkTable in models) {
		// Construct intermediate join
		const intermediateJoin = findIntermediateJoin({
			rootModel,
			linkTable,
			joinModel,
			models,
			join_object,
		});

		if (intermediateJoin) {
			return intermediateJoin;
		}
	}

	// Return a falsy value
	return null;
}

/**
 * Find Intermediate joins
 * Given root, link and target (join) names
 * Find and constructs the join definitions (fields to connect)
 * @param {object} object - Object
 * @param {string} object.rootModel - Root model name
 * @param {string} object.linkTable - Link model name
 * @param {string} object.joinModel - Target/join model name
 * @param {object} object.models - Model Options
 * @param {object} object.join_object - Passthrough original join options
 * @returns {object|undefined} Join definition to return
 */
function findIntermediateJoin({
	rootModel,
	linkTable,
	joinModel,
	models,
	join_object,
}) {
	// Well, ignore models of the same name
	if (linkTable === joinModel || linkTable === rootModel) {
		return;
	}

	// LinkTable <> joinTable?
	const join_conditions =
		links(models[joinModel]?.schema, linkTable) ||
		invert_links(models[linkTable]?.schema, joinModel);

	if (!join_conditions) {
		return;
	}

	// RootTable <> linkTable
	const root_conditions =
		links(models[linkTable]?.schema, rootModel) ||
		invert_links(models[rootModel]?.schema, linkTable);

	if (!root_conditions) {
		return;
	}

	/*
	 * If both the root and join table are pointing to the same value in the linkTable
	 * -> Abort
	 * e.g.
	 *	root_conditions: { join_conditions: { id: 'commentcountry_id' }, many: false },
	 *	join_conditions: { join_conditions: { personcountry_id: 'id' }, many: true }
	 */
	if (
		Object.keys(root_conditions.join_conditions).at(0) ===
		Object.values(join_conditions.join_conditions).at(0)
	) {
		return;
	}

	/*
	 * Awesome, this table (tbl) is the link table and can be used to join up both these tables.
	 * Also give this link table a unique Alias
	 */
	return {
		table: linkTable,
		joins: [Object.assign(join_object, join_conditions)],
		...root_conditions,
	};
}

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

	return Object.keys(map).length
		? {
				join_conditions: flipped ? invert(map) : map,
				many: !flipped,
		  }
		: null;
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
