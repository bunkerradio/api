const fs = require('fs');
const path = require('path');
if (!fs.existsSync(path.join(__dirname, "../spotify.json"))) {
	console.log("Please run npm run-script authorize");
	process.exit();
}
import fastify from 'fastify';
import axios from 'axios';
import { Stats } from './types/stats';
const config = require(path.join(__dirname, "../config.json"));
config.started = new Date();
const Lookup = require(path.join(__dirname, "./inc/lookup"));

const lookup = new Lookup({
	clientId: config.spotify_client_id,
	clientSecret: config.spotify_client_secret,
	redirectUri: config.spotify_redirect
});

const server = fastify();

server.get('/', (req, res) => {
	let endTime = <any>new Date();
  	var timeDiff = endTime - config.started; //in ms
  	// strip the ms
  	timeDiff /= 1000;

	var sec_num = Math.round(timeDiff) // don't forget the second param
	var hours   = Math.floor(sec_num / 3600);
	var minutes = Math.floor((sec_num - (hours * 3600)) / 60);
	var seconds = sec_num - (hours * 3600) - (minutes * 60);
	var uptimeHours = hours.toString(), uptimeMinutes = minutes.toString(), uptimeSeconds = seconds.toString();

	if (hours   < 10) {uptimeHours   = "0"+hours;}
	if (minutes < 10) {uptimeMinutes = "0"+minutes;}
	if (seconds < 10) {uptimeSeconds = "0"+seconds;}

  	// get seconds 
	res.send({
		version: config.version,
		uptime: uptimeHours+':'+uptimeMinutes+':'+uptimeSeconds,
		wiki: "https://github.com/bunkerradio/api/wiki"
	})
})

server.get('/api/treble/stats', async (request, reply) => {
	reply.header("Access-Control-Allow-Origin", "*");
	const { data } = await axios.get<Stats>(config.azura_api_url ?? "https://radio.bunker.dance/connect");

	let spotifyTrack = await lookup.search(data.now_playing.song.title, data.now_playing.song.artist);
	let track;
	if (spotifyTrack) {
		track = await lookup.getTrack(spotifyTrack);
	} else {
		track = {
			title: data.now_playing.song.title,
			artist: data.now_playing.song.artist,
			album: data.now_playing.song.album
		}
	}
	reply.send({
		success: true,
		song: track,
		on_air: {
			live: data.live.streamer_name || 'AutoDJ',
		},
		listeners: {
			total: data.listeners.total,
			current: data.listeners.current,
			unique: data.listeners.unique,
		},
		important: {
			notice:
				"This API is for bunker.dance, if you'd like to use this for your own station, please include this notice and the source.",
			source: 'https://github.com/bunkerradio/api',
		},
	});
});

server.get("/api/treble/lookup", async (req: any, res) => {
	res.header("Access-Control-Allow-Origin", "*");
	if (!req.query.search) {
		res.send({
			success: false,
			error: {
				code: 404,
				description: "Not Found"
			}
		})
		return;
	}
	//get spotify track list
	let spotifyTrack = await lookup.search(req.query.search);

	//check if spotify is there
	if (!spotifyTrack) {
		res.send({
			success: false,
			error: {
				code: 404,
				description: "Not Found"
			}
		})
		return;
	}

	let track = await lookup.getTrack(spotifyTrack);
	res.send({
		success: true,
		result: track
	});
})

server.listen(config.http_port ?? 5050, err => {
	if (err) {
		console.log('🛑 An Error has occurred!' + err);
		process.exit(1);
	}

	console.log(`🚀 Server launched on port ${config.http_port ?? 5050}!`);
});