package com.spring.codeamigosbackend.registration.service;


import com.spring.codeamigosbackend.registration.model.User;
import com.spring.codeamigosbackend.registration.repository.UserRepository;
import com.spring.codeamigosbackend.registration.exception.UserAlreadyExistsException;
import com.spring.codeamigosbackend.registration.exception.InvalidCredentialsException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Slf4j
@RequiredArgsConstructor
@Service
public class UserService {

    private final UserRepository userRepository;


    // Register new user
    public User registerUser(User user) {
        if (userRepository.existsByUsername(user.getUsername())) {
            throw new UserAlreadyExistsException("Username already exists: " + user.getUsername());
        }

        User user1 = userRepository.save(user);
        return user1;
    }

    // Authenticate user (login)
    public User authenticateUser(java.lang.String username, java.lang.String password) {
        Optional<User> userOptional = userRepository.findByUsername(username);

        if (userOptional.isEmpty()) {
            throw new InvalidCredentialsException("Invalid username.");
        }

        User user = userOptional.get();

        // Check if provided password matches (consider hashing for production)
        if (!user.getPassword().equals(password)) {
            throw new InvalidCredentialsException("Invalid password.");
        }

        return user;
    }

    // Get user details by username
    public User getUserByUsername(java.lang.String username) {
        return userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("User not found: " + username));
    }

    public User updateUser(User user, java.lang.String username) {
        Optional<User> userOptional = userRepository.findByUsername(username);
        if (userOptional.isPresent()) {
            User userToUpdate = userOptional.get();

            if(user.getUsername()!=null) {
                if (userRepository.existsByUsername(user.getUsername())) {
                    throw new UserAlreadyExistsException("Username already exists: " + user.getUsername());
                }
                userToUpdate.setUsername(user.getUsername());
            }

            if (user.getDisplayName() != null) {
                userToUpdate.setDisplayName(user.getDisplayName());
            }
            if (user.getEmail() != null) {
                userToUpdate.setEmail(user.getEmail());
            }
            if (user.getPassword() != null) {
                userToUpdate.setPassword(user.getPassword());
            }
            if (user.getBio() != null) {
                userToUpdate.setBio(user.getBio());
            }
            if (user.getGithubUsername() != null) {
                userToUpdate.setGithubUsername(user.getGithubUsername());
            }
            if (user.getLeetcodeUsername() != null) {
                userToUpdate.setLeetcodeUsername(user.getLeetcodeUsername());
            }
            if (user.getLinkedinurl() != null) {
                userToUpdate.setLinkedinurl(user.getLinkedinurl());
            }
            if (user.getCodechefUsername() != null) {
                userToUpdate.setCodechefUsername(user.getCodechefUsername());
            }
            if (user.getInstagramusername() != null) {
                userToUpdate.setInstagramusername(user.getInstagramusername());
            }
            if (user.getTwitterusername() != null) {
                userToUpdate.setTwitterusername(user.getTwitterusername());
            }
            if(user.getResumeUrl()!=null) {
                userToUpdate.setResumeUrl(user.getResumeUrl());
            }
            if(user.getPortfolioUrl()!=null) {
                userToUpdate.setPortfolioUrl(user.getPortfolioUrl());
            }
            if(user.getGifUrl()!=null) {
                userToUpdate.setGifUrl(user.getGifUrl());
            }
            if (user.getCoverPhotoUrl() != null) {
                userToUpdate.setCoverPhotoUrl(user.getCoverPhotoUrl());
            }
            if(user.getEmoji()!=null) {
                userToUpdate.setEmoji(user.getEmoji());
            }
            return userRepository.save(userToUpdate);
        }
        return null;
    }

    public List<User> getAllUsers() {
        return userRepository.findAll();
    }

    public List<java.lang.String> getAllUsersId(){
        return userRepository.findAll().stream().map(User::getId).collect(Collectors.toList());
    }

    public List<User> getAllUsersById(List<String> userid) {
        return userRepository.findAllById(userid);
    }
    public Optional<User> getUserById(java.lang.String id) {
        return userRepository.findById(id);
    }
    public String getCurrentUserId() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        log.info("Current user id: {}", authentication.getPrincipal());
        return (String) authentication.getPrincipal(); // This is the userId set in the filter
    }
}

