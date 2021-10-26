import fastify from 'fastify';

const server = fastify();

server.get('/ping', async (request, reply) => {
	return console.log('Recieved request for /ping'), 'Pong!';
});

server.listen(process.env.PORT ?? 5050, err => {
	if (err) {
		console.log('🛑 An Error has occurred!' + err);
		process.exit(1);
		return;
	}

	console.log('🚀 Server launched on port 5050!');
});
