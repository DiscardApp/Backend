const ControllerContext = require('../../utils/http/ControllerContext');
const User = require('../../models/user/User');
const VerificationToken = require('../../models/user/VerificationToken');

class VerificationTokens extends ControllerContext {
	route(router) {
		router.register('/verification_tokens/{token}', this);
	}

	async get() {
		if (this.parameters.route.token) return this.show();
		else return this.notAllowed();
	}

	async show() {
		const {token} = this.parameters.route;
		const verificationToken = await VerificationToken.find({token});
		if (!verificationToken)
			return this.notFound('Invalid token');

		this.respond(verificationToken.toAPIResponse());
	}

	async delete() {
		const {token} = this.parameters.route;
		const verificationToken = await VerificationToken.find({token});
		if (!verificationToken)
			return this.notFound('Invalid token');

		const user = await User.find({id: verificationToken.user_id});

		await user.update({
			permissions_value: user.permissions_value | User.permissions.from(User.permissionNames, ['verifiedEmail'])
		});

		this.respond(verificationToken.toAPIResponse());
	}
}

module.exports = VerificationTokens;