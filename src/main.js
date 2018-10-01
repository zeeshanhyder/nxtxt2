"use strict";

let Broadcaster = require('./modules/broadcaster.module');
let Messaging = require('./modules/messaging.module');

/*
 *
 *  The constants below are signals that are exchanged by a node when registering on the network,
 *  for the discovery of an already active messaging server (websockets) to connect with
 */ 


 // broadcast sender port
 const BCST_PORT = 54000;
 // our host address on network
 let HOST_ADDR = Broadcaster.getIPAddress();
 // broadcast address on the network
 const BCST_ADDR = Broadcaster.getBroadcastAddress();


 // Lets create a new instance of Broadcaster
 let broadcast = new Broadcaster.Broadcaster(HOST_ADDR, BCST_ADDR, BCST_PORT);
 // Fire up the broadcast Service
 broadcast.init();

