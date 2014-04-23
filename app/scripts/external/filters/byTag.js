angular.module('blogFilter', []).
    filter('bySubgroup', function ($rootScope) {

        return function (blogs, tag) {
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