export interface IRethinkDBAPIConfig {
    api_key: string,
    database: string
    host?: string, 
    port?: number
}

export interface IRethinkObject {
    id?: string
}

export interface IRethinkDBQuery {
    limit?: number,
    orderBy?: string,
    filter?: Object
}

export interface IRethinkResponse {
    inserted: number;
    replaced: number;
    unchanged: number;
    errors: number;
    deleted: number;
    skipped: number;
    first_error: Error;
    generated_keys: string[]; // only for insert
}