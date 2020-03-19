const ControllerContext = require('../../utils/http/ControllerContext');
const AccessToken = require('../../models/user/AccessToken');
const User = require('../../models/user/User');

class AccessTokens extends ControllerContext {
	route(router) {
		router.register('/access_tokens/{token}', this);
	}

	async get() {
		if (this.parameters.route.token) return this.show();
		else return this.notAllowed();
	}

	async show() {
		const { token } = this.parameters.route;
		const accessToken = await AccessToken.find({ token });
		if (!token)
			return this.notFound('Invalid token');

		this.respond(accessToken.toAPIResponse());
	}

	async post() {
		if (this.parameters.route.token)
			return this.badRequest(this.postWithID);

		const { email, password, lifetime } = this.parameters.body;

		const user = await User.find({ email });
		if (!user || !await User.comparePassword(password, user.password))
			return this.badRequest('Invalid login');

		const accessTokenModel = new AccessToken({
			token: AccessToken.generateToken(),
			user_id: user.id,
			expires_at: new Date(Date.now() + (Math.min(0, lifetime) || 7 * 24 * 60 * 60 * 1000))
		});

		const accessToken = await accessTokenModel.create();
		this.respond(accessToken.toAPIResponse());
	}

	async delete() {
		const { token } = this.parameters.route.token;
		if (!token)
			return this.badRequest(this.deleteWithoutID);

		const accessToken = await AccessToken.find({ token });
		if (!accessToken)
			return this.notFound('Invalid token');

		const deletedToken = await accessToken.delete();
		this.respond(deletedToken.toAPIResponse());
	}
}

module.exports = AccessTokens;