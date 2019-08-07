/**
 * Given a field definition defined in the schema, extract it's attributes
 *
 * @param {object|Function|string|undefined} fieldDefinition - A field definition as described in the schema
 * @returns {object} An object containing the attributes of the field
 */

module.exports = fieldDefinition => {

	if (fieldDefinition && typeof fieldDefinition === 'object' && !Array.isArray(fieldDefinition)) {

		// This is already a definition object
		return fieldDefinition;

	}

	const attributes = {};

	if (typeof fieldDefinition === 'string' && !fieldDefinition.includes('.')) {

		// This is an alias reference, the name is an alias of another
		attributes.alias = fieldDefinition;

	}
	else if ((typeof fieldDefinition === 'string' && fieldDefinition.includes('.')) || Array.isArray(fieldDefinition)) {

		// This is an reference to another table, this field can be used in a table join
		attributes.references = fieldDefinition;

	}
	else if (typeof fieldDefinition === 'function') {

		// This is a generated field
		attributes.handler = fieldDefinition;

	}

	return attributes;

};