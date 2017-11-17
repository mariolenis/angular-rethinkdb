import { BehaviorSubject } from 'rxjs/BehaviorSubject';
import { Subscription } from 'rxjs/Subscription';
import { Subscriber } from 'rxjs/Subscriber';
import { Observable } from 'rxjs/Observable';
import { Observer, PartialObserver } from 'rxjs/Observer';
import * as io from 'socket.io-client';
import uuid from 'uuid/v4';

import {IRethinkDBAPIConfig, IRethinkObject, IRethinkDBQuery, IRethinkResponse, IResponse} from './interfaces';

import 'rxjs/add/observable/of';
import 'rxjs/add/observable/throw';
import 'rxjs/add/observable/fromPromise';

import 'rxjs/add/operator/map';
import 'rxjs/add/operator/catch';
import 'rxjs/add/operator/share';
import 'rxjs/add/operator/mergeMap';
import 'rxjs/add/operator/switchMap';

export class AngularRethinkDBObservable<T extends IRethinkObject> extends BehaviorSubject<T[]> {
    
    // api_url
    private API_URL: string;

    // Socket
    private socket: SocketIOClient.Socket;
    private listerner$: Observable<any>;

    constructor(
        private rethinkdbConfig: IRethinkDBAPIConfig,
        private table: string, 
        private query$?: BehaviorSubject<IRethinkDBQuery>
    ) {
        super([]);
        this.API_URL = (!!rethinkdbConfig.host ? rethinkdbConfig.host : '') + (!!rethinkdbConfig.port ? ':' + rethinkdbConfig.port : '');

        // Connect to server and authenticate the connection
        this.listerner$ = Observable.of(io(this.API_URL + '?payload=' + JSON.stringify(this.rethinkdbConfig)))

            // Await connection is made to pass the connected socket or if reconnects
            .flatMap(socket => this.SocketConnectionHandler(socket))
        
            // Start listen data
            .map(socket => {
                this.socket = socket;
                this.socket.on(socket.id, this.socketDataHandler.bind(this));
                return socket;
            })

            // If query$ has next value, will trigger a new query modifying the subscription filter in backend
            .flatMap(() => (!!this.query$ ? this.query$ : Observable.of(undefined)))
                
            // Register the change's listener
            .flatMap(query => this.register(this.socket, {database: this.rethinkdbConfig.database, table: this.table, query: query}))

            // Avoid side effects in mutiple subscriptions
            .share();
    }

    /**
     * @description Handles connections
     * @param socket 
     */
    private SocketConnectionHandler(socket: SocketIOClient.Socket): Observable<SocketIOClient.Socket> {
        return new Observable((o: Observer<SocketIOClient.Socket>) => {
            socket.on('connection', () => {
                o.next(socket);
            });

            return () => {
                console.log('ehat?')
            }
        });
    }

    /**
     * @description Function to process data received from backend
     * @param predata 
     */
    private socketDataHandler(predata: string) {
        const data: {new_val: T, old_val: T, err?: string} = JSON.parse(predata);

        // Current "state"
        const db = super.getValue();

        // Clear the current "state"
        if (!data.old_val && !data.new_val && db.length > 0) {
            super.next([])

        } else if (!!data.err) {
            super.error(data.err);
            
        } else { 
            // New data
            if (!data.old_val && !!data.new_val) {
                super.next([data.new_val, ...db]);
            
            // Update data
            } else if (!!data.old_val && !!data.new_val && db.filter(object => object.id === data.new_val.id).length > 0) {
                super.next([
                    ...db.filter(object => object.id !== data.old_val.id),
                    data.new_val
                    ]
                );
            
            // Delete data
            } else if (!!data.old_val && !data.new_val) {
                super.next([
                    ...db.filter(object => object.id !== data.old_val.id)
                ]);
            }
        }
    }

    /**
     * @description Emits join message to room related with changes on db.table
     * @param <Socket> socket
     * @param <IRethinkDBAPIConfig> dbApiConfig
     * @param <Object> query
     * @returns Observable<Socket>
     * @throws Observable error if the request is unauthorized
     */
    private register(socket: SocketIOClient.Socket, query: Object): Observable<any> {
        return new Observable((o: Observer<string>) => {
            
            // Connect de socket to the host to listen to changes
            socket.emit('register', JSON.stringify(query), (response: string) => {
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

    next(value: T[]) {
        console.warn('This procedure potentially can clear all your data on table');
    }

    /**
     * @description function to push new data
     * 
     * @param <T> newObject
     * @returns <Observable<IRethinkResponse>>
     */
    push(newObject: T): Observable<IRethinkResponse> {
        if (this.hasError) {
            return Observable.throw(this.thrownError);

        } else if (this.closed) {
            return Observable.throw(new Error('AngularRethinkDB has been closed.'));
            
        }

        return Observable.of<RequestInit>({
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
        .switchMap(request => Observable.fromPromise(
            fetch(this.API_URL + '/api/put', request )
        ))
        .switchMap(response => 
            Observable.fromPromise<Object>(response.json())
                .flatMap(json => response.status >= 400 ? Observable.throw(json) : Observable.of(json))
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
        if (this.hasError) {
            return Observable.throw(this.thrownError);

        } else if (this.closed) {
            return Observable.throw(new Error('AngularRethinkDB has been closed.'));
            
        }

        let body = '';
        if (typeof index === 'string') {
            body = JSON.stringify({
                db: this.rethinkdbConfig.database, 
                table: this.table, 
                api_key: this.rethinkdbConfig.api_key, 
                object: {index: 'id', value: index as string}
            });
        } else {
            const query = index as {indexName: string, indexValue: string};
            body = JSON.stringify({
                db: this.rethinkdbConfig.database, 
                table: this.table, api_key: 
                this.rethinkdbConfig.api_key, 
                object: {index: query.indexName, value: index.indexValue}
            });
        }
        
        return Observable.of<RequestInit>({
            method: 'POST',
            body: body,
            headers: new Headers({
                'Accept': 'application/json, text/plain, */*',
                'Content-Type': 'application/json'
            })
        })
        .switchMap(request => Observable.fromPromise<IResponse<T>>(
            fetch(this.API_URL + '/api/delete', request)
        ))
        .switchMap(response => 
            Observable.fromPromise<Object>(response.json())
                .flatMap(json => response.status >= 400 ? Observable.throw(json) : Observable.of(json))
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
        if (this.hasError) {
            return Observable.throw(this.thrownError);

        } else if (this.closed) {
            return Observable.throw(new Error('AngularRethinkDB has been closed.'));
            
        }

        return Observable.of<RequestInit>({
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
        .switchMap(request => Observable.fromPromise<IResponse<T>>(
            fetch(this.API_URL + '/api/update', request)
        ))
        .switchMap(response => 
            Observable.fromPromise<Object>(response.json())
                .flatMap(json => response.status >= 400 ? Observable.throw(json) : Observable.of(json))
                .map((json: IRethinkResponse) => json)
        );
    }

    /**
     * @description Add operations to the super.subscribe
     * @param subscriber 
     */    
    subscribe(destinationOrNext?: PartialObserver<T[]> | ((value: T[]) => void), error?: (e?: any) => void, complete?: () => void): Subscription {

        // Starts
        this.listerner$.subscribe();

        if (typeof destinationOrNext !== 'function') {
            super.subscribe((destinationOrNext as PartialObserver<any>));
        } else {
            super.subscribe(destinationOrNext, error, complete);
        }
        // Creates a new kind of subscriber to close the socket
        return new NGRSubscriber(this.socket, destinationOrNext, error, complete);
    }
    
}

class NGRSubscriber<T> extends Subscriber<T> {
    
    constructor(private socket: SocketIOClient.Socket, destinationOrNext?: PartialObserver<any> | ((value: T) => void), error?: (e?: any) => void, complete?: () => void){
        super(destinationOrNext, error, complete);
    }

    unsubscribe(): void {
        if (this.socket && this.socket.connected) {
            this.socket.disconnect();
        }
        if (this.closed) {
            return;
        }
        this.isStopped = true;
        super.unsubscribe();
    }
}
