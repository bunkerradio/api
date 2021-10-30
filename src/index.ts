const fs = require('fs');
if (!fs.existsSync("../spotify.json")) {
	console.log("Please run yarn authorize");
	process.exit();
}
import fastify from 'fastify';
import axios from 'axios';
import { Stats } from './types/stats';
const config = require('../config.json');
const Lookup = require('./inc/lookup');

const lookup = new Lookup({
	clientId: config.spotify_client_id,
	clientSecret: config.spotify_client_secret,
	redirectUri: config.spotify_redirect
});

const server = fastify();

server.get('/api/treble/stats', async (request, reply) => {
	const { data } = await axios.get<Stats>(config.azura_api_url ?? "https://radio.bunker.dance/connect");
	reply.send({
		success: true,
		song: {
			title: data.now_playing.song.title,
			artist: data.now_playing.song.artist,
			album: data.now_playing.song.artist,
		},
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
	//get spotify track list
	let spotifyTracks = await lookup.spotify.searchTracks(`track:${req.query.track} artist:${req.query.artist}`, {limit: 1})
	let spotifyTrack = spotifyTracks.body.tracks.items[0];

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

	//check for cache
	if (lookup.getCachedTrack(spotifyTrack.external_ids.isrc)) {
		res.type("json");
		res.send({
			success: true,
			accuracy: lookup.similarity(spotifyTrack.name, req.query.track),
			result: lookup.getCachedTrack(spotifyTrack.external_ids.isrc)
		});
		return;
	}

	lookup.cacheTrack(spotifyTrack).then((track:any) => {
		res.send({
			success: true,
			accuracy: lookup.similarity(spotifyTrack.name, req.query.track),
			result: track
		});
	})
})

server.listen(config.http_port ?? 5050, err => {
	if (err) {
		console.log('🛑 An Error has occurred!' + err);
		process.exit(1);
	}

	console.log(`🚀 Server launched on port ${config.http_port ?? 5050}!`);
});
