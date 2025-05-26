package com.spring.codeamigosbackend.recommendation.controllers;

import com.spring.codeamigosbackend.recommendation.dtos.GithubScoreRequest;
import com.spring.codeamigosbackend.recommendation.services.FrameworkAnalysisService;
import com.spring.codeamigosbackend.recommendation.utils.ApiException;
import com.spring.codeamigosbackend.recommendation.utils.ApiResponse;
import lombok.RequiredArgsConstructor;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.amqp.rabbit.annotation.RabbitListener;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/frameworks")
@RequiredArgsConstructor
public class FrameworkController {

    private final FrameworkAnalysisService frameworkAnalysisService;
    private static Logger logger = LoggerFactory.getLogger(FrameworkController.class);

    /**
     * Endpoint to fetch GitHub repositories, detect frameworks, and count associated files for scoring.
     * @param request Request body containing GitHub username, email, and access token
     * @return ResponseEntity containing an ApiResponse with a map of frameworks to their file counts
     */
    @RabbitListener(queues = {"${RABBITMQ_QUEUE}"})
    public void setGithubScore(@RequestBody GithubScoreRequest request) {
        try {
            System.out.println(request.getUsername());
            frameworkAnalysisService.analyseUserFrameworkStats(request);
        } catch (ApiException e) {
            logger.error(e.getMessage());
        } catch (Exception e) {
            logger.error(e.getMessage());
        }
    }
}