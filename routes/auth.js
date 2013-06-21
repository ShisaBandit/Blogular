var models = require('../models/models');
var Blog = models.Blog;
var User = models.User;
var Update = models.Update;

exports.checkAuthed = function (req, res) {
    User.find({_id: req.session.passport.user}, function (err, user) {
        if (err)console.log(err);
        console.log(user[0].username);
        //noinspection MagicNumberJS
        return res.send(user[0].username, 200);
    })
};

exports.checkProfileAuthed = function (req, res,next) {
    User.findOne({_id: req.session.passport.user}, function (err, users) {
        var matchfound = false;
        if (err)console.log(err);
            for(var x = 0;x < users.profiles.length;x++){
                console.log(users.profiles[x]._id);
                if(req.params.id == users.profiles[x]._id){
                    matchfound = true;
                }
            }
        if(matchfound == true){
            return next();
        }else{
            return res.send({fail:'noaccess'}, 200);
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
        email = req.body.email;

        minUsernameLength = 5,
        maxUsernameLength = 16,
        minPasswordLength = 5,
        maxPasswordLength = 16
        minfirstnameLength = 1,
        minlastnameLength = 1,
        maxfirstNameLength = 15,
        maxlastNameLength = 15;

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
                    userCount < 1 && adminCount < 1 &&
                    username != undefined &&
                    username != "" &&
                    username.length > minUsernameLength &&
                    username.length < maxUsernameLength &&
                //password checks
                    password != undefined &&
                    password.length > minPasswordLength &&
                    password.length < maxPasswordLength &&
                    password != username &&
                //firstname checks
                    firstname != undefined &&
                    firstname.length > minfirstnameLength &&
                        firstname.length < maxfirstNameLength &&
            //lastname checks
                lastname != undefined &&
                    lastname.length > minlastnameLength &&
                    lastname.length < maxlastNameLength


            ) {
                var user = new User(req.body);
                user.save(function (err) {
                    if (err)
                        console.log(err);
                        for(var name in err.errors){
                            errorMessage.push("not valid "+name);
                        }
                        return res.end(JSON.stringify({'fail': errorMessage}));
                    return res.end(JSON.stringify({'success': 'true'}));
                });
            } else {


                 //uername length check
                if (username == undefined || username == "") {
                    errorMessage.push('Please enter a username');
                }else if ( username.length < minUsernameLength) {
                    errorMessage.push('Username must be longer than ' + minUsernameLength);
                }else if (username.length > maxUsernameLength) {
                    errorMessage.push('Username must be shorter than ' + maxUsernameLength);
                }
                //password check
                if (password == undefined || password == "") {
                    errorMessage.push('Please enter a password');
                }else if ( password.length < minPasswordLength) {
                    errorMessage.push('Password must be longer than ' + minPasswordLength);
                }else if (password.length > maxPasswordLength) {
                    errorMessage.push('Password must be shorter than ' + maxPasswordLength);
                }

                if (password == username) {
                    errorMessage.push('Password can not be the same as username');
                }

                if (userCount >= 1 || adminCount >= 1) {
                    errorMessage.push('username already taken');
                }

                if (firstname == undefined || firstname == "") {
                    errorMessage.push('Please enter a first name');
                }else if (firstname.length < minfirstnameLength) {
                    errorMessage.push('First name must be longer than ' + minfirstnameLength);
                }else if (firstname.length > maxfirstNameLength) {
                    errorMessage.push('First name must be shorter than ' + maxPasswordLength);
                }

                if (lastname == undefined || lastname == "") {
                    errorMessage.push('Please enter a last name');
                }else if (lastname.length < minlastnameLength) {
                    errorMessage.push('Last name must be longer than ' + minlastnameLength);
                }else if (lastname.length > maxlastNameLength) {
                    errorMessage.push('Last name must be shorter than ' + maxlastNameLength);
                }


                if (errorMessage.length == 0 || errorMessage === undefined) {
                    errorMessage.push('unknown error');
                }
                return res.end(JSON.stringify({'fail': errorMessage}));
            }
        });
    });


};


