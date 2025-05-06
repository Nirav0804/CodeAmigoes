package com.spring.codeamigosbackend.OAuth2.service;


import com.spring.codeamigosbackend.registration.model.User;
import com.spring.codeamigosbackend.registration.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.oauth2.client.userinfo.DefaultOAuth2UserService;
import org.springframework.security.oauth2.client.userinfo.OAuth2UserRequest;
import org.springframework.security.oauth2.core.OAuth2AuthenticationException;
import org.springframework.security.oauth2.core.user.DefaultOAuth2User;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.stereotype.Service;

import java.util.Collections;
import java.util.Map;
import java.util.Optional;

@Service
public class CustomOAuth2UserService extends DefaultOAuth2UserService {

    @Autowired
    private UserRepository userRepository;

    @Override
    public OAuth2User loadUser(OAuth2UserRequest userRequest) throws OAuth2AuthenticationException {
        OAuth2User oAuth2User = super.loadUser(userRequest);

        Map<String, Object> attributes = oAuth2User.getAttributes();

        int githubId = (int) attributes.get("id");
        String githubLogin = (String) attributes.get("login");
        String avatarUrl = (String) attributes.get("avatar_url");
        String email = (String) attributes.get("email"); // May be null if not public

        String accessToken = userRequest.getAccessToken().getTokenValue();

        Optional<User> optionalUser = userRepository.findByGithubId(githubId);

        User user;
        if (optionalUser.isPresent()) {
            user = optionalUser.get();
        } else {
            // First time GitHub login: create a new user
            user = new User();
            user.setGithubId(githubId);
            user.setGithubUsername(githubLogin);
            user.setGithubAvatarUrl(avatarUrl);
            user.setGithubAccessToken(accessToken);
            user.setEmail(email != null ? email : githubLogin + "@github.com");
            user.setProfileComplete(false); // Mark incomplete so frontend shows registration form
        }

        // Save any updates (token, avatar, etc.)
        userRepository.save(user);

        return new DefaultOAuth2User(
                Collections.singleton(new SimpleGrantedAuthority("ROLE_USER")),
                attributes,
                "login" // This is the unique identifier key in the GitHub response
        );
    }
}