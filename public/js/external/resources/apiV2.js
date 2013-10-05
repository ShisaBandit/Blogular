angular.module('apiResource', ['ngResource']).
    factory('api', function ($resource, $q,$http,$rootScope) {
        var apiGetById = $resource('/get/:type/:id',
            {id: '@_id',type:'@type'},
            {
                'get': {method: 'GET', isArray: 'true'},
                'save': {method: 'POST'}
            }
        );
        var apiGetByField = $resource('/get/:type/:field/:query',
            {type:'@type',field:'@field'},
            {
                'get': {method: 'GET', isArray: 'true'},
                'save': {method: 'POST'}
            }
        );
        var apiCreateResource = $resource('/create/:type',
            {type: '@type'},
            {
                'save': {method: 'POST'}
            }
        );
        var apiCreateSubDocResource = $resource('/create/:type/:subdoc',
            {type: '@type'},
            {
                'save': {method: 'POST'}
            }
        );
        /*implement a pagination api
        var blogPagination = $resource('/blog/:skip/:limit',
            {skip:'0',limit:'3'},
            {'get':{method:'GET',isArray:'true'}
            });
        */
        //TODO:Create an api that responds with ONLY the subdocuments
        var apiResource = {
            getResourceById: function (type,id,callback) {
                var deferred = $q.defer();
                apiGetById.get({type:type,id:id},function (docs) {

                        callback(docs);

                    },
                    function () {
                    });
            },
            getResourceByField: function (type,query,callback) {
                var deferred = $q.defer();
                console.log("field"+query.field);
                console.log("query"+query.query);
                apiGetByField.get({type:type,field:query.field,query:query.query},function (docs) {
                        callback(docs);
                    },
                    function () {
                    });
            },
            createResource: function (type,bodydata,callback) {
                //apiCreateResource({type:type},bodydata);
                $http.post("create/"+type,bodydata).
                    success(function(data,status,headers,config){
                        console.log("succes from server "+data)
                        callback(data,status);
                    }).error(function(data,status,headers,config){
                        console.log("succes from server "+data)
                        callback(data,status);
                    })
            },
            createResourceNew:function(type,bodydata,callback){
                //apiCreateResource.save({type:type},)
            },
            /*creates a subdoc array entry on adocument
                @param type mongoose model on DB
                @param id the id of the document to add a subdocuemt entry to
                @param subdoc the name of the subdocument to add an entry to
                @param bodydata the post data to send to be added to the subdoc
                @param callback for callbacks
             */
            createSubDocResource: function (type,id,subdoc,bodydata,callback) {
                /*apiCreateSubDocResource({type:type,subdoc:subdoc},bodydata).
                    success(function(err){
                        if(err)console.log(err);
                    })*/
                $http.post('create/'+type+'/'+id+'/'+subdoc,bodydata).
                    success(function(data,status,headers,config){
                        callback(data);
                    }).error(function(data,status,headers,config){
                        callback(data);
                    })
            }

        };
        return apiResource;
    });