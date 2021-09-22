import section from 'section-tests';
import EventEmitter from '../src/EventEmitter.js'; 
import assert from 'assert';   


section('EventEmitter', async(section) => {
    section.test('Instantiate class', async() => {
        new EventEmitter();
    });

    section.test('EventEmitter.on()', async() => {
        const emitter = new EventEmitter();
        let handled = 0;

        emitter.on('test', () => {
            handled++;
        });

        emitter.emit('test');

        assert.equal(handled, 1);
    });

    section.test('EventEmitter.once()', async() => {
        const emitter = new EventEmitter();
        let handled = 0;

        emitter.once('test', () => {
            handled++;
        });

        emitter.emit('test');
        emitter.emit('test');

        assert.equal(handled, 1);
    });

    section.test('EventEmitter.off()', async() => {
        const emitter = new EventEmitter();
        let handled = 0;

        emitter.once('test', () => {
            handled++;
        });

        emitter.off('test');

        emitter.emit('test');

        assert.equal(handled, 0);
    });

    section.test('EventEmitter.off(listener)', async() => {
        const emitter = new EventEmitter();
        let handled = 0;
        const handler = () => {
            handled++;
        };

        emitter.once('test', handler);

        emitter.off('test', handler);

        emitter.emit('test');

        assert.equal(handled, 0);
    });

    section.test('EventEmitter.hasListener(event)', async() => {
        const emitter = new EventEmitter();
        const handler = () => {
            handled++;
        };

        emitter.once('test', handler);
        assert.equal(emitter.hasListener('test'), 1);

        emitter.off('test', handler);
        assert.equal(emitter.hasListener('test'), 0);
    });
});