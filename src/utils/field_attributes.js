/**
 * @typedef {object} FieldDefinition
 * @property {'json' | 'number' | 'boolean' | 'string' | 'datetime'} [type] - The type of the field
 * @property {string} [alias] - The alias of the field
 * @property {Array<string>} [references] - A reference to another table
 * @property {boolean} [readable=true] - Whether this field is readable
 * @property {boolean} [writeable=true] - Whether this field is writeable
 * @property {boolean} [required=false] - Whether this field is required
 * @property {Function} [handler] - Handler to generate the field value
 * @property {string | number | boolean | object | Array<string | number | boolean>} [defaultValue=null] - The default value of this field
 * @property {FieldDefinition} [get] - The get definition of this field
 * @property {FieldDefinition} [post] - The post definition of this field
 * @property {FieldDefinition} [patch] - The patch definition of this field
 * @property {FieldDefinition} [del] - The del definition of this field
 */

/**
 * Given a field definition defined in the schema, extract it's attributes
 *
 * @param {string} field - A field reference
 * @param {Object<string, FieldDefinition | boolean>} schema - A model schema definition
 * @param {object} dareInstance - A dare instance
 * @returns {FieldDefinition} An object containing the attributes of the field
 */
export default function getFieldAttributes(field, schema, dareInstance) {
	const fieldKey = dareInstance?.getFieldKey?.(field, schema) || field;

	/**
	 * @type {FieldDefinition} respDefinition
	 */
	const respDefinition = {
		...(fieldKey !== field && {alias: fieldKey}),
	};

	const fieldDefinition = schema[fieldKey];

	if (
		fieldDefinition &&
		typeof fieldDefinition === 'object' &&
		!Array.isArray(fieldDefinition)
	) {
		const {method} = dareInstance.options;

		if (method in fieldDefinition) {
			// Override/extend the base object with the method specific attributes
			Object.assign(respDefinition, fieldDefinition[method]);
		}

		/*
		 * @legacy support `defaultValue{get, post, patch, del}` definitions.
		 * If 'defaultValue' is an object
		 * Expand default value
		 */
		if (
			fieldDefinition.defaultValue !== null &&
			typeof fieldDefinition.defaultValue === 'object'
		) {
			respDefinition.defaultValue = fieldDefinition.defaultValue[method];
		}

		// This is already a definition object
		return {
			...fieldDefinition,
			...respDefinition,
		};
	}

	if (typeof fieldDefinition === 'string') {
		// This is an alias reference, the name is an alias of another
		return {
			...respDefinition,
			alias: fieldDefinition,
		};
	}

	if (Array.isArray(fieldDefinition)) {
		// This is an reference to another table, this field can be used in a table join
		return {
			...respDefinition,
			references: fieldDefinition,
		};
	}

	if (typeof fieldDefinition === 'function') {
		// This is a generated field
		return {
			...respDefinition,
			handler: fieldDefinition,
		};
	}

	if (fieldDefinition === false) {
		// Mark as inaccessible
		return {
			...respDefinition,
			readable: false,
			writeable: false,
		};
	}

	return {
		...respDefinition,
	};
}
