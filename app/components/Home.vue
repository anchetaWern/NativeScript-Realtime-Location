<template>
    <Page actionBarHidden="true" backgroundSpanUnderStatusBar="false">

        <StackLayout height="100%" width="100%" >
            <MapView 
                :latitude="latitude" 
                :longitude="longitude" 
                :zoom="zoom" 
                height="85%" 
                @mapReady="onMapReady">
            </MapView>
            <Button text="Stop Sharing Location" @tap="stopSharingLocation" v-if="isSharingLocation"></Button>
            <Button text="Share Location" @tap="startSharingLocation" v-if="!isSharingLocation"></Button>
            
            <Button text="Stop Tracking Location" @tap="stopTrackingLocation" v-if="isTrackingLocation"></Button>
            <Button text="Track Location" @tap="startTrackingLocation" v-if="!isTrackingLocation"></Button>
        </StackLayout>
    </Page>
</template>

<script>
import * as geolocation from "nativescript-geolocation";
import * as dialogs from "tns-core-modules/ui/dialogs";

import { Position, Marker } from "nativescript-google-maps-sdk";
import { Accuracy } from "tns-core-modules/ui/enums";

import Pusher from "pusher-nativescript";

var randomString = require('random-string');

const PUSHER_APP_KEY = 'YOUR PUSHER APP KEY';
const PUSHER_APP_CLUSTER = 'YOUR PUSHER APP CLUSTER';
const SERVER_BASE_URL = 'YOUR NGROK HTTPS URL';

export default {
    data() {
        return {
            latitude: '',
            longitude: '',
            zoom: 17,
           
            mapView: null,
           
            marker: new Marker(),
            watchID: null,

            isSharingLocation: false,
            isTrackingLocation: false,

            ownID: null, 
            trackingID: null, 
            socket: null, 
            
            ownChannel: null,
            trackingChannel: null
        }
    },


    mounted() {
        this.ownID = randomString({length: 5});

        let that = this
        geolocation.isEnabled().then(function(isEnabled) {
            if (!isEnabled) {
                geolocation.enableLocationRequest(true, true).then(() => {
                    
                    geolocation
                        .getCurrentLocation({
                            timeout: 20000
                        })
                        .then(location => {
                            if (!location) { 
                                dialogs.alert('Failed to get location. Please restart the app.');
                            } else {
                                that.updateMap(location); 
                                that.mapView.addMarker(that.marker);
                            }
                        });

                }, (e) => {
                    console.log("error: " + (e.message || e));
                }).catch(ex => {
                    console.log("unable to enable location", ex);
                });
            } else {
                
                geolocation
                    .getCurrentLocation({
                        timeout: 20000
                    })
                    .then(location => {
                        if (!location) { 
                            dialogs.alert('Failed to get location. Please restart the app.');
                        } else {
                            that.updateMap(location); 
                            that.mapView.addMarker(that.marker);
                        }
                    });

            }
        }, function(e) {
            console.log("error: " + (e.message || e));
        });

        this.socket = new Pusher(PUSHER_APP_KEY, {
          cluster: PUSHER_APP_CLUSTER,
          authEndpoint: `${SERVER_BASE_URL}/pusher/auth`,
        });

       
        this.ownChannel = this.socket.subscribe(`private-${this.ownID}`);
        this.ownChannel.bind('pusher:subscription_error', () => {
            dialogs.alert("Failed to connect. Please restart the app.");
        });
        
    },

    methods: {
        startSharingLocation() {

            dialogs.alert(`Your unique ID is: ${this.ownID}`);

            this.isSharingLocation = true;

            this.watchID = geolocation.watchLocation(
                (loc) => {
                    if (loc) {
                        this.updateMap(loc);

                        this.ownChannel.trigger('client-location-changed', {
                            latitude: loc.latitude,
                            longitude: loc.longitude
                        });
                    }
                }, 
                (e) => {
                    dialogs.alert(e.message);
                }, 
                {
                    desiredAccuracy: Accuracy.high, 
                    updateDistance: 5, 
                    minimumUpdateTime : 5000 
                }
            );

        },

        stopSharingLocation() {
            this.isSharingLocation = false;
            geolocation.clearWatch(this.watchID);
        },

        updateMap(loc) {
           
            this.latitude = loc.latitude;
            this.longitude = loc.longitude;

            this.marker.position = Position.positionFromLatLng(
                loc.latitude,
                loc.longitude
            );
        },

        startTrackingLocation() {
            dialogs.prompt("Enter unique ID", "").then((r) => {
               
                this.trackingID = r.text;
                this.isTrackingLocation = true;

                this.trackingChannel = this.socket.subscribe(`private-${this.trackingID}`);
                this.trackingChannel.bind('pusher:subscription_succeeded', () => {
                    
                    this.trackingChannel.bind('client-location-changed', (loc) => {
                        this.updateMap(loc);
                    });

                });

            });
        },


        stopTrackingLocation() {
            this.socket.unsubscribe(`private-${this.trackingID}`);
            this.isTrackingLocation = false;
        },


        onMapReady(args) {
            this.mapView = args.object;
        }
    },

}
</script>

<style scoped>
</style>