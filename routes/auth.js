var models = require('../models/models');
var Blog = models.Blog;
var User = models.User;
var Update = models.Update;
var PassRec = models.PasswordRecovery;
var InvitedUser = models.InvitedUser;
var check = require('validator').check,
    sanitize = require('validator').sanitize;
var nodemailer = require('nodemailer');
//var smtpTransport = nodemailer.createTransport("sendmail");
var smtpTransport = nodemailer.createTransport("SMTP", {
    host: "mail.angelsofeureka.org",
    port: "465",
    secureConnection: true,
    auth: {
        user: "noreply@angelsofeureka.org",
        pass: "regEmail2013"
    }
});
var path = require('path');
//var emailTemplates = require('swig-email-templates');

var crypto = require('crypto');

exports.checkAuthed = function (req, res) {
    User.find({_id: req.session.passport.user}, function (err, user) {
        if (err)console.log(err);
        console.log(user[0].username);
        //noinspection MagicNumberJS
        return res.send(JSON.stringify({username:user[0].username,userid:user[0]._id,gravatar:user[0].gravatar}), 200);
    })
};

exports.checkProfileAuthed = function (req, res, next) {
    User.findOne({_id: req.session.passport.user}, function (err, users) {
        var matchfound = false;
        if (err)console.log(err);
        for (var x = 0; x < users.profiles.length; x++) {
            console.log(users.profiles[x]._id);
            if (req.params.id == users.profiles[x]._id) {
                matchfound = true;
            }
        }
        if (matchfound == true) {
            return next();
        } else {
            return res.send({fail: 'noaccess'}, 200);
        }

    })
}

//update docs route
exports.lastUpdateSame = function (req, res) {
    Update.findOne({}).lean().exec(function (err, update) {
        var returnResult = [];
        if (err)console.log(err);
        if (update == null) {
            var updateCreate = new Update();
            updateCreate.save(function (err, newUpdate) {
                if (err)console.log(err);
                returnResult.push(newUpdate);
                res.end(JSON.stringify(returnResult));
            });
        } else {
            returnResult.push(update);
            res.end(JSON.stringify(returnResult));
        }
    })
};

exports.lastUpdateSameId = function (req, res) {
    var dateFromClient = req.params.date;
    var response = [];

    Update.findOne({}, function (err, update) {
        var obj = {};
        if (update == null) {
            obj.result = "false";
        } else {
            if (dateFromClient == update.lastUpdate.getTime()) {
                obj.result = "false";
            } else {
                obj.lastUpdate = update.lastUpdate;
                obj.result = "true";
            }
        }
        response.push(obj);
        return res.end(JSON.stringify(response));
    });

};

exports.logout = function (req, res) {
    req.logout();
    //noinspection MagicNumberJS
    res.send('loggedout', 410);
};

exports.loginAuth = function (req, res) {
    User.findOne({'username': req.body.username, 'password': req.body.password, admin: {$in: ['superuser', 'admin']}},
        function (err, administrator) {
            if (err)console.log(err);
            if (administrator) {
                req.session.loggedIn = true;
            } else {
                req.session.loggedIn = false;
            }

            return res.send(200);
        });

};
exports.register = function (req, res) {
    var errorMessage = [];
    var userCount = 0,
        adminCount = 0,
        username = req.body.username,
        password = req.body.password,
        firstname = req.body.firstName,
        lastname = req.body.lastName,
        email = req.body.email,
        dob = req.body.dob,
        minUsernameLength = 5,
        maxUsernameLength = 16,
        minPasswordLength = 5,
        maxPasswordLength = 16,
        maxfirstNameLength = 15,
        maxlastNameLength = 15;

    console.log(req.body.groupcode)
    req.checkBody('username', 'Username must be longer than' + minUsernameLength + ' and shorther than ' + maxUsernameLength + ' characters.')
        .notNull().len(minUsernameLength, maxUsernameLength);
    req.checkBody('password', 'Password must be longer than' + minPasswordLength + ' and shorther than ' + maxPasswordLength + ' characters.')
        .notNull().len(minPasswordLength, maxPasswordLength);
    req.checkBody('firstName', 'Must have a first name.')
        .notNull().len(1, maxfirstNameLength);
    req.checkBody('lastName', 'Must have a last name.')
        .notNull().len(1, maxlastNameLength);
    req.checkBody('email', 'Must have a valid email.')
        .notNull().isEmail();
    req.checkBody('dob', 'Date of Birth must be a valid date.')
        .notNull().isDate();
    req.checkBody('groupcode', 'Must enter who you lost.')
        .notNull();
    /*req.checkBody('betacode', 'Incorrect beta code.')
        .notNull().equals('hardcoded')*/

    if (password == username) {
        errorMessage.push('Password can not be the same as username');
    }

    var errors = req.validationErrors(true);
    if (password == username) {
        errors.password = {param: 'password', msg: 'Password can not be the same as username.'};
    }
    if (errors) {
        res.send(errors, 500);
        return;
    }
    User.count({username: username}, function (err, count) {
        if (err)console.log(err);
        userCount = count;
        //then get admin count
        User.count({username: username, admin: {$in: ['superuser', 'admin']}}, function (err, count) {
            if (err)console.log(err);
            adminCount = count;
            //then check count
            //TODO:redo this section of code in promises
            //username checks
            if (
                userCount < 1 && adminCount < 1
                ) {
                var user = new User(req.body);

                user.gravatar = calcMD5(user.email);
                user.lost = req.body.groupcode;
                console.log(user.lost);
                console.log(req.body.groupcode)
                user.save(function (err) {
                    if (err) {
                        console.log(err);
                        console.log(err.path);
                        return res.end(JSON.stringify({'fail': errorMessage}));

                    }
                    SendConfirmationMail(email);
                    return res.end(JSON.stringify({'success': 'true'}));
                });
            } else {

                if (!errors) {
                    errors = {};
                }
                if (userCount >= 1 || adminCount >= 1) {
                    errorMessage.push('username already taken');
                    errors.username = {param: 'username', msg: 'username already taken.'};

                }

                if (errors) {
                    res.send(errors, 500);
                    return;
                }
            }
        });
    });
};
/*
exports.register = function (req, res) {
    var errorMessage = [];
    var userCount = 0,
        adminCount = 0,
        username = req.body.username,
        password = req.body.password,
        firstname = req.body.firstName,
        lastname = req.body.lastName,
        email = req.body.email,
        dob = req.body.dob,
        offSiteUserCode = false,
        minUsernameLength = 5,
        maxUsernameLength = 16,
        minPasswordLength = 5,
        maxPasswordLength = 16,
        maxfirstNameLength = 15,
        maxlastNameLength = 15;

    req.checkBody('username', 'Username must be longer than' + minUsernameLength + ' and shorther than ' + maxUsernameLength + ' characters.')
        .notNull().len(minUsernameLength, maxUsernameLength);
    req.checkBody('password', 'Password must be longer than' + minPasswordLength + ' and shorther than ' + maxPasswordLength + ' characters.')
        .notNull().len(minPasswordLength, maxPasswordLength);
    req.checkBody('firstName', 'Must have a first name.')
        .notNull().len(1, maxfirstNameLength);
    req.checkBody('lastName', 'Must have a last name.')
        .notNull().len(1, maxlastNameLength);
    req.checkBody('email', 'Must have a valid email.')
        .notNull().isEmail();
    req.checkBody('dob', 'Date of Birth must be a valid date.')
        .notNull().isDate();
    req.checkBody('groupcode', 'Must enter who you lost.')
        .notNull();
    console.log(req.body.betacode)
    req.checkBody('betacode', 'Beta code is incorrect.')
        .notNull().equals('hardcoded');
    //if we have a offsite memwall request
    //add that profile access to that users
    //

    if(req.params.offsiteusercode != false){
        offSiteUserCode = req.params.offsiteusercode;
    }
    if (password == username) {
        errorMessage.push('Password can not be the same as username');
    }

    var errors = req.validationErrors(true);
    if (password == username) {
        errors.password = {param: 'password', msg: 'Password can not be the same as username.'};
    }
    if (errors) {
        res.send(errors, 500);
        return;
    }
    User.count({username: username}, function (err, count) {
        if (err)console.log(err);
        userCount = count;
        //then get admin count
        User.count({username: username, admin: {$in: ['superuser', 'admin']}}, function (err, count) {
            if (err)console.log(err);
            adminCount = count;
            //then check count
            //TODO:redo this section of code in promises
            //username checks
            if (
                userCount < 1 && adminCount < 1
                ) {
                var user = new User(req.body);

                user.gravatar = calcMD5(user.email);
                user.lost = req.body.groupcode;

                if(offSiteUserCode){
                    //add
                    var hash = crypto.createHash('sha1').update(offSiteUserCode).digest('hex');
                    //TODO: Then if the user click on the link we get the key from the request
                    //check it against the database then
                    //if the key matches the request key we then reest the password
                    //and respond with a success or error
                    InvitedUser.findOne({key: hash}, function (err, doc) {
                        if (!doc) {
                        }else{
                            user.memwalls.push(doc.blog);
                            console.log(req.body.groupcode)
                            user.save(function (err) {
                                if (err) {
                                    return res.end(JSON.stringify({'fail': errorMessage}));
                                }
                                SendConfirmationMail(email);
                                return res.end(JSON.stringify({'success': 'true'}));
                            });
                        }
                    })
                }
                user.memwalls.push(doc.blog);
                console.log(req.body.groupcode)
                user.save(function (err) {
                    if (err) {
                        return res.end(JSON.stringify({'fail': errorMessage}));
                    }
                    SendConfirmationMail(email);
                    return res.end(JSON.stringify({'success': 'true'}));
                });
            } else {
                if (!errors) {
                    errors = {};
                }
                if (userCount >= 1 || adminCount >= 1) {
                    errorMessage.push('username already taken');
                    errors.username = {param: 'username', msg: 'username already taken.'};
                }
                if (errors) {
                    return res.send(errors, 500);
                }else{
                    return res.send("unknown application error",500);
                }
            }
        });
    });
};
*/

exports.updateuserdata = function (req, res) {
    var errorMessage = [],
        errors = {};
    var userCount = 0,
        adminCount = 0,
        username = req.body.username,
        password = req.body.password,
        firstname = req.body.firstName,
        lastname = req.body.lastName,
        email = req.body.email,
        dob = req.body.dob,
        minUsernameLength = 5,
        maxUsernameLength = 16,
        minPasswordLength = 5,
        maxPasswordLength = 16,
        maxfirstNameLength = 15,
        maxlastNameLength = 15;

    req.checkBody('username', 'Username must be longer than' + minUsernameLength + ' and shorther than ' + maxUsernameLength + ' characters.')
        .notNull().len(minUsernameLength, maxUsernameLength);
    req.checkBody('password', 'Password must be longer than' + minPasswordLength + ' and shorther than ' + maxPasswordLength + ' characters.')
        .notNull().len(minPasswordLength, maxPasswordLength);
    req.checkBody('firstName', 'Must have a first name.')
        .notNull().len(1, maxfirstNameLength);
    req.checkBody('lastName', 'Must have a last name.')
        .notNull().len(1, maxlastNameLength);
    req.checkBody('email', 'Must have a valid email.')
        .notNull().isEmail();
    req.checkBody('dob', 'Date of Birth must be a valid date.')
        .notNull().isDate();
    req.checkBody('groupcode', 'Must enter who you lost.')
        .notNull();

    if (password == username) {
        errorMessage.push('Password can not be the same as username');
    }

    var errors = req.validationErrors(true);
    if (password == username) {
        errors.password = {param: 'password', msg: 'Password can not be the same as username.'};
    }
    if (errors) {
        res.send(errors, 500);
        return;
    }
    User.count({username: username}, function (err, count) {
        if (err)console.log(err);
        userCount = count;
        //then get admin count
        User.count({username: username, admin: {$in: ['superuser', 'admin']}}, function (err, count) {
            if (err)console.log(err);
            adminCount = count;
            //then check count
            //username checks

            User.findOne({_id: req.session.passport.user}, function (err, user) {

                if (
                    userCount < 1 && adminCount < 1
                    ) {

                } else {


                    if ((userCount >= 1 || adminCount >= 1) && username != user.username) {
                        errorMessage.push('username already taken');
                        if(!errors)errors = {};
                        errors.username = {param: 'username', msg: 'username already taken.'};
                    }

                    if (errors) {
                        res.send(errors, 500);
                        return;
                    }
                }
                user.username = username;
                user.password = password;
                user.firstName = firstname;
                user.lastName = lastname;
                user.email = email;
                user.dob = dob;
                user.address = req.body.address;
                user.city = req.body.city;
                user.state = req.body.state;
                user.about = req.body.about;
                user.zip = req.body.zip;
                user.gravatar = calcMD5(user.email);
                user.lost = req.body.groupcode;
                console.log(user.lost);
                console.log(req.body.groupcode)
                user.save(function (err) {
                    if (err) {
                        console.log(err);
                        console.log(err.path);
                        return res.end(JSON.stringify({'fail': errorMessage}));

                    }
                    return res.end(JSON.stringify({'success': 'true'}));
                });
            });
        });

    })


}

function SendConfirmationMail(to) {
    var mailOptions = {
        from: "noreply@AngelsOfEureka.org",
        to: to,
        subject: "Welcome to AngelsOfEureka.org",
        text: "This is a confirmation email please click this link to confirm you want to register",
        html: "<p>This is a confirmation email.  You have signed up successfully to angels of eureka.org.</p>" +
            "<p>Thank you please enjoy your time on the site.</p> "
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

exports.passrecover = function (req, res) {
    //TODO:First send email with key
    //then if email is successful log the key in the db with a username

    var email = req.body.email;
    console.log(email)
    req.checkBody('email', 'You must enter a valid email.').
        isEmail().notNull();
    var errors = req.validationErrors(true);
    if (errors) {
        console.log(errors)
        res.send('Please enter a valid email.', 500);
        return;
    }

    User.findOne({email: email}, function (err, doc) {
        console.log(doc)
        if (!doc) {
            res.send(500, 'This email is not registered with our system');
            return;
        }

        //generate a key then enter it in the database with the user id
        var key = crypto.randomBytes(20).toString('hex');
        var hash = crypto.createHash('sha1').update(key).digest('hex');
        //Remove any previous password update attempts
        //TODO: remove is not working found out why
        PassRec.find({key: hash}, function (err, recs) {
            console.log(recs)
            for (rec in recs) {
                console.log(recs[rec] + ' has been removed')
                recs[rec].remove();
            }
        });
        var passrec = new PassRec({user_id: doc._id, key: hash});
        passrec.save(function (err) {
            if (err)console.log(err)
            console.log(key)
            SendPasswordRecoveryMail(email, key, req);
            res.send(200, 'Mail sent.')
        })
        //clean these keys out every 1 hour.
    })

}
exports.redirectInvitedOffSiteUser = function (req,res) {
    res.cookie('memwall.invitation', req.params.key, { maxAge: 900000, httpOnly: false});
    res.redirect('#/registration');
}
//TODO:Test and create ui
exports.inviteOffSiteUser = function (req,res) {
    User.findOne({email:req.params.email}, function (err,user) {
        if(!user){

            //generate a key then enter it in the database with the user id
            var key = crypto.randomBytes(20).toString('hex');
            var hash = crypto.createHash('sha1').update(key).digest('hex');
            //Remove any previous password update attempts
            //TODO: remove is not working found out why

            var inviteduser = new InvitedUser({user_id: req.passport.session.user,blog:req.params.blog, key: hash,email:req.params.email});
            inviteduser.save(function (err) {
                if (err)console.log(err)
                console.log(key)
                if(SendInviteMail(req.params.email, key, req)){
                    res.send(200, {message:'Mail sent.'});
                }else{
                    res.send(200,{message:'Error sending email try again later.'});
                }
            })
        }else{
            res.send(200,{message:'There is user with that email already. Username: '+user.username});
        }
    })

}

exports.updatePass = function (req, res) {
    var key = req.body.key;
    var password = req.body.password;
    req.checkBody('password', 'Must enter a password').
        notNull();
    req.checkBody('passwordconfirm', 'Passwords must match').
        equals(password);
    var errors = req.validationErrors(true);
    if (errors) {
        console.log(errors)
        res.send('Please enter a valid email.', 500);
        return;
    }

    var hash = crypto.createHash('sha1').update(key).digest('hex');
    //TODO: Then if the user click on the link we get the key from the request
    //check it against the database then
    //if the key matches the request key we then reest the password
    //and respond with a success or error
    PassRec.findOne({key: hash}, function (err, doc) {
        if (!doc) {
            res.send(500, 'Token is wrong.');
            return;
        }
        User.findOne({_id: doc.user_id}, function (err, user) {
            console.log('got user ' + user.username);
            console.log(password)
            user.password = password;
            user.save(function (err) {
                if (err)console.log(err)
            })
            res.send(200, 'Password has been updated.  Thank you.')
        })
    })
}
var req = {protocol:'https',host:'localhost'}
SendInviteMail('raygarner13@gmail.com','teststring',req);

function SendInviteMail(to, link, req) {
    console.log("mail sent")
    var options = {
        root: path.join(path.resolve('.'), "templates")
        // any other swig options allowed here
    };

    /*
    // emailTemplates(options, function(err, render, generateDummy) {
        var context = {
            protocol:req.protocol,
            host:req.host,
            link:link.toString()
        };
        render('sendinvite.html', context, function(err, html) {
            // send html email
            var mailOptions = {
                from: "noreply@AngelsOfEureka.org",
                to: to,
                subject: "You have been INVITED!",
                text: "",
                html: html
            }
            smtpTransport.sendMail(mailOptions, function (error, response) {
                if (error) {
                    console.log(error);
                    console.log("problems sending mail")
                    return false;
                } else {
                    console.log("message sent")
                    return true;
                }
                console.log(response);
            })
        });

    });
    */
}

function SendPasswordRecoveryMail(to, link, req) {
    var mailOptions = {
        from: "noreply@AngelsOfEureka.org",
        to: to,
        subject: "Memorial Wall password recovery",
        text: "This is a confirmation email please click this link to confirm you want to register",
        html: "<p>We have received a request to change your password.  <p>" +
            "<p>Please click this link </p>" +
            "</br>" +
            "<p>" + req.protocol + "://" + req.host + "/#/updatepass?key=" + link.toString() + " </p>" +
            "</br>" +
            "<p>and reset your password.</p> "
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

exports.getRegUserData = function (req, res) {
    User.findOne({_id: req.session.passport.user}, function (err, data) {
        if (err)console.log(err)
        res.end(JSON.stringify(data));
        return;
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
