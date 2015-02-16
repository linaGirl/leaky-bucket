!function() {

    var   Class         = require('ee-class')
        , type          = require('ee-types')
        , log           = require('ee-log')
        , Promise       = (Promise || require('es6-promise').Promise)
        , debug         = require('ee-argv').has('debug-leaky-bucket') || process.env['debug-leaky-bucket'];



    module.exports = new Class({

        // the number of tokens (request) that are left
          left: 0


        // timestamp of the last reuqest
        , last: 0


        // size of the slot where capcity tokens can be used 
        // in seconds, deaults to 60
        , slotSize: 60


        // capacity, defaults to 60 tokens / minute
        , capacity: 60


        // how many seconds it takes to refill one item
        , refillRate: 1


        // timer which may be set to work the queue
        , timer: null


        // how long can a item wait before it gets a timeout
        // defaults to 5 minutes, 300 seconds
        , maxWaitingTime: 300


        // indicates how long the next item has to 
        // wait until its executed, stored as reserved cost, 
        // not time
        , waitTime: 0


        /**
         * class constructor
         *
         * @param <integer> bucket capacity per minute, or options object
         * @param <integer> what time can it take to execute the capacity
         * @param <integer> items should not wait longer then n seconds,
         *                  if they do, abort them
         */
        , init: function(capacity, iterval, maxWaitingTime) {
                
            if (type.object(capacity) && capacity != null) {
                if (type.number(capacity.capacity)) this.capacity = capacity.capacity;
                if (type.number(capacity.iterval)) this.slotSize = capacity.iterval;
                if (type.number(capacity.maxWaitingTime)) this.maxWaitingTime = capacity.maxWaitingTime;
            }
            else {
                // optional settings
                if (type.number(capacity)) this.capacity = capacity;
                if (type.number(iterval)) this.slotSize = iterval;
                if (type.number(maxWaitingTime)) this.maxWaitingTime = maxWaitingTime;
            }

            // compute the refillrate in tokens / second
            this.refillRate = this.slotSize/this.capacity;

            // queue storage
            this.queue = [];

            if (debug) log.info('Created leaky bucket with a capacity of %s, a slot size of %s seconds and a refill rate of %s second per item ...', this.capacity, this.slotSize, this.refillRate); 
        }



        /**
         * throttle a function
         * 
         * @param <integer|function> the cost of the operation (defaults to 1) or callabck
         * @param <function> optional callback
         */
        , throttle: function(cost, cb) {
            
            // check the input
            if (type.function(cost)) {
                cb = cost;
                cost = 1;
            }
            else if (!type.number(cost)) cost = 1;

            // working with callbacks or promises?
            if (type.function(cb)) this._throttle(cost, cb, false);
            else {
                return new Promise(function(resolve, reject) {
                    this._throttle(cost, function(err) {
                        if (err) reject(err);
                        else resolve();
                    }.bind(this), false);
                }.bind(this));
            }
        }



        /**
         * private throttle method, works only with callbacks. 
         * the public interface works with promises too.
         *
         * @param <integer> the cost of the operation 
         * @param <function> callback
         * @param <boolean> true if the items source is the queue
         */
        , _throttle: function(cost, cb, fromQueue) {
            var   now = Date.now()
                , waitTime
                , item;

            // refill
            this.left += Math.min((now-this.last)/1000/this.refillRate, this.capacity);
            this.last = now;


            if (debug) log.debug('The leaky bucket has %s items left ...', this.left);


            // do we have enough capacity to execute now?
            if (this.left >= cost) {
                if (debug) log.debug('Executing item with a cost of %s item(s) ...', cost);

                // apply cost, store last execution timestamp
                this.left -= cost;

                // remove from wait time if the item has come from the queue
                if (fromQueue) this.waitTime -= cost;

                // execute
                cb();
            }
            else {
                // we need to compute the time until this item will be executed, 
                // if the timeout time is exceeded don't queue bit return an errror
                waitTime = (this.waitTime*(1000/this.refillRate)-(now-this.last))/1000;

                if (waitTime > this.maxWaitingTime) {
                    if (debug) log.debug('Rejecting item because its waiting time %s exceeds the max waiting time of %s ...', waitTime, this.maxWaitingTime);

                    cb(new Error('Timeout exceeded, too many waiting requests! Would take '+waitTime+' seconds to complete, the max waiting time is '+this.maxWaitingTime+'!'));
                }
                else {
                    if (debug) log.debug('Adding item with a cost of %s item(s) to the queue ...', cost);

                    // add to queue, to the beginning if
                    // the source was the queue itself
                    item = {
                          cb: cb
                        , cost: cost
                    };

                    // increase the wait time variable so we can copute the exact time
                    // that it will takr to execute the last added item
                    this.waitTime += cost;

                    // queue at the end if the item was added by the user
                    if (fromQueue) this.queue.unshift(item);
                    else this.queue.push(item);
                }
            }


            // if we got queued items and not already a timer
            // running, start a new timer
            if (this.queue.length && this.timer === null) {
                if (debug) log.debug('started a timer for the next item to be excuted, waiting %s milliseconds ...', Math.round((cost-this.left)*this.refillRate*1000));

                this.timer = setTimeout(function() {
                    
                    // freee the timer, so it can be re-set
                    this.timer = null;

                    // check if the queue still contains stuff, else don't do anything
                    // this should never be the case unless someone removes items
                    // from the queu eat another place
                    if (this.queue.length) {
                        var queuedItem = this.queue.shift();
                        this._throttle(queuedItem.cost, queuedItem.cb, true);
                    }
                }.bind(this), Math.round((cost-this.left)*this.refillRate*1000));
            }
        }
    });
}();
