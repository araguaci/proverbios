import { createApp } from 'vue';
import './style.css';
import App from './App.vue';
import VuePlyr from 'vue-plyr';
import 'vue-plyr/dist/vue-plyr.css';

const app = createApp(App);

// Use VuePlyr as a plugin
app.use(VuePlyr, {
  plyr: {},
});

app.mount('#app');
