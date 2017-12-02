define(function(require, exports, module) {
    main.consumes = ["settings", "Plugin", "fs", "run.gui"];
    main.provides = ["c9.ide.janitorconfig"];
    return main;

    function main(options, imports, register) {
        var settings = imports.settings;
        var Plugin = imports.Plugin;
        var fs = imports.fs;
        var runGui = imports["run.gui"];

        /***** Initialization *****/
        
        var plugin = new Plugin("janitorconfig", main.consumes);
        var emit = plugin.getEmitter();
        
        function readJanitorManifest() {
            const filePaths = [
                "~/janitor.json",
                "~/.janitor.json",
                "/janitor.json",
                "/.janitor.json"
            ];
            
            let readFile = function (path) {
                return new Promise((resolve, reject) => {
                    fs.readFile(path, function(err, data) {
                        if (err) {
                            resolve(undefined);
                            return;
                        }
                        console.info("[c9.ide.janitorconfig]", path, "found");
                        resolve(data);
                    });
                });
            };
            
            let promises = Promise.all(filePaths.map(path => readFile(path)));
            return promises.then(files => {
                files = files.filter(v => !!v);
                if (files.length > 1) {
                    console.log(files);
                    throw new Error("[c9.ide.janitorconfig] More than one janitor.json file detected.")
                } else if (files.length === 1) {
                    return JSON.parse(files[0]);
                } else {
                    throw new Error("[c9.ide.janitorconfig] janitor.json file not found")
                }
            });
        }
        
        function load() {
            readJanitorManifest().then(manifest => {
                loadSettings(manifest.scripts);
                loadPreview(manifest.ports);
            }).catch(err => {
                console.error("[c9.ide.janitorconfig] Failed to parse or load janitor.json", err)
            });
        }
        function loadSettings(scripts) {
            let c9runners = {};
            let i = 0;
            for (let script in scripts) {
                if (scripts[script].cmd) {
                    const cmd = scripts[script].cmd;
                    c9runners[script] = {
                        "command": cmd,
                        "cwd": scripts[script].cwd || "/",
                        "name": script + ' (' + cmd + ')',
                        "runner": "Shell command",
                        "toolbar": true,
                    };
                } else if (typeof scripts[script] === "string") {
                    const cmd = scripts[script];
                    c9runners[script] = {
                        "command": cmd,
                        "cwd": "/",
                        "name": script + ' (' + cmd + ')',
                        "runner": "Shell command",
                        "toolbar": true,
                    };
                } else {
                    console.error("[c9.ide.janitorconfig]", "Failed to parse script", script);
                }
                if (i === 0) {
                    c9runners[script].default = true;
                }
                i++;
            }
            settings.setJson("project/run/configs", c9runners);

            console.info("[c9.ide.janitorconfig] Finished loading janitor.json scripts.");
            
            runGui.on("unload", function() {
                runGui.load();
            });
            runGui.unload();
        }

        function loadPreview(ports) {
            for (let port in ports) {
                if (ports[port].preview) {
                    let container;
                    if (window.location.search.indexOf("container=") !== -1) {
                        container = window.location.search.split("container=")[1].split("&")[0];
                    } else {
                        container = window.location.pathname.split("/")[1];
                    }
                    let url = "https://" + window.location.host +
                      "?container=" + container +
                      "&port=" + port;
                    settings.set("project/preview/@url", url);
                    return;
                }
            }
        }

        /***** Lifecycle *****/
        
        plugin.on("load", function() {
            load();
        });
        plugin.on("unload", function() {
        
        });

        /***** Register and define API *****/
        
        plugin.freezePublicAPI({
            
        });
        
        register(null, {
            "c9.ide.janitorconfig": plugin
        });
    }
});
