package com.spring.codeamigosbackend.rabbitmq;

import com.spring.codeamigosbackend.rabbitmq.producer.RabbitMqProducer;
import com.spring.codeamigosbackend.recommendation.dtos.GithubScoreRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequiredArgsConstructor
public class RabbitController {
    private final RabbitMqProducer rabbitMqProducer;
    @PostMapping("/put-to-queue")
    public void putToQueue(@RequestBody GithubScoreRequest githubScoreRequest) {
        rabbitMqProducer.sendUserToQueue(githubScoreRequest);
    }
}