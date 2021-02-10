describe('schema override', () => {

	let dare;

	beforeEach(() => {

		dare = new Dare({
			schema: {
				users: {
					write_protected_field: {
						writeable: false
					}
				}
			}
		});

		dare.execute = async () => ({ // Run SQL query ...
			success: true
		});

	});

	describe('patch', () => {

		it('allows overriding the schema of patch operations', async () => {

			const patchOptions = {
				table: 'users',
				filter: {
					id: 1234
				},
				body: {
					write_protected_field: 'new value'
				}
			};

			const callBeforeOverride = dare.patch(patchOptions);

			await expect(callBeforeOverride).to.be.eventually.rejected;

			const callAfterOverride = dare.patch({
				...patchOptions,
				schema: {
					users: {
						write_protected_field: {
							writeable: true
						}
					}
				}
			});

			await expect(callAfterOverride).to.be.eventually.fulfilled;

		});

	});

	describe('post', () => {

		it('allows overriding the schema of post operations', async () => {

			const postOptions = {
				table: 'users',
				body: {
					id: 1234,
					write_protected_field: 'new value'
				}
			};

			const callBeforeOverride = dare.post(postOptions);

			await expect(callBeforeOverride).to.be.eventually.rejected;

			const callAfterOverride = dare.post({
				...postOptions,
				schema: {
					users: {
						write_protected_field: {
							writeable: true
						}
					}
				}
			});

			await expect(callAfterOverride).to.be.eventually.fulfilled;

		});

	});

});