var models = require('../models/models');
var EventEmitter = require('events').EventEmitter;
exports.messageEmitter = messageEmitter = new EventEmitter();
exports.createData = function (req, res) {
    var subdoc = req.params.subdoc;
    var subdocid = req.params.subdocid;
    var subsubdoc = req.params.subsubdoc;
    var type = req.params.type;
    var condition = {};
    var model = getModelInstance(type);
    console.log(req.body);
    console.log(subdoc);
    if (subdoc == undefined) {
        //TODO:DO UPDATE AND CREATE ON THE SAME API
        //1. check if ther eis an instance of the same id in the database if so
        //use update other wise create a new i

        var modelInstance = new model(req.body);
        //TODO:use the chain of responsibility pattern here to
        //set datamodifiers
        //TODO:make a class that decides which chain to delegate to
        //based on request.
        dataFilter(req, type, null, modelInstance,null, function (data,err) {
            console.log(" the error is "+err);
            if (err != undefined){
                console.log(err);
                return res.send(400,err);
            }else{
                data.save(function (err) {

                    return sendSuccess(res);
                })
            }

        });

    } else if (subsubdoc == undefined && subdoc != undefined) {//create a subdoc
        condition._id = req.params.id;
        console.log(condition);
        model.findOne(condition, function (err, doc) {
            console.log(req.body);
            //TODO:use the chain of responsibility pattern here to
            //set datamodifiers
            //TODO:make a class that decides which chain to delegate to
            //based on request.
            //doc[subdoc].push(req.body);
            dataFilter(req, type, subdoc, req.body,doc, function (data,skip,reason) {
                console.log(doc)
                if(doc == undefined)return sendError(res,"Erronous data");
                if(!skip){

                    doc[subdoc].push(data);
                    doc.save(function (err,doc) {
                        console.log(err);
                        return sendSuccess(res,reason,doc[subdoc][doc[subdoc].length-1]);
                    });
                }else{
                    return sendError(res,reason);
                }
            });
        })
    } else {
        condition._id = req.params.id;
        console.log(condition);
        model.findOne(condition, function (err, doc) {
            console.log(req.body);
            //TODO:use the chain of responsibility pattern here to
            //set datamodifiers
            //TODO:make a class that decides which chain to delegate to
            //based on request.
            //doc[subdoc].push(req.body);
            dataFilter(req, type, subdoc, req.body,doc, function (data) {
                var doc = doc[subdoc].id(subdocid);
                doc.push[subsubdoc] = subsubdoc;

                doc.save(function (err) {
                    console.log(err);
                    return sendSuccess(res);

                })
            });


        })

    }


    /*
     var newData= new Petition(req.body);
     newPetition(function (err) {
     if (err)console.log(err);
     });
     */
};

var setFirstName = {register: "postText"};

//TODO:create a data property that looks at the name and determines the api being called by a property called
//TODO: apiname...
var dataFilter = function (req, type, subtype, data,doc, callback) {

    switch (type) {
        case "Blog":
        {
            data = setAllFirstNames(data);
            data = setAllLastNames(data);
            if (subtype == "postText") {
                models.User.findOne({_id: req.session.passport.user}, function (err, user) {
                    if (user == null) {
                        callback(data);
                    } else {
                        data.username = user.username;
                        data.gravatar = calcMD5(user.email);
                        data.user_id = user._id;
                        callback(data,false,data);
                    }
                });
            } else {
                data.profile.push({profile:req.session.passport.user})
                callback(data);
            }

            break;
        }
        case "Petition":
        {

            if (subtype == "signatures") {
                var duplicate = false;
                models.User.findOne({_id: req.session.passport.user}, function (err, user) {
                    console.log(user)
                    if(!user._id)callback(data,true,"Please sign in to sign this petition.");
                    for(var s = 0;s<doc.signatures.length;s++){
                        if(doc.signatures[s].user_id == user._id){
                            duplicate = true;
                            break;
                        }
                    }
                    if(duplicate == false){
                        if (user == null) {
                            data.initals = "testing";
                            data.cityState = "testplace";
                            callback(data);
                        } else {
                            if (user.firstName === undefined) {
                                data.initals = "ANON";
                            } else {
                                data.initals = user.firstName.charAt(0).toUpperCase() + "." + user.lastName.charAt(0).toUpperCase() + ".";
                            }
                            data.user_id = user._id.toString();
                            if(data.email)
                                data.gravatar = calcMD5(data.email);
                            if(data.cityState)
                                data.cityState = user.city;//TODO:add in later+" "+user.State;
                            callback(data,false,"You have successfully signed this petition.");
                        }
                    }else{
                        callback(data,true,"You have already signed this petition");
                    }


                })


            } else {
                //not subtype must be regular type
                models.User.findOne({_id: req.session.passport.user}, function (err, user) {
                    data.owner = user;
                    callback(data);
                });
            }
            break;
        }
        case "Message":
        {
            var to = data.to;
            console.log("sending message")
            var index = to.indexOf(':');
            if(index>0){
                to = data.to.substring(0,index);
            }
            data.to = to;
            var from;
            var message = data.message;
            //TODO:add check for verifying user can receive a message. !!
            //data.from = req.session.passport.user;
            //Find the current user
            models.User.findOne({_id:req.session.passport.user},function(err,fromdoc){
                from = data.from = fromdoc.username;
                //find the user we are sending amessage to
                models.User.findOne({username:to},function(err,todoc){
                    if(err)console.log(err);
                    //if we didnt find one ent this callback a error and end this func
                    if(todoc == undefined){
                        console.log("not sending message");
                        var messageToUser = "No user by that name";
                        callback(data,messageToUser);
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
                        todoc.messagedUsers.push({user:from});
                    }
                    var messagedUsersFrom = fromdoc.messagedUsers;
                    var added = false;
                    var addedTo = false;
                    //check if we are adding a new messaged user
                    for(var user in messagedUsersFrom){
                        if(messagedUsersFrom[user].user == from){
                            added = true;
                        }
                        if(messagedUsersFrom[user].user == to){
                            addedTo = true;
                        }
                    }

                    if(!added){
                        fromdoc.messagedUsers.push({user:from});
                    }
                    if(!addedTo){
                        fromdoc.messagedUsers.push({user:to});
                    }
                    fromdoc.save(function(err){
                        if(err)console.log(err)
                    })
                    todoc.save(function(err,saveddoc){
                        if(err)console.log(err)

                        messageEmitter.emit('notification_messagereceived',todoc._id,"You have a new message from "+from,saveddoc.notifications[saveddoc.notifications.length-1]._id);
                    })
                    callback(data);
                });

            })
            /*
            models.User.findOne({username: to}, {$push: {notifications: {text: "You have a new message from ( add user data here)"}}}, function (err, user) {
                console.log(user.notifications);

            });
            */



            break;
        }
        default :
        {
            callback(data);
            break;
        }
    }


};
function setAllFirstNames(data) {
    data.firstName = "Chain of Resp First Name ";
    return data;
}
function setAllLastNames(data) {
    data.firstName = "Chain of Resp First Name ";
    return data;
}

function getModelInstance(name) {
    for (model in models) {
        console.log(models[model].modelName);
        if (name == models[model].modelName) {
            return models[model];
        }
    }
}

exports.getData = function (req, res) {
    var idPar = req.params.id;
    var model = getModelInstance(req.params.type);
    var condition = {};
    console.log(idPar);
    //if api route id is undefined we are doing a sub doc query
    if (idPar == undefined) {
        var field = req.params.field;
        //javascript dynamically set property name of object literal.
        condition[field] = req.params.query;
    } else {
        console.log(typeof(idPar));
        if (idPar === "all") {
        } else {
            condition = {_id: idPar};
        }
    }
    console.log(condition);


    model.find(condition, function (err, docs) {

        return res.end(JSON.stringify(docs));
    })
};

function sendSuccess(res,message,data) {
    return res.end(JSON.stringify( {message:message,data:data}));

}
function sendError(res,reason){
    return res.send(400,JSON.stringify({'error': reason}));
}

exports.editData = function (req, res) {
    var idPar = req.params.id;
    var model = getModelInstance(req.params.type);
    var condition = {};
    console.log(idPar);
    //if api route id is undefined we are doing a sub doc query
    console.log(typeof(idPar));
    //set the condition of the condition
    condition = {_id: idPar};
    console.log(condition);
    //find the doc we are going to edit
    console.log(req.body);
    delete req.body["_id"];
    model.findByIdAndUpdate(idPar, req.body, function (err, docs) {
        if (err)console.log(err);
        console.log(docs);
        return res.send({result: "success"});
    })
};


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
