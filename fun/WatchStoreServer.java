import com.sun.net.httpserver.HttpExchange;
import com.sun.net.httpserver.HttpServer;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.net.InetSocketAddress;
import java.net.URLDecoder;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardOpenOption;
import java.time.Instant;
import java.util.HashMap;
import java.util.Locale;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.Executors;

public final class WatchStoreServer {
    private static final int PORT = 8080;
    private static final Map<Integer, Integer> PRICES = new HashMap<Integer, Integer>();

    static {
        PRICES.put(1, 465);
        PRICES.put(2, 395);
        PRICES.put(3, 620);
        PRICES.put(4, 429);
        PRICES.put(5, 285);
        PRICES.put(6, 499);
        PRICES.put(7, 545);
        PRICES.put(8, 385);
    }

    private WatchStoreServer() { }

    public static void main(String[] args) throws IOException {
        HttpServer server = HttpServer.create(new InetSocketAddress("127.0.0.1", PORT), 0);
        server.createContext("/api/orders", WatchStoreServer::handleOrder);
        server.createContext("/", WatchStoreServer::serveStore);
        server.setExecutor(Executors.newFixedThreadPool(4));
        server.start();
        System.out.println("Meridian Watch Co. is running at http://localhost:" + PORT);
        System.out.println("Test orders are recorded in orders.log. Press Ctrl+C to stop.");
    }

    private static void serveStore(HttpExchange exchange) throws IOException {
        if (!"GET".equals(exchange.getRequestMethod())) {
            exchange.getResponseHeaders().set("Allow", "GET");
            respond(exchange, 405, "text/plain; charset=utf-8", "Method not allowed");
            return;
        }
        String path = exchange.getRequestURI().getPath();
        if (!"/".equals(path) && !"/watch.html".equals(path)) {
            respond(exchange, 404, "text/plain; charset=utf-8", "Not found");
            return;
        }
        Path html = Paths.get("watch.html");
        if (!Files.isRegularFile(html)) {
            respond(exchange, 500, "text/plain; charset=utf-8", "Place WatchStoreServer.java beside watch.html.");
            return;
        }
        exchange.getResponseHeaders().set("X-Content-Type-Options", "nosniff");
        byte[] content = Files.readAllBytes(html);
        exchange.getResponseHeaders().set("Cache-Control", "no-store");
        exchange.getResponseHeaders().set("Content-Type", "text/html; charset=utf-8");
        exchange.sendResponseHeaders(200, content.length);
        exchange.getResponseBody().write(content);
        exchange.close();
    }

    private static void handleOrder(HttpExchange exchange) throws IOException {
        if (!"POST".equals(exchange.getRequestMethod())) {
            exchange.getResponseHeaders().set("Allow", "POST");
            respondJson(exchange, 405, "{\"error\":\"Method not allowed.\"}");
            return;
        }

        try {
            Map<String, String> form = parseForm(readBody(exchange.getRequestBody()));
            validateCustomer(form);
            Order order = parseOrder(form.get("items"));
            String reference = "MWC-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase(Locale.ROOT);
            String logEntry = Instant.now() + " " + reference + " total=" + order.total
                    + "EUR items=" + order.items + System.lineSeparator();
            Files.write(Paths.get("orders.log"), logEntry.getBytes(StandardCharsets.UTF_8),
                    StandardOpenOption.CREATE, StandardOpenOption.APPEND);
            respondJson(exchange, 201, "{\"ok\":true,\"reference\":\"" + reference
                    + "\",\"total\":" + order.total + "}");
        } catch (IllegalArgumentException exception) {
            respondJson(exchange, 400, "{\"error\":\"" + jsonEscape(exception.getMessage()) + "\"}");
        } catch (IOException exception) {
            respondJson(exchange, 500, "{\"error\":\"The test order could not be recorded.\"}");
        }
    }

    private static byte[] readBody(InputStream input) throws IOException {
        ByteArrayOutputStream output = new ByteArrayOutputStream();
        byte[] buffer = new byte[1024];
        int total = 0;
        int read;
        while ((read = input.read(buffer)) != -1) {
            total += read;
            if (total > 8192) throw new IllegalArgumentException("Order details are too large.");
            output.write(buffer, 0, read);
        }
        return output.toByteArray();
    }

    private static Map<String, String> parseForm(byte[] body) throws IOException {
        Map<String, String> values = new HashMap<String, String>();
        String form = new String(body, StandardCharsets.UTF_8);
        for (String pair : form.split("&")) {
            int separator = pair.indexOf('=');
            String key = separator < 0 ? pair : pair.substring(0, separator);
            String value = separator < 0 ? "" : pair.substring(separator + 1);
            values.put(URLDecoder.decode(key, "UTF-8"), URLDecoder.decode(value, "UTF-8"));
        }
        return values;
    }

    private static void validateCustomer(Map<String, String> form) {
        String name = form.get("name");
        String email = form.get("email");
        String address = form.get("address");
        if (name == null || name.trim().isEmpty() || name.length() > 100) {
            throw new IllegalArgumentException("Enter a valid name.");
        }
        if (email == null || email.length() > 254 || !email.matches("^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$")) {
            throw new IllegalArgumentException("Enter a valid email address.");
        }
        if (address == null || address.trim().isEmpty() || address.length() > 250) {
            throw new IllegalArgumentException("Enter a valid delivery address.");
        }
    }

    private static Order parseOrder(String value) {
        if (value == null || value.trim().isEmpty()) throw new IllegalArgumentException("Your bag is empty.");
        int total = 0;
        int itemCount = 0;
        StringBuilder items = new StringBuilder();
        for (String entry : value.split(",")) {
            String[] parts = entry.split(":", -1);
            if (parts.length != 2) throw new IllegalArgumentException("Invalid watch selection.");
            try {
                int id = Integer.parseInt(parts[0]);
                int quantity = Integer.parseInt(parts[1]);
                Integer price = PRICES.get(id);
                if (price == null || quantity < 1 || quantity > 20 || itemCount + quantity > 100) {
                    throw new IllegalArgumentException("Invalid watch quantity.");
                }
                if (items.length() > 0) items.append(',');
                items.append(id).append('x').append(quantity);
                total += price * quantity;
                itemCount += quantity;
            } catch (NumberFormatException exception) {
                throw new IllegalArgumentException("Invalid watch selection.");
            }
        }
        return new Order(total, items.toString());
    }

    private static void respondJson(HttpExchange exchange, int status, String body) throws IOException {
        respond(exchange, status, "application/json; charset=utf-8", body);
    }

    private static void respond(HttpExchange exchange, int status, String contentType, String body) throws IOException {
        byte[] bytes = body.getBytes(StandardCharsets.UTF_8);
        exchange.getResponseHeaders().set("Content-Type", contentType);
        exchange.getResponseHeaders().set("Cache-Control", "no-store");
        exchange.getResponseHeaders().set("X-Content-Type-Options", "nosniff");
        exchange.sendResponseHeaders(status, bytes.length);
        exchange.getResponseBody().write(bytes);
        exchange.close();
    }

    private static String jsonEscape(String value) {
        return value.replace("\\", "\\\\").replace("\"", "\\\"")
                .replace("\r", " ").replace("\n", " ");
    }

    private static final class Order {
        private final int total;
        private final String items;

        private Order(int total, String items) {
            this.total = total;
            this.items = items;
        }
    }
}