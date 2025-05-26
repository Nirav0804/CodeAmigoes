package com.spring.codeamigosbackend.recommendation.dtos;

import lombok.*;

@Data
@AllArgsConstructor
@NoArgsConstructor
public  class GithubScoreRequest {
    private String username;
    private String email;
    private String accessToken;
}