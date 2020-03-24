const nodemailer = require('nodemailer');
const fs = require('fs');
const path = require('path');
const {promisify} = require('util');

let instance;

/**
 * A wrapper around nodemailer with utility functions
 */
class Mailer {

	/**
	 * Creates a new mailer. Mailers are automatically instantiated; use `Mailer.getInstance` instead
	 * @param {Object} config The configuration to use
	 * @param {Object} config.options The options to pass to nodemailer
	 * @param {Object} config.defaults The defaults to use
	 */
	constructor({options, defaults}) {
		this.transporter = nodemailer.createTransport(options, defaults);
		instance = this;
	}

	/**
	 * Returns the last instantiated mailer
	 * @returns {Mailer} The last instantiated mailer
	 */
	static getInstance() {
		return instance;
	}

	/**
	 *
	 * @param {String} to Email address to send the email to
	 * @param {String} subject The email's subject
	 * @param {String} templateName The email's template name
	 * @param {Object<String, String>} [replacements] The replacement values for the email template
	 */
	async sendMail(to, subject, templateName, replacements) {
		const presetLocation = path.resolve(path.join('templates', 'email', 'preset.html'));
		const contentLocation = path.resolve(path.join('templates', 'email', templateName, `${templateName}.html`));
		const footerLocation = path.resolve(path.join('templates', 'email', templateName, 'footer.html'));

		const templateExists = await promisify(fs.exists)(contentLocation);
		if (!templateExists) return new Error(`Template "${templateName}" does not exist`);

		const footerExists = await promisify(fs.exists)(footerLocation);
		let footer = '';
		if (footerExists) {
			let footerBuffer = await promisify(fs.readFile)(footerLocation);
			footer = `${footerBuffer.toString()}<br>`;
		}

		const content = `${(await promisify(fs.readFile)(contentLocation)).toString()}<br><br>`;

		let preset = (await promisify(fs.readFile)(presetLocation)).toString();
		preset = preset.replace('{{content}}', content);
		preset = preset.replace('{{footer}}', footer);

		preset = preset.replace(
			/{{([^}]+)}}/g,
			(match, key) => Mailer.sanitizeReplacement(replacements[key] || match)
		);

		return this.transporter.sendMail({
			to,
			subject,
			html: preset
		});
	}

	static sanitizeReplacement(value) {
		return (value || '')
			.replace(/&/g, '&amp;')
			.replace(/</g, '&lt;')
			.replace(/>/g, '&gt;')
			.replace(/"/g, '&quot;')
			.replace(/{/g, '&#123;')
			.replace(/}/g, '&#125;')
			.replace(/\n/g, ' ');
	}

}

module.exports = Mailer;