import Vue from "nativescript-vue";
import Home from "./components/Home";

Vue.registerElement('MapView', () => require('nativescript-google-maps-sdk').MapView);
new Vue({

    template: `
        <Frame>
            <Home />
        </Frame>`,

    components: {
        Home
    }
}).$start();
