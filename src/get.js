'use strict';

let error = require('./utils/error');

module.exports = function() {

	let opts = this.options;

	// Restrict the maximum items to respond with

	let limit = opts.limit;
	let single_record = false;

	// limit
	if (limit === undefined) {
		limit = 1;
		single_record = true;
	}
	else {
		let _limit = parseInt(limit, 10);
		if (isNaN(_limit) || _limit > 100 || _limit < 1) {
			throw Object.assign(error.INVALID_LIMIT, {
				message: `Out of bounds limit value: '${limit}'`
			});
		}

		let start = opts.start;

		if (start !== undefined) {
			if (typeof start === 'string' && start.match(/^\d+$/)) {
				start = +opts.start;
			}
			if (typeof start !== 'number' || isNaN(start) || start < 0) {
				throw Object.assign(error.INVALID_START, {
					message: `Out of bounds start value: '${start}'`
				});
			}
		}

		limit = (start ? start + ',' : '') + _limit;
	}

	// Initiate join
	opts.join = {};

	// Extend the opts object with the conditions
	if (!opts.where) {
		opts.where = {};
	}

	// Set the table_response_handlers
	opts.response_handlers = [];

	// Get the root tableID
	let tableID = opts.table;
	let tableName = this.table_alias_handler(opts.table);

	// Reject when the table is not recognised
	if (!tableName) {
		throw Object.assign(error.INVALID_REFERENCE, {
			message: `Unrecognized reference '${opts.table}'`
		});
	}

	// Filters
	// Filters populate the conditions and values (prepared statements)
	let conditions = [];
	let values = [];

	// Restrict the resources that are returned
	// e.g. filter= {category: asset, action: open, created_time: 2016-04-12T13:29:23Z..]
	if (opts.filter) {
		// If filter is not an object
		if (typeof opts.filter !== 'object') {
			throw Object.assign(error.INVALID_REFERENCE, {
				message: `The filter '${opts.filter}' is invalid.`
			});
		}

		// Add the conditions
		queryFilter(opts, opts.filter, tableID);

		// Create a list of conditions
		conditions = prepareCondition(opts.where).map(condition => {
			let field = condition[0];
			let operator = condition[1];
			let value = condition[2];

			if (Array.isArray(value)) {
				values = values.concat(value);
				operator = 'IN';
				value = '(' + value.map(() => '?') + ')';
			}
			else {
				values.push(value);
				value = '?';
			}
			return `${field} ${operator} ${value}`;
		});
	}

	// Fields
	// e.g. fields = [action, category, count, {app: [name, id]}]
	opts.fields = queryFields.call(this, opts.fields, tableID);


	{
		// Count is a special field, find it ...
		let i = opts.fields.indexOf(tableID + '._count');

		if (i > -1) {
			// ... and replace it.
			opts.fields[i] = 'COUNT(*) as _count';
		}
	}

	// Join
	let joins = [];
	{
		// Get join tables...
		let a = this.join_handler(opts.join);
		// Format the table references
		a = this.table_handler(a);

		// Prefix all the conditional keys
		a.forEach(join => {
			join.conditions = prefixKeys(join.conditions, join.alias + '.');
		});

		// Create the SQL JOINS
		joins = a.map(join => `LEFT JOIN ${join.table} ${join.table === join.alias ? '' : join.alias} ON (${serialize(join.conditions, '=', 'AND')})`);

		// Is group concat supported?
		if (this.group_concat) {

			// Get the joins which have a many relationship
			let manyJoins = a.filter(join => join.many);

			// Add default groupby
			let group = false;

			// Format fields which have join table with many
			opts.fields = opts.fields.map(field => {
				let b = field.split(' AS ');
				let label = b[1];
				if (!label) {
					return field;
				}
				let many = manyJoins.filter(join => !!label.match(join.alias + '.'));
				if (many.length) {

					// Mark as group
					group = true;

					b[0] = `GROUP_CONCAT(CONCAT('"', IFNULL(${b[0]}, ''), '"') SEPARATOR '${this.group_concat}')`;
					if (b[1]) {
						many.forEach(join => {
							b[1] = b[1].replace(join.alias + '.', () => join.alias + `[${this.group_concat}].`);
						});
					}
					field = b.join(' AS ');
				}
				return field;
			});

			if (group && !opts.groupby) {
				opts.groupby = 'id';
			}
		}
	}

	// Groupby
	// If the content is grouped
	if (opts.groupby) {
		// Check inject
		checkFormat(opts.groupby);

		// Find the special _group column...
		let i = opts.fields.indexOf(tableID + '._group');

		if (i > -1) {
			// ... and replace it.
			opts.fields[i] = opts.groupby + ' as _group';
		}

		// Add the grouping
		opts.groupby = `GROUP BY ${opts.groupby}`;
	}
	else {
		opts.groupby = '';
	}

	// Orderby
	// If the content is ordered
	if (opts.orderby) {

		let test = opts.orderby;

		if (typeof test === 'string') {
			test = test.replace(/\s*(DESC|ASC)$/, '');
		}

		// Check format
		checkFormat(test);

		// Add the grouping
		opts.orderby = `ORDER BY ${opts.orderby}`;
	}
	else {
		opts.orderby = '';
	}


	// Put it all together
	let sql = `SELECT ${opts.fields.toString()}
						 FROM ${tableName} ${tableID === tableName ? '' : tableID}
								${joins.join('\n')}
						 WHERE
							 ${conditions.join(' AND ')}
						 ${opts.groupby}
						 ${opts.orderby}
						 LIMIT ${limit}`;

	return this
	.sql(sql, values)
	.then(this.response_handler.bind(this))
	.then(resp => {

		// If limit was not defined we should return the first result only.
		if (single_record) {
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

function queryFilter(opts, filter, tableID) {

	for (let key in filter) {
		// Capture errors in the key
		checkKey(key);

		let val = filter[key];
		if (typeof val === 'object' && !Array.isArray(val)) {
			// Which table is being joined
			opts.join[key] = tableID;
			queryFilter(opts, val, key);
		}
		else {
			opts.where[tableID + '.' + key] = val;
		}
	}
}

function queryFields(fields, tableID, depth) {

	depth = depth || 0;
	let a = [];
	let table_structure = {};
	let opts = this.options;

	if (opts && opts.schema) {
		let table = this.table_alias_handler(tableID);
		table_structure = opts.schema[table] || {};
	}

	if (!Array.isArray(fields)) {
		throw Object.assign(error.INVALID_REFERENCE, {
			message: `The field definition '${fields}' is invalid.`
		});
	}

	walk(fields, field => {
		if (typeof field !== 'string') {
			for (let x in field) {
				// Which table is being joined
				if (Array.isArray(field[x])) {
					opts.join[x] = tableID;
					a = a.concat(queryFields.call(this, field[x], x, depth + 1));
				}
				else {
					// Check errors in the key field
					checkKey(x);

					// Check the new value field
					checkFormat(field[x]);

					a.push(`${field[x]} AS ${x}`);
				}
			}
		}
		else {

			// Check errors in the key field
			checkKey(field);

			// Does this field have a handler in the schema
			if (table_structure[field]) {

				let handler = table_structure[field];

				if (typeof handler === 'function') {

					let res = handler.call(this, fields);

					if (typeof res === 'function') {
						// Add this function to each row of the response
						opts.response_handlers.push(setField.bind(this, field, tableID, depth, res));

						// Do not add this field to the current list
						return;
					}
				}
			}


			if (field.indexOf('.') === -1) {
				field = tableID + '.' + field;
			}


			let as = (depth ? ` AS '${field}'` : '');
			a.push(field + as);
		}
	});

	return a;
}

function prepareCondition(obj) {
	let a = [];

	let range_handler = (field, value, index) => {
		if (value !== '') {
			a.push([field, (index ? '<' : '>'), value]);
		}
	};

	for (let field in obj) {

		let value = obj[field];

		// Range
		// A range is denoted by two dots, e.g 1..10
		let range = (typeof value === 'string') && value.split('..');
		if (range.length === 2) {
			range.forEach(range_handler.bind(null, field));
		}

		// Is this an array match?
		else if (typeof value === 'string' && value.match('%')) {
			a.push([field, 'LIKE', value]);
		}

		// Add to the array of items
		else {
			a.push([field, '=', value]);
		}

	}
	return a;
}

function checkKey(x) {
	let reg = /^([a-z\_]+\.)?([a-z\_]+|\*)+$/i;

	// Capture errors in the key
	if (!x.match(reg)) {
		throw Object.assign(error.INVALID_REFERENCE, {
			message: `The key '${x}' must match ${reg}`
		});
	}
}

function checkFormat(str) {

	if (typeof str !== 'string') {
		throw Object.assign(error.INVALID_REFERENCE, {
			message: `The field definition '${str}' is invalid.`
		});
	}

	let c = str;
	let m;

	// strip away the `str(`...`)`
	while ((m = c.match(/^\s*[a-z]+\((.*?)\)\s*$/i))) {
		// match
		c = m[1];
	}

	// Is this a valid field
	if (!c.match(/^(((DISTINCT)\s)?[a-z\_\.]+|\*)$/i)) {
		throw Object.assign(error.INVALID_REFERENCE, {
			message: `The field definition '${str}' is invalid.`
		});
	}
}

function serialize(obj, separator, delimiter) {
	let r = [];
	for (let x in obj) {
		r.push(`${x} ${separator} ${obj[x]}`);
	}
	return r.join(` ${delimiter} `);
}

function walk(a, handler) {
	// support a growing list of array items.
	for (let i = 0; i < a.length; i++) {
		handler(a[i]);
	}
}

function setField(field, tableID, depth, handler, obj) {

	if (depth) {
		obj = obj[tableID];
	}
	if (!Array.isArray(obj)) {
		obj = [obj];
	}

	obj.forEach(item => item[field] = handler.call(this, item));
}

function prefixKeys(obj, prefix = '') {
	let r = {};
	for (var x in obj) {
		r[prefix + x] = obj[x];
	}
	return r;
}
