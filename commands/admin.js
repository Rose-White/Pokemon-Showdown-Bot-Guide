/*
	Admin Commands
*/

function setPermission(room, perm, rank) {
	if (!Settings.settings.commands) Settings.settings.commands = {};
	if (!Settings.settings.commands[room]) Settings.settings.commands[room] = {};
	Settings.settings.commands[room][perm] = rank;
	Settings.save();
}

exports.commands = {
	c: 'custom',
	custom: function (arg, by, room, cmd) {
		if (!this.isRanked(Tools.getGroup('admin'))) return false;
		var tarRoom;
		if (arg.indexOf('[') === 0 && arg.indexOf(']') > -1) {
			tarRoom = toRoomid(arg.slice(1, arg.indexOf(']')));
			arg = arg.substr(arg.indexOf(']') + 1).trim();
		}
		this.say(tarRoom || room, arg);
	},

	"join": function (arg, by, room, cmd) {
		if (!this.isRanked(Tools.getGroup('admin'))) return false;
		if (!arg) return;
		arg = arg.split(',');
		var cmds = [];
		for (var i = 0; i < arg.length; i++) {
			cmds.push('|/join ' + arg[i]);
		}
		Bot.send(cmds, 2000);
	},

	leave: function (arg, by, room, cmd) {
		if (!this.isRanked(Tools.getGroup('admin'))) return false;
		if (!arg) {
			if (this.roomType !== 'pm') this.reply('/leave');
			return;
		}
		arg = arg.split(',');
		var cmds = [];
		for (var i = 0; i < arg.length; i++) {
			cmds.push(toId(arg[i]) + '|/leave');
		}
		Bot.send(cmds, 2000);
	},

	joinallrooms: 'joinall',
	joinrooms: 'joinall',
	joinall: function (arg, by, room, cmd) {
		if (!this.isRanked(Tools.getGroup('admin'))) return false;
		var target = 'all';
		arg = toId(arg);
		if (arg.length || cmd === 'joinrooms') {
			if (arg === 'official') target = 'official';
			else if (arg === 'public') target = 'public';
			else if (arg === 'all') target = 'all';
			else return this.reply('Usage: ' + this.cmdToken + cmd + ' [official/public/all]');
		}
		Bot.on('queryresponse', function (data) {
			data = data.split('|');
			if (data[0] === 'rooms') {
				data.splice(0, 1);
				var str = data.join('|');
				var cmds = [];
				try {
					var rooms = JSON.parse(str);
					var offRooms = [], publicRooms = [];
					if (rooms.official) {
						for (var i = 0; i < rooms.official.length; i++) {
							if (rooms.official[i].title) offRooms.push(toId(rooms.official[i].title));
						}
					}
					if (rooms.chat) {
						for (var i = 0; i < rooms.chat.length; i++) {
							if (rooms.chat[i].title) publicRooms.push(toId(rooms.chat[i].title));
						}
					}
					if (target === 'all' || target === 'official') {
						for (var i = 0; i < offRooms.length; i++) cmds.push('|/join ' + offRooms[i]);
					}
					if (target === 'all' || target === 'public') {
						for (var i = 0; i < publicRooms.length; i++) cmds.push('|/join ' + publicRooms[i]);
					}
				} catch (e) {}
				Bot.send(cmds, 2000);
				Bot.on('queryresponse', function () {return;});
			}
		});
		Bot.send('|/cmd rooms');
	},

	lang: 'language',
	language: function (arg, by, room, cmd) {
		if (!this.isRanked(Tools.getGroup('roomowner'))) return false;
		if (this.roomType !== 'chat') return this.reply(this.trad('notchat'));
		var lang = toId(arg);
		if (!lang.length) return this.reply(this.trad('nolang'));
		if (!Tools.translations[lang]) return this.reply(this.trad('v') + ': ' + Object.keys(Tools.translations).join(', '));
		if (!Settings.settings['language']) Settings.settings['language'] = {};
		Settings.settings['language'][room] = lang;
		Settings.save();
		this.reply(this.trad('l'));
	},

	settings: 'set',
	set: function (arg, by, room, cmd) {
		if (!this.isRanked(Tools.getGroup('roomowner'))) return false;
		if (this.roomType !== 'chat') return this.reply(this.trad('notchat'));
		var args = arg.split(",");
		if (args.length < 2) return this.reply(this.trad('u1') + ": " + this.cmdToken + cmd + " " + this.trad('u2'));
		var perm = toId(args[0]);
		var rank = args[1].trim();
		if (!(perm in Settings.permissions)) {
			return this.reply(this.trad('ps') + ": " + Object.keys(Settings.permissions).sort().join(", "));
		}
		if (rank in {'off': 1, 'disable': 1}) {
			if (!this.canSet(perm, true)) return this.reply(this.trad('denied'));
			setPermission(room, perm, true);
			return this.reply(this.trad('p') + " **" + perm + "** " + this.trad('d'));
		}
		if (rank in {'on': 1, 'all': 1, 'enable': 1}) {
			if (!this.canSet(perm, ' ')) return this.reply(this.trad('denied'));
			setPermission(room, perm, ' ');
			return this.reply(this.trad('p') + " **" + perm + "** " + this.trad('a'));
		}
		if (Config.ranks.indexOf(rank) >= 0) {
			if (!this.canSet(perm, rank)) return this.reply(this.trad('denied'));
			setPermission(room, perm, rank);
			return this.reply(this.trad('p') + " **" + perm + "** " + this.trad('r') + ' ' + rank + " " + this.trad('r2'));
		} else {
			return this.reply(this.trad('not1') + " " + rank + " " + this.trad('not2'));
		}
	},

	battlepermissions: 'battleset',
	battlesettings: 'battleset',
	battleset: function (arg, by, room, cmd) {
		if (!this.isRanked(Tools.getGroup('admin'))) return false;
		var setPermission = function (room, perm, rank) {
			if (!Settings.settings.commands) Settings.settings.commands = {};
			if (!Settings.settings.commands[room]) Settings.settings.commands[room] = {};
			Settings.settings.commands[room][perm] = rank;
			Settings.save();
		};
		var args = arg.split(",");
		if (args.length < 2) return this.reply(this.trad('u1') + ": " + this.cmdToken + cmd + " " + this.trad('u2'));
		var perm = toId(args[0]);
		var rank = args[1].trim();
		if (!(perm in Settings.permissions)) {
			return this.reply(this.trad('ps') + ": " + Object.keys(Settings.permissions).sort().join(", "));
		}
		if (rank in {'off': 1, 'disable': 1}) {
			setPermission('battle-', perm, true);
			return this.reply(this.trad('p') + " **" + perm + "** " + this.trad('d'));
		}
		if (rank in {'on': 1, 'all': 1, 'enable': 1}) {
			setPermission('battle-', perm, ' ');
			return this.reply(this.trad('p') + " **" + perm + "** " + this.trad('a'));
		}
		if (Config.ranks.indexOf(rank) >= 0) {
			setPermission('battle-', perm, rank);
			return this.reply(this.trad('p') + " **" + perm + "** " + this.trad('r') + ' ' + rank + " " + this.trad('r2'));
		} else {
			return this.reply(this.trad('not1') + " " + rank + " " + this.trad('not2'));
		}
	}
};
