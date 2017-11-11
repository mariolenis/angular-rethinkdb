import {Injectable} from '@angular/core';
import {AngularRethinkDBObservable} from './RethinkDBObservable';
import {IRethinkDBQuery, IRethinkDBAPIConfig} from './interfaces';
import {BehaviorSubject} from 'rxjs/BehaviorSubject';
import { Observable } from 'rxjs/Observable';

export class RethinkDBAPIConfig implements IRethinkDBAPIConfig {
    host?: string;
    port?: number;
    api_key: string;
    database: string;
    auth_table: string;
}

@Injectable()
export class AngularRethinkDBService {

    constructor( private config: RethinkDBAPIConfig ) {}

    /**
     * @description Function to initialize event listening on db.table.
     *
     * @param <string> name of table
     * @param <Observable<IRethinkDBQuery>> query to be applied to db.table events, 
     * also will trigger a new query for every next value in query
     *
     * @returns <AngularRethinkDBObservable<any>>
     */
    list(table: string, query$?: BehaviorSubject<IRethinkDBQuery>): AngularRethinkDBObservable<any> {
        return new AngularRethinkDBObservable<any>(this.config, table, query$);
    }

    auth<T>(userid: string, password: string): Observable<T> {
        
        return Observable.of({} as T);
    }

    authFacebook(): Observable<boolean> {
        return Observable.of(true);
    }

    authGoogle(): Observable<boolean> {
        return Observable.of(true);
    }
}
