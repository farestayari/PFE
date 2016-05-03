'use strict';

angular.module('educo.courses')
    .config(['$routeProvider', '$locationProvider', function($routeProvider, $locationProvider){
        $routeProvider
            .when('/course', {
                templateUrl: '/modules/course/views/course.html',
                resolve: {
                    resolvedFeeds: resolvedFeeds({limitComments: true})
                }
            })
    }
]);