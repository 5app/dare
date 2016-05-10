'use strict';

module.exports = (sql, prepared) => {
	let i = 0;
	return sql.split(/\B\?\B/).map(pre => pre + value(prepared[i++])).join('');
};

function value(v, s = "'") {
	let t = typeof v;
	if (t === 'string') {
		return s + v.replace(/\\/, "\\\\").replace(/[']/, "\\'") + s;
	}
	else if (v !== undefined) {
		return v;
	}
	else
		return '';
}
