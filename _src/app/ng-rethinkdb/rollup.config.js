export default {
    entry: 'dist/index.js',
    dest: 'dist/bundles/ng_rethinkdb.umd.js',
    sourceMap: false,
    format: 'umd',
    moduleName: 'ng.amazing',
    globals: {
      '@angular/core': 'ng.core',
      'rxjs/BehaviorSubject': 'Rx',
      'rxjs/Subscription': 'Rx',
      'rxjs/Observable': 'Rx',
      'rxjs/Observer': 'Rx',
      'rxjs/add/operator/map': 'Rx.Observable.prototype',
      'rxjs/add/operator/mergeMap': 'Rx.Observable.prototype',
      'rxjs/add/operator/switchMap': 'Rx.Observable.prototype',
      'rxjs/add/observable/fromPromise': 'Rx.Observable',
      'rxjs/add/observable/of': 'Rx.Observable'
    }
  }
