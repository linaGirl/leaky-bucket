!function() {

    var   Class         = require('ee-class')
        , type          = require('ee-types')
        , log           = require('ee-log')
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


        // how many tokens to refill per socond
        , refillRate: 1


        // timer which may be set to work the queue
        , timer: null



        /**
         * class constructor
         *
         * @apram <integer> bucket capacity per minute
         */
        , init: function(capacity, slotSize) {
            
            // optional settings
            if (type.number(capacity)) this.capacity = capacity;
            if (type.number(slotSize)) this.slotSize = slotSize;

            // compute the refillrate in tokens / second
            this.refillRate = this.slotSize/this.capacity;

            // queue storage
            this.queue = [];

            if (debug) log.info('Created leaky bucket with a capacity of %s, a slot size of %s seconds and a refill rate of %s second per item ...', this.capacity, this.slotSize, this.refillRate); 
        }



        /**
         * throtthle a function
         * 
         * @param <integer|function> number of tokens to use (defaults to 1) or callabck
         * @param <function> optional callback
         * @param <boolean> true if the items source is the queue (internal use only)
         */
        , throttle: function(tokenCost, cb, fromQueue) {
            var   now = Date.now()
                , item;

            // check the input
            if (type.function(tokenCost)) {
                cb = tokenCost;
                tokenCost = 1;
            }

            // refill tokens
            this.left += Math.min((now-this.last)/1000/this.refillRate, this.capacity);


            if (debug) log.debug('The leaky bucket has %s items left ...', this.left);


            // do we have enough capacity?
            if (this.left >= tokenCost) {
                if (debug) log.debug('Executing item with a cost of %s item(s) ...', tokenCost);

                // apply cost, store last execution timestamp
                this.left -= tokenCost;
                this.last = now;

                // execute
                cb();
            }
            else {
                if (debug) log.debug('Adding item with a cost of %s item(s) to the queue ...', tokenCost);

                // add to queue, to the beginning if
                // the source was the queue itself
                item = {
                      cb: cb
                    , tokenCost: tokenCost
                };

                if (fromQueue) this.queue.unshift(item);
                else this.queue.push(item);
            }


            // if we got queued items and not already a timer
            // running, start a new timer
            if (this.queue.length && this.timer === null) {
                if (debug) log.debug('started a timer for the next item to be excuted, waiting %s milliseconds ...', Math.round((1-this.left)*this.refillRate*1000));

                this.timer = setTimeout(function() {
                    var queuedItem = this.queue.shift();

                    this.timer = null;
                    this.throttle(queuedItem.tokenCost, queuedItem.cb, true);
                }.bind(this), Math.round((1-this.left)*this.refillRate*1000));
            }
        }
    });
}();
