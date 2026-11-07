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

import javax.tools.Diagnostic;
import javax.tools.DiagnosticCollector;
import javax.tools.JavaCompiler;
import javax.tools.JavaFileObject;
import javax.tools.SimpleJavaFileObject;
import javax.tools.StandardJavaFileManager;
import javax.tools.ToolProvider;

/**
 * Dependency-free Java exercise compiler and grader.
 *
 * Commands (five arguments are always required):
 *   compile <sources.json> <config.json> <result.json> <classes-dir>
 *   run     -             <config.json> <result.json> <classes-dir>
 *   check   -             <config.json> <result.json> <classes-dir>
 *   cleanup -             -            -            <classes-dir>
 *
 * JSON paths may be paths in the host filesystem or a browser virtual filesystem.
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
                    Map<String, Object> sourcesDoc = asMap(Json.parse(Files.readString(sourcesPath, StandardCharsets.UTF_8)));
                    result = compile(sourcesDoc, classesDir);
                    break;
                }
                case "run":
                    result = runProgram(config, classesDir);
                    break;
                case "check":
                    result = grade(config, classesDir);
                    break;
                default:
                    result = failure("Unknown runner operation: " + operation);
            }
        } catch (Throwable error) {
            result = failure(safeMessage(error));
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

    private static Map<String, Object> compile(Map<String, Object> sourcesDoc, Path classesDir) {
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
                    result.put("compiled", false);
                    result.put("success", false);
                    result.put("exitCode", 1);
                    return result;
                }
                units.add(new MemorySource(name, code));
            }

            try (StandardJavaFileManager manager = compiler.getStandardFileManager(collector, Locale.ROOT, StandardCharsets.UTF_8)) {
                List<String> options = Arrays.asList("-proc:none", "--release", "21", "-encoding", "UTF-8", "-d", classesDir.toString());
                boolean ok = Boolean.TRUE.equals(compiler.getTask(null, manager, collector, options, null, units).call());
                List<Object> diagnostics = new ArrayList<>();
                for (Diagnostic<? extends JavaFileObject> item : collector.getDiagnostics()) {
                    String sourcePath = item.getSource() == null ? "" : item.getSource().toUri().getPath();
                    String sourceName = sourcePath.isEmpty() ? "" : sourcePath.substring(sourcePath.lastIndexOf('/') + 1);
                    diagnostics.add(diagnostic(item.getKind().name(), sourceName, item.getLineNumber(), item.getColumnNumber(), item.getMessage(Locale.ROOT)));
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
        double total = 0d, earned = 0d;
        String lastStdout = "", lastStderr = "";
        boolean allPassed = true;

        for (int index = 0; index < checks.size(); index++) {
            Map<String, Object> check = checks.get(index);
            double points = number(check.get("points"), 1d);
            total += points;
            String id = string(check.get("id"), "check-" + (index + 1));
            Map<String, Object> checkResult = new LinkedHashMap<>();
            checkResult.put("id", id);
            checkResult.put("description", string(check.get("description"), id));
            checkResult.put("points", points);
            checkResult.put("pointsEarned", 0d);

            try (URLClassLoader loader = newClassLoader(classesDir)) {
                CheckOutcome outcome = evaluate(check, loader);
                if (outcome.stdout != null) lastStdout = outcome.stdout;
                if (outcome.stderr != null) lastStderr = outcome.stderr;
                checkResult.put("passed", outcome.passed);
                checkResult.put("feedback", outcome.feedback == null
                        ? (outcome.passed ? "Passed." : "The check did not match the expected result.")
                        : outcome.feedback);
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
        Map<String, Object> score = new LinkedHashMap<>();
        score.put("earned", earned);
        score.put("total", total);
        result.put("score", score);
        result.put("stdout", lastStdout);
        result.put("stderr", lastStderr);
        result.put("success", allPassed && !checks.isEmpty());
        result.put("status", "graded");
        result.put("exitCode", allPassed && !checks.isEmpty() ? 0 : 1);
        result.put("executionTimeMs", elapsedMs(start));
        return result;
    }

    private static CheckOutcome evaluate(Map<String, Object> check, ClassLoader loader) throws Exception {
        String checkType = string(check.get("type"), "");
        String className = string(check.get("className"), string(check.get("mainClass"), "Main"));
        switch (checkType) {
            case "stdout":
            case "stderr": {
                ProgramCapture capture = invokeMain(className, loader, string(check.get("input"), ""));
                String actual = "stderr".equals(checkType) ? capture.stderr : capture.stdout;
                if (capture.exception != null) {
                    return CheckOutcome.fail("Program threw " + string(capture.exception.get("type"), "an exception") + ": "
                            + string(capture.exception.get("message"), ""), actual, capture.stdout, capture.stderr);
                }
                Match match = match(actual, check.get("expected"), check);
                return new CheckOutcome(match.passed, match.feedback, actual, capture.stdout, capture.stderr);
            }
            case "classExists": {
                Class<?> type = Class.forName(className, false, loader);
                return CheckOutcome.pass(type.getName());
            }
            case "fieldExists": {
                Class<?> type = Class.forName(className, false, loader);
                Field field = type.getDeclaredField(string(check.get("fieldName"), ""));
                String expectedType = string(check.get("expectedType"), "");
                if (!expectedType.isEmpty() && !field.getType().getName().equals(expectedType)) {
                    return CheckOutcome.fail("Field exists, but its type is " + field.getType().getName() + " instead of " + expectedType + ".", field.getType().getName());
                }
                return CheckOutcome.pass(field.getName());
            }
            case "fieldModifier": {
                Class<?> type = Class.forName(className, false, loader);
                Field field = type.getDeclaredField(string(check.get("fieldName"), ""));
                return modifierOutcome(field.getModifiers(), check.get("expected"), "Field " + field.getName());
            }
            case "fieldValue": {
                Class<?> type = Class.forName(className, false, loader);
                Field field = type.getDeclaredField(string(check.get("fieldName"), ""));
                field.setAccessible(true);
                Object instance = Modifier.isStatic(field.getModifiers()) ? null : instantiate(type, asMap(check.get("constructor")), loader);
                return compareValue(field.get(instance), check.get("expected"), check);
            }
            case "methodExists": {
                Class<?> type = Class.forName(className, false, loader);
                Method method = type.getDeclaredMethod(string(check.get("method"), ""), parameterTypes(check.get("parameterTypes"), loader));
                return CheckOutcome.pass(method.getName());
            }
            case "methodModifier": {
                Class<?> type = Class.forName(className, false, loader);
                Method method = type.getDeclaredMethod(string(check.get("method"), ""), parameterTypes(check.get("parameterTypes"), loader));
                return modifierOutcome(method.getModifiers(), check.get("expected"), "Method " + method.getName());
            }
            case "constructorExists": {
                Class<?> type = Class.forName(className, false, loader);
                Constructor<?> constructor = type.getDeclaredConstructor(parameterTypes(check.get("parameterTypes"), loader));
                return check.containsKey("expected")
                        ? modifierOutcome(constructor.getModifiers(), check.get("expected"), "Constructor")
                        : CheckOutcome.pass(constructor.toString());
            }
            case "classModifier": {
                Class<?> type = Class.forName(className, false, loader);
                return modifierOutcome(type.getModifiers(), check.get("expected"), "Class " + className);
            }
            case "inheritance": {
                Class<?> type = Class.forName(className, false, loader);
                String expectedSuper = string(check.get("superclass"), string(check.get("expected"), ""));
                if (!expectedSuper.isEmpty()) {
                    Class<?> parent = type.getSuperclass();
                    String actual = parent == null ? "" : parent.getName();
                    if (!actual.equals(expectedSuper)) {
                        return CheckOutcome.fail("Expected superclass " + expectedSuper + ", found " + (actual.isEmpty() ? "none" : actual) + ".", actual);
                    }
                }
                List<String> expectedInterfaces = strings(check.get("interfaces"));
                Set<String> actualInterfaces = new LinkedHashSet<>();
                for (Class<?> item : type.getInterfaces()) actualInterfaces.add(item.getName());
                for (String expected : expectedInterfaces) {
                    if (!actualInterfaces.contains(expected)) return CheckOutcome.fail("Expected implemented interface " + expected + " was not found.", actualInterfaces.toString());
                }
                Class<?> parent = type.getSuperclass();
                return CheckOutcome.pass(parent == null ? "" : parent.getName());
            }
            case "instanceOf": {
                Class<?> type = Class.forName(className, false, loader);
                Object instance = instantiate(type, asMap(check.get("constructor")), loader);
                String targetName = string(check.get("expectedType"), string(check.get("expected"), ""));
                Class<?> target = resolveType(targetName, loader);
                boolean passed = target.isInstance(instance);
                return new CheckOutcome(passed, passed ? "Instance has the expected type." : "Expected an instance of " + targetName + ".", instance.getClass().getName(), null, null);
            }
            case "methodReturn": {
                Class<?> type = Class.forName(className, false, loader);
                Method method = type.getDeclaredMethod(string(check.get("method"), ""), parameterTypes(check.get("parameterTypes"), loader));
                method.setAccessible(true);
                Object instance = null;
                if (!Modifier.isStatic(method.getModifiers())) {
                    if (Modifier.isAbstract(type.getModifiers()) || type.isInterface()) {
                        return CheckOutcome.fail("Cannot invoke an instance method on an abstract class or interface without a concrete instance.", null);
                    }
                    instance = instantiate(type, asMap(check.get("constructor")), loader);
                }
                Object actual;
                try {
                    actual = method.invoke(Modifier.isStatic(method.getModifiers()) ? null : instance,
                            convertArgs(check.get("args"), method.getParameterTypes(), loader));
                } catch (InvocationTargetException error) {
                    Throwable cause = error.getCause() == null ? error : error.getCause();
                    return CheckOutcome.fail("Method threw " + cause.getClass().getSimpleName() + ": " + safeMessage(cause), exceptionInfo(cause));
                }
                return compareValue(actual, check.get("expected"), check);
            }
            default:
                return CheckOutcome.fail("Unsupported check type: " + checkType, null);
        }
    }

    private static CheckOutcome modifierOutcome(int modifiers, Object expected, String label) {
        List<String> wanted = expected instanceof List<?> ? strings(expected) : List.of(string(expected, ""));
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
                case "default": present = false; break; // Interface default methods are not represented by a modifier bit.
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
                return new Match(actual.equals(expected), actual.equals(expected)
                        ? "Text matches exactly." : "Expected exact text " + quote(expected) + " but received " + quote(actual) + ".");
            case "contains":
                return new Match(actual.contains(expected), actual.contains(expected)
                        ? "Expected text was found." : "Output does not contain " + quote(expected) + ".");
            case "regex":
                try {
                    int flags = 0;
                    Object rawFlags = check.get("flags");
                    List<String> flagNames = rawFlags instanceof List<?> ? strings(rawFlags) : List.of(string(rawFlags, ""));
                    for (String flag : flagNames) {
                        switch (flag.toLowerCase(Locale.ROOT)) {
                            case "": break;
                            case "i":
                            case "case_insensitive":
                            case "case-insensitive": flags |= Pattern.CASE_INSENSITIVE | Pattern.UNICODE_CASE; break;
                            case "m":
                            case "multiline": flags |= Pattern.MULTILINE; break;
                            case "s":
                            case "dotall": flags |= Pattern.DOTALL; break;
                            case "u":
                            case "unicode_case": flags |= Pattern.UNICODE_CASE; break;
                            default: return new Match(false, "Unknown regex flag: " + flag);
                        }
                    }
                    boolean full = Boolean.TRUE.equals(check.get("fullMatch"));
                    boolean passed = full ? Pattern.compile(expected, flags).matcher(actual).matches()
                            : Pattern.compile(expected, flags).matcher(actual).find();
                    return new Match(passed, passed ? "Regular expression matched."
                            : "The output did not match the regular expression " + quote(expected) + ".");
                } catch (PatternSyntaxException error) {
                    return new Match(false, "Invalid regular expression: " + error.getDescription());
                }
            default:
                return new Match(false, "Unsupported matcher: " + matcher);
        }
    }

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
            Class<?> mainType = Class.forName(mainClass, true, loader);
            Method main = mainType.getMethod("main", String[].class);
            if (!Modifier.isStatic(main.getModifiers())) throw new NoSuchMethodException("main(String[]) must be static.");
            // Supports a public main method on a package-private launcher class.
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
            super(URI.create("string:///" + name.replace('\\', '/')), Kind.SOURCE);
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

    private static final class CheckOutcome {
        final boolean passed;
        final String feedback;
        final Object actual;
        final String stdout;
        final String stderr;
        CheckOutcome(boolean passed, String feedback, Object actual, String stdout, String stderr) {
            this.passed = passed; this.feedback = feedback; this.actual = actual; this.stdout = stdout; this.stderr = stderr;
        }
        static CheckOutcome pass(Object actual) { return new CheckOutcome(true, "Passed.", actual, null, null); }
        static CheckOutcome fail(String feedback, Object actual) { return new CheckOutcome(false, feedback, actual, null, null); }
        static CheckOutcome fail(String feedback, Object actual, String stdout, String stderr) { return new CheckOutcome(false, feedback, actual, stdout, stderr); }
    }

    private static final class Match {
        final boolean passed;
        final String feedback;
        Match(boolean passed, String feedback) { this.passed = passed; this.feedback = feedback; }
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
