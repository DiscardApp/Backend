const ControllerContext = require('../../utils/http/ControllerContext');
const User = require('../../models/user/User');

class Users extends ControllerContext {
	route(router) {
		router.register('/users/{id}', this);
	}

	async get() {
		if (this.parameters.route.id) return this.show();
		else return this.list();
	}

	async list() {
		const users = await User.list();
		this.respond(users.toAPIResponse());
	}
}

module.exports = Users;