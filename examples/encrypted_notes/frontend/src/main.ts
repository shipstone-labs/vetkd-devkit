import "./app.css";
import App from "./App.svelte";

const init = async () => {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const app = new App({
        target: document.body,
    });
};

init();
