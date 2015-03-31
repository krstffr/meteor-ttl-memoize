// Based on the underscore memoize method!
ttlMemoize = function( func, options ) {

	options = options || {};

	// Make sure options is an object
	check( options, Object );

	if (options.ttl) {
		// Make sure options.ttl is a number		
		check( options.ttl, Number );
		// Make sure it's more than 1
		if (options.ttl <= 0)
			throw new Meteor.Error('ttlMemoize', 'ttl muyst be higher than 0');
	}

	// Method for resetting the cache start time
	var setCacheStart = function () {
		memoize.cacheStart = new Date();
	};

	// The eventually returned memoize function
	var memoize = function( key ) {
		// If ttl is set but no cache start time, set cache start time
		if (options.ttl && !memoize.cacheStart)
			setCacheStart();
		// Is the cache too old? Reset it
		if (options.ttl && new Date() - memoize.cacheStart > options.ttl )
			memoize.resetCache();
		// Get an 'adress' for the cache object to store the value, either by the passed
		// hasher funciton or just by using the passed key
		var address = '' + (options.hasher ? options.hasher.apply(this, arguments) : key);
		// Set the cache!
		if (!_.has(memoize.cache, address)) memoize.cache[address] = func.apply(this, arguments);
		// Return the cache
		return memoize.cache[address];
	};

	// Method for resetting the cache
	// (or just one key of the cache)
	memoize.resetCache = function( key ) {
		// Reset the cache timer if ttl is set
		if (options.ttl)
			setCacheStart();
		// If a key (or many) is passed, just remove this/those
		if (key)
			this.cache = _( this.cache ).omit( key );
		// Else reset the entire cache
		else
			this.cache = {};
	};

	// Set the default cache
	memoize.cache = {};

	// Return the memoize function
	return memoize;

};