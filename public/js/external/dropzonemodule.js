angular.module('dropzone', []).
    factory('dropzone', function ($rootScope) {
        var dropzoneInstance = {};
        return{
            /**
             * @name CreateDropzone
             * @description To instantiate an new dropzone object
             * @param {string} elm The elmement to attach this object to
             * @param {string} url The url to pass to the url object this url will be upload url
             **/
            createDropzone: function (elm, url) {
                //return new Dropzone(elm,{url:url});
                elm.dropzone({url: url});
            },
            /**
             * @name ReisterEvent
             * @description register event with dropzone object
             * @param event event to create
             * @param element element to attache event to
             * @param callback callback when event is fired
             */
            registerEvent: function (event, element, callback) {
                dropzoneInstance = Dropzone.forElement('#' + element.attr('id'));
                dropzoneInstance.on(event, callback)
            }
        }
    })