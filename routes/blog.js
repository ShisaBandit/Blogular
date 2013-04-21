var models = require('../models/models');
var Blog = models.Blog;
var User = models.User;
var Update = models.Update;
/*
 * GET home page.
 */

exports.allBlogs = function(req, res){
        var skip = req.params.skip,
            limit = req.params.limit;
        Blog.find({},{},{skip:0,limit:3}).lean().exec(function (err, posts) {
            return res.end(JSON.stringify(posts));
        });
};

exports.getPaginatedBlogs = function(req, res){
    var skip = req.params.skip,
        limit = req.params.limit;
    console.log(skip,limit);
    Blog.find({},{},{skip:skip,limit:limit}).lean().exec(function (err, posts) {
        return res.end(JSON.stringify(posts));
    });
};

exports.getABlog = function(req,res){
    var id = req.params.id;
    Blog.find({'_id': id}).lean().exec(function (err, post) {
        return res.end(JSON.stringify(post));
    });
}
//TODO:verify and test this functionality.
exports.getLastBlogUpdateDate = function(req,res){
    var id = req.params.id;
    Blog.find({'_id': id}).lean().exec(function (err, post) {
        return res.end(JSON.stringify(post.updateDate));
    });
}

exports.createBlog = function(req,res){
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

exports.updateBlog = function(req,res){
    //Updates whatever blog is sent to it
    //break this up into updateBlog and updateComment/addComment
    delete req.body._id;
    User.findOne({username: req.user[0]._doc.username}, function (err, user) {
        loggedInUser = user;
        (loggedInUser);
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
                if(doc.comments == undefined || doc.comments.length < 1){
                    //do nothing for now
                    doc.updateDate = Date.now();
                }else{
                    doc.comments[0].username = user.username;
                }

                doc.save(function (err, doc) {
                    if (err)console.log(err);
                    res.end(JSON.stringify(doc));
                });
                var update = new Update();
                update.save(function(err,update){if(err)console.log(err);});
            });
        }

    });

}

exports.deleteBlog = function(req,res){
    Blog.remove({'_id': req.params.id}, function (err) {
        if (err)
            console.log(err);
        update.save(function(err,update){if(err)console.log(err);});

    });
}

exports.addBlogEntry = function(req,res){
    var newBlogEntry = new Blog(req.body);
    newBlogEntry.save(function (err) {
        if (err)console.log(err);
    });
    return res.end(JSON.stringify({'success': 'true'}));
}

exports.addTextPost = function(req,res){
        console.log(req.body);
  Blog.findOne({_id:req.body.id},function(err,blog){
      if(err)console.log(err);
        console.log("MIKE CHECK ");
      blog.postText.push(req.body);
      blog.save(function(err,doc){
          if(err)console.log(err);
          console.log("saved textpost");

          console.log(doc);
      });
  });
}

exports.addPicPost = function(req,res){
    console.log(req.body);
    Blog.findOneAndUpdate({_id:req.body.id},function(err,blog){
        console.log("MIKE CHECK ");
        blog.postText.push(req.body);
    });
}

exports.addVideoPost = function(req,res){
    console.log(req.body);
    Blog.findOneAndUpdate({_id:req.body.id},function(err,blog){
        console.log("MIKE CHECK ");
        blog.postText.push(req.body);
    });
}


exports.lastestPosts = function(req,res){
    console.log(req.params.id);
    var skip = req.params.skip,
        limit = req.params.limit;
    console.log(skip,limit);
    Blog.findOne({_id:req.params.id}).lean().exec(function (err, blog) {

                 return res.end(JSON.stringify(blog.postText.reverse()));

    });
}