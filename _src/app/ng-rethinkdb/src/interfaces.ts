import {Observable} from 'rxjs/Observable';

export interface IRethinkDBAPIConfig {
    api_key: string;
    database: string;
    auth_table?: string;
    host?: string;
    port?: number;
}

export interface IRethinkObject {
    id?: string;
}

export interface IRethinkDBQuery {
    limit?: number;
    orderBy?: {index: string, desc?: boolean};
    filter?: Object;
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

export interface IResponse<T> {
    json: () => Promise<T>;
}

export interface IAuthStrategies {
    autheticate(user: string, password: string): Observable<boolean>;
    createUser(user: Object): Observable<IRethinkResponse>;
    authWithFacebook(): Observable<boolean>;
    authWithGoogle(): Observable<boolean>;
    logout(): Observable<boolean>;
}
