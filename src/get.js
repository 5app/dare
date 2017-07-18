'use strict';

const error = require('./utils/error');
const group_concat = require('./utils/group_concat');
const field_format = require('./utils/field_format');

module.exports = function(opts) {

	// Set the table_response_handlers
	this.response_handlers = this.response_handlers || [];

	// Define the buildQuery
	this.buildQuery = buildQuery;

	// Define the Traversal
	// This is triggered by the build query to create the SQL
	this.traverse = traverse;

	// Execture the Build
	const {sql, values} = this.buildQuery(opts);

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

	// SubQuery
	const is_subquery = opts.is_subquery;

	// Traverse the Request Object
	const {
		fields,
		has_many_join,
		sql_subquery_values,
		sql_joins,
		sql_join_values,
		sql_filter,
		sql_values,
	} = this.traverse(opts, is_subquery);

	{
		// Count is a special field, find and replace ...
		fields.filter(item => item.expression === `${opts.alias}._count`)
			.forEach(item => {
				item.expression = 'COUNT(*)';
				item.label = '_count';
				item.agg = true;
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

	// Ensure that the parent has opts.groupby when we're joining tables
	if (!is_subquery && !opts.groupby && has_many_join) {

		// Are all the fields aggregates?
		const all_aggs = fields.every(item => item.agg);

		if (!all_aggs) {
			// Determine whether there are non?
			opts.groupby = `${opts.alias}.id`;
		}
	}

	if (opts.groupby) {

		// Find the special _group column...
		fields.filter(item => item.expression === `${opts.alias}._group`)
			.forEach(item => {
				item.expression = opts.groupby;
				item.label = '_group';
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
	let alias;
	let decode;

	if (!fields.length) {
		// This query does not contain any fields
		// And so we should not include it
		return null;
	}

	if (is_subquery) {
		// Generate a Group Concat statement of the result
		const address = opts.field_alias_path || opts._joins[0].field_alias_path;
		const gc = group_concat(fields, address);
		sql_fields = gc.expression;
		alias = gc.label;
		decode = gc.decode;
	}
	else {
		sql_fields = fields.map(field => `${field.expression}${field.label ? ` AS '${field.label}'` : ''}`);
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

	return {sql, values, alias, decode};
}


function traverse(item, is_subquery) {

	// Filters populate the filter and values (prepared statements)
	const sql_filter = [];
	const sql_values = [];

	// Fields
	const fields = [];

	const sql_subquery_values = [];

	// Joins
	const sql_joins = [];
	const sql_join_values = [];

	const parent = item.parent;

	const resp = {
		sql_filter,
		sql_values,
		fields,
		sql_subquery_values,
		sql_joins,
		sql_join_values,
		has_many_join: false
	};

	// Things to change if this isn't the root.
	if (parent) {

		// Is this required join table?
		if (!item.required_join && !item.has_fields && !item.has_filter) {
			// Prevent this join from being included.
			return resp;
		}

		// Adopt the parents settings
		const many = item.many;

		// Does this have a many join
		resp.has_many_join = many;

		// We're unable to filter the subquery on a set of values
		// So, Do any of the ancestors containing one-many relationships?
		let ancestors_many = false;

		{
			let x = item;
			while (x.parent) {
				if (x.parent.many) {
					ancestors_many = true;
					break;
				}
				x = x.parent;
			}
		}

		// Should this be a sub query?
		// The join is not required for filtering,
		// And has a one to many relationship with its parent.
		if (this.group_concat && !is_subquery && !ancestors_many && !item.required_join && !item.has_filter && many) {

			// Mark as subquery
			item.is_subquery = true;

			// Make the sub-query
			const sub_query = this.buildQuery(item);

			// If the sub_query is empty
			if (!sub_query) {
				return resp;
			}

			// Add the values
			sql_subquery_values.push(...sub_query.values);

			// Add the formatted field
			fields.push({
				expression: `(${sub_query.sql})`,
				label: sub_query.alias
			});

			// Format the response
			if (sub_query.decode) {
				this.response_handlers.push(sub_query.decode);
			}

			// The rest has been handled in the sub-query
			return resp;
		}

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
	}


	// Build up the SQL conditions
	// e.g. filter= {category: asset, action: open, created_time: 2016-04-12T13:29:23Z..]
	if (item._filter) {

		item._filter.forEach(([field, condition, values]) => {
			sql_values.push(...values);
			sql_filter.push(`${item.alias}.${field} ${condition}`);
		});
	}

	// Fields
	// e.g. fields = [action, category, count, ...]
	if (item.fields) {

		// yes, believe it or not but some queries do have them...
		item.fields.map(prepField).forEach(([expression, label]) => {

			// Have we got a generated field?
			if (typeof expression === 'function') {
				// Add this to the list
				this.response_handlers.push(
					setField.bind(this, !item.root && item.alias, label, expression)
				);
				return;
			}

			fields.push(field_format(expression, label, item.alias, item.field_alias_path));
		});

	}

	// Traverse the next ones...
	if (item._joins) {

		item._joins.forEach(child => {
			child.parent = item;

			// Traverse the decendent arrays
			const child_resp = this.traverse(child, is_subquery);

			// Merge the results into this
			for (const x in resp) {
				const a = resp[x];
				const b = child_resp[x];
				if (Array.isArray(a)) {
					a.push(...b);
				}
				else if (b) {
					resp[x] = b;
				}
			}
		});
	}

	// When the item is not within a subquery
	// And its contains a relationship of many too one
	// Groups all the fields into GROUP_CONCAT
	if (item.many && !is_subquery && fields.length) {
		// Generate a Group Concat statement of the result
		const address = item.field_alias_path || item._joins[0].field_alias_path;
		const gc = group_concat(fields, address);

		// Reset the fields array
		fields.length = 0;
		fields.push(gc);
	}

	return resp;
}

function prepField(field) {

	if (typeof field === 'string') {
		return [field];
	}

	for (const label in field) {
		const expression = field[label];
		return [expression, label];
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
