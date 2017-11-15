# angular-rethinkdb
This is an Angular module for RethinkDB NoSQL realtime database using Observables and Socket.io-client, this is based and influenced by AngularFire2 module created by 
__David East__ so, thanks to him. 

This is an work in progress so apologies for the lack of documentation.

## Usage
Here is a simple demo https://zelcius.com/angular-rethinkdb/
### Module 1st
In order to use this, you will need to build a backend seervice for RethinkDB, __or__ you might use this one 
https://github.com/mariolenis/rethinkdb-daas
```js
...
import {AngularRethinkDBModule} from 'ng-rethinkdb';

@NgModule({
  declarations: [...],
  imports: [
    ...,
    AngularRethinkDBModule.forRoot({
        api_key: 'AAAA-BBBBB-CCCCC',
        database: 'your-db',
        auth_table: 'my-table-to-auth',
        host: '<http | https>://<your-host><:port>'
    })
  ],
  providers: [...],
  bootstrap: [AppComponent]
})
export class AppModule { }

```

### Component Then
```js
...
import {AngularRethinkDBService, AngularRethinkDBObservable, IRethinkDBQuery} from 'ng-rethinkdb';
import {BehaviorSubject} from 'rxjs/BehaviorSubject';

interface IMyObjectType {
    ...
}

@Component({
    ...
})
export class Component {
    ...
    myTable: AngularRethinkDBObservable<IMyObjectType>;
    myQuery$ = new BehaviorSubject<IRethinkDBQuery>(undefined);

    constructor(private ar: AngularRethinkDBService) {
        
        // Initialize your object from table, if does not exists, it will be created
        // this.ar.list(table : string, query$? : BehaviorSubject<IRethinkDBQuery>)
        this.myTable = this.ar.list('myTable', this.myQuery$);

        // Subscribe to your object and listen to data
        const tableSubs = this.myTable
            .subscribe(data => console.log(data));
        
        // Query data will register a new filter and only will listen to changes 
        // according to the next value of query
        this.myQuery$.next({
            limit: 100,
            orderBy: {
                index: 'lastUpdate',
                desc: true
            },
            filter: {
                name: 'some name'
            }
        });

        // Get the current query result
        console.log('Current query result', this.myTable.value);

        // Push data
        let myNewData: IMyObjectType = {...};
        this.myTable.push(myNewData)
            .subscribe(res => console.log(res));

        // Delete data by id
        this.myTable.remove('random-id')
            .subscribe(res => console.log(res));

        // Delete data by custom index
        this.myTable.remove({ indexName:'custom-id', indexValue: 'id-value' })
            .subscribe(res => console.log(res));

        // Modify data
        let myUpdatedData = Object.assign(myNewData, {myProp: 'new value'});

        // Then update at myTable
        this.myTable.update(myUpdatedData)
            .subscribe(
                response => console.log(response),
                error => console.warn(error) // This is triggered if myUpdatedData has no id as property.
            );
        
        // Or you can update by query filter using IRethinkDBQuery interface
        this.myTable.update(myUpdatedData, {
                filter: {
                    name: 'author'
                },
                limit: 10
            })
            .subscribe(
                response => console.log(response),
                error => console.warn(error)
            );

        // Destroy the observable, close the realtime listener
        tableSubs.unsubscribe();

        // ****************************** Authentication Strategies ******************************
        // This strategies will use an auth table defined in the root module 
        // auth_table: 'my-table-to-auth'

        // Create a new user
        this.ar.auth().createUser({id: user, pass: password})
            .subscribe(
                response => console.log('Result', response),
                error => console.error('Err:', error)
            );
        
        // This observable next value will be token as response if auth is correct
        // otherwise, will throw an error
        this.ar.auth().authenticate(user, password)
            .subscribe(
                token => console.log('User authentication token', token),
                error => console.error('Err:', error)
            );

        // Verify if user is authenticated
        // next value will be true as response if user is authenticated
        // otherwise, will throw an error
        this.ar.auth().isAuthenticated(token)
            .subscribe(
                response => console.log('User is authenticated?', response),
                error => console.error('Err:', error)
            );

        // ****************************** Authentication Strategies [END] ******************************
    }
}
```
* Any change on ```'myTable'``` will be published on subscribe method.
* __push__, __remove__, __update__ methods returns Observables to track the operation result
* __IRethinkDBQuery__ All properties are optional. Valid properties are limit: number, orderBy: string and filter : Object; 

## TODO
* [ SECURITY ] Authentication.
* [ DOCUMENTATION ] All.