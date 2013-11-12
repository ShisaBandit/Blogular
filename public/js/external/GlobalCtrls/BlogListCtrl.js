/**
 * Created with JetBrains WebStorm.
 * User: Ray Garner
 * Date: 13/02/08
 * Time: 0:45
 * To change this template use File | Settings | File Templates.
 */
angular.module('Plugin.Controller.BlogEntries', ['updateService', 'blogService', 'Scope.onReady'])
    .controller('ContentCtrl', function ($scope, show, Blog, BlogsService, $q, $routeParams, UpdateService,$location) {
        $scope.entries = [];
        $scope.$prepareForReady();
        $scope.type = "";

        $scope.filtersubgroup = $scope.subgroup;
        //check if user wants to see blogs by categories or not
        if ($routeParams.name) {
            UpdateService.checkIfUpdate(function (result) {
                if (result) {
                    //get all the blogs from server:ie this is first init
                    BlogsService.getBlogs(function (blogs) {
                        $scope.entries = blogs;

                        //**********how to encapsulate in angular??************//
                        $scope.fiterTag = $routeParams.name;
                        //$scope.entries = BlogsService.getAllBlogs();
                        $scope.$onReady("filter");
                        //**********how to encapsulate in angular??************//
                        chopBlogText();
                    });
                } else {
                    //if we dont have any updates just show from cache
                    //**********how to encapsulate in angular??************//
                    BlogsService.getAllBlogs(function (blogs) {
                        $scope.entries = blogs;
                        $scope.fiterTag = $routeParams.name;
                        $scope.$onReady("filter");
                        chopBlogText();
                    });
                    //**********how to encapsulate in angular??************//
                }
            })

        } else {
            show.state = false;
            $scope.show = show;
                $scope.getEntries = function () {
                    BlogsService.getAllBlogs(function (blogs) {
                        $scope.entries = blogs;
                        $scope.categories = BlogsService.getCategories();
                        $scope.$onReady("success");
                        chopBlogText();
                    });
                }



            $scope.getBackImg = function (_id) {
                angular.forEach($scope.entries, function (value, key) {
                    if (value._id == _id) {
                        return value.titleImage;
                    }
                })
            }
        }
        //conv method
         function chopBlogText(){
             for(var i = 0;i<$scope.entries.length;i++){
                 $scope.entries[i].text = chopText($scope.entries[i].text,100);
             }
         }

        function chopText(txt,no){return txt == undefined ? null : txt.substring(0,no);}
        $scope.busy = false;
        $scope.skip = 0;
        $scope.limit = 8;

        $scope.nextPage = function(){
            console.log("getting busy!!")

            if($scope.busy)return;
                console.log("getting groups")
                $scope.busy = true;
                BlogsService.paginatedBlogs($scope.skip,$scope.limit,function(blogs){
                    for(var i = 0;i<blogs.length;i++){
                        console.log("getting groups and looping")

                        if(blogs[i].group == false || blogs[i].group == undefined){
                            if("/pets" == $location.path() && blogs[i].pet == true){
                                $scope.entries.push(blogs[i]);
                            }
                            if("/pets" != $location.path()){
                                $scope.entries.push(blogs[i]);
                            }


                        }

                    }
                    $scope.skip += $scope.limit;
                    $scope.busy = false;
                })
           }
    });