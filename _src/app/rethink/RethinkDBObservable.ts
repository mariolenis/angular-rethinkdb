import {BehaviorSubject} from 'rxjs/BehaviorSubject';
import {Subscription} from 'rxjs/Subscription';
import {Observable} from 'rxjs/Observable';
import {Observer} from 'rxjs/Observer';
import * as io from 'socket.io-client';

import {IRethinkDBAPIConfig, IRethinkObject, IRethinkDBQuery, IRethinkResponse, IResponse} from './interfaces'

import 'rxjs/add/observable/of';
import 'rxjs/add/observable/fromPromise';
import 'rxjs/add/operator/map';
import 'rxjs/add/operator/catch';
import 'rxjs/add/operator/concat';
import 'rxjs/add/operator/switchMap';
import 'rxjs/add/operator/mergeMap';

export class AngularRethinkDBObservable<T extends IRethinkObject> {
    
    private db$ = new BehaviorSubject<T[]>([]);
    private API_URL: string;
    
    /**
     * @constructor initialize object to listen to changes on db and query if there is a new value en query$
     * @param <IRethinkDBAPIConfig> config
     * @param <string> table to listen
     * @param <Observable<IRethinkDBQuery>> query$
     */
    //<editor-fold defaultstate="collapsed" desc="constructor(private config: IRethinkDBAPIConfig, private table: string, private query$?: Observable<IRethinkDBQuery>)">
    constructor(
        private config: IRethinkDBAPIConfig, 
        private table: string, 
        private query$?: Observable<IRethinkDBQuery>
    ) {
        
        this.API_URL = (!!config.host ? config.host : '') + (!!config.port ? ':' + config.port : '');
        
        // Creates a namespace to listen events and populate db$ with new data triggered by filter observable
        let socket = io(this.API_URL);
        this.initSocketIO(socket)
        
            // Start the listener from backend, also if gets disconnected and reconnected, emits message to refreash the query
            .flatMap(socket => this.listenFromBackend(socket))
            
            // If query$ has next value, will trigger a new query without modifying the subscription filter in backend
            .flatMap(() => (!!this.query$ ? this.query$ : Observable.of(undefined)))
            
            // Register the change's listener
            .switchMap(query => this.registerListener(socket, query))
            
            // Executes the query 
            .switchMap(query => this.queryDBObject(query))
            
            // Append the result to the next BehaviorSubject Observer
            .subscribe(
                data => this.db$.next(data),
                err  => console.error(err)
            );
    }
    //</editor-fold>
    
    /**
     * @returns Current result value of qwuery
     */
    //<editor-fold defaultstate="collapsed" desc="getValue(): T[]">
    getValue(): T[] {
        return this.db$.value;
    }
    //</editor-fold>
    
    /**
     * @description Emits join message to room related with changes on db.table
     * @param new SocketIO
     * @returns Observable<Socket>
     * @throws Observable error if the request is unauthorized
     */
    //<editor-fold defaultstate="collapsed" desc="initSocketIO(socket: SocketIOClient.Socket): Observable<SocketIOClient.Socket>">
    private initSocketIO(socket: SocketIOClient.Socket): Observable<SocketIOClient.Socket> {
        return new Observable((o: Observer<SocketIOClient.Socket>) => {
            // Connect de socket to the host 
            socket.emit('join', JSON.stringify({ db: this.config.database, table: this.table, api_key: this.config.api_key }), (response: string) => {
                
                if (response.indexOf('err') > -1 )
                    o.error('Unauthorized api_key to ' + this.config.database);
                else
                    o.next(socket);
                o.complete();
            });            
        });
    }
    //</editor-fold>
    
    /**
     * @description Register the changes' listener on backend
     * @param <Socket> 
     * @param <IRethinkDBQuery> Optional query
     * @returns <Observable<IRethinkDBQuery>>
     */
    //<editor-fold defaultstate="collapsed" desc="registerListener(socket: SocketIOClient.Socket, query?: IRethinkDBQuery): Observable<IRethinkDBQuery">
    private registerListener(socket: SocketIOClient.Socket, query?: IRethinkDBQuery): Observable<IRethinkDBQuery> {
        return new Observable((o: Observer<IRethinkDBQuery>) => {
            socket.emit('listenChanges', JSON.stringify({db: this.config.database, table: this.table, query: query}));
            o.next(query);
            o.complete();
        })
    }
    //</editor-fold>
    
    /**
     * @description function to query data from db
     * 
     * @param optional <IRethinkDBFilter> query
     * @returns Observable of T[]
     */
    //<editor-fold defaultstate="collapsed" desc="queryDBObject(query: IRethinkDBFilter): Observable<T[]>">
    private queryDBObject(query : IRethinkDBQuery): Observable<T[]> {
        return Observable.fromPromise<IResponse<T>>(
            fetch(this.API_URL + '/api/list', {
                method: 'POST',
                body: JSON.stringify({ db: this.config.database, table: this.table, api_key: this.config.api_key, query: query }),
                headers: {
                    'Accept': 'application/json, text/plain, */*',
                    'Content-Type': 'application/json'
                }            
            })
        )
        .switchMap(res => Observable.fromPromise<Object>(res.json()));
    }
    //</editor-fold>
    
    /**
     * @description function to push new data
     * 
     * @param <T> newObject
     * @returns <Observable<IRethinkResponse>>
     */
    //<editor-fold defaultstate="collapsed" desc="push(newObject: T): Observable<IRethinkResponse>">
    push<T>(newObject: T): Observable<IRethinkResponse> {
        return Observable.fromPromise<IResponse<T>>(
            fetch(this.API_URL + '/api/put', {
                method: 'POST',
                body: JSON.stringify({db: this.config.database, table: this.table, api_key: this.config.api_key, object: newObject}),
                headers: {
                    'Accept': 'application/json, text/plain, */*',
                    'Content-Type': 'application/json'
                }            
            })
        )
        .switchMap(res => Observable.fromPromise<Object>(res.json()));
    }
    //</editor-fold>
    
    /**
     * @description function to remove data
     * 
     * @param <string | indexName: string, indexValue: strin> index
     * @returns <Observable<IRethinkResponse>>
     */
    //<editor-fold defaultstate="collapsed" desc="remove(index: string | {indexName: string, indexValue: string}): Observable<IRethinkResponse>">
    remove(index: string | {indexName: string, indexValue: string}): Observable<IRethinkResponse> {
        
        let body: string = '';
        if (typeof index === 'string') 
            body = JSON.stringify({db: this.config.database, table: this.table, api_key: this.config.api_key, query: {index: 'id', value: index as string}});
        else {
            let query = index as {indexName: string, indexValue: string};
            body = JSON.stringify({db: this.config.database, table: this.table, api_key: this.config.api_key, query: {index: query.indexName, value: index.indexValue}});
        }
        
        return Observable.fromPromise<IResponse<T>>(
            fetch(this.API_URL + '/api/delete', {
                method: 'POST',
                body: body,
                headers: {
                    'Accept': 'application/json, text/plain, */*',
                    'Content-Type': 'application/json'
                }            
            })
        )
        .switchMap(res => Observable.fromPromise<Object>(res.json()));
    }
    //</editor-fold>
    
    /**
     * @description function to update an object
     * 
     * @param <T> object
     * @param <Object> optional filter 
     * @returns <Observable<IRethinkResponse>>
     */
    //<editor-fold defaultstate="collapsed" desc="update(object: T): Observable<IRethinkResponse>">
    update<T>(updatedObj: T, query?: IRethinkDBQuery): Observable<IRethinkResponse> {
        return Observable.fromPromise<IResponse<T>>(
            fetch(this.API_URL + '/api/update', {
                method: 'POST',
                body: JSON.stringify({ db: this.config.database, table: this.table, api_key: this.config.api_key, object: updatedObj, query: query }),
                headers: {
                    'Accept': 'application/json, text/plain, */*',
                    'Content-Type': 'application/json'
                }            
            })
        )
        .switchMap(res => Observable.fromPromise<Object>(res.json()));
    }
    //</editor-fold>
    
    /**
     * @description Subscribe to BehaviorSubject passing the observer to subscription
     * @param next?: (value: T[]) => void
     * @param error?: (error: any) => void
     * @param complete?: () => void
     * @returns Subscription
     */
    //<editor-fold defaultstate="collapsed" desc="subscribe(next?: (value: T[]) => void, error?: (error: any) => void, complete?: () => void ): Subscription">
    subscribe(next?: (value: T[]) => void, error?: (error: any) => void, complete?: () => void ): Subscription {
        return this.db$.subscribe(next, error, complete);
    }
    //</editor-fold>
    
    /**
     * @description Function to listen events back from nodejs + socketio
     * @param <SocketIOClient.Socket> socketSpace
     * @returns <Observable<SocketIOClient.Socket>>
     */
    //<editor-fold defaultstate="collapsed" desc="listenFromBackend(namespace: SocketIOClient.Socket): Observable<SocketIOClient.Socket>">
    private listenFromBackend(socketSpace: SocketIOClient.Socket): Observable<string> {

        return new Observable((o: Observer<string>) => {
            
            socketSpace.on('reconnect', (connMsg:string) => {
                // Emit a new message to re-query for changes
                o.next(connMsg);
            });
            
            socketSpace.on('error', (errorMessage: string) => {
                this.db$.error(errorMessage);
            });
            
            // Listen events fired to this.table
            socketSpace.on(this.table, (predata: string) => {

                let data: {new_val: T, old_val: T} = JSON.parse(predata);
                
                // Current "state"
                let db = this.db$.value;

                // New data
                if (!data.old_val && !!data.new_val) 
                    this.db$.next([...db, data.new_val]);

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
                    ])
                }
            });
            
            // Emit message to start querying
            o.next('start');
            
            return () => {
                socketSpace.disconnect();
            }
        });
        
    }
    //</editor-fold>
}
