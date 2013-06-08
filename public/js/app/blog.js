var app = angular.module('blogApp', [
        'twitterService', 'userService', 'http-auth-interceptor', 'login', 'socketio', 'updateService',
        'Scope.onReady', 'blogResource', 'loaderModule', 'Plugin.Controller.Title', 'Plugin.Controller.BlogEntries',
        'blogFilter', 'blogService', 'infinite-scroll', 'dropzone','apiResource'
    ]).
    config(function ($routeProvider) {
        $routeProvider.
            when("/", {templateUrl: "partials/blog.html"}).
            when("/about", {templateUrl: "partials/about.html"}).
            when("/projects", {templateUrl: "partials/projects.html"}).
            when("/shoutouts", {templateUrl: "partials/shoutouts.html"}).
            when("/admin/AddBlogEntry", {templateUrl: "partials/admin/createBlogEntry.html"}).
            when("/blog/:id", {templateUrl: "partials/blogEntry.html"}).
            when("/public/:id", {templateUrl: "partials/publicAngelProfile.html"}).
            when("/listByTag/:name", {templateUrl: "partials/blog.html"}).
            when("/petitions",{templateUrl:"partials/petitions.html"}).
            when("/petition/:title",{templateUrl:"partials/petition.html"})
    });

app.directive('becomeMainContent', function () {
    return {
        link: function (scope, ele) {

            scope.$whenReady(
                function () { //called when $scope.$onReady() is run
                    ele.removeClass("nine");
                    ele.addClass("twelve");
                },
                function (someArgs) { //called when $scope.$onFailure() is run

                }
            );

        }
    }
});

app.directive('fixedMenu', function () {
    return{
        link: function (scope, elm, attrs) {

            $("document").ready(function ($) {

                var nav = elm;
                //var nav = $('.nav-container');

                $(window).scroll(function () {
                    if ($(this).scrollTop() > 136) {
                        nav.addClass("f-nav");
                    } else {
                        nav.removeClass("f-nav");
                    }
                });

            });
        }
    }
})

app.directive('offsetHeight', function () {
    return{
        link: function (scope, elm, attrs) {
            elm.css({marginTop: attrs.offsetHeight + 'px'});
        }
    }
})

app.directive('revealModal', function () {
    return {
        link: function (scope, elm, attrs) {
            scope.$on('event:auth-loginConfirmed', function (event) {
                console.log("EVENT TRIGGERED" + event);
                if (attrs.revealModal == 'login') {
                    elm.trigger('reveal:close');
                } else {
                }
            });
            scope.$on('event:auth-registered', function () {
                console.log("registered event fired in directive");
                if (attrs.revealModal == 'register') {
                    elm.foundation('reveal', 'close');
                }
                if(attrs.revealModal == 'userdetails') {
                    scope.message = 'Please fill out your user details';
                    elm.foundation('reveal', 'open');
                }

                /*
                if (attrs.revealModal == 'login') {
                    scope.message = 'Use your credentials to login';
                    elm.foundation('reveal', 'open');
                }
                */
            });
            $scope.$on('event:userdetails-success',function(){
                if(attrs.revealModal == 'userdetails'){
                    elm.foundation('reveal','close');
                }
                if(attrs.revealModal == 'wallregistration'){
                    elm.foundation('reveal','open');
                }

            })
        }
    }
});

app.directive('ifAuthed', function ($http) {
    return {
        //TODO:autoscroll being called to early in the link process????
        link: function (scope, elm, attrs) {
            $http.get('/checkauthed').then(function (data) {
                scope.username = data.data;
                if (attrs.ifAuthed == 'show') {
                    elm.show();
                } else {
                    elm.hide();
                }
            });
            scope.$on('event:auth-loginConfirmed', function (event) {
                if (attrs.ifAuthed == 'show') {
                    elm.show();
                } else {
                    elm.hide();
                }
            });
            scope.$on('event:auth-loggedOut', function (event) {
                if (attrs.ifAuthed == 'show') {
                    elm.hide();
                } else {
                    elm.show();
                }
            });
            scope.$on('event:auth-loginRequired', function () {

                if (attrs.ifAuthed == 'show') {
                    elm.hide();
                } else {
                    elm.show();
                }
            });
        }
    }
});

app.directive('autoscroll', function () {
    return{
        link: function (scope, elm, attrs) {
            //no reason for this to be in a directive
            angular.element(document).ready(function () {

                $('body').autoscroll(
                    {
                        direction: "down",
                        step: 50,
                        scroll: false,
                        //problems with this
                        pauseOnHover: true
                    }
                );

                /*
                 elm.animate({
                 opacity: 0.25,
                 left: '+=50'
                 //height: 'toggle'
                 }, 5000, function() {
                 // Animation complete.
                 console.log("animation complete");
                 });
                 */
            })

        }
    }
})

app.directive('dropzone', function (dropzone,$rootScope) {
    return{
        restrict: 'E',
        link: function (scope, elm, attrs) {
            //using entryid from BlogEntry Scope not ideal ;8
            console.log(elm);
            dropzone.createDropzone(elm, attrs.url);
            $rootScope.dropzone = dropzone;
            dropzone.registerEvent('complete', elm, function (file) {
                console.log("upload event");
                $rootScope.$broadcast('uploadedFile',{file:file});
            })
            dropzone.registerEvent("addedfile",elm, function(file) {
                console.log("added a file");
                $rootScope.$on('addedFile',{file:file});
                dropzone.setFileLoadedInUi(file);
                //console.log(file);
                /* Maybe display some more file information on your page */
            });
            dropzone.registerEvent("sending",elm, function(file, xhr, formData) {
                console.log(scope);
                formData.append("memwall", scope.entry._id); // Will send the filesize along with the file as POST data.
            });
        }
    }
})

app.directive('onKeyup', function() {
    return function(scope, elm, attrs) {
        function applyKeyup() {
            scope.$apply(attrs.onKeyup);
        };

        var allowedKeys = scope.$eval(attrs.keys);
        elm.bind('keyup', function(evt) {
            //if no key restriction specified, always fire
            if (!allowedKeys || allowedKeys.length == 0) {
                applyKeyup();
            } else {
                angular.forEach(allowedKeys, function(key) {
                    if (key == evt.which) {
                        applyKeyup();
                    }
                });
            }
        });
    };
});

app.factory('show', function () {
    return {state: false};
});

app.factory('categoryService', function () {
    return [
        {name: 'test'}
    ];
});

app.service('userInfoService', function () {
    var username = "Guest";
    return {
        getUsername: function () {
            return username;
        },
        setUsername: function (value) {
            username = value;
        }
    }
});

app.controller('blogViewCtrl', function ($scope, show, categoryService, BlogsService) {
    $scope.categories = BlogsService.getCategories();
    $scope.show = show;


});

app.controller('blogEntryPicCtrl', function ($scope) {
    $scope.test = "TEST RESULT";
});

app.controller('blogEntryCtrl', function ($scope, $location, show, Blog, $routeParams,
                                          socket, $rootScope, $http,dropzone) {


    $scope.parentObject = {
        routeParamId: $routeParams.id,
        entryId: ""
    }
    socket.connect();
    $scope.entry = "";
    $scope.viewers = [];
    $scope.entry.comments = [];
    $rootScope.profileMenuViewable = true;
    $scope.textorphoto = false;

    $scope.flipEntry = function () {

        $scope.textorphoto = !$scope.textorphoto;
        $scope.photobox = !$scope.photobox;
        $scope.videobox = false;
        $scope.eventbox = false;
        switchCheckFromPhotoToVideo();
    }

    $scope.toogleVideoEntry  = function(){

        $scope.videobox = !$scope.videobox;
        $scope.photobox = false;
        $scope.eventbox = false;
        switchCheckFromPhotoToVideo();
    }
    $scope.toogleEventEntry  = function(){
        console.log("eetest")
        $scope.eventbox = !$scope.eventbox;
        $scope.videobox = false;
        $scope.photobox = false;
        switchCheckFromPhotoToVideo();
    }

    function switchCheckFromPhotoToVideo(){
        console.log($scope.photobox +" "+$scope.videobox+" "+$scope.eventbox);
      if($scope.photobox || $scope.videobox || $scope.eventbox){
          $scope.textbox = true;

      }else{
        $scope.textbox = false;
      }
    }

    $scope.submitVideo = function(){
        $http.post('')
    }
    $scope.submitEvent = function(){
        $http.post('')
    }

    $scope.postText = "";
    if (!$scope.template) {
        $scope.template = '/partials/profile/Latest.html';
        $scope.contentHeaderTitle = 'Latest';

    }
    $scope.loadPage = function (page) {
        console.log("loadpage");
        $scope.template = '/partials/profile/' + page.toLowerCase() + '.html';
        $scope.contentHeaderTitle = page;


    }

    $scope.submit = function () {
        console.log("button fired");
        $http.post('/addtextpost', {text: $scope.postText, id: $scope.entry._id}).
            success(function (data, status) {
                console.log(data);
                console.log("emited socket events");
                socket.emit('postText', {room: $scope.entry._id});
                $scope.postText = "";
            }).error(function (err) {
                console.log(err);
            });
    }
    socket.on('testrec', function (data) {
        console.log(data);
        console.log("rece socket event");
    })

    socket.on('login', function () {
        socket.emit('subscribe', {room: $scope.entry._id});
    });
    socket.on('initialuserlist', function (data) {
        $scope.viewers = data;
    });


    socket.on('commentsupdated', function () {
        console.log("commentsupdated received");
        //TODO: is this sending the right parameters?
        Blog.get({id: $routeParams.id}, function (blog) {
                $scope.entry = blog[0];
                $scope.text = blog[0].text;
                $scope.comments = blog[0].comments;
                $scope.$onReady("commentsupdated");
            },
            function () {
                $scope.$onFailure("failed");
            });
    });
    socket.on('updateusers', function (data) {
        $scope.viewers = data;
    });
    socket.on('removeuser', function (data) {
        var viewers = [];
        angular.copy($scope.viewers, viewers);
        angular.forEach($scope.viewers, function (value, key) {
            if (value.id == data) {
                $scope.viewers.splice(key, 1);
            }
        });
    });
    $scope.submitComment = function () {
        $scope.entry.comments.unshift({body: $scope.body, date: Date.now()});
        $scope.entry.$save(function (blog) {
            $scope.comments = blog.comments;
            $scope.body = "";
            console.log("sentcomment socket event emitted");
            console.log({room: $scope.entry._id});
            socket.emit('sentcomment', {room: $scope.entry._id});
        });
    };
    $scope.submitphotodata = function(){
        console.log("dropzone pq")
        console.log(dropzone.getFilesLoadedInUI());

        $http.post('/submitphotodata',{files:dropzone.getFilesLoadedInUI(),id:$scope.entry._id})
               .success(function(data){
                    console.log(data);
                //TODO:if data is successfully submitted show user message and clear queue and ui
               })
    }
    $scope.cancelphotodata = function(){
        $http.post('/cancelphotodata')
            .success(function(){
                //TODO:if canceled show user message and clear queue and ui
            })
    }
    show.state = true;
    $scope.show = show;
    $scope.$prepareForReady();
    /*
     BlogsService.getBlogFromLocal($routeParams.id,function(blog){

     $scope.entry = blog;
     $scope.text = blog.text;
     $scope.comments = blog.comments;
     $scope.$onReady("success");
     });
     */


    Blog.get({id: $routeParams.id}, function (blog) {
            console.log('got blog');
            console.log(blog[0].limited);
            console.log(blog[0]);
            $scope.entry = blog[0];

            if (blog[0].limited) {
                $scope.profileMenuViewable = false;
                $location.path("/public/" + $routeParams.id);
            } else {
                $scope.parentObject.entryId = blog[0]._id;
                $scope.text = blog[0].text;
                $scope.comments = blog[0].comments;
                socket.emit('subscribe', {room: blog[0]._id});

                $scope.$onReady("success");
                $location.path("/blog/" + $routeParams.id);
            }

        },
        function () {
            $scope.$onFailure("failed");
        });

    $scope.$on('$routeChangeStart', function (scope, next, current) {
        socket.emit('unsubscribe', {room: $scope.entry._id});
    });
    $scope.$on('$destroy', function () {
        socket.removeListener('enterroom');
        socket.removeAllListeners('initialuserlist');
        socket.removeAllListeners('commentsupdated');
        socket.removeAllListeners('updateusers');
    });
    $scope.$on('uploadedFile',function(data){
        console.log("uploaded scope event called");
        //$http.post('/uploadeddata',{file:data.file,memwall:$routeParams.id})
        console.log(data);
    })
});


app.controller('SearchBarCtrl', function ($scope, $filter, $rootScope) {
    $rootScope.search = {
        search: ""
    }
    $scope.$on('$routeChangeSuccess', function (next, current) {
        console.log(current);
        if (current.templateUrl == "partials/blog.html" || current.templateUrl == undefined) {
            $scope.searchViewable = false;
        } else {
            $scope.searchViewable = true;
        }
    });

    $scope.clearSearch = function () {
        $rootScope.search.search = "";
    }


});

app.controller('GroupingCtrl', function ($scope, $rootScope) {
    $rootScope.subgroup = undefined;
    $scope.$on('$routeChangeSuccess', function (next, current) {
        console.log(current);
        if (current.templateUrl == "partials/blog.html" || current.templateUrl == undefined) {
            $scope.groupingViewable = false;
        } else {
            $scope.groupingViewable = true;
        }
    });
    $scope.changeSubgroup = function (subgroup) {
        console.log(subgroup);
        $rootScope.subgroup = subgroup;
    }
});

app.controller('LoginController', function ($scope, $http, authService, userInfoService, socket, $rootScope) {
    $scope.error = "";
    $scope.message = "";
    $scope.loginAttempt = false;
    $scope.submitAuth = function () {
        $rootScope.$broadcast('event:auth-loginAttempt');
        $scope.loginAttempt = true;
        $scope.error = "";
        $http.post('/login', $scope.form)
            .success(function (data, status) {
                userInfoService.setUsername($scope.form.username);
                $scope.form.username = "";
                $scope.form.password = "";
                authService.loginConfirmed();
                window.location.reload();
            }).error(function (data, status) {
                $scope.error = "Failed to connect to server please check your connection";
            });
    };

    socket.on('connect', function () {
        console.log("connect");
    });
    socket.on('disconnect', function () {
        console.log("disconnect");
    });
    socket.on('connecting', function (x) {
        console.log("connecting", x);
    });
    socket.on('connect_failed', function () {
        console.log("connect_failed");
    });
    socket.on('close', function () {
        console.log("close");
    });
    socket.on('reconnect', function (a, b) {
        console.log("reconnect", a, b);
    });
    socket.on('reconnecting', function (a, b) {
        console.log("reconnecting", a, b);
    });
    socket.on('reconnect_failed', function () {
        console.log("reconnect_failed");
    });
    $scope.$on('event:auth-loginRequired', function () {
        if ($scope.loginAttempt == true) {
            $scope.error = "Username or password is incorrect";
        }
    });


});

app.controller('RegisterCtrl', function ($scope, $http, $rootScope,socket) {
    $scope.submitRegi = function () {
        $http.post('/register', $scope.form).
            success(function (data) {
                if (data.fail) {
                    $scope.message = data.fail;
                } else {
                    $scope.form = {};
                    $rootScope.$broadcast('event:auth-registered');
                }
            }).
            error(function () {
                $scope.message = "Registration failed please check connection";
            });
    }
    $scope.submitUserDetails = function () {
        $http.post('/register', $scope.form).
            success(function (data) {
                if (data.fail) {
                    $scope.message = data.fail;
                } else {
                    $scope.form = {};
                    $rootScope.$broadcast('event:userdetails-success');
                }
            }).
            error(function () {
                $scope.message = "Registration failed please check connection";
            });
    }
});

app.controller('UserInfoCtrl', function ($scope, userInfoService, $http) {
    $scope.username = userInfoService.getUsername();
    $scope.logout = function () {
        $http.post('/logout').
            success(function () {
                //console.log("success should never come here");
            }).error(function () {
                //console.log("error on logout??")
            })
    };
    //waiting for a 410 from the authorizer service
    $scope.$on('event:auth-loggedOut', function (event) {
        $scope.username = "Guest";
        window.location.reload();

    })

});

//TODO:add a simple twitter feed here
app.controller('TwitterCtrl', function ($scope, Blog, Twitter, $routeParams) {
    $scope.twitterResult = Twitter.get();
});

//Child of BlogEntry
app.controller('LatestCtrl', function ($scope, $http, $routeParams, socket) {
    console.log('LatestCtrl started');
    console.log($scope);
    console.log($scope.routeParamId);
    $scope.commentbox = [];
    $scope.newcomment =[];
    $scope.$watch('parentObject.entryId', function (newVal, oldVal) {
        console.log(oldVal);
        console.log(newVal);
        $http.get('/lastestPosts/' + newVal).
            success(function (data, err) {
                $scope.posts = data;
            }).
            error(function (err, code, status) {
                console.log(err + code + status);
            });
    })
    $scope.showcommentbox = function(index){
        $scope.commentbox[index] = true;
    }
    $scope.submitComment = function(index){
                    console.log("Submitted");
        console.log($scope.posts);
            console.log($scope.newcomment[index]);
        $http.post('/subcomment',{text:$scope.newcomment[index],comment_id:$scope.posts[index]._id,id:$scope.parentObject.entryId}).
            success(function(data){
                console.log("Successfully sent data");
                console.log(data);
                socket.emit('subcomment',{room:$scope.parentObject.entryId,text:$scope.newcomment[index],comment_id:$scope.posts[index]._id})
               // $scope.posts[index].comments.unshift({text:$scope.newcomment.text});
                $scope.newcomment.text = "";
                $scope.commentbox[index] = false;
            })
            console.log("comment submitted")

    }
    socket.on('newPostText', function (data) {
        console.log("get new POst text");
        console.log(data);

        $scope.posts.unshift(data);
    });
    socket.on('subcommentupdated',function(data){
        for(var x = 0;x<$scope.posts.length;x++){
            if($scope.posts[x]._id == data.comment_id){
                console.log($scope.posts[x]);
                if($scope.posts[x].comments == undefined){
                    $scope.posts[x].comments = [];
                    $scope.posts[x].comments.push({text:data.text})
                }else{
                    $scope.posts[x].comments.unshift({text:data.text});

                }
            }
        }
    })
});

app.controller('PicsCtrl',function($scope,$http){
    $scope.pics = [];
    $scope.$watch('parentObject.entryId', function (newVal, oldVal) {
        console.log(oldVal);
        console.log(newVal);
        $http.get('getPicsForBlog/'+newVal).
            success(function(data){
                console.log(data);
                $scope.pics = data;
            })
    })

});

app.controller('PetitionCtrl',function($scope,api){
    $scope.petitions = [];

    api.getResourceById('Petition','all',function(petitions){
       $scope.petitions = petitions;

    });
    $scope.submit = function(){
        var text = $scope.text;
        var title = $scope.title;
        api.createResource('Petition',{text:text,title:title});
        $scope.title = "";
        $scope.text  = "";
    }
});
app.controller('PetitionEntryCtrl',function($scope,api,$routeParams){
    $scope.petition = [];

    api.getResourceByField('Petition',{field:"title",query:$routeParams.title},function(petitions){
       $scope.petition = petitions;
        $scope.signatures = $scope.petition[0].signatures;

    });
    $scope.signPetition = function(){
        console.log($scope.petition)
        api.createSubDocResource('Petition',$scope.petition[0]._id,'signatures');
    }
});


 /*
function youtube($string,$autoplay=0,$width=480,$height=390)
{
    preg_match('#(?:http://)?(?:www\.)?(?:youtube\.com/(?:v/|watch\?v=)|youtu\.be/)([\w-]+)(?:\S+)?#', $string, $match);
    $embed = <<<YOUTUBE
        <div align="center">
            <iframe title="YouTube video player" width="$width" height="$height" src="http://www.youtube.com/embed/$match[1]?autoplay=$autoplay" frameborder="0" allowfullscreen></iframe>
        </div>
    YOUTUBE;

    return str_replace($match[0], $embed, $string);
    }
     */
