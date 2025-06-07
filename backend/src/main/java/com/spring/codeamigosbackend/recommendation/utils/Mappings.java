package com.spring.codeamigosbackend.recommendation.utils;

import lombok.*;

import java.util.Arrays;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.function.BiPredicate;

public class Mappings {
    @Getter @Setter @ToString @AllArgsConstructor @NoArgsConstructor
    public static class DependencyFramework {
        String dependency;
        String framework;
        BiPredicate<String, String> checker;
    }

    public static final Map<String, List<String>> LANGUAGE_TO_CONFIG = new HashMap<>();
    static {
        LANGUAGE_TO_CONFIG.put("Java", Arrays.asList("pom.xml", "build.gradle"));
        LANGUAGE_TO_CONFIG.put("JavaScript", Arrays.asList("next.config.js","package.json"));
        LANGUAGE_TO_CONFIG.put("TypeScript", Arrays.asList("next.config.js", "angular.json","package.json"));
        LANGUAGE_TO_CONFIG.put("Python", Arrays.asList("requirements.txt", "pyproject.toml", "setup.py"));
        LANGUAGE_TO_CONFIG.put("PHP", Arrays.asList("composer.json"));
        LANGUAGE_TO_CONFIG.put("Ruby", Arrays.asList("Gemfile"));
        LANGUAGE_TO_CONFIG.put("Go", Arrays.asList("go.mod"));
        LANGUAGE_TO_CONFIG.put("Rust", Arrays.asList("Cargo.toml"));
        LANGUAGE_TO_CONFIG.put("Swift", Arrays.asList("Package.swift"));
        LANGUAGE_TO_CONFIG.put("Dart", Arrays.asList("pubspec.yaml"));
        LANGUAGE_TO_CONFIG.put("C#", Arrays.asList("csproj", "appsettings.json", "Program.cs"));
        LANGUAGE_TO_CONFIG.put("GDScript", Arrays.asList("project.godot"));
        LANGUAGE_TO_CONFIG.put("C++", Arrays.asList("uproject", "CMakeLists.txt"));
        LANGUAGE_TO_CONFIG.put("Kotlin", Arrays.asList("build.gradle", "pom.xml"));
        LANGUAGE_TO_CONFIG.put("Scala", Arrays.asList("build.sbt"));
        LANGUAGE_TO_CONFIG.put("Elixir", Arrays.asList("mix.exs"));
    }

    public static final Map<String, List<DependencyFramework>> CONFIG_TO_DEPENDENCY_FRAMEWORK = new HashMap<>();
    static {
        BiPredicate<String, String> packageJsonChecker = (content, dep) -> content.contains("\"" + dep + "\"");
        BiPredicate<String, String> pomXmlChecker = (content, dep) -> content.contains("<artifactId>" + dep + "</artifactId>");
        BiPredicate<String, String> gradleChecker = (content, dep) -> content.contains(dep);
        BiPredicate<String, String> requirementsChecker = (content, dep) -> content.contains(dep);
        BiPredicate<String, String> pyprojectChecker = (content, dep) -> content.contains(dep);
        BiPredicate<String, String> setupPyChecker = (content, dep) ->content.contains(dep);
        BiPredicate<String, String> composerChecker = (content, dep) -> content.contains(dep);
        BiPredicate<String, String> gemfileChecker = (content, dep) -> content.contains(dep);
        BiPredicate<String, String> goModChecker = (content, dep) -> content.contains(dep);
        BiPredicate<String, String> cargoChecker = (content, dep) -> content.contains(dep);
        BiPredicate<String, String> swiftChecker = (content, dep) -> content.contains(dep);
        BiPredicate<String, String> pubspecChecker = (content, dep) -> content.contains(dep + ":");
        BiPredicate<String, String> csprojChecker = (content, dep) -> content.contains("<PackageReference Include=\"" + dep + "\"") || content.contains("<Reference Include=\"" + dep + "\"") || content.contains("<Project Sdk=\"" + dep + "\"");
        BiPredicate<String, String> godotChecker = (content, dep) -> content.contains("[application]") || content.contains("config_version");
        BiPredicate<String, String> uprojectChecker = (content, dep) -> content.contains("\"EngineAssociation\"") || content.contains("\"Modules\"");
        BiPredicate<String, String> sbtChecker = (content, dep) -> content.contains(dep);
        BiPredicate<String, String> mixChecker = (content, dep) -> content.contains(":" + dep);
        BiPredicate<String, String> angularJsonChecker = (content, dep) -> content.contains("\"projects\":");
        BiPredicate<String, String> nextConfigChecker = (content, dep) -> content.contains("module.exports") || content.contains("export default") || content.contains("reactStrictMode");
        BiPredicate<String, String> appsettingsChecker = (content, dep) -> content.contains("\"ConnectionStrings\"") || content.contains("\"Logging\"");
        BiPredicate<String, String> programCsChecker = (content, dep) -> content.contains("CreateHostBuilder") || content.contains("WebApplication.CreateBuilder");

        CONFIG_TO_DEPENDENCY_FRAMEWORK.put("package.json", Arrays.asList(
                new DependencyFramework("react", "React", packageJsonChecker),
                new DependencyFramework("react-native", "React Native", packageJsonChecker),
                new DependencyFramework("express", "Express", packageJsonChecker),
                new DependencyFramework("next", "NextJs", packageJsonChecker),
                new DependencyFramework("vue", "VueJs", packageJsonChecker),
                new DependencyFramework("nuxt", "NuxtJs", packageJsonChecker),
                new DependencyFramework("nestjs", "NestJS", packageJsonChecker),
                new DependencyFramework("@angular/core", "Angular", packageJsonChecker),
                new DependencyFramework("svelte", "Svelte", packageJsonChecker),
                new DependencyFramework("remix", "Remix", packageJsonChecker),
                new DependencyFramework("phaser", "Phaser", packageJsonChecker),
                new DependencyFramework("gatsby", "Gatsby", packageJsonChecker),
                new DependencyFramework("ember-cli", "EmberJs", packageJsonChecker)
        ));
        CONFIG_TO_DEPENDENCY_FRAMEWORK.put("pom.xml", Arrays.asList(
                new DependencyFramework("spring-boot-starter-web", "Spring Boot", pomXmlChecker),
                new DependencyFramework("libgdx", "LibGDX", pomXmlChecker),
                new DependencyFramework("ktor-server-core", "Ktor", pomXmlChecker)
        ));
        CONFIG_TO_DEPENDENCY_FRAMEWORK.put("build.gradle", Arrays.asList(
                new DependencyFramework("spring-boot-starter-web", "Spring Boot", gradleChecker),
                new DependencyFramework("com.badlogic.gdx", "LibGDX", gradleChecker),
                new DependencyFramework("io.ktor", "Ktor", gradleChecker)
        ));
        CONFIG_TO_DEPENDENCY_FRAMEWORK.put("requirements.txt", Arrays.asList(
                new DependencyFramework("flask", "Flask", requirementsChecker),
                new DependencyFramework("django", "Django", requirementsChecker),
                new DependencyFramework("fastapi", "FastAPI", requirementsChecker)
        ));
        CONFIG_TO_DEPENDENCY_FRAMEWORK.put("pyproject.toml", Arrays.asList(
                new DependencyFramework("flask", "Flask", pyprojectChecker),
                new DependencyFramework("django", "Django", pyprojectChecker),
                new DependencyFramework("fastapi", "FastAPI", pyprojectChecker)
        ));
        CONFIG_TO_DEPENDENCY_FRAMEWORK.put("setup.py", Arrays.asList(
                new DependencyFramework("flask", "Flask", setupPyChecker),
                new DependencyFramework("django", "Django", setupPyChecker),
                new DependencyFramework("fastapi", "FastAPI", setupPyChecker)
        ));
        CONFIG_TO_DEPENDENCY_FRAMEWORK.put("composer.json", Arrays.asList(
                new DependencyFramework("laravel/framework", "Laravel", composerChecker)
        ));
        CONFIG_TO_DEPENDENCY_FRAMEWORK.put("Gemfile", Arrays.asList(
                new DependencyFramework("rails", "Ruby on Rails", gemfileChecker)
        ));
        CONFIG_TO_DEPENDENCY_FRAMEWORK.put("go.mod", Arrays.asList(
                new DependencyFramework("github.com/gin-gonic/gin", "Gin", goModChecker)
        ));
        CONFIG_TO_DEPENDENCY_FRAMEWORK.put("Cargo.toml", Arrays.asList(
                new DependencyFramework("actix-web", "Actix Web", cargoChecker),
                new DependencyFramework("rocket", "Rocket", cargoChecker)
        ));
        CONFIG_TO_DEPENDENCY_FRAMEWORK.put("Package.swift", Arrays.asList(
                new DependencyFramework("github.com/vapor/vapor", "Vapor", swiftChecker)
        ));
        CONFIG_TO_DEPENDENCY_FRAMEWORK.put("pubspec.yaml", Arrays.asList(
                new DependencyFramework("flutter", "Flutter", pubspecChecker)
        ));
        CONFIG_TO_DEPENDENCY_FRAMEWORK.put("csproj", Arrays.asList(
                new DependencyFramework("Microsoft.AspNetCore", "ASPDotNETCore", csprojChecker),
                new DependencyFramework("Microsoft.NET.Sdk.Web", "ASPDotNETCore", csprojChecker),
                new DependencyFramework("UnityEngine", "Unity", csprojChecker)
        ));
        CONFIG_TO_DEPENDENCY_FRAMEWORK.put("appsettings.json", Arrays.asList(
                new DependencyFramework("aspnetcore", "ASPDotNETCore", appsettingsChecker)
        ));
        CONFIG_TO_DEPENDENCY_FRAMEWORK.put("Program.cs", Arrays.asList(
                new DependencyFramework("aspnetcore", "ASPDotNETCore", programCsChecker)
        ));
        CONFIG_TO_DEPENDENCY_FRAMEWORK.put("project.godot", Arrays.asList(
                new DependencyFramework("godot", "Godot", godotChecker)
        ));
        CONFIG_TO_DEPENDENCY_FRAMEWORK.put("uproject", Arrays.asList(
                new DependencyFramework("UnrealEngine", "Unreal Engine", uprojectChecker)
        ));
        CONFIG_TO_DEPENDENCY_FRAMEWORK.put("CMakeLists.txt", Arrays.asList(
                new DependencyFramework("UnrealEngine", "Unreal Engine", uprojectChecker)
        ));
        CONFIG_TO_DEPENDENCY_FRAMEWORK.put("build.sbt", Arrays.asList(
                new DependencyFramework("com.typesafe.play", "Play Framework", sbtChecker)
        ));
        CONFIG_TO_DEPENDENCY_FRAMEWORK.put("mix.exs", Arrays.asList(
                new DependencyFramework("phoenix", "Phoenix", mixChecker)
        ));
        CONFIG_TO_DEPENDENCY_FRAMEWORK.put("angular.json", Arrays.asList(
                new DependencyFramework("angular", "Angular", angularJsonChecker)
        ));
        CONFIG_TO_DEPENDENCY_FRAMEWORK.put("next.config.js", Arrays.asList(
                new DependencyFramework("next", "NextJs", nextConfigChecker)
        ));
    }

    public static final Map<String, List<String>> FRAMEWORK_TO_FILE_EXTENSIONS = new HashMap<>();
    static {
        FRAMEWORK_TO_FILE_EXTENSIONS.put("React", Arrays.asList(".jsx", ".tsx"));
        FRAMEWORK_TO_FILE_EXTENSIONS.put("React Native", Arrays.asList(".jsx", ".tsx"));
        FRAMEWORK_TO_FILE_EXTENSIONS.put("Express", Arrays.asList(".js", ".ts"));
        FRAMEWORK_TO_FILE_EXTENSIONS.put("Spring Boot", Arrays.asList(".java"));
        FRAMEWORK_TO_FILE_EXTENSIONS.put("NextJs", Arrays.asList(".jsx", ".tsx"));
        FRAMEWORK_TO_FILE_EXTENSIONS.put("VueJs", Arrays.asList(".vue"));
        FRAMEWORK_TO_FILE_EXTENSIONS.put("NuxtJs", Arrays.asList(".vue"));
        FRAMEWORK_TO_FILE_EXTENSIONS.put("NestJS", Arrays.asList(".ts"));
        FRAMEWORK_TO_FILE_EXTENSIONS.put("Angular", Arrays.asList(".ts"));
        FRAMEWORK_TO_FILE_EXTENSIONS.put("Svelte", Arrays.asList(".svelte"));
        FRAMEWORK_TO_FILE_EXTENSIONS.put("Remix", Arrays.asList(".jsx", ".tsx"));
        FRAMEWORK_TO_FILE_EXTENSIONS.put("Flask", Arrays.asList(".py"));
        FRAMEWORK_TO_FILE_EXTENSIONS.put("Django", Arrays.asList(".py"));
        FRAMEWORK_TO_FILE_EXTENSIONS.put("FastAPI", Arrays.asList(".py"));
        FRAMEWORK_TO_FILE_EXTENSIONS.put("Laravel", Arrays.asList(".php"));
        FRAMEWORK_TO_FILE_EXTENSIONS.put("Ruby on Rails", Arrays.asList(".rb"));
        FRAMEWORK_TO_FILE_EXTENSIONS.put("Gin", Arrays.asList(".go"));
        FRAMEWORK_TO_FILE_EXTENSIONS.put("Actix Web", Arrays.asList(".rs"));
        FRAMEWORK_TO_FILE_EXTENSIONS.put("Rocket", Arrays.asList(".rs"));
        FRAMEWORK_TO_FILE_EXTENSIONS.put("Vapor", Arrays.asList(".swift"));
        FRAMEWORK_TO_FILE_EXTENSIONS.put("Flutter", Arrays.asList(".dart"));
        FRAMEWORK_TO_FILE_EXTENSIONS.put("ASPDotNETCore", Arrays.asList(".cs"));
        FRAMEWORK_TO_FILE_EXTENSIONS.put("Unity", Arrays.asList(".cs"));
        FRAMEWORK_TO_FILE_EXTENSIONS.put("Godot", Arrays.asList(".gd", ".cs"));
        FRAMEWORK_TO_FILE_EXTENSIONS.put("Phaser", Arrays.asList(".js", ".ts"));
        FRAMEWORK_TO_FILE_EXTENSIONS.put("LibGDX", Arrays.asList(".java"));
        FRAMEWORK_TO_FILE_EXTENSIONS.put("Unreal Engine", Arrays.asList(".cpp", ".h"));
        FRAMEWORK_TO_FILE_EXTENSIONS.put("Ktor", Arrays.asList(".kt"));
        FRAMEWORK_TO_FILE_EXTENSIONS.put("Play Framework", Arrays.asList(".scala"));
        FRAMEWORK_TO_FILE_EXTENSIONS.put("Phoenix", Arrays.asList(".ex", ".exs"));
        FRAMEWORK_TO_FILE_EXTENSIONS.put("Gatsby", Arrays.asList(".js", ".tsx"));
        FRAMEWORK_TO_FILE_EXTENSIONS.put("EmberJs", Arrays.asList(".ts", ".js"));
    }
}