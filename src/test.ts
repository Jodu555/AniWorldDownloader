require('dotenv').config();
import NewInterceptor from './NewInterceptor';
import RobotInterceptor from './RobotInterceptor';
const interceptor = new NewInterceptor();
const robotInterceptor = new RobotInterceptor();

main();

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

async function main() {
	await interceptor.launch();

	await sleep(5000);

	const url = await interceptor.intercept('https://aniworld.to/anime/stream/ascendance-of-a-bookworm/filme/film-3');

	// const url = await robotInterceptor.intercept('');


	console.log(url);
	await interceptor.shutdown();
}
