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

module.exports = Permissions;
