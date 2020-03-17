const bcrypt = require('bcrypt');
const Model = require('../../utils/model/Model');

class User extends Model {

	static get table() {
		return 'users';
	}

	static get modelID() {
		return 1;
	}

	static get model() {
		return {
			id: {
				type: 'SNOWFLAKE'
			},
			username: {
				type: 'VARCHAR(32)',
				notNull: true
			},
			password: {
				type: 'VARCHAR(60)',
				notNull: true,
				hide: true
			}
		};
	}

	/**
	 * Creates a hash of the given plain-text password
	 * @param {string} password The plain-text password to hash
	 * @param {number} [rounds] The rounds of salt to use
	 * @returns {Promise<string>} The hashed password
	 */
	static hashPassword(password, rounds = 12) {
		return bcrypt.hash(password, rounds);
	}

	/**
	 * Compares a plain-text password with a hash and returns whether they match
	 * @param {string} password The plain-text password
	 * @param {string} hash The hashed password
	 * @returns {Promise<boolean>} Whether the password matches
	 */
	static comparePassword(password, hash) {
		return bcrypt.compare(password, hash);
	}

}

module.exports = User;