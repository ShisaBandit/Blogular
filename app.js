Object.clone = function (obj) {
    return Object.create(Object.getPrototypeOf(obj), Object.getOwnPropertyNames(obj).reduce(function (memo, name) {
        return (memo[name] = Object.getOwnPropertyDescriptor(obj, name)) && memo;
    }, {}));
}


//noinspection JSUnresolvedVariable

var express = require('express')
    , http = require('http')
//routes
    , blogRoutes = require('./routes/blog')
    , authRoutes = require('./routes/auth')
    , commentRoutes = require('./routes/comments')
    , fileHandlerRoutes = require('./routes/fileHandler')
    , messageRoutes = require('./routes/messageRoutes')
    , apiv2 = require('./routes/apiv2')
    , path = require('path')
    , fs = require('fs')
    , cookie = require('cookie')
    , passportSocketIo = require("passport.socketio")
    , MemoryStore = express.session.MemoryStore
    , sessionStore = new MemoryStore()
    , q = require('q')
    , MongoStore = require('connect-mongo')(express)
    , expressValidator = require('express-validator')
//models
    , blogModels = require('./models/models')
    , passport = require('./auth/local').passport_local
    , Constants = require('./constants/constants.js');

console.log(expressValidator)
global.__approot = __dirname;
//set up database models to mongoose
var Blog = blogModels.Blog;
var User = blogModels.User;
var Update = blogModels.Update;

var app = express();
app.use(expressValidator());
//noinspection JSValidateTypes
app.configure('production', function () {
    app.use(express.compress());

    //noinspection JSUnresolvedVariable,JSValidateTypes,MagicNumberJS
    app.set('port', process.env.PORT || 80);
    app.set('ip', '173.247.247.179');

    //noinspection JSUnresolvedVariable
    app.set('views', __dirname + '/views');
    app.set('view engine', 'jade');

    //noinspection JSUnresolvedFunction
    app.use(express.favicon());
    app.use(express.logger('dev'));
    //noinspection JSUnresolvedFunction
    app.use(express.bodyParser());
    app.use(express.methodOverride());
    app.use(express.cookieParser('secret'));
    //TODO:Config: make secrete changable in config
//    app.use(express.session({store: sessionStore, secret: 'secret', key: 'express.sid'}));
    app.use(express.session({store: new MongoStore({url:'mongodb://localhost/test'}), secret: 'secret', key: 'express.sid'}));
    // Initialize Passport! Also use passport.session() middleware, to support
    // persistent login sessions (recommended).
    app.use(passport.initialize());
    app.use(passport.session());
    app.use(app.router);
    app.use(require('less-middleware')({ src: __dirname + '/public' }));
    app.use(express.static(path.join(__dirname, 'public'), { maxAge: 86400000 /* 1d */ }));
});

app.configure('development', function () {
    app.use(express.compress());

    app.set('port', process.env.PORT || 3000);
    app.set('ip', 'localhost');
    //noinspection JSUnresolvedVariable
    app.set('views', __dirname + '/views');
    app.set('view engine', 'jade');
    //noinspection JSUnresolvedFunction
    app.use(express.favicon());
    app.use(express.logger('dev'));
    //noinspection JSUnresolvedFunction
    app.use(express.bodyParser());
    app.use(express.methodOverride());
    app.use(express.cookieParser('secret'));
    //TODO:Config: make secrete changable in config
   // app.use(express.session({store: sessionStore, secret: 'secret', key: 'express.sid'}));
    app.use(express.session({store: new MongoStore({url:'mongodb://localhost/test'}), secret: 'secret', key: 'express.sid'}));
    // Initialize Passport! Also use passport.session() middleware, to support
    // persistent login sessions (recommended).
    app.use(passport.initialize());
    app.use(passport.session());
    app.use(app.router);
    app.use(require('less-middleware')({ src: __dirname + '/public' }));
    app.use(express.static(path.join(__dirname, 'public')));
    app.use(express.errorHandler());


});

//TODO:config: This will be the intial admin user
(function checkForAdmin() {
    var defaultAdminName = 'administrator';
    var usertype = "superuser";
    var defaultEmail = "raygarner13@gmail.com";
    var defFName = "Ray";
    var defLName = "Garner";
    console.log('Checking for initial admin user');
    User.count({username: defaultAdminName, admin: usertype}, function (err, count) {
        if (count < 1) {
            console.log('did not find admin user ... creating...');
            var user = new User({username: defaultAdminName, password: defaultAdminName, admin: usertype,email:defaultEmail,firstName:defFName,lastName:defLName}).
                save(function (err) {
                    if (err) {
                        console.log(err);
                        console.log('error creating initial admin user admin');
                    } else {
                        console.log('inital admin user created username is ' + defaultAdminName + '  password is ' + defaultAdminName + '. \n ' +
                            'please change password for username ' + defaultAdminName + ' a.s.a.p.');
                    }
                });
        }
    });
})();


//Blog Routes
app.get('/blog', blogRoutes.allBlogs);
app.get('/getGroups',blogRoutes.getGroups);
app.get('/getInvitedGroup',blogRoutes.getInvitedGroup);
app.get('/blog/:id', blogRoutes.getABlog);

app.get('/blog/:skip/:limit', blogRoutes.getPaginatedBlogs);

app.get('/blogLastUpdate/:id', blogRoutes.getLastBlogUpdateDate);

app.get('/blogdataforuser', blogRoutes.blogdataforuser);

app.get('/lastestPosts/:id', blogRoutes.lastestPosts);

app.get('/lastestPics/:id', blogRoutes.latestPics);

app.get('/lastestVideos/:id', blogRoutes.latestVideos);
app.get('/lastestEvents/:id', blogRoutes.latestEvents);

app.post('/blog', passport.ensureAuthenticated, blogRoutes.createBlog);
//edit
app.post('/blog/:id', passport.ensureAuthenticated, blogRoutes.updateBlog);

app.post('/addtextpost', blogRoutes.addTextPost);


app.delete('/blog/:id', passport.ensureAuthenticated, blogRoutes.deleteBlog);

app.post('/addBlogPost', passport.ensureAuthenticated, blogRoutes.addBlogEntry);
//Auth Routes

app.get('/checkauthed', passport.ensureAuthenticated, authRoutes.checkAuthed);
app.get('/checkaccess', passport.ensureAuthenticated, authRoutes.checkProfileAuthed);

//Update docs routes
app.get('/lastUpdateSame', authRoutes.lastUpdateSame);

app.get('/lastUpdateSame/:date', authRoutes.lastUpdateSameId);

//Logging in and Registration routes

app.post('/logout', authRoutes.logout);

app.post('/login',
    passport.authenticate('local'),
    function (req, res) {

        //TODO:check user relationship
        //find other users with same relationship
        //add notification to database
        //notifications are real time but still poll every 10 mins just in case
        User.findOne({username: req.body.username}, function (err, loggeduser) {
            if (loggeduser.firstAccess == true) {


                console.log("user" + loggeduser.username + " has logged in");
                if (loggeduser.lost == undefined) {
                    console.log("wrong: User should always have at least ONE type from registration")
                } else {
                    User.find({lost: loggeduser.lost}, function (err, users) {
                        if (users.length != undefined) {
                            for (user in users) {
                                var nUser = users[user];
                                    console.log("pushed noti to "+nUser.username+" ");
                                    nUser.notifications.push({text: "A new user "+loggeduser.username+" has joined that has lost a " + Constants.lostTypes[loggeduser.lost]});
                                    //TODO:Save user
                                    nUser.save(function (err, doc) {
                                        if (err)console.log(err);
                                    })
                            }
                        }

                    })
                }
                loggeduser.firstAccess = false;
                loggeduser.save(function(err){
                    if(err)console.log(err);

                })
            }
        })
        res.send('authed', 200);
    });

app.post('/auth/login', authRoutes.loginAuth);

app.get('/getreguserdata',passport.ensureAuthenticated,authRoutes.getRegUserData);
app.post('/updateuserdata',passport.ensureAuthenticated,authRoutes.updateuserdata);
app.get('username', passport.ensureAuthenticated, function (req, res) {
    req.send(req.session.username, 200);
});

app.post('/register', authRoutes.register);

//comment system routes


app.post('/comments', passport.ensureAuthenticated, commentRoutes.comments);
app.post('/subcomment', passport.ensureAuthenticated, commentRoutes.subcomment);

//file handler routes

app.post('/upload', passport.ensureAuthenticated, fileHandlerRoutes.upload);
app.post('/uploadspread', passport.ensureAuthenticated, fileHandlerRoutes.uploadspread);
app.post('/uploadportrait', passport.ensureAuthenticated, fileHandlerRoutes.uploadportrait);
app.post('/submitphotodata', passport.ensureAuthenticated, fileHandlerRoutes.submitphotodata);
//app.post('/addAlbum',fileHandlerRoutes.addAlbum);
app.post('/submitphotodata', passport.ensureAuthenticated, fileHandlerRoutes.cancelphotodata);
app.get('/getPicsForBlog/:id', passport.ensureAuthenticated, fileHandlerRoutes.getPicsForBlog);
app.get('/albums/:id',fileHandlerRoutes.albums);
app.post('/createNewAlbum/:id',fileHandlerRoutes.createNewAlbum);
app.post('/updateAlbum/:id',fileHandlerRoutes.updateAlbum);
app.get('/showAlbum/:id/:albumid',fileHandlerRoutes.showAlbum);

//apiv2 : EXPERIMENTAL

app.post('/create/:type',apiv2.createData);
app.post('/create/:type/:id/:subdoc',apiv2.createData);
app.get('/get/:type/:id',apiv2.getData);//id:ALL = get all blogs anythings else must be an id
app.get('/get/:type/:field/:query',apiv2.getData);
app.post('/edit/:type/:id',apiv2.editData);//simple edit only

app.get('/invite/:wallid/:user',blogRoutes.sendWallInvite);
app.get('/block/:wallid/:user',blogRoutes.block);
app.get('/getFriendsMemorials',blogRoutes.getFriendsMemorials);
app.get('/removeself/:wall',blogRoutes.selfRemove);
app.get('/usersinnetwork/:search',blogRoutes.usersInNetwork)
app.get('/subscribed/:id',blogRoutes.subscribed);
app.get('/selfremove/:id',blogRoutes.selfremove);
app.get('/selfremove/:id',blogRoutes.subscribedto);
app.get('/notifications',blogRoutes.notifications);
app.get('/notified/:id',blogRoutes.notified);

app.post('/updateworkshop/:id',blogRoutes.editworkshop);

//message center api
app.get('/getMessagedUsers',messageRoutes.getMessagedUsers);
app.get('/getMessages/:username',messageRoutes.getMessagesForUser);

//password recover
app.post('/passrecover',authRoutes.passrecover);
app.post('/updatepass',authRoutes.updatePass);
var server = http.createServer(app).listen(app.get('port'), app.get('ip'), function () {
    console.log("server listening " + app.get('ip') + ':' + app.get('port'));
});
var io = require('socket.io').listen(server);

//************SOCKET.IO**************************//
// TODO:fix chat bug where same user name of user shows twice.

io.configure(function () {
    io.set("authorization", passportSocketIo.authorize({
        key: 'express.sid',       //the cookie where express (or connect) stores its session id.
        secret: 'secret', //the session secret to parse the cookie
        store:  new MongoStore({url:'mongodb://localhost/test'}),     //the session store that express uses
        fail: function (data, accept) {
            accept(null, false);             // second param takes boolean on whether or not to allow handshake
        },
        success: function (data, accept) {
            accept(null, true);
        }
    }));
});
var connectedusers = [];

io.sockets.on('connection', function (socket) {
    socket.emit('connected', {conn: 'true'});
    socket.on('loggedin', function () {
        console.log('logged in ');
        socket.emit('login');
    });
    socket.on('subscribe', function (data) {
        console.log('subscribed');

        socket.handshake.room = data.room;
        var duplicateUserForRoom = false;
        var usersForThisRoom = [];
        for (var a = 0; a < connectedusers.length; a++) {
            if (connectedusers[a].id == socket.handshake.user[0]._id && connectedusers[a].room == data.room) {
            }
            if (connectedusers[a].room == data.room) {
                usersForThisRoom.push(connectedusers[a]);
            }
        }
        var clients = io.sockets.clients(data.room);
        for (var i = 0; i < clients.length; i++) {
            console.log("================================================================next client loading....");
        }
        if (duplicateUserForRoom == false) {
            socket.join(data.room);
            connectedusers.push({room: data.room, id: socket.handshake.user[0]._id, username: socket.handshake.user[0].username});

            usersForThisRoom.push({room: data.room, id: socket.handshake.user[0]._id, username: socket.handshake.user[0].username});


            socket.emit('initialuserlist', usersForThisRoom);
            io.sockets.in(data.room).emit('updateusers', usersForThisRoom);
        }


    });
    socket.on('sentcomment', function (data) {
        console.log("sentcomment");
        //socket.emit('commentsupdated',"updateNow");
        //socket.broadcast.in(data.room).emit('commentsupdated', '', "updateNow");
        io.sockets.in(data.room).emit('commentsupdated', "YEAH");
    });
    socket.on('subcomment', function (data) {
        io.sockets.in(data.room).emit('subcommentupdated', data)
    })
    socket.on('postText', function (data) {
        console.log('posttext event received');
        Blog.findOne({_id: data.room}, function (err, blog) {
            if (err)console.log(err);
            console.log(blog.postText[blog.postText.length - 1]);
            io.sockets.in(data.room).emit('newPostText', blog.postText[blog.postText.length - 1]);
        })

    });
    socket.on('test', function (data) {
        console.log("post text");
        io.sockets.in(data.room).emit('testrec', {testdata: 'sent'});
    })
    socket.on('unsubscribe', function (data) {
        console.log('unsubscribe');
        socket.leave(data.room);
        var usersForThisRoom = [];
        var buffer = connectedusers;
        for (var a = 0; a < connectedusers.length; a++) {
            if (connectedusers[a].id == socket.handshake.user[0]._id) {
                buffer.splice(a, 1);
            }
            if (connectedusers[a] != undefined && connectedusers[a].room == data.room) {
                usersForThisRoom.push(connectedusers[a]);
            }
        }
        connectedusers = buffer;
        console.log(io.sockets.manager.rooms);
        var clients = io.sockets.clients(data.room);
        for (var i = 0; i < clients.length; i++) {
            console.log("================================================================next client loading....");
        }
        io.sockets.to(data.room).emit('updateusers', usersForThisRoom);
    });
    socket.on('disconnect', function () {
        socket.leave(socket.room);
        var usersForThisRoom = [];
        console.log('disconnect');
        var buffer = connectedusers;
        for (var i = 0; i < connectedusers.length; i++) {
            if (connectedusers[i].id == socket.handshake.user[0]._id) {
                buffer.splice(i, 1);
            }
            if (connectedusers[i] != undefined && connectedusers[i].room == socket.room) {
                usersForThisRoom.push(connectedusers[i]);
            }
        }
        connectedusers = buffer;
        console.log(socket.handshake.user[0].username);
        io.sockets.to(socket.room).emit('updateusers', usersForThisRoom);
    });
});



//TODO:REMOVE THIS CODE
//TODO: Javascrip LInked list
function LinkedList(){
    var _list = [];
    var _head = null;
    var _length = 0;
    var _current = null;


    return {
        add:function(newNode){
            var _node = {
                data:{},
                next:null
            }
            current
            if(_head === null){
                _head = node;
            }else{
            }

              list.push(newNode);

        },
        remove:function(){

        }
    }

}