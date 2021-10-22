# leaky-bucket

A fast and efficient leaky bucket for node.js and the Browser

Leaky buckets are often used to rate limits calls to APIs. They can be 
used on the server, to make sure the client does not send too many 
requests in a short time or on the client, to make sure to not to send 
too many requests to a server, that is rate limiting using a leaky 
bucket. 

Leaky buckets are burstable: if a server lets a client send 10 requests 
per minute, it normally lets the user burst those 10 requests in a short 
time. After that only one request every 6 seconds may be sent (60 seconds 
/ 10 requests). If the user stops sending requests, the bucket is filled 
up again so that the user may send a burst of requests again.


New in Version 4:
- dropped node.js support for node <12 (es modules)
- works now in modern browsers too (removed node.js dependencies)
- added a debug flag to the constructor
- added idleTimeout event and constructor flag
- added the initalCapacity option to the constructor
- added the getCapacity() method
- added the getCurrentCapacity() method


## installation

    npm i leaky-bucket


## API

### Constructor

```javascript
import LeakyBucket from 'leaky-bucket';

// a leaky bucket, that will burst 60 items, then will throttle the items to one per seond
const bucket = new Bucket({
    capacity: 60,
    interval: 60,
});
```

#### option: capacity

The capacity defines how many requests may be sent oer interval. If the
capacity is 100 and the interval is 60 seconds and a request has a cost
of 1, every 60 seconds 100 request may be processed. If the request 
cost is 4, just 25 requests may be processed every 60 seconds (100/4 = 25).

The complete capacity can be used in a burst. This means for the example
above, 100 requests can be processed immediately. Thereafter every request
has to weit for 0.6 seconds (60 seconds / 100 capacity) if the request
cost is 1.

#### option: interval

The interval defines, how much seconds it takes to refill the bucket to 
its full capacity. The bucket is not filled every interval, but continously.

#### option: timeout

Normally, the bucket will throw errors when the throttle() method is called
when the bucket is empty. When a timeout is defined, the bucket will queue 
items as long they can be executed within the timeout. Defaults to 0, which 
will not queue any items if the bucket is empty.

#### option: initialCapacity

Some rate limited services will start out with an empty bucket, or refill
the bucket not continusly but in an interval. This option can be used to 
set a starting capacity beween 0 and the configured capacity. If set to 0 
and a request shall be processed immediately and the timeout is 0, the 
bucket will reject the request.

#### option: idleTimeout

If this option is set, the bucket will emti a idleTimeout event after the
bucket is filled completely and no requests are waiting. Configured in 
milliseconds.

#### option: debug

If set to true, the bucket will print debug logs using console.log()



### async bucket.throttle(cost = 1)

This is the main method used for procsessing requests. If this method is 
called and the bucket has more capacity left that the request costs, it 
will continue. If the capacity is less than the cost, it will throw an 
error. If the timeout option is configured, the method will sleep until
there is enough capacity to process it. 

This method accepts two optional parameters:

- cost: the cost of the item, defaults to 1.
- append: if set to false, the item is added at the beginning of the queue and will thus executed before all other queued items. Defaults to true;

```javascript
// throttle an individual item
await bucket.throttle();
doThings();


// Throttle a set of items, waiting for each one to complete before the next one is executed
for (const item of set.values()) {
    await bucket.throttle();
    doThings();
}


// throttle multiple items and wait untiul all are finished
await Promise.all(Array.from(set).map(async(item) => {
    await bucket.throttle();
    doThings();
}));
````


### bucket.pause(seconds)

The pause method can be use to pause the bucket for n seconds. Same as the throttle call but does not throw errors when the bucket is over its capacity.



```javascript
bucket.pause(2);

````


### bucket.pauseByCost(cost)

The pause method can be use to pause the bucket for a specific cost. Same as the throttle call but does not throw errors when the bucket is over its capacity.


```javascript
bucket.pauseByCost(300);

````


### bucket.pay(cost)

Removes the defined cost from the bucket without taking any action. Reduces the current capacity.


```javascript
bucket.pay(cost);

````


### bucket.end()

Shuts down the bucket, clears all timers. Removes all pending items wihtout executing them. The bucket cannot be reused thereafter!


```javascript
bucket.end();
````


### bucket.getCapacity()

Returns the total capacity of the bucket.


```javascript
const capacity = bucket.getCapacity();
````


### bucket.getCurrentCapacity()

Returns the current capacity of the bucket.


```javascript
const currentCapacity = bucket.getCurrentCapacity();
````

### bucket.setTimeout(seconds)

Sets the amount of seconds the bucket queue items before it starts to reject them. Same as the timeout option in the constructor


```javascript
bucket.setTimeout(300);
````

### bucket.setInterval(seconds)

Sets the interval it takes to refill the bucket completely. Same as the interval option in the constructor


```javascript
bucket.setInterval(60);
````

### bucket.setCapacity(capacity)

Sets the capacity of the bucket. Same as the capacity option in the constructor


```javascript
bucket.setTimeout(1000);
````



### Event bucket.on('idleTimeout')

This event is emitted, if the bucket is at full capacity and idle for N milliseconds

```javascript
const bucket = new Bucket({
    capacity: 60,
    interval: 60,
});

bucket.on('idleTimeout', (bucketInstance) => {
    bucket.end();
});

// you may remove the listener if you want
bucket.off('idleTimeout');
````



### Event bucket.on('idle')

This event is emitted, when the bucket is idle, thus no items are waiting to be executed.

```javascript
const bucket = new Bucket({
    capacity: 60,
    interval: 60,

bucket.on('idle', (bucketInstance) => {
    console.log('bucket is idling');
});

// you may remove the listener if you want
bucket.off('idle');
````

### bucket.off(eventName, optional handler)

Removes all or one listeners for an event

```javascript
const bucket = new Bucket({
    capacity: 60,
    interval: 60,
});

// remove all listeners for the idle event
bucket.off('idle')

const listener = (bucketInstance) => {
    console.log(bucketInstance.getCurrentCapacity());
}

bucket.on('idle', listener);

// remove one specific listener
bucket.off('idle', listener);
````


## Browser

The bucket can used in the Browser. Import `src/LeakyBucket.js` for that usecase.


## Debugging

In order to debug the internals of the bucket you may enable debugging by passing the debug flag to the constructor.

```javascript
const bucket = new Bucket({
    capacity: 60,
    interval: 60,
    debug: true,
});
````

## express.js

If you'd like to throttle incoming requests using the leaky bucket with express, you may register it as middleware. The example below shows a bucket per user, identified by a cookie identifying the user. The bucket gets deleted after a user has not sent requests for 2 minutes.


```javascript
import LeakyBucket from 'leaky-bucket';
import express from 'express';


const app = express()
const buckets = new Map();
const costOfOperation = 50;

app.use((req, res, next) => {
    // your cookie should be secure and not guessable by the user
    const userUid = req.cookies.userUid;

    // set up a bucket for the user
    if (!users.has(userUid)) {
        const bucket = new Bucket({
            capacity: 1000,
            interval: 60,
            idleTimeout: 120 * 1000 // 120 seconds
        });

        // end the bucket, remove it from memory when it becomes idle
        bucket.on('idleTimeout', () => {
            bucket.end();
            buckets.delete(userUid);
        });

        // store for later access
        buckets.set(userUid, bucket);
    }

    // get the users bucket
    const usersBucket = buckets.get(userUid);


    try {
        // try to execute the request, if the bucket is empty, it will throw an error
        usersBucket.throttle(costOfOperation);
    } catch (e) {
        // bucket is over capacity
        res.status(420).send(`Enhance your calm!`);
        return;
    }


    // all set and fine, continue to process the request
    res.set('x-rate-limit-cost', costOfOperation);
    res.set('x-rate-limit-bucket-size', bucket.getCapacity());
    res.set('x-rate-limit-remaining-size', bucket.getCurrentCapacity());
    next();
});


app.listen(8080);
````
