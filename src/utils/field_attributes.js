/**
 * Given a field definition defined in the schema, extract it's attributes
 *
 * @param {string} field - A field reference
 * @param {object} schema - A model schema definition
 * @param {object} dareInstance - A dare instance
 * @returns {object} An object containing the attributes of the field
 */
export default function getFieldAttributes(field, schema, dareInstance) {
	const fieldKey = dareInstance?.getFieldKey?.(field, schema) || field;

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
			fieldDefinition.defaultValue = fieldDefinition.defaultValue[method];
		}

		// This is already a definition object
		return {
			...respDefinition,
			...fieldDefinition,
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
