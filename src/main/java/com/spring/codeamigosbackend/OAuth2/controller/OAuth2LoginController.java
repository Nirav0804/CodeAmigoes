package com.spring.codeamigosbackend.OAuth2.controller;


import com.spring.codeamigosbackend.registration.model.User;
import com.spring.codeamigosbackend.registration.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.oauth2.client.authentication.OAuth2AuthenticationToken;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.view.RedirectView;

import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/oauth2")
@CrossOrigin("*")
public class OAuth2LoginController {

    @Autowired
    private UserRepository userRepository;

    @GetMapping("/success")
    public RedirectView oauth2Success(OAuth2AuthenticationToken authentication) {
        System.out.println("==== /oauth2/success endpoint HIT ====");
        OAuth2User oAuth2User = authentication.getPrincipal();

        int githubId = oAuth2User.getAttribute("id");
        String githubUsername = oAuth2User.getAttribute("login");
        String email = oAuth2User.getAttribute("email");
        String avatarUrl = oAuth2User.getAttribute("avatar_url");

        Optional<User> optionalUser = userRepository.findByGithubId(githubId);

        User user;
        if (optionalUser.isPresent()) {
            user = optionalUser.get();
        } else {
            // First time login via GitHub
            user = new User();
            user.setGithubId(githubId);
            user.setGithubUsername(githubUsername);
            user.setGithubAvatarUrl(avatarUrl);
            user.setEmail(email != null ? email : githubUsername + "@github.com");
            user.setProfileComplete(false); // force profile completion
            userRepository.save(user);
        }
        System.out.println("Authentication Token: " + authentication);
        System.out.println("OAuth2 User: " + oAuth2User.getAttributes());

        user.evaluateProfileCompletion();

        if (!user.isProfileComplete()) {

            // redirect to frontend register form
            String redirectUrl = String.format(
                    "http://localhost:5173/register?oauth=true&username=%s&id=%s",
                    githubUsername, user.getId()
            );
            return new RedirectView(redirectUrl);
//            return new RedirectView("http://localhost:5173/register?oauth=true&userId=" + user.getId());
        }

        String redirectUrl = String.format(
                "http://localhost:5173/dashboard?username=%s&userId=%s&githubUsername=%s",
                user.getUsername(),user.getId(),user.getGithubUsername()
        );
        return new RedirectView(redirectUrl);
    }
}