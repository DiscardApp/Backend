const crypto = require('crypto');
const Model = require('../../utils/model/Model');

class VerificationToken extends Model {

	static get table() {
		return 'verification_tokens';
	}

	static get model() {
		return {
			token: {
				type: 'VARCHAR(8)',
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
		return crypto.randomBytes(4).toString('hex');
	}

}

module.exports = VerificationToken;