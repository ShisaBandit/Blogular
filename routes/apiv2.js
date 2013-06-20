var models = require('../models/models');

exports.createData = function (req, res) {
    var subdoc = req.params.subdoc;
    var subdocid = req.params.subdocid;
    var subsubdoc = req.params.subsubdoc;
    var type  = req.params.type;
    var condition = {};
    var model = getModelInstance(type);
    console.log(req.body);
    console.log(subdoc);
    if(subdoc == undefined){
        var modelInstance = new model(req.body);
        //TODO:use the chain of responsibility pattern here to
        //set datamodifiers
        //TODO:make a class that decides which chain to delegate to
        //based on request.
        dataFilter(req,type,null,modelInstance);
        modelInstance.save(function(err){
            if(err)console.log(err);
            return sendSuccess(res);
        })
    }else if(subsubdoc == undefined && subdoc != undefined){
        condition._id = req.params.id;
        console.log(condition);
        model.findOne(condition,function(err,doc){
            console.log(req.body);
            //TODO:use the chain of responsibility pattern here to
            //set datamodifiers
            //TODO:make a class that decides which chain to delegate to
            //based on request.
            //doc[subdoc].push(req.body);
            dataFilter(req,type,subdoc,req.body,function(data){
                doc[subdoc].push(data);
                doc.save(function(err){
                    console.log(err);
                    return sendSuccess(res);
                })
            });
        })
    }else{
        condition._id = req.params.id;
        console.log(condition);
        model.findOne(condition,function(err,doc){
            console.log(req.body);
            //TODO:use the chain of responsibility pattern here to
            //set datamodifiers
            //TODO:make a class that decides which chain to delegate to
            //based on request.
            //doc[subdoc].push(req.body);
            dataFilter(req,type,subdoc,req.body,function(data){
                var doc = doc[subdoc].id(subdocid);
                doc.push[subsubdoc] = subsubdoc;

                doc.save(function(err){
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
}

var setFirstName ={register:"postText"};

var dataFilter = function(req,type,subtype,data,callback){

    switch(type){
        case"Blog":{
            data = setAllFirstNames(data);
            data = setAllLastNames(data);
            callback(data);
            break;
        }
        case "Petition":{
            if(subtype == "signatures"){
                models.User.findOne({_id:req.session.passport.user},function(err,user){
                    if(user == null ){

                    }else{
                        if(user.firstName === undefined){
                            data.initals = "ANON";
                        }else{
                            data.initals = user.firstName.charAt(0).toUpperCase()+"."+user.lastName.charAt(0).toUpperCase()+".";
                        }
                        data.cityState = user.city;//TODO:add in later+" "+user.State;
                        callback(data);

                    }


                })


            }
            break;
        }
    }




}
function setAllFirstNames(data){
    data.firstName = "Chain of Resp First Name ";
    return data;
}
function setAllLastNames(data){
    data.firstName = "Chain of Resp First Name ";
    return data;
}

function getModelInstance(name){
    for(model in models){
        console.log(models[model].modelName);
        if(name == models[model].modelName){
            return models[model];
        }
    }
}

exports.getData = function(req,res){
    var idPar = req.params.id;
    var model = getModelInstance(req.params.type);
    var condition = {};
    console.log(idPar);
    //if api route id is undefined we are doing a sub doc query
    if(idPar == undefined){
        var field = req.params.field;
        //javascript dynamically set property name of object literal.
        condition[field] = req.params.query;
    }else{
        console.log(typeof(idPar))
            if(idPar === "all"){
            }else{
                condition = {_id:idPar};
            }
    }
                    console.log(condition);


    model.find(condition,function(err,docs){
        return res.end(JSON.stringify(docs));
    })
}

function sendSuccess(res){
    return res.end(JSON.stringify({'success': 'true'}));

}