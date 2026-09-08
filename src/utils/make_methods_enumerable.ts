/**
 * Make the prototype methods of a class enumerable
 * ES class methods are non-enumerable by default, whereas the previous
 * `Class.prototype.method = function` assignments were enumerable.
 * This restores the original enumerable behaviour.
 * @param Class - Class whose prototype methods should be made enumerable
 */
export default function makeMethodsEnumerable(Class: {
	prototype: object;
}): void {
	for (const name of Object.getOwnPropertyNames(Class.prototype)) {
		if (name === 'constructor') {
			continue;
		}

		const descriptor = Object.getOwnPropertyDescriptor(
			Class.prototype,
			name
		);

		if (descriptor?.enumerable === false) {
			Object.defineProperty(Class.prototype, name, {
				...descriptor,
				enumerable: true,
			});
		}
	}
}
