package com.spring.codeamigosbackend.personalchat.model;


import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Data;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.util.ArrayList;
import java.util.List;

@Data
@Document(collection = "personal_chat")
public class PersonalChat {
    @Id
    private String id;
    @JsonProperty("chatId")
    private String member1Id;
    @JsonProperty("userId")
    private String member2Id;
    private String secretKey; // Encrypted with the receiver's public key
    private List<Message> messages = new ArrayList<>();
}