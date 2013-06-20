angular.module('apiResource', ['ngResource']).
    factory('api', function ($resource, $q,$http) {
        var apiGetById = $resource('/get/:type/:id',
            {id: '@_id',type:'@type'},
            {
                'get': {method: 'GET', isArray: 'true'},
                'save': {method: 'POST'}
            }
        );
        var apiGetByField = $resource('/get/:type/:field/:query',
            {id: '@_id',type:'@type',field:'@field'},
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
            createResource: function (type,bodydata) {
                //apiCreateResource({type:type},bodydata);
                $http.post("create/"+type,bodydata).
                    success(function(err){

                    })
            },
            createSubDocResource: function (type,id,subdoc,bodydata,callback) {
                /*apiCreateSubDocResource({type:type,subdoc:subdoc},bodydata).
                    success(function(err){
                        if(err)console.log(err);
                    })*/
                $http.post('create/'+type+'/'+id+'/'+subdoc,bodydata).
                    success(function(err){
                        if(err)console.log(err);
                       callback();
                    })
            }

        };
        return apiResource;
    });