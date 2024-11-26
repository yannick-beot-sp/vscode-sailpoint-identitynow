import { Exporter } from "./Exporter";

export class ExporterBuilder<T,O> {

    private unwindablePaths: string[] = []
    private paginator: AsyncIterable<T>
    private progressMessage: string | undefined
    private successfulMessage: string | undefined
    private mapper: (x: T) => any | Promise<any>
    private headers: string[] | undefined
    private paths: string[] | undefined
    private filePath: string | undefined


    constructor() { }

    setOutfile(filepath: string): ExporterBuilder<T,O> {
        this.filePath = filepath
        return this;
    }

    setSuccessfulMessage(message: string): ExporterBuilder<T,O> {
        this.successfulMessage = message
        return this;
    }

    setProgressMessage(message: string): ExporterBuilder<T,O> {
        this.progressMessage = message
        return this;
    }

    setPaginator(paginator: AsyncIterable<T>): ExporterBuilder<T,O> {
        this.paginator = paginator
        return this;
    }

    setUnwindablePaths(paths: string[]): ExporterBuilder<T,O> {
        this.unwindablePaths = paths
        return this
    }

    setMapper(mapper: (x: T) => O | Promise<O>): ExporterBuilder<T,O> {
        this.mapper = mapper;
        return this;
    }

    setHeader(headers: string[]): ExporterBuilder<T,O> {
        this.headers = headers;
        return this;
    }

    setPaths(paths: string[]): ExporterBuilder<T,O> {
        this.paths = paths;
        return this;
    }

    setFieldMappings(mappings: Record<string, string>): ExporterBuilder<T,O> {
        this.headers = []
        this.paths = []

        Object.entries(mappings).forEach(([key, value]) => {
            this.headers.push(key)
            this.paths.push(value)
        })

        return this;
    }

    public build(): Exporter<T> {
        if (this.paths === undefined) {
            this.paths = this.headers
        }
        return new Exporter<T>({
            unwindablePaths: this.unwindablePaths,
            paginator: this.paginator,
            progressMessage: this.progressMessage,
            successfulMessage: this.successfulMessage,
            mapper: this.mapper,
            headers: this.headers,
            paths: this.paths,
            filePath: this.filePath
        })
    }
}