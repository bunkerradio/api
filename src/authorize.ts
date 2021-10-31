const SpotifyWebApi = require('spotify-web-api-node');
const path = require('path');
const config = require(path.join(__dirname, '../config.json'));
import fastify from 'fastify';
import fs from 'fs';

const server = fastify();

const spotify = new SpotifyWebApi({
	clientId: config.spotify_client_id,
	clientSecret: config.spotify_client_secret,
	redirectUri: config.spotify_redirect
});

var authorizeURL = spotify.createAuthorizeURL(['user-read-email'], 'bunker');
console.log(`Please login with your spotify account here: ${authorizeURL}`);

server.get('/api/spotifyAuth', async (req: any, res) => {
    fs.writeFileSync(path.join(__dirname, '../spotify.json'), JSON.stringify({code: req.query.code}));
    fs.mkdirSync(path.join(__dirname, '../cache/'));
    fs.mkdirSync(path.join(__dirname, '../cache/data/'));
    fs.mkdirSync(path.join(__dirname, '../cache/art/'));
    res.send("Successfully Authenticated, you may now npm start");
    console.log("Successfully Authenticated, you may now npm start");
    process.exit();
})

server.listen(config.http_port ?? 5050);