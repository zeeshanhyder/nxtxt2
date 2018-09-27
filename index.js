let _dgram = require('dgram');
let ip = require('ip');




function getIPAddress(){
    return ip.address();
}

function getDomainAddress(address) {
    let domain = [];
    domain = address.split(".");
    domain.pop();
    domain = domain.join("."); 
    return domain; //return it back
}

function getBroadcastAddress(){
    return `239.255.42.99`;
}


/*
 *
 *  The constants below are signals that are exchanged by a node when registering on the network,
 *  for the discovery of an already active messaging server (websockets) to connect with
 */ 

 // This signalling message tests for active server
 const BROADCAST_MESSAGE_REQUEST_MSG_SERVER = "0";
 // This is an acknowledgement sent by the server, if present
 const BROADCAST_MESSAGE_ACK_MSG_SERVER = "1";


 // broadcast sender port
 const BCST_PORT = 7080;
 

 // Websockets Server Flag to denote we are running websockets server
 let WS_SERVER_FLAG = true;

 // our host address on network
 let HOST_ADDR = getIPAddress();
 // broadcast address on the network
 const BCST_ADDR = getBroadcastAddress();




 class Broadcaster {
     constructor(ip, broadcast_address, port){
        this.ip = ip;
        this.broadcast_address = broadcast_address;
        this.port = port;
        this.broadcaster = null;

        this.init();
     }

     init(){
         this.broadcaster = _dgram.createSocket({type: "udp4"});
         this.broadcaster.bind(this.port, ()=>{
            this.broadcaster.addMembership(this.broadcast_address);
         });
         this.broadcaster.on("listening", this.listenerFn.bind(this));
         this.broadcaster.on("message", this.on_message_receive.bind(this));

     }

     listenerFn(){
        
        console.log(`* Multicast Server listening on: ${this.ip}:${this.port}`);
        console.log(`* Running server discovery`);
        // Prepare discovery message
        let messageBuffer = Buffer.from(JSON.stringify({origin: this.ip, body: BROADCAST_MESSAGE_REQUEST_MSG_SERVER}) );
        this.send_message(messageBuffer);
     }


     send_message(message){
         this.broadcaster.send(message, 0, message.length, this.port, this.broadcast_address, ()=>{
             console.info("* Sending message")
         });
     }

     on_message_receive(messageBuffer, rinfo){
        let message = JSON.parse(messageBuffer.toString());
        if(message.origin === this.ip){
            return;
        }
        
        switch(message.body){
            // If someone is requesting information about Messaging server
            case BROADCAST_MESSAGE_REQUEST_MSG_SERVER:
                // If we are indeed messaging server
                if(WS_SERVER_FLAG){
                    // Send acknowledgement. Yes this is messaging server.
                    let response = Buffer.from( JSON.stringify({origin: this.ip, body: BROADCAST_MESSAGE_ACK_MSG_SERVER}) );
                    this.broadcaster.send(response,0,response.length, this.port, this.broadcast_address);
                }
                break;
            case BROADCAST_MESSAGE_ACK_MSG_SERVER:
                console.log(`    -> Websockets Server discovered at: ${message.origin}`);
                console.log(`    -> Closing local Messaging Server.`);
                WS_SERVER_FLAG = false;
                //server.close();
                break;
            default:
                console.log("Broadcast Receiver received unrecognized message!");
                break;
        }
     }
 }

let broadcast = new Broadcaster(HOST_ADDR, BCST_ADDR, BCST_PORT);

if(broadcast){
    console.log("Broadcaster initialised!");
}