package com.spring.codeamigosbackend.recommendation.dtos;

import lombok.*;

@Getter
@Setter
@ToString
@AllArgsConstructor
@NoArgsConstructor
public  class GithubScoreRequest {
    private String username;
    private String email;
    private String accessToken;

}