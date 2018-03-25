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

/**
 * Convert one currency to another  
 * Note: bitcoin is BTC, Ethereum is ETH, Litecoin is LTC  
 * For a full list of supported currencies see [this url](https://docs.openexchangerates.org/docs/supported-currencies)  
 * **Aliases**: `money`, `rate`, `convert`
 * @module
 * @category utility
 * @name oxr
 * @example ox 1 EUR USD
 * @param {number} MoneyAmount
 * @param {string} OriginCurrency
 * @param {string} TargetCurrency
 * @returns {MessageEmbed} Input and output currency's and the amount your input is worth in both
 */

const {MessageEmbed} = require('discord.js'),
	commando = require('discord.js-commando'),
	currencySymbol = require('currency-symbol-map'),
	fx = require('money'),
	moment = require('moment'),
	oxr = require('open-exchange-rates'),
	{deleteCommandMessages} = require('../../util.js'),
	{oneLine} = require('common-tags'),
	{oxrAppID} = require('../../auth.json');

module.exports = class moneyCommand extends commando.Command {
	constructor (client) {
		super(client, {
			'name': 'oxr',
			'memberName': 'oxr',
			'group': 'utility',
			'aliases': ['money', 'rate', 'convert'],
			'description': 'Currency converter - makes use of ISO 4217 standard currency codes (see list here: <https://docs.openexchangerates.org/docs/supported-currencies>)',
			'format': 'CurrencyAmount FirstValuta SecondValuta',
			'examples': ['convert 50 USD EUR'],
			'guildOnly': false,
			'throttling': {
				'usages': 2,
				'duration': 3
			},
			'args': [
				{
					'key': 'value',
					'prompt': 'Amount of money?',
					'type': 'string'
				},
				{
					'key': 'curOne',
					'prompt': 'What is the valuta you want to convert **from**?',
					'type': 'string'
				},
				{
					'key': 'curTwo',
					'prompt': 'What is the valuta you want to convert **to**?',
					'type': 'string'
				}
			]
		});
	}


	converter (value, curOne, curTwo) {
		return fx.convert(value, {
			'from': curOne,
			'to': curTwo
		});
	}

	replaceAll (string, pattern, replacement) {
		return string.replace(new RegExp(pattern, 'g'), replacement);
	}

	run (msg, args) {
		oxr.set({'app_id': oxrAppID});

		oxr.latest(async () => {
			try {
				fx.rates = oxr.rates;
				fx.base = oxr.base;
				const convertedMoney = await this.converter(this.replaceAll(args.value, /,/, '.'), args.curOne, args.curTwo),
					oxrEmbed = new MessageEmbed();

				oxrEmbed
					.setColor(msg.guild ? msg.guild.me.displayHexColor : '#A1E7B2')
					.setAuthor('🌐 Currency Converter')
					.addField(args.curOne !== 'BTC'
						? `:flag_${args.curOne.slice(0, 2).toLowerCase()}: Money in ${args.curOne}`
						: '💰 Money in Bitcoin',
					`${currencySymbol(args.curOne)}${this.replaceAll(args.value, /,/, '.')}`, true)

					.addField(args.curTwo !== 'BTC'
						? `:flag_${args.curTwo.slice(0, 2).toLowerCase()}: Money in ${args.curTwo}`
						: '💰 Money in Bitcoin',
					`${currencySymbol(args.curTwo)}${convertedMoney}`, true)
					.setFooter(`Converted money from input using openexchangerates | converted on: ${moment().format('MMMM Do YYYY [at] HH:mm:ss [UTC]Z')}`);

				deleteCommandMessages(msg, this.client);

				return msg.embed(oxrEmbed);
			} catch (error) {
				console.error(oneLine `An error occured in the oxr command on the ${msg.guild.name} (${msg.guild.id}) server. 
				Command execute time: ${moment().format('MMMM Do YYYY [at] HH:mm:ss [UTC]Z')}. The error is: ${error}`);

				return msg.reply('⚠️ An error occurred. Make sure you used supported currency names. See the list here: <https://docs.openexchangerates.org/docs/supported-currencies>');
			}
		});
	}
};