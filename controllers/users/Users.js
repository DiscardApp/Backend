const ControllerContext = require('../../utils/http/ControllerContext');
const User = require('../../models/user/User');
const VerificationToken = require('../../models/user/VerificationToken');

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
			return this.notFound('User not found');

		this.respond(user.toAPIResponse());
	}

	async post() {
		if (this.parameters.route.id)
			return this.badRequest(this.postWithID);

		const data = this.parameters.body;
		delete data.id;
		delete data.avatar;

		data.password = await User.hashPassword(data.password);
		data.permissions_value = User.permissions.from(User.permissionNames, ['active']);

		const model = new User(data);
		const validationResult = model.validate();
		if (validationResult instanceof Error)
			return this.respond(validationResult);

		let user;
		try {
			user = await model.create();
		} catch (err) {
			const { routine, constraint_name } = err;
			if (routine === '_bt_check_unique' && constraint_name === 'users_email_key')
				return this.badRequest('This email address is already in use');

			return this.error(err);
		}

		const verificationTokenModel = new VerificationToken({
			token: VerificationToken.generateToken(),
			user_id: user.id,
			expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
		});

		let verificationToken;
		try {
			verificationToken = await verificationTokenModel.create();
		} catch (err) {
			await user.delete();
			return this.error(err);
		}

		// TODO send token by email

		this.respond(user.toAPIResponse());
	}
}

module.exports = Users;