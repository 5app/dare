/**
 * Given a field definition defined in the schema, extract it's attributes
 *
 * @param {object|Function|string|undefined} fieldDefinition - A field definition as described in the schema
 * @returns {object} An object containing the attributes of the field
 */

module.exports = fieldDefinition => {

	const attributes = typeof fieldDefinition === 'object' ? fieldDefinition : {};

	if (typeof fieldDefinition === 'string' && !fieldDefinition.includes('.')) {

		// This is an alias reference, the name is an alias of another
		attributes.alias = fieldDefinition;

	}
	if (typeof fieldDefinition === 'function') {

		// This is a generated field
		attributes.handler = fieldDefinition;

	}

	return attributes;

};