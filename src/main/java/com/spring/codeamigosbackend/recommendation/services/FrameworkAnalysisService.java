package com.spring.codeamigosbackend.recommendation.services;
import com.spring.codeamigosbackend.recommendation.dtos.GithubScoreRequest;
import com.spring.codeamigosbackend.recommendation.dtos.RepositoryInfo;
import com.spring.codeamigosbackend.recommendation.models.UserFrameworkStats;
import com.spring.codeamigosbackend.recommendation.repositories.UserFrameworkStatsRepository;
import com.spring.codeamigosbackend.recommendation.utils.ApiException;
import com.spring.codeamigosbackend.registration.model.User;
import com.spring.codeamigosbackend.registration.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.*;

@Service
@RequiredArgsConstructor
public class FrameworkAnalysisService {

    private final GithubApiService githubApiService;
    private final UserFrameworkStatsRepository userFrameworkStatsRepository;
    private final UserRepository userRepository;

    public UserFrameworkStats getStats(String username) {
        return null;
    }
    @Async
    public void analyseUserFrameworkStats(GithubScoreRequest request) {
        // Validate request
        if (request.getUsername() == null || request.getAccessToken() == null) {
            throw new ApiException(400, "Username and access token are required");
        }

        // Step 1: Fetch the top repositories for the user
        List<RepositoryInfo> repositories = githubApiService.getTopRepositories(
                request.getUsername(),
                request.getEmail(),
                request.getAccessToken()
        );

        if (repositories.isEmpty()) {
            throw new ApiException(404, "No repositories found for user: " + request.getUsername());
        }

        // Step 2: Detect frameworks for the repositories
        Map<RepositoryInfo, List<String>> repoToFrameworks = githubApiService.getFrameworksForRepositories(
                repositories,
                request.getUsername(),
                request.getAccessToken()
        );

        // Step 3: Count files associated with each framework
        Map<String, Integer> frameworkToFileCounts = githubApiService.countFrameworkFiles(
                repoToFrameworks,
                request.getUsername(),
                request.getAccessToken()
        );
        Optional<User> user = this.userRepository.findByUsername(request.getUsername());
        User user1 = null;
        if (user.isPresent()) {
            user1 = user.get();
        }else{
            throw new ApiException(404, "No user found for user: " + request.getUsername());
        }
        UserFrameworkStats userFrameworkStats = new UserFrameworkStats();
        userFrameworkStats.setUserId(user1.getId());
        userFrameworkStats.setFrameworkUsage(frameworkToFileCounts);
        userFrameworkStats.setLastUpdated(LocalDateTime.now());
        this.userFrameworkStatsRepository.save(userFrameworkStats);
        System.out.println(frameworkToFileCounts);
    }
}
