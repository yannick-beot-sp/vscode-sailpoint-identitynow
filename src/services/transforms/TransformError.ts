/**
 * Error raised when a transform is invalid or cannot be evaluated
 */
export class TransformError extends Error {
    /**
     * Nested transforms from the root to the one that failed, set by the engine
     */
    path?: string[];

    constructor(message: string) {
        super(message);
        this.name = 'TransformError';
    }

    /**
     * Message prefixed by the path, e.g. `concat › replace: Missing required attribute(s) [regex]`
     */
    get fullMessage(): string {
        return this.path?.length ? `${this.path.join(' › ')}: ${this.message}` : this.message;
    }
}

/**
 * Error raised when a transform type or option is valid in ISC but not supported by the local evaluator
 */
export class NotImplementedError extends TransformError {
    constructor(message: string) {
        super(message);
        this.name = 'NotImplementedError';
    }
}

/**
 * Error raised when the user cancels a prompt during the evaluation
 */
export class EvaluationCancelledError extends Error {
    constructor() {
        super('Evaluation cancelled');
        this.name = 'EvaluationCancelledError';
    }
}
