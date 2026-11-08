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
import java.util.Objects;
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
 *
 * Regex generation is available through the nested
 * ExerciseRunner.RegexStringGenerator utility. Keeping it nested means the
 * entire runner and generator can be shipped as this one Java source file.
 */
public final class ExerciseRunner {
    private ExerciseRunner() { }

    /** Generate a string that matches a regular expression. */
    public static String generateFromRegex(String regex) {
        return RegexStringGenerator.generateFromRegex(regex);
    }

    /** Generate a string that matches a regular expression using custom limits. */
    public static String generateFromRegex(String regex, RegexStringGenerator.Options options) {
        return RegexStringGenerator.generateFromRegex(regex, options);
    }

    /** Generate a string that matches an already compiled Pattern. */
    public static String generateFromRegex(Pattern pattern) {
        return RegexStringGenerator.generateFromRegex(pattern);
    }

    /** Generate a string from an already compiled Pattern using custom options. */
    public static String generateFromRegex(Pattern pattern, RegexStringGenerator.Options options) {
        return RegexStringGenerator.generateFromRegex(pattern, options);
    }

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
                case "default": present = false; break;
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
                    Pattern compiled = Pattern.compile(expected, flags);
                    java.util.regex.Matcher regexMatcher = compiled.matcher(actual);
                    boolean passed = full ? regexMatcher.matches() : regexMatcher.find();
                    if (passed) {
                        return new Match(true, "Regular expression matched.");
                    }

                    // A mismatch is different from a parse error. Include the exact
                    // captured text so whitespace, prompts, BOMs and escape sequences
                    // are visible in grader feedback.
                    String preview = actual;
                    final int previewLimit = 1000;
                    if (preview.length() > previewLimit) {
                        preview = preview.substring(0, previewLimit) + "… (truncated)";
                    }
                    String mode = full ? "full match" : "substring search";

                    // Show a concrete example instead of exposing the regex syntax.
                    // Generate from the already-compiled Pattern so external flags
                    // from the check configuration are preserved as well.
                    String example = null;
                    try {
                        String candidate = RegexStringGenerator.generateFromRegex(
                                compiled, new RegexStringGenerator.Options().fullMatch(full));
                        java.util.regex.Matcher exampleMatcher = compiled.matcher(candidate);
                        boolean exampleMatches = full
                                ? exampleMatcher.matches()
                                : exampleMatcher.find();
                        if (exampleMatches) example = candidate;
                    } catch (RuntimeException ignored) {
                        // Some valid regexes cannot be solved by the bounded generator.
                        // In that case, still provide useful captured-output diagnostics.
                    }

                    String exampleText = example == null
                            ? "Expected output must satisfy the configured matching rule. "
                            : "For example, matching text could be:\n" + quote(example);

                    return new Match(false,
                            "The output did not match (" + mode + "). " + exampleText);
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

    public static final class RegexStringGenerator {
        private RegexStringGenerator() { }

        /**
         * Bounded, validation-driven sample generator for java.util.regex.Pattern.
         * It deliberately validates every generated sample with Pattern itself;
         * the parser below only proposes candidates and is not a replacement regex engine.
         */
        public static final class Options {
            public int maxAttempts = 512;
            public int maxLength = 100_000;
            public int maxRepeat = 6;
            public String lineSeparator = "\n";
            /** null = infer for String patterns / preserve Pattern flags. */
            public Boolean multiline = null;
            /** true uses Matcher.matches(); false uses Matcher.find(). */
            public boolean fullMatch = false;
            public boolean useBasicFallback = true;

            public Options() { }
            public Options maxAttempts(int value) {
                if (value < 1) throw new IllegalArgumentException("maxAttempts must be at least 1");
                maxAttempts = value; return this;
            }
            public Options maxLength(int value) {
                if (value < 1) throw new IllegalArgumentException("maxLength must be at least 1");
                maxLength = value; return this;
            }
            public Options maxRepeat(int value) {
                if (value < 0) throw new IllegalArgumentException("maxRepeat cannot be negative");
                maxRepeat = value; return this;
            }
            public Options lineSeparator(String value) {
                lineSeparator = Objects.requireNonNull(value, "lineSeparator"); return this;
            }
            public Options multiline(boolean value) { multiline = value; return this; }
            public Options fullMatch(boolean value) { fullMatch = value; return this; }
            public Options useBasicFallback(boolean value) { useBasicFallback = value; return this; }
        }

        public static String generateFromRegex(String regex) {
            return generateFromRegex(regex, new Options());
        }

        public static String generateFromRegex(String regex, Options options) {
            Objects.requireNonNull(regex, "regex");
            Options actual = options == null ? new Options() : options;
            int flags = 0;
            if (actual.multiline != null) {
                if (actual.multiline) flags |= Pattern.MULTILINE;
            } else if (looksLikeMultilineLookaround(regex)) {
                flags |= Pattern.MULTILINE;
            }
            return generate(regex, flags, actual);
        }

        public static String generateFromRegex(Pattern pattern) {
            return generateFromRegex(pattern, new Options());
        }

        public static String generateFromRegex(Pattern pattern, Options options) {
            Objects.requireNonNull(pattern, "pattern");
            Options actual = options == null ? new Options() : options;
            int flags = pattern.flags();
            if (actual.multiline != null) {
                if (actual.multiline) flags |= Pattern.MULTILINE;
                else flags &= ~Pattern.MULTILINE;
            }
            return generate(pattern.pattern(), flags, actual);
        }

        private static String generate(String source, int flags, Options options) {
            if ((flags & Pattern.LITERAL) != 0) {
                if (source.length() > options.maxLength) throw new IllegalArgumentException("Literal pattern exceeds maxLength");
                return source;
            }
            if (source.length() > Math.max(4096L, options.maxLength * 4L)) {
                throw new IllegalArgumentException("Regex source is too large");
            }
            final Pattern validator;
            try {
                validator = Pattern.compile(source, flags);
            } catch (PatternSyntaxException ex) {
                throw new IllegalArgumentException("Invalid Java regular expression: " + ex.getDescription(), ex);
            }

            // Fast path for exact lines required by positive lookaheads. This avoids
            // factorial searching for common file-list / multi-line constraint regexes.
            List<String> requiredLines = extractRequiredLines(source);
            if (!requiredLines.isEmpty()) {
                String lineCandidate = tryLineCandidates(requiredLines, validator, options);
                if (lineCandidate != null) return lineCandidate;
            }

            if (options.useBasicFallback) {
                Parser parser = new Parser(source, options.maxRepeat, (flags & Pattern.COMMENTS) != 0);
                Node root = parser.parse();
                Map<String, List<String>> sharedAtomSamples = new LinkedHashMap<>();
                for (int attempt = 0; attempt < options.maxAttempts; attempt++) {
                    GenerationContext context = new GenerationContext(flags, attempt, sharedAtomSamples);
                    String candidate = generateNode(root, attempt, context, options);
                    if (candidate.length() <= options.maxLength && matches(validator, candidate, options)) {
                        return candidate;
                    }

                    // Context variations are inexpensive and help with word boundaries,
                    // negative assertions, and lookarounds whose best sample needs padding.
                    String[] prefixes = {"a", "0", "_", " ", "\n", "!"};
                    String[] suffixes = {"a", "0", "_", " ", "\n", "!"};
                    for (int p = 0; p < prefixes.length; p++) {
                        String prefix = prefixes[(attempt + p) % prefixes.length];
                        String suffix = suffixes[(attempt * 3 + p) % suffixes.length];
                        String[] variants = {prefix + candidate, candidate + suffix, prefix + candidate + suffix};
                        for (String variant : variants) {
                            if (variant.length() <= options.maxLength && matches(validator, variant, options)) {
                                return variant;
                            }
                        }
                    }
                }
            }

            throw new IllegalArgumentException(
                    "Could not generate a matching sample within " + options.maxAttempts +
                    " attempts. The regex may be unsatisfiable or may require a search beyond the configured bounds.");
        }

        private static boolean matches(Pattern pattern, String candidate, Options options) {
            java.util.regex.Matcher matcher = pattern.matcher(candidate);
            return options.fullMatch ? matcher.matches() : matcher.find();
        }

        private static boolean looksLikeMultilineLookaround(String source) {
            boolean lookaround = source.contains("(?=") || source.contains("(?!") ||
                    source.contains("(?<=") || source.contains("(?<!");
            return lookaround && source.indexOf('^') >= 0 && source.indexOf('$') >= 0;
        }

        // ---------------------- Positive-lookahead line solver ----------------------

        private static String tryLineCandidates(List<String> required, Pattern validator, Options options) {
            List<String> lines = new ArrayList<>(new LinkedHashSet<>(required));
            if (lines.isEmpty()) return null;
            List<List<String>> candidates = new ArrayList<>();
            candidates.add(new ArrayList<>(lines));
            if (lines.size() > 1) {
                List<String> reversed = new ArrayList<>(lines);
                Collections.reverse(reversed);
                candidates.add(reversed);
                for (int shift = 1; shift < lines.size() && candidates.size() < options.maxAttempts; shift++) {
                    List<String> rotated = new ArrayList<>();
                    rotated.addAll(lines.subList(shift, lines.size()));
                    rotated.addAll(lines.subList(0, shift));
                    candidates.add(rotated);
                }
                if (lines.size() <= 9 && candidates.size() < options.maxAttempts) {
                    addPermutations(new ArrayList<>(lines), 0, candidates, options.maxAttempts);
                }
            }
            Set<String> seen = new LinkedHashSet<>();
            for (List<String> order : candidates) {
                if (seen.size() >= options.maxAttempts) break;
                String candidate = String.join(options.lineSeparator, order);
                if (seen.add(candidate) && candidate.length() <= options.maxLength && matches(validator, candidate, options)) {
                    return candidate;
                }
            }
            return null;
        }

        private static void addPermutations(List<String> values, int index,
                                            List<List<String>> output, int limit) {
            if (output.size() >= limit) return;
            if (index == values.size()) { output.add(new ArrayList<>(values)); return; }
            for (int i = index; i < values.size() && output.size() < limit; i++) {
                Collections.swap(values, index, i);
                addPermutations(values, index + 1, output, limit);
                Collections.swap(values, index, i);
            }
        }

        private static List<String> extractRequiredLines(String source) {
            List<String> result = new ArrayList<>();
            scanForPositiveLookaheads(source, 0, source.length(), result);
            return new ArrayList<>(new LinkedHashSet<>(result));
        }

        private static void scanForPositiveLookaheads(String text, int from, int to, List<String> output) {
            for (int i = from; i < to; i++) {
                char c = text.charAt(i);
                if (c == '\\') { i++; continue; }
                if (c == '[') { i = skipCharacterClass(text, i, to); continue; }
                if (c != '(') continue;
                Group group = inspectGroup(text, i, to);
                if (group.kind == GroupKind.POSITIVE_LOOKAHEAD) {
                    extractLinesFromAssertion(text, group.bodyStart, group.close, output);
                    scanForPositiveLookaheads(text, group.bodyStart, group.close, output);
                } else if (group.kind == GroupKind.GROUP) {
                    scanForPositiveLookaheads(text, group.bodyStart, group.close, output);
                }
                i = group.close;
            }
        }

        private static void extractLinesFromAssertion(String text, int from, int to, List<String> output) {
            for (int i = from; i < to; i++) {
                char c = text.charAt(i);
                if (c == '\\') { i++; continue; }
                if (c == '[') { i = skipCharacterClass(text, i, to); continue; }
                if (c != '(') {
                    if (c == '^') {
                        LiteralLine literal = readLiteralLine(text, i + 1, to);
                        if (literal != null) { output.add(literal.value); i = literal.end; }
                    }
                    continue;
                }
                Group group = inspectGroup(text, i, to);
                if (group.kind == GroupKind.GROUP || group.kind == GroupKind.POSITIVE_LOOKAHEAD) {
                    extractLinesFromAssertion(text, group.bodyStart, group.close, output);
                }
                i = group.close;
            }
        }

        private static LiteralLine readLiteralLine(String text, int start, int limit) {
            StringBuilder value = new StringBuilder();
            for (int i = start; i < limit; i++) {
                char c = text.charAt(i);
                if (c == '$') return value.length() == 0 ? null : new LiteralLine(value.toString(), i);
                if (c == '\\') {
                    if (++i >= limit) return null;
                    char escaped = text.charAt(i);
                    Character decoded = decodeLiteralEscape(text, escaped, i, limit);
                    if (decoded == null) return null;
                    value.append(decoded.charValue());
                    if (escaped == 'x') i += 2;
                    else if (escaped == 'u') i += 4;
                    continue;
                }
                if (".*+?{}[]()|^".indexOf(c) >= 0) return null;
                value.append(c);
            }
            return null;
        }

        private static Character decodeLiteralEscape(String text, char escaped, int at, int limit) {
            switch (escaped) {
                case 't': return '\t';
                case 'f': return '\f';
                case 'v': return '\u000B';
                case 'x':
                    if (at + 2 >= limit) return null;
                    try { return (char) Integer.parseInt(text.substring(at + 1, at + 3), 16); }
                    catch (NumberFormatException ex) { return null; }
                case 'u':
                    if (at + 4 >= limit) return null;
                    try { return (char) Integer.parseInt(text.substring(at + 1, at + 5), 16); }
                    catch (NumberFormatException ex) { return null; }
                case 'n': case 'r': return null;
                default: return Character.isLetterOrDigit(escaped) ? null : escaped;
            }
        }

        private static int skipCharacterClass(String text, int start, int limit) {
            boolean escaped = false;
            int depth = 1;
            for (int i = start + 1; i < limit; i++) {
                char c = text.charAt(i);
                if (escaped) { escaped = false; continue; }
                if (c == '\\') { escaped = true; continue; }
                if (c == '[') depth++;
                else if (c == ']' && --depth == 0) return i;
            }
            throw new IllegalArgumentException("Unclosed character class at position " + start);
        }

        private enum GroupKind { GROUP, POSITIVE_LOOKAHEAD, NEGATIVE_LOOKAHEAD,
            POSITIVE_LOOKBEHIND, NEGATIVE_LOOKBEHIND }
        private static final class Group {
            final GroupKind kind; final int bodyStart; final int close;
            Group(GroupKind kind, int bodyStart, int close) {
                this.kind = kind; this.bodyStart = bodyStart; this.close = close;
            }
        }

        private static Group inspectGroup(String text, int start, int limit) {
            GroupKind kind = GroupKind.GROUP;
            int bodyStart = start + 1;
            if (text.startsWith("(?=", start)) { kind = GroupKind.POSITIVE_LOOKAHEAD; bodyStart = start + 3; }
            else if (text.startsWith("(?!", start)) { kind = GroupKind.NEGATIVE_LOOKAHEAD; bodyStart = start + 3; }
            else if (text.startsWith("(?<=", start)) { kind = GroupKind.POSITIVE_LOOKBEHIND; bodyStart = start + 4; }
            else if (text.startsWith("(?<!", start)) { kind = GroupKind.NEGATIVE_LOOKBEHIND; bodyStart = start + 4; }
            else if (text.startsWith("(?:", start) || text.startsWith("(?>", start)) { bodyStart = start + 3; }
            else if (text.startsWith("(?<", start)) {
                int nameEnd = text.indexOf('>', start + 3);
                if (nameEnd >= 0 && nameEnd < limit) bodyStart = nameEnd + 1;
            } else if (text.startsWith("(?", start)) {
                int p = start + 2;
                while (p < limit && (Character.isLetter(text.charAt(p)) || text.charAt(p) == '-')) p++;
                bodyStart = p < limit && text.charAt(p) == ':' ? p + 1 : p + 1;
            }
            return new Group(kind, bodyStart, findGroupClose(text, start, limit));
        }

        private static int findGroupClose(String text, int start, int limit) {
            int depth = 0; boolean escaped = false;
            for (int i = start; i < limit; i++) {
                char c = text.charAt(i);
                if (escaped) { escaped = false; continue; }
                if (c == '\\') { escaped = true; continue; }
                if (c == '[') { i = skipCharacterClass(text, i, limit); continue; }
                if (c == '(') depth++;
                else if (c == ')' && --depth == 0) return i;
            }
            throw new IllegalArgumentException("Unclosed group at position " + start);
        }

        private static final class LiteralLine {
            final String value; final int end;
            LiteralLine(String value, int end) { this.value = value; this.end = end; }
        }

        // ------------------------- Candidate AST and parser -------------------------

        private interface Node { }
        private static final class Empty implements Node { }
        private static final class Literal implements Node {
            final String value; Literal(String value) { this.value = value; }
        }
        /** regexFragment is compiled as a standalone Java regex atom/predicate. */
        private static final class Atom implements Node {
            final String regexFragment; Atom(String regexFragment) { this.regexFragment = regexFragment; }
        }
        private static final class Sequence implements Node {
            final List<Node> nodes; Sequence(List<Node> nodes) { this.nodes = nodes; }
        }
        private static final class Alternative implements Node {
            final List<Node> alternatives; Alternative(List<Node> alternatives) { this.alternatives = alternatives; }
        }
        private static final class Repeat implements Node {
            final Node node; final int min; final int max;
            Repeat(Node node, int min, int max) { this.node = node; this.min = min; this.max = max; }
        }
        private enum AssertionKind { POSITIVE_AHEAD, NEGATIVE_AHEAD, POSITIVE_BEHIND, NEGATIVE_BEHIND }
        private static final class Assertion implements Node {
            final AssertionKind kind; final Node node;
            Assertion(AssertionKind kind, Node node) { this.kind = kind; this.node = node; }
        }
        private static final class Capture implements Node {
            final int index; final String name; final Node node;
            Capture(int index, String name, Node node) { this.index = index; this.name = name; this.node = node; }
        }
        private static final class BackReference implements Node {
            final Integer index; final String name;
            BackReference(Integer index, String name) { this.index = index; this.name = name; }
        }
        private static final class Boundary implements Node {
            final boolean wordBoundary; Boundary(boolean wordBoundary) { this.wordBoundary = wordBoundary; }
        }

        private static final class Parser {
            private final String source;
            private final int maxRepeat;
            private int pos;
            private int nextGroup = 1;
            private boolean comments;

            Parser(String source, int maxRepeat, boolean comments) {
                this.source = source; this.maxRepeat = maxRepeat; this.comments = comments;
            }

            Node parse() {
                Node root = expression();
                if (pos != source.length()) throw new IllegalArgumentException("Unsupported regex syntax at position " + pos);
                return root;
            }

            private char peek() { return pos < source.length() ? source.charAt(pos) : '\0'; }
            private char take() { return pos < source.length() ? source.charAt(pos++) : '\0'; }

            private void skipIgnored() {
                if (!comments) return;
                while (pos < source.length()) {
                    char c = source.charAt(pos);
                    if (Character.isWhitespace(c)) { pos++; continue; }
                    if (c == '#') {
                        while (pos < source.length() && source.charAt(pos) != '\n' && source.charAt(pos) != '\r') pos++;
                        continue;
                    }
                    break;
                }
            }

            private Node expression() {
                List<Node> alternatives = new ArrayList<>();
                alternatives.add(sequence());
                skipIgnored();
                while (peek() == '|') { take(); alternatives.add(sequence()); skipIgnored(); }
                return alternatives.size() == 1 ? alternatives.get(0) : new Alternative(alternatives);
            }

            private Node sequence() {
                List<Node> nodes = new ArrayList<>();
                skipIgnored();
                while (pos < source.length() && peek() != ')' && peek() != '|') {
                    nodes.add(quantified());
                    skipIgnored();
                }
                return new Sequence(nodes);
            }

            private Node quantified() {
                Node node = atom();
                skipIgnored();
                int min = 1, max = 1;
                char q = peek();
                if (q == '*') { take(); min = 0; max = maxRepeat; }
                else if (q == '+') { take(); min = 1; max = Math.max(1, maxRepeat); }
                else if (q == '?') { take(); min = 0; max = 1; }
                else if (q == '{') {
                    int saved = pos;
                    take();
                    String lower = digits();
                    if (!lower.isEmpty()) {
                        try { min = Integer.parseInt(lower); }
                        catch (NumberFormatException ex) { throw new IllegalArgumentException("Quantifier is too large", ex); }
                        max = min;
                        if (peek() == ',') {
                            take(); String upper = digits();
                            if (upper.isEmpty()) max = Math.max(min, maxRepeat);
                            else {
                                try { max = Math.max(min, Math.min(Integer.parseInt(upper), Math.max(min, maxRepeat))); }
                                catch (NumberFormatException ex) { throw new IllegalArgumentException("Quantifier is too large", ex); }
                            }
                        }
                        if (take() != '}') throw new IllegalArgumentException("Invalid quantifier at position " + saved);
                    } else pos = saved;
                }
                if (min != 1 || max != 1) node = new Repeat(node, min, max);
                // Lazy and possessive suffixes affect backtracking, not sample validity.
                if (peek() == '?' || peek() == '+') take();
                return node;
            }

            private String digits() {
                StringBuilder out = new StringBuilder();
                while (Character.isDigit(peek())) out.append(take());
                return out.toString();
            }

            private Node atom() {
                skipIgnored();
                char c = take();
                if (c == '\0') throw new IllegalArgumentException("Unexpected end of regex");
                if (c == '^' || c == '$') return new Empty();
                if (c == '.') return new Atom(".");
                if (c == '[') return characterClass();
                if (c == '\\') return escaped();
                if (c == '(') return group();
                return new Literal(String.valueOf(c));
            }

            private Node characterClass() {
                int start = pos - 1;
                int end = skipCharacterClass(source, start, source.length());
                String raw = source.substring(start, end + 1);
                pos = end + 1;
                return new Atom(raw);
            }

            private Node escaped() {
                char e = take();
                if (e == '\0') throw new IllegalArgumentException("Incomplete escape");
                switch (e) {
                    case 'n': return new Literal("\n");
                    case 'r': return new Literal("\r");
                    case 't': return new Literal("\t");
                    case 'f': return new Literal("\f");
                    case 'a': return new Literal("\u0007");
                    case 'e': return new Literal("\u001B");
                    case 'b': return new Boundary(true);
                    case 'B': return new Boundary(false);
                    case 'A': case 'G': case 'Z': case 'z': return new Empty();
                    case 'd': case 'D': case 's': case 'S': case 'w': case 'W':
                    case 'h': case 'H': case 'v': case 'V': case 'R': case 'X':
                        return new Atom("\\" + e);
                    case 'N': {
                        if (take() != '{') throw new IllegalArgumentException("Expected { after \\N");
                        String name = readUntil('}');
                        try { return new Literal(new String(Character.toChars(Character.codePointOf(name)))); }
                        catch (RuntimeException ex) { throw new IllegalArgumentException("Unknown Unicode character name: " + name, ex); }
                    }
                    case 'p': case 'P': {
                        if (take() != '{') throw new IllegalArgumentException("Expected { after \\" + e);
                        String property = readUntil('}');
                        return new Atom("\\" + e + "{" + property + "}");
                    }
                    case 'x': {
                        if (peek() == '{') {
                            take(); String hex = readUntil('}');
                            try { return new Literal(new String(Character.toChars(Integer.parseInt(hex, 16)))); }
                            catch (RuntimeException ex) { throw new IllegalArgumentException("Invalid code point escape", ex); }
                        }
                        return new Literal(readHex(2));
                    }
                    case 'u': return new Literal(readHex(4));
                    case 'c': {
                        char control = take();
                        if (control == '\0') throw new IllegalArgumentException("Incomplete control escape");
                        return new Literal(String.valueOf((char) (control ^ 64)));
                    }
                    case 'Q': {
                        int end = source.indexOf("\\E", pos);
                        if (end < 0) { String value = source.substring(pos); pos = source.length(); return new Literal(value); }
                        String value = source.substring(pos, end); pos = end + 2; return new Literal(value);
                    }
                    case 'k': {
                        if (take() != '<') throw new IllegalArgumentException("Expected < after \\k");
                        return new BackReference(null, readUntil('>'));
                    }
                    case '0': {
                        StringBuilder octal = new StringBuilder();
                        while (octal.length() < 3 && peek() >= '0' && peek() <= '7') octal.append(take());
                        if (octal.length() == 0) return new Literal("\0");
                        return new Literal(String.valueOf((char) Integer.parseInt(octal.toString(), 8)));
                    }
                    default:
                        if (e >= '1' && e <= '9') {
                            StringBuilder number = new StringBuilder().append(e);
                            while (Character.isDigit(peek())) number.append(take());
                            try { return new BackReference(Integer.valueOf(number.toString()), null); }
                            catch (NumberFormatException ex) { throw new IllegalArgumentException("Invalid backreference", ex); }
                        }
                        if ("\\.^$|?*+()[]{}-".indexOf(e) >= 0) return new Literal(String.valueOf(e));
                        // Pattern.compile() has already checked validity. Preserve other
                        // Java escapes as atoms rather than guessing their meaning.
                        return new Atom("\\" + e);
                }
            }

            private String readUntil(char terminator) {
                int start = pos;
                while (pos < source.length() && peek() != terminator) take();
                if (take() != terminator) throw new IllegalArgumentException("Unterminated escape/group name");
                return source.substring(start, pos - 1);
            }

            private String readHex(int count) {
                if (pos + count > source.length()) throw new IllegalArgumentException("Incomplete hexadecimal escape");
                String hex = source.substring(pos, pos + count); pos += count;
                try { return String.valueOf((char) Integer.parseInt(hex, 16)); }
                catch (NumberFormatException ex) { throw new IllegalArgumentException("Invalid hexadecimal escape: " + hex, ex); }
            }

            private Node group() {
                if (peek() != '?') {
                    int group = nextGroup++;
                    Node body = expressionUntilClose();
                    return new Capture(group, null, body);
                }
                take();
                char next = take();
                if (next == ':') return expressionUntilClose();
                if (next == '=') return new Assertion(AssertionKind.POSITIVE_AHEAD, expressionUntilClose());
                if (next == '!') return new Assertion(AssertionKind.NEGATIVE_AHEAD, expressionUntilClose());
                if (next == '<') {
                    char direction = take();
                    if (direction == '=' || direction == '!') {
                        Node body = expressionUntilClose();
                        return new Assertion(direction == '=' ? AssertionKind.POSITIVE_BEHIND : AssertionKind.NEGATIVE_BEHIND, body);
                    }
                    // Named capturing group: (?<name>...). The first name
                    // character was consumed while distinguishing lookbehind.
                    StringBuilder name = new StringBuilder();
                    if (direction != '\0') name.append(direction);
                    while (peek() != '>' && peek() != '\0') name.append(take());
                    if (take() != '>') throw new IllegalArgumentException("Malformed named capturing group");
                    int group = nextGroup++;
                    return new Capture(group, name.toString(), expressionUntilClose());
                }
                if (next == '>') return expressionUntilClose(); // atomic group (?>...)

                // Inline flags: (?im-s) or scoped flags (?im-s:...). Pattern.compile
                // applies the actual flags; the candidate parser only needs the body.
                int modifierStart = pos - 1;
                StringBuilder modifier = new StringBuilder().append(next);
                while (peek() != ':' && peek() != ')' && peek() != '\0') modifier.append(take());
                boolean oldComments = comments;
                applyCommentModifier(modifier.toString());
                if (peek() == ')') { take(); return new Empty(); }
                if (take() == ':') {
                    Node body = expression();
                    if (take() != ')') throw new IllegalArgumentException("Unclosed inline-flag group");
                    comments = oldComments;
                    return body;
                }
                comments = oldComments;
                throw new IllegalArgumentException("Unsupported inline modifier at position " + modifierStart);
            }

            private void applyCommentModifier(String modifier) {
                boolean disable = false;
                for (int i = 0; i < modifier.length(); i++) {
                    char c = modifier.charAt(i);
                    if (c == '-') { disable = true; continue; }
                    if (c == 'x') comments = !disable;
                }
            }

            private Node expressionUntilClose() {
                Node body = expression();
                skipIgnored();
                if (take() != ')') throw new IllegalArgumentException("Unclosed group");
                return body;
            }
        }

        private static final class GenerationContext {
            final int flags;
            final int attempt;
            final Map<Integer, String> numberedGroups = new LinkedHashMap<>();
            final Map<String, String> namedGroups = new LinkedHashMap<>();
            final Map<String, List<String>> atomSamples;
            GenerationContext(int flags, int attempt, Map<String, List<String>> atomSamples) {
                this.flags = flags; this.attempt = attempt; this.atomSamples = atomSamples;
            }
        }

        private static String generateNode(Node node, int attempt, GenerationContext context, Options options) {
            if (node instanceof Empty) return "";
            if (node instanceof Literal) return ((Literal) node).value;
            if (node instanceof Atom) return chooseAtomSample(((Atom) node).regexFragment, attempt, context);
            if (node instanceof Boundary) return ((Boundary) node).wordBoundary ? "" : "a";
            if (node instanceof BackReference) {
                BackReference ref = (BackReference) node;
                String value = ref.index != null ? context.numberedGroups.get(ref.index) : context.namedGroups.get(ref.name);
                return value == null ? "" : value;
            }
            if (node instanceof Capture) {
                Capture capture = (Capture) node;
                String value = generateNode(capture.node, attempt, context, options);
                context.numberedGroups.put(capture.index, value);
                if (capture.name != null) context.namedGroups.put(capture.name, value);
                return value;
            }
            if (node instanceof Assertion) {
                Assertion assertion = (Assertion) node;
                switch (assertion.kind) {
                    case POSITIVE_AHEAD:
                        return generateNode(assertion.node, attempt + 1, context, options);
                    case POSITIVE_BEHIND:
                        return generateNode(assertion.node, attempt + 1, context, options);
                    case NEGATIVE_AHEAD:
                    case NEGATIVE_BEHIND:
                    default: return "";
                }
            }
            if (node instanceof Sequence) {
                StringBuilder out = new StringBuilder();
                StringBuilder pendingAhead = new StringBuilder();
                int index = 0;
                for (Node child : ((Sequence) node).nodes) {
                    if (child instanceof Assertion) {
                        Assertion assertion = (Assertion) child;
                        if (assertion.kind == AssertionKind.POSITIVE_AHEAD) {
                            String hint = generateNode(assertion.node, attempt, context, options);
                            mergeHint(pendingAhead, hint);
                        } else if (assertion.kind == AssertionKind.POSITIVE_BEHIND) {
                            out.append(generateNode(assertion.node, attempt, context, options));
                        }
                        index++;
                        continue;
                    }
                    String chunk = generateNode(child, attempt, context, options);
                    if (pendingAhead.length() > 0) {
                        String pending = pendingAhead.toString();
                        if (pending.startsWith(chunk)) {
                            out.append(chunk); pendingAhead.delete(0, chunk.length());
                        } else if (chunk.startsWith(pending)) {
                            out.append(chunk); pendingAhead.setLength(0);
                        } else {
                            out.append(pending).append(chunk); pendingAhead.setLength(0);
                        }
                    } else out.append(chunk);
                    index++;
                }
                out.append(pendingAhead);
                return out.toString();
            }
            if (node instanceof Alternative) {
                List<Node> alternatives = ((Alternative) node).alternatives;
                return generateNode(alternatives.get(Math.floorMod(attempt, alternatives.size())), attempt + 1, context, options);
            }
            if (node instanceof Repeat) {
                Repeat repeat = (Repeat) node;
                int width = repeat.max - repeat.min + 1;
                int count = repeat.min + Math.floorMod(attempt, Math.max(1, width));
                StringBuilder out = new StringBuilder();
                for (int i = 0; i < count; i++) {
                    out.append(generateNode(repeat.node, attempt + i, context, options));
                    if (out.length() > options.maxLength) break;
                }
                return out.toString();
            }
            throw new IllegalArgumentException("Unknown candidate node: " + node.getClass().getSimpleName());
        }

        private static void mergeHint(StringBuilder pending, String hint) {
            if (hint == null || hint.isEmpty()) return;
            if (pending.length() == 0) { pending.append(hint); return; }
            String old = pending.toString();
            if (old.contains(hint)) return;
            if (hint.contains(old)) { pending.setLength(0); pending.append(hint); return; }
            // Concatenation gives overlapping prefix constraints the best chance;
            // final validation rejects incompatible assertions.
            pending.append(hint);
        }

        private static String chooseAtomSample(String fragment, int attempt, GenerationContext context) {
            String cacheKey = context.flags + "\u0000" + fragment;
            List<String> samples = context.atomSamples.get(cacheKey);
            if (samples == null) {
                samples = findAtomSamples(fragment, context.flags);
                context.atomSamples.put(cacheKey, samples);
            }
            if (samples.isEmpty()) {
                throw new IllegalArgumentException("No sample character found for regex atom: " + fragment);
            }
            return samples.get(Math.floorMod(attempt, samples.size()));
        }

        private static List<String> findAtomSamples(String fragment, int flags) {
            final Pattern predicate;
            try { predicate = Pattern.compile("^(?:" + fragment + ")$", flags); }
            catch (PatternSyntaxException ex) {
                throw new IllegalArgumentException("Could not sample regex atom " + fragment + ": " + ex.getDescription(), ex);
            }
            List<String> samples = new ArrayList<>();
            String[] common = {
                "a", "A", "0", "1", "_", "-", ".", " ", "\t", "\n", "\r", "\r\n",
                "!", "@", "#", "$", "%", "Ω", "Ж", "中", "あ", "é", "€", "😀"
            };
            for (String candidate : common) addIfMatches(predicate, candidate, samples);
            // Search Unicode only when the readable/common pool has no match.
            if (samples.isEmpty()) {
                for (int cp = 32; cp <= 0x2FFF && samples.size() < 48; cp++) {
                    if (cp >= 0xD800 && cp <= 0xDFFF) continue;
                    addIfMatches(predicate, new String(Character.toChars(cp)), samples);
                }
                int[] extra = {0x3042, 0x4E2D, 0xAC00, 0x1F600, 0x1F680, 0x1D400};
                for (int cp : extra) addIfMatches(predicate, new String(Character.toChars(cp)), samples);
            }
            return samples;
        }

        private static void addIfMatches(Pattern predicate, String candidate, List<String> samples) {
            if (samples.size() >= 48 || samples.contains(candidate)) return;
            if (predicate.matcher(candidate).matches()) samples.add(candidate);
        }
    }

}
