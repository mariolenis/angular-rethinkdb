# angular-rethinkdb
This is a angular module for RethinkDB realtime using Observables and Socket.io-client, this is based and influenced by AngularFire2 module created by 
__David East__ so, thanks to him. 

This is a in-working development so apologies for the lack of documentation.

## Usage
Here is a simple demo
### Module 1st
In order to use this, you will need to build a backend seervice for RethinkDB, __or__ you might use this one 
https://github.com/mariolenis/rethinkdb-daas
```
...
import {AngularRethinkDBModule} from 'angular-rethinkdb';

@NgModule({
  declarations: [...],
  imports: [
    ...,
    AngularRethinkDBModule.forRoot({
        database: 'your-db',
        host: 'http://<your-host>:<port>'
    })
  ],
  providers: [...],
  bootstrap: [AppComponent]
})
export class AppModule { }

```

### Component Then
```
...
import {AngularRethinkDBService, AngularRethinkDBObservable} from 'angular-rethinkdb';

interface IMyObjectType {
    ...
}

@Component({
    ...
})
export class Component {
    ...
    myTable: AngularRethinkDBObservable<IMyObjectType[]>;

    constructor(private ar: AngularRethinkDBService) {
        
        // Create you object from table
        this.myTable = this.ar.list('myTable');

        // Subscribe to your object and listen to data
        this.myTable.subscribe(data => console.log(data));

        // Push data to your myTable
        let myNewData: IMyObjectType = {...};
        this.myTable.push({});

        // Delete data 
        this.myTable.remove({ indexName:'id', indexValue: 'random-id' });

        // Update data 
        let myUpdatedData =  Object.assign({}, myNewData);
        myUpdatedData.myProp = 'new value';
        this.myTable.update(myUpdatedData);
    }
}
```
Any change on ```'myTable'``` will be published on subscribe method

## TODO
[ SECURITY ] Authentication 
[ DOCUMENTATION ] All