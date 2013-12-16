angular.module('blogFilter', []).
    filter('bySubgroup', function ($rootScope) {

        return function (blogs, tag) {
            console.log("filter applied");
            console.log("tag : "+tag);
            console.log("search :" +$rootScope.search.search);
            if (blogs == undefined && tag == undefined) {
                return;
            } else if (blogs != undefined && tag == undefined) {
                return blogs;
            } else if (blogs != undefined && tag != undefined) {
                var buffer = [];
                for (var x = 0; x < blogs.length; x++) {
                        if (blogs[x].subgroup === tag) {
                            buffer.push(blogs[x]);
                        }
                }
                return buffer;
            }
        }
    });