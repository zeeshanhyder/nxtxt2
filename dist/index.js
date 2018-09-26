'use strict';

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var _dgram = require('dgram');
var ip = require('ip');

function getIPAddress() {
    return ip.address();
}

function getDomainAddress(address) {
    var domain = [];
    domain = address.split(".");
    domain.pop();
    domain = domain.join(".");
    return domain; //return it back
}

function getBroadCastAddress(domain) {
    //return "233.255.255.255";
    return '239.255.42.99';
    //return `${domain}.255`;
}

/*
 *
 *  The constants below are signals that are exchanged by a node when registering on the network,
 *  for the discovery of an already active messaging server (websockets) to connect with
 */

// This signalling message tests for active server
var BROADCAST_MESSAGE_REQUEST_MSG_SERVER = "0";
// This is an acknowledgement sent by the server, if present
var BROADCAST_MESSAGE_ACK_MSG_SERVER = "1";

// broadcast sender port
var BCST_PORT = 7080;

// Websockets Server Flag to denote we are running websockets server
var WS_SERVER_FLAG = true;

// our host address on network
var HOST_ADDR = getIPAddress();
var DOMAIN_ADDR = getDomainAddress(HOST_ADDR);
// broadcast address on the network
var BCST_ADDR = getBroadCastAddress(DOMAIN_ADDR);

var Broadcaster = function () {
    function Broadcaster(ip, broadcast_address, port) {
        _classCallCheck(this, Broadcaster);

        this.ip = ip;
        this.broadcast_address = broadcast_address;
        this.port = port;
        this.broadcaster = null;

        this.init();
    }

    _createClass(Broadcaster, [{
        key: 'init',
        value: function init() {
            this.broadcaster = _dgram.createSocket({ type: "udp4", reuseAddr: true });
            this.broadcaster.bind(this.port);
            this.broadcaster.on("listening", this.listenerFn.bind(this));
            this.broadcaster.on("message", this.on_message_receive.bind(this));
        }
    }, {
        key: 'listenerFn',
        value: function listenerFn() {
            this.broadcaster.addMembership(this.broadcast_address);
            console.log('* Multicast Server listening on: ' + this.ip + ':' + this.port);
            console.log('* Running server discovery');
            // Prepare discovery message
            var messageBuffer = Buffer.from(JSON.stringify({ origin: this.ip, body: BROADCAST_MESSAGE_REQUEST_MSG_SERVER }));
            this.send_message(messageBuffer);
        }
    }, {
        key: 'send_message',
        value: function send_message(message) {
            this.broadcaster.send(message, 0, message.length, this.port, this.broadcast_address, function () {
                console.info("* Sending message");
            });
        }
    }, {
        key: 'on_message_receive',
        value: function on_message_receive(messageBuffer, rinfo) {
            var message = JSON.parse(messageBuffer.toString());

            switch (message.body) {
                // If someone is requesting information about Messaging server
                case BROADCAST_MESSAGE_REQUEST_MSG_SERVER:
                    // If we are indeed messaging server
                    if (WS_SERVER_FLAG) {
                        // Send acknowledgement. Yes this is messaging server.
                        var response = Buffer.from(JSON.stringify({ origin: this.ip, body: BROADCAST_MESSAGE_ACK_MSG_SERVER }));
                        this.broadcaster.send(response, 0, response.length, this.port, this.broadcast_address);
                    }
                    break;
                case BROADCAST_MESSAGE_ACK_MSG_SERVER:
                    console.log('    -> Websockets Server discovered at: ' + message.origin);
                    console.log('    -> Closing local Messaging Server.');
                    WS_SERVER_FLAG = false;
                    //server.close();
                    break;
                default:
                    console.log("Broadcast Receiver received unrecognized message!");
                    break;
            }
        }
    }]);

    return Broadcaster;
}();

var broadcast = new Broadcaster(HOST_ADDR, BCST_ADDR, BCST_PORT);

if (broadcast) {
    console.log("Broadcaster initialised!");
}