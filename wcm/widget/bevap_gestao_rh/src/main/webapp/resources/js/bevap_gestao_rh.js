var MyWidget = SuperWidget.extend({
    //variáveis da widget
    variavelNumerica: null,
    variavelCaracter: null,

    //método iniciado quando a widget é carregada
    init: function() {
        var instanceId = this.instanceId;

        MyWidget.loadExternalDependencies()
            .catch(function(err) {
                // Se CDN/CSP bloquear, seguimos com fallback CSS (widget não fica invisível)
                try {
                    console.warn("[bevap_gestao_rh] Falha ao carregar dependências externas:", err);
                } catch (e) {
                    // noop
                }
            })
            .finally(function() {
                window.controller = new Controller(instanceId);
            });
    },
  
    //BIND de eventos
    bindings: {
        local: {
            'execute': ['click_executeAction']
        },
        global: {}
    },
 
    executeAction: function(htmlElement, event) {
    }

});

MyWidget._loadedDeps = MyWidget._loadedDeps || {};

MyWidget.loadExternalDependencies = function() {
    // Em widgets do Fluig, scripts no view.ftl podem não executar (HTML é injetado via JS).
    // Por isso, dependências externas (quando necessárias) são carregadas por aqui.
    return Promise.all([
        MyWidget._loadScriptOnce("https://cdn.jsdelivr.net/npm/apexcharts", "apexcharts"),
        MyWidget._loadFontAwesomeOnce(),
    ]);
};

MyWidget._loadScriptOnce = function(url, key) {
    if (MyWidget._loadedDeps[key]) return Promise.resolve();

    return new Promise(function(resolve, reject) {
        // evita duplicar em páginas com mais de uma instância
        var existing = document.querySelector('script[data-bevap-dep="' + key + '"]');
        if (existing) {
            MyWidget._loadedDeps[key] = true;
            resolve();
            return;
        }

        var script = document.createElement("script");
        script.src = url;
        script.async = true;
        script.setAttribute("data-bevap-dep", key);
        script.onload = function() {
            MyWidget._loadedDeps[key] = true;
            resolve();
        };
        script.onerror = function(e) {
            reject(e);
        };

        (document.head || document.documentElement).appendChild(script);
    });
};

MyWidget._loadFontAwesomeOnce = function() {
    try {
        window.FontAwesomeConfig = {
            autoReplaceSvg: "nest",
        };
    } catch (e) {
        // noop
    }
    return MyWidget._loadScriptOnce(
        "https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/js/all.min.js",
        "fontawesome"
    );
};

