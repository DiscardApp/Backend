const bcrypt = require('bcrypt');
const Model = require('../../utils/model/Model');

class User extends Model {

	static get table() {
		return 'users';
	}

	static get model() {
		return {
			id: {
				type: 'SNOWFLAKE'
			},
			username: {
				type: 'VARCHAR(32)',
				notNull: true,
				validate(value) {
					return typeof value === 'string' && value.length >= 3 && value.length <= 32;
				}
			},
			avatar: {
				type: 'VARCHAR(34)'
			},
			email: {
				type: 'VARCHAR(254)',
				unique: true,
				notNull: true,
				validate(value) {
					return typeof value === 'string' && value.length >= 3 && value.length <= 254 && /^.{1,64}@.{1,255}$/.test(value);
				}
			},
			phone: {
				type: 'VARCHAR(16)',
				validate(value) {
					return typeof value === 'string' ? /^\+\d{2, 15}$/.test(value) : ([undefined, null].includes(value) ? true : false);
				}
			},
			password: {
				type: 'VARCHAR(60)',
				notNull: true,
				hide: true,
				validate(value) {
					return typeof value === 'string' && value.length >= 8;
				}
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
		if (!password)
			return null;

		return bcrypt.hash(password, rounds);
	}

	/**
	 * Compares a plain-text password with a hash and returns whether they match
	 * @param {string} password The plain-text password
	 * @param {string} hash The hashed password
	 * @returns {Promise<boolean>} Whether the password matches
	 */
	static comparePassword(password, hash) {
		if (!password)
			return false;

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

class Permissions {
	constructor(availablePermissions, grantedPermissions) {
		this.permissions = grantedPermissions;
		this.availablePermissions = availablePermissions;

		for (const permission of availablePermissions) {
			const index = availablePermissions.indexOf(permission);
			const value = 2 ** index;

			this[permission] = (grantedPermissions & value) === value;
		}
	}

	static from(availablePermissions, grantedPermissions = []) {
		let value = 0;

		for (const name of grantedPermissions) {
			if (!availablePermissions.includes(name)) throw new Error(`Invalid permission name ${name}`);
			value += 2 ** availablePermissions.indexOf(name);
		}

		return value;
	}
}

module.exports = User;