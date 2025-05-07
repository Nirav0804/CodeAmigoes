package com.spring.codeamigosbackend.recommendation.utils;

import lombok.*;

import java.util.Arrays;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.function.BiPredicate;

public class Mappings {
    // Helper class to store dependency-framework mapping
    @Getter @Setter @ToString @AllArgsConstructor @NoArgsConstructor
    public static class DependencyFramework {
        String dependency;
        String framework;
        BiPredicate<String, String> checker;
    }

    public static final Map<String, List<String>> LANGUAGE_TO_CONFIG = new HashMap<>();
    static {
        LANGUAGE_TO_CONFIG.put("Java", Arrays.asList("pom.xml", "build.gradle"));
        LANGUAGE_TO_CONFIG.put("JavaScript", Arrays.asList("package.json"));
    }
    // Config file to dependency-framework mapping
    public static final Map<String, List<DependencyFramework>> CONFIG_TO_DEPENDENCY_FRAMEWORK = new HashMap<>();
    static {
        // Checker for package.json: look for dependency in quotes
        BiPredicate<String, String> packageJsonChecker = (content, dep) -> content.contains("\"" + dep + "\"");

        // Checker for pom.xml: look for dependency within <artifactId> tags
        BiPredicate<String, String> pomXmlChecker = (content, dep) -> content.contains("<artifactId>" + dep + "</artifactId>");

        // Checker for build.gradle: look for dependency in single or double quotes
        BiPredicate<String, String> gradleChecker = (content, dep) ->
                content.contains("'" + dep + "'") || content.contains("\"" + dep + "\"");

        CONFIG_TO_DEPENDENCY_FRAMEWORK.put("package.json", Arrays.asList(
                new DependencyFramework("react", "React", packageJsonChecker),
                new DependencyFramework("express", "Express", packageJsonChecker)
        ));
        CONFIG_TO_DEPENDENCY_FRAMEWORK.put("pom.xml", Arrays.asList(
                new DependencyFramework("spring-boot-starter-web", "Spring Boot", pomXmlChecker)
        ));
        CONFIG_TO_DEPENDENCY_FRAMEWORK.put("build.gradle", Arrays.asList(
                new DependencyFramework("spring-boot-starter-web", "Spring Boot", gradleChecker)
        ));
    }
    // Framework to file extensions mapping
    public static final Map<String, List<String>> FRAMEWORK_TO_FILE_EXTENSIONS = new HashMap<>();
    static {
        FRAMEWORK_TO_FILE_EXTENSIONS.put("React", Arrays.asList(".jsx"));
        FRAMEWORK_TO_FILE_EXTENSIONS.put("Express", Arrays.asList(".js"));
        FRAMEWORK_TO_FILE_EXTENSIONS.put("Spring Boot", Arrays.asList(".java"));
    }
}
