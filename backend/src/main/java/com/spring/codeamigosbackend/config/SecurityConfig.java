package com.spring.codeamigosbackend.config;

import com.spring.codeamigosbackend.OAuth2.filter.JwtAuthenticationFilter;
import com.spring.codeamigosbackend.OAuth2.service.CustomOAuth2UserService;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.Http403ForbiddenEntryPoint;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.security.web.authentication.logout.SecurityContextLogoutHandler;

@EnableMethodSecurity
@Configuration
public class SecurityConfig {

    private final CustomOAuth2UserService customOAuth2UserService;

    @Autowired
    public SecurityConfig(CustomOAuth2UserService customOAuth2UserService) {
        this.customOAuth2UserService = customOAuth2UserService;
    }

    @Bean
    public JwtAuthenticationFilter jwtAuthenticationFilter() {
        return new JwtAuthenticationFilter();
    }

    private static final String[] PUBLIC_URLS = {
            "/api/v3/auth",
            "/swagger-ui/**",
            "/v3/api-docs/**",
            "/swagger-resources/**",
            "/v3/api-docs.yaml",
            "/swagger-ui.html"
    };

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http, CustomCorsConfiguration corsConfig) throws Exception {
        http
                .cors(c -> c.configurationSource(corsConfig))
                .csrf(csrf -> csrf.disable())
                .authorizeHttpRequests(auth -> auth
                        .requestMatchers(
                                "/","/api/users/login","/api/users/me", "/register/", "/oauth2/authorization/", "/login/oauth2/code/", "/request/", "/requests/","/api/users/register","/api/users/ping"
                        ).permitAll()
                        .requestMatchers(PUBLIC_URLS).permitAll()
                        .requestMatchers(HttpMethod.OPTIONS, "/**").permitAll()
                        .requestMatchers("/oauth2/success").authenticated()
                        .requestMatchers("/api/hackathons/recommended-hackathons", "/api/hackathons/nearby-hackathons")
                        .hasAuthority("PAID")
                        .anyRequest().authenticated()
                )
                .exceptionHandling(exception -> exception
                        // Return 403 Forbidden instead of redirecting to login page for unauthenticated requests
                        .authenticationEntryPoint(new Http403ForbiddenEntryPoint())
                        // Return 403 Forbidden with message when access is denied (authorization failure)
                        .accessDeniedHandler((request, response, accessDeniedException) -> {
                            response.sendError(HttpServletResponse.SC_FORBIDDEN, "Access Denied");
                        })
                )
                .oauth2Login(oauth -> oauth
                        .userInfoEndpoint(userInfo -> userInfo.userService(customOAuth2UserService))
                        .defaultSuccessUrl("/oauth2/success", true)
                )
                .logout(logout -> logout
                        .logoutUrl("/logout")
                        .logoutSuccessHandler((request, response, authentication) -> {
                            response.setStatus(HttpServletResponse.SC_OK);
                            response.getWriter().write("Logged out successfully");
                        })
                        .addLogoutHandler(new SecurityContextLogoutHandler())
                        .invalidateHttpSession(true)
                        .deleteCookies("jwtToken")
                        .permitAll()
                )
                .sessionManagement(session -> session
                        .sessionCreationPolicy(SessionCreationPolicy.IF_REQUIRED)
                        .maximumSessions(1)
                        .expiredUrl("/login?expired")
                        .and()
                        .invalidSessionUrl("/login?invalid")
                )
                // Add your JWT filter BEFORE UsernamePasswordAuthenticationFilter
                .addFilterBefore(jwtAuthenticationFilter(), UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }
}