package com.spring.codeamigosbackend.registration.model;


import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.validation.constraints.Pattern;
import org.springframework.data.annotation.Id;
import org.springframework.data.annotation.Transient;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;
import lombok.Data;
import jakarta.validation.constraints.NotBlank;

@Data
@Document(collection = "users")
public class User {
    @Id
    private String id;

    @NotBlank(message = "Username is required")
    private String username;

    @NotBlank(message = "Display name is required")
    private String displayName;

    @Transient
    private String password;

    @Pattern(
            regexp = "^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,6}$",
            message = "Invalid email format"
    )
    @NotBlank(message = "Email is required")
    private String email;



    private String githubUsername;
    private String leetcodeUsername;
    private String codechefUsername;

    //new
    private String bio;
    private String linkedinurl;
    private String twitterusername;
    private String instagramusername;
    private String portfolioUrl;
    private String resumeUrl;
    private String gifUrl;
    private String coverPhotoUrl;
    private String emoji;

    //Oauth2
    @Indexed(unique = true)
    private int githubId;
    private String githubAccessToken;
    private String githubAvatarUrl;
//    private String githubUser;
    private boolean isProfileComplete = false;

    private String status = "not paid";

    @JsonProperty("publicKey")  // matches frontend JSON property name
    private String rsaPublicKey; // store PEM string here

     // evaluate false
        public void evaluateProfileCompletion() {
            boolean complete =
                    this.username != null && !this.username.trim().isEmpty() &&
                            this.displayName != null && !this.displayName.trim().isEmpty() &&
                            this.email != null && !this.email.trim().isEmpty() &&
                            this.githubUsername != null && !this.githubUsername.trim().isEmpty() &&
                            this.leetcodeUsername != null && !this.leetcodeUsername.trim().isEmpty() &&
                            this.codechefUsername != null && !this.codechefUsername.trim().isEmpty();

            this.isProfileComplete =complete;
    }
}
