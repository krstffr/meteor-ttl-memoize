Package.describe({
	name: "krstffr:fn-cacher",
	summary: "Cacher wrapper function for functions (with TTL!)",
	version: "0.0.1"
});

Package.onUse(function (api) {

	api.versionsFrom("METEOR@0.9.0");

	api.addFiles(["fn-cacher.js"], ["client", "server"]);

	api.export(["ttlMemoize"], ["client", "server"]);

});

Package.onTest(function (api) {
  
  api.use(["tinytest", "krstffr:fn-cacher"]);
  
  api.addFiles("tests/fn-cacher-tests.js", ["client", "server"]);

});