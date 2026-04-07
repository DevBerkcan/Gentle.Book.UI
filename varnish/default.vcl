vcl 4.1;

# Varnish Cache Configuration für KEINFRISEUR Linktree
# Performance-optimiert für Next.js Static Site

import std;

# Backend Server (Next.js)
backend default {
    .host = "localhost";
    .port = "3000";
    .connect_timeout = 5s;
    .first_byte_timeout = 30s;
    .between_bytes_timeout = 10s;
    .max_connections = 300;
}

# Access Control List für Cache-Purging
acl purge {
    "localhost";
    "127.0.0.1";
    "::1";
}

# Request Processing
sub vcl_recv {
    # Purge-Request Handling (für Cache-Invalidierung)
    if (req.method == "PURGE") {
        if (!client.ip ~ purge) {
            return (synth(405, "Not allowed."));
        }
        return (purge);
    }

    # Nur GET und HEAD requests cachen
    if (req.method != "GET" && req.method != "HEAD") {
        return (pass);
    }

    # Analytics API nicht cachen
    if (req.url ~ "^/api/analytics") {
        return (pass);
    }

    # OneTrust Cookie-Scripts nicht cachen
    if (req.url ~ "cookielaw\.org|onetrust") {
        return (pass);
    }

    # Cookie-Header bereinigen (außer für OneTrust)
    if (req.http.Cookie) {
        # Behalte nur OneTrust Cookies
        set req.http.Cookie = regsuball(req.http.Cookie, "(^|;\s*)(OptanonConsent|OptanonAlertBoxClosed)=", "; \2=");
        set req.http.Cookie = regsuball(req.http.Cookie, ";\s*[^ ][^;]*", "");
        set req.http.Cookie = regsuball(req.http.Cookie, "^;\s*", "");

        if (req.http.Cookie == "") {
            unset req.http.Cookie;
        }
    }

    # User-Agent normalisieren für bessere Cache-Hit-Rate
    if (req.http.User-Agent ~ "(?i)mobile") {
        set req.http.X-Device = "mobile";
    } else {
        set req.http.X-Device = "desktop";
    }

    return (hash);
}

# Cache Key Definition
sub vcl_hash {
    hash_data(req.url);

    # Device-Type in Cache-Key einbeziehen
    if (req.http.X-Device) {
        hash_data(req.http.X-Device);
    }

    return (lookup);
}

# Backend Response Processing
sub vcl_backend_response {
    # Static Assets: Lange cachen
    if (bereq.url ~ "\.(jpg|jpeg|png|gif|webp|svg|ico|css|js|woff|woff2|ttf|eot)$") {
        set beresp.ttl = 1w;  # 1 Woche
        set beresp.grace = 1h;
        unset beresp.http.Set-Cookie;
    }

    # HTML Pages: Kurz cachen
    else if (beresp.http.Content-Type ~ "text/html") {
        set beresp.ttl = 5m;  # 5 Minuten
        set beresp.grace = 1h;
    }

    # API Responses: Nicht cachen
    else if (bereq.url ~ "^/api/") {
        set beresp.ttl = 0s;
        set beresp.uncacheable = true;
        return (deliver);
    }

    # Default: 10 Minuten
    else {
        set beresp.ttl = 10m;
        set beresp.grace = 1h;
    }

    # Grace Mode für bessere Performance bei Backend-Problemen
    if (beresp.ttl < 1s) {
        set beresp.grace = 1h;
    }

    # Compression aktivieren
    if (beresp.http.content-type ~ "text|application/javascript|application/json") {
        set beresp.do_gzip = true;
    }

    return (deliver);
}

# Client Response Processing
sub vcl_deliver {
    # Debug-Header: Cache-Status anzeigen
    if (obj.hits > 0) {
        set resp.http.X-Cache = "HIT";
        set resp.http.X-Cache-Hits = obj.hits;
    } else {
        set resp.http.X-Cache = "MISS";
    }

    # Security Headers
    set resp.http.X-Content-Type-Options = "nosniff";
    set resp.http.X-Frame-Options = "SAMEORIGIN";
    set resp.http.X-XSS-Protection = "1; mode=block";

    # Remove internal headers
    unset resp.http.X-Powered-By;
    unset resp.http.Server;
    unset resp.http.Via;
    unset resp.http.X-Varnish;

    return (deliver);
}

# Error Handling
sub vcl_backend_error {
    # Custom Error Page
    set beresp.http.Content-Type = "text/html; charset=utf-8";
    synthetic({"
        <!DOCTYPE html>
        <html>
        <head>
            <title>Service Temporarily Unavailable</title>
            <style>
                body {
                    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
                    background: linear-gradient(135deg, #FEF3F2 0%, #F9FAFB 100%);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    height: 100vh;
                    margin: 0;
                }
                .error {
                    text-align: center;
                    padding: 40px;
                    background: white;
                    border-radius: 20px;
                    box-shadow: 0 20px 60px rgba(0,0,0,0.1);
                }
                h1 { color: #DC2626; margin: 0 0 20px 0; }
                p { color: #6B7280; }
            </style>
        </head>
        <body>
            <div class="error">
                <h1>⚠️ Service Temporarily Unavailable</h1>
                <p>We're working on it. Please try again in a moment.</p>
            </div>
        </body>
        </html>
    "});
    return (deliver);
}

# Synthetic Responses (für PURGE etc.)
sub vcl_synth {
    if (resp.status == 405) {
        set resp.http.Content-Type = "text/plain";
        synthetic("PURGE not allowed from this IP");
        return (deliver);
    }
}
