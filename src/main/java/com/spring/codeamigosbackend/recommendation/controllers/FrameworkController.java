package com.spring.codeamigosbackend.recommendation.controllers;

import com.spring.codeamigosbackend.recommendation.dtos.GithubScoreRequest;
import com.spring.codeamigosbackend.recommendation.services.FrameworkAnalysisService;
import com.spring.codeamigosbackend.recommendation.utils.ApiException;
import com.spring.codeamigosbackend.recommendation.utils.ApiResponse;
import lombok.RequiredArgsConstructor;

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

    /**
     * Endpoint to fetch GitHub repositories, detect frameworks, and count associated files for scoring.
     * @param request Request body containing GitHub username, email, and access token
     * @return ResponseEntity containing an ApiResponse with a map of frameworks to their file counts
     */
    @PostMapping("/score")
    public ResponseEntity<ApiResponse> setGithubScore(@RequestBody GithubScoreRequest request) {
        try {
            System.out.println(request);
            frameworkAnalysisService.analyseUserFrameworkStats(request);
            return ResponseEntity.status(200)
                    .body(new ApiResponse(200, null, "Top repositories fetched successfully"));
        } catch (ApiException e) {
            return ResponseEntity.status(e.getStatusCode())
                    .body(new ApiResponse(e.getStatusCode(), null, e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.status(500)
                    .body(new ApiResponse(500, null, "Error: " + e.getMessage()));
        }
    }
}