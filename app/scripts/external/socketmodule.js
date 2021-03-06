
angular.module('socketio', []).
    factory('socket', function ($rootScope) {
        var socket = io.connect('', {

            'reconnect': true,
            'reconnection delay': 500,
            'reopen delay': 3000,
            'max reconnection attempts': 10,
            'sync disconnect on unload': true
        });
        return {
            connect: function () {
                if(socket.socket.connected){

                }else{
                    io.connect('', {

                        'reconnect': true,
                        'reconnection delay': 500,
                        'reopen delay': 3000,
                        'max reconnection attempts': 10,
                        'sync disconnect on unload': true
                    });
                }



            },
            reconnect: function () {
                socket.socket.reconnect();
            },
            on: function (eventName, callback) {
                socket.on(eventName, function () {
                    var args = arguments;
                    $rootScope.$apply(function () {
                        callback.apply(socket, args);
                    });
                });
            },
            emit: function (eventName, data, callback) {
                socket.emit(eventName, data, function () {
                    var args = arguments;
                    $rootScope.$apply(function () {
                        if (callback) {
                            callback.apply(socket, args);
                        }
                    });
                });
            },
            removeListener: function (eventName, data) {
                console.log("removing listener" + eventName);
                socket.removeListener(eventName, data);
            },
            removeAllListeners: function (eventName) {
                socket.removeAllListeners(eventName);
            },
            disconnect: function () {
                socket.disconnect();
            }
        }
    });
