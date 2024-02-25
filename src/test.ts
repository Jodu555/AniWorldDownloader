require('dotenv').config();
import NewInterceptor from "./NewInterceptor";
const interceptor = new NewInterceptor();


main();

async function main() {
    await interceptor.launch();

    const url = await interceptor.intercept('')

    console.log(url);


    await interceptor.shutdown();

}