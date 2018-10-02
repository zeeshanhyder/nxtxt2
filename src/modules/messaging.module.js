/*
 * 
 * nxtxt websockets server
 * 
 */

let WS = require('ws');
let MessageTypes = require('../defines/message_types');


class Node {
    constructor(prev, data, next){
        this.prev = prev;
        this.data = data;
        this.next = next;
    }
}

class NodeList {
    constructor(){
        this.head = null;

    }
    addFirst(data){
        this.head = new Node(null, data, null);
    }
    
    insertAfter(key, data){
        let head = this.head;
        let node;
        while(head.data.id !== key && head.next !== null){
            head = head.next;
        }
        if(head.next !== null){
            node = new Node(head, data, head.next);
            head.next.prev = node;
            head.next = node;
        }
        
    }
    
    insertBefore(key, data){
        let head = this.head;
        let node;
        while(head.data.id !== key && head.next !== null){
            head = head.next;
        }
            
        node = new Node(head.prev, data, head);
        head.prev.next = node;
        head.prev = node;
        
        
    }

    deleteNode(key){
        let head = this.head;
        while(head.data.id !== key && head.next !== null){
            head = head.next;
        }
        if(head.next !== null){
            head.next.prev = head.prev;
            head.prev.next = head.next;
        }else{
            head.prev.next = null;
        }
        // head has no reference and will be deleted by GC
    }

    appendNode(data){
        if(this.head === null){
            this.addFirst(data);
        }else{
            let head = this.head;
            while(head.next !== null){
                head = head.next;
            }
            head.next = new Node(head, data, null);
        }

    }
}

module.exports = class MessagingServer {
     constructor(ip, port){
        this.ip = ip;
        this.port = port;
        this.clients = new NodeList()
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

     onMessageHandler(message, client){
         try{
            let data = JSON.parse(message);
         
            switch(data.type){
                case MessageTypes.WS_DATA_TEXT_MESSAGE:
                    if(!data.from){
                        let res = {
                            error: MessageTypes.ERR.WS_ERR_NO_ORIGIN,
                            message: MessageTypes.ERR_DESC.WS_ERR_NO_ORIGIN
                        }
                        client.send(JSON.stringify(res));
                    }
                    this.sendMessage(message, message.to, client);
                case MessageTypes.WS_META_CLIENT_ADD:
                    this.addClient(message.id, client);
                    break;
                default:
            }
        } catch(e){

         }
     
    }

     onConnectionHandler(ws){
         ws.on('message', message => { this.onMessageHandler(message, ws) });
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

     sendMessage(message, to, from){
         message.from = from;
         this.clients[to].send(message);
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

     sendMessage(message, to, from){
        this.client.send('Hello World!');
     }


 }
