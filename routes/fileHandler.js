var fs = require('fs');
var models = require('../models/models');
var Blog = models.Blog;
exports.upload = function (req, res) {
    var name = req.files.file.name;
    fs.readFile(req.files.file.path, function (err, data) {
        var newPath = global.__approot + "/public/uploads/" + name;
        console.log(req.body);
        fs.writeFile(newPath, data, function (err) {
            if(err)console.log(err);res.send(401,'error');
            //res.send(200,{'success': 'true'});
            Blog.findOne({_id:req.body.memwall},function(err,blog){
                  //TODO:check and normalize file name ensure no duplicate names
                //1. Put all incoming files into a orphanded files list.    CHECK
                //2. if=> submit is pushed.. move files to proper profilememwall and posttext
                //3. if=> cancel is pusshed ... find and delete files from the orphaned list
                //4. will clean all orphaned files every 24 hours or so to ensure no unneeded files stay
                blog.orphanedphotos.push({filename:req.files.file.name,uploader:req.session.passport.user});
                blog.save(function(){
                    console.log('orphanedfiles saved name:'+req.files.file.name+' uploaded by : '+req.session.passport.user);
                });
            })
            res.redirect('back');
        });
    });
};
exports.submitphotodata = function (req, res) {
    var photos = req.body.files;
    for(var x = 0;x<photos.length;x++){
        console.log(photos[x]);
        Blog.findOne({_id:req.body.id,'Blog.orphanedphotos':photos[x].name},function(err,blog){
            console.log(blog);
            if(blog)
                console.log(blog.orphanedphotos);
        })
    }
    res.send(200);
    //TODO:take the files array loop through each file
    //find the file in orphanedfiles remove it from the orphanedfiles
    //find the currrent profile and a new posttext
    //add the files data to thie post text files data.
    //attach to any albums if selected and
    //save

};

exports.cancelphotodata = function(req,res){
     //TODO:loop through files array
    //find the files in orphaned files remove it from the orphaned files
    //finished
}