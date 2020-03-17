const bcrypt = require('bcrypt');
const Model = require('../../utils/model/Model');
const Permissions = require('./Permissions');

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
			avatar: {
				type: 'VARCHAR(34)'
			},
			email: {
				type: 'VARCHAR(254)',
				unique: true,
				notNull: true
			},
			phone: {
				type: 'VARCHAR(50)'
			},
			password: {
				type: 'VARCHAR(60)',
				notNull: true,
				hide: true
			},
			permissions_value: {
				type: 'SMALLINT',
				notNull: true,
				default: 0
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

	get permissions() {
		return new Permissions(User.permissionNames, this.permissions_value);
	}

	static get permissions() {
		return Permissions;
	}

	static get permissionNames() {
		return ['active', 'verifiedEmail', 'verifiedPhone', 'admin'];
	}

}

module.exports = User;