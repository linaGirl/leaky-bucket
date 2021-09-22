


export default class EventEmitter {


    constructor() {
        this.eventHandlers = new Map();
    }


    /**
     * emit an event
     *
     * @param      {string}  event   The event
     * @param      {Array}   args    The arguments
     */
    emit(event, ...args) {
        let results = [];

        if (this.hasListener(event)) {
            const handlerMap = this.getEventHandlers(event);
            for (const [ handler, once ] of handlerMap.entries()) {
                results.push(handler(...args));

                if (once) {
                    handlerMap.delete(handler);
                }
            }
        }

        return results;
    }




    /**
     * return event handelrs
     *
     * @return     {<type>}  The event handlers.
     */
    getEventHandlers(event) {
        if (event) return this.eventHandlers.get(event);
        else return this.eventHandlers;
    }



    /**
     * Determines if listeners are registered for a given event
     *
     * @param      {string}  event   event name
     */
    hasListener(event) {
        return this.eventHandlers.has(event) && this.eventHandlers.get(event).size;
    }



    /**
     * register an once event handler
     *
     * @param      {string}    event    The event
     * @param      {function}  handler  The handler
     * @return     {Model}     this
     */
    once(event, handler) {
        return this.on(event, handler, true);
    }



    /**
     * register an event handler
     *
     * @param      {string}    event         The event
     * @param      {function}  handler       The handler
     * @param      {boolean}   [once=false]  if the handler shuld be called just
     *                                       once
     * @return     {Object}    this
     */
    on(event, handler, once = false) {
        if (!this.eventHandlers.has(event)) {
            this.eventHandlers.set(event, new Map());
        }

        const handlerMap = this.eventHandlers.get(event);

        if (handlerMap.has(handler)) {
            throw new Error(`Cannot register the same event handler for ${event} twice!`);
        }

        this.eventHandlers.get(event).set(handler, once);
        return this;
    }



    /**
     * deregister event handler
     *
     * @param      {string}    event    The event
     * @param      {function}  handler  The handler, optionsl
     * @return     {boolean}   true if at least one handler was removed
     */
    off(event, handler) {
        if (!this.eventHandlers.has(event)) return false;

        if (!handler) {
            this.eventHandlers.delete(event);
            return true;
        }

        if (handler) {
            if (this.eventHandlers.get(event).has(handler)) {
                this.eventHandlers.get(event).delete(handler);
                return true;
            }
        }

        return false;
    }
}