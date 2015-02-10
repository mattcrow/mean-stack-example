var app = angular.module('flapperNews', ['ui.router']);

/**************
 ** Services **
 **************/
app.factory('posts', [
    '$http',
    function($http) {
        var o = {
            posts: []
        };

        // GET ALL
        o.getAll = function() {
            return $http.get('/news/posts').success(function(data) {
                angular.copy(data, o.posts);
            });
        };

        // GET SINGLE
        o.get = function(id) {
            return $http.get('/news/posts/' + id).then(function(res) {
                return res.data;
            });
        };

        // CREATE
        o.create = function(post) {
            return $http.post('/news/posts', post).success(function(data) {
                o.posts.push(data);
            });
        };

        // UPDATE adding up vote to a post
        o.upvote = function(post) {
            return $http.put('/news/posts/' + post._id + '/upvote')
                .success(function(data) {
                    post.upvotes += 1;
            });
        };

        // UPDATE adding comment
        o.addComment = function(id, comment) {
            return $http.post('/news/posts/' + id + '/comments', comment);
        };

        // UPDATE adding up vote to a comment
        o.upvoteComment = function(id, comment) {
            return $http.put('/news/posts/' + id + '/comments/' + comment._id +
                    '/upvote')
                .success(function(data) {
                    comment.upvotes += 1;
            });
        };

        return o;
    }
]);

/*****************
 ** Controllers **
 *****************/
app.controller('MainCtrl', [
    '$scope',
    'posts',
    function($scope, posts) {

        // Init
        $scope.posts = posts.posts;

        // Add a new post
        $scope.addPost = function() {
            if (!$scope.title || $scope.title === '') {
                return;
            }
            posts.create({
                title: $scope.title,
                body: $scope.body
            });
            $scope.title = '';
            $scope.body = '';
        };

        // Increment the up votes of a post
        $scope.incrementUpvotes = function(post) {
            posts.upvote(post);
        };

    }
]);

app.controller('PostsCtrl', [
    '$scope',
    'posts',
    'post',
    function($scope, posts, post) {

        // Init
        $scope.post = post;

        // Add a new comment
        $scope.addComment = function() {
            if ($scope.body === '') {
                return;
            }
            posts.addComment(post._id, {
                body: $scope.body,
                author: $scope.author,
            }).success(function(comment) {
                $scope.post.comments.push(comment);
            });
            $scope.author = '';
            $scope.body = '';
        };

        // Increment the up votes of a comment
        $scope.incrementCommentUpvotes = function(comment) {
            posts.upvoteComment(post._id, comment);
        };
    }
]);

/************
 ** Routes **
 ************/
app.config(['$stateProvider', '$urlRouterProvider',
    function($stateProvider, $urlRouterProvider) {
        $stateProvider
            .state('home', {
                url:            '/home',
                templateUrl:    '/home.html',
                controller:     'MainCtrl',
                resolve: {
                    postPromise: ['posts',
                        function(posts) {
                            return posts.getAll();
                        }
                    ]
                }
            })
            .state('posts', {
                url:            '/posts/{id}',
                templateUrl:    '/posts.html',
                controller:     'PostsCtrl',
                resolve: {
                    post: ['$stateParams', 'posts',
                        function($stateParams, posts) {
                            return posts.get($stateParams.id);
                        }
                    ]
                }
            });
        $urlRouterProvider.otherwise('home');
    }
]);