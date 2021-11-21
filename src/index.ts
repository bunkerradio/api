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
const Lyrics = require(path.join(__dirname, "./inc/lyrics"));

const lookup = new Lookup({
	clientId: config.spotify_client_id,
	clientSecret: config.spotify_client_secret,
	redirectUri: config.spotify_redirect
});
const lyrics = new Lyrics();

const server = fastify();

server.addHook('onResponse', (req, res, done) => {
    let stats = JSON.parse(<any>fs.readFileSync(path.join(__dirname, "../stats.json")));
    stats.requests++;
    fs.writeFileSync(path.join(__dirname, "../stats.json"), JSON.stringify(stats));
    done()
})

server.get('/api', (req, res) => {
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

	let stats = JSON.parse(fs.readFileSync(path.join(__dirname, "../stats.json")));

	stats.uptime = uptimeHours+':'+uptimeMinutes+':'+uptimeSeconds;
	stats.cached_tracks = fs.readdirSync(path.join(__dirname, "../cache/data")).length

	res.send({
		version: config.version,
		wiki: "https://github.com/bunkerradio/api/wiki",
		stats
	})
})

server.get('/api/treble/stats', async (request, reply) => {
	reply.header("Access-Control-Allow-Origin", "*");
	const { data } = await axios.get<Stats>(config.azura_api_url ?? "https://radio.bunker.dance/connect");

	let fields = <any>data.now_playing.song.custom_fields;
	let spotifyTrack:any;
	if (fields.isrc) {
		spotifyTrack = await lookup.search(`isrc:${fields.isrc}`)
	} else {
		spotifyTrack = await lookup.search(`track:${data.now_playing.song.title} artist:${data.now_playing.song.artist}`);
	}

	let track:any;
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
	let search = req.query.search;

	if (!search) {
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
	let spotifyTrack = await lookup.search(search);

	//check if spotify is there
	if (!spotifyTrack) {
		//quality enhance
		search = search.replace(",", ", ");
		search = search.replace("/", ", ");

		//try it again
		spotifyTrack = await lookup.search(search);

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