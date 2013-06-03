var models = require('../models/models');
var Common = require('../constants/constants.js')
var Blog = models.Blog;
var User = models.User;
var Update = models.Update;
var PICTYPE = 1;
var VIDEOTYPE = 2;

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

exports.getABlog = function (req, res) {
    var id = req.params.id;

    User.findOne({_id: req.session.passport.user}, function (err, user) {
        var matchfound = false;
        if (err)console.log(err);

        Blog.find({'author': id}).lean().exec(function (err, post) {
            if (post === undefined)return res.send(404);
            if (user != null) {

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
            if(true){//TODO:Remove commented line this should not always be true!"!!!//if(process.env.NODE_ENV == "production"){
                console.log("WE are in production so setting privacy on mem walls");
                matchfound = true; 
            }else{
                console.log("not production so all walls are public for convinience");
                matchfound = true;
            }

            if (post == undefined) {
                return res.send(200);
            }

            if (matchfound == true) {
                post.limited = false;
                return res.end(JSON.stringify(post));

            } else {

                var modifiedpost = [];
                var modifiedpostentry = {};
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
        //return res.send(user[0].username, 200);
    })

};
//TODO:verify and test this functionality.
exports.getLastBlogUpdateDate = function (req, res) {
    var id = req.params.id;
    Blog.find({'_id': id}).lean().exec(function (err, post) {
        return res.end(JSON.stringify(post.updateDate));
    });
};

exports.createBlog = function (req, res) {
    var title = req.body.title;
    //noinspection JSValidateTypes
    if (title === '' || title === null || title === undefined)return res.send('need a title', 404);
    else {

        var newBlogEntry = new Blog(req.body);
        newBlogEntry.save(function (err) {
            if (err)console.log(err);
        });
        return res.end(JSON.stringify({'success': 'true'}));
    }
}

exports.updateBlog = function (req, res) {
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
            Blog.findOneAndUpdate({'_id': req.params.id}, req.body, function (err, doc) {
                if (err) {
                    console.log(err);
                    res.end(JSON.stringify({result: 'error'}));
                }
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

}

exports.deleteBlog = function (req, res) {
    Blog.remove({'_id': req.params.id}, function (err) {
        if (err)
            console.log(err);
        update.save(function (err, update) {
            if (err)console.log(err);
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
        blog.postText.push(req.body);
        blog.save(function (err, doc) {
            if (err)console.log(err);
            console.log("saved textpost");

            return res.end(JSON.stringify({'success': 'true'}));

        });
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
        blog.postText.push(req.body);
        blog.save(function(err,doc){
            console.log(err);
        })
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

exports.latestVideos = function (req, res) {
    console.log(req.params.id);
    var skip = req.params.skip,
        limit = req.params.limit;
    console.log(skip, limit);
    Blog.findOne({_id: req.params.id}).lean().exec(function (err, blog) {
            return res.end(JSON.stringify(getPostText(blog,Common.postTextTypes.video,"text")));
    });
}
function getPostText(blog,type,getProp){
    if(getProp == undefined)getProp = false;
    var buffer = [];
    for(var p = 0;p<blog.postText.length;p++){
        if(blog.postText[p].postType == type){
            var prop;
            if(getProp == true){
                     prop = getProp;
                buffer.push(blog.postText[p][getProp]);
            }else{
                buffer.push(blog.postText[p]);
            }
        }
    }
    return postTexts;
}