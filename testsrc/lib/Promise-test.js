define([
  'lib/Promise'
], function (Promise) {

  module('Promise');

  test("module return", function () {

    ok(Object.isFrozen(Promise.prototype), 'should be frozen proto');

  });

  test("constructor", function () {

    var p = new Promise();
    ok(p instanceof Promise, 'should be vanilla constructor func');
    ok(Object.isSealed(p), 'should be sealed');
  });

  test("thenable", function () {
    var p = new Promise();
    var t = p.thenable();
    equal(typeof t.then, 'function', 'should generate thenable');
    ok((t !== p), 'should be new object');
    equal(t.resolve, undefined, 'should not be resolvable');
    equal(t.reject, undefined, 'should not be rejectale');
  });

  test('then - resolution', function () {

    var p = new Promise();
    var t = p.thenable();

    var a1;
    t.then(function (v) {
      a1 = v;
    });

    var a2;
    p.then(function (v) {
      a2 = v;
    });

    var resol = Math.random();
    p.resolve(resol);

    ok(a1, resol, 'first listener should be called (Through thenable)');
    ok(a2, resol, 'second listener should be called (through promise)');

  });

  test('then - rejection', function () {

    var p = new Promise();
    var t = p.thenable();

    var a1;
    t.then(Function.prototype, function (v) {
      a1 = v;
    });

    var a2;
    p.then(Function.prototype, function (v) {
      a2 = v;
    });

    var resol = Math.random();
    p.reject(resol);

    ok(a1, resol, 'first error listener should be called (Through thenable)');
    ok(a2, resol, 'second error listener should be called (through promise)');

  });

  test('resolve - exclusive', function () {

    var p = new Promise();
    var resolved = false, rejected = false;
    p.then(function () {
      resolved = true;
    }, function () {
      rejected = true;
    });
    p.resolve();
    ok(resolved, 'should have been resolved');
    ok(!rejected, 'should not have been rejected');

  });

  test('reject - exclusive', function () {
    var p = new Promise();
    var resolved = false, rejected = false;
    p.then(function () {
      resolved = true;
    }, function () {
      rejected = true;
    });
    p.reject();
    ok(!resolved, 'should not have been resolved');
    ok(rejected, 'should  have been rejected');

  });

  test('resolve - only once', function () {

    var p = new Promise();
    p.resolve(1);

    var caught = false;
    try {
      p.resolve('er');
    } catch (e) {
      caught = true;
      ok(e instanceof Error, 'cannot resolve twice');
    } finally {
      ok(caught, 'should have gotten error');
    }

    caught = false;
    try {
      p.reject('er');
    } catch (e) {
      caught = true;
      ok(e instanceof Error, 'cannot reject after resolve');
    } finally {
      ok(caught, 'should have gotten error');
    }

  });

  test('reject - only once', function () {

    var p = new Promise();
    p.resolve(1);

    var caught = false;
    try {
      p.resolve('er');
    } catch (e) {
      caught = true;
      ok(e instanceof Error, 'cannot resolve twice');
    } finally {
      ok(caught, 'should have gotten error');
    }

    caught = false;
    try {
      p.reject('er');
    } catch (e) {
      caught = true;
      ok(e instanceof Error, 'cannot reject after resolve');
    } finally {
      ok(caught, 'should have gotten error');
    }

  });

  test('then - success continuation', function () {

    var res, res2;
    var p = new Promise();
    p
      .then(function (a) {
        return a + 10;
      })
      .then(function (v) {
        res = v;
        return v + 1;
      })
      .then(function (v) {
        res2 = v;
      });

    p.resolve(10);
    equal(20, res, 'should have piped first result');
    equal(21, res2, 'should have piped second result');

  });

  asyncTest('then - success continuation async', function () {

    var p = new Promise();
    p
      .then(function (a) {
        var p = new Promise();
        setTimeout(function () {
          p.resolve(a + 10);
          start();
        }, 3);
        return p;
      })
      .then(function (v) {
        equal(20, v, 'should have piped promise');
      });

    p.resolve(10);

  });

  test('then - error continuation', function () {

    var res, res2;
    var p = new Promise();
    p
      .then(function () {
        ok(false, 'was rejected, shouldnt get resolve');
      }, function (a) {
        throw (a + 10);
      })
      .then(function () {
        ok(false, 'should propagate error, not as success');
      }, function (v) {
        res = v;
        throw (v + 1);
      })
      .then(function () {
        ok(false, 'should propagate error, not success');
      }, function (v) {
        res2 = v;
      });

    p.reject(10);
    equal(20, res, 'should have piped first result as error');
    equal(21, res2, 'should have piped second result as success');

  });

  asyncTest('then - error continuation async', function () {

    var p = new Promise();
    p
      .then(function (a) {
        var p = new Promise();
        setTimeout(function () {
          p.reject(a + 10);
          start();
        }, 3);
        return p;
      })
      .then(function () {
        ok(false, 'should be rejected, not resolved');
      }, function (v) {
        equal(20, v, 'should have piped promise rejection');
      });

    p.resolve(10);

  });


  asyncTest('then - after resolve', function () {

    var p = new Promise();
    p.resolve(1);

    p
      .then(function (v) {
        equal(1, v, 'should get resolution');
        return v + 10;
      })
      .then(function (v) {
        equal(11, v, 'should propagate as usual');
        start();
      });

  });

  asyncTest('then - after reject', function () {
    var p = new Promise();
    p.reject(1);
    p
      .then(Function.prototype, function (v) {
        equal(1, v, 'should get rejection');
        return v + 10;
      })
      .then(function (v) {
        equal(11, v, 'should propagate as usual');
        start();
      });
  });

  test('progress', function () {
    var p = new Promise();
    var t = p.thenable();

    var r1, r2;
    t.then(undefined, undefined, function (v) {
      r1 = v;
    });
    p.then(undefined, undefined, function (v) {
      r2 = v;
    });

    [1, 2, 3, 4].forEach(function (v) {
      p.progress(v);
      equal(v, r1, 'should get progress through promise');
      equal(v, r2, 'should get progress through thenable');
    });

  });

  test('no progress after complete', function () {
    var p = new Promise();
    p.resolve(1);

    var caught = false;
    try {
      p.progress(2);
    } catch (e) {
      caught = true;
      ok(e instanceof Error, 'should get error');
    } finally {
      ok(caught, 'cannot sned progress event when promise is complete');
    }
  });

});



