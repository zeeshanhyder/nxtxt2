/*
 * 
 * nxtxt websockets server
 * 
 */

let WS = require('ws');
let MessageTypes = require('../defines/message_types');

module.exports = class MessagingServer {
     constructor(ip, port){
        this.ip = ip;
        this.port = port;
        this.clients = {}
        this.wsFlag = true;
     }

     init(){
        this.server = new WS.Server({
            port: this.port,
            perMessageDeflate: {
                zlibDeflateOptions: {
                    chunkSize: 1024,
                    memLevel: 7,
                    level: 3,
                },
                zlibDeflateOptions: {
                    chunkSize: 10*1024
                },
                clientNoContextTakeover: true,
                serverNoContextTakeover: true,
                clientMaxWindowBits: 10,
                serverMaxWindowBits: 10,
                concurrencyLimit: 10,
                threshold: 1024,
            }
        });

        this.server.on('connection', this.onConnectionHandler.bind(this));
     }

     onMessageHandler(message){
         try{
            let data = JSON.parse(message);
         
            switch(data.type){
                // parse here
            }
        } catch(e){

         }
     
    }

     onConnectionHandler(ws){
         ws.on('message', this.onMessageHandler.bind(this));
     }

     setWSFlag(value){
        this.wsFlag = value;
     }

     getWSFlag(){
        return this.wsFlag;
     }
     
     getClient(id){
         return this.clients[id];

     }

     getAllClients(){
         return this.clients;
     }

     addClient(id, client){
        this.clients[id] = client;
     }
 }



module.exports = class MessagingClient{
     
     constructor(ip,port){
        this.ip = ip;
        this.port = port;
     }

     init(){
         this.client = new WS(`ws://${this.ip}:${this.port}`);

         this.client.on('open', this.sendMessage.bind(this))
     }

     sendMessage(){
        this.client.send('Hello World!');
     }


 }
