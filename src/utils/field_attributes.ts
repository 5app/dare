import type {
	default as Dare,
	FieldAttributes,
	FieldAttributesWithShorthand,
} from '../index.ts';

/**
 * Given a field definition defined in the schema, extract it's attributes
 * @param field - A field reference
 * @param schema - A model schema definition
 * @param dareInstance - A dare instance
 * @param useDefault - Fallback to `default` schema field definition
 * @returns An object containing the attributes of the field
 */
export default function getFieldAttributes(
	field: string,
	schema: Record<string, FieldAttributesWithShorthand>,
	dareInstance: Dare,
	useDefault = false
): FieldAttributes {
	const fieldKey = dareInstance?.getFieldKey?.(field, schema) || field;

	const respDefinition: FieldAttributes = {
		...(fieldKey !== field && {alias: fieldKey}),
	};

	/*
	 * Field definition is the schema attributes
	 * If useDefault is true or fieldKey = '_group', '_count', then use the default schema definition when the field is not found
	 */
	const fieldDefinition = Object.hasOwn(schema, fieldKey)
		? schema[fieldKey]
		: useDefault && !['_group', '_count'].includes(fieldKey)
			? schema.default
			: undefined;

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
