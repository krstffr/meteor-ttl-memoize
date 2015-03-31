Tinytest.add('check the ttlMemoize var', function ( test ) {

	test.isTrue( Match.test(ttlMemoize, Function ) );
	test.isTrue( Match.test(ttlMemoize( function() { return; }), Function ) );

});

Tinytest.add('sqr, basic function', function ( test ) {

	var sqr = function ( num1 ) {
		return num1*num1;
	};

	var sqrMemoized = ttlMemoize( sqr, { ttl: 30 });

	var val1 = 4;
	var val2 = 5.54;
	var val3 = 40;
	var val4 = 500.123456789;

	// Make sure the methods return the same value
	test.equal( sqrMemoized(val1), sqr(val1) );
	test.equal( sqrMemoized(val2), sqr(val2) );
	test.equal( sqrMemoized(val3), sqr(val3) );
	test.equal( sqrMemoized(val4), sqr(val4) );

	// Make sure the caches are the same as the values the
	// original function returns
	test.equal( sqrMemoized.cache[val1], sqr(val1) );
	test.equal( sqrMemoized.cache[val2], sqr(val2) );
	test.equal( sqrMemoized.cache[val3], sqr(val3) );
	test.equal( sqrMemoized.cache[val4], sqr(val4) );

});

Tinytest.addAsync('toUppercase and cache invalidation', function ( test, next ) {

	var ttl = 30;

	var toUpper = function ( string ) {
		return string.toUpperCase();
	};

	var toUpperMemoized = ttlMemoize( toUpper, { ttl: ttl });

	var val1 = 'a string';
	var val1Expected = 'A STRING';
	var val2 = '123';

	test.equal( toUpper(val1), val1Expected );
	test.equal( toUpperMemoized(val1), val1Expected );
	test.equal( toUpperMemoized(val1), toUpper(val1) );

	// This should not change
	test.equal( toUpperMemoized(val2), val2 );
	test.equal( _( toUpperMemoized.cache ).keys().length, 2 );

	Meteor.setTimeout(function () {
		test.equal( toUpperMemoized(val2), toUpper(val2) );
		// Now the cache should only include one value
		test.equal( _( toUpperMemoized.cache ).keys().length, 1 );
		next();
	}, ttl + 10);

});

Tinytest.addAsync('randomFn - async', function ( test, next ) {

	var randomFn = function ( param ) {
		return Math.random();
	};

	var randomFnCached = ttlMemoize( randomFn, { ttl: 15 } );

	// Make sure the random fn is random
	test.notEqual( randomFn('one'), randomFn('one') );
	// Make sure the random fn don't return the same as the cached one
	test.notEqual( randomFnCached('one'), randomFn('one') );
	// Make sure the cached one returns the same result though!
	// Do this four times, so we have four cached values
	test.equal( randomFnCached('one'), randomFnCached('one') );
	test.equal( randomFnCached('two'), randomFnCached('two') );
	test.equal( randomFnCached('three'), randomFnCached('three') );
	test.equal( randomFnCached('four'), randomFnCached('four') );
	// Make sure we have four cached values
	test.equal( _(randomFnCached.cache).keys().length, 4 );
	// Stor the value of "one" for equal testing later
	var valueOfOneBeforeReset = randomFnCached('one');

	Meteor.setTimeout(function () {
		// Now there should only be one
		test.notEqual( randomFnCached('one'), valueOfOneBeforeReset );
		test.equal( randomFnCached('one'), randomFnCached('one') );
		test.equal( _(randomFnCached.cache).keys().length, 1 );
		next();
	}, 30 );

});

// Use async just to free the CPU from all other tasks (I guess?)
Tinytest.add('fib - cache and not cached', function ( test ) {

	var fib = function fib( i ) {
		if (i <= 2)
			return 1;
		return fib(i-2) + fib(i-1);
	};

	var lastFibCache = ttlMemoize( function ( i ) {
		if (i <= 2)
			return 1;
		return lastFibCache(i-2) + lastFibCache(i-1);
	}, { ttl: 4000 });

	fibToTest = 35;

	var startTime = new Date();
	var fibRes = fib(fibToTest);
	var endTime = new Date() - startTime;

	var cachedStartTime = new Date();
	var cachedFibRes = lastFibCache( fibToTest*40 );
	var cachedEndTime = new Date() - cachedStartTime;

	test.equal( fibRes, lastFibCache(fibToTest) );
	test.isTrue( cachedEndTime < endTime );

});

Tinytest.add('fn.resetCache() - all cache', function ( test ) {

	var memoizedFn = ttlMemoize(function ( num ) {
		return num * 2;
	});

	memoizedFn(5);
	memoizedFn(50);
	memoizedFn(500);

	test.equal( _(memoizedFn.cache).keys().length, 3 );

	memoizedFn.resetCache();

	test.equal( _(memoizedFn.cache).keys().length, 0 );
	
});

Tinytest.add('fn.resetCache() - specific key', function ( test ) {

	var memoizedFn = ttlMemoize(function ( string ) {
		return string + ' is modified';
	});

	memoizedFn("true as a string");
	memoizedFn("false");
	memoizedFn("true");

	test.equal( _(memoizedFn.cache).keys().length, 3 );

	memoizedFn.resetCache( "true as a string" );

	test.equal( _(memoizedFn.cache).keys().length, 2 );

	memoizedFn.resetCache( "false" );

	test.equal( _(memoizedFn.cache).keys().length, 1 );

	memoizedFn.resetCache( "true" );

	test.equal( _(memoizedFn.cache).keys().length, 0 );
	
});

Tinytest.add('fn.resetCache() - reset multiple keys', function ( test ) {

	var memoizedAdd = ttlMemoize(function ( num1, num2 ) {
		return num1 + num2;
	}, {
		hasher: function ( num1, num2 ) {
			return (num1+'+'+num2).toString();
		}
	});

	test.equal( memoizedAdd(2 , 3 ),  2 + 3  );
	test.equal( memoizedAdd(2 , 30),  2 + 30 );
	test.equal( memoizedAdd(10, 3 ), 10 + 3  );
	test.equal( memoizedAdd(20, 30), 20 + 30 );
	test.equal( memoizedAdd(100, 3), 100 + 3 );
	test.equal( memoizedAdd(55, 55), 55 + 55 );
	test.equal( memoizedAdd(555, 5), 555 + 5 );

	// Make sure every call has added a cache key
	test.equal( _(memoizedAdd.cache).keys().length, 7 );

	// This should not add new keys
	test.equal( memoizedAdd(555.0000, 5.000), 555 + 5 );
	test.equal( _(memoizedAdd.cache).keys().length, 7 );

	// Remove three different values and four should remain
	memoizedAdd.resetCache(["2+3", "100+3", "555+5"]);
	test.equal( _(memoizedAdd.cache).keys().length, 4 );
	
});

Tinytest.add('object as param and JSON.stringify', function ( test ) {

	var memoizedDeleteSpecificKey = ttlMemoize(function ( object ) {
		delete object['toDelete'];
		return object;
	}, {
		hasher: function ( object ) {
			return JSON.stringify( object );
		}
	});

	var firstObj = { one: 1, two: 2, toDelete: 'hi, remove me!' };
	var firstObjCacheRes = memoizedDeleteSpecificKey( _.clone(firstObj) );
	memoizedDeleteSpecificKey({ one: 1, two: 2, toDelete: true });
	memoizedDeleteSpecificKey({ one: 1, two: 'two', toDelete: 500 });
	memoizedDeleteSpecificKey({ one: 'one', two: 2, toDelete: ['hi, remove me!', 'yes'] });

	// This has already been added
	memoizedDeleteSpecificKey({ one: 1, two: 2, toDelete: true });
	test.equal( _(memoizedDeleteSpecificKey.cache).keys().length, 4 );

	test.equal(
		JSON.stringify( memoizedDeleteSpecificKey.cache[ JSON.stringify(firstObj) ] ),
		JSON.stringify( firstObjCacheRes )
		);

});

Tinytest.add('array as param', function ( test ) {

	var returnFirstVal = ttlMemoize(function ( array ) {
		return array[0];
	});

	var returnFirstValSmarter = ttlMemoize(function ( array ) {
		return array[0];
	}, {
		hasher: function ( array ) {
			return array[0];
		}
	});

	// They all return the same value…
	test.equal( returnFirstVal([1,2,3]),   returnFirstVal([1,2,5])              );
	test.equal( returnFirstVal([1]),       returnFirstVal([1,2,3,4])            );
	test.equal( returnFirstVal([1,'two']), returnFirstVal([1,4,'five hundred']) );
	// …but they use 6 cache keys
	test.equal( _(returnFirstVal.cache).keys().length, 6 );

	// The smarter method only uses the first value of the array…
	test.equal( returnFirstValSmarter([1,2,3]),   returnFirstValSmarter([1,2,5])              );
	test.equal( returnFirstValSmarter([1]),       returnFirstValSmarter([1,2,3,4])            );
	test.equal( returnFirstValSmarter([1,'two']), returnFirstValSmarter([1,4,'five hundred']) );
	// …and only use one cache key
	test.equal( _(returnFirstValSmarter.cache).keys().length, 1 );

});

Tinytest.add('fn as param', function ( test ) {

	var fnCache = ttlMemoize(function ( fn, args ) {
		return fn.apply( null, args );
	}, {
		hasher: function ( fn, args ) {
			var argsHash = ' : ' + JSON.stringify( args );
			// If the function has a name, use it for the cache!
			if (fn.name)
				return fn.name + argsHash;
			// Else make a string of the entire function, not very clean though.
			return fn.toString() + argsHash;
		}
	});

	var randFunc = function randFunc() {
		return Math.random();
	};

	test.notEqual( fnCache( randFunc ), randFunc() );
	test.equal( fnCache( randFunc ), fnCache( randFunc ) );

	test.notEqual( fnCache( randFunc ), fnCache( randFunc, [1] ) );
	test.equal( fnCache( randFunc, [1] ), fnCache( randFunc, [1] ) );

	test.equal( _( fnCache.cache ).keys().length, 2 );

	var anotherFunc = function ( num1, num2 ) {
		return num1 * num2;
	};

	test.equal( fnCache( anotherFunc, [5, 5] ), 25 );
	test.equal( fnCache( anotherFunc, [5, 5] ), anotherFunc(5,5) );
	test.equal( fnCache( anotherFunc, [10, 5] ), anotherFunc(10,5) );

	test.equal( _( fnCache.cache ).keys().length, 4 );

	fnCache.resetCache();

	test.equal( _( fnCache.cache ).keys().length, 0 );

});
