/**
 * Created with JetBrains WebStorm.
 * User: Ray Garner
 * Date: 13/02/07
 * Time: 10:00
 * To change this template use File | Settings | File Templates.
 */
var appAdmin = angular.module('blogAppAdmin', ['apiResource','apiResource','blogService','userService', 'login', 'ngCookies', 'loaderModule', 'blogResource', 'adminResource', 'http-auth-interceptor', 'Plugin.Controller.Title', 'Plugin.Controller.BlogEntries']).
    config(function ($routeProvider) {
        $routeProvider.
            when("/", {templateUrl: "partials/admin/blogList.html"}).
            when("/members", {templateUrl: "partials/admin/members.html"}).
            when("/edit/:blogId", {templateUrl: "partials/admin/edit.html"}).
            when("/add", {templateUrl: "partials/admin/createBlogEntry.html"}).
            when("/adminInstructions", {templateUrl: "partials/admin/adminInstructions.html"}).
            when('/addWorkshop',{templateUrl:'partials/admin/addWorkshop.html'}).
            when('/workshops',{templateUrl:'partials/admin/workshops.html'}).
            when('/editworkshop/:workshop',{templateUrl:'partials/admin/editWorkshop.html'})
    });

appAdmin.directive('login', function () {
    return {
        restrict: "A",
        link: function (scope, elm) {
            elm.hide();
            scope.$on('event:auth-loginRequired', function () {
                elm.slideDown();
            });
            scope.$on('event:auth-loginConfirmed', function () {
                elm.slideUp();
            });
        }
    }
});

appAdmin.factory('show', function () {
    return {state: false};
});

appAdmin.controller('AdminAppCtrl', function ($scope) {
    $scope.safeApply = function (fn) {
        var phase = this.$root.$$phase;
        if (phase == '$apply' || phase == '$digest') {
            if (fn && (typeof(fn) === 'function')) {
                fn();
            }
        } else {
            this.$apply(fn);
        }
    };
});

appAdmin.controller('LoginController', function ($scope, Admin, authService, $http) {

        $scope.submitAuth = function () {
            $http.post('/login', $scope.form)
                .success(function (data) {
                    console.log(data);
                    authService.loginConfirmed();
                }).error(function () {
                    $scope.error = "Failed to connect to server please check your connection";
                });
        }
    }
);

appAdmin.controller('AddBlogCtrl', function ($scope, BlogsService, Blog, $location, $cookies) {
    $scope.submitPost = function () {
        if($scope.form.categories != undefined){
            var categories = $scope.form.categories.split(',');
            var bufferArr = [];
            angular.forEach(categories, function (value) {
                var bufferObj = {name: value};
                bufferArr.push(bufferObj);
            });
            $scope.form.categories = bufferArr;
        }

        BlogsService.updateBlog($scope.form,function(err){
            if(err){
                $scope.message = "Blog entry must have a title.";
            }
            $scope.form.title = "";
            $scope.form.author = "";
            $scope.form.text = "";
            $scope.message = "";
        });
    }
});

appAdmin.controller('EditBlogCtrl', function ($scope, Blog, $routeParams) {

    Blog.get({id: $routeParams.blogId}, function (blogP) {
        $scope.form = blogP[0];
    });
    $scope.editPost = function () {
        $scope.form.$save();
    };

    $scope.deletePost = function () {
        $scope.form.$remove();
    };
});
appAdmin.controller('AdmMembersCtrl', function ($scope, Blog, $routeParams,api) {

    $scope.members;
    api.getResourceById('User','all',function(users){
        console.log("gEt users");
        console.log(users);
        $scope.members = users;
    })

});


appAdmin.controller('WorkshopCtrl',function($scope,$http,api,$routeParams){
    $scope.workshops = [];
    $scope.form = [];

    api.getResourceById('Workshop','all',function(workshops){
        $scope.workshops = workshops;

    });

    $scope.getWorkshopToEdit = function(){
        console.log("running get workshop to edit function");
        api.getResourceById('Workshop',$routeParams.workshop,function(workshop){
            console.log(workshop);
            $scope.form = workshop[0];
            console.log($scope.form.eventDetails);
        })
    }

    $scope.submit = function(){
        console.log("YOYOYO TEST SUCcess");
        api.createResource('Workshop',$scope.form);
    }
    $scope.submitedit = function(){

        $http.post('edit/Workshop/'+$routeParams.workshop,$scope.form).
            success(function(data){

            }).
            error(function(data){

            })
    }

})