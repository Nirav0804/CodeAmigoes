package com.spring.codeamigosbackend.recommendation.services;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.spring.codeamigosbackend.recommendation.dtos.RepositoryInfo;
import com.spring.codeamigosbackend.recommendation.utils.ApiException;
import com.spring.codeamigosbackend.recommendation.utils.Mappings;
import lombok.RequiredArgsConstructor;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.HttpClientErrorException;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestTemplate;

import java.util.*;
import java.util.concurrent.*;

@Service
@RequiredArgsConstructor
public class GithubApiService {
    private final RestTemplate restTemplate;
    private final ObjectMapper objectMapper;
    private static final String GITHUB_GRAPHQL_URL = "https://api.github.com/graphql";

    public List<RepositoryInfo> getTopRepositories(String username, String email, String accessToken) {
        try {
            // Validate inputs
            if (username == null || username.isEmpty()) {
                throw new ApiException(400, "GitHub username is required");
            }
            if (accessToken == null || accessToken.isEmpty()) {
                throw new ApiException(400, "GitHub access token is required");
            }

            String query = buildGraphQLQuery(username, email);
            HttpHeaders headers = new HttpHeaders();
            headers.setBearerAuth(accessToken);
            headers.setContentType(MediaType.APPLICATION_JSON);

            Map<String, String> requestBody = new HashMap<>();
            requestBody.put("query", query);

            HttpEntity<Map<String, String>> request = new HttpEntity<>(requestBody, headers);
            ResponseEntity<JsonNode> response;
            try {
                response = restTemplate.postForEntity(GITHUB_GRAPHQL_URL, request, JsonNode.class);
            } catch (HttpClientErrorException e) {
                if (e.getStatusCode() == HttpStatus.UNAUTHORIZED) {
                    throw new ApiException(401, "Invalid GitHub access token");
                } else if (e.getStatusCode() == HttpStatus.TOO_MANY_REQUESTS) {
                    throw new ApiException(429, "GitHub API rate limit exceeded");
                }
                throw new ApiException(500, "GitHub API error: " + e.getMessage());
            } catch (RestClientException e) {
                throw new ApiException(503, "Failed to connect to GitHub API: " + e.getMessage());
            }

            JsonNode data = response.getBody();
            if (data == null || !data.has("data")) {
                throw new ApiException(404, "No data found in GitHub API response for user: " + username);
            }

            JsonNode userNode = data.get("data").get("user");
            if (userNode == null || userNode.isNull()) {
                throw new ApiException(404, "User not found: " + username);
            }

            JsonNode repositories = userNode.get("repositories").get("nodes");
            if (repositories == null || !repositories.isArray()) {
                throw new ApiException(404, "No repositories found for user: " + username);
            }

            List<RepositoryInfo> repoInfos = new ArrayList<>();
            for (JsonNode repo : repositories) {
                if (!repo.has("name")) {
                    continue; // Skip malformed repository data
                }
                String name = repo.get("name").asText();
                JsonNode defaultBranchRef = repo.get("defaultBranchRef");
                if (defaultBranchRef == null || defaultBranchRef.isNull() || !defaultBranchRef.has("name")) {
                    continue; // Skip repositories without a default branch
                }
                String defaultBranch = defaultBranchRef.get("name").asText();

                List<String> commitShas = new ArrayList<>();
                JsonNode historyEdges = defaultBranchRef.get("target").get("history").get("edges");
                if (historyEdges != null && historyEdges.isArray()) {
                    for (JsonNode edge : historyEdges) {
                        if (edge.has("node") && edge.get("node").has("oid")) {
                            commitShas.add(edge.get("node").get("oid").asText());
                        }
                    }
                }

                List<RepositoryInfo.Language> topLanguages = new ArrayList<>();
                JsonNode languagesNodes = repo.get("languages").get("nodes");
                JsonNode languagesEdges = repo.get("languages").get("edges");
                if (languagesNodes != null && languagesEdges != null && languagesNodes.isArray() && languagesEdges.isArray()) {
                    for (int i = 0; i < languagesNodes.size(); i++) {
                        if (i >= languagesEdges.size()) break;
                        if (!languagesNodes.get(i).has("name") || !languagesEdges.get(i).has("size")) continue;
                        String langName = languagesNodes.get(i).get("name").asText();
                        long langSize = languagesEdges.get(i).get("size").asLong();
                        topLanguages.add(new RepositoryInfo.Language(langName, langSize));
                    }
                }
                repoInfos.add(new RepositoryInfo(name, defaultBranch, commitShas, topLanguages));
            }
            return repoInfos;

        } catch (ApiException e) {
            throw e; // Re-throw ApiException to be handled by the caller
        } catch (Exception e) {
            throw new ApiException(500, "Unexpected error while fetching repositories for user " + username + ": " + e.getMessage());
        }
    }

    public String buildGraphQLQuery(String username, String email) {
        if (username == null || username.isEmpty()) {
            throw new ApiException(400, "GitHub username is required for GraphQL query");
        }
        String emailFilter = (email != null && !email.isEmpty()) ? email : "";
        return String.format("""
        query {
          user(login: "%s") {
            repositories(first: 15, orderBy: {field: PUSHED_AT, direction: DESC}) {
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
                languages(first: 2) {
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
        """, username, emailFilter);
    }

    /**
     * Processes multiple repositories in parallel to detect frameworks.
     * Uses a thread pool with a capped number of threads for framework detection.
     * @param repositories List of repositories to process
     * @param owner The repository owner
     * @param accessToken GitHub access token for authentication
     * @return Map of repository to its detected frameworks
     */
    public Map<RepositoryInfo, List<String>> getFrameworksForRepositories(List<RepositoryInfo> repositories, String owner, String accessToken) {
        try {
            if (repositories == null || repositories.isEmpty()) {
                throw new ApiException(400, "Repository list cannot be null or empty");
            }
            if (owner == null || owner.isEmpty()) {
                throw new ApiException(400, "Repository owner is required");
            }
            if (accessToken == null || accessToken.isEmpty()) {
                throw new ApiException(400, "GitHub access token is required");
            }

            int threadPoolSize = Math.min(repositories.size(), 10); // Cap at 10 threads for framework detection
            ExecutorService frameworkExecutor = Executors.newFixedThreadPool(threadPoolSize);
            Map<RepositoryInfo, List<String>> repoToFrameworks = new ConcurrentHashMap<>();
            List<Future<Void>> frameworkFutures = new ArrayList<>();

            for (RepositoryInfo repo : repositories) {
                Callable<Void> task = () -> {
                    List<String> frameworks = getFrameworkFromRepository(repo, owner, accessToken);
                    repoToFrameworks.put(repo, frameworks);
                    return null;
                };
                frameworkFutures.add(frameworkExecutor.submit(task));
            }

            for (Future<Void> future : frameworkFutures) {
                try {
                    future.get(30, TimeUnit.SECONDS); // Timeout after 30 seconds per task
                } catch (TimeoutException e) {
                    throw new ApiException(504, "Timeout while detecting frameworks: " + e.getMessage());
                } catch (Exception e) {
                    throw new ApiException(500, "Error detecting frameworks: " + e.getMessage());
                }
            }

            frameworkExecutor.shutdown();
            try {
                if (!frameworkExecutor.awaitTermination(60, TimeUnit.SECONDS)) {
                    frameworkExecutor.shutdownNow();
                    throw new ApiException(504, "Framework detection tasks did not complete within 60 seconds");
                }
            } catch (InterruptedException e) {
                frameworkExecutor.shutdownNow();
                Thread.currentThread().interrupt();
                throw new ApiException(500, "Framework detection interrupted: " + e.getMessage());
            }

            return repoToFrameworks;

        } catch (ApiException e) {
            throw e;
        } catch (Exception e) {
            throw new ApiException(500, "Unexpected error while detecting frameworks: " + e.getMessage());
        }
    }

    /**
     * Counts the number of files associated with each framework across repositories.
     * Processes commits in parallel with a thread pool sized based on the number of commits.
     * @param repoToFrameworks Map of repositories to their detected frameworks
     * @param owner The repository owner
     * @param accessToken GitHub access token for authentication
     * @return Map of framework to the count of associated files
     */
    public Map<String, Integer> countFrameworkFiles(Map<RepositoryInfo, List<String>> repoToFrameworks, String owner, String accessToken) {
        try {
            if (repoToFrameworks == null || repoToFrameworks.isEmpty()) {
                throw new ApiException(400, "Repository-to-frameworks map cannot be null or empty");
            }
            if (owner == null || owner.isEmpty()) {
                throw new ApiException(400, "Repository owner is required");
            }
            if (accessToken == null || accessToken.isEmpty()) {
                throw new ApiException(400, "GitHub access token is required");
            }

            Map<String, Set<String>> globalFrameworkToFiles = new ConcurrentHashMap<>();

            for (Map.Entry<RepositoryInfo, List<String>> entry : repoToFrameworks.entrySet()) {
                RepositoryInfo repo = entry.getKey();
                List<String> frameworks = entry.getValue();

                if (frameworks.isEmpty() || repo.getCommitShas().isEmpty()) {
                    continue; // Skip repositories with no frameworks or commits
                }

                int commitThreadPoolSize = Math.min(repo.getCommitShas().size(), 100); // Cap at 100 threads for commit processing
                ExecutorService commitExecutor = Executors.newFixedThreadPool(commitThreadPoolSize);
                List<Future<Void>> commitFutures = new ArrayList<>();

                HttpHeaders headers = new HttpHeaders();
                headers.setBearerAuth(accessToken);
                HttpEntity<String> entity = new HttpEntity<>(headers);

                for (String commitSha : repo.getCommitShas()) {
                    Callable<Void> task = () -> {
                        String commitUrl = "https://api.github.com/repos/" + owner + "/" + repo.getName() + "/commits/" + commitSha;
                        try {
                            ResponseEntity<JsonNode> response = restTemplate.exchange(commitUrl, HttpMethod.GET, entity, JsonNode.class);
                            JsonNode commitData = response.getBody();
                            if (commitData == null || !commitData.has("files")) {
                                return null;
                            }
                            JsonNode files = commitData.get("files");
                            if (!files.isArray()) {
                                return null;
                            }

                            for (JsonNode file : files) {
                                if (!file.has("filename")) continue;
                                String filename = file.get("filename").asText();
                                String repoFilePath = repo.getName() + "/" + filename;
                                for (String framework : frameworks) {
                                    List<String> extensions = Mappings.FRAMEWORK_TO_FILE_EXTENSIONS.getOrDefault(framework, Collections.emptyList());
                                    for (String ext : extensions) {
                                        if (filename.endsWith(ext)) {
                                            globalFrameworkToFiles.computeIfAbsent(framework, k -> new HashSet<>()).add(repoFilePath);
                                            break;
                                        }
                                    }
                                }
                            }
                        } catch (HttpClientErrorException e) {
                            if (e.getStatusCode() == HttpStatus.UNAUTHORIZED) {
                                throw new ApiException(401, "Invalid GitHub access token while fetching commit " + commitSha);
                            } else if (e.getStatusCode() == HttpStatus.TOO_MANY_REQUESTS) {
                                throw new ApiException(429, "GitHub API rate limit exceeded while fetching commit " + commitSha);
                            }
                            throw new ApiException(500, "GitHub API error while fetching commit " + commitSha + ": " + e.getMessage());
                        } catch (RestClientException e) {
                            throw new ApiException(503, "Failed to connect to GitHub API for commit " + commitSha + ": " + e.getMessage());
                        }
                        return null;
                    };
                    commitFutures.add(commitExecutor.submit(task));
                }

                for (Future<Void> future : commitFutures) {
                    try {
                        future.get(30, TimeUnit.SECONDS); // Timeout after 30 seconds per task
                    } catch (TimeoutException e) {
                        throw new ApiException(504, "Timeout while processing commits for repo " + repo.getName() + ": " + e.getMessage());
                    } catch (Exception e) {
                        throw new ApiException(500, "Error processing commits for repo " + repo.getName() + ": " + e.getMessage());
                    }
                }

                commitExecutor.shutdown();
                try {
                    if (!commitExecutor.awaitTermination(60, TimeUnit.SECONDS)) {
                        commitExecutor.shutdownNow();
                        throw new ApiException(504, "Commit processing tasks did not complete within 60 seconds for repo " + repo.getName());
                    }
                } catch (InterruptedException e) {
                    commitExecutor.shutdownNow();
                    Thread.currentThread().interrupt();
                    throw new ApiException(500, "Commit processing interrupted for repo " + repo.getName() + ": " + e.getMessage());
                }
            }

            Map<String, Integer> frameworkToFileCounts = new HashMap<>();
            for (Map.Entry<String, Set<String>> entry : globalFrameworkToFiles.entrySet()) {
                frameworkToFileCounts.put(entry.getKey(), entry.getValue().size());
            }

            return frameworkToFileCounts;

        } catch (ApiException e) {
            throw e;
        } catch (Exception e) {
            throw new ApiException(500, "Unexpected error while counting framework files: " + e.getMessage());
        }
    }

    public List<String> getFrameworkFromRepository(RepositoryInfo repo, String owner, String accessToken) {
        try {
            if (repo == null || repo.getName() == null || repo.getDefaultBranch() == null) {
                throw new ApiException(400, "Invalid repository information");
            }
            if (owner == null || owner.isEmpty()) {
                throw new ApiException(400, "Repository owner is required");
            }
            if (accessToken == null || accessToken.isEmpty()) {
                throw new ApiException(400, "GitHub access token is required");
            }

            String url = "https://api.github.com/repos/" + owner + "/" + repo.getName() + "/git/trees/" + repo.getDefaultBranch() + "?recursive=1";
            HttpHeaders headers = new HttpHeaders();
            headers.setBearerAuth(accessToken);
            HttpEntity<String> entity = new HttpEntity<>(headers);

            ResponseEntity<JsonNode> response;
            try {
                response = restTemplate.exchange(url, HttpMethod.GET, entity, JsonNode.class);
            } catch (HttpClientErrorException e) {
                if (e.getStatusCode() == HttpStatus.UNAUTHORIZED) {
                    throw new ApiException(401, "Invalid GitHub access token while fetching repository tree for " + repo.getName());
                } else if (e.getStatusCode() == HttpStatus.TOO_MANY_REQUESTS) {
                    throw new ApiException(429, "GitHub API rate limit exceeded while fetching repository tree for " + repo.getName());
                }
                throw new ApiException(500, "GitHub API error while fetching repository tree for " + repo.getName() + ": " + e.getMessage());
            } catch (RestClientException e) {
                throw new ApiException(503, "Failed to connect to GitHub API for repository " + repo.getName() + ": " + e.getMessage());
            }

            JsonNode tree = response.getBody();
            if (tree == null || !tree.has("tree")) {
                throw new ApiException(404, "No tree data found for repository: " + repo.getName());
            }

            List<String> configFilesToLookFor = new ArrayList<>();
            for (RepositoryInfo.Language lang : repo.getTopLanguages()) {
                String languageName = lang.getName();
                if (Mappings.LANGUAGE_TO_CONFIG.containsKey(languageName)) {
                    configFilesToLookFor.addAll(Mappings.LANGUAGE_TO_CONFIG.get(languageName));
                }
            }

            List<String> configFilePaths = new ArrayList<>();
            for (JsonNode item : tree.get("tree")) {
                if (item.get("type").asText().equals("blob")) {
                    String filePath = item.get("path").asText();
                    for (String configFile : configFilesToLookFor) {
                        if (filePath.endsWith(configFile)) {
                            configFilePaths.add(filePath);
                            break;
                        }
                    }
                }
            }

            List<String> detectedFrameworks = new ArrayList<>();
            for (String configPath : configFilePaths) {
                String configFileName = configPath.substring(configPath.lastIndexOf("/") + 1);
                if (!Mappings.CONFIG_TO_DEPENDENCY_FRAMEWORK.containsKey(configFileName)) {
                    continue; // Skip if no mapping exists
                }

                String contentUrl = "https://api.github.com/repos/" + owner + "/" + repo.getName() + "/contents/" + configPath + "?ref=" + repo.getDefaultBranch();
                ResponseEntity<JsonNode> contentResponse;
                try {
                    contentResponse = restTemplate.exchange(contentUrl, HttpMethod.GET, entity, JsonNode.class);
                } catch (HttpClientErrorException e) {
                    if (e.getStatusCode() == HttpStatus.UNAUTHORIZED) {
                        throw new ApiException(401, "Invalid GitHub access token while fetching content for " + configPath);
                    } else if (e.getStatusCode() == HttpStatus.TOO_MANY_REQUESTS) {
                        throw new ApiException(429, "GitHub API rate limit exceeded while fetching content for " + configPath);
                    }
                    throw new ApiException(500, "GitHub API error while fetching content for " + configPath + ": " + e.getMessage());
                } catch (RestClientException e) {
                    throw new ApiException(503, "Failed to connect to GitHub API for content " + configPath + ": " + e.getMessage());
                }

                JsonNode contentNode = contentResponse.getBody();
                if (contentNode == null || !contentNode.has("content")) {
                    continue; // Skip if no content is found
                }

                String contentBase64 = contentNode.get("content").asText();
                contentBase64 = contentBase64.replaceAll("\n", "");
                String content;
                try {
                    content = new String(Base64.getDecoder().decode(contentBase64));
                } catch (IllegalArgumentException e) {
                    throw new ApiException(500, "Failed to decode Base64 content for file " + configPath + ": " + e.getMessage());
                }

                List<Mappings.DependencyFramework> dependencyFrameworks = Mappings.CONFIG_TO_DEPENDENCY_FRAMEWORK.get(configFileName);
                for (Mappings.DependencyFramework df : dependencyFrameworks) {
                    if (df.getChecker().test(content, df.getDependency())) {
                        detectedFrameworks.add(df.getFramework());
                    }
                }
            }

            return detectedFrameworks;
        } catch (ApiException e) {
            throw e;
        } catch (Exception e) {
            throw new ApiException(500, "Unexpected error while detecting frameworks for repository " + (repo != null ? repo.getName() : "unknown") + ": " + e.getMessage());
        }
    }
}