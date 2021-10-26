import fastify from 'fastify';
import axios from 'axios';
import {Stats} from './types/stats';

const server = fastify();

server.get('/stats', async (request, reply) => {
	const {data} = await axios.get<Stats>('https://derrick.xonosho.st/api/nowplaying/23');

	reply.send({
		song_text: data.now_playing.song.text,
		artist: data.now_playing.song.artist,
		title: data.now_playing.song.title,
		id: data.now_playing.song.id,
		listeners: data.listeners.total,
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
