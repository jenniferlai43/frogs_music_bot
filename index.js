/********************
* SETUP
********************/require('dotenv').config();
const Discord = require('discord.js');
const bot = new Discord.Client();
const TOKEN = process.env.TOKEN;
const ytdl = require('ytdl-core');
const yts = require('yt-search');

// Map of guild ID -> queue & metadata for that server's bot
const serverMap = new Map();

/********************
* HELPERS
********************/
async function sendInvalidCmdMsg(msg) {
	return msg.channel.send(
		'Please enter a valid frog command.'
	);
}

function isEmptyArg(arg) {
	return (arg.length === 0);
}

function isValidVolume(arg) {
	if (isNaN(parseInt(arg)) || arg.indexOf('.') !== -1) return false;
	let parsedInt = parseInt(arg);
	return (parsedInt >= 0 && parsedInt <= 100)
}

async function disconnect(serverBot, guild) {
	serverBot.textChannel.send('Frog Music Bot disconnecting! ~Bye~');
	serverBot.voiceChannel.leave();
	serverBot.dispatcher.end();
	serverMap.delete(guild.id);
}

async function getVideoUrl(songReq, msg) {
	console.log(`validating ${songReq}`)
	if (ytdl.validateURL(songReq)) {
		// songReq is a valid Url
		console.log('valid URL!');
		return songReq;
	}

	try {
		const {videos} = await yts(songReq);
		if (!videos.length) {
			console.log('invalid URL!');
			return msg.channel.send(`Could not find song for '${songReq}'`);
		} else {
			console.log('found a video');
			return videos[0].url;
		}
	} catch (err) {
		console.log(err);
	}
}

async function play(song, serverBot, guild) {
	if (!song) {
		if (serverBot && guild) {
			disconnect(serverBot, guild);
		}
		return;
	}

	const dispatcher = serverBot.connection
		.play(ytdl(song.url))
		.on('finish', () => {
			serverBot.songQueue.shift()
			play(serverBot.songQueue[0],guild);
		})
		.on('error', error => {
			console.error(error);
		});
	serverBot.dispatcher = dispatcher;
	dispatcher.setVolumeLogarithmic(serverBot.volume / 100);
	console.log(`Started playing: **${song.title}**`);
	serverBot.textChannel.send(`Started playing: **${song.title}**`);
}

/********************
* FROG COMMANDS
********************/

/*
*	Search for and play given song name
*	arg: song to search for
*/
async function addPlay(arg, msg, serverBot) {
	const songReq = arg;

	const voiceChannel = msg.member.voice.channel;
	if (!voiceChannel) {
		return msg.channel.send(
			'You must be in a voice channel to play music.'
		);
	}
	if (isEmptyArg(arg)) {
		return msg.channel.send(
			'Please enter valid song name.'
		);
	}

	songUrl = await getVideoUrl(songReq, msg)
	console.log(`Song URL: ${songUrl}`)
	const songMetadata = await ytdl.getInfo(songUrl)
	const song = {
		title: songMetadata.videoDetails.title,
		url: songMetadata.videoDetails.video_url,
	};

	if (!serverBot) {
		serverBot = {
			textChannel: msg.channel,
			voiceChannel: voiceChannel,
			connection: null,
			dispatcher: null,
			songQueue: [],
			volume: 10,
			playing: true,
		};

		serverMap.set(msg.guild.id, serverBot);

		serverBot.songQueue.push(song);

		try {
			var connection = await voiceChannel.join();
			serverBot.connection = connection;
			play(song, serverBot, msg.guild);
		} catch (err) {
			console.log(err);
			serverBot.delete(msg.guild.id);
			return msg.channel.send(err);
		}
	} else {
		serverBot.songQueue.push(song);
	}
}

async function stop(arg, msg, serverBot) {
	if (!msg.member.voice.channel)
    	return msg.channel.send(
	      "You have to be in a voice channel to stop the music!"
	    );
    
	if (!serverBot)
	    return msg.channel.send("There is no song that I could stop!");
	   
	disconnect(serverBot, msg.guild);
}


async function queue(arg, msg, queue) {
	return msg.channel.send(
		'Viewing queue.'
	);
}

async function skip(msg, queue) {
	return msg.channel.send(
		'Skipping song.'
	);
}

async function volume(arg, msg, serverBot) {
	if (isEmptyArg(arg) || !isValidVolume(arg)) {
		return msg.channel.send(
			'Please enter valid integer between 0 and 100 for volume.'
		);
	}
	const newVolume = parseInt(arg) / 100;
	serverBot.dispatcher.setVolumeLogarithmic(newVolume);
	return msg.channel.send(
		`Adjusting volume to ${arg}%.`
	);
}

async function spotify(arg, msg, queue) {
	// convert spotify playlist to youtube
	sendInvalidCmdMsg(msg);
}


async function parseCommand(msg) {
	if (msg.author.bot || !msg.content.startsWith('-f')) return;

	cmd = msg.content
	const serverBot = serverMap.get(msg.guild.id);
	if (cmd.startsWith('-fplay')) {
		addPlay(cmd.substr(7), msg, serverBot)
	} else if (cmd.startsWith('-fstop')) {
		stop(cmd.substr(7), msg, serverBot)
	} else if (cmd.startsWith('-fqueue')) {
		queue(cmd.substr(8), msg, serverBot)
	} else if (cmd.startsWith('-fskip')) {
		skip(msg)
	} else if (cmd.startsWith('-fvolume ')) {
		volume(cmd.substr(9), msg, serverBot)
	} else if (cmd.startsWith('-fspotify ')) {
		spotify(cmd.substr(10), msg, serverBot)
	} else {
		sendInvalidCmdMsg(msg)
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