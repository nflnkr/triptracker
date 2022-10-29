

export class UserError extends Error {
    constructor(message?: string) {
        super(message);
        this.name = this.constructor.name;
    }
}

export class UserNotFoundError extends UserError {
    constructor(message?: string) {
        super(message);
        this.name = this.constructor.name;
    }
}

export class TripNotFoundError extends Error {
    constructor(message?: string) {
        super(message);
        this.name = this.constructor.name;
    }
}

export class PlaceNotFoundError extends Error {
    constructor(message?: string) {
        super(message);
        this.name = this.constructor.name;
    }
}

export class UnauthorizedAccess extends Error {
    constructor(message?: string) {
        super(message);
        this.name = this.constructor.name;
    }
}

export class StreamWriteError extends Error {
    constructor(message?: string) {
        super(message);
        this.name = this.constructor.name;
    }
}