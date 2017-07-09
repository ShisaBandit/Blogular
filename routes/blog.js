var models = require('../models/models');
var Common = require('../constants/constants.js');
var mongoose = require('mongoose');
var Q = require('q');
var util = require('util');
var moment = require('moment');
var Blog = models.Blog;
var User = models.User;
var Update = models.Update;
var Message = models.Message;
var Workshop = models.Workshop;
var PICTYPE = 1;
var VIDEOTYPE = 2;
var nodemailer = require('nodemailer');
//var smtpTransport = nodemailer.createTransport("sendmail");
var smtpTransport = nodemailer.createTransport("SMTP", {
    host: "mail.angelsofeureka.org",
    port: "465",
    secureConnection: true,
    auth:
    {
        user: "noreply@angelsofeureka.org",
        pass: "regEmail2013"
    }
});


var EventEmitter = require('events').EventEmitter;
//var emailTemplates = require('swig-email-templates');
var path = require('path');
exports.messageEmitter = messageEmitter = new EventEmitter();


exports.getPublishedWorkshops = function(req,res)
{
    Workshop.find({subscribed:req.params.subscribed},function(err,workshops)
    {
        if(err)return res.send(500,"OH SNAP!");
        return res.send(200,JSON.stringify(workshops));
    })
}

exports.setPublishState = function(req,res)
{
    console.log(req.params.id)
    console.log(req.params.state)
    Workshop.findOne({_id:req.params.id},function(err,workshop)
    {
        workshop.published = req.params.state;
        workshop.save(function(err){
            if(err)return res.send(500,"On snap!");
            return res.send(200,'success');
        });
    })
}

exports.workshopinfo = function(req,res)
{
    //TODO:Get theworkshop datafrom client format and send to pat rod and me
    var message = 'You have a new workshop submission:'+req.body.address;
    SendEmail('raygarner13@gmail.com','raygarner13@gmail.com',message,'Circle of Life Workshop Submission! View and approve this submission here: <a href="http://');// +
        //'thecircleof.life/#/workshops/'+blog.author+'/'+requester._id+'">Click to review and approve</a>');
    SendEmail('Rodney','rodney@blackjackproductions.com',message,'Circle of Life Workshop Submission! View and approve this submission here: <a href="http://' );//+
        //'thecircleof.life/#/workshops/'+blog.author+'/'+requester._id+'">Click to review and approve</a>');
    //SendEmail('raygarner13@gmail.com','AngelsofEureka@aol.com',message,'Wall request!');


    var newWSEntry = new Workshop(req.body);
    newWSEntry.save(function (err)
    {
        if (err)console.log(err);
    });




    return res.send(200,'success');



}


exports.GetConnectedUsers = function(req, res)
{
    return res.send(JSON.stringify(notificationSubscribers));
}
exports.join = function (req,res) {
    var requester;
    var requestee;
    var blogId = req.params.blog;
    Blog.findOne({author:blogId}).populate('user').exec(function(err,blog) {
        if(!blog)return res.send(410,'error');
        requestee = blog.user;
        User.findOne({_id:req.session.passport.user}, function (err,user) {
            if(!blog)return res.send(410,'error');
            console.log(user);
            requester  = user;
             var message = 'Hello '+ requestee.username+', '+ requester.username+' wants to join your memorial wall or private group, <b>'+blog.title+'</b>. <a href="http://' +
             'thecircleof.life/#/join/'+blog.author+'/'+requester._id+'">Click to give them access</a>';
             /*var message = 'Hey someone wants to join your wall <b>'+blog.title+'</b> info click here to let them in <a href="http://' +
             'localhost:3000/#/join/'+blog.author+'/'+requester._id+'">click to allow</a>';*/
             //send message to allow invitation by clicking on link.
            SendMessage('administrator',requestee.username,message,req,res, function () {
                //send email to allow invitation
                message = 'Hello '+ requestee.username+', '+ requester.username+' wants to join your memorial wall or private group, <b>'+blog.title+
                    '</b> Go to your <b>Message Center</b> in your <b>User profile</b> on <a href="http://thecircleof.life">The Circle of Life</a>, to give them access';

                SendEmail(requestee.email,requester.email,message,'Circle of Life Memorial Wall/Group request!');
                return res.send(200,'success');
            });
        })

    })
}

var SendMessage = function (from,to,message,req,res,callback) {//data from to
    // var to = data.to;
    console.log("sending message")
    var index = to.indexOf(':');
    if(index>0){
        to = data.to.substring(0,index);
    }
    //data.to = to;
    //var from;
    // var message = data.message;
    //TODO:add check for verifying user can receive a message. !!
    //data.from = req.session.passport.user;
    //Find the current user
    models.User.findOne({_id:req.session.passport.user},function(err,fromdoc){
       // from = data.from = fromdoc.username;
        //find the user we are sending amessage to
        models.User.findOne({username:to},function(err,todoc){
            if(err)console.log(err);
            //if we didnt find one ent this callback a error and end this func
            if(todoc == undefined){
                console.log("not sending message");
                var messageToUser = "No user by that name";
                //callback(data,messageToUser);
                return;
            }
            var messagedUsersTo = todoc.messagedUsers;
            var added = false;
            //check if we are adding a new messaged user
            for(var user in messagedUsersTo){
                if(messagedUsersTo[user].user == from){
                    added = true;
                }
            }
            todoc.notifications.push({text:"You have a new message from "+from});
            if(!added){
                todoc.messagedUsers.push({user:from,firstName:fromdoc.firstName,lastName:fromdoc.lastName});
            }
            var messagedUsersFrom = fromdoc.messagedUsers;
            var added = false;
            var addedTo = false;
            //check if we are adding a new messaged user
            for(var user in messagedUsersFrom){
                if(messagedUsersFrom[user].user == from){
                    added = true;
                  if(  messagedUsersFrom[user].firstName == undefined)
                  {
                      fromdoc.messagedUsers.lastName = todoc.lastName;
                      fromdoc.messagedUsers.firstName = todoc.firstName;
                  }
                }
                if(messagedUsersFrom[user].user == to){
                    addedTo = true;
                    if(  messagedUsersFrom[user].firstName == undefined)
                    {
                        todoc.messagedUsers.lastName = fromdoc.lastName;
                        todoc.messagedUsers.firstName = fromdoc.firstName;
                    }
                }
            }

            if(!added){
                fromdoc.messagedUsers.push({user:from,firstName:todoc.firstName,lastName:todoc.lastName});
            }
            if(!addedTo){
                fromdoc.messagedUsers.push({user:to,firstName:fromdoc.firstName,lastName:fromdoc.lastName});
            }
            fromdoc.save(function(err){
                if(err)console.log(err)
            })
            todoc.save(function(err,saveddoc){
                if(err)console.log(err)

                messageEmitter.emit('notification_messagereceived',todoc._id,"You have a new message from "+from,saveddoc.notifications[saveddoc.notifications.length-1]._id);
                var messaged = new Message({from:from,to:to,message:message}).
                    save(function (err) {
                    if(err)console.log(err);
                });

            })
            callback();
        });

    })



}
exports.upcomingDates = function (req, res) {
    User.findOne({_id: req.session.passport.user}).populate('memwalls').exec(function (err, user) {
        if(!user)return res.send(200,"none");
        if(!user.memwalls)return res.send(200,"no walls");
        var nU = user.memwalls;
        var eventsInNetworkCurrently = [

        ]
        var oneWeekBefore = moment().subtract('week', 1);
        var oneWeekafter = moment().add('week', 1);
        for (var i = 0; i < nU.length; i++) {//looping through memwalls
            console.log(nU[i].postText.length);
            for (var d = 0; d < nU[i].postText.length; d++) {//looping through memwalls post text
                if (nU[i].postText[d].postType == 3) {

                    //var eventDate = moment(eventsInNetworkCurrently[t].date);
                    var eventDate = moment(nU[i].postText[d].date);
                    if (eventDate.isAfter(oneWeekBefore) && eventDate.isBefore()) {//will happen
                        console.log("This event is coming up");
                        console.log("This event happened " + eventDate.fromNow() + " " + eventDate.format());
                        eventsInNetworkCurrently.push(
                            {
                                event: nU[i].postText[d].event,
                                date: moment(nU[i].postText[d].date).format("dddd, MMMM Do YYYY"),
                                blogId: nU[i]._id,
                                name:nU[i].firstName+" "+nU[i].lastName,
                                text:nU[i].postText[d].text,
                                message: "This event happened " + eventDate.fromNow()// + " " + eventDate.format()
                            }
                        )
                    } else if (eventDate.isBefore(oneWeekafter) && eventDate.isAfter()) {//has happened
                        console.log("This event will happen " + eventDate.fromNow() + " " + eventDate.format());
                        eventsInNetworkCurrently.push(
                            {
                                event: nU[i].postText[d].event,
                                date: moment(nU[i].postText[d].date).format("dddd, MMMM Do YYYY"),
                                blogId: nU[i]._id,
                                name:nU[i].firstName+" "+nU[i].lastName,
                                text:nU[i].postText[d].text,
                                message: "This event will happen " + eventDate.fromNow()// + " " + eventDate.format()
                            }
                        )
                    }

                }
            }
        }
        return res.send(JSON.stringify(eventsInNetworkCurrently));
        /*
         console.log(oneWeekBefore.format());
         for(var t = 0;t<eventsInNetworkCurrently.length;t++){
         //console.log(eventsInNetworkCurrently[t]);
         var eventDate = moment(eventsInNetworkCurrently[t].date);
         console.log(eventDate.format())
         if(eventDate.isAfter(oneWeekBefore) && eventDate.isBefore()){//will happen
         //console.log("This event is coming up");
         console.log("This event happened "+eventDate.fromNow()+" "+eventDate.format())
         }else if(eventDate.isBefore(oneWeekafter) && eventDate.isAfter()){//has happened
         console.log("This event will happen "+eventDate.fromNow()+" "+eventDate.format())
         }
         }
         */
    });
}
exports.notifications = function (req, res) {

    User.findOne({_id: req.session.passport.user}, function (err, user) {
        if (user == undefined) {
            res.send(200, "ok");
        } else {
            var buffer = [];
            for (noti in user.notifications) {
                if (user.notifications[noti].viewed == false) {
                    buffer.push(user.notifications[noti])
                }
            }
            res.send(JSON.stringify(buffer));
        }

    })
}

exports.editworkshop = function (req, res) {
    Workshop.findOne({_id: req.params.id}, function (err, workshop) {
        workshop = req.body;
        workshop.save(function (err) {
            res.send(200, "success");
        })
    })
}
exports.notified = function (req, res) {

    User.findOne({_id: req.session.passport.user}, function (err, user) {
        if (user == undefined) {
            res.send(200, "failed")
        } else {
            var notis = user.notifications;
            var i = 0;
            for (var noti in notis) {
                if (notis[noti]._id == req.params.id) {
                    notis[noti].viewed = true;
                }
                i++;
            }
            user.save(function (err) {
                res.send(200, "success");
            })
        }
    })
}

exports.allBlogs = function (req, res) {
    // var skip = req.params.skip,
    //   limit = req.params.limit;
    Blog.find({}, {}, {skip: 0, limit: 3}).lean().exec(function (err, posts) {
        //limit this to only what is needed for the memorial main wall
        return res.end(JSON.stringify(posts));
    });
};

exports.getPaginatedBlogs = function (req, res) {
    var skip = req.params.skip,
        limit = req.params.limit;
    console.log(skip, limit);
    Blog.find({}, {}, {skip: skip, limit: limit}).lean().exec(function (err, posts) {
        //TODO:return only what we need for the memorial wall view
        return res.end(JSON.stringify(posts));
    });
};
exports.getPaginatedStreamPosts = function (req, res) {
    var skip = parseInt(req.params.skip),
        limit = parseInt(req.params.limit);
    console.log(skip, limit);
    console.log(req.param.id);
    Blog.findOne({_id: req.params.id}, function (err, blog) {
        if (!blog)return res.send(200, JSON.stringify([]));
        var post = blog.postText.reverse();
        var buffer = [];
        if (skip + limit > post.length) {
            var maxLength = post.length - skip;
            for (var x = 0; x < maxLength; x++) {
                console.log((x + skip));
                buffer.push(post[x + skip]);
            }
        } else {
            for (var x = 0; x < limit; x++) {
                console.log((x + skip));
                buffer.push(post[x + skip]);
            }
        }

        return res.end(JSON.stringify(buffer));

    });
};

exports.getABlog = function (req, res)
{
    var id = req.params.id;

    User.findOne({_id: req.session.passport.user}, function (err, user)
    {
        var matchfound = false;
        if (err)console.log(err);

        Blog.find({'author': id}).populate('user').exec(function (err, post)
        {
            if (post[0] === undefined)return res.send(404);
            if (user != null)
            {
                if (post[0].owner_id == req.session.passport.user)
                {
                    matchfound = true;
                }
                else
                {
                    for (var x = 0; x < user.profiles.length; x++)
                    {
                        console.log(user.profiles[x].profile);
                        if (user.profiles[x].profile == null)
                        {
                        }
                        else
                        {
                            console.log(user.profiles[x].profile);
                            if (post[0]._id == user.profiles[x].profile)
                            {
                                matchfound = true;
                            }
                        }
                    }
                }
            }
            if (process.env.NODE_ENV == "production")
            {
                console.log("WE are in production so setting privacy on mem walls");
            }
            else
            {
                console.log("not production so all walls are public for convinience");
            }
            if (post == undefined)
            {
                return res.send(200);
            }
            if (matchfound == true)
            {
                post.limited = false;
                return res.end(JSON.stringify(post));

            }
            else
            {
                var modifiedpost = [];
                var modifiedpostentry = {};
                modifiedpostentry.text = post[0].text;
                modifiedpostentry.limited = true;
                modifiedpostentry.firstName = post[0].firstName;
                modifiedpostentry.lastName = post[0].lastName;
                modifiedpostentry.gender = post[0].gender;
                modifiedpostentry.memorialDate = post[0].memorialDate;
                modifiedpostentry.profilePicWide = post[0].memorialDate;
                modifiedpostentry.profilePicPortrait = post[0].profilePicPortrait;
                modifiedpost.push(modifiedpostentry);
                return res.end(JSON.stringify(modifiedpost));
            }
        });
    })
};
//TODO:verify and test this functionality.
exports.getLastBlogUpdateDate = function (req, res) {
    var id = req.params.id;
    Blog.find({'_id': id}).lean().exec(function (err, post) {
        return res.end(JSON.stringify(post.updateDate));
    });
};

exports.blogdataforuser = function (req, res) {
    var buffer = [];
    Blog.find({owner_id: req.session.passport.user}, function (err, blogs) {
        for (var blog in blogs) {
            var data = {};
            data.author = blogs[blog].author;
            data.firstName = blogs[blog].firstName;
            data.lastName = blogs[blog].lastName;
            data.title = blogs[blog].title;
            data.profilePicPortrait = blogs[blog].profilePicPortrait;
            data.pet = blogs[blog].pet;
            data.group = blogs[blog].group;
            buffer.push(data);
        }
        res.send(JSON.stringify(buffer));

    })
}
exports.friendsMemorials = function (req, res) {
    var buffer = [];
    User.find({_id: req.session.passport.user}, function (err, doc) {
        //get the user loop thourgh profiles sort out groups from mem walls
        for (var profile in doc.profiles) {

        }
    })
}

exports.getGroups = function (req, res) {
    var buffer = [];
    Blog.find({owner_id: req.session.passport.user, group: true}, function (err, docs) {
        return res.send(JSON.stringify(docs));
    })
}
//should store a reference to the blogs you own in the user data but am not at the moment
exports.createBlog = function (req, res) {
    BlogGroupValidation(req).
        then(function (walls) {//if NO errors

            var newBlogEntry = new Blog(req.body);
            newBlogEntry.owner_id = req.session.passport.user;
            newBlogEntry.user = req.session.passport.user;
            newBlogEntry.profilePicPortrait = "defaultPortrait.png";
            newBlogEntry.profilePicWide = "defaultPicWide.jpg";
            newBlogEntry.save(function (err, newblog) {
                if (err)console.log(err);
                res.end(JSON.stringify({'success': 'true', blogId: newblog._id}));
            });
        },
        function (errors) {//if  errors
            console.log(errors);
            if (errors) {
                console.log(errors)
                res.send(errors, 500);
            }
        });
    return;
}

exports.updateBlog = function (req, res) {
    BlogGroupValidation(req).then(function () {
        console.log("resolved")
        //Updates whatever blog is sent to it
        //break this up into updateBlog and updateComment/addComment
        delete req.body._id;
        User.findOne({username: req.user[0]._doc.username}, function (err, user) {
            loggedInUser = user;
            if (user === null) {
                res.send('error:not an admin account', 401);
            } else {
                //take the blog and update it with the new comment
                //TODO:Highly ineffecient!!! for the network rework this to only have the comment that needs be updated sent and
                //sorted
                console.log(req.body.members);
                var updateObj = {
                    title:req.body.title,
                    author:req.body.author,
                    firstName:req.body.firstName,
                    lastName:req.body.lastName,
                    text:req.body.text,
                    dob:req.body.dob,
                    subgroup:req.body.subgroup,
                    memorialDate:req.body.memorialDate


                }
                Blog.findOneAndUpdate({'_id': req.params.id}, updateObj, function (err, doc) {
                    if (err) {
                        console.log(err);
                        return res.send('error', 500);
                    }
                    if(!doc)return res.send('error', 500);
                    if (doc.comments == undefined || doc.comments.length < 1) {
                        //do nothing for now
                        doc.updateDate = Date.now();
                    } else {
                        doc.comments[0].username = user.username;
                    }

                    doc.save(function (err, doc) {
                        if (err)console.log(err);
                        res.end(JSON.stringify(doc));
                    });
                    var update = new Update();
                    update.save(function (err, update) {
                        if (err)console.log(err);
                    });
                });
            }

        });
    }, function (errors) {
        console.log("rejected")
        if (errors) {
            console.log(errors);
            return res.send(errors, 500);
        }
    });

}
function BlogGroupValidation(req) {
    console.log("Begin Group validation");
    //TODO:convert this method to return a promise
    var promise = new mongoose.Promise;
    if (req.body.group == undefined || !req.body.group) {
        req.checkBody('dob', 'Must be a valid data').notNull().isDate();
        req.checkBody('memorialDate', 'Must be a valid date').notNull().isDate();
        req.checkBody('subgroup', 'Must select a group').notNull();
    }
    req.checkBody('title', 'You need a title').notNull();
    req.checkBody('author', 'You must assign a url').notNull();
    /*
     var charsNotAllowed = [' ','{','}','|','\\','^','~','[',']','`',';','/','?',':','@','=','&'];
     for(var i = 0;i< charsNotAllowed.length;i++){
     console.log(charsNotAllowed[i])
     req.checkBody('author','The '+charsNotAllowed[i]+' character is not allowed').notContains(charsNotAllowed[i])
     }
     */

    req.checkBody('firstName', 'Must enter a first name').notNull();
    req.checkBody('lastName', 'Must enter a first name').notNull();
    var errors = req.validationErrors(true);
    var myRe = /^(\w*[-_]?\w*){1,100}$/;
    var myArray = myRe.exec(req.body.author);

    if (myArray == null) {
        console.log("not a valid url")
        if (!errors) {
            errors = {};
        }
        errors.author = {param: 'author', msg: 'Please enter a valid url. Only characters A-Z or numbers 1-9 and "-" or "_" allowed.'};
    }

    Blog.find({}).exec(function (err, walls) {
        // console.log(walls)
        if (!walls)promise.reject(0);//nowalls error code
        for (var i = 0; i < walls.length; i++) {
            if (req.body.author == walls[i].author) {
                console.log("same author error");

                if (walls[i].owner_id != req.session.passport.user) {
                    console.log("set sam author error");
                    if (!errors) {
                        errors = {};
                    }
                    errors.author = {param: 'author', msg: 'This url is already taken please try with a different url.'};
                }
            }
        }
        console.log(errors)
        if (errors == null) {
            console.log("fullfill");
            console.log(errors)
            promise.fulfill();
        } else {
            console.log("reject");
            console.log(errors)
            promise.reject(errors);
        }
    });

    return promise;
}
exports.deleteBlog = function (req, res) {
    console.log("trying to remove " + req.params.id);
    Blog.remove({'_id': req.params.id}, function (err) {
        if (err)
            console.log(err);

    });
}
exports.deleteAnniversary = function(req , res)
{
    var BlogID = req.params.blogId;
    var PostTextID = req.params.anniId;

    console.log("trying to remove " + BlogID);
    Blog.findOne({_id:BlogID},function(err,blog)
    {
        if(err)console.log(err);
        for(var ptext = 0;ptext < blog.postText.length;ptext++)
        {
            console.log(blog.postText[ptext]+" "+PostTextID);
            if(blog.postText[ptext]._id == PostTextID)
            {
                blog.postText.splice(ptext,1);
                break;
            }
        }
        blog.save(function(err,doc)
        {
            if(err)console.log(err);
            return res.end(JSON.stringify({200:"success"}));
        });
    });

}
exports.addBlogEntry = function (req, res) {
    var newBlogEntry = new Blog(req.body);
    newBlogEntry.save(function (err) {
        if (err)console.log(err);
    });
    return res.end(JSON.stringify({'success': 'true'}));
}

exports.addTextPost = function (req, res) {
    Blog.findOne({_id: req.body.id}, function (err, blog) {
        if (err)console.log(err);
        console.log("MIKE CHECK ");
        var userid = req.session.passport.user;
        User.findOne({_id: userid}, function (err, user) {
            req.body.username = user.username;
            req.body.gravatar = calcMD5(user.email);

            req.body.user_id = user;
            if(blog == null || blog == undefined)return;
            blog.postText.push(req.body);

            blog.save(function (err, doc) {

                if (err)console.log(err);
                console.log("saved textpost");

                return res.end(JSON.stringify({'success': 'true', 'postText': doc.postText[doc.postText.length - 1]}));

            });
        })
    });
}

exports.addPicPost = function (req, res) {
    console.log(req.body);
    Blog.findOneAndUpdate({_id: req.body.id}, function (err, blog) {
        console.log("MIKE CHECK ");
        blog.postText.push(req.body);
        return res.end(JSON.stringify({'success': 'true'}));

    });
}

exports.addVideoPost = function (req, res) {
    console.log(req.body);
    Blog.findOne({_id: req.body.id}, function (err, blog) {
        console.log("Found Blog");
        var user = req.session;
        User.findOne({_id: req.session.passport.user}, function (err, user) {
            req.body.username = user.username;
            req.body.gravatar = calcMD5(user.email);

            req.body.user_id = user._id;
            blog.postText.push(req.body);
            blog.save(function (err, doc) {
                console.log(err);
            })
        });

        return res.end(JSON.stringify({'success': 'true'}));
    });
}

exports.lastestPosts = function (req, res) {
    console.log(req.params.id);
    var skip = req.params.skip,
        limit = req.params.limit;
    console.log(skip, limit);
    console.log(req.params.id);
    Blog.findOne({_id: req.params.id}).lean().exec(function (err, blog) {
        if (err) {
            console.log(err);
            return res.send(200);
        }
        if (blog === undefined) return res.send(200);
        if (blog.postText === undefined)return res.send(200);
        var posts = blog.postText;
        var postTexts = blog.postText;
        for (var b = 0; b < blog.postText.length; b++) {
            //var startDate = post[b].date;
            //var threeDaysForward =
            //var dt = (new Date( 2011, 7, 30, 0, 0, 0, 0 )).getTime();
            //if(posts[b].date)
            if (blog.postText[b].inStream == false && blog.owner_id != req.session.passport.user) {
                postTexts.splice(b, 1);
            }
        }
        blog.postText = postTexts;
        return res.end(JSON.stringify(blog.postText.reverse()));
    });
};

exports.latestPics = function (req, res) {
    console.log(req.params.id);
    var skip = req.params.skip,
        limit = req.params.limit;
    console.log(skip, limit);
    Blog.findOne({_id: req.params.id}).lean().exec(function (err, blog) {
        var postPics = blog.postText.filter(function (ele, ind, arr) {
            return ele.postType == PICTYPE;
        })
        return res.end(JSON.stringify(postPics.reverse()));
    });
}
exports.deletepic = function (req, res) {
    Blog.findOne({_id: req.params.blog}, function (err, blog) {
        var blogdoc = blog.orphanedphotos.id(req.params.pic);
        var pic;
        if (!blogdoc) {

        } else {
            blog.orphanedphotos.id(req.params.pic).remove();
            pic = blogdoc.filename;
        }
        var albums = blog.albums;
        for (var a = 0; a < albums.length; a++) {
            if (!pic) {
                var subdoc = albums[a].photos.id(req.params.pic);
                if (!subdoc) {

                } else {
                    albums[a].photos.id(req.params.pic).remove();
                }
            } else {
                for (var p = 0; p < albums[a].photos.length; p++) {
                    if (albums[a].photos[p].filename == pic) {
                        albums[a].photos.splice(p, 1);
                    }
                }
            }

        }
        blog.save(function () {
            res.send(200);
        });
    })
}
exports.latestVideos = function (req, res) {
    Blog.findOne({_id: req.params.id}).lean().exec(function (err, blog) {
        return res.end(JSON.stringify(getPostText(blog, Common.postTextTypes.video, "embedYouTube")));
    });
}
exports.latestVideosYouTube = function (req, res) {
    Blog.findOne({_id: req.params.id}).lean().exec(function (err, blog) {
        return res.end(JSON.stringify(getPostText(blog, Common.postTextTypes.video, "embedYouTube")));
    });
}
exports.latestVideosAnimoto = function (req, res) {
    Blog.findOne({_id: req.params.id}).lean().exec(function (err, blog) {
        return res.end(JSON.stringify(getPostText(blog, Common.postTextTypes.video, "embedAnimoto")));
    });
}
exports.latestVideosAll = function (req, res) {
    /*
     Blog.findOne({_id: req.params.id}).select({'postText':{$elemMatch:{'type':Common.postTextTypes.video}}}).exec(function (err, blog) {
     //return res.end(JSON.stringify(getPostText(blog, Common.postTextTypes.video,['isStream','embedYouTube','embedAnimoto','_id'])));
     //for(var p = 0;p<blog.postText;)
     return res.end(JSON.stringify(blog));
     });
     */
    Blog.findOne({_id: req.params.id}).lean().exec(function (err, blog) {
        //console.log(blog);

        return res.end(JSON.stringify(getPostTextValues(blog, Common.postTextTypes.video, ['_id', 'embedYouTube', 'embedAnimoto', 'inStream', 'date'])));
    })
}

exports.addToStream = function (req, res) {
    var wallid = req.params.wallId;
    var postTextId = req.params.postId;

    Blog.findOne({_id: wallid}, function (err, blog) {
        var postTexts = blog.postText;
        for (var post in postTexts) {
            if (postTexts[post]._id == postTextId && blog.owner_id == req.session.passport.user) {
                blog.postText[post].inStream = !blog.postText[post].inStream;
                blog.save(function (err, doc) {
                    if (err)console.log(err);
                    res.send(200, "success");
                })
                break;
            }
        }
    })
}


exports.commentsAllowed = function (req, res) {
    var wallid = req.params.wallId;
    var postTextId = req.params.postId;

    Blog.findOne({_id: wallid}, function (err, blog) {
        var postTexts = blog.postText;
        for (var post in postTexts) {
            if (postTexts[post]._id == postTextId && blog.owner_id == req.session.passport.user) {
                blog.postText[post].canComment = !blog.postText[post].canComment;
                blog.save(function (err, doc) {
                    if (err)console.log(err);
                    res.send(200, "success");
                })
                break;
            }
        }
    })
}


exports.resetComments = function (req, res) {
    var wallid = req.params.wallId;
    var postTextId = req.params.postId;

    Blog.findOne({_id: wallid}, function (err, blog) {
        var postTexts = blog.postText;
        for (var post in postTexts) {
            if (postTexts[post]._id == postTextId && blog.owner_id == req.session.passport.user) {
                blog.postText[post].comments = [];
                blog.save(function (err, doc) {
                    if (err)console.log(err);
                    res.send(200, "success");
                })
                break;
            }
        }

    })
}
exports

function getPostTextValues(blog, type, getProperties) {
    var buffer = [];
    var postTexts = blog.postText;
    var i = 0;
    for (var postText in postTexts) {
        console.log(postTexts[postText].type);
        if (postTexts[postText].postType != type) {
            continue;
        }
        for (var proptoGet in getProperties) {
            if (!buffer[i])
                buffer[i] = {};
            //console.log(getProperties[proptoGet]+" "+postTexts[postText]['embedYouTube']);
            buffer[i][getProperties[proptoGet]] = postTexts[postText][getProperties[proptoGet]];
        }
        i++;
    }
    console.log(buffer);
    return buffer;
}

function getPostText(blog, type, getProp) {
    if (getProp == undefined)getProp = false;
    var buffer = [];
    for (var p = 0; p < blog.postText.length; p++) {
        if (blog.postText[p].postType == type) {
            var prop;
            if (getProp) {
                if (getProp instanceof Array) {
                    var pushdata;
                    for (var pr in getProp) {
                        if (blog.postText[p][getProp[pr]]) {
                            buffer.push(blog.postText[p][getProp[pr]]);
                        }
                    }
                } else {
                    prop = getProp;
                    var pushdata;
                    if (prop == "embedYouTube") {
                        pushdata = blog.postText[p][getProp];
                        //pushdata.str.slice(0, -1);
                        console.log(pushdata)
                    } else {
                        pushdata = blog.postText[p][getProp];
                    }
                    buffer.push(pushdata);
                }
            } else {
                var pushdata;
                //TODO:Verify this code is ok?
                if (getProp == "embedYouTube") {
                    if (blog.postText[p][getProp] == undefined)return buffer;
                    pushdata = blog.postText[p][getProp].slice(0, blog.postText[p][getProp].length);
                    pushdata.slice(0, -1);
                    console.log(pushdata)
                    buffer.push(pushdata);
                } else {
                    buffer.push(blog.postText[p]);
                }
            }
        }
    }
    return buffer;
}

exports.latestEvents = function (req, res) {
    Blog.findOne({_id: req.params.id}).lean().exec(function (err, blog) {
        return res.end(JSON.stringify(getPostText(blog, Common.postTextTypes.event)));
    });
}
//TODO: Add notification when getting invite
//TODO: create invite acceptance system
exports.sendWallInvite = function (req, res) {
    Blog.findOne({author: req.params.wallid}, function (err, blog) {
        User.findOne({_id: req.params.user}, function (err, user) {
            var duplicate = false;
            console.log(user.memwalls)

            for (var x = 0; x < user.memwalls.length; x++) {
                console.log(user.memwalls[x] + " " + blog._id)
                if (user.memwalls[x].toString() == blog._id.toString()) {
                    duplicate = true;
                }
            }
            if (duplicate) {
                res.send(500, 'This user has already been invited.')
                return;
            }
            User.findOne({_id: req.session.passport.user}, function (err, inviter) {
                inviter.invitessent.push(user);
                inviter.save(function (err) {
                    if (err)console.log(err)
                    user.memwalls.push(blog);
                    blog.members.push(user);
                    blog.save(function (err) {
                        if (err)console.log(err);
                    });
                    user.profiles.push({profile: blog._id});//TODO:Remove this in now for backwards compatibility with new style
                    user.save(function (err) {
                        console.log("profile pushed to user" + user.username);
                        res.send(200, 'Success! The user has been included in your network');
                    })
                })
            })

        })
    })
}
//TODO:Remove if has been blocked or self remvoed
exports.getFriendsMemorials = function (req, res) {
    User.find({_id: req.session.passport.user}).populate('memwalls').exec(function (err, user) {
        // Blog.populate(user[0].memwalls, {path: 'user', match: {username: new RegExp(search, "i")}}, function (err, walls) {
        User.populate(user[0].memwalls,{path:'user'},function(err,walls){
            if (err)console.log(err)
            if (!user[0]) {
                return res.send(200, 'none');
            } else {
                //console.log("getting memwalls references")
                var returndata = [];
                var memwalls = user[0].memwalls;

                for (var x = 0; x < memwalls.length; x++) {


                    var awalluser = {};
                    var memwall = memwalls[x];

                    var tempObj = {
                        id: memwall._id,
                        author: memwall.author,
                        firstName: memwall.firstName,
                        lastName: memwall.lastName,
                        title: memwall.title,
                        username:memwall.user.username,
                        pet:memwall.pet,
                        group:memwall.group
                    }
                    returndata.push(tempObj);

                }
                return res.end(JSON.stringify(returndata));
            }
        })



    })
}
exports.getNetwork = function (req, res) {
    User.find({_id: req.session.passport.user}).populate('memwalls').exec(function (err, user) {
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

                for (var x = 0; x < memwalls.length; x++) {

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
                User.findOne({_id:req.session.passport.user},function(err,user)
                {
                    User.find(function(err,users)
                    {
                        for(userl in users)
                        {
                            if(user.lost == users[userl].lost)
                            {
                                var tempObj =
                                {
                                    id: "abc",
                                    author: "abc",
                                    firstName: users[userl].firstName,
                                    lastName: users[userl].lastName,
                                    title: "na",
                                      userid:users[userl]._id,
                                    username:users[userl].username,
                                    online:false
                                };
                                returndata.push(tempObj);
                            }
                        }
                        return res.end(JSON.stringify(returndata));

                    });

                });
            }
        })



    })
}

exports.selfRemove = function (req, res) {
    var wall = req.params.wall;
    User.findOne({_id: req.session.passport.user}, function (err, user) {
        var walls = user.memwalls;
        console.log("compare to " + wall)
        console.log(walls)
        for (var x = 0; x < user.memwalls.length; x++) {
            if (walls[x].toString() == wall.toString()) {
                walls.splice(x, 1);
                console.log("duplicate found " + walls[x] + " slicing x" + x)
                break;
            }
        }
        console.log(walls)
        user.memwalls = walls;
        user.save(function (err) {
            if (err)console.log(err);
            res.send(200, 'works good');
        })
    })
}

exports.block = function (req, res) {
    var wall = req.params.wallid;
    Blog.findOne({author: req.params.wallid}, function (err, blog) {
        User.findOne({_id: req.params.user}, function (err, user) {
            var profiles = user.profiles;
            console.log(user.profiles);
            var x = 0;
            for (var profile in profiles) {
                if (profile.profile == blog._id) {
                    profile.splice(x, 1);
                }
                x++;
            }
            user.profiles = profiles;
            console.log(user.profiles);
            user.save(function (err) {
                console.log("profile removed to user" + user.username);
            })
        });
    })
}

exports.selfremove = function (req, res) {
    var wall = req.params.id;
    User.findOne({_id: req.sessions.passport.user}, function (err, user) {
        var profiles = user.profiles;
        var x = 0;
        for (var profile in profiles) {
            if (profiles[profile].profile == wall) {
                profiles.slice(x, 1);
            }
            x++;
        }
        user.profiles = profiles;
        user.save(function (data) {

        })
    })
}
//TODO:store any invitations sent
//TODO:do not allow message to be sent to user before accepted invite
//TOOD: can not send message to people you invited only if you have been invited
exports.usersInNetwork = function (req, res) {
    console.log(req.params.search)
    var search = req.params.search;
    //get all the blogs that are in this user profiles memwalls array then find all the blogs
    //in the memwalls that match the user name search passed by user
    //invitations sent to us
    User.find({_id: req.session.passport.user}).populate('memwalls').exec(function (err, user) {
        var returnData = [];
        Blog.populate(user[0].memwalls, {path: 'user', match: {username: new RegExp(search, "i")}}, function (err, walls) {

            for (var x = 0; x < walls.length; x++) {
                if (!walls[x].user) {

                } else {
                    //console.log(walls[x].user.email)
                    /*
                     var tempObj = {
                     email:walls[x].user.email,
                     username:walls[x].user.username,
                     firstname:walls[x].user.firstName,
                     lastname:walls[x].user.lastName

                     };
                     returnData.push(tempObj);
                     */
                    //returnData.push(walls[x].user.email);
                    returnData.push(walls[x].user.username + ": " + walls[x].user.firstName + " " + walls[x].user.lastName);
                    //returnData.push(walls[x].user.firstName);
                    //returnData.push(walls[x].user.lastName);

                }

            }
            //invitations we sent
            console.log(search)
            //User.populate(user[0].invitessent,{path:'invitessent',match:{username:new RegExp(search,'i')}},function(err,invited){
            User.find({_id: req.session.passport.user}).
                populate({path: 'invitessent',
                    match: {$or: [
                        {firstName: new RegExp(search, "i")},
                        {username: new RegExp(search, "i")},
                        {lastName: new RegExp(search, "i")}
                    ]}
                }).exec(function (err, invited) {
                    console.log("Invited")
                    //console.log(invited[0].invitessent.username)
                    for (var y = 0; y < invited[0].invitessent.length; y++) {
                        //returnData.push(invtited[y].username+": "+invited[y].firstName+" "+invited[y].lastName)
                        console.log(invited[0].invitessent[y].username)
                        returnData.push(invited[0].invitessent[y].username + ': ' + invited[0].invitessent[y].firstName + ' ' + invited[0].invitessent[y].lastName)
                    }
                    //console.log(returnData)
                    res.end(JSON.stringify(returnData));
                })


        })
    })
}
exports.usersInNetworkAll = function (req, res) {
    //TODO:get all users of blogs that belong to???
    //right now just getting all the users invited by
    //get all the blogs that are in this user profiles memwalls array then find all the blogs
    //in the memwalls that match the user name search passed by user
    //invitations sent to us
    User.find({_id: req.session.passport.user}).populate('memwalls').exec(function (err, user) {
        var returnData = [];
        Blog.populate(user[0].memwalls, {path: 'user'}, function (err, walls) {

            for (var x = 0; x < walls.length; x++)
            {
                if (!walls[x].user)
                {

                } else
                {
                    returnData.push(walls[x].user);
                }
            }
            //invitations we sent
            //console.log(search)
            User.find({_id: req.session.passport.user}).
                populate({path: 'invitessent'
                    //match:{$or:[{firstName:new RegExp(search,"i")},{username:new RegExp(search,"i")},{lastName:new RegExp(search,"i")}]}
                }).exec(function (err, invited) {
                    console.log("Invited")
                    //console.log(invited[0].invitessent.username)
                    for (var y = 0; y < invited[0].invitessent.length; y++)
                    {
                        console.log(invited[0].invitessent[y].username)
                        returnData.push(invited[0].invitessent[y])
                    }
                    //console.log(returnData)
                    res.end(JSON.stringify(returnData));
                })


        })
    })


}

exports.subscribed = function (req, res) {
    var blogId = req.params.id;
    console.log(blogId);
    Blog.findOne({author: blogId}, function (err, blog) {
        console.log(blog._id);
        User.find({profiles: {$elemMatch: {profile: blog._id}}}, function (err, users) {
            console.log(users);
            res.send(JSON.stringify(users));
        })
    })
}

exports.subscribedto = function (req, res) {
    var blogId = req.params.id;
    console.log(blogId);
    //TODO:Ask rodney about what this should be... not friends but people on your walls??
    //we have no "friends perse"
    Blog.findOne({author: blogId}, function (err, blog) {
        console.log(blog._id);
    })
}

exports.getInvitedGroup = function (req, res) {
    User.findOne({_id: req.session.passport.user}).populate('memwalls').exec(function (err, usr) {
        if (!usr)return;
        Blog.populate(usr.memwalls, {path: 'user'}, function (err, walls) {
            var buffer = [];
            for (var i = 0; i < walls.length; i++) {
                if (walls[i].group == true) {
                    //console.log(walls[i].user)
                    if (!walls[i].user) {
                        //console.log("null user detected")
                    } else {
                        console.log(walls[i].author)
                        if (walls[i].user == null)walls[i].user = {}
                        var groupinfo = {
                            name: walls[i].firstName + " " + walls[i].lastName,
                            owner: walls[i].user.firstName + " " + walls[i].user.lastName,
                            moderator: "",
                            author: walls[i].author,
                            id: walls[i]._id
                        }
                        buffer.push(groupinfo);
                    }

                } else {
                    console.log("nota a group")
                }
            }
            res.end(JSON.stringify(buffer));
        })

    })
}

exports.getInviteBlogUserData = function (req, res) {
    var id = req.params.wallid;
    User.findOne({_id: req.session.passport.user}, function (err, user) {
        //ensure the user is authorised to see this blog data
        Blog.find({'author': id}).populate('members').exec(function (err, post) {
            if (post === undefined)return res.send(404);
            if (user != null) {
                if (post[0].owner_id == req.session.passport.user) {
                    matchfound = true
                } else {
                    for (var x = 0; x < user.profiles.length; x++) {
                        console.log(user.profiles[x].profile);

                        if (user.profiles[x].profile == null) {

                        } else {
                            console.log(user.profiles[x].profile);
                            if (post[0]._id == user.profiles[x].profile) {
                                matchfound = true;
                            }
                        }
                    }


                }
            }
            if (process.env.NODE_ENV == "production") {
                console.log("WE are in production so setting privacy on mem walls");
            } else {
                console.log("not production so all walls are public for convinience");
                // matchfound = true;
            }

            if (post == undefined) {
                return res.send(200);
            }

            if (matchfound == true) {
                post.limited = false;
                return res.end(JSON.stringify(post[0].members));
            } else {
            }
        });
    })
}

exports.shopToWall = function (req, res) {
    console.log("testing shopt to wall");
    var wall = req.params.wall;//receiving wall and user
    var anni = req.params.user;//person sending
    var name = [3];
    var qty = [3];
    var more;
    //get the gift name paramters and unescape them from raw url form into human readable form
    name[0] = unescape(req.params.iname);
    name[1] = unescape(req.params.i2name);
    name[2] = unescape(req.params.i3name);
//gift quantities
    qty[0] = req.params.iqty;
    qty[1] = req.params.i2qty;
    qty[2] = req.params.i3qty;

    more = req.params.more;

//int and concatenate the gifts string which is the string with all the gift data
    //format of qty of giftname ex: 3 of candy boxes
    //TODO:Needs better formating
    var gifts = "";
    for (var n in name) {
        console.log(qty[n]);
        if (name[n] == 0)break;
        gifts += qty[n] + ' of ' + name[n];
    }

    console.log(gifts);
    //email the wall owner that someone bought them a gift
    //the user who sent the gift
    User.findOne({_id: req.session.passport.user}, function (err, theuser) {
        if (!theuser)return;
        //find the wall to send the gift too and update latest text and angel annivesaries
        Blog.findOne({_id: wall}, function (err, theblog) {
            if (!theblog)return;
            if (err)console.log(err);
            //console.log(theblog.postText)
            SendGiftNotice(theuser.email, theuser.firstName + " " + theuser.lastName, theblog.firstName + " " + theblog.lastName);
            //add entry in anniversary area and latestpost
            theblog.postText.push({
                user_id: theuser._id,
                username: theuser.username,
                event: "GiftSent",
                gravatar: theuser.email,
                text: theuser.username + " bought " + gifts + " for the angel " + theblog.firstName + " " + theblog.lastName,
                postType: 0
            });
            theblog.postText.id(anni).gifts.push({
                postText: theuser.username + " bought " + gifts + " for the angel " + theblog.firstName + " " + theblog.lastName,
                fromUser: theuser.username
            })
            console.log(theblog._id);
            console.log(theblog)
            /* var annidoc = theblog.anniverssaryDays.id(anni);
             console.log(annidoc);
             annidoc.gifts.create({postText:theuser.username+" bought "+gifts+" for the angel "+theblog.firstName+" "+theblog.lastName,fromUser:theuser.username});
             if(!annidoc.gifts)return;
             //theblog.anniverssaryDays.push({description:"Gifted",event:"Gifted",data:Date.now()});
             */
            User.findOne({_id: theblog.owner_id}, function (err, receivingUser) {
                receivingUser.notifications.push({text: "Your angel " + theblog.firstName + " " + theblog.lastName + "has received a gift."});
                SendEmail(receivingUser.email, receivingUser.firstName + " " + receivingUser.lastName, "<p>" + theuser.username + " has bought you a gift.  Go to your memorial wall or group page on The Circle of Life at <a href='http://thecircleof.life/#/'" + theblog.author + " to find out what it was.</p>");

                //add entry in anniversary area and latestpost

                receivingUser.save(function (err, saveddoc) {
                    if (err)console.log(err);
                    messageEmitter.emit('notification_messagereceived', theblog.owner_id, "Your angel " + theblog.firstName + " " + theblog.lastName + "has received a gift.", saveddoc.notifications[saveddoc.notifications.length - 1]._id);
                })
            })
            theblog.save(function (err) {
                if (err)console.log(err);
                theuser.notifications.push({text: "Thank you for purchasing a gift(s) at AngelsOfEureka.com."});
                theuser.save(function (err, saveddoc) {
                    if (err)console.log(err);
                    //console.log(saveddoc)
                    messageEmitter.emit('notification_messagereceived', theuser._id, "Thank you for purchasing a gift(s)s at AngelsOfEureka.com.", saveddoc.notifications[saveddoc.notifications.length - 1]._id);
                    messageEmitter.emit('shoptowall_giftreceived', wall);
                })
            })
        })
        return res.send(200, "return this");

    })
    //add data max 3 items that someone bought something for someone on the site

}
/*

exports.sendAboutMail = function (req, res) {
    console.log(req.body.name);
    var post = req.body;
    var fName = post.name
        , lName = post.lastname
        , eMail = post.email
        , address = post.address
        , phoneNo = post.pnumber
        , city = post.city
        , state = post.state
        , zCode = post.zcode
        , message = post.message;

     console.log("mail sent")
    var options = {
        root: path.join(path.resolve('.'), "templates")
        // any other swig options allowed here
    };

    emailTemplates(options, function (err, render, generateDummy) {
        var context = {
              fName : fName
            , lName : lName
            , eMail : eMail
            , address : address
            , phoneNo : phoneNo
            , city :city
            , state : state
            , zCode : zCode
            , message : message
        };


        render('sendAbout.html', context, function (err, html) {
            // send html email
            var mailOptions = {
                from: "noreply@AngelsOfEureka.org",
                to: "raygarner13@gmail.com",
                subject: "YOU GOT MAIL from a user of angels.",
                text: "",
                html: html
            }
            smtpTransport.sendMail(mailOptions, function (error, response) {
                if (error) {
                    console.log(error);
                    console.log("problems sending mail");
                    res.send(200,"failed");
                    return false;
                } else {
                    console.log("message sent");
                    res.send(200,"success");
                    return true;
                }
                console.log(response);
            })
        });

    });

}
*/
function SendGiftNotice(to, user, wall, gifts) {
    var mailOptions = {
        from: "noreply@AngelsOfEureka.org",
        to: to,
        subject: "Someone sent you a gift",
        html: "<p>" + user + " has bought you a gift.  Go your wall to find out what it was {url}.</p>"
    }
    smtpTransport.sendMail(mailOptions, function (error, response) {
        if (error) {
            console.log(error);
            console.log("problems sending mail")
        } else {
            console.log("message sent")
        }
        console.log(response);
    })
}
function SendEmail(to, user, htmlMessage,subject) {
    if(!subject)subject = "Someone sent you a gift";
    var mailOptions = {
        from: "noreply@AngelsOfEureka.org",
        to: to,
        subject:subject,
        html: htmlMessage
    }
    smtpTransport.sendMail(mailOptions, function (error, response) {
        if (error) {
            console.log(error);
            console.log("problems sending mail")
        } else {
            console.log("message sent")
        }
        console.log(response);
    })
}

/*
 * A JavaScript implementation of the RSA Data Security, Inc. MD5 Message
 * Digest Algorithm, as defined in RFC 1321.
 * Copyright (C) Paul Johnston 1999 - 2000.
 * Updated by Greg Holt 2000 - 2001.
 * See http://pajhome.org.uk/site/legal.html for details.
 */

/*
 * Convert a 32-bit number to a hex string with ls-byte first
 */
var hex_chr = "0123456789abcdef";
function rhex(num) {
    str = "";
    for (j = 0; j <= 3; j++)
        str += hex_chr.charAt((num >> (j * 8 + 4)) & 0x0F) +
            hex_chr.charAt((num >> (j * 8)) & 0x0F);
    return str;
}

/*
 * Convert a string to a sequence of 16-word blocks, stored as an array.
 * Append padding bits and the length, as described in the MD5 standard.
 */
function str2blks_MD5(str) {
    nblk = ((str.length + 8) >> 6) + 1;
    blks = new Array(nblk * 16);
    for (i = 0; i < nblk * 16; i++) blks[i] = 0;
    for (i = 0; i < str.length; i++)
        blks[i >> 2] |= str.charCodeAt(i) << ((i % 4) * 8);
    blks[i >> 2] |= 0x80 << ((i % 4) * 8);
    blks[nblk * 16 - 2] = str.length * 8;
    return blks;
}

/*
 * Add integers, wrapping at 2^32. This uses 16-bit operations internally
 * to work around bugs in some JS interpreters.
 */
function add(x, y) {
    var lsw = (x & 0xFFFF) + (y & 0xFFFF);
    var msw = (x >> 16) + (y >> 16) + (lsw >> 16);
    return (msw << 16) | (lsw & 0xFFFF);
}

/*
 * Bitwise rotate a 32-bit number to the left
 */
function rol(num, cnt) {
    return (num << cnt) | (num >>> (32 - cnt));
}

/*
 * These functions implement the basic operation for each round of the
 * algorithm.
 */
function cmn(q, a, b, x, s, t) {
    return add(rol(add(add(a, q), add(x, t)), s), b);
}
function ff(a, b, c, d, x, s, t) {
    return cmn((b & c) | ((~b) & d), a, b, x, s, t);
}
function gg(a, b, c, d, x, s, t) {
    return cmn((b & d) | (c & (~d)), a, b, x, s, t);
}
function hh(a, b, c, d, x, s, t) {
    return cmn(b ^ c ^ d, a, b, x, s, t);
}
function ii(a, b, c, d, x, s, t) {
    return cmn(c ^ (b | (~d)), a, b, x, s, t);
}

/*
 * Take a string and return the hex representation of its MD5.
 */
function calcMD5(str) {
    x = str2blks_MD5(str);
    a = 1732584193;
    b = -271733879;
    c = -1732584194;
    d = 271733878;

    for (i = 0; i < x.length; i += 16) {
        olda = a;
        oldb = b;
        oldc = c;
        oldd = d;

        a = ff(a, b, c, d, x[i + 0], 7, -680876936);
        d = ff(d, a, b, c, x[i + 1], 12, -389564586);
        c = ff(c, d, a, b, x[i + 2], 17, 606105819);
        b = ff(b, c, d, a, x[i + 3], 22, -1044525330);
        a = ff(a, b, c, d, x[i + 4], 7, -176418897);
        d = ff(d, a, b, c, x[i + 5], 12, 1200080426);
        c = ff(c, d, a, b, x[i + 6], 17, -1473231341);
        b = ff(b, c, d, a, x[i + 7], 22, -45705983);
        a = ff(a, b, c, d, x[i + 8], 7, 1770035416);
        d = ff(d, a, b, c, x[i + 9], 12, -1958414417);
        c = ff(c, d, a, b, x[i + 10], 17, -42063);
        b = ff(b, c, d, a, x[i + 11], 22, -1990404162);
        a = ff(a, b, c, d, x[i + 12], 7, 1804603682);
        d = ff(d, a, b, c, x[i + 13], 12, -40341101);
        c = ff(c, d, a, b, x[i + 14], 17, -1502002290);
        b = ff(b, c, d, a, x[i + 15], 22, 1236535329);

        a = gg(a, b, c, d, x[i + 1], 5, -165796510);
        d = gg(d, a, b, c, x[i + 6], 9, -1069501632);
        c = gg(c, d, a, b, x[i + 11], 14, 643717713);
        b = gg(b, c, d, a, x[i + 0], 20, -373897302);
        a = gg(a, b, c, d, x[i + 5], 5, -701558691);
        d = gg(d, a, b, c, x[i + 10], 9, 38016083);
        c = gg(c, d, a, b, x[i + 15], 14, -660478335);
        b = gg(b, c, d, a, x[i + 4], 20, -405537848);
        a = gg(a, b, c, d, x[i + 9], 5, 568446438);
        d = gg(d, a, b, c, x[i + 14], 9, -1019803690);
        c = gg(c, d, a, b, x[i + 3], 14, -187363961);
        b = gg(b, c, d, a, x[i + 8], 20, 1163531501);
        a = gg(a, b, c, d, x[i + 13], 5, -1444681467);
        d = gg(d, a, b, c, x[i + 2], 9, -51403784);
        c = gg(c, d, a, b, x[i + 7], 14, 1735328473);
        b = gg(b, c, d, a, x[i + 12], 20, -1926607734);

        a = hh(a, b, c, d, x[i + 5], 4, -378558);
        d = hh(d, a, b, c, x[i + 8], 11, -2022574463);
        c = hh(c, d, a, b, x[i + 11], 16, 1839030562);
        b = hh(b, c, d, a, x[i + 14], 23, -35309556);
        a = hh(a, b, c, d, x[i + 1], 4, -1530992060);
        d = hh(d, a, b, c, x[i + 4], 11, 1272893353);
        c = hh(c, d, a, b, x[i + 7], 16, -155497632);
        b = hh(b, c, d, a, x[i + 10], 23, -1094730640);
        a = hh(a, b, c, d, x[i + 13], 4, 681279174);
        d = hh(d, a, b, c, x[i + 0], 11, -358537222);
        c = hh(c, d, a, b, x[i + 3], 16, -722521979);
        b = hh(b, c, d, a, x[i + 6], 23, 76029189);
        a = hh(a, b, c, d, x[i + 9], 4, -640364487);
        d = hh(d, a, b, c, x[i + 12], 11, -421815835);
        c = hh(c, d, a, b, x[i + 15], 16, 530742520);
        b = hh(b, c, d, a, x[i + 2], 23, -995338651);

        a = ii(a, b, c, d, x[i + 0], 6, -198630844);
        d = ii(d, a, b, c, x[i + 7], 10, 1126891415);
        c = ii(c, d, a, b, x[i + 14], 15, -1416354905);
        b = ii(b, c, d, a, x[i + 5], 21, -57434055);
        a = ii(a, b, c, d, x[i + 12], 6, 1700485571);
        d = ii(d, a, b, c, x[i + 3], 10, -1894986606);
        c = ii(c, d, a, b, x[i + 10], 15, -1051523);
        b = ii(b, c, d, a, x[i + 1], 21, -2054922799);
        a = ii(a, b, c, d, x[i + 8], 6, 1873313359);
        d = ii(d, a, b, c, x[i + 15], 10, -30611744);
        c = ii(c, d, a, b, x[i + 6], 15, -1560198380);
        b = ii(b, c, d, a, x[i + 13], 21, 1309151649);
        a = ii(a, b, c, d, x[i + 4], 6, -145523070);
        d = ii(d, a, b, c, x[i + 11], 10, -1120210379);
        c = ii(c, d, a, b, x[i + 2], 15, 718787259);
        b = ii(b, c, d, a, x[i + 9], 21, -343485551);

        a = add(a, olda);
        b = add(b, oldb);
        c = add(c, oldc);
        d = add(d, oldd);
    }
    return rhex(a) + rhex(b) + rhex(c) + rhex(d);
}
