angular.module('dropzone', []).
    factory('dropzone',function($rootScope){
        return{
            /**
            * @name CreateDropzone
            * @description To instantiate an new dropzone object
            * @param {string} elm The elmement to attach this object to
            * @param {string} url The url to pass to the url object this url will be upload url
            **/
            createDropzone:function(elm,url){
                //return new Dropzone(elm,{url:url});
                elm.dropzone({url:url});
            }
        }
    })