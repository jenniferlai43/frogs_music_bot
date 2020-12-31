/********************
* SETUP
********************/require('dotenv').config();
const Discord = require('discord.js');
const bot = new Discord.Client();
const TOKEN = process.env.TOKEN;

/********************
* HELPERS
********************/
async function invalidCmd(msg) {
	return msg.channel.send(
		'Please enter a vaid frog command.'
	);
}

/********************
* FROG COMMANDS
********************/

/*
*	Search for and play given song name
*	arg: song to search for
*/
async function play(arg, msg) {
	return msg.channel.send(
		'Playing song.'
	);
}

async function queue(arg, msg) {
	return msg.channel.send(
		'Viewing queue.'
	);
}

async function skip(msg) {
	return msg.channel.send(
		'Skipping song.'
	);
}

async function volume(arg, msg) {
	return msg.channel.send(
		'Adjusting volume.'
	);
}

async function spotify(arg, msg) {
	// convert spotify playlist to youtube
	invalidCmd(msg);
}


async function parseCommand(msg) {
	if (msg.author.bot || !msg.content.startsWith('-f')) return;

	cmd = msg.content
	if (cmd.startsWith('-fplay')) {
		play(cmd.substr(7), msg)
	} else if (cmd.startsWith('-fqueue')) {
		queue(cmd.substr(8), msg)
	} else if (cmd.startsWith('-fskip')) {
		skip(msg)
	} else if (cmd.startsWith('-fvolume ')) {
		volume(cmd.substr(9), msg)
	} else if (cmd.startsWith('-fspotify ')) {
		spotify(cmd.substr(10), msg)
	} else {
		invalidCmd(msg)
	}
}

/********************
* Bot listeners
********************/
bot.login(TOKEN);

bot.on('ready', () => {
	console.info(`Logged in as ${bot.user.tag}`);
});

bot.on('message', async message => {
	parseCommand(message)
});