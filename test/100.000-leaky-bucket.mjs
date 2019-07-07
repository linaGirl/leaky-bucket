import section from 'section-tests';
import LeakyBucket from '../index.mjs';
import assert from 'assert';



section('Leaky Bucket', (section) => {

    section.test('Compute factors correctly', async() => {
        const bucket = new LeakyBucket({
            capacity: 120,
            interval: 60,
            timeout: 300,
        });

        assert.equal(bucket.capacity, 120);
        assert.equal(bucket.interval, 60);
        assert.equal(bucket.timeout, 300);

        assert.equal(bucket.maxCapacity, 600);
        assert.equal(bucket.refillRate, 2)
    });


    section.test('Excute items that are burstable and wait for the ones that cannot burst', async() => {
        const bucket = new LeakyBucket({
            capacity: 100,
            interval: 60,
            timeout: 300,
        });

        const start = Date.now();

        for (let i = 0; i < 101; i++) {
            await bucket.throttle();        }

        const duration = Date.now() - start;
        assert(duration > 600);
        assert(duration < 700);
    });

    section.test('Overflow when an excess item is added', async() => {
        const bucket = new LeakyBucket({
            capacity: 100,
            interval: 60,
            timeout: 300,
        });

        bucket.throttle(500);
        await bucket.throttle(1).catch(async (err) => {
            assert(err);

            // since the throttle with a cost of 500 was 400 cost over the 
            // cost that can be processed immediatelly, the bucket needs to be ended
            bucket.end();
        });
    });


    section.test('Overlow already added items when pausing the bucket', async() => {
        const bucket = new LeakyBucket({
            capacity: 60,
            interval: 60,
            timeout: 70,
        });

        bucket.throttle(60);
        bucket.throttle(5);
        bucket.throttle(5).catch(async (err) => {
            assert(err);

            // since the throttle with a cost of 500 was 400 cost over the 
            // cost that can be processed immediatelly, the bucket needs to be ended
            bucket.end();
        });

        bucket.pause();
    });


    section.test('Empty bucket promise', async() => {
        const bucket = new LeakyBucket({
            capacity: 60,
            interval: 60,
            timeout: 70,
        });

        const start = Date.now();
        bucket.throttle(60);
        bucket.throttle(1);

        await bucket.isEmpty();

        const duration = Date.now() - start;
        assert(duration >= 1000);
        assert(duration < 1010);
    });
});