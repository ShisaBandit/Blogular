var models = require('../models/models');

exports.createData = function (req, res) {
    var subdoc = req.params.subdoc;
    var type  = req.params.type;
    var condition = {};
    var model = getModelInstance(type);
    console.log(req.body);
    console.log(subdoc);
    if(subdoc == undefined){
        var modelInstance = new model(req.body);

        //TODO:

        //TODO:use the chain of responsibility pattern here to
        //set datamodifiers
        //TODO:make a class that decides which chain to delegate to
        //based on request.
        modelInstance.save(function(err){
            if(err)console.log(err);
            return sendSuccess(res);
        })
    }else{
        model.findOne(condition,function(err,doc){
            console.log(req.body);
            //TODO:

            //TODO:use the chain of responsibility pattern here to
            //set datamodifiers
            //TODO:make a class that decides which chain to delegate to
            //based on request.
            doc[subdoc].push(req.body);

            model.save(function(err){
                console.log(err);
                return sendSuccess(res);

            })
        })


    }



    /*
    var newData= new Petition(req.body);
    newPetition(function (err) {
        if (err)console.log(err);
    });
    */
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

var setFirstName ={register:"postText"};

var dataModifier = function(data){
    var next = null;

    return{
        setNext:function(stack){
            next = stack;
        },
        setFirstName:function(data){
            data.firstName = "BILLY";
            return data;
        },
        setLastName:function(data){
            data.lastName = "JEAN";
            return data;
        },
        gotoNext:function(){
            if(next){

            }
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

function sendSuccess(res){
    return res.end(JSON.stringify({'success': 'true'}));

}