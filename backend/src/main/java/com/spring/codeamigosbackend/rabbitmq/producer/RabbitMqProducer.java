package com.spring.codeamigosbackend.rabbitmq.producer;

import com.spring.codeamigosbackend.recommendation.dtos.GithubScoreRequest;
import com.spring.codeamigosbackend.recommendation.models.UserFrameworkStats;
import com.spring.codeamigosbackend.recommendation.repositories.UserFrameworkStatsRepository;
import com.spring.codeamigosbackend.recommendation.utils.ApiException;
import com.spring.codeamigosbackend.registration.model.User;
import com.spring.codeamigosbackend.registration.repository.UserRepository;
import io.github.cdimascio.dotenv.Dotenv;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class RabbitMqProducer {

    private final UserRepository userRepository;
    private final UserFrameworkStatsRepository statsRepository;
    private Dotenv dotenv = Dotenv.load();

    private final RabbitTemplate rabbitTemplate;
    private static final Logger logger = LoggerFactory.getLogger(RabbitMqProducer.class);

    private final String exchangeName =  dotenv.get("rabbitmq.exchange") ;
    private final String routingKey = dotenv.get("rabbitmq.routingKey") ;

    public void sendUserToQueue(GithubScoreRequest user) {
        User user1 = userRepository.findByUsername(user.getUsername())
                .orElseThrow(() -> new ApiException(404, "User not found"));
        Optional<UserFrameworkStats> optionalUserFrameworkStats = this.statsRepository.findByUserId(user1.getId());
        if (optionalUserFrameworkStats.isPresent()) {
            UserFrameworkStats userFrameworkStat = optionalUserFrameworkStats.get();
            LocalDateTime lastUpdated = userFrameworkStat.getLastUpdated();
            if (lastUpdated != null) {
                // Check if lastUpdated is within the last 6 hours
                LocalDateTime sixHoursAgo = LocalDateTime.now().minusHours(6);
                if (lastUpdated.isAfter(sixHoursAgo)) {
                    logger.info("User {} framework stats were updated recently at {}. Skipping queue send.",
                            user.getUsername(), lastUpdated);
                    return; // Skip sending to queue if updated within last 6 hours
                }
            }
        }
        logger.info("Sending user {} to queue", user.getUsername());
        rabbitTemplate.convertAndSend(exchangeName, routingKey, user);
    }
}