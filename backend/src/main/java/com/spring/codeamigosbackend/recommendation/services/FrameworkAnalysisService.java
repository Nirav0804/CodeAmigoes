package com.spring.codeamigosbackend.recommendation.services;
import com.spring.codeamigosbackend.recommendation.dtos.GithubScoreRequest;
import com.spring.codeamigosbackend.recommendation.dtos.RepositoryInfo;
import com.spring.codeamigosbackend.recommendation.models.UserFrameworkStats;
import com.spring.codeamigosbackend.recommendation.repositories.UserFrameworkStatsRepository;
import com.spring.codeamigosbackend.recommendation.utils.ApiException;
import com.spring.codeamigosbackend.registration.model.User;
import com.spring.codeamigosbackend.registration.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.amqp.rabbit.annotation.RabbitListener;
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
    private static final Logger logger = LoggerFactory.getLogger(FrameworkAnalysisService.class);

    public void analyseUserFrameworkStats(GithubScoreRequest request) {
        // Validate request
        System.out.println(request);
        logger.info("Analysing user framework stats"+request);
        if (request.getUsername() == null || request.getAccessToken() == null) {
            throw new ApiException(400, "Username and access token are required");
        }

        // Step 1: Fetch the top repositories for the user
        List<RepositoryInfo> repositories = githubApiService.getTopRepositories(
                request.getUsername(),
                request.getEmail(),
                request.getAccessToken()
        );
        logger.info(repositories.toString());
        if (repositories.isEmpty()) {
            throw new ApiException(404, "No repositories found for user: " + request.getUsername());
        }

        // Step 2: Detect frameworks for the repositories
        Map<RepositoryInfo, List<String>> repoToFrameworks = githubApiService.getFrameworksForRepositories(
                repositories,
                request.getUsername(),
                request.getAccessToken()
        );
        System.out.println("Frameworks in repos: "+ repoToFrameworks.keySet().stream().map(RepositoryInfo::getName).toList().toString());
        logger.info(repoToFrameworks.values().toString());
        // Step 3: Count files associated with each framework
        Map<String, Integer> frameworkToFileCounts = githubApiService.countFrameworkFiles(
                repoToFrameworks,
                request.getUsername(),
                request.getAccessToken()
        );
        logger.info("Framework to file count {} ",frameworkToFileCounts.toString());
        Optional<User> user = this.userRepository.findByUsername(request.getUsername());
        User user1 = null;
        if (user.isPresent()) {
            user1 = user.get();
        }else{
            throw new ApiException(404, "No user found for user: " + request.getUsername());
        }
//        // If framework stats already present then delete them
//        if (this.userFrameworkStatsRepository.getUserFrameworkStatsByUserId(user1.getId()) != null) {
//            this.userFrameworkStatsRepository.delete(this.userFrameworkStatsRepository.getUserFrameworkStatsByUserId(user1.getId()));
//        }

        UserFrameworkStats userFrameworkStats = new UserFrameworkStats();
        userFrameworkStats.setUserId(user1.getId());
        userFrameworkStats.setFrameworkUsage(frameworkToFileCounts);
        userFrameworkStats.setLastUpdated(LocalDateTime.now());
        Optional<User> optionalUser2 = this.userRepository.findByUsername(request.getUsername());
        if(optionalUser2.isPresent() && !frameworkToFileCounts.isEmpty() && frameworkToFileCounts != null ){
            logger.info("Found existing user: "+optionalUser2.get().getUsername());
            User user2 = optionalUser2.get();
            Optional<UserFrameworkStats> optionalUserFrameworkStats = this.userFrameworkStatsRepository.findByUserId(user1.getId());
            if(optionalUserFrameworkStats.isPresent()){
                logger.info("Found existing user framework stats: "+optionalUserFrameworkStats.get().getFrameworkUsage());
                UserFrameworkStats userFrameworkStats2 = optionalUserFrameworkStats.get();
                userFrameworkStats2.setFrameworkUsage(frameworkToFileCounts);
                userFrameworkStats2.setLastUpdated(LocalDateTime.now());
                this.userFrameworkStatsRepository.save(userFrameworkStats2);
                return ;
            }
        }
        logger.info("Saving user framework stats: {}", userFrameworkStats);
        UserFrameworkStats savedUserFrameworks =  this.userFrameworkStatsRepository.save(userFrameworkStats);
        logger.info("Saved user Frameworks: {}", savedUserFrameworks);
    }

    public UserFrameworkStats getUserFrameworkStats(String username) {
        User user = this.userRepository.findByUsername(username).get();
        UserFrameworkStats stats =  this.userFrameworkStatsRepository.findByUserId(user.getId()).get();
        logger.info("Found user framework stats: {}", stats);
        return stats;
    }

    @RabbitListener(queues = {"${rabbitmq.queue}"})
    public void calculateUserFrameworkStats(GithubScoreRequest request) {
        try{
            logger.info("Processing message for user: {}", request.getUsername());
            this.analyseUserFrameworkStats(request);
        }catch (Exception e){
            logger.error("Error processing message for user {}: {}", request.getUsername(), e.getMessage());
            throw e; // Rethrow to trigger retry mechanism Thus necessary for retry
        }
    }
}