var models = require('../models/models');

exports.createData = function (req, res) {
    var title = req.body.title;
    var model = getModelInstance(req.params.type);
    console.log(req.body);
    var modelInstance = new model(req.body);

    modelInstance.save(function(err){
        if(err)console.log(err);
    })

    /*
    var newData= new Petition(req.body);
    newPetition(function (err) {
        if (err)console.log(err);
    });
    */
    return res.end(JSON.stringify({'success': 'true'}));
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
    if(idPar typeof StringValue){
        idPar = idPar.lowercase;
        if(idPar == "all"){

        }else{
            var field = req.params.field;
            //javascript dynamically set property name of object literal.
                condition = {field:req.params.query};
        }
    }


    model.find(condition,function(err,docs){
        return res.end(JSON.stringify(docs));
    })
}
