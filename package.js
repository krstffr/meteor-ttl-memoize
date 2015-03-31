Package.describe({
	name: "krstffr:ttl-memoize",
	summary: "Create memoized functions with TTL on the server and client.",
	version: "0.0.1"
});

Package.onUse(function (api) {

	api.versionsFrom("METEOR@0.9.0");

	api.addFiles(["ttl-memoize.js"], ["client", "server"]);

	api.export(["ttlMemoize"], ["client", "server"]);

});

Package.onTest(function (api) {
  
  api.use(["tinytest", "krstffr:ttl-memoize"]);
  
  api.addFiles("tests/ttl-memoize.js", ["client", "server"]);

});