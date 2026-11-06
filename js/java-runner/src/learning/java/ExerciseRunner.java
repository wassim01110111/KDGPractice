package learning.java;

import javax.tools.Diagnostic;
import javax.tools.DiagnosticCollector;
import javax.tools.FileObject;
import javax.tools.JavaCompiler;
import javax.tools.JavaFileObject;
import javax.tools.SimpleJavaFileObject;
import javax.tools.StandardJavaFileManager;
import javax.tools.ToolProvider;
import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.io.File;
import java.io.IOException;
import java.io.InputStream;
import java.io.OutputStream;
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
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.Collections;
import java.util.LinkedHashMap;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Set;
import java.util.regex.Pattern;
import java.util.regex.PatternSyntaxException;

/**
 * Static, client-side Java exercise compiler and grader.
 *
 * Commands:
 *   compile <sources.json> <config.json> <result.json> <classes-dir>
 *   run     <config.json> <result.json> <classes-dir>
 *   check   <config.json> <result.json> <classes-dir>
 *
 * All paths are CheerpJ virtual-filesystem paths when run in the browser.
 */
public final class ExerciseRunner {
    private ExerciseRunner() {}

    public static void main(String[] args) {
        if (args.length != 5) {
            System.err.println("Usage: ExerciseRunner <compile|run|check|cleanup> <sources-or-dash> <config> <result> <classes-dir>");
            return;
        }
        String operation = args[0];
        Path sourcesPath = "-".equals(args[1]) ? null : Paths.get(args[1]);
        Path configPath = Paths.get(args[2]);
        Path resultPath = Paths.get(args[3]);
        Path classesDir = Paths.get(args[4]);
        Map<String, Object> result;
        try {
            if ("cleanup".equals(operation)) {
                // The output directory is unique to one browser request. Remove
                // its complete parent so class files and JSON result files do
                // not accumulate in CheerpJ's persistent /files/ mount.
                Path requestDirectory = classesDir.getParent();
                if (requestDirectory != null) deleteTree(requestDirectory);
                return;
            }
            Map<String, Object> config = asMap(Json.parse(Files.readString(configPath, StandardCharsets.UTF_8)));
            if ("compile".equals(operation)) {
                Map<String, Object> sourcesDoc = asMap(Json.parse(Files.readString(sourcesPath, StandardCharsets.UTF_8)));
                result = compile(sourcesDoc, config, classesDir);
            } else if ("run".equals(operation)) {
                result = runProgram(config, classesDir);
            } else if ("check".equals(operation)) {
                result = grade(config, classesDir);
            } else {
                result = failure("Unknown runner operation: " + operation);
            }
        } catch (Throwable error) {
            result = failure(safeMessage(error));
            result.put("errorType", error.getClass().getName());
        }
        try {
            Path parent = resultPath.getParent();
            if (parent != null) Files.createDirectories(parent);
            Files.writeString(resultPath, Json.stringify(result), StandardCharsets.UTF_8);
        } catch (Throwable writeError) {
            System.err.println("Could not write runner result: " + safeMessage(writeError));
        }
    }

    private static Map<String, Object> compile(Map<String, Object> sourcesDoc, Map<String, Object> config, Path classesDir) {
        Map<String, Object> result = baseResult();
        List<Map<String, Object>> sourceRows = maps(sourcesDoc.get("sources"));
        if (sourceRows.isEmpty()) {
            result.put("status", "compile-error");
            result.put("diagnostics", List.of(diagnostic("ERROR", "(source)", 0, 0, "No Java source files were supplied.")));
            return result;
        }

        JavaCompiler compiler = ToolProvider.getSystemJavaCompiler();
        if (compiler == null) {
            result.put("status", "compile-error");
            result.put("diagnostics", List.of(diagnostic("ERROR", "(compiler)", 0, 0,
                    "The Java compiler is unavailable in this runtime (ToolProvider.getSystemJavaCompiler() returned null).")));
            return result;
        }

        try {
            deleteTree(classesDir);
            Files.createDirectories(classesDir);
            DiagnosticCollector<JavaFileObject> collector = new DiagnosticCollector<>();
            List<JavaFileObject> units = new ArrayList<>();
            for (Map<String, Object> source : sourceRows) {
                String name = string(source.get("name"), "Main.java");
                String code = string(source.get("code"), "");
                if (!name.matches("[A-Za-z0-9_$.-]+\\.java")) {
                    result.put("status", "compile-error");
                    result.put("diagnostics", List.of(diagnostic("ERROR", name, 0, 0,
                            "Source file names must be simple .java file names without directory separators.")));
                    return result;
                }
                units.add(new MemorySource(name, code));
            }

            try (StandardJavaFileManager manager = compiler.getStandardFileManager(collector, Locale.ROOT, StandardCharsets.UTF_8)) {
                List<String> options = Arrays.asList(
                        "-proc:none",
                        "--release", "21",
                        "-encoding", "UTF-8",
                        "-d", classesDir.toString()
                );
                boolean ok = Boolean.TRUE.equals(compiler.getTask(null, manager, collector, options, null, units).call());
                List<Object> diagnostics = new ArrayList<>();
                for (Diagnostic<? extends JavaFileObject> item : collector.getDiagnostics()) {
                    String sourceUriPath = item.getSource() == null ? "" : item.getSource().toUri().getPath();
                    String sourceName = sourceUriPath.isEmpty() ? "" : sourceUriPath.substring(sourceUriPath.lastIndexOf('/') + 1);
                    diagnostics.add(diagnostic(
                            item.getKind().name(), sourceName,
                            item.getLineNumber(), item.getColumnNumber(),
                            item.getMessage(Locale.ROOT)
                    ));
                }
                result.put("compiled", ok);
                result.put("success", ok);
                result.put("status", ok ? "compiled" : "compile-error");
                result.put("diagnostics", diagnostics);
                result.put("exitCode", ok ? 0 : 1);
                if (!ok) deleteTree(classesDir);
                return result;
            }
        } catch (Throwable error) {
            result.put("compiled", false);
            result.put("success", false);
            result.put("status", "compile-error");
            result.put("diagnostics", List.of(diagnostic("ERROR", "(compiler)", 0, 0, safeMessage(error))));
            result.put("exitCode", 1);
            return result;
        }
    }

    private static Map<String, Object> runProgram(Map<String, Object> config, Path classesDir) {
        Map<String, Object> result = baseResult();
        result.put("compiled", true);
        long start = System.nanoTime();
        String mainClass = string(config.get("mainClass"), "Main");
        String input = string(config.get("stdin"), "");
        try (URLClassLoader loader = newClassLoader(classesDir)) {
            ProgramCapture capture = invokeMain(mainClass, loader, input);
            result.put("stdout", capture.stdout);
            result.put("stderr", capture.stderr);
            result.put("exitCode", capture.exception == null ? 0 : 1);
            result.put("success", capture.exception == null);
            result.put("status", capture.exception == null ? "completed" : "runtime-error");
            if (capture.exception != null) result.put("runtimeException", capture.exception);
        } catch (Throwable error) {
            result.put("success", false);
            result.put("status", "runtime-error");
            result.put("exitCode", 1);
            result.put("runtimeException", exceptionInfo(error));
        }
        result.put("executionTimeMs", elapsedMs(start));
        return result;
    }

    private static Map<String, Object> grade(Map<String, Object> config, Path classesDir) {
        Map<String, Object> result = baseResult();
        result.put("compiled", true);
        long start = System.nanoTime();
        List<Map<String, Object>> checks = maps(config.get("checks"));
        List<Object> checkResults = new ArrayList<>();
        double total = 0;
        double earned = 0;
        String lastStdout = "";
        String lastStderr = "";
        boolean allPassed = true;

        for (Map<String, Object> check : checks) {
            double points = number(check.get("points"), 1d);
            total += points;
            Map<String, Object> checkResult = new LinkedHashMap<>();
            String id = string(check.get("id"), "check-" + (checkResults.size() + 1));
            String description = string(check.get("description"), id);
            checkResult.put("id", id);
            checkResult.put("description", description);
            checkResult.put("points", points);
            checkResult.put("pointsEarned", 0d);
            try (URLClassLoader loader = newClassLoader(classesDir)) {
                CheckOutcome outcome = evaluate(check, loader);
                if (outcome.stdout != null) lastStdout = outcome.stdout;
                if (outcome.stderr != null) lastStderr = outcome.stderr;
                checkResult.put("passed", outcome.passed);
                checkResult.put("feedback", outcome.feedback == null ? (outcome.passed ? "Passed." : "The check did not match the expected result.") : outcome.feedback);
                if (outcome.actual != null) checkResult.put("actual", outcome.actual);
                if (check.containsKey("expected")) checkResult.put("expected", check.get("expected"));
                if (outcome.passed) {
                    earned += points;
                    checkResult.put("pointsEarned", points);
                } else {
                    allPassed = false;
                }
            } catch (Throwable error) {
                allPassed = false;
                checkResult.put("passed", false);
                checkResult.put("feedback", safeMessage(error));
                checkResult.put("errorType", error.getClass().getSimpleName());
            }
            checkResults.add(checkResult);
        }

        result.put("checks", checkResults);
        result.put("score", Map.of("earned", earned, "total", total));
        result.put("stdout", lastStdout);
        result.put("stderr", lastStderr);
        result.put("success", allPassed && !checks.isEmpty());
        result.put("status", "graded");
        result.put("exitCode", allPassed ? 0 : 1);
        result.put("executionTimeMs", elapsedMs(start));
        return result;
    }

    private static CheckOutcome evaluate(Map<String, Object> check, ClassLoader loader) throws Exception {
        String type = string(check.get("type"), "");
        String className = string(check.get("className"), string(check.get("mainClass"), "Main"));
        switch (type) {
            case "stdout":
            case "stderr": {
                ProgramCapture capture = invokeMain(className, loader, string(check.get("input"), ""));
                String actual = "stderr".equals(type) ? capture.stderr : capture.stdout;
                if (capture.exception != null)
                    return CheckOutcome.fail("Program threw " + string(capture.exception.get("type"), "an exception") + ": " + string(capture.exception.get("message"), ""), actual, capture.stdout, capture.stderr);
                Match match = match(actual, check.get("expected"), check);
                return new CheckOutcome(match.passed, match.feedback, actual, capture.stdout, capture.stderr);
            }
            case "classExists": {
                Class<?> typeClass = Class.forName(className, false, loader);
                return CheckOutcome.pass(typeClass.getName());
            }
            case "fieldExists": {
                Class<?> typeClass = Class.forName(className, false, loader);
                Field field = typeClass.getDeclaredField(string(check.get("fieldName"), ""));
                String expectedType = string(check.get("expectedType"), "");
                if (!expectedType.isEmpty() && !field.getType().getName().equals(expectedType))
                    return CheckOutcome.fail("Field exists, but its type is " + field.getType().getName() + " instead of " + expectedType + ".", field.getType().getName());
                return CheckOutcome.pass(field.getName());
            }
            case "fieldModifier": {
                Class<?> typeClass = Class.forName(className, false, loader);
                Field field = typeClass.getDeclaredField(string(check.get("fieldName"), ""));
                return modifierOutcome(field.getModifiers(), check.get("expected"), "Field " + field.getName());
            }
            case "fieldValue": {
                Class<?> typeClass = Class.forName(className, false, loader);
                Field field = typeClass.getDeclaredField(string(check.get("fieldName"), ""));
                field.setAccessible(true);
                Object instance = Modifier.isStatic(field.getModifiers()) ? null : instantiate(typeClass, asMap(check.get("constructor")), loader);
                Object actual = field.get(instance);
                return compareValue(actual, check.get("expected"), check);
            }
            case "methodExists": {
                Class<?> typeClass = Class.forName(className, false, loader);
                Method method = typeClass.getDeclaredMethod(string(check.get("method"), ""), parameterTypes(check.get("parameterTypes"), loader));
                return CheckOutcome.pass(method.getName());
            }
            case "methodModifier": {
                Class<?> typeClass = Class.forName(className, false, loader);
                Method method = typeClass.getDeclaredMethod(string(check.get("method"), ""), parameterTypes(check.get("parameterTypes"), loader));
                return modifierOutcome(method.getModifiers(), check.get("expected"), "Method " + method.getName());
            }
            case "constructorExists": {
                Class<?> typeClass = Class.forName(className, false, loader);
                Constructor<?> constructor = typeClass.getDeclaredConstructor(parameterTypes(check.get("parameterTypes"), loader));
                if (check.containsKey("expected")) return modifierOutcome(constructor.getModifiers(), check.get("expected"), "Constructor");
                return CheckOutcome.pass(constructor.toString());
            }
            case "classModifier": {
                Class<?> typeClass = Class.forName(className, false, loader);
                return modifierOutcome(typeClass.getModifiers(), check.get("expected"), "Class " + className);
            }
            case "inheritance": {
                Class<?> typeClass = Class.forName(className, false, loader);
                String expectedSuper = string(check.get("superclass"), string(check.get("expected"), ""));
                if (!expectedSuper.isEmpty()) {
                    Class<?> actualSuper = typeClass.getSuperclass();
                    String actual = actualSuper == null ? "" : actualSuper.getName();
                    if (!actual.equals(expectedSuper)) return CheckOutcome.fail("Expected superclass " + expectedSuper + ", found " + (actual.isEmpty() ? "none" : actual) + ".", actual);
                }
                List<String> expectedInterfaces = strings(check.get("interfaces"));
                if (!expectedInterfaces.isEmpty()) {
                    Set<String> actualInterfaces = new LinkedHashSet<>();
                    for (Class<?> item : typeClass.getInterfaces()) actualInterfaces.add(item.getName());
                    for (String expected : expectedInterfaces)
                        if (!actualInterfaces.contains(expected)) return CheckOutcome.fail("Expected implemented interface " + expected + " was not found.", actualInterfaces.toString());
                }
                return CheckOutcome.pass(typeClass.getSuperclass() == null ? "" : typeClass.getSuperclass().getName());
            }
            case "instanceOf": {
                Class<?> typeClass = Class.forName(className, false, loader);
                Object instance = instantiate(typeClass, asMap(check.get("constructor")), loader);
                String targetName = string(check.get("expectedType"), string(check.get("expected"), ""));
                Class<?> target = resolveType(targetName, loader);
                boolean passed = target.isInstance(instance);
                return new CheckOutcome(passed, passed ? "Instance has the expected type." : "Expected an instance of " + targetName + ".", instance.getClass().getName(), null, null);
            }
            case "methodReturn": {
                Class<?> typeClass = Class.forName(className, false, loader);
                Object instance = Modifier.isAbstract(typeClass.getModifiers()) || Modifier.isInterface(typeClass.getModifiers())
                        ? null : instantiate(typeClass, asMap(check.get("constructor")), loader);
                Method method = typeClass.getDeclaredMethod(string(check.get("method"), ""), parameterTypes(check.get("parameterTypes"), loader));
                method.setAccessible(true);
                Object actual;
                try {
                    actual = method.invoke(Modifier.isStatic(method.getModifiers()) ? null : instance, convertArgs(check.get("args"), method.getParameterTypes(), loader));
                } catch (InvocationTargetException error) {
                    Throwable cause = error.getCause() == null ? error : error.getCause();
                    return CheckOutcome.fail("Method threw " + cause.getClass().getSimpleName() + ": " + safeMessage(cause), exceptionInfo(cause));
                }
                return compareValue(actual, check.get("expected"), check);
            }
            default:
                return CheckOutcome.fail("Unsupported check type: " + type, null);
        }
    }

    private static CheckOutcome modifierOutcome(int modifiers, Object expected, String label) {
        List<String> wanted = expected instanceof List ? strings(expected) : List.of(string(expected, ""));
        for (String modifier : wanted) {
            boolean present;
            switch (modifier.toLowerCase(Locale.ROOT)) {
                case "public": present = Modifier.isPublic(modifiers); break;
                case "private": present = Modifier.isPrivate(modifiers); break;
                case "protected": present = Modifier.isProtected(modifiers); break;
                case "static": present = Modifier.isStatic(modifiers); break;
                case "final": present = Modifier.isFinal(modifiers); break;
                case "abstract": present = Modifier.isAbstract(modifiers); break;
                case "synchronized": present = Modifier.isSynchronized(modifiers); break;
                case "native": present = Modifier.isNative(modifiers); break;
                case "strict": present = Modifier.isStrict(modifiers); break;
                case "transient": present = Modifier.isTransient(modifiers); break;
                case "volatile": present = Modifier.isVolatile(modifiers); break;
                default: return CheckOutcome.fail("Unknown modifier: " + modifier, Modifier.toString(modifiers));
            }
            if (!present) return CheckOutcome.fail(label + " must be " + modifier + ". Actual modifiers: " + Modifier.toString(modifiers) + ".", Modifier.toString(modifiers));
        }
        return CheckOutcome.pass(Modifier.toString(modifiers));
    }

    private static CheckOutcome compareValue(Object actual, Object expected, Map<String, Object> check) {
        if (actual instanceof String && expected instanceof String) {
            Match match = match((String) actual, expected, check);
            return new CheckOutcome(match.passed, match.feedback, actual, null, null);
        }
        boolean same = valuesEqual(actual, expected);
        return new CheckOutcome(same, same ? "Returned value matches." : "Expected " + Json.stringify(expected) + " but received " + Json.stringify(actual) + ".", actual, null, null);
    }

    private static Match match(String actual, Object expectedValue, Map<String, Object> check) {
        String expected = expectedValue == null ? "null" : String.valueOf(expectedValue);
        String matcher = string(check.get("matcher"), "exact").toLowerCase(Locale.ROOT);
        switch (matcher) {
            case "exact":
                return new Match(actual.equals(expected), actual.equals(expected) ? "Text matches exactly." : "Expected exact text " + quote(expected) + " but received " + quote(actual) + ".");
            case "contains":
                return new Match(actual.contains(expected), actual.contains(expected) ? "Expected text was found." : "Output does not contain " + quote(expected) + ".");
            case "regex":
                try {
                    int flags = 0;
                    Object flagsValue = check.get("flags");
                    List<String> flagNames = flagsValue instanceof List ? strings(flagsValue) : List.of(string(flagsValue, ""));
                    for (String flag : flagNames) {
                        switch (flag.toLowerCase(Locale.ROOT)) {
                            case "i": case "case_insensitive": case "case-insensitive": flags |= Pattern.CASE_INSENSITIVE | Pattern.UNICODE_CASE; break;
                            case "m": case "multiline": flags |= Pattern.MULTILINE; break;
                            case "s": case "dotall": flags |= Pattern.DOTALL; break;
                            case "u": case "unicode_case": flags |= Pattern.UNICODE_CASE; break;
                            case "": break;
                            default: return new Match(false, "Unknown regex flag: " + flag);
                        }
                    }
                    java.util.regex.Matcher compiled = Pattern.compile(expected, flags).matcher(actual);
                    boolean full = Boolean.TRUE.equals(check.get("fullMatch"));
                    boolean passed = full ? compiled.matches() : compiled.find();
                    return new Match(passed, passed ? "Regular expression matched." : "The output did not match the regular expression " + quote(expected) + ".");
                } catch (PatternSyntaxException error) {
                    return new Match(false, "Invalid regular expression: " + error.getDescription());
                }
            default:
                return new Match(false, "Unsupported matcher: " + matcher);
        }
    }

    private static Object instantiate(Class<?> type, Map<String, Object> spec, ClassLoader loader) throws Exception {
        if (spec == null || spec.isEmpty()) return type.getDeclaredConstructor().newInstance();
        Class<?>[] parameterTypes = parameterTypes(spec.get("parameterTypes"), loader);
        Constructor<?> constructor = type.getDeclaredConstructor(parameterTypes);
        constructor.setAccessible(true);
        return constructor.newInstance(convertArgs(spec.get("args"), parameterTypes, loader));
    }

    private static Class<?>[] parameterTypes(Object value, ClassLoader loader) throws ClassNotFoundException {
        List<String> names = strings(value);
        Class<?>[] result = new Class<?>[names.size()];
        for (int i = 0; i < names.size(); i++) result[i] = resolveType(names.get(i), loader);
        return result;
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
            default: return Class.forName(name, true, loader);
        }
    }

    private static Object[] convertArgs(Object raw, Class<?>[] types, ClassLoader loader) throws Exception {
        List<Object> values = raw instanceof List ? (List<Object>) raw : Collections.emptyList();
        if (values.size() != types.length) throw new IllegalArgumentException("Expected " + types.length + " arguments but received " + values.size() + ".");
        Object[] result = new Object[types.length];
        for (int i = 0; i < types.length; i++) result[i] = convert(values.get(i), types[i], loader);
        return result;
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
            return Boolean.parseBoolean(String.valueOf(value));
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
        return value;
    }

    private static ProgramCapture invokeMain(String mainClass, ClassLoader loader, String input) {
        InputStream originalIn = System.in;
        PrintStream originalOut = System.out;
        PrintStream originalErr = System.err;
        ByteArrayOutputStream out = new ByteArrayOutputStream();
        ByteArrayOutputStream err = new ByteArrayOutputStream();
        Map<String, Object> failure = null;
        try (PrintStream outStream = new PrintStream(out, true, "UTF-8");
             PrintStream errStream = new PrintStream(err, true, "UTF-8")) {
            System.setIn(new ByteArrayInputStream(input.getBytes(StandardCharsets.UTF_8)));
            System.setOut(outStream);
            System.setErr(errStream);
            Class<?> mainType = Class.forName(mainClass, true, loader);
            Method main = mainType.getMethod("main", String[].class);
            if (!Modifier.isStatic(main.getModifiers())) throw new NoSuchMethodException("main(String[]) must be static.");
            main.invoke(null, (Object) new String[0]);
        } catch (Throwable error) {
            Throwable cause = error instanceof InvocationTargetException && ((InvocationTargetException) error).getCause() != null
                    ? ((InvocationTargetException) error).getCause() : error;
            failure = exceptionInfo(cause);
        } finally {
            System.setIn(originalIn);
            System.setOut(originalOut);
            System.setErr(originalErr);
        }
        return new ProgramCapture(out.toString(StandardCharsets.UTF_8), err.toString(StandardCharsets.UTF_8), failure);
    }

    private static URLClassLoader newClassLoader(Path classesDir) throws Exception {
        URL url = classesDir.toUri().toURL();
        return new URLClassLoader(new URL[]{url}, ExerciseRunner.class.getClassLoader());
    }

    private static Map<String, Object> exceptionInfo(Throwable error) {
        Map<String, Object> info = new LinkedHashMap<>();
        info.put("type", error.getClass().getName());
        info.put("message", safeMessage(error));
        StackTraceElement[] stack = error.getStackTrace();
        List<String> frames = new ArrayList<>();
        for (int i = 0; i < Math.min(stack.length, 8); i++) frames.add(stack[i].toString());
        info.put("stack", frames);
        return info;
    }

    private static Map<String, Object> failure(String message) {
        Map<String, Object> result = baseResult();
        result.put("success", false);
        result.put("status", "error");
        result.put("exitCode", 1);
        result.put("error", message);
        return result;
    }

    private static Map<String, Object> baseResult() {
        Map<String, Object> result = new LinkedHashMap<>();
        result.put("success", false);
        result.put("compiled", false);
        result.put("exitCode", 1);
        result.put("stdout", "");
        result.put("stderr", "");
        result.put("executionTimeMs", 0);
        return result;
    }

    private static Map<String, Object> diagnostic(String kind, String file, long line, long column, String message) {
        Map<String, Object> item = new LinkedHashMap<>();
        item.put("kind", kind);
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
    private static String quote(String value) { return "\"" + value.replace("\\", "\\\\").replace("\n", "\\n").replace("\r", "\\r").replace("\"", "\\\"") + "\""; }

    @SuppressWarnings("unchecked")
    private static Map<String, Object> asMap(Object value) { return value instanceof Map ? (Map<String, Object>) value : new LinkedHashMap<>(); }
    @SuppressWarnings("unchecked")
    private static List<Map<String, Object>> maps(Object value) {
        if (!(value instanceof List)) return Collections.emptyList();
        List<Map<String, Object>> result = new ArrayList<>();
        for (Object item : (List<?>) value) if (item instanceof Map) result.add((Map<String, Object>) item);
        return result;
    }
    private static List<String> strings(Object value) {
        if (value == null) return Collections.emptyList();
        if (value instanceof List) {
            List<String> result = new ArrayList<>();
            for (Object item : (List<?>) value) result.add(String.valueOf(item));
            return result;
        }
        String one = String.valueOf(value);
        return one.isEmpty() ? Collections.emptyList() : List.of(one);
    }

    private static boolean valuesEqual(Object actual, Object expected) {
        if (actual == null || expected == null) return actual == expected;
        if (actual instanceof Number && expected instanceof Number) {
            try { return new BigDecimal(actual.toString()).compareTo(new BigDecimal(expected.toString())) == 0; }
            catch (NumberFormatException ignored) { return Double.compare(((Number) actual).doubleValue(), ((Number) expected).doubleValue()) == 0; }
        }
        if (actual instanceof Character) return String.valueOf(actual).equals(String.valueOf(expected));
        return actual.equals(expected) || String.valueOf(actual).equals(String.valueOf(expected));
    }

    private static void deleteTree(Path path) throws IOException {
        if (!Files.exists(path)) return;
        try (java.util.stream.Stream<Path> stream = Files.walk(path)) {
            stream.sorted((a, b) -> b.compareTo(a)).forEach(item -> {
                try { Files.deleteIfExists(item); } catch (IOException error) { throw new RuntimeException(error); }
            });
        }
    }

    private static final class MemorySource extends SimpleJavaFileObject {
        private final String source;
        MemorySource(String name, String source) {
            super(URI.create("string:///" + name.replace('\\', '/')), Kind.SOURCE);
            this.source = source;
        }
        @Override public CharSequence getCharContent(boolean ignoreEncodingErrors) { return source; }
    }

    private static final class ProgramCapture {
        final String stdout, stderr;
        final Map<String, Object> exception;
        ProgramCapture(String stdout, String stderr, Map<String, Object> exception) {
            this.stdout = stdout; this.stderr = stderr; this.exception = exception;
        }
    }

    private static final class CheckOutcome {
        final boolean passed;
        final String feedback;
        final Object actual;
        final String stdout, stderr;
        CheckOutcome(boolean passed, String feedback, Object actual, String stdout, String stderr) {
            this.passed = passed; this.feedback = feedback; this.actual = actual; this.stdout = stdout; this.stderr = stderr;
        }
        static CheckOutcome pass(Object actual) { return new CheckOutcome(true, "Passed.", actual, null, null); }
        static CheckOutcome fail(String feedback, Object actual) { return new CheckOutcome(false, feedback, actual, null, null); }
        static CheckOutcome fail(String feedback, Object actual, String stdout, String stderr) { return new CheckOutcome(false, feedback, actual, stdout, stderr); }
    }

    private static final class Match {
        final boolean passed; final String feedback;
        Match(boolean passed, String feedback) { this.passed = passed; this.feedback = feedback; }
    }

    /** Minimal JSON parser/serializer; keeps the runner dependency-free. */
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
            if (value instanceof Number || value instanceof Boolean) { out.append(value); return; }
            if (value instanceof Map) {
                out.append('{'); boolean first = true;
                for (Object entryObject : ((Map<?, ?>) value).entrySet()) {
                    Map.Entry<?, ?> entry = (Map.Entry<?, ?>) entryObject;
                    if (!first) out.append(','); first = false;
                    quoteJson(String.valueOf(entry.getKey()), out); out.append(':'); write(entry.getValue(), out);
                }
                out.append('}'); return;
            }
            if (value instanceof Iterable) {
                out.append('['); boolean first = true;
                for (Object item : (Iterable<?>) value) { if (!first) out.append(','); first = false; write(item, out); }
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
                    default: if (ch < 0x20) out.append(String.format("\\u%04x", (int) ch)); else out.append(ch);
                }
            }
            out.append('"');
        }
        private static final class Parser {
            final String text; int at;
            Parser(String text) { this.text = text == null ? "" : text; }
            Object parse() { Object value = value(); whitespace(); if (at != text.length()) throw error("Unexpected trailing content"); return value; }
            Object value() {
                whitespace(); if (at >= text.length()) throw error("Unexpected end of JSON");
                char ch = text.charAt(at);
                if (ch == '{') return object(); if (ch == '[') return array(); if (ch == '"') return string();
                if (ch == 't') { literal("true"); return Boolean.TRUE; }
                if (ch == 'f') { literal("false"); return Boolean.FALSE; }
                if (ch == 'n') { literal("null"); return null; }
                return number();
            }
            Map<String, Object> object() {
                Map<String, Object> map = new LinkedHashMap<>(); at++; whitespace();
                if (take('}')) return map;
                while (true) { whitespace(); if (at >= text.length() || text.charAt(at) != '"') throw error("Expected object key"); String key = string(); whitespace(); require(':'); map.put(key, value()); whitespace(); if (take('}')) return map; require(','); }
            }
            List<Object> array() {
                List<Object> list = new ArrayList<>(); at++; whitespace(); if (take(']')) return list;
                while (true) { list.add(value()); whitespace(); if (take(']')) return list; require(','); }
            }
            String string() {
                require('"'); StringBuilder out = new StringBuilder();
                while (at < text.length()) {
                    char ch = text.charAt(at++); if (ch == '"') return out.toString();
                    if (ch == '\\') {
                        if (at >= text.length()) throw error("Unfinished escape"); char esc = text.charAt(at++);
                        switch (esc) {
                            case '"': out.append('"'); break; case '\\': out.append('\\'); break; case '/': out.append('/'); break;
                            case 'b': out.append('\b'); break; case 'f': out.append('\f'); break; case 'n': out.append('\n'); break; case 'r': out.append('\r'); break; case 't': out.append('\t'); break;
                            case 'u': if (at + 4 > text.length()) throw error("Invalid unicode escape"); out.append((char) Integer.parseInt(text.substring(at, at + 4), 16)); at += 4; break;
                            default: throw error("Invalid escape: " + esc);
                        }
                    } else out.append(ch);
                }
                throw error("Unterminated string");
            }
            Number number() {
                int start = at; if (take('-')) { } while (at < text.length() && Character.isDigit(text.charAt(at))) at++;
                if (take('.')) while (at < text.length() && Character.isDigit(text.charAt(at))) at++;
                if (at < text.length() && (text.charAt(at) == 'e' || text.charAt(at) == 'E')) { at++; if (at < text.length() && (text.charAt(at) == '+' || text.charAt(at) == '-')) at++; while (at < text.length() && Character.isDigit(text.charAt(at))) at++; }
                if (start == at) throw error("Expected value");
                BigDecimal parsed = new BigDecimal(text.substring(start, at));
                return parsed;
            }
            void literal(String expected) { if (!text.startsWith(expected, at)) throw error("Expected " + expected); at += expected.length(); }
            void whitespace() { while (at < text.length() && Character.isWhitespace(text.charAt(at))) at++; }
            boolean take(char ch) { if (at < text.length() && text.charAt(at) == ch) { at++; return true; } return false; }
            void require(char ch) { if (!take(ch)) throw error("Expected '" + ch + "'"); }
            IllegalArgumentException error(String message) { return new IllegalArgumentException(message + " at JSON offset " + at); }
        }
    }
}
