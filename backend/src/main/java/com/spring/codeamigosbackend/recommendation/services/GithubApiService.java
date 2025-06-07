package com.spring.codeamigosbackend.recommendation.services;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.spring.codeamigosbackend.recommendation.dtos.RepositoryInfo;
import com.spring.codeamigosbackend.recommendation.utils.Mappings;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.*;
import java.util.concurrent.*;

@Service
@RequiredArgsConstructor
public class GithubApiService {
    private final RestTemplate restTemplate;
    private final ObjectMapper objectMapper;
    private static final String GITHUB_GRAPHQL_URL = "https://api.github.com/graphql";
    private static Logger logger = LoggerFactory.getLogger(GithubApiService.class);

    public List<RepositoryInfo> getTopRepositories(String username, String email, String accessToken) {
        String query = buildGraphQLQuery(username, email);
        HttpHeaders headers = new HttpHeaders();
        headers.setBearerAuth(accessToken);
        headers.setContentType(MediaType.APPLICATION_JSON);
        logger.info("Access token: " + accessToken);
        Map<String, String> requestBody = new HashMap<>();
        requestBody.put("query", query);

        HttpEntity<Map<String, String>> request = new HttpEntity<>(requestBody, headers);
        ResponseEntity<JsonNode> response = restTemplate.postForEntity(GITHUB_GRAPHQL_URL, request, JsonNode.class);

        JsonNode data = response.getBody().get("data");
        logger.info("Github API response: " + data.toString());
        if (data == null) {
            logger.info("No data found in response");
            return new ArrayList<>();
        }

        JsonNode repositories = data.get("user").get("repositories").get("nodes");
        if (repositories == null) {
            logger.info("No repositories found for user: " + username);
            return new ArrayList<>();
        }

        List<RepositoryInfo> repoInfos = new ArrayList<>();
        for (JsonNode repo : repositories) {
            String name = repo.get("name").asText();
            JsonNode defaultBranchRef = repo.get("defaultBranchRef");
            if (defaultBranchRef == null || defaultBranchRef.get("name") == null) {
                logger.info("Skipping repo " + name + ": No default branch found");
                continue;
            }
            String defaultBranch = defaultBranchRef.get("name").asText();

            List<String> commitShas = new ArrayList<>();
            JsonNode historyEdges = defaultBranchRef.get("target").get("history").get("edges");
            for (JsonNode edge : historyEdges) {
                commitShas.add(edge.get("node").get("oid").asText());
            }

            List<RepositoryInfo.Language> topLanguages = new ArrayList<>();
            JsonNode languagesNodes = repo.get("languages").get("nodes");
            JsonNode languagesEdges = repo.get("languages").get("edges");
            for (int i = 0; i < languagesNodes.size(); i++) {
                String langName = languagesNodes.get(i).get("name").asText();
                long langSize = languagesEdges.get(i).get("size").asLong();
                topLanguages.add(new RepositoryInfo.Language(langName, langSize));
            }
            repoInfos.add(new RepositoryInfo(name, defaultBranch, commitShas, topLanguages));
        }
        return repoInfos;
    }

    public String buildGraphQLQuery(String username, String email) {
        return String.format("""
        query {
          user(login: "%s") {
            repositories(first: 25, orderBy: {field: PUSHED_AT, direction: DESC}) {
              nodes {
                name
                defaultBranchRef {
                  name
                  target {
                    ... on Commit {
                      history(first: 100, author: {emails: ["%s"]}) {
                        edges {
                          node {
                            oid
                          }
                        }
                        pageInfo {
                          hasNextPage
                          endCursor
                        }
                      }
                    }
                  }
                }
                languages(first: 3 ,  orderBy: {field: SIZE, direction: DESC}) {
                  edges {
                    size
                  }
                  nodes {
                    name
                  }
                }
              }
              pageInfo {
                hasNextPage
                endCursor
              }
            }
          }
        }
        """, username, email);
    }

    public Map<RepositoryInfo, List<String>> getFrameworksForRepositories(List<RepositoryInfo> repositories, String owner, String accessToken) {
        int threadPoolSize = Math.min(repositories.size(), 10);
        ExecutorService frameworkExecutor = Executors.newFixedThreadPool(threadPoolSize);
        Map<RepositoryInfo, List<String>> repoToFrameworks = new ConcurrentHashMap<>();
        List<Future<Void>> frameworkFutures = new ArrayList<>();

        for (RepositoryInfo repo : repositories) {
            Callable<Void> task = () -> {
                try {
                    List<String> frameworks = getFrameworkFromRepository(repo, owner, accessToken);
                    repoToFrameworks.put(repo, frameworks);
                } catch (Exception e) {
                    logger.error("Error processing repo " + repo.getName() + ": " + e.getMessage(), e);
                    repoToFrameworks.put(repo, Collections.emptyList());
                }
                return null;
            };
            frameworkFutures.add(frameworkExecutor.submit(task));
        }

        for (Future<Void> future : frameworkFutures) {
            try {
                future.get(60, TimeUnit.SECONDS);
            } catch (TimeoutException e) {
                logger.error("Task timed out: " + e.getMessage(), e);
            } catch (Exception e) {
                logger.error("Error retrieving result: " + e.getMessage(), e);
            }
        }

        frameworkExecutor.shutdown();
        try {
            if (!frameworkExecutor.awaitTermination(60, TimeUnit.SECONDS)) {
                frameworkExecutor.shutdownNow();
            }
        } catch (InterruptedException e) {
            frameworkExecutor.shutdownNow();
            Thread.currentThread().interrupt();
        }
        return repoToFrameworks;
    }

    public Map<String, Integer> countFrameworkFiles(Map<RepositoryInfo, List<String>> repoToFrameworks, String owner, String accessToken) {
        logger.info("Starting framework file count for owner: {}, repositories: {}", owner, repoToFrameworks.size());
        Map<String, Set<String>> globalFrameworkToFiles = new ConcurrentHashMap<>();

        for (Map.Entry<RepositoryInfo, List<String>> entry : repoToFrameworks.entrySet()) {
            RepositoryInfo repo = entry.getKey();
            List<String> frameworks = entry.getValue();

            if (frameworks.isEmpty()) {
                logger.warn("Skipping repository {}: No frameworks found", repo.getName());
                continue;
            }
            if (repo.getCommitShas().isEmpty()) {
                logger.warn("Skipping repository {}: No commits found", repo.getName());
                continue;
            }

            logger.debug("Processing repository: {}, frameworks: {}, commits: {}",
                    repo.getName(), frameworks, repo.getCommitShas().size());

            int commitThreadPoolSize = Math.min(repo.getCommitShas().size(), 100);
            logger.debug("Creating commit executor with {} threads for repository {}", commitThreadPoolSize, repo.getName());
            ExecutorService commitExecutor = Executors.newFixedThreadPool(commitThreadPoolSize);
            List<Future<Void>> commitFutures = new ArrayList<>();

            HttpHeaders headers = new HttpHeaders();
            headers.setBearerAuth(accessToken);
            HttpEntity<String> entity = new HttpEntity<>(headers);

            for (String commitSha : repo.getCommitShas()) {
                Callable<Void> task = () -> {
                    String commitUrl = "https://api.github.com/repos/" + owner + "/" + repo.getName() + "/commits/" + commitSha;
                    logger.debug("Fetching commit {} for repository {}", commitSha, repo.getName());
                    try {
                        ResponseEntity<JsonNode> response = restTemplate.exchange(commitUrl, HttpMethod.GET, entity, JsonNode.class);
                        JsonNode commitData = response.getBody();
                        if (commitData == null) {
                            logger.warn("No commit data returned for commit {} in repository {}", commitSha, repo.getName());
                            return null;
                        }

                        JsonNode files = commitData.get("files");
                        if (files == null || !files.isArray()) {
                            logger.warn("No files found in commit {} for repository {}", commitSha, repo.getName());
                            return null;
                        }

                        logger.trace("Processing {} files in commit {} for repository {}", files.size(), commitSha, repo.getName());
                        for (JsonNode file : files) {
                            String filename = file.get("filename").asText();
                            if (filename.contains("node_modules")) {
                                logger.trace("Skipping file in node_modules: {}", filename);
                                continue;
                            }
                            String repoFilePath = repo.getName() + "/" + filename;
                            for (String framework : frameworks) {
                                List<String> extensions = Mappings.FRAMEWORK_TO_FILE_EXTENSIONS.getOrDefault(framework, Collections.emptyList());
                                for (String ext : extensions) {
                                    if (filename.endsWith(ext)) {
                                        logger.trace("Found file {} matching framework {} (extension: {}) in repository {}",
                                                repoFilePath, framework, ext, repo.getName());
                                        globalFrameworkToFiles.computeIfAbsent(framework, k -> new HashSet<>()).add(repoFilePath);
                                        break;
                                    }
                                }
                            }
                        }
                    } catch (Exception e) {
                        logger.error("Error fetching commit {} for repository {}: {}", commitSha, repo.getName(), e.getMessage(), e);
                    }
                    return null;
                };
                commitFutures.add(commitExecutor.submit(task));
            }

            for (Future<Void> future : commitFutures) {
                try {
                    future.get(30, TimeUnit.SECONDS);
                } catch (TimeoutException e) {
                    logger.error("Task timed out for repository {}: {}", repo.getName(), e.getMessage(), e);
                } catch (Exception e) {
                    logger.error("Error retrieving result for repository {}: {}", repo.getName(), e.getMessage(), e);
                }
            }

            commitExecutor.shutdown();
            try {
                if (!commitExecutor.awaitTermination(90, TimeUnit.SECONDS)) {
                    logger.warn("Commit executor for repository {} did not terminate within 60 seconds, forcing shutdown", repo.getName());
                    commitExecutor.shutdownNow();
                } else {
                    logger.debug("Commit executor for repository {} terminated successfully", repo.getName());
                }
            } catch (InterruptedException e) {
                logger.error("Interrupted while awaiting termination for repository {}: {}", repo.getName(), e.getMessage(), e);
                commitExecutor.shutdownNow();
                Thread.currentThread().interrupt();
            }

            int totalFilesProcessed = globalFrameworkToFiles.values().stream().mapToInt(Set::size).sum();
            logger.info("Processed {} files for repository {}", totalFilesProcessed, repo.getName());
        }

        Map<String, Integer> frameworkToFileCounts = new HashMap<>();
        for (Map.Entry<String, Set<String>> entry : globalFrameworkToFiles.entrySet()) {
            frameworkToFileCounts.put(entry.getKey(), entry.getValue().size());
            logger.info("Framework {}: {} files", entry.getKey(), entry.getValue().size());
            logger.info("Framework {}: {} files", entry.getKey(), entry.getValue().toString());
        }

        if (frameworkToFileCounts.isEmpty()) {
            logger.warn("No frameworks detected for owner: {}", owner);
        }

        logger.info("Completed framework file count for owner: {}, total frameworks: {}", owner, frameworkToFileCounts.size());
        return frameworkToFileCounts;
    }

    public List<String> getFrameworkFromRepository(RepositoryInfo repo, String owner, String accessToken) {
        String url = "https://api.github.com/repos/" + owner + "/" + repo.getName() + "/git/trees/" + repo.getDefaultBranch() + "?recursive=1";
        HttpHeaders headers = new HttpHeaders();
        headers.setBearerAuth(accessToken);
        HttpEntity<String> entity = new HttpEntity<>(headers);
        ResponseEntity<JsonNode> response = restTemplate.exchange(url, HttpMethod.GET, entity, JsonNode.class);
        JsonNode tree = response.getBody().get("tree");

        List<String> configFilesToLookFor = new ArrayList<>();
        for (RepositoryInfo.Language lang : repo.getTopLanguages()) {
            String languageName = lang.getName();
            if (Mappings.LANGUAGE_TO_CONFIG.containsKey(languageName)) {
                configFilesToLookFor.addAll(Mappings.LANGUAGE_TO_CONFIG.get(languageName));
            }
        }

        List<String> configFilePaths = new ArrayList<>();
        for (JsonNode item : tree) {
            if (item.get("type").asText().equals("blob")) {
                String filePath = item.get("path").asText();
                if (filePath.contains("node_modules")) {
                    logger.debug("Skipping file in node_modules: {}", filePath);
                    continue;
                }
                for (String configFile : configFilesToLookFor) {
                    if (filePath.endsWith(configFile)) {
                        configFilePaths.add(filePath);
                        break;
                    }
                }
            }
        }

        Set<String> detectedFrameworks = new HashSet<>();
        for (String configPath : configFilePaths) {
            String configFileName = configPath.substring(configPath.lastIndexOf("/") + 1);
            if (!Mappings.CONFIG_TO_DEPENDENCY_FRAMEWORK.containsKey(configFileName)) {
                logger.warn("No dependency-framework mapping for: {}", configFileName);
                continue;
            }

            String contentUrl = "https://api.github.com/repos/" + owner + "/" + repo.getName() + "/contents/" + configPath + "?ref=" + repo.getDefaultBranch();
            ResponseEntity<JsonNode> contentResponse = restTemplate.exchange(contentUrl, HttpMethod.GET, entity, JsonNode.class);
            JsonNode contentNode = contentResponse.getBody();

            if (!contentNode.has("content")) {
                logger.warn("No content found for file: {}", configPath);
                continue;
            }
            String contentBase64 = contentNode.get("content").asText().replaceAll("\n", "");
            String content;
            try {
                content = new String(Base64.getDecoder().decode(contentBase64));
            } catch (IllegalArgumentException e) {
                logger.error("Failed to decode Base64 content for file {}: {}", configPath, e.getMessage(), e);
                continue;
            }

            List<Mappings.DependencyFramework> dependencyFrameworks = Mappings.CONFIG_TO_DEPENDENCY_FRAMEWORK.get(configFileName);
            for (Mappings.DependencyFramework df : dependencyFrameworks) {
                if (df.getChecker().test(content, df.getDependency())) {
                    detectedFrameworks.add(df.getFramework());
                    logger.info("Detected framework: {} for config file: {}", df.getFramework(), configPath);
                }
            }
        }

        logger.info("Detected frameworks for repository {}: {}", repo.getName(), detectedFrameworks);
        return new ArrayList<>(detectedFrameworks);
    }
}