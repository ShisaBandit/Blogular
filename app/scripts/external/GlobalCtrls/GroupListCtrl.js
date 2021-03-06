/**
 * Created with JetBrains WebStorm.
 * User: Ray Garner
 * Date: 13/02/08
 * Time: 0:45
 * To change this template use File | Settings | File Templates.
 */
angular.module('Plugin.Controller.GroupEntries', ['updateService', 'blogService', 'Scope.onReady'])
    .controller('ContentGroupsCtrl', function ($scope, show, Blog, BlogsService, $q, $routeParams, UpdateService) {
        $scope.entries = [];
        $scope.$prepareForReady();

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
            console.log("groups are busy")
                if($scope.busy)return;
                $scope.busy = true;
                BlogsService.paginatedBlogs($scope.skip,$scope.limit,function(blogs){
                    for(var i = 0;i<blogs.length;i++){
                        console.log("groups are busy but working"+blogs[i].group)

                        if(blogs[i].group == true)
                            $scope.entries.push(blogs[i]);
                    }
                    $scope.skip += $scope.limit;


                    $scope.busy = false;

                })
        }

    });