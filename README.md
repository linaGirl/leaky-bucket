# leaky-bucket

A fast and efficient leaky bucket for node.js and the Browser

Leaky buckets are often used to rate limits calls to APIs. They can be used on the server, to make sure 
the client does not send too many requests and on the client, to make sure to not to send too many
requests to a server rate limiting using a leaky bucket. Leaky buckets are burstable: if a server lets a
client send 10 requests per minute, it normally lets the user burst those 10 reuests. after that only one
request per 6 seconds may be sent (60 seconds / 10 requests). If the user stops sending requests, the bucket 
is filled up again so that the user may send a burst of requests again.


New in Version 4:
- dropped node.js support for node <12 (es modules)
- works now in modern browsers too (removed node.js dependencies)
- added a debug flag to the constructo
- added idleTimeout event and constructor flag
- added the initalCapacity option to the constructor
- added the canExecuteNow method


## installation

    npm i leaky-bucket


## API

### Constructor


Sets up the leaky bucket. Accpets three optional options

- capacity: this is the amount of items that may be processed per interval, if the items cost is 1 (which is the default)
- interval: this is the interval, in which the capacity may be used
- timeout: defines, how long it takes until items are rejected due to an overflow. defaults to the value of the interval, so that the overflow occurs at the same time the bucket is empty.
- debug: print log messages using console.log
- initialCapacity: the bucket starts normally with the full capacity, this lets you override this with a custom value
- idleTimeout: if set, the bucket will emit the idleTimeout event after the specified amount of milliseconds as soon the bucket is empty and at full capacity


```javascript
import LeakyBucket from 'leaky-bucket';

// a leaky bucket, that will burst 60 items, then will throttle the items to one per seond
const bucket = new Bucket({
    capacity: 60,
    interval: 60,
});
```


### throttle()

The throttle method is used to delay items until the bucket leaks them, thus rate limiting them. If the bucket is overflowing, which is when items cannot be executed within the timeout, the throttle method will reject using an error.

This method accepts two optional paramters:

- cost: the cost of the item, defaults to 1
- append: if the ittem should be appended or added at the first position in the queue, defaults to true

```javascript
/// throttle an individual item
await bucket.throttle();
doThings();

// Throttle aset of items, waiting for each one to complete, before it's added to the bucket
for (const item of set.values()) {
    await bucket.throttle();

    doThings();
}


// throttle items, add them to the bucket in paralle
await Promise.all(Array.from(set).map(async(item) => {
    await bucket.throttle();

    doThings();
}));
````


### pause()

The pause method can be use to pause the bucket for n seconds until it is allwed to resume.


```javascript
bucket.pause();

````


### pay(cost)

removes the defined cost from the bucket


```javascript
bucket.pay(cost);

````


### end()

shuts down the bucket. Removes all pending items wihtout executing them. The bucket cannot be reused thereafter!


```javascript
bucket.end();
````



### event 'idleTimeout'

Is emitted, if the bucket is at full capacity and idle for N milliseconds
```javascript
const bucket = new Bucket({
    capacity: 60,
    interval: 60,
    idleTimeout: 2000,
});

bucket.on('idleTimeout', (bucketInstance) => {
    bucket.end();
});

// you may remove the listener if you want
bucket.off('idleTimeout');
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



const buckets = new Map();

app.use((req, res, next) => {
    const userUid = req.cookies.userUid;

    // set up a bucket for the user
    if (!users.has(userUid)) {
        const bucket = new Bucket({
            capacity: 60,
            interval: 60,
            idleTimeout: 120 * 1000 // 120 seconds
        });

        // end the bucket, remove it from memory
        bucket.on('idleTimeout', () => {
            bucket.end();
            buckets.delete(userUid);
        });

        // store for later use
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
    res.set('x-request-cost', costOfOperation);
    res.set('x-rate-limit', `${bucket.currentCapacity}/${bucket.capacity}`);
    next();
});
````