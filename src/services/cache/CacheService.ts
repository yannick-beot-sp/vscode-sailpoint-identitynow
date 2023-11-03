export interface CacheStats {
    hits: number,
    misses: number,
}

export interface Cache<T> {
    [key: string]: T
}


export class CacheService<T> {
    private _data: Cache<T>;
    private _stats: CacheStats;

    constructor(private readonly fetcher: (key: string) => T | Promise<T>) {
        this.flushAll();
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
        this._stats.misses++;
        const val = await this.fetcher(key);
        this._data[key] = val;
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