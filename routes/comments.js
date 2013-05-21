var models = require('../models/models');
var Blog = models.Blog;
var User = models.User;
var update = models.Update;

exports.comments = function (req) {
    Blog.findOne({_id: req.body.id}, function (err, blog) {
        blog.comments.unshift({body: req.body.body, date: Date.now()});
        blog.save(function (err, blog) {
            if (err)console.log(err);
            var update = new Update();
            update.save(function(err,update){if(err)console.log(err);});
        })
    })
};
exports.subcomment = function (req,res) {
    Blog.findOne({_id: req.body.id}, function (err, blog) {
        var doc = blog.postText.id(req.body.comment_id);
        doc.comments.unshift({text: req.body.text, date: Date.now()});
        blog.save(function (err, blog) {
            if (err)console.log(err);
            res.send(200);
        })
    })
};