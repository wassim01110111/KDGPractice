package learning.java;

import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.io.PrintStream;
import java.lang.reflect.Constructor;
import java.lang.reflect.Field;
import java.lang.reflect.InvocationTargetException;
import java.lang.reflect.Method;
import java.lang.reflect.Modifier;
import java.math.BigDecimal;
import java.net.URI;
import java.net.URL;
import java.net.URLClassLoader;
import java.nio.charset.StandardCharsets;
import java.nio.file.FileVisitResult;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.SimpleFileVisitor;
import java.nio.file.attribute.BasicFileAttributes;
import java.util.ArrayList;
import java.util.Collections;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import java.util.regex.PatternSyntaxException;

import javax.tools.Diagnostic;
import javax.tools.DiagnosticCollector;
import javax.tools.JavaCompiler;
import javax.tools.JavaFileObject;
import javax.tools.SimpleJavaFileObject;
import javax.tools.StandardJavaFileManager;
import javax.tools.ToolProvider;

/**
 * Minimal, dependency-free Java exercise compiler and probe runner.
 *
 * Everything that does not need the JVM is done by java.js: source validation,
 * modifier/value/text comparison, feedback text, scoring and regexFull lookups.
 * This class only compiles, runs main(), and reflects on the compiled classes.
 *
 * Commands (five arguments are always required):
 *   compile <sources.json> <config.json> <result.json> <classes-dir>
 *   run     -             <config.json> <result.json> <classes-dir>
 *   check   -             <config.json> <result.json> <classes-dir>
 *   cleanup -             -            -            <classes-dir>
 *
 * "run" and "check" results are raw (marked "raw": true); java.js finalizes them.
 */
public final class ExerciseRunner {
    private ExerciseRunner() { }

    public static void main(String[] args) {
        if (args.length != 5) {
            System.err.println("Usage: ExerciseRunner <compile|run|check|cleanup> <sources-or-dash> <config> <result> <classes-dir>");
            return;
        }

        String operation = args[0];
        Path sourcesPath = "-".equals(args[1]) ? null : Paths.get(args[1]);
        Path configPath = "-".equals(args[2]) ? null : Paths.get(args[2]);
        Path resultPath = "-".equals(args[3]) ? null : Paths.get(args[3]);
        Path classesDir = Paths.get(args[4]);

        if ("cleanup".equals(operation)) {
            try {
                Path requestDirectory = classesDir.getParent();
                if (requestDirectory != null) deleteTree(requestDirectory);
            } catch (Throwable error) {
                System.err.println("Could not clean runner files: " + safeMessage(error));
            }
            return;
        }

        Map<String, Object> result;
        try {
            if (configPath == null) throw new IllegalArgumentException("A config path is required.");
            Map<String, Object> config = asMap(Json.parse(Files.readString(configPath, StandardCharsets.UTF_8)));
            switch (operation) {
                case "compile": {
                    if (sourcesPath == null) throw new IllegalArgumentException("A sources path is required for compile.");
                    result = compile(asMap(Json.parse(Files.readString(sourcesPath, StandardCharsets.UTF_8))), classesDir);
                    break;
                }
                case "run":
                    result = runProgram(config, classesDir);
                    break;
                case "check":
                    result = grade(config, classesDir);
                    break;
                default:
                    throw new IllegalArgumentException("Unknown runner operation: " + operation);
            }
        } catch (Throwable error) {
            result = rawResult();
            result.put("error", safeMessage(error));
            result.put("errorType", error.getClass().getName());
        }

        if (resultPath == null) {
            System.err.println("A result path is required.");
            return;
        }
        try {
            Path parent = resultPath.getParent();
            if (parent != null) Files.createDirectories(parent);
            Files.writeString(resultPath, Json.stringify(result), StandardCharsets.UTF_8);
        } catch (Throwable error) {
            System.err.println("Could not write runner result: " + safeMessage(error));
        }
    }

    // ------------------------------------------------------------------ compile

    /** Source names and the "no sources" case are validated by java.js before this runs. */
    private static Map<String, Object> compile(Map<String, Object> sourcesDoc, Path classesDir) {
        JavaCompiler compiler = ToolProvider.getSystemJavaCompiler();
        if (compiler == null) {
            return compileResult(false, List.of(diagnostic("(compiler)", 0, 0,
                    "The Java compiler is unavailable in this runtime (ToolProvider.getSystemJavaCompiler() returned null).")));
        }
        try {
            deleteTree(classesDir);
            Files.createDirectories(classesDir);
            DiagnosticCollector<JavaFileObject> collector = new DiagnosticCollector<>();
            List<JavaFileObject> units = new ArrayList<>();
            for (Map<String, Object> source : maps(sourcesDoc.get("sources"))) {
                units.add(new MemorySource(string(source.get("name"), "Main.java"), string(source.get("code"), "")));
            }
            try (StandardJavaFileManager manager = compiler.getStandardFileManager(collector, Locale.ROOT, StandardCharsets.UTF_8)) {
                List<String> options = List.of("-proc:none", "--release", "21", "-encoding", "UTF-8", "-d", classesDir.toString());
                boolean ok = Boolean.TRUE.equals(compiler.getTask(null, manager, collector, options, null, units).call());
                List<Object> diagnostics = new ArrayList<>();
                for (Diagnostic<? extends JavaFileObject> item : collector.getDiagnostics()) {
                    Map<String, Object> row = diagnostic(item.getSource() == null ? "" : item.getSource().toUri().getPath(),
                            item.getLineNumber(), item.getColumnNumber(), item.getMessage(Locale.ROOT));
                    row.put("kind", item.getKind().name());
                    diagnostics.add(row);
                }
                if (!ok) deleteTree(classesDir);
                return compileResult(ok, diagnostics);
            }
        } catch (Throwable error) {
            return compileResult(false, List.of(diagnostic("(compiler)", 0, 0, safeMessage(error))));
        }
    }

    /** Kept in the legacy shape because the worker reads compiled/status from this result. */
    private static Map<String, Object> compileResult(boolean ok, List<?> diagnostics) {
        Map<String, Object> result = new LinkedHashMap<>();
        result.put("success", ok);
        result.put("compiled", ok);
        result.put("status", ok ? "compiled" : "compile-error");
        result.put("exitCode", ok ? 0 : 1);
        result.put("stdout", "");
        result.put("stderr", "");
        result.put("executionTimeMs", 0);
        result.put("diagnostics", diagnostics);
        return result;
    }

    // ---------------------------------------------------------------------- run

    private static Map<String, Object> runProgram(Map<String, Object> config, Path classesDir) {
        Map<String, Object> result = rawResult();
        long start = System.nanoTime();
        try (URLClassLoader loader = newClassLoader(classesDir)) {
            ProgramCapture capture = invokeMain(string(config.get("mainClass"), "Main"), loader, string(config.get("stdin"), ""));
            result.put("stdout", capture.stdout);
            result.put("stderr", capture.stderr);
            if (capture.exception != null) result.put("runtimeException", capture.exception);
        } catch (Throwable error) {
            result.put("runtimeException", exceptionInfo(error));
        }
        result.put("executionTimeMs", elapsedMs(start));
        return result;
    }

    // -------------------------------------------------------------------- check

    /** Collects raw facts per check, in order. java.js decides pass/fail, feedback and score. */
    private static Map<String, Object> grade(Map<String, Object> config, Path classesDir) {
        Map<String, Object> result = rawResult();
        long start = System.nanoTime();
        List<Object> probes = new ArrayList<>();
        for (Map<String, Object> check : maps(config.get("checks"))) {
            Map<String, Object> out = new LinkedHashMap<>();
            try (URLClassLoader loader = newClassLoader(classesDir)) {
                probe(check, loader, out);
            } catch (Throwable error) {
                out.put("errorType", error.getClass().getSimpleName());
                out.put("errorMessage", safeMessage(error));
            }
            probes.add(out);
        }
        result.put("checks", probes);
        result.put("executionTimeMs", elapsedMs(start));
        return result;
    }

    private static void probe(Map<String, Object> check, ClassLoader loader, Map<String, Object> out) throws Exception {
        String type = string(check.get("type"), "");
        String className = string(check.get("className"), string(check.get("mainClass"), "Main"));
        switch (type) {
            case "stdout":
            case "stderr": {
                ProgramCapture capture = invokeMain(className, loader, string(check.get("input"), ""));
                String actual = "stderr".equals(type) ? capture.stderr : capture.stdout;
                out.put("actual", actual);
                out.put("stdout", capture.stdout);
                out.put("stderr", capture.stderr);
                if (capture.exception != null) out.put("exception", capture.exception);
                else regexProbe(actual, check, out);
                break;
            }
            case "classExists":
                out.put("actual", Class.forName(className, false, loader).getName());
                break;
            case "fieldExists": {
                Field field = Class.forName(className, false, loader).getDeclaredField(string(check.get("fieldName"), ""));
                out.put("name", field.getName());
                out.put("actual", field.getType().getName());
                break;
            }
            case "fieldModifier": {
                Field field = Class.forName(className, false, loader).getDeclaredField(string(check.get("fieldName"), ""));
                out.put("name", field.getName());
                out.put("modifiers", field.getModifiers());
                break;
            }
            case "fieldValue": {
                Class<?> owner = Class.forName(className, false, loader);
                Field field = owner.getDeclaredField(string(check.get("fieldName"), ""));
                field.setAccessible(true);
                Object instance = Modifier.isStatic(field.getModifiers()) ? null : instantiate(owner, asMap(check.get("constructor")), loader);
                Object value = field.get(instance);
                out.put("actual", value);
                if (value instanceof String) regexProbe((String) value, check, out);
                break;
            }
            case "methodExists": {
                Method method = Class.forName(className, false, loader).getDeclaredMethod(string(check.get("method"), ""), parameterTypes(check.get("parameterTypes"), loader));
                out.put("actual", method.getName());
                break;
            }
            case "methodModifier": {
                Method method = Class.forName(className, false, loader).getDeclaredMethod(string(check.get("method"), ""), parameterTypes(check.get("parameterTypes"), loader));
                out.put("name", method.getName());
                out.put("modifiers", method.getModifiers());
                break;
            }
            case "constructorExists": {
                Constructor<?> constructor = Class.forName(className, false, loader).getDeclaredConstructor(parameterTypes(check.get("parameterTypes"), loader));
                out.put("actual", constructor.toString());
                out.put("modifiers", constructor.getModifiers());
                break;
            }
            case "classModifier":
                out.put("modifiers", Class.forName(className, false, loader).getModifiers());
                break;
            case "inheritance": {
                Class<?> owner = Class.forName(className, false, loader);
                Class<?> parent = owner.getSuperclass();
                out.put("superclass", parent == null ? "" : parent.getName());
                List<Object> interfaces = new ArrayList<>();
                for (Class<?> item : owner.getInterfaces()) interfaces.add(item.getName());
                out.put("interfaces", interfaces);
                break;
            }
            case "instanceOf": {
                Class<?> owner = Class.forName(className, false, loader);
                Object instance = instantiate(owner, asMap(check.get("constructor")), loader);
                Class<?> target = resolveType(string(check.get("expectedType"), string(check.get("expected"), "")), loader);
                out.put("actual", instance.getClass().getName());
                out.put("isInstance", target.isInstance(instance));
                break;
            }
            case "methodReturn": {
                Class<?> owner = Class.forName(className, false, loader);
                Method method = owner.getDeclaredMethod(string(check.get("method"), ""), parameterTypes(check.get("parameterTypes"), loader));
                method.setAccessible(true);
                boolean isStatic = Modifier.isStatic(method.getModifiers());
                if (!isStatic && (owner.isInterface() || Modifier.isAbstract(owner.getModifiers()))) {
                    out.put("notInstantiable", true);
                    break;
                }
                Object instance = isStatic ? null : instantiate(owner, asMap(check.get("constructor")), loader);
                try {
                    Object value = method.invoke(instance, convertArgs(check.get("args"), method.getParameterTypes(), loader));
                    out.put("actual", value);
                    if (value instanceof String) regexProbe((String) value, check, out);
                } catch (InvocationTargetException error) {
                    out.put("thrown", exceptionInfo(error.getCause() == null ? error : error.getCause()));
                }
                break;
            }
            default:
                out.put("unsupported", true);
        }
    }

    /**
     * Regex matching stays in Java so Java regex semantics apply. java.js sets
     * check.regex = {flags: <Pattern flag bits>, full: <boolean>} only for the regex matcher.
     */
    private static void regexProbe(String actual, Map<String, Object> check, Map<String, Object> out) {
        Map<String, Object> regex = asMap(check.get("regex"));
        if (regex.isEmpty()) return;
        try {
            Matcher matcher = Pattern.compile(string(check.get("expected"), "null"), (int) number(regex.get("flags"), 0d)).matcher(actual);
            out.put("matched", Boolean.TRUE.equals(regex.get("full")) ? matcher.matches() : matcher.find());
        } catch (PatternSyntaxException error) {
            out.put("regexError", error.getDescription());
        }
    }

    // --------------------------------------------------------------- reflection

    private static Object instantiate(Class<?> type, Map<String, Object> spec, ClassLoader loader) throws Exception {
        if (spec == null || spec.isEmpty()) {
            Constructor<?> constructor = type.getDeclaredConstructor();
            constructor.setAccessible(true);
            return constructor.newInstance();
        }
        Class<?>[] parameterTypes = parameterTypes(spec.get("parameterTypes"), loader);
        Constructor<?> constructor = type.getDeclaredConstructor(parameterTypes);
        constructor.setAccessible(true);
        return constructor.newInstance(convertArgs(spec.get("args"), parameterTypes, loader));
    }

    private static Class<?>[] parameterTypes(Object value, ClassLoader loader) throws ClassNotFoundException {
        List<String> names = strings(value);
        Class<?>[] types = new Class<?>[names.size()];
        for (int i = 0; i < names.size(); i++) types[i] = resolveType(names.get(i), loader);
        return types;
    }

    private static Class<?> resolveType(String name, ClassLoader loader) throws ClassNotFoundException {
        switch (name) {
            case "boolean": return boolean.class;
            case "byte": return byte.class;
            case "short": return short.class;
            case "int": return int.class;
            case "long": return long.class;
            case "float": return float.class;
            case "double": return double.class;
            case "char": return char.class;
            case "void": return void.class;
            default:
                if (name.endsWith("[]")) return java.lang.reflect.Array.newInstance(resolveType(name.substring(0, name.length() - 2), loader), 0).getClass();
                return Class.forName(name, true, loader);
        }
    }

    private static Object[] convertArgs(Object raw, Class<?>[] types, ClassLoader loader) throws Exception {
        List<?> values = raw instanceof List<?> ? (List<?>) raw : Collections.emptyList();
        if (values.size() != types.length) throw new IllegalArgumentException("Expected " + types.length + " arguments but received " + values.size() + ".");
        Object[] converted = new Object[types.length];
        for (int i = 0; i < types.length; i++) converted[i] = convert(values.get(i), types[i], loader);
        return converted;
    }

    private static Object convert(Object value, Class<?> target, ClassLoader loader) throws Exception {
        if (value == null) return null;
        if (target == String.class) return String.valueOf(value);
        if (target == char.class || target == Character.class) {
            String text = String.valueOf(value);
            if (text.length() != 1) throw new IllegalArgumentException("A char argument must contain exactly one character.");
            return text.charAt(0);
        }
        if (target == boolean.class || target == Boolean.class) {
            if (value instanceof Boolean) return value;
            String text = String.valueOf(value);
            if (!"true".equalsIgnoreCase(text) && !"false".equalsIgnoreCase(text)) throw new IllegalArgumentException("A boolean argument must be true or false.");
            return Boolean.parseBoolean(text);
        }
        if (target == byte.class || target == Byte.class) return new BigDecimal(String.valueOf(value)).byteValueExact();
        if (target == short.class || target == Short.class) return new BigDecimal(String.valueOf(value)).shortValueExact();
        if (target == int.class || target == Integer.class) return new BigDecimal(String.valueOf(value)).intValueExact();
        if (target == long.class || target == Long.class) return new BigDecimal(String.valueOf(value)).longValueExact();
        if (target == float.class || target == Float.class) return Float.parseFloat(String.valueOf(value));
        if (target == double.class || target == Double.class) return Double.parseDouble(String.valueOf(value));
        if (target.isInstance(value)) return value;
        if (target.isEnum()) {
            @SuppressWarnings({"unchecked", "rawtypes"}) Object enumValue = Enum.valueOf((Class<? extends Enum>) target, String.valueOf(value));
            return enumValue;
        }
        if (target.isArray() && value instanceof List<?>) {
            List<?> items = (List<?>) value;
            Object array = java.lang.reflect.Array.newInstance(target.getComponentType(), items.size());
            for (int i = 0; i < items.size(); i++) java.lang.reflect.Array.set(array, i, convert(items.get(i), target.getComponentType(), loader));
            return array;
        }
        return value;
    }

    private static ProgramCapture invokeMain(String mainClass, ClassLoader loader, String input) {
        InputStream originalIn = System.in;
        PrintStream originalOut = System.out;
        PrintStream originalErr = System.err;
        ByteArrayOutputStream out = new ByteArrayOutputStream();
        ByteArrayOutputStream err = new ByteArrayOutputStream();
        Map<String, Object> exception = null;
        try (PrintStream outStream = new PrintStream(out, true, StandardCharsets.UTF_8);
             PrintStream errStream = new PrintStream(err, true, StandardCharsets.UTF_8)) {
            System.setIn(new ByteArrayInputStream(input.getBytes(StandardCharsets.UTF_8)));
            System.setOut(outStream);
            System.setErr(errStream);
            Method main = Class.forName(mainClass, true, loader).getMethod("main", String[].class);
            if (!Modifier.isStatic(main.getModifiers())) throw new NoSuchMethodException("main(String[]) must be static.");
            main.setAccessible(true);
            main.invoke(null, (Object) new String[0]);
        } catch (Throwable error) {
            Throwable cause = error instanceof InvocationTargetException && ((InvocationTargetException) error).getCause() != null
                    ? ((InvocationTargetException) error).getCause() : error;
            exception = exceptionInfo(cause);
        } finally {
            System.setIn(originalIn);
            System.setOut(originalOut);
            System.setErr(originalErr);
        }
        return new ProgramCapture(out.toString(StandardCharsets.UTF_8), err.toString(StandardCharsets.UTF_8), exception);
    }

    private static URLClassLoader newClassLoader(Path classesDir) throws IOException {
        URL url = classesDir.toUri().toURL();
        return new URLClassLoader(new URL[] {url}, ExerciseRunner.class.getClassLoader());
    }

    // ------------------------------------------------------------------ helpers

    private static Map<String, Object> exceptionInfo(Throwable error) {
        Map<String, Object> info = new LinkedHashMap<>();
        info.put("type", error.getClass().getName());
        info.put("message", safeMessage(error));
        List<String> frames = new ArrayList<>();
        StackTraceElement[] stack = error.getStackTrace();
        for (int i = 0; i < Math.min(stack.length, 8); i++) frames.add(stack[i].toString());
        info.put("stack", frames);
        return info;
    }

    /** Raw results carry only facts; java.js adds status/success/exitCode/score/feedback. */
    private static Map<String, Object> rawResult() {
        Map<String, Object> result = new LinkedHashMap<>();
        result.put("raw", Boolean.TRUE);
        return result;
    }

    private static Map<String, Object> diagnostic(String file, long line, long column, String message) {
        Map<String, Object> item = new LinkedHashMap<>();
        item.put("kind", "ERROR");
        item.put("file", file);
        item.put("line", line);
        item.put("column", column);
        item.put("message", message);
        return item;
    }

    private static String safeMessage(Throwable error) {
        String message = error.getMessage();
        return message == null || message.isBlank() ? error.getClass().getSimpleName() : message;
    }

    private static String string(Object value, String fallback) { return value == null ? fallback : String.valueOf(value); }
    private static double number(Object value, double fallback) { return value instanceof Number ? ((Number) value).doubleValue() : fallback; }
    private static long elapsedMs(long start) { return (System.nanoTime() - start) / 1_000_000L; }

    @SuppressWarnings("unchecked")
    private static Map<String, Object> asMap(Object value) {
        return value instanceof Map<?, ?> ? (Map<String, Object>) value : new LinkedHashMap<>();
    }

    @SuppressWarnings("unchecked")
    private static List<Map<String, Object>> maps(Object value) {
        if (!(value instanceof List<?>)) return Collections.emptyList();
        List<Map<String, Object>> result = new ArrayList<>();
        for (Object item : (List<?>) value) if (item instanceof Map<?, ?>) result.add((Map<String, Object>) item);
        return result;
    }

    private static List<String> strings(Object value) {
        if (value == null) return Collections.emptyList();
        if (value instanceof List<?>) {
            List<String> result = new ArrayList<>();
            for (Object item : (List<?>) value) result.add(String.valueOf(item));
            return result;
        }
        String one = String.valueOf(value);
        return one.isEmpty() ? Collections.emptyList() : List.of(one);
    }

    private static void deleteTree(Path path) throws IOException {
        if (path == null || !Files.exists(path)) return;
        Files.walkFileTree(path, new SimpleFileVisitor<>() {
            @Override public FileVisitResult visitFile(Path file, BasicFileAttributes attrs) throws IOException {
                Files.deleteIfExists(file);
                return FileVisitResult.CONTINUE;
            }
            @Override public FileVisitResult postVisitDirectory(Path dir, IOException error) throws IOException {
                if (error != null) throw error;
                Files.deleteIfExists(dir);
                return FileVisitResult.CONTINUE;
            }
        });
    }

    private static final class MemorySource extends SimpleJavaFileObject {
        private final String source;
        MemorySource(String name, String source) {
            super(URI.create("string:///" + name), Kind.SOURCE);
            this.source = source;
        }
        @Override public CharSequence getCharContent(boolean ignoreEncodingErrors) { return source; }
    }

    private static final class ProgramCapture {
        final String stdout;
        final String stderr;
        final Map<String, Object> exception;
        ProgramCapture(String stdout, String stderr, Map<String, Object> exception) {
            this.stdout = stdout; this.stderr = stderr; this.exception = exception;
        }
    }

    /** Small JSON parser/serializer to keep the runner dependency-free. */
    private static final class Json {
        static Object parse(String text) { return new Parser(text).parse(); }
        static String stringify(Object value) {
            StringBuilder out = new StringBuilder();
            write(value, out);
            return out.toString();
        }
        private static void write(Object value, StringBuilder out) {
            if (value == null) { out.append("null"); return; }
            if (value instanceof String || value instanceof Character) { quoteJson(String.valueOf(value), out); return; }
            if (value instanceof Number) {
                String numeric = value.toString();
                if (value instanceof Double && !Double.isFinite((Double) value) || value instanceof Float && !Float.isFinite((Float) value)) quoteJson(numeric, out);
                else out.append(numeric);
                return;
            }
            if (value instanceof Boolean) { out.append(value); return; }
            if (value instanceof Map<?, ?>) {
                out.append('{'); boolean first = true;
                for (Map.Entry<?, ?> entry : ((Map<?, ?>) value).entrySet()) {
                    if (!first) out.append(','); first = false;
                    quoteJson(String.valueOf(entry.getKey()), out); out.append(':'); write(entry.getValue(), out);
                }
                out.append('}'); return;
            }
            if (value instanceof Iterable<?>) {
                out.append('['); boolean first = true;
                for (Object item : (Iterable<?>) value) { if (!first) out.append(','); first = false; write(item, out); }
                out.append(']'); return;
            }
            if (value.getClass().isArray()) {
                out.append('[');
                for (int i = 0; i < java.lang.reflect.Array.getLength(value); i++) { if (i > 0) out.append(','); write(java.lang.reflect.Array.get(value, i), out); }
                out.append(']'); return;
            }
            quoteJson(String.valueOf(value), out);
        }
        private static void quoteJson(String text, StringBuilder out) {
            out.append('"');
            for (int i = 0; i < text.length(); i++) {
                char ch = text.charAt(i);
                switch (ch) {
                    case '"': out.append("\\\""); break;
                    case '\\': out.append("\\\\"); break;
                    case '\b': out.append("\\b"); break;
                    case '\f': out.append("\\f"); break;
                    case '\n': out.append("\\n"); break;
                    case '\r': out.append("\\r"); break;
                    case '\t': out.append("\\t"); break;
                    default:
                        if (ch < 0x20) out.append(String.format(Locale.ROOT, "\\u%04x", (int) ch));
                        else out.append(ch);
                }
            }
            out.append('"');
        }

        private static final class Parser {
            private final String text;
            private int at;
            Parser(String text) { this.text = text == null ? "" : text; }
            Object parse() {
                Object result = value(); whitespace();
                if (at != text.length()) throw error("Unexpected trailing content");
                return result;
            }
            private Object value() {
                whitespace();
                if (at >= text.length()) throw error("Unexpected end of JSON");
                char ch = text.charAt(at);
                if (ch == '{') return object();
                if (ch == '[') return array();
                if (ch == '"') return string();
                if (ch == 't') { literal("true"); return Boolean.TRUE; }
                if (ch == 'f') { literal("false"); return Boolean.FALSE; }
                if (ch == 'n') { literal("null"); return null; }
                return number();
            }
            private Map<String, Object> object() {
                Map<String, Object> map = new LinkedHashMap<>(); at++; whitespace();
                if (take('}')) return map;
                while (true) {
                    whitespace(); if (at >= text.length() || text.charAt(at) != '"') throw error("Expected object key");
                    String key = string(); whitespace(); require(':'); map.put(key, value()); whitespace();
                    if (take('}')) return map;
                    require(',');
                }
            }
            private List<Object> array() {
                List<Object> list = new ArrayList<>(); at++; whitespace();
                if (take(']')) return list;
                while (true) { list.add(value()); whitespace(); if (take(']')) return list; require(','); }
            }
            private String string() {
                require('"'); StringBuilder out = new StringBuilder();
                while (at < text.length()) {
                    char ch = text.charAt(at++);
                    if (ch == '"') return out.toString();
                    if (ch == '\\') {
                        if (at >= text.length()) throw error("Unfinished escape");
                        char esc = text.charAt(at++);
                        switch (esc) {
                            case '"': out.append('"'); break;
                            case '\\': out.append('\\'); break;
                            case '/': out.append('/'); break;
                            case 'b': out.append('\b'); break;
                            case 'f': out.append('\f'); break;
                            case 'n': out.append('\n'); break;
                            case 'r': out.append('\r'); break;
                            case 't': out.append('\t'); break;
                            case 'u':
                                if (at + 4 > text.length()) throw error("Invalid unicode escape");
                                try { out.append((char) Integer.parseInt(text.substring(at, at + 4), 16)); }
                                catch (NumberFormatException ex) { throw error("Invalid unicode escape"); }
                                at += 4; break;
                            default: throw error("Invalid escape: " + esc);
                        }
                    } else {
                        if (ch < 0x20) throw error("Unescaped control character in string");
                        out.append(ch);
                    }
                }
                throw error("Unterminated string");
            }
            private Number number() {
                int start = at;
                if (take('-') && at >= text.length()) throw error("Invalid number");
                if (take('0')) {
                    if (at < text.length() && Character.isDigit(text.charAt(at))) throw error("Leading zero in number");
                } else {
                    if (at >= text.length() || text.charAt(at) < '1' || text.charAt(at) > '9') throw error("Expected value");
                    while (at < text.length() && Character.isDigit(text.charAt(at))) at++;
                }
                if (take('.')) {
                    int fractionStart = at;
                    while (at < text.length() && Character.isDigit(text.charAt(at))) at++;
                    if (fractionStart == at) throw error("Invalid fraction");
                }
                if (at < text.length() && (text.charAt(at) == 'e' || text.charAt(at) == 'E')) {
                    at++;
                    if (at < text.length() && (text.charAt(at) == '+' || text.charAt(at) == '-')) at++;
                    int exponentStart = at;
                    while (at < text.length() && Character.isDigit(text.charAt(at))) at++;
                    if (exponentStart == at) throw error("Invalid exponent");
                }
                try { return new BigDecimal(text.substring(start, at)); }
                catch (NumberFormatException ex) { throw error("Invalid number"); }
            }
            private void literal(String expected) {
                if (!text.startsWith(expected, at)) throw error("Expected " + expected);
                at += expected.length();
            }
            private void whitespace() {
                while (at < text.length()) {
                    char ch = text.charAt(at);
                    if (ch == ' ' || ch == '\t' || ch == '\r' || ch == '\n') at++;
                    else break;
                }
            }
            private boolean take(char ch) {
                if (at < text.length() && text.charAt(at) == ch) { at++; return true; }
                return false;
            }
            private void require(char ch) { if (!take(ch)) throw error("Expected '" + ch + "'"); }
            private IllegalArgumentException error(String message) { return new IllegalArgumentException(message + " at JSON offset " + at); }
        }
    }
}
