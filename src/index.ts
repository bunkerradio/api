import fastify from 'fastify';
import axios from 'axios';
var spotifyData = require('./spotify.json');
var SpotifyWebApi = require('spotify-web-api-node');
var ColorThief = require('color-thief');
require('dotenv').config();
const colorThief = new ColorThief();
let fs = require('fs');
import { LookupSong, Stats } from './types/stats';
const server = fastify();
const spotify = new SpotifyWebApi({
	clientId: '3e8f034a711e4cd28e6632b6dce9fe14',
	clientSecret: 'b11709c4e17c4513aef46e20d116ff7f',
	redirectUri: 'http://localhost:5050/api/spotifyAuth'
});

if (spotifyData.refresh) {
	spotify.setRefreshToken(spotifyData.refresh);
	refresh();
} else {
	spotify.authorizationCodeGrant(spotifyData.code).then(
		function(data: any) {
		  	let config = JSON.parse(fs.readFileSync("./spotify.json"));
		  	config.refresh = data.body['refresh_token'];
		  	config.token = data.body['access_token'];
		  	fs.writeFileSync("./spotify.json", JSON.stringify(config));

			console.log("Token generated");
			
		  	// Set the access token on the API object to use it in later calls
		  	spotify.setAccessToken(data.body['access_token']);
		  	spotify.setRefreshToken(data.body['refresh_token']);
		},
		function(err: any) {
		  	console.log('Something went wrong!', err);
		}
	);
}

setInterval(refresh, .95 * 1000 * 3600);

function refresh() {
	spotify.refreshAccessToken().then(
		function(data: any) {
		  console.log('Token refreshed');
	  
		  // Save the access token so that it's used in future calls
		  spotify.setAccessToken(data.body['access_token']);
		},
		function(err: any) {
		  console.log('Could not refresh access token', err);
		}
	);
}

server.get('/api/treble/stats', async (request, reply) => {
	const { data } = await axios.get<Stats>(process.env.azura_api_url ?? "https://radio.bunker.dance/connect");
	reply.send({
		success: 'true',
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

server.get("/api/treble/lookup/:artist/:track", async (req: any, res) => {
	//get spotify track list
	let spotifyTracks = await spotify.searchTracks(`track:${req.params.track} artist:${req.params.artist}`, {limit: 1})
	.catch((err: any) => {
		console.log(err);
	})
	let spotifyTrack = spotifyTracks.body.tracks.items[0];

	//check for cache
	if (fs.existsSync(`./cache/data/${spotifyTrack.external_ids.isrc}.json`)) {
		res.type("json");
		res.send(fs.readFileSync(`./cache/data/${spotifyTrack.external_ids.isrc}.json`));
		return;
	}

	//get deezer since no cache
	let deezerTracks = await axios.get(`https://api.deezer.com/2.0/track/isrc:${spotifyTrack.external_ids.isrc}&limit=1`);
	let deezerTrack = deezerTracks.data;
	
	//check if both of them are there
	if (!deezerTrack || !spotifyTrack) {
		res.send({
			error: {
				code: 404,
				description: "Not Found"
			}
		})
		return;
	}

	//download image for color check
	let image = await axios({url: deezerTrack.album.cover_small, responseType: "stream"});
	let writer = fs.createWriteStream(`./cache/art/${spotifyTrack.external_ids.isrc}.png`);
	await image.data.pipe(writer);

	writer.on("finish", () => {
		let color = colorThief.getColor(`./cache/art/${spotifyTrack.external_ids.isrc}.png`, 1);
		//check for problems
		let problems:any = [];
		if (deezerTrack.explicit_lyrics && spotifyTrack.explicit) {
			problems.push({
				code: "explicit_lyrics",
				description: "This track has explicit lyrics."
			})
		}
	
		if (deezerTrack.explicit_content_cover == 2) {
			problems.push({
				code: "explicit_cover",
				description: "This track has an explicit cover."
			})
		}
	
		if (!deezerTrack) {
			problems.push({
				code: "deezer_not_found",
				description: "The API was not able to find a result from Deezer."
			})
		}
	
		if (!spotifyTrack) {
			problems.push({
				code: "spotify_not_found",
				description: "The API was not able to find a result from Spotify."
			})
		}
	
		//combine artist names
		let artists = "";
		spotifyTrack.artists.forEach((item:any) => {
			artists += `${item.name}, `;
		})
		artists = artists.substring(0, artists.length - 2);
		
		//make response
		var response = {
			success: true,
			result: {
				title: spotifyTrack.name,
				artist: artists,
				album: {
					title: spotifyTrack.album.title,
					spotify_id: spotifyTrack.album.id,
					deezer_id: deezerTrack.album.id
				},
				color: color,
				covers: {
					extra: deezerTrack.album.cover_xl,
					large: deezerTrack.album.cover_big,
					medium: deezerTrack.album.cover_medium,
					small: deezerTrack.album.cover_small,
				},
				duration: spotifyTrack.duration_ms,
				explicit: spotifyTrack.explicit,
				preview: spotifyTrack.preview_url || deezerTrack.preview,
				spotify_id: spotifyTrack.id,
				deezer_id: deezerTrack.id,
				isrc: spotifyTrack.external_ids.isrc,
				release_date: spotifyTrack.album.release_date,
				accuracy: 0,
				problems,
				powered_by: {
					website: "https://bunker.dance",
					copyright: "Copyright 2021-Present Bunker | Source: https://github.com/bunkerradio/api",
				},
				version: "1.0.0",
				cache: new Date().getTime()
			}
		}
		
		//save and serve response
		fs.writeFileSync(`./cache/data/${spotifyTrack.external_ids.isrc}.json`, JSON.stringify(response));
		res.send(response)
	})
})

server.listen(process.env.http_port ?? 5050, err => {
	if (err) {
		console.log('🛑 An Error has occurred!' + err);
		process.exit(1);
	}

	console.log(`🚀 Server launched on port ${process.env.http_port ?? 5050}!`);
});
