angular.module('ShadowboxModule',[]).
    directive('shadowbox', function () {
        return{
            template:'<img width="200" src="{{imageUrl}}" ng-click="openShadowBox()" />',
            scope:{
                imageName:'@name',
                imageUrl:'@url'
            },
            link: function (scope,ele,attrs) {
                console.log(scope.imageUrl)
                if(scope.imageUrl == "" || scope.imageUrl == null)
                    return;
                ele.attr('href',scope.imageUrl);

                Shadowbox.setup(ele,{
                    content:scope.imageUrl,
                    player: "img",
                    title:  "",
                    gallery:"gall"
                });
            }
        }
    });
    /*
    factory('shadowbox', function () {

        return {
            init: function () {
                console.log("INITING SHADOWBOX");
                Shadowbox.init();
            },
            addCache: function (link,options) {
                return Shadowbox.addCache(link,options);
            },
            setup: function (link,options) {
                Shadowbox.setup(link,options);
            }
        }
    })*/