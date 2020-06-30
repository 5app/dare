const checkFormat = require('../utils/unwrap_field');
const checkLabel = require('../utils/validate_label');
const checkKey = require('../utils//validate_field');
const DareError = require('../utils//error');
const fieldRelativePath = require('../utils/field_relative');
const getFieldAttributes = require('../utils/field_attributes');
const jsonParse = require('../utils/JSONparse');


/**
 * Return a reducer function deriving local props and nested props
 * @param {object} opts - Options
 * @param {string} opts.current_path - Current address path of the resource
 * @param {Function} opts.extract - Function for handling the extraction of content
 * @param {object} opts.table_schema - Table schema/Data model
 * @param {object} opts.dareInstance - Instance of Dare which is calling this
 * @returns {Function} Fields Reducer function
 */
module.exports = function fieldReducer({current_path, extract, table_schema, dareInstance}) {

	const addToJoin = (field, label) => {

		// Get the full address of the field from the expression
		const address = checkFormat(field).field;

		/*
		 * Does the path exist at the end of the current_address
		 * e.g. Our current address might be grandparent.parent.
		 * Then we'd break down the new address "parent.tbl.field" => "parent.tbl." => "parent."
		 * And see that that actually the path is the bit we've removed... aka tbl.field
		 */
		const path = fieldRelativePath(current_path, address);
		const relative = path.split('.');

		if (relative.length > 1) {

			const key = relative[0];
			const value = label ? {[label]: field} : field;

			// Extract nested field
			extract(key, [value]);

			return true;

		}

	};

	// Handle each field property
	return (fieldsArray, field) => {

		if (typeof field !== 'string') {

			for (const key in field) {

				const value = field[key];
				if (typeof value === 'object') {

					// Ensure this isn't empty
					if (isEmpty(value)) {

						// Skip these empty objects
						continue;

					}

					// Extract nested field
					extract(key, (Array.isArray(value) ? value : [value]));

				}
				else {

					/*
					 * This field has an alias
					 * i.e. latest: MAX(created_time)
					 */

					// Check errors in the key field
					checkLabel(key);

					// Check the new value field parents, aka `parent_table.field`
					if (addToJoin(value, key)) {

						continue;

					}

					fieldsArray.push(fieldMapping(value, key, table_schema, fieldsArray));

				}

			}

		}

		else {

			// Check errors in the key field
			checkKey(field);

			/*
			 * This is also a field, so check that its a valid field
			 * + If it contains a nested value: create a join.
			 */
			if (addToJoin(field)) {

				return fieldsArray;

			}

			fieldsArray.push(fieldMapping(field, null, table_schema, fieldsArray, dareInstance));

		}

		return fieldsArray;

	};

};

/**
 * FieldMapping
 * Given a label, value and schema
 * Maps the field expression to an entry in the schema and formats the entry
 * Invokes generated functions with access to modify the fieldsArray
 *
 * @param {string} field - Field expression
 * @param {string|null} label - Optional label, or null
 * @param {object} tableSchema - Schema of the current table
 * @param {Array} fieldsArray - An array of all the fields to use with generated functions
 * @param {object} dareInstance - An instance of the current Dare object
 * @returns {string|object} The augemented field expression
 */
function fieldMapping(field, label, tableSchema, fieldsArray, dareInstance) {

	// Try to return an object
	const isObj = Boolean(label);

	// Set the label
	if (!label) {

		// Set the label to be the field...
		label = field;

	}

	// Extract the underlying field
	const {field_name, prefix, suffix, field_path} = checkFormat(field);

	// Get the schema entry for the field
	const {handler, alias, type, readable} = getFieldAttributes(tableSchema[field_name]);

	// Is this readable?
	if (readable === false) {

		throw new DareError(DareError.INVALID_REFERENCE, `Field '${field_name}' is not readable`);

	}

	// Does this field have a handler in the schema
	if (handler) {

		// Execute the handler, add the response to the field list
		return {
			[label]: handler.call(dareInstance, fieldsArray)
		};

	}

	// Does the field map to another key name...
	if (alias) {

		// Use the original name, defined by the key_definition
		field = rewrap_field((field_path ? `${field_path}.` : '') + alias, prefix, suffix);

	}


	// Default format datetime field as an ISO string...
	if (type === 'datetime' && !prefix) {

		field = `DATE_FORMAT(${field},'%Y-%m-%dT%TZ')`;

	}

	// Default format datetime field as an ISO string...
	else if (type === 'json' && !prefix) {

		// Add a function of the same name to retro-format the field
		fieldsArray.push({
			[label]: item => jsonParse(item[label]) || {}
		});

		// Continue...

	}

	// If this is a object-field definition
	if (isObj || label !== field) {

		// Add the field to the array
		return {
			[label]: field
		};

	}

	else {

		// Add the field to the array
		return field;

	}

}

function rewrap_field(field_name, prefix, suffix) {

	return [prefix, field_name, suffix].filter(a => a).join('');

}

// Is Empty
function isEmpty(value) {

	return !value || (Array.isArray(value) ? value : Object.keys(value)).length === 0;

}