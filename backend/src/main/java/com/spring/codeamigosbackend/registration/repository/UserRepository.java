package com.spring.codeamigosbackend.registration.repository;

import com.spring.codeamigosbackend.registration.model.User;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface UserRepository extends MongoRepository<User, java.lang.String> {
    Optional<User> findByUsername(java.lang.String username);
    boolean existsByUsername(java.lang.String username);
    Optional<User> findById(java.lang.String id);

    List<User> findAllById(List<User> userid);
    Optional<User> findByGithubId(int githubId);
    Optional<User> findByGithubUsername(String githubUsername);
}