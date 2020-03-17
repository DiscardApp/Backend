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

	async show() {
		const { id } = this.parameters.route;
		const user = await User.find({ id });
		if (!user)
			return this.notFound({ message: 'User not found', code: 10000 | User.modelID });

		this.respond(user.toAPIResponse());
	}
}

module.exports = Users;