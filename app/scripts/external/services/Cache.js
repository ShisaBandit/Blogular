angular.module('Cache',[]).
    factory('formcache',function(){
        var memWallCreateForm = {
            pet:"",
            title:"",
            author:"",
            text:"",
            firstName:"",
            lastName:"",
            group:"",
            dob:"",
            memorialDate:"",
            subgroup:"",
            selectedGroup:""
        }
        var resetProps = function (object) {
            console.log("clearing props");
            for(var key in object){
                console.log("remove "+key);
                console.log(object);
                object[key] = null;
            }
        }
        return {
            getMemWallCreateForm:function(){
                return memWallCreateForm;
            },
            setMemWallCreateForm:function(data){
                if(data == null){
                    resetProps(memWallCreateForm);
                }else{
                    memWallCreateForm = data;
                }
                return memWallCreateForm;
            }
        }
    })