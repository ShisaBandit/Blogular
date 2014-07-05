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
    , petitionRoutes = require('./routes/petitions')
    , apiv2 = require('./routes/apiv2')
    //, blog = require('./routes/blog')
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
var SingleCount = blogModels.SingleCount;
var app = express();
app.use(expressValidator());
//noinspection JSValidateTypes
app.configure('production', function () {
    global.__uploads = 'app';
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
    app.use(express.session({store: new MongoStore({url:'mongodb://localhost/test'}), secret: 'secret', key: 'connect.sid'}));
    // Initialize Passport! Also use passport.session() middleware, to support
    // persistent login sessions (recommended).
    app.use(passport.initialize());
    app.use(passport.session());
    app.use(app.router);
    app.use(require('less-middleware')({ src: __dirname + '/app' }));
    app.use(express.static(path.join(__dirname, 'app'), { maxAge: 86400000 /* 1d */ }));
});

app.configure('development', function () {
    global.__uploads = 'app';
    app.use(express.compress());

    app.set('port', process.env.PORT || 3000);
    app.set('ip', '0.0.0.0');
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
    app.use(express.session({store: new MongoStore({url:'mongodb://localhost/test'}), secret: 'secret', key: 'connect.sid'}));
    // Initialize Passport! Also use passport.session() middleware, to support
    // persistent login sessions (recommended).
    app.use(passport.initialize());
    app.use(passport.session());
    app.use(app.router);
    app.use(require('less-middleware')({ src: __dirname + '/app' }));
    app.use(express.static(path.join(__dirname, 'app')));
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
(function DataInitialization(){
    console.log("initialising database data");
    console.log("checking pic count");
    SingleCount.count({}, function (err,count) {
        console.log("Pic count is "+count);
        if(count<1){
            console.log("no pic count entry detected adding one")
            var piccount = new SingleCount({totalPicCount:0}).
                save(function (err) {
                    if(err){
                        console.log(err)
                        console.log("error creating the total pic count entry app pic uploads may not work correctly")
                    }else{
                        console.log("total pic created started at 0");
                    }
                })
        }
    })
})();

//Blog Routes
app.get('/blog', blogRoutes.allBlogs);
app.get('/getGroups',blogRoutes.getGroups);
app.get('/getInvitedGroup',passport.ensureAuthenticated,blogRoutes.getInvitedGroup);
app.get('/blog/:id', blogRoutes.getABlog);

app.get('/blog/:skip/:limit', blogRoutes.getPaginatedBlogs);
app.get('/stream/:id/:skip/:limit', blogRoutes.getPaginatedStreamPosts);

app.get('/blogLastUpdate/:id', blogRoutes.getLastBlogUpdateDate);

app.get('/blogdataforuser', blogRoutes.blogdataforuser);

app.get('/lastestPosts/:id',passport.ensureAuthenticated, blogRoutes.lastestPosts);

app.get('/lastestPics/:id',passport.ensureAuthenticated ,blogRoutes.latestPics);
app.get('/deletepic/:pic/:blog',passport.ensureAuthenticated,blogRoutes.deletepic);

app.get('/lastestVideos/:id',passport.ensureAuthenticated, blogRoutes.latestVideos);
app.get('/lastestVideosAll/:id',passport.ensureAuthenticated, blogRoutes.latestVideosAll);
app.get('/lastestVideosYoutube/:id',passport.ensureAuthenticated, blogRoutes.latestVideosYouTube);
app.get('/lastestVideosAnimoto/:id',passport.ensureAuthenticated, blogRoutes.latestVideosAnimoto);
app.get('/lastestEvents/:id',passport.ensureAuthenticated, blogRoutes.latestEvents);

app.get('/addToStream/:wallId/:postId',passport.ensureAuthenticated,blogRoutes.addToStream)
app.get('/commentsAllowed/:wallId/:postId',passport.ensureAuthenticated,blogRoutes.commentsAllowed)
app.get('/resetComments/:wallId/:postId',passport.ensureAuthenticated,blogRoutes.resetComments)

app.post('/blog', passport.ensureAuthenticated, blogRoutes.createBlog);
//edit
app.post('/blog/:id', passport.ensureAuthenticated, blogRoutes.updateBlog);

app.post('/addtextpost',passport.ensureAuthenticated, blogRoutes.addTextPost);


app.delete('/blog/:id', passport.ensureAuthenticated, blogRoutes.deleteBlog);

app.post('/addBlogPost', passport.ensureAuthenticated, blogRoutes.addBlogEntry);
//Auth Routes

app.get('/checkauthed', passport.ensureAuthenticated, authRoutes.checkAuthed);
app.get('/checkaccess', passport.ensureAuthenticated, authRoutes.checkProfileAuthed);

//Update docs routes
app.get('/lastUpdateSame', authRoutes.lastUpdateSame);

app.get('/lastUpdateSame/:date', authRoutes.lastUpdateSameId);

//Logging in and Registration routes

app.post('/logout',passport.ensureAuthenticated, authRoutes.logout);

app.post('/login',
    passport.authenticate('local'),
    function (req, res) {
        var user;
        //TODO:check user relationship
        //find other users with same relationship
        //add notification to database
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
            res.send(JSON.stringify({id:loggeduser._id,gravatar:loggeduser.gravatar,username:loggeduser.username}), 200);
        })
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
app.post('/upload/:type', passport.ensureAuthenticated, fileHandlerRoutes.upload);
app.post('/uploadspread', passport.ensureAuthenticated, fileHandlerRoutes.uploadspread);
app.post('/uploadportrait', passport.ensureAuthenticated, fileHandlerRoutes.uploadportrait);
app.post('/submitphotodata', passport.ensureAuthenticated, fileHandlerRoutes.submitphotodata);
//app.post('/addAlbum',fileHandlerRoutes.addAlbum);
app.post('/submitphotodata', passport.ensureAuthenticated, fileHandlerRoutes.cancelphotodata);
app.get('/getPicsForBlog/:id', passport.ensureAuthenticated, fileHandlerRoutes.getPicsForBlog);
app.get('/albums/:id',passport.ensureAuthenticated,fileHandlerRoutes.albums);
app.post('/createNewAlbum/:id',passport.ensureAuthenticated,fileHandlerRoutes.createNewAlbum);
app.post('/updateAlbum/:id',passport.ensureAuthenticated,fileHandlerRoutes.updateAlbum);
app.get('/showAlbum/:id/:albumid',passport.ensureAuthenticated,fileHandlerRoutes.showAlbum);

//apiv2 : EXPERIMENTAL

app.post('/create/:type',passport.ensureAuthenticated,apiv2.createData);
app.post('/create/:type/:id/:subdoc',passport.ensureAuthenticated,apiv2.createData);
app.get('/get/:type/:id',passport.ensureAuthenticated,apiv2.getData);//id:ALL = get all blogs anythings else must be an id
app.get('/get/:type/:field/:query',passport.ensureAuthenticated,apiv2.getData);
app.post('/edit/:type/:id',passport.ensureAuthenticated,apiv2.editData);//simple edit only

app.get('/invite/:wallid/:user',passport.ensureAuthenticated,blogRoutes.sendWallInvite);
app.get('/block/:wallid/:user',passport.ensureAuthenticated,blogRoutes.block);
app.get('/getFriendsMemorials',passport.ensureAuthenticated,blogRoutes.getFriendsMemorials);
app.get('/getNetwork',passport.ensureAuthenticated,blogRoutes.getNetwork);
app.get('/removeself/:wall',passport.ensureAuthenticated,blogRoutes.selfRemove);
app.get('/usersinnetwork/:search',passport.ensureAuthenticated,blogRoutes.usersInNetwork);
//app.get('/usersinnetworkAll',blogRoutes.usersInNetworkAll);

app.get('/subscribed/:id',passport.ensureAuthenticated,blogRoutes.subscribed);///TODO:THE NAMES HERE ARE WRONG"!!!! FIX THESE
app.get('/selfremove/:id',passport.ensureAuthenticated,blogRoutes.selfremove);
app.get('/selfremove/:id',passport.ensureAuthenticated,blogRoutes.subscribedto);
app.get('/notifications',passport.ensureAuthenticated,blogRoutes.notifications);
app.get('/notified/:id',passport.ensureAuthenticated,blogRoutes.notified);

app.post('/updateworkshop/:id',passport.ensureAuthenticated,blogRoutes.editworkshop);
app.post('/workshopinfo',blogRoutes.workshopinfo);
//message center api
app.get('/getMessagedUsers',passport.ensureAuthenticated,messageRoutes.getMessagedUsers);
app.get('/getMessages/:username',passport.ensureAuthenticated,messageRoutes.getMessagesForUser);

//password recover
app.post('/passrecover',authRoutes.passrecover);
app.post('/updatepass',authRoutes.updatePass);

//petition using apiv2
app.get('/getPetitionsForUser',passport.ensureAuthenticated,petitionRoutes.getAllPetitionsForUser);
app.post('/updatePetition',passport.ensureAuthenticated,petitionRoutes.updatePetition);
app.get('/deletePetition/:id',passport.ensureAuthenticated,petitionRoutes.deletePetition);

app.get('/getInviteBlogUserData/:wallid',passport.ensureAuthenticated,blogRoutes.getInviteBlogUserData);

//shopwall connection
app.get('/shoptowall/:user/:wall/:iname/:iqty/:i2name/:i2qty/:i3name/:i3qty/:more',blogRoutes.shopToWall);

app.get('/upcomingdates',blogRoutes.upcomingDates);
app.get('/join/:blog',blogRoutes.join);
//app.post('/sendAbout',blogRoutes.sendAboutMail);

var server = http.createServer(app).listen(app.get('port'), app.get('ip'), function () {
    console.log("server listening " + app.get('ip') + ':' + app.get('port'));
});
var io = require('socket.io').listen(server);

//************SOCKET.IO**************************//
// TODO:fix chat bug where same user name of user shows twice.

io.configure(function () {
    io.set("authorization", passportSocketIo.authorize({
        key: 'connect.sid',       //the cookie where express (or connect) stores its session id.
        secret: 'secret', //the session secret to parse the cookie
        store:  new MongoStore({url:'mongodb://localhost/test'}),     //the session store that express uses
        cookieParser:express.cookieParser,
        success: function (data, accept) {
            console.log('successful connection to socket.io');
            accept(null, true);
        },
        fail: function (data, message, error, accept) {
            if(error)
                throw new Error(message);
            console.log('failed connection to socket.io:', message);
            accept(null, false);             // second param takes boolean on whether or not to allow handshake
        }

    }));
});
var notificationSubscribers = [];
var connectedusers = [];
var connectedUsersData = [];
app.get('/connectedusers',function(req, res)
{

    return res.send(JSON.stringify(connectedUsersData));
});


io.sockets.on('connection', function (socket) {
    socket.emit('connected', {conn: 'true'});
    socket.on('loggedin', function () {
        console.log('logged in ');
        socket.emit('login');
    });
    socket.on('subscribe', function (data) {
        console.log('subscribed');

        socket.handshake.room = data.room;
        var duplicateUserForRoom = false;//TODO:check to make sure not alread in room??
        var usersForThisRoom = [];//hold a list of all users in the currently subscribed room
        for (var a = 0; a < connectedusers.length; a++)
        {
            /*
            if (connectedusers[a].id == socket.handshake.user[0]._id && connectedusers[a].room == data.room) {
            }
            */
            //if this user is in the room
            if (connectedusers[a].room == data.room)
            {
               /*
                for(var u = 0;u < usersForThisRoom.length;u++){
                    if(usersForThisRoom[u].room == connectedusers[a].room){
                      //  duplicateUserForRoom = true;
                    }
                }
                */
               // usersForThisRoom.push(connectedusers[a]);
            }
        }
        /*
        var clients = io.sockets.clients(data.room);
        for (var i = 0; i < clients.length; i++) {
            console.log("================================================================next client loading....");
        }
        */
        //if we didnt have any duplicates
        if (duplicateUserForRoom == false)
        {
            socket.join(data.room);
            connectedusers.push({room: data.room, id: socket.handshake.user[0]._id, username: socket.handshake.user[0].username,socket:socket,userdata:socket.handshake.user[0]});

            //usersForThisRoom.push({room: data.room, id: socket.handshake.user[0]._id, username: socket.handshake.user[0].username});


            //socket.emit('initialuserlist', usersForThisRoom);//send to the subscribing user
            //io.sockets.in(data.room).emit('updateusers', usersForThisRoom);//send to everyone else already in the room
        }
        console.log("User subscribed")
        console.log(connectedusers.length)
        return;


    });
    socket.on('subscribe_notifications', function (data)
    {
        console.log("trying to subscribe to notifications")
        notificationSubscribers.push({ id: socket.handshake.user[0]._id, username: socket.handshake.user[0].username,socket:socket});
        GetUsersInNetwork(socket.handshake.user[0]._id,socket,true);
        var dup = false;
        for(var i = 0; i < connectedUsersData.length;i++)
        {
            console.log(connectedUsersData[i]._id.valueOf());
            console.log(socket.handshake.user[0]._id.valueOf());
            if(connectedUsersData[i]._id.toString() == socket.handshake.user[0]._id.toString())
            {
                dup = true;
            }
        }
        if(!dup)
        {

            connectedUsersData.push(socket.handshake.user[0]);



            //check all connected users if this user is in their network if yes
            //send a message telling them the are onlinej
            //dont forget to send a message telling them they are online
            //create an api that sends all users in network to them with data

        }

        //console.log(connectedUsersData.length);
    });

    socket.on('sentcomment', function (data)
    {
        console.log("sentcomment");
        //socket.emit('commentsupdated',"updateNow");
        //socket.broadcast.in(data.room).emit('commentsupdated', '', "updateNow");
        io.sockets.in(data.room).emit('commentsupdated', "YEAH");
    });
    socket.on('subcomment', function (data)
    {
        console.log(socket.broadcast);
        //io.sockets.in(data.room).broadcast('subcommentupdated', data)
        socket.broadcast.to(data.room).emit(    'subcommentupdated', data)
    })
    socket.on('postText', function (data)
    {
        console.log('posttext event received');
        Blog.findOne({_id: data.room}, function (err, blog) {
            if (err)console.log(err);
            console.log(blog.postText[blog.postText.length - 1]);
            socket.broadcast.to(data.room).emit('newPostText', blog.postText[blog.postText.length - 1]);
        })

    });
    socket.on('test', function (data)
    {
        console.log("post text");
        io.sockets.in(data.room).emit('testrec', {testdata: 'sent'});
    })
    socket.on('unsubscribe', function (data)
    {
        console.log('unsubscribe');
        console.log(notificationSubscribers)
        GetUsersInNetwork(socket.handshake.user[0]._id,socket,false);
        socket.leave(data.room);
        //var usersForThisRoom = [];
        var buffer = connectedusers;
        for (var a = 0; a < connectedusers.length; a++)
        {
            if (connectedusers[a].id == socket.handshake.user[0]._id)
            {
                buffer.splice(a, 1);
            }
            if (connectedusers[a] != undefined && connectedusers[a].room == data.room)
            {
                //usersForThisRoom.push(connectedusers[a]);
            }
        }
        connectedusers = buffer;
        console.log(io.sockets.manager.rooms);
        var clients = io.sockets.clients(data.room);
        for (var i = 0; i < clients.length; i++)
        {
            console.log("================================================================next client loading....");
        }
        console.log(notificationSubscribers)
        //io.sockets.to(data.room).emit('updateusers', usersForThisRoom);
    });
    socket.on('disconnect', function ()
    {
        socket.leave(socket.room);
        //var usersForThisRoom = [];
        console.log('disconnect');
        GetUsersInNetwork(socket.handshake.user[0]._id,socket,false);
        var buffer = connectedusers;
        for (var i = 0; i < connectedusers.length; i++)
        {
            if (connectedusers[i].id == socket.handshake.user[0]._id)
            {
                buffer.splice(i, 1);
            }
            if (connectedusers[i] != undefined && connectedusers[i].room == socket.room)
            {
                //usersForThisRoom.push(connectedusers[i]);
            }
        }
        for(var d = 0 ; d < connectedUsersData.length;d++)
        {
            if(connectedUsersData[d]._id.toString() == socket.handshake.user[0]._id.toString())
            {
                connectedUsersData.splice(d,1);
            }
        }
        connectedusers = buffer;
        console.log(socket.handshake.user[0].username);
        //io.sockets.to(socket.room).emit('updateusers', usersForThisRoom);
    });
/*
    socket.on('notification_messagereceived',function(username,message,notiid){
        console.log("NOTIFICATION MESSAGE RECEIVED_______-------- SOCKET")

        for (var i = 0; i < connectedusers.length; i++) {
            var conUsers = connectedusers[i];
            if(conUsers[i]._id == userid){
                conUsers[i].socket.emit('notification',message);
            }
        }
    })
*/
});
//notifications for apiv2 routes
apiv2.messageEmitter.on('notification_messagereceived',function(userid,message,notiid){
    console.log("NOTIFICATION MESSAGE RECEIVED_______--------"+ notificationSubscribers.length)
    console.log(notificationSubscribers)
    console.log(userid)
    console.log(message)
    var conUsers = notificationSubscribers;

    for (var i = 0; i < notificationSubscribers.length; i++)
    {
        console.log(conUsers[i].id +" = "+userid)
        if(conUsers[i].id.toString() == userid.toString())
        {
            console.log("trying to emit to a user with message "+message);
            conUsers[i].socket.emit('newnotification',{text:message,viewed:false,_id:notiid});
        }
    }
})
//event for when a gift is received
apiv2.messageEmitter.on('shoptowall_giftreceived',function(wall)
{
    console.log("shop to wall NOTIFICATION MESSAGE RECEIVED_______--------"+ notificationSubscribers.length)
    var conUsers = notificationSubscribers;
    Blog.findOne({_id: wall}, function (err, blog) {
/*
    for (var i = 0; i < notificationSubscribers.length; i++) {
            console.log("trying to emit an update to the wall "+wall);
           // conUsers[i].socket.emit('newnotification',{text:message,viewed:false,_id:notiid});
            //    if (err)console.log(err);
                console.log(blog.postText[blog.postText.length - 1]);
                console.log(conUsers[i].socket.room+" "+wall);
                if(conUsers[i].socket.room == wall){
                    conUsers.socket.emit('newPostText', blog.postText[blog.postText.length - 1]);
                }
    }
    */
        io.sockets.in(wall).emit('newPostText', blog.postText[blog.postText.length - 1]);

    })

    })

GetUsersInNetwork = function (id,socket,state)
{
    console.log(id);
    User.find({_id: id}).populate('memwalls').exec(function (err, user)
    {
        // Blog.populate(user[0].memwalls, {path: 'user', match: {username: new RegExp(search, "i")}}, function (err, walls) {
        User.populate(user[0].memwalls,{path:'user'},function(err,walls)
        {
            if (err)console.log(err)
            if (!user[0])
            {
                return res.send(200, 'none');
            }
            else
            {
                var returndata = [];
                var memwalls = user[0].memwalls;

                for (var x = 0; x < memwalls.length; x++)
                {
                    var memwall = memwalls[x];

                    var dup = false;
                    for(var r = 0;r < returndata.length;r++)
                    {
                        if(returndata[r].userid == memwall.user._id)
                        {
                            dup = true;
                        }
                    }
                    if(!dup)
                    {
                        var tempObj = {
                            id: memwall._id,
                            author: memwall.author,
                            firstName: memwall.firstName,
                            lastName: memwall.lastName,
                            title: memwall.title,
                            userid:memwall.user._id,
                            username:memwall.user.username,
                            online:false
                        }
                        returndata.push(tempObj);

                    }

                }

                console.log(returndata);

                    for(var un = 0; un < returndata.length;un++)
                    {
                        for(var c = 0;c<notificationSubscribers.length;c++)
                        {
                            console.log(notificationSubscribers[c].id+" "+ returndata[un].userid);
                            if(notificationSubscribers[c].id.toString() == returndata[un].userid.toString())
                            {
                                console.log("writing to socket ");
                                notificationSubscribers[c].socket.emit('online',{user:id,state:state});
                            }
                        }
                        socket.emit('online',{user:returndata[un].userid,state:state});

                    }



                return returndata;
            }
        })
    })
}
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