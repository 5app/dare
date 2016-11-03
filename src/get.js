'use strict';

const error = require('./utils/error');

module.exports = function(opts) {

	opts = Object.assign(this.options, opts);

	opts.root = true;

	// Limit
	const sql_limit = (opts.start ? `${opts.start},` : '') + opts.limit;

	// Set the table_response_handlers
	opts.response_handlers = [];

	// Get the root tableID
	const sql_alias = opts.alias;
	const sql_table = opts.table;

	// Filters populate the filter and values (prepared statements)
	const sql_filter = [];
	let sql_values = [];

	// Fields
	const sql_fields = [];

	// Joins
	const sql_joins = [];

	// Traverse the formatted opts
	traverse(opts, (item, parent) => {

		if (parent) {
			// Adopt the parents settings
			item.nested_query = parent.nested_query || item.nested_query;
			item.many = parent.many || item.many;

		}

		// Should this be nested?
		const group_concat = item.nested_query && item.many ? this.group_concat : null;
		let grouping = false;

		// Build up the SQL conditions
		// e.g. filter= {category: asset, action: open, created_time: 2016-04-12T13:29:23Z..]
		if (item._filter) {

			item._filter.forEach(([field, condition, values]) => {
				sql_values = sql_values.concat(values);
				sql_filter.push(`${item.alias}.${field} ${condition}`);
			});
		}

		// Fields
		// e.g. fields = [action, category, count, ...]
		if (item.fields) {

			// yes, believe it or not but some queries do have them....
			item.fields.map(prepField).forEach(([def, as]) => {

				// Have we got a generated field?
				if (typeof def === 'function') {
					// Add this to the list
					opts.response_handlers.push(
						setField.bind(this, !item.root && item.alias, as, def)
					);
					return;
				}

				const m = def.match(/^([A-Z]+)\((DISTINCT\s)?(.+?)\)$/);
				let id = def;

				if (m) {

					const [, fn, scope, _field] = m;

					let field = _field;

					// Update the inner key
					if (field.match(/^([a-z\_]+)$/i)) {
						id = field;
						field = `${item.alias}.${field}`;
					}

					def = `${fn}(${scope || ''}${field})`;

				}
				else if (def.match(/^([a-z\_\-]+)$/i)) {
					def = `${item.alias}.${def}`;
				}

				// This is something we need to put into a GROUP_CONCAT
				if (!as && group_concat) {
					grouping = true;
					as = `${item.alias}[${group_concat}].${as || id}`;
					def = `GROUP_CONCAT(CONCAT('"', IFNULL(${def}, ''), '"') SEPARATOR '${group_concat}')`;
				}

				if (!as && !item.root) {
					as = `${item.alias}.${id}`;
				}

				as = (as ? ` AS '${as}'` : '');

				sql_fields.push(def + as);
			});

		}

		// Dont continue if this does not have a parent
		if (!parent) {
			return;
		}

		// Update the values with the alias of the parent
		const cond_map = {};
		for (const x in item.conditions) {
			let val = item.conditions[x];
			if (typeof val === 'string' && val.match(/^\w+$/)) {
				val = `${parent.alias}.${val}`;
			}
			cond_map[`${item.alias}.${x}`] = val;
		}

		// Required Join
		item.required_join = item.required_join && (parent.required_join || parent.root);

		// Append to the sql_join
		sql_joins.push(`${item.required_join ? '' : 'LEFT'} JOIN ${item.table} ${item.table === item.alias ? '' : item.alias} ON (${serialize(cond_map, '=', 'AND')})`);

		// Ensure that the parent has opts.groupby
		if (group_concat && !opts.groupby && grouping) {
			opts.groupby = `${opts.alias}.id`;
		}


	});

	{
		// Count is a special field, find it ...
		const i = sql_fields.indexOf(`${opts.alias}._count`);

		if (i > -1) {
			// ... and replace it.
			sql_fields[i] = 'COUNT(*) AS _count';
		}
	}

	// Conditions
	if (opts.conditions) {
		for (const field in opts.conditions) {
			sql_values.push(opts.conditions[field]);
			sql_filter.push(`${opts.alias}.${field} = ?`);
		}
	}

	// Groupby
	// If the content is grouped

	let sql_groupby = '';

	if (opts.groupby) {

		// Find the special _group column...
		const i = sql_fields.indexOf(`${opts.alias}._group`);

		if (i > -1) {
			// ... and replace it.
			sql_fields[i] = `${opts.groupby} as _group`;
		}

		// Add the grouping
		sql_groupby = `GROUP BY ${opts.groupby}`;
	}

	// Orderby
	// If the content is ordered

	const sql_orderby = opts.orderby ? `ORDER BY ${opts.orderby.toString()}` : '';


	// Put it all together
	const sql = `SELECT ${sql_fields.toString()}
						 FROM ${sql_table} ${sql_alias !== sql_table ? sql_alias : ''}
								${sql_joins.join('\n')}
						 ${sql_filter.length ? 'WHERE' : ''}
							 ${sql_filter.join(' AND ')}
						 ${sql_groupby}
						 ${sql_orderby}
						 LIMIT ${sql_limit}`;

	return this
	.sql(sql, sql_values)
	.then(this.response_handler.bind(this))
	.then(resp => {

		// If limit was not defined we should return the first result only.
		if (opts.single) {
			if (resp.length) {
				return resp[0];
			}
			else {
				throw error.NOT_FOUND;
			}
		}
		return resp;
	});
};

function traverse(opts, handler, parent) {
	handler(opts, parent);

	if (opts._joins) {
		opts._joins.forEach(item => traverse(item, handler, opts));
	}
}

function prepField(field) {

	if (typeof field === 'string') {
		return [field];
	}

	for (const as in field) {
		const def = field[as];
		return [def, as];
	}
}

function serialize(obj, separator, delimiter) {
	const r = [];
	for (const x in obj) {
		r.push(`${x} ${separator} ${obj[x]}`);
	}
	return r.join(` ${delimiter} `);
}

function setField(table, field, handler, obj) {

	if (table) {
		obj = obj[table];
	}
	if (!Array.isArray(obj)) {
		obj = [obj];
	}

	obj.forEach(item => item[field] = handler.call(this, item));
}
