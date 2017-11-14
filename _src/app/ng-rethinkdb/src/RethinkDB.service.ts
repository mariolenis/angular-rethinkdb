import {Injectable} from '@angular/core';
import {AngularRethinkDBObservable} from './RethinkDBObservable';
import {IRethinkDBQuery, IRethinkDBAPIConfig, IRethinkResponse, IAuthStrategies} from './interfaces';
import {BehaviorSubject} from 'rxjs/BehaviorSubject';
import { Observable } from 'rxjs/Observable';
import { RethinkDbAuthStrategies } from './RethinkDBAuthStrategies';

export class RethinkDBAPIConfig implements IRethinkDBAPIConfig {
    host?: string;
    port?: number;
    api_key: string;
    database: string;
    auth_table?: string;
}

@Injectable()
export class AngularRethinkDBService {

    /**
     * @constructor instance config
     * @param config IRethinkDBAPIConfig 
     */
    constructor( private config: RethinkDBAPIConfig ) {}

    /**
     * @description Function to initialize event listening on db.table.
     *
     * @param name of table
     * @param query to be applied to db.table events, 
     * also will trigger a new query for every next value in query
     *
     * @returns <AngularRethinkDBObservable<any>>
     */
    list(table: string, query$?: BehaviorSubject<IRethinkDBQuery>): AngularRethinkDBObservable<any> {
        return new AngularRethinkDBObservable<any>(this.config, table, query$);
    }

    /**
     * @description Encapsulated functions to manage users
     */
    auth(): RethinkDbAuthStrategies {
        return new RethinkDbAuthStrategies(this.config);
    }
}
