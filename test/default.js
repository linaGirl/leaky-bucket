
    
    var   Class         = require('ee-class')
        , log           = require('ee-log')
        , assert        = require('assert');


    //process.env['debug-leaky-bucket'] = true;

    var   LeakyBucket = require('../');


    



    describe('The LeakyBucket', function(){
        it('should not crash', function(){
            new LeakyBucket();
        });


        it('should execute all items immediatelly if there is enough capacity', function(done) {
            var   start         = Date.now()
                , executed      = 0
                , maxTime       = 900
                , minTime       = 0
                , capacity      = 10
                , items         = 10
                , iterator      = items
                , cb, bucket;


            cb = function() {
                var duration;

                if (++executed === items) {
                    duration = Date.now()-start;

                    assert(duration>=minTime, '');
                    assert(duration<maxTime);

                    done();
                }
            }


            bucket = new LeakyBucket(capacity);

            while(iterator--) bucket.throttle(cb);
        });




        it('should not execute all items immediatelly if there is not enough capacity I', function(done) {
            var   start         = Date.now()
                , executed      = 0
                , maxTime       = 12500
                , minTime       = 12000
                , capacity      = 10
                , items         = 12
                , iterator      = items
                , cb, bucket;


            // wait fo rthe bucket
            this.timeout(15000);


            cb = function() {
                var duration;

                if (++executed === items) {
                    duration = Date.now()-start;

                    assert(duration>=minTime, 'The leaky bucket finished too soon ('+duration+' < '+minTime+') ...');
                    assert(duration<maxTime, 'The leaky bucket finished too late ('+duration+' >'+maxTime+') ...');

                    done();
                }
            }


            bucket = new LeakyBucket(capacity);

            while(iterator--) bucket.throttle(cb);
        });




        it('should not execute all items immediatelly if there is not enough capacity II', function(done) {
            var   start         = Date.now()
                , executed      = 0
                , maxTime       = 10500
                , minTime       = 9000
                , capacity      = 60
                , items         = 70
                , iterator      = items
                , cb, bucket;


            // wait fo rthe bucket
            this.timeout(15000);


            cb = function() {
                var duration;

                if (++executed === items) { 
                    duration = Date.now()-start;

                    assert(duration>=minTime, 'The leaky bucket finished too soon ('+duration+' < '+minTime+') ...');
                    assert(duration<maxTime, 'The leaky bucket finished too late ('+duration+' > '+maxTime+') ...');

                    done();
                }
            }


            bucket = new LeakyBucket(capacity);

            while(iterator--) bucket.throttle(cb);
        });







        it('should not execute all items immediatelly if there is not enough capacity III', function(done) {
            var   start         = Date.now()
                , executed      = 0
                , maxTime       = 6000
                , minTime       = 4500
                , capacity      = 60
                , items         = 70
                , iterator      = items
                , cb, bucket;


            // wait fo rthe bucket
            this.timeout(15000);


            cb = function() {
                var duration;

                if (++executed === items) { 
                    duration = Date.now()-start;

                    assert(duration>=minTime, 'The leaky bucket finished too soon ('+duration+' < '+minTime+') ...');
                    assert(duration<maxTime, 'The leaky bucket finished too late ('+duration+' > '+maxTime+') ...');

                    done();
                }
            }


            bucket = new LeakyBucket(capacity, 30);

            while(iterator--) bucket.throttle(cb);
        });
    });
    