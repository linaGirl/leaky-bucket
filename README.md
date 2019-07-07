# leaky-bucket

A fast and efficient leaky bucket

Leaky buckets are often used to rate limits calls to APIs. They can be used on the server, to make sure 
the client does not send too many requests and on the client, to make sure to not to send too many
requests to a server rate limiting using a leaky bucket. Leaky buckets are burstable: if a server lets a
client send 10 requests per minute, it normally lets the user burst those 10 reuests. after that only one
request per 6 seconds may be sent (60 seconds / 10 requests). If the user stops sending requests, the bucket 
is filled up again so that the user may send a burst of requests again.


ATTENTION: Version 3+ is a rewrite of this library, it makes use of es modules and thus needs to be started using the --experimental-modules flag in node 10 and 12.

## installation

    npm i leaky-bucket

## build status

[![Build Status](https://travis-ci.org/eventEmitter/leaky-bucket.png?branch=master)](https://travis-ci.org/eventEmitter/leaky-bucket)


## API

### Constructor


Sets up the leaky bucket. Accpets three optional options

- capacity: this is the amount of items that may be processed per interval, if the items cost is 1 (which is the default)
- interval: this is the interval, in which the capacity may be used
- timeout: defines, how long it takes until items are rejected due to an overflow. defaults to the value of the interval, so that the overflow occurs at the same time the bucket is empty.


```javascript
import LeakyBucket from 'leaky-bucket';

// a leaky bucket, that will burst 60 items, then will throttle the items to one per seond
const bucket = new Bucket({
    capacity: 60,
    interval: 60,
});
```


### throttle

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


### pause

The pause method can be use to pause the bucket for n seconds until it is allwed to resume.


```javascript
bucket.pause();

````