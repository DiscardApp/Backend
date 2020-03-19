const crypto = require('crypto');
const Model = require('../../utils/model/Model');

class AccessToken extends Model {

	static get table() {
		return 'access_tokens';
	}

	static get model() {
		return {
			token: {
				type: 'VARCHAR(32)',
				unique: true,
				notNull: true
			},
			user_id: {
				type: 'BIGINT',
				notNull: true
			},
			expires_at: {
				type: 'TIMESTAMP',
				notNull: true
			}
		};
	}

	static generateToken() {
		return crypto.randomBytes(16).toString('hex');
	}

}

module.exports = AccessToken;