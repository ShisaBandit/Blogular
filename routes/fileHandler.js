var fs = require('fs');
var models = require('../models/models');
var Blog = models.Blog;
exports.upload = function (req, res) {
    var name = req.files.file.name;
    fs.readFile(req.files.file.path, function (err, data) {
        var newPath = global.__approot + "/public/uploads/" + name;
        console.log(req.body);
        fs.writeFile(newPath, data, function (err) {
            if (err){
                console.log(err);
                res.send(401, 'error');
                return;
            }
            //res.send(200,{'success': 'true'});
            Blog.findOne({_id: req.body.memwall}, function (err, blog) {
                //TODO:check and normalize file name ensure no duplicate names

                //1. Put all incoming files into a orphanded files list.    CHECK

                //2. if=> submit is pushed.. move files to proper profilememwall and posttext
                //3. if=> cancel is pusshed ... find and delete files from the orphaned list
                //4. will clean all orphaned files every 24 hours or so to ensure no unneeded files stay
                if(!blog.orphanedphotos == null){
                    for(var o = 0;o<blog.orphanedphotos.length;o++){
                        if(blog.orphanedphotos[o].filename == req.files.file.name){
                            res.send(404,'already file by that name');
                            return;
                        }
                    }
                }

                blog.orphanedphotos.push({filename: req.files.file.name, uploader: req.session.passport.user});
                blog.save(function () {
                    console.log('orphanedfiles saved name:' + req.files.file.name + ' uploaded by : ' + req.session.passport.user);
                    res.send(200,'OK');

                });
            })
        });
    });
};
exports.uploadportrait = function (req, res) {
    var name = req.files.file.name;
    fs.readFile(req.files.file.path, function (err, data) {
        var newPath = global.__approot  + "/public/uploads/" + name;
        fs.writeFile(newPath, data, function (err) {
            if(err)res.send(401,'error');
            Blog.findOne({_id:req.body.blogId},function(err,blog){
                blog.profilePicPortrait = name;
                blog.save(function(err){
                    if(err)console.log(err);
                })
            });
            res.redirect("back");
        });
    });
};
exports.uploadspread= function (req, res) {
    var name = req.files.file.name;
    fs.readFile(req.files.file.path, function (err, data) {
        var newPath = global.__approot  + "/public/uploads/" + name;
        fs.writeFile(newPath, data, function (err) {
            if(err)res.send(401,'error');
            Blog.findOne({_id:req.body.blogId},function(err,blog){
               blog.profilePicWide = name;
                blog.save(function(err){
                    if(err)console.log(err);
                })
            });
            res.redirect("back");
        });
    });
};
exports.submitphotodata = function (req, res) {
    var photoForPostText = [];
    var photos = req.body.files;
    console.log(req.body.id);
    if(photos.length>0){
        //get the blog
        Blog.findOne({_id: req.body.id}, function (err, blog) {
            console.log(blog);
            //looping through files that are requested to be saved
            for (var x = 0; x < photos.length; x++) {
                console.log(blog);
                //if we have foudn a blog
                if (blog) {
                    //loop throu all the uploaded files to this memwall
                    console.log(blog.orphanedphotos);
                    for (var i = 0; i < blog.orphanedphotos.length; i++) {
                        console.log(blog.orphanedphotos[i]);
                        //check if the file already is in the orphaned files if yes add it to
                        //an array of files to be added to a new post(photo) text entry
                        if (blog.orphanedphotos[i].filename == photos[x].name) {
                            photoForPostText.push(blog.orphanedphotos[i]);
                        }
                    }
                }
            }
            /*
            //check if there are any postTexts or photos
            if(blog.postText == undefined || blog.postText.photos === undefined){
            }else{
                //TODO:outer loop should be potTexts

                //if there are photos loop through them
                for(var o = 0;o<blog.postText.photos.length;o++){
                    // the inner loop should loop through all the files user is trying to add
                    //to this post text
                    for(var p  = 0; p< photoForPostText.length;p++){
                        //check
                        if(blog.postText.photos[o].filename == photoForPostText[p].name){
                            photoForPostText.splice(p,1);
                            p--;
                        }
                    }

                }
            }
              */
            blog.postText.push({postType: 1, user_id: req.session.passport.user, text: ""});
            var lastPostTextIndex = blog.postText.length;
            for (photo in photoForPostText) {
                console.log(photoForPostText[photo]);
                blog.postText[blog.postText.length-1].photos.push(
                    {filename:photoForPostText[photo].name,uploader:req.session.passport.user}
                );
            }
            blog.save(function(){
                console.log("saved");
                console.log(blog);
            })
            res.send(200);
        })
    }else{
        res.send(200);
    }


    //TODO:take the files array loop through each file
    //find the currrent profile and a new posttext
    //add the files data to thie post text files data.
    //attach to any albums if selected and
    //save

};

exports.getPicsForBlog = function(req,res){
    var pics = [];
    Blog.findOne({_id:req.params.id},function(err,blog){
        console.log(blog.postText);
        /*
        console.log(blog.orphanedphotos);
             for(var i  = 0;i<blog.postText.length;i++){
                for(var x = 0;x<blog.postText[i].photos.length;x++){
                    pics.push(blog.postText[i].photos[x]);
                }
             }
             */
        res.end(JSON.stringify(blog.orphanedphotos));
       })
}

exports.cancelphotodata = function (req, res) {
    //TODO:loop through files array
    //find the files in orphaned files remove it from the orphaned files
    //finished
}

exports.createNewAlbum = function(req,res){
    //  var blogid = req.params.id;
      console.log(req.params);

    Blog.findOne({_id:req.params.id},function(err,blog){
        var newAlbum = req.body.name;
        var photoToPush = [];
        for(var pic in req.body.pics){
            photoToPush.push({filename:req.body.pics[pic].filename});
            console.log(req.body.pics[pic])
        }
        //console.log(blog.albums);
        blog.albums.push({name:newAlbum,photos:photoToPush});
        blog.save(function(err){
            if(err)console.log(err);
            res.send(200,"success");
        });
    })
}

exports.updateAlbum = function(req,res){
    Blog.findOne({_id:req.params.id},function(err,blog){
        var album = blog.albums.id(req.body.albumid);

        for(var pic in req.body.pics){
            album.photos.push({filename:req.body.pics[pic].filename});
        }
        blog.save(function(err){
            if(err)console.log(err);
            res.send(200,"success");
        })
    })
}

exports.albums = function(req,res){
    var blog = req.params.id;
    Blog.findOne({_id:blog},function(err,blog){
        res.end(JSON.stringify(blog.albums));
    })
}

exports.showAlbum = function(req,res){
    var albumid = req.params.albumid;
    Blog.findOne({_id:req.params.id},function(err,blog){
        var albdoc = blog.albums.id(albumid);
        res.end(JSON.stringify(albdoc.photos));
    })
}