import {BehaviorSubject} from 'rxjs/BehaviorSubject';
import {Subscription} from 'rxjs/Subscription';
import {Observable} from 'rxjs/Observable';
import {Observer} from 'rxjs/Observer';
import * as io from 'socket.io-client';

import {IRethinkDBAPIConfig, IRethinkObject, IRethinkDBQuery, IRethinkResponse, IResponse} from './interfaces';

import 'rxjs/add/observable/of';
import 'rxjs/add/observable/fromPromise';

import 'rxjs/add/operator/map';
import 'rxjs/add/operator/mergeMap';
import 'rxjs/add/operator/switchMap';

export class AngularRethinkDBObservable<T extends IRethinkObject> {

    // Observable of the initial query and connection
    private registerObservable$: Observable<string>;

    // Variable that represents the "state" result of the changes, 
    // it is needed in order to not update not the whole list of objects but 
    // the single object that had changed
    private db$ = new BehaviorSubject<T[]>([]);

    // api_url
    private API_URL: string;

    /**
     * @constructor initialize object to listen to changes on db and query if there is a new value en query$
     * @param <IRethinkDBAPIConfig> config
     * @param <string> table to listen
     * @param <Observable<IRethinkDBQuery>> query$
     */

    constructor(
        private rethinkdbConfig: IRethinkDBAPIConfig,
        private table: string, 
        private query$?: BehaviorSubject<IRethinkDBQuery>
    ) {

        this.API_URL = (!!rethinkdbConfig.host ? rethinkdbConfig.host : '') + (!!rethinkdbConfig.port ? ':' + rethinkdbConfig.port : '');

        // Creates a namespace to listen events and populate db$ with new data triggered by filter observable
        const socket = io(this.API_URL);

        // Initialize the listener
        this.registerObservable$ = this.listenFromBackend(socket)
            
            // If query$ has next value, will trigger a new query modifying the subscription filter in backend
            .flatMap(() => (!!this.query$ ? this.query$ : Observable.of(undefined)) )

            // Register the change's listener
            .flatMap(query => this.register(socket, rethinkdbConfig, {table: this.table, query: query}));
    }

    /**
     * @description Emits join message to room related with changes on db.table
     * @param <Socket> socket
     * @param <IRethinkDBAPIConfig> dbApiConfig
     * @param <Object> query
     * @returns Observable<Socket>
     * @throws Observable error if the request is unauthorized
     */
    private register(socket: SocketIOClient.Socket, dbApiConfig: IRethinkDBAPIConfig, query: Object): Observable<any> {
        return new Observable((o: Observer<string>) => {
            
            // Connect de socket to the host to validate
            socket.emit('register', JSON.stringify([dbApiConfig, query]), (response: string) => {
                const res: {err: string, msj: string} = JSON.parse(response);
                if (res.err) {
                    o.error(res.err);
                } else {
                    o.next(res.msj);
                }
                o.complete();
            });

        });
    }
    
    /**
     * @description Function to listen events back from nodejs + socketio
     * @param <SocketIOClient.Socket> socketSpace
     * @returns <Observable<SocketIOClient.Socket>>
     */
    private listenFromBackend(socketSpace: SocketIOClient.Socket): Observable<string> {

        return new Observable((o: Observer<string>) => {
            
            // TODO: if query exists and orderBy is present, should order array according to it
            // Listen events fired to this.table
            socketSpace.on(this.table, (predata: string) => {
                const data: {new_val: T, old_val: T, init?: T[], err?: string} = JSON.parse(predata);
                
                // Current "state"
                const db = this.db$.value;

                // Populate table with the very first data from query
                if (!!data.init) {
                    this.db$.next(data.init);

                } else if (!!data.err) {
                    this.db$.error(data.err);
                    
                } else { 
                    // New data
                    if (!data.old_val && !!data.new_val) {
                        this.db$.next([data.new_val, ...db]);
                    }

                    // Update data
                    else if (!!data.old_val && !!data.new_val && db.filter(object => object.id === data.new_val.id).length > 0) {
                        this.db$.next([
                            ...db.filter(object => object.id !== data.old_val.id),
                            data.new_val
                            ]
                        );
                    }

                    // Delete data
                    else if (!!data.old_val && !data.new_val) {
                        this.db$.next([
                            ...db.filter(object => object.id !== data.old_val.id)
                        ]);
                    }
                }
            });

            socketSpace.on('reconnect', () => {
                o.next('Reconnect');
            });

            // Emit message to start querying
            o.next('listening...');
        });
    }
    
    /**
     * @description function to push new data
     * 
     * @param <T> newObject
     * @returns <Observable<IRethinkResponse>>
     */
    push(newObject: Object): Observable<IRethinkResponse> {
        return Observable.fromPromise<IResponse<T>>(
            fetch(this.API_URL + '/api/put', {
                method: 'POST',
                body: JSON.stringify({
                    db: this.rethinkdbConfig.database, 
                    table: this.table, 
                    api_key: this.rethinkdbConfig.api_key, 
                    object: newObject
                }),
                headers: new Headers({
                    'Accept': 'application/json, text/plain, */*',
                    'Content-Type': 'application/json'
                })
            })
        )
        .switchMap(res => 
            Observable.fromPromise<Object>(res.json())
                .map((json: IRethinkResponse) => json)
        );
    }
    
    /**
     * @description function to remove data
     * 
     * @param <string | indexName: string, indexValue: strin> index
     * @returns <Observable<IRethinkResponse>>
     */
    remove(index: string | {indexName: string, indexValue: string}): Observable<IRethinkResponse> {
        
        let body = '';
        if (typeof index === 'string') {
            body = JSON.stringify({
                db: this.rethinkdbConfig.database, 
                table: this.table, 
                api_key: this.rethinkdbConfig.api_key, 
                query: {index: 'id', value: index as string}
            });
        } else {
            const query = index as {indexName: string, indexValue: string};
            body = JSON.stringify({
                db: this.rethinkdbConfig.database, 
                table: this.table, api_key: 
                this.rethinkdbConfig.api_key, 
                query: {index: query.indexName, value: index.indexValue}
            });
        }
        
        return Observable.fromPromise<IResponse<T>>(
            fetch(this.API_URL + '/api/delete', {
                method: 'POST',
                body: body,
                headers: new Headers({
                    'Accept': 'application/json, text/plain, */*',
                    'Content-Type': 'application/json'
                })
            })
        )
        .switchMap(res => 
            Observable.fromPromise<Object>(res.json())
                .map((json: IRethinkResponse) => json)
        );
    }
    
    /**
     * @description function to update an object
     * 
     * @param <T> object
     * @param <Object> optional filter 
     * @returns <Observable<IRethinkResponse>>
     */
    update(updatedObj: T, query?: IRethinkDBQuery): Observable<IRethinkResponse> {
        return Observable.fromPromise<IResponse<T>>(
            fetch(this.API_URL + '/api/update', {
                method: 'POST',
                body: JSON.stringify({ 
                    db: this.rethinkdbConfig.database, 
                    table: this.table, 
                    api_key: this.rethinkdbConfig.api_key, 
                    object: updatedObj, 
                    query: query 
                }),
                headers: new Headers({
                    'Accept': 'application/json, text/plain, */*',
                    'Content-Type': 'application/json'
                })
            })
        )
        .switchMap(res => 
            Observable.fromPromise<Object>(res.json())
                .map((json: IRethinkResponse) => json)
        );
    }

    /**
     * @description Subscribe to BehaviorSubject passing the observer to subscription
     * @param next?: (value: T[]) => void
     * @param error?: (error: any) => void
     * @param complete?: () => void
     * @returns Subscription
     */
    subscribe(next?: (value: T[]) => void, error?: (error: any) => void, complete?: () => void ): Subscription {
        this.registerObservable$.subscribe(res => console.log('[RethinkObservable] ' + res), err => console.error(err))
        return this.db$.subscribe(next, error, complete);
    }
}
