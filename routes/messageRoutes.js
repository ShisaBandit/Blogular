var models = require('../models/models');
var Message = models.Message;
var User = models.User;

exports.getMessagedUsers = function(req,res){
    User.findOne({_id:req.session.passport.user},function(err,doc){
        if(doc === undefined || doc === null)
            return res.send("none",200);
        return res.send(JSON.stringify(doc.messagedUsers),200);
    })
}

exports.getMessagesForUser = function(req,res){
    var thisUser;
    var otherUser = req.params.username;

    User.findOne({_id:req.session.passport.user},function(err,doc){
        thisUser = doc.username;
        console.log("getting messages with parameters");
        console.log(thisUser);
        console.log(otherUser);
        var query = Message.find(
            {
                $or:
                    [
                        {$and:[
                            {from:thisUser},
                            {to:otherUser}
                        ]},
                        {$and:[
                            {from:otherUser},
                            {to:thisUser}
                        ]}
                    ]
            },function(err,docs){
                console.log("found docs");
                console.log(doc);
                return res.send(JSON.stringify(docs),200);
            });
    })

}