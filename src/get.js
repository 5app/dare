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

		// Build up the SQL conditions
		// e.g. filter= {category: asset, action: open, created_time: 2016-04-12T13:29:23Z..]
		if (item.filter) {
			for (const key in item.filter) {

				const val = item.filter[key];

				prepCondition(key, val).forEach(([field, operator, value]) => {
					if (Array.isArray(value)) {
						sql_values = sql_values.concat(value);
						operator = 'IN';
						value = `(${  value.map(() => '?')  })`;
					}
					else {
						sql_values.push(value);
						value = '?';
					}
					sql_filter.push(`${item.alias}.${field} ${operator} ${value}`);
				});
			}
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

				// Is this a GROUP_CONCAT
				if (group_concat) {
					as = `${item.alias}[${group_concat}].${as || def}`;
					def = `GROUP_CONCAT(CONCAT('"', IFNULL(${item.alias}.${def}, ''), '"') SEPARATOR '${group_concat}')`;
				}
				else if (!as && def.indexOf('.') === -1) {
					def = `${item.alias}.${def}`;
				}

				as = as || (!item.root ? def : '');

				if (as) {
					as = ` AS '${as}'`;
				}

				sql_fields.push(def + as);
			});

		}

		// Dont continue if this does not have a parent
		if (!parent) {
			return;
		}

		// Update the values with the alias of the parent
		for (const x in item.conditions) {
			item.conditions[x] = `${parent.alias}.${item.conditions[x]}`;
		}

		// Custom formatting of join conditions
		this.table_handler(item);

		// Prefix keys and return
		const cond_map = prefixKeys(item.conditions, `${item.alias}.`);

		// Append to the sql_join
		sql_joins.push(`LEFT JOIN ${item.table} ${item.table === item.alias ? '' : item.alias} ON (${serialize(cond_map, '=', 'AND')})`);

		// Ensure that the parent has opts.groupby
		if (group_concat && !opts.groupby) {
			opts.groupby = 'id';
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

	const sql_orderby = opts.orderby ? `ORDER BY ${opts.orderby}` : '';


	// Put it all together
	const sql = `SELECT ${sql_fields.toString()}
						 FROM ${sql_table} ${sql_alias !== sql_table ? sql_alias : ''}
								${sql_joins.join('\n')}
						 WHERE
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

	if (opts.joins) {
		opts.joins.forEach(item => traverse(item, handler, opts));
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

function prepCondition(field, value) {

	const a = [];

	// Range
	// A range is denoted by two dots, e.g 1..10
	const range = (typeof value === 'string') && value.split('..');

	if (range.length === 2) {
		range.forEach((value, index) => {
			if (value !== '') {
				a.push([field, (index ? '<' : '>'), value]);
			}
		});
	}

	// Is this an array match?
	else if (typeof value === 'string' && value.match('%')) {
		a.push([field, 'LIKE', value]);
	}

	// Add to the array of items
	else {
		a.push([field, '=', value]);
	}

	return a;
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

function prefixKeys(obj, prefix = '') {
	const r = {};
	for (const x in obj) {
		r[prefix + x] = obj[x];
	}
	return r;
}
