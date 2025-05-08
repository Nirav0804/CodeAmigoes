package com.spring.codeamigosbackend.recommendation.repositories;

import com.spring.codeamigosbackend.recommendation.models.UserFrameworkStats;
import org.springframework.data.mongodb.repository.MongoRepository;

public interface UserFrameworkStatsRepository extends MongoRepository<UserFrameworkStats,String> {
    UserFrameworkStats getUserFrameworkStatsByUserId(String userId);
}
