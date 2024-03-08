/**
 * MapReduce
 * Create a handler to be applied to a array.reduce function
 * Executes the callback function on each item in the array and creating a new array of the results
 * @param {Function} callback - The function to be executed on each item
 * @returns {Function} - The handler
 */
export default function mapReduce(callback) {
	return (list, item, index) => {
		const response = callback(item, index);

		if (response) {
			list.push(response);
		}

		return list;
	};
}
