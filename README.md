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
    obj: AngularRethinkDBObservable<IMyObjectType[]>;

    constructor(private ar: AngularRethinkDBService) {
        this.obj = this.r.list('myTable');
        this.obj.subscribe(data => console.log(data));
    }
}
```
Any change on ```myTable``` will be published on subscribe method

## TODO
[SECURITY] Authentication 