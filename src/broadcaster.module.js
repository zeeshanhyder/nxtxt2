"use strict";


let _dgram = require('dgram');
let ip = require('ip');


// This signalling message tests for active server
const BROADCAST_MESSAGE_REQUEST_MSG_SERVER = "0";
// This is an acknowledgement sent by the server, if present
const BROADCAST_MESSAGE_ACK_MSG_SERVER = "1";

// Websockets Server Flag to denote we are running websockets server
let WS_SERVER_FLAG = true;



exports.getIPAddress = function(){
    return ip.address();
}

exports.getDomainAddress = function(address) {
    let domain = [];
    domain = address.split(".");
    domain.pop();
    domain = domain.join("."); 
    return domain; //return it back
}

exports.getBroadcastAddress = function(){
    return `239.0.0.1`;
}




 class Broadcaster {
     constructor(ip, broadcast_address, port){
        this.ip = ip;
        this.broadcast_address = broadcast_address;
        this.port = port;
        this.broadcaster = null;
     }

     init(){
         this.broadcaster = _dgram.createSocket({type: "udp4", reuseAddr: true});
         this.broadcaster.bind(this.port, this.broadcast_address,  ()=>{
            
         });
         this.broadcaster.on("listening", this.listenerFn.bind(this));
         this.broadcaster.on("message", this.on_message_receive.bind(this));

     }

     listenerFn(){
        this.broadcaster.addMembership(this.broadcast_address, this.ip);
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
                    
                     // the timeout is added to avoid any conflicts
                    setTimeout(()=>{
                        // Send acknowledgement. Yes this is messaging server.
                        let response = Buffer.from( JSON.stringify({origin: this.ip, body: BROADCAST_MESSAGE_ACK_MSG_SERVER}) );
                        this.broadcaster.send(response,0,response.length, this.port, this.broadcast_address);
                    },100);


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


 module.exports.Broadcaster = Broadcaster;