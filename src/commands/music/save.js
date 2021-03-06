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
 * @file Music SaveQueueCommand - DMs the 10 upcoming songs from the queue to the user
 * **Aliases**: `save-songs`, `save-song-list`, `ss`, `savequeue`
 * @module
 * @category music
 * @name save
 * @returns {MessageEmbed} Titles, durations and total queue duration sent in a DM
 */

const path = require('path'),
  Song = require(path.join(__dirname, '../../data/melody/SongStructure.js')), // eslint-disable-line sort-vars
  {Command, util} = require('discord.js-commando'),
  {MessageEmbed} = require('discord.js'),
  {oneLine, stripIndents} = require('common-tags'),
  {deleteCommandMessages, stopTyping, startTyping} = require('../../util.js');

module.exports = class SaveQueueCommand extends Command {
  constructor (client) {
    super(client, {
      name: 'save',
      memberName: 'save',
      group: 'music',
      aliases: ['save-songs', 'save-song-list', 'ss', 'savequeue'],
      description: 'Saves the queued songs for later',
      examples: ['save'],
      guildOnly: true,
      throttling: {
        usages: 2,
        duration: 3
      }
    });

  }

  run (msg) {
    startTyping(msg);
    const queue = this.queue.get(msg.guild.id);

    if (!queue) {
      deleteCommandMessages(msg, this.client);
      stopTyping(msg);

      return msg.reply('there isn\'t any music playing right now. You should get on that.');
    }
    const currentSong = queue.songs[0], // eslint-disable-line one-var
      currentTime = currentSong.dispatcher ? currentSong.dispatcher.streamTime / 1000 : 0,
      embed = new MessageEmbed(),
      paginated = util.paginate(queue.songs, 1, Math.floor(10));

    embed
      .setColor(msg.guild ? msg.guild.me.displayHexColor : '#7CFC00')
      .setAuthor(`${msg.author.tag} (${msg.author.id})`, msg.author.displayAvatarURL({format: 'png'}))
      .setImage(currentSong.thumbnail)
      .setDescription(stripIndents`
            __**First 10 songs in the queue**__
            ${paginated.items.map(song => `**-** ${!isNaN(song.id) 
    ? `${song.name} (${song.lengthString})` 
    : `[${song.name}](${`https://www.youtube.com/watch?v=${song.id}`})`} (${song.lengthString})`).join('\n')}
            ${paginated.maxPage > 1 ? `\nUse ${msg.usage()} to view a specific page.\n` : ''}

            **Now playing:** ${!isNaN(currentSong.id) ? `${currentSong.name}` : `[${currentSong.name}](${`https://www.youtube.com/watch?v=${currentSong.id}`})`}
            ${oneLine`
                **Progress:**
                ${!currentSong.playing ? 'Paused: ' : ''}${Song.timeString(currentTime)} /
                ${currentSong.lengthString}
                (${currentSong.timeLeft(currentTime)} left)
            `}`);

    msg.reply('✔ Check your inbox!');
    deleteCommandMessages(msg, this.client);
    stopTyping(msg);

    return msg.direct('Your saved queue', {embed});
  }

  get queue () {
    if (!this._queue) {
      this._queue = this.client.registry.resolveCommand('music:play').queue;
    }

    return this._queue;
  }
};