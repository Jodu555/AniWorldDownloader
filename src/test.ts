require('dotenv').config();
import NewInterceptor from './NewInterceptor';
import RobotInterceptor from './RobotInterceptor';
const interceptor = new NewInterceptor();
const robotInterceptor = new RobotInterceptor();

main();

async function main() {
	// await interceptor.launch();

	// const url = await interceptor.intercept('')

	const url = await robotInterceptor.intercept('');
	console.log(url);

	// await interceptor.shutdown();
}
