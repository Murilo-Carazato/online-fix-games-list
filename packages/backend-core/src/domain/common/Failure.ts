/**
 * Represents the base class for all domain errors.
 * Following Clean Architecture, exceptions should be caught at the boundaries
 * and converted into Failures that the Domain can understand and handle safely.
 */
export abstract class Failure {
    constructor(public readonly message: string) { }
}

export class ServerFailure extends Failure {
    constructor(message: string = 'Server failure occurred') {
        super(message);
    }
}

export class InitializationFailure extends Failure {
    constructor(message: string = 'Initialization failed') {
        super(message);
    }
}

export class StorageFailure extends Failure {
    constructor(message: string = 'Storage operation failed') {
        super(message);
    }
}

export class NotFoundFailure extends Failure {
    constructor(message: string = 'Entity not found') {
        super(message);
    }
}
