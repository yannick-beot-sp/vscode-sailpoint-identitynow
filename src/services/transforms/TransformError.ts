/**
 * Error raised when a transform is invalid or cannot be evaluated
 */
export class TransformError extends Error {
    constructor(message: string) {
        super(message);
        this.name = 'TransformError';
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
