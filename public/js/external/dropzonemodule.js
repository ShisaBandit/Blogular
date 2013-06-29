angular.module('dropzone', []).
    factory('dropzone', function ($rootScope) {
        var dropzoneInstance = {};
        var uiFiles = [];
        var maxImages = 0;//0 == infinity;
        return{
            /**
             * @name CreateDropzone
             * @description To instantiate an new dropzone object
             * @param {string} elm The elmement to attach this object to
             * @param {string} url The url to pass to the url object this url will be upload url
             **/
            createDropzone: function (elm,url, options,dropzoneID) {
                dropzoneInstance = new Dropzone('#'+dropzoneID,options);
                console.log(dropzoneInstance);
                console.log(Dropzone.version);
               // dropzoneInstance.options = options;
                return dropzoneInstance;
                //elm.dropzone({url:url});
            },
            /**
             * @name ReisterEvent
             * @description register event with dropzone object
             * @param event event to create
             * @param element element to attache event to
             * @param callback callback when event is fired
             */
            registerEvent: function (event, element, callback) {
                //dropzoneInstance = Dropzone.forElement('#' + element.attr('id'));
                dropzoneInstance.on(event, callback)
            },
            processQueue:function(){
                return dropzoneInstance.processQueue();
            },
            processFile:function(file){
                        dropzoneInstance.processFile(file);
            },
            uploadFile:function(file){
                dropzoneInstance.uploadFile(file);
            },
            removeFile:function(file){
                dropzoneInstance.removeFile(file);
            },
            getFilesQueue:function(){
                return dropzoneInstance.filesQueue;
            },
            setFileLoadedInUi:function(file){
                uiFiles.push(file);
            },
            getFilesLoadedInUI:function(){
                var infoObjects = [];
                for(file in uiFiles){
                    var newFileObj = {};
                    newFileObj.name = uiFiles[file].name;
                    newFileObj.size = uiFiles[file].size;
                    newFileObj.type = uiFiles[file].type;
                    infoObjects.push(newFileObj);
                }

                return infoObjects;
            },
            setMaxNoImages:function(noOfImages){
                maxImages  = noOfImages;
            },
            getMaxNoImages:function(){
                return maxImages;
            }

        }
    })