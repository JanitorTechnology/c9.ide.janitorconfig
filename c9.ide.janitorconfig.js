define(function(require, exports, module) {
    main.consumes = ["settings", "Plugin", "fs"];
    main.provides = ["janitorconfig"];
    return main;

    function main(options, imports, register) {
        var settings = imports.settings;
        var Plugin = imports.Plugin;
        var fs = imports.fs;

        /***** Initialization *****/
        
        var plugin = new Plugin("janitorconfig", main.consumes);
        var emit = plugin.getEmitter();
        
        function readJanitorManifest() {
            const filePath = "~/janitor.json";
            
            return new Promise((resolve, reject) => {
                fs.readFile(filePath, function(err, data) {
                    if (err) reject(err);
                    resolve(data);
                });
            });
        }
        
        function load() {
            readJanitorManifest().then(manifest => {
                loadSettings(JSON.parse(manifest).scripts);
            }).catch(err => console.error("plugin config", err));
        }
        function loadSettings(scripts) {
            let c9runners = {};
            let i = 0;
            console.log(scripts)
            for (let script in scripts) {
                c9runners[script] = {
                    "command": scripts[script].cmd,
                    "cwd": scripts[script].cwd || "/",
                    "name": script,
                    "runner": "Shell command",
                    "toolbar": true,
                }
                if (i === 0) {
                    c9runners[script].default = true;
                }
                i++;
            }
            settings.setJson("project/run/configs", c9runners);
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