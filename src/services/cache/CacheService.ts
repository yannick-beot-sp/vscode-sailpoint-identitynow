import EventEmitter = require("events");

export interface CacheStats {
    hits: number,
    misses: number,
}
interface IQueue<T> {
    enqueue(item: T): void;
    dequeue(): T | undefined;
    size: number;
}

class Queue<T> implements IQueue<T> {
    private storage: T[] = [];

    constructor(private capacity: number = Infinity) { }

    enqueue(item: T): void {
        if (this.size === this.capacity) {
            throw Error("Queue has reached max capacity, you cannot add more items");
        }
        this.storage.push(item);
    }
    dequeue(): T | undefined {
        return this.storage.shift();
    }
    get size(): number {
        return this.storage.length;
    }
}

function makeTriggerablePromise<T>(): [
    Promise<T>,
    (inp: T) => void,
    (error: any) => void
] {
    let triggerResolveWith!: (inp: T) => void;
    let triggerRejectWith!: (error: any) => void;
    const promToReturn: Promise<T> = new Promise((resolve, reject) => {
        const funcThatResolvesProm = (inp: T) => resolve(inp);
        triggerResolveWith = funcThatResolvesProm;
        triggerRejectWith = reject;
    });
    return [promToReturn, triggerResolveWith, triggerRejectWith];
}

/**
 * cf. https://github.com/Arrow7000/qew/blob/master/qew.ts
 */
export class TaskPool {
    private queue = new Queue<() => void>();
    private executing = 0;

    /**
     *
     * @param maxConcurrent how many functions can be run simultaneously
     */
    constructor(
        private readonly maxConcurrent = 1,

    ) {
        if (maxConcurrent < 1) {
            throw new Error("maxConcurrent has to be 1 or higher");
        }
    }

    /**
     * Push another async function onto the queue
     * @param asyncFunc the async function to push onto this queue
     * @returns a Promise that resolves with `asyncFunc`'s resolved value –
     * whenever `asyncFunc` has been run and resolved. Or the Promise will reject
     * if `asyncFunc`'s Promise rejects
     */
    public push<T>(asyncFunc: () => Promise<T>) {
        const [prom, resolveProm, rejectProm] = makeTriggerablePromise<T>();

        const funcToRun = () => {
            asyncFunc()
                .then((result) => {
                    resolveProm(result);
                    this.executing--
                    setImmediate(() => this.tryMove());
                })
                .catch(rejectProm);
        };

        this.queue.enqueue(funcToRun);

        this.tryMove();

        return prom;
    }


    private tryMove() {


        if (this.executing < this.maxConcurrent && this.queue.size > 0) {
            const first = this.queue.dequeue();
            this.executing++
            first();
        }
    }
}

export interface Cache<T> {
    [key: string]: T
}

/*
As described in https://medium.com/trabe/synchronize-cache-updates-in-node-js-with-a-mutex-d5b395457138, I had similar concurrency issue while exporting access profiles.
I used the code provided in this article
*/

class LockFactory<T> {
    private locked = {};
    private ee = new EventEmitter();
    /**
     *
     */
    constructor() {
        this.ee.setMaxListeners(0);
    }

    public async acquire(key: string): Promise<T | undefined> {

        return new Promise((resolve) => {
            if (!this.locked[key]) {
                this.locked[key] = true;
                return resolve(undefined);
            }

            const tryAcquire = value => {
                if (!this.locked[key]) {
                    this.locked[key] = true;
                    this.ee.removeListener(key, tryAcquire);
                    return resolve(value);
                }
            };

            this.ee.on(key, tryAcquire);
        });
    }

    // If we pass a value, on release this value
    // will be propagated to all the code that's waiting for
    // the lock to release
    public release(key, value) {
        Reflect.deleteProperty(this.locked, key);
        setImmediate(() => this.ee.emit(key, value));
    }
}

export class CacheService<T> {
    private _data: Cache<T>;
    private _stats: CacheStats;
    private _lock: LockFactory<T>;
    private taskPool: TaskPool

    constructor(private readonly fetcher: (key: string) => T | Promise<T>) {
        this.flushAll();
        this._lock = new LockFactory();
        this.taskPool = new TaskPool(3);
    }

    /**
     * flush the whole data and reset the stats
     */
    public flushAll() {
        this._data = {};
        this._stats = {
            hits: 0,
            misses: 0
        };
    }

    /**
     * Get a cached key or retrieve it and change the stats 
    */
    public async get(key: string): Promise<T> {
        if (this.has(key)) {
            this._stats.hits++;
            return this._data[key];
        }

        let val = await this._lock.acquire(key);
        try {
            if (val === undefined) {
                this._stats.misses++;
                val = await this.taskPool.push(async () => { return await this.fetcher(key) })
                this._data[key] = val;
            } else {
                this._stats.hits++;
            }
        } finally {
            this._lock.release(key, val);
        }
        return val;
    }

    /**
    * Check if a key is cached
   */
    public has(key: string): boolean {
        return this._data.hasOwnProperty(key);
    }

    /**
     * Get the stats
     */
    public getStats(): CacheStats {
        return this._stats;
    }

    /**
     * Optional method to setup the cache if needed
     */
    public async init() : Promise<void> {

    }
}