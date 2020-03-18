class SQLHandler {
	static async query(query, parameters) {
		const message = {
			type: 'sql',
			nonce: Math.floor(Math.random() * Number.MAX_SAFE_INTEGER),
			query,
			parameters
		};

		const promise = new Promise((resolve, reject) => {
			const handle = incomingMessage => {
				const { nonce, data, error } = incomingMessage;
				if (nonce !== message.nonce)
					return process.once('message', handle);

				if (error) {
					const error = new Error();
					for (const [key, value] of Object.entries(data))
						error[key] = value;

					reject(error);
				} else resolve(data);
			};

			process.once('message', handle);
		});

		process.send(message);

		return await promise;
	}
}

module.exports = SQLHandler;