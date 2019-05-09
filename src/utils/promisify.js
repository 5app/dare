/**
 * Promisify a function if it's not already a Promise.
 * This works differently to native util.promisify because it will accept a function which is already wrapped in a promise
 *
 * @params function to wrap into a promise
 * @returns the function promisified, so can be called with parameters as it was before but without the CommonJS callback
 */
module.exports = function promisify(func) {

	return (...args) => {
		return new Promise((resolve, reject) => {

			const p = func(...args, (err, results) => {

				if (err) {
					reject(err);
					return;
				}
				resolve(results);

			});

			if (p && typeof p.then === 'function') { // eslint-disable-line promise/prefer-await-to-then
				// support if execute returns a promise
				p.then(resolve, reject); // eslint-disable-line promise/prefer-await-to-then
			}
		});
	};
};