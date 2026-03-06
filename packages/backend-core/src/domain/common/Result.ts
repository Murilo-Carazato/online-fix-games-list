/**
 * The Result pattern is the standard approach for error handling in 
 * Enterprise TypeScript Clean Architecture (Domain-Driven Design).
 * 
 * Instead of throwing exceptions (which act like invisible GOTO statements),
 * Use Cases explicitly return a Result object indicating success or failure.
 */
export class Result<T, E> {
    public isSuccess: boolean;
    public isFailure: boolean;
    private readonly _error: E | null;
    private readonly _value: T | null;

    private constructor(isSuccess: boolean, error?: E | null, value?: T | null) {
        if (isSuccess && error) {
            throw new Error("InvalidOperation: A result cannot be successful and contain an error");
        }
        if (!isSuccess && !error) {
            throw new Error("InvalidOperation: A failing result needs to contain an error message");
        }

        this.isSuccess = isSuccess;
        this.isFailure = !isSuccess;
        this._error = error ?? null;
        this._value = value ?? null;

        Object.freeze(this);
    }

    public getValue(): T {
        if (!this.isSuccess) {
            throw new Error("Can't get the value of an error result. Use 'isFailure' to check first.");
        }
        return this._value!;
    }

    public getError(): E {
        if (!this.isFailure) {
            throw new Error("Can't get the error of a success result. Use 'isSuccess' to check first.");
        }
        return this._error!;
    }

    public static ok<U>(value?: U): Result<U, never> {
        return new Result<U, never>(true, null, value);
    }

    public static fail<E>(error: E): Result<never, E> {
        return new Result<never, E>(false, error, null);
    }
}
