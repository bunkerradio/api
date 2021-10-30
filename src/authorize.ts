var SpotifyWebApi = require('spotify-web-api-node');
require('dotenv').config();
import fastify from 'fastify';
import fs from 'fs';

const server = fastify();

const spotify = new SpotifyWebApi({
	clientId: process.env.spotify_client_id,
	clientSecret: process.env.spotify_client_secret,
	redirectUri: process.env.redirect
});

var authorizeURL = spotify.createAuthorizeURL(['user-read-email'], 'bunker');
console.log(`Please login with your spotify account here: ${authorizeURL}`);

server.get('/api/spotifyAuth', async (req: any, res) => {
    fs.writeFileSync("./spotify.json", JSON.stringify({code: req.query.code}));
    res.send("Successfully Authenticated, you may now yarn start");
    console.log("Successfully Authenticated, you may now yarn start");
    process.exit();
})

server.listen(process.env.http_port ?? 5050);