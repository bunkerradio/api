import fastify from 'fastify';
import axios from 'axios';

const server = fastify();

server.get('/stats', async (request, reply) => {
	axios.get('https://derrick.xonosho.st/api/nowplaying/23').then(resp => {
		let apiResponse = resp.data;
		reply.send({
			song_text: `${apiResponse.now_playing.song.text}`,
			artist: `${apiResponse.now_playing.song.artist}`,
			title: `${apiResponse.now_playing.song.title}`,
			id: `${apiResponse.now_playing.song.id}`,
			listeners: `${apiResponse.listeners.total}`,
		});
	});
});

server.listen(process.env.PORT ?? 5050, err => {
	if (err) {
		console.log('🛑 An Error has occurred!' + err);
		process.exit(1);
		return;
	}

	console.log('🚀 Server launched on port 5050!');
});
