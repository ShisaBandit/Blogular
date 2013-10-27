var models = require('../models/models');
var Common = require('../constants/constants.js')
var Petition = models.Petition;
var User = models.User;
var Update = models.Update;

exports.getAllPetitionsForUser = function(req,res){
        console.log("GETTING PETITIONS")
    Petition.find({owner:req.session.passport.user},function(err,petitions){
        res.end(JSON.stringify(petitions));
        return;
        console.log(petitions)
    })
}

exports.updatePetition = function (req,res) {
    Petition.findOneAndUpdate({_id:req.body.id},req.body, function (err,updateddoc) {
        if(err)console.log(err)
        console.log(updateddoc)
    })
}

exports.deletePetition = function (req,res) {
    Petition.findOneAndRemove({_id:req.params.id}, function (err) {
        if(err)console.log(err)
        return res.send(200,'allok');
    });
}

exports.allPetitions = function (req, res) {
    // var skip = req.params.skip,
    //   limit = req.params.limit;
    Petition.find({}, {}, {skip: 0, limit: 3}).lean().exec(function (err, posts) {
        //limit this to only what is needed for the memorial main wall
        return res.end(JSON.stringify(posts));
    });
};

exports.getPaginatedPetitions= function (req, res) {
    var skip = req.params.skip,
        limit = req.params.limit;
    console.log(skip, limit);
    Petition.find({}, {}, {skip: skip, limit: limit}).lean().exec(function (err, posts) {
        //TODO:return only what we need for the memorial wall view
        return res.end(JSON.stringify(posts));
    });
};

exports.createData = function (req, res) {
    var title = req.body.title;
                     getModelInstance("Blog");
        var newData= new Petition(req.body);
        newPetition(function (err) {
            if (err)console.log(err);
        });
        return res.end(JSON.stringify({'success': 'true'}));
}

function getModelInstance(name){
               for(model in models){
                   console.log(models[model]);
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