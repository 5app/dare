import DareError from '../utils/error.ts';

export interface LimitClause {
	/**
	 * Limit defintion
	 */
	limit: number;

	/**
	 * Start defintion
	 */
	start?: number;

	/**
	 * Whether this is a single limit
	 */
	single?: boolean;
}

/**
 * Limit Clause
 * Set/Check limit and start positions
 * @param opts - Options object
 * @param opts.limit - Limit defintion
 * @param opts.start - Start defintion
 * @param MAX_LIMIT - Max limit on instance
 * @returns Limit Clause
 */
export default function limitClause(
	{limit, start}: {limit?: number; start?: number},
	MAX_LIMIT: number | null
): LimitClause {
	let single;
	if (limit === undefined) {
		limit = 1;
		single = true;
	} else {
		limit = +limit;

		if (isNaN(limit) || (MAX_LIMIT && limit > MAX_LIMIT) || limit < 1) {
			throw new DareError(
				DareError.INVALID_LIMIT,
				`Out of bounds limit value: '${limit}'`
			);
		}
	}

	if (start !== undefined) {
		start = +start;

		if (typeof start !== 'number' || isNaN(start) || start < 0) {
			throw new DareError(
				DareError.INVALID_START,
				`Out of bounds start value: '${start}'`
			);
		}
	}

	return {
		limit,
		...(start && {start}),
		...(single && {single}),
	};
}
