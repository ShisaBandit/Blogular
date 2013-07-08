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
            if (true) {//TODO:Remove commented line this should not always be true!"!!!//if(process.env.NODE_ENV == "production"){
                console.log("WE are in production so setting privacy on mem walls");
                matchfound = true;
            } else {
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

exports.blogdataforuser = function(req,res){
                       var buffer = [];
                Blog.find({owner_id:req.session.passport.user},function(err,blogs){
                    for(var blog in blogs){
                        var data = {};
                        data.author = blogs[blog].author;
                        data.firstName = blogs[blog].firstName;
                        data.lastName = blogs[blog].lastName;
                        data.title = blogs[blog].title;
                        buffer.push(data);
                    }
                    res.send(JSON.stringify(buffer));

                })
}

exports.createBlog = function (req, res) {
    var title = req.body.title;
    //noinspection JSValidateTypes
    if (title === '' || title === null || title === undefined)return res.send('need a title', 404);
    else {

        var newBlogEntry = new Blog(req.body);
        newBlogEntry.owner_id = req.session.passport.user;
        newBlogEntry.save(function (err,newblog) {
            if (err)console.log(err);
            return res.end(JSON.stringify({'success': 'true',blogId:newblog._id}));
        });
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
                if(err) {
                    console.log(err);
                    res.end(JSON.stringify({result: 'error'}));
                }
                if(doc.comments == undefined || doc.comments.length < 1) {
                    //do nothing for now
                    doc.updateDate = Date.now();
                }else {
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
        var userid = req.session.passport.user;
        User.findOne({_id: userid}, function (err,user) {
            req.body.username = user.username;
            req.body.gravatar = calcMD5(user.email);

            req.body.user_id = user;
            blog.postText.push(req.body);

            blog.save(function (err, doc) {

                if (err)console.log(err);
                console.log("saved textpost");

                return res.end(JSON.stringify({'success': 'true'}));

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
        var user = req.session
        User.findOne({_id: req.session.passport.user}, function (err,user) {
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
        /*
         for(var post in blog.postText){
         User.findOne({_id:post.user_id},function(err,user){
         post.name = user.firstName + " "+user.lastName;
         })
         }
         */
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
    Blog.findOne({_id: req.params.id}).lean().exec(function (err, blog) {
            return res.end(JSON.stringify(getPostText(blog, Common.postTextTypes.video, "embedYouTube")));
    });
}
exports.latestEvents = function (req, res) {
    Blog.findOne({_id: req.params.id}).lean().exec(function (err, blog) {
            return res.end(JSON.stringify(getPostText(blog, Common.postTextTypes.event)));
    });
}

exports.sendWallInvite = function(req,res){
    Blog.findOne({author:req.params.wallid},function(err,blog){
         User.findOne({_id:req.params.user},function(err,user){
             user.profiles.push({profile:blog._id});
             user.save(function(err){
                 console.log("profile pushed to user"+user.username);
                 res.send(200,'success');
             })
         })
    })
}
exports.block = function(req,res){
    var wall = req.params.wallid;
    Blog.findOne({author:req.params.wallid},function(err,blog){
         User.findOne({_id:req.params.user},function(err,user){
            var profiles = user.profiles;
            console.log(user.profiles);
             var x = 0;
            for(var profile in profiles){
                if(profile.profile == blog._id){
                    profile.splice(x,1);
                }
                x++;
            }
               user.profiles = profiles;
                console.log(user.profiles);
             user.save(function(err){
                 console.log("profile removed to user"+user.username);
             })
         });
    })
}

exports.selfremove = function(req,res){
    var wall = req.params.id;
    User.findOne({_id:req.sessions.passport.user},function(err,user){
        var profiles = user.profiles;
        var x = 0;
        for(var profile in profiles){
            if(profiles[profile].profile == wall){
                profiles.slice(x,1);
            }
            x++;
        }
        user.profiles = profiles;
        user.save(function(data){

        })
    })
}


exports.subscribed = function(req,res){
   var blogId = req.params.id;
    console.log(blogId);
    Blog.findOne({author:blogId},function(err,blog){
        console.log(blog._id);
        User.find({profiles:{$elemMatch:{profile:blog._id}}},function(err,users){
            console.log(users);
            res.send(JSON.stringify(users));
        })
    })
}

exports.subscribedto = function(req,res){
    var blogId = req.params.id;
    console.log(blogId);
    //TODO:Ask rodney about what this should be... not friends but people on your walls??
    //we have no "friends perse"
    Blog.findOne({author:blogId},function(err,blog){
        console.log(blog._id);
    })
}

function getPostText(blog, type, getProp) {
    if (getProp == undefined)getProp = false;
    var buffer = [];
    for (var p = 0; p < blog.postText.length; p++) {
        if (blog.postText[p].postType == type) {
            var prop;
            if (getProp == true) {
                prop = getProp;
                var pushdata;
                if(prop = "embedYouTube"){
                   pushdata =  blog.postText[p][getProp].str.slice(0,1);
                   pushdata.str.slice(0,-1);
                   console.log(pushdata)
                }else{
                    pushdata = blog.postText[p][getProp];
                }
                buffer.push(pushdata);
            } else {
                var pushdata;
                if(getProp == "embedYouTube"){
                    if(blog.postText[p][getProp] == undefined)return buffer;
                    pushdata =  blog.postText[p][getProp].slice(0,blog.postText[p][getProp].length);
                    pushdata.slice(0,-1);
                    console.log(pushdata)
                    buffer.push(pushdata);
                }else{
                    buffer.push(blog.postText[p]);
                }
            }
        }
    }
    return buffer;
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
