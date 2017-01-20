'use strict';

const error = require('./utils/error');

module.exports = function(opts) {

	// Set the table_response_handlers
	this.response_handlers = this.response_handlers || [];

	const {sql, values} = buildQuery.call(this, opts);

	// Execute the query
	return this
	.sql(sql, values)
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

function buildQuery(opts) {

	opts.root = true;

	// Limit
	const sql_limit = opts.limit ? (`LIMIT ${opts.start ? `${opts.start},` : '' }${opts.limit}`) : null;

	// Filters populate the filter and values (prepared statements)
	const sql_filter = [];
	let sql_values = [];

	// Fields
	const fields = [];

	const sql_subquery_values = [];

	// Joins
	const sql_joins = [];
	const sql_join_values = [];

	// SubQuery
	const is_subquery = opts.is_subquery;

	// Traverse the formatted opts
	const traverse = item => {

		const parent = item.parent;

		// Things to change if this isn't the root.
		if (parent) {

			// Adopt the parents settings
			const can_subquery = parent.can_subquery || item.can_subquery;
			const many = parent.many || item.many;

			// Should this be a sub query?
			// The join is not required for filtering,
			// And has a one to many relationship with its parent.
			if (this.group_concat && !opts.is_subquery && !item.required_join && can_subquery && many) {

				// Mark as subquery
				item.is_subquery = true;

				// Make the sub-query
				const sub_query = buildQuery.call(this, item);

				// Add the values
				sql_subquery_values.push(...sub_query.values);

				// Add the formatted field
				fields.push({
					def: `(${sub_query.sql})`,
					as: item.alias
				});

				// Format the response
				this.response_handlers.push(row => {
					row[item.alias] = JSON.parse(row[item.alias]);
				});

				// The rest has been handled in the sub-query
				return;
			}
		}


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
					this.response_handlers.push(
						setField.bind(this, !item.root && item.alias, as, def)
					);
					return;
				}

				const m = def.match(/^([a-z\_]+)\((DISTINCT\s)?(.+?)\)$/i);
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
				else if (def !== '*' && !def.includes('.')) {
					def = `${item.alias}.${def}`;
				}

				if (!as && !item.root) {
					as = `${item.alias}.${id}`;
				}

				as = as || '';

				fields.push({def, as});
			});

		}

		// Dont continue if this does not have a parent
		if (parent) {

			// Update the values with the alias of the parent
			const sql_join_condition = [];
			if (item._join) {
				item._join.forEach(([field, condition, values]) => {
					sql_join_values.push(...values);
					sql_join_condition.push(`${item.alias}.${field} ${condition}`);
				});
			}
			for (const x in item.join_conditions) {
				const val = item.join_conditions[x];
				sql_join_condition.push(`${item.alias}.${x} = ${parent.alias}.${val}`);
			}

			// Required Join
			item.required_join = item.required_join && (parent.required_join || parent.root);

			if (!item.is_subquery) {
				// Append to the sql_join
				sql_joins.push(`${item.required_join ? '' : 'LEFT'} JOIN ${item.table} ${item.table === item.alias ? '' : item.alias} ON (${sql_join_condition.join(' AND ')})`);
			}
			else {
				// Merge the join condition on the filter
				sql_filter.push(...sql_join_condition);

				// Offload and Reset the sql_join_values
				sql_values.push(...sql_join_values);
				sql_join_values.length = 0;
			}

			// Ensure that the parent has opts.groupby
			if (!is_subquery && !opts.groupby) {
				opts.groupby = `${opts.alias}.id`;
			}
		}

		// Traverse the next ones...
		if (item._joins) {
			item._joins.forEach(child => {
				child.parent = item;
				traverse(child);
			});
		}
	};

	// Trigger traverse
	traverse(opts);


	{
		// Count is a special field, find it ...
		fields.filter(item => item.def === `${opts.alias}._count`)
		.forEach(item => {
			item.def = 'COUNT(*)';
			item.as = '_count';
		});
	}

	// Conditions
	if (opts._join) {
		opts._join.forEach(([field, condition, values]) => {
			sql_values.push(...values);
			sql_filter.push(`${opts.alias}.${field} ${condition}`);
		});
	}

	// Merge values
	const values = [].concat(sql_subquery_values).concat(sql_join_values).concat(sql_values);

	// Groupby
	// If the content is grouped

	let sql_groupby = '';

	if (opts.groupby) {

		// Find the special _group column...
		fields.filter(item => item.def === `${opts.alias}._group`)
		.forEach(item => {
			item.def = opts.groupby;
			item.as = '_group';
		});

		// Add the grouping
		sql_groupby = `GROUP BY ${opts.groupby}`;
	}

	// Orderby
	// If the content is ordered

	const sql_orderby = opts.orderby ? `ORDER BY ${opts.orderby.toString()}` : '';

	// Get the root tableID
	const sql_alias = opts.alias;
	const sql_table = opts.table;

	// Format Fields
	let sql_fields;
	if (is_subquery) {
		// Generate a Group Concat statement of the result
		sql_fields = group_concat(fields);
	}
	else {
		sql_fields = fields.map(field => `${field.def}${field.as ? ` AS '${field.as}'` : ''}`);
	}

	// Put it all together
	const sql = `SELECT ${sql_fields.toString()}
						 FROM ${sql_table} ${sql_alias !== sql_table ? sql_alias : ''}
								${sql_joins.join('\n')}
						 ${sql_filter.length ? 'WHERE' : ''}
							 ${sql_filter.join(' AND ')}
						 ${sql_groupby}
						 ${sql_orderby}
						 ${sql_limit}`;

	return {sql, values};
}

// Wrap all the fields in a GROUP_CONCAT statement
function group_concat(fields) {

	// convert to JSON string
	fields = fields.map(field => `'"${escape(field.as || field.def)}":', '"', REPLACE(${field.def}, '"', '\\"'), '"'`);

	return `CONCAT('[', GROUP_CONCAT(CONCAT('{', ${fields.join(', ",", ')}, '}')), ']')`;
}

function escape(str) {
	return str.replace(/\"/g, '\\"');
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

function setField(table, field, handler, obj) {

	if (table) {
		obj = obj[table];
	}
	if (!Array.isArray(obj)) {
		obj = [obj];
	}

	obj.forEach(item => item[field] = handler.call(this, item));
}
