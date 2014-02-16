angular.module('ShadowboxModule',[]).
    directive('shadowbox', function () {
        return{
            template:'<a ng-click="openShadowBox()">{{imageName}}</a>',
            scope:{
                imageName:'@name',
                imageUrl:'@url'
            },
            link: function (scope,ele,attrs) {

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
    })
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