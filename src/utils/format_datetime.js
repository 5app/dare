module.exports = function formatDateTime(values) {
	if (typeof values === 'string') {

		if (values.indexOf('..') === -1) {
			values = `${values}..${values}`;
		}

		let i = 0;

		const a = values.split('..').map(str => {

			if (!str) {
				return '';
			}

			// Tidy up the ISO string
			const _str = str.replace(/(T\d+)$/, '$1:00'); // Requires minutes with hours

			const date = new Date(_str);

			if (i++) {

				const [, mm, dd, hh, i, s] = str.split(/\D+/);

				if (!mm) {
					date.setFullYear(date.getFullYear() + 1);
				}
				else if (!dd) {
					date.setMonth(date.getMonth() + 1);
				}
				else if (!hh) {
					date.setDate(date.getDate() + 1);
				}
				else if (!i) {
					date.setHours(date.getHours() + 1);
				}
				else if (!s) {
					date.setMinutes(date.getMinutes() + 1);
				}

				// Wind back a second
				if (!s) {
					date.setSeconds(date.getSeconds() - 1);
				}
			}

			return date.toISOString().replace(/\.\d+Z/, '');
		});

		if (a[0] === a[1]) {
			return a[0];
		}

		return a.join('..');
	}
	return values;
};
