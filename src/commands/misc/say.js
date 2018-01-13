/*
 *   This file is part of Ribbon
 *   Copyright (C) 2017-2018 Favna
 *
 *   This program is free software: you can redistribute it and/or modify
 *   it under the terms of the GNU General Public License as published by
 *   the Free Software Foundation, version 3 of the License
 *
 *   This program is distributed in the hope that it will be useful,
 *   but WITHOUT ANY WARRANTY; without even the implied warranty of
 *   MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 *   GNU General Public License for more details.
 *
 *   You should have received a copy of the GNU General Public License
 *   along with this program.  If not, see <http://www.gnu.org/licenses/>.
 *
 *   Additional Terms 7.b and 7.c of GPLv3 apply to this file:
 *       * Requiring preservation of specified reasonable legal notices or
 *         author attributions in that material or in the Appropriate Legal
 *         Notices displayed by works containing it.
 *       * Prohibiting misrepresentation of the origin of that material,
 *         or requiring that modified versions of such material be marked in
 *         reasonable ways as different from the original version.
 */

const commando = require('discord.js-commando');

module.exports = class sayCommand extends commando.Command {
	constructor (client) {
		super(client, {
			'name': 'say',
			'aliases': ['sayd', 'repeat'],
			'group': 'misc',
			'memberName': 'say',
			'description': 'I will repeat your message',
			'examples': ['say {message}', 'say Favna is a great coder!'],
			'guildOnly': false,
			'throttling': {
				'usages': 2,
				'duration': 3
			},

			'args': [
				{
					'key': 'txt',
					'prompt': 'What should I say?',
					'type': 'string',
					'label': 'Text to repeat',
					'validate': (rep, msg) => {
						if (msg.content.toLowerCase().includes('@here') ||
						msg.content.toLowerCase().includes('@everyone') ||
						msg.cleanContent.toLowerCase().includes('@here') ||
						msg.cleanContent.toLowerCase().includes('@everyone')) {
							msg.delete();

							return 'You cannot make me mention `@here` or `@everyone`!';
						}

						return true;
					}
				}
			]
		});
	}

	deleteCommandMessages (msg) {
		if (msg.deletable && this.client.provider.get(msg.guild, 'deletecommandmessages', false)) {
			msg.delete();
		}
	}

	run (msg, args) {

		this.client.provider.set(msg.guild.id, 'lastSayMessage', msg);
		this.deleteCommandMessages(msg);

		return msg.say(args.txt);
	}
};