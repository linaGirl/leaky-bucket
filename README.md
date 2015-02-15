# leaky-bucket

A fast and efficient leaky bucket implementation

This module uses [sematic versioning](http://semver.org/)

## installation

    npm i leaky-bucket

## build status

[![Build Status](https://travis-ci.org/eventEmitter/leaky-bucket.png?branch=master)](https://travis-ci.org/eventEmitter/leaky-bucket)


## usage

    var LeakyBucket = require('leaky-bucket');


### Constructor

The constructor accpets two parameter, both are optional

    var instance = new LeakyBucket([ItemsPerInterval = 60][, Interval = 60]);


Create a new leaky bucket which is allowed to execute 120 items per minute

    var bucket = new LeakyBucket(120);


Create a new leaky bucket which is allowed to execute 200 items every 30 seconds

    var bucket = new LeakyBucket(200, 30);



### Throttling

The throttle accepts two parameters, of which the first is optional

    bucktet.throttle([cost], callback);

The cost parameter can be used to let items cost more than other. The cost of one item defaults to 1. If you execvute an item with the cost of 2 it will use 2 slots instead of one.


Throttle an item

    bucket.throttle(function() {
        // do something
    });


Throttle an item with the cost of 10

    bucket.throttle(10, function() {
        // do something
    });


### Flags

You may start your app using the debug-leaky-bucket flag, this will enable logging of the module

    node . --debug-leaky-bucket


## Examples

Rate limit API calls, allowed are no more than 60 requests per second

    var   LeakyBucket = require('leaky-bucket')
        , request     = require('request')
        , bucket;


    // create bucket instance, 60 request per minute
    bucket = new LeakyBucket(60);


    // this will throttle request if required
    bucket.throttle(function() {

        // execute request using the request module
        request({
              method: 'get'
            , url: 'http://awesome.api/win'
        }, function(err, response, body) {

        });
    });