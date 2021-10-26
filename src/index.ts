import fastify from 'fastify';
import axios from 'axios';
import {Stats} from './types/stats';

const server = fastify();

server.get('/api/v1/stats', async (request, reply) => {
	const {data} = await axios.get<Stats>('https://derrick.xonosho.st/api/nowplaying/23');
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

server.listen(process.env.PORT ?? 5050, err => {
	if (err) {
		console.log('🛑 An Error has occurred!' + err);
		process.exit(1);
	}

	console.log('🚀 Server launched on port 5050!');
});
