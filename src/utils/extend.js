/**
 * Extend Object works like Object.assign(...) but recurses into the nested properties
 *
 * @param {object} base - an object to extend
 * @param {...object} args - a series of objects to extend
 * @returns {object} extended object
 */
export default function extend(base, ...args) {
	args.forEach(current => {
		if (
			!Array.isArray(current) &&
			base instanceof Object &&
			current instanceof Object &&
			!(base instanceof Function) &&
			!(current instanceof Function) &&
			base !== current
		) {
			for (const x in current) {
				base[x] = extend(base[x], current[x]);
			}
		} else {
			base = current;
		}
	});
	return base;
}
