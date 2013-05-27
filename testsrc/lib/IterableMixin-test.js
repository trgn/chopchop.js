define([
  'lib/IteratorMixin'
], function (IteratorMixin) {

  module("iteratorMixin");

  var array = [];
  var elements = 16;
  var counter = elements;
  while (counter--) array.unshift(counter);

  function TestIterator() {
    this._i = 0;
  }

  TestIterator.prototype = {
    _a: array,
    next: function () {
      if (this._i >= this._a.length) {
        throw 'Stop!';
      }
      var val = this._a[this._i];
      this._i += 1;
      return val;
    }
  };


  IteratorMixin.extend(TestIterator.prototype);

  test("module return", function () {
    ok(typeof IteratorMixin === 'function', "should get function from module");
  });


  asyncTest("forEachAsync- all in one", function () {

    var it = new TestIterator();

    var tickIndex = 0;
    var firsttime;
    var ticks = 0;

    var counter = 0;
    var promise = it.mapAsync(function (value) {
      if (counter === 0) {
        firsttime = tickIndex;
      } else {
        equal(firsttime, tickIndex, "must be called in same tick, always");
      }
      counter += 1;
      return 'ignore';
    }, {
      maxIterationTime: Infinity,
      maxN: Infinity,
      requestTick: function (cb) {
        ticks += 1;
        setTimeout(cb, 0);
      }
    });


    promise.then(function () {
      equal(counter, elements, "must be called same times");
      equal(ticks, 1, 'must only be called once');
      start();
    });

    ok(typeof promise.then === 'function', "must get thennable");

  });

  asyncTest("mapAsync- one by one", function () {

    var it = new TestIterator();
    var counter = 0;
    var lastTick = 0;

    var promise = it.mapAsync(function (a) {
      return a * 10;
    }, {
      maxIterationTime: Infinity,
      maxN: 1,
      requestTick: function (callback) {
        lastTick += 1;
        counter += 1;
        setTimeout(callback, 0);
      }
    });

    promise
      .then(function () {
        equal(counter, elements + 1, "must be called same times");
        start();
      });

    ok(typeof promise.then === 'function', "must get thennable");

  });

  asyncTest("mapAsync", function () {

    var it = new TestIterator();

    var promise = it.mapAsync(function (e) {
      return e + 1000;
    }).then(function (e) {
        equal(e.length, elements, "should get array with equal number of elem");
        e.forEach(function (val, i) {
          equal(val - 1000, it._a[i]);
        });
        start();
      });
    ok(typeof promise.then === 'function', "must get thennable");
  });

  asyncTest("filterAsync", function () {

    var it = new TestIterator();

    var promise = it.filterAsync(function (e) {
      return (e % 2 === 0);
    }).then(function (e) {
        equal(e.length, Math.floor(elements / 2), "should get array with half number of elem");
        e.forEach(function (val) {
          ok(val % 2 === 0);
        });
        start();
      });
    ok(typeof promise.then === 'function', "must get thennable");
  });

  asyncTest("reduceAsync", function () {

    var it = Object.create(new TestIterator());

    var promise = it.reduceAsync(function (a, b) {
      return a + b;
    }, 0).then(function (e) {
        equal(e, 120, "should have reduced");
        start();
      });
    ok(typeof promise.then === 'function', "must get thennable");
  });

  asyncTest("reduceAsync  - empty with initial", function () {

    var it = {
      next: function () {
        throw 'asdf';
      }
    };
    IteratorMixin.extend(it);

    var promise = it.reduceAsync(function (a, b) {
      return a + b;
    }, 1).then(function (e) {
        equal(e, 1, "should have reduced");
        start();
      });
  });


  asyncTest("map - requestTick", function () {

    var a = 0;

    function ticker(callback) {
      //requested tick
      a += 1;
      setTimeout(callback, 0);
    }

    var it = Object.create(new TestIterator());
    it
      .mapAsync(function () {
        return 'ignore';
      }, {
        requestTick: ticker,
        maxN: 1
      })
      .then(function () {
        equal(a - 1, elements, 'should have used ticker');
        start();
      });

  });

});