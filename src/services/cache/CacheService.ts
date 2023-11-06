import EventEmitter = require("events");

export interface CacheStats {
    hits: number,
    misses: number,
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

    constructor(private readonly fetcher: (key: string) => T | Promise<T>) {
        this.flushAll();
        this._lock = new LockFactory();
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
                val = await this.fetcher(key);
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
}