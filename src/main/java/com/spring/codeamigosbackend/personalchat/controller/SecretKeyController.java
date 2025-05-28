package com.spring.codeamigosbackend.personalchat.controller;

import com.spring.codeamigosbackend.personalchat.model.PersonalChat;
import com.spring.codeamigosbackend.personalchat.repository.PersonalChatRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Arrays;
import java.util.Optional;

@RestController
@RequestMapping("/api")
public class SecretKeyController {
    private final PersonalChatRepository personalChatRepository;

    @Autowired
    public SecretKeyController(PersonalChatRepository personalChatRepository) {
        this.personalChatRepository = personalChatRepository;
    }

    @PostMapping("/secret_key/{member1Id}/{member2Id}/")
    public ResponseEntity<?> setSecretKey(
            @PathVariable String member1Id,
            @PathVariable String member2Id,
            @RequestBody String secretKey) {
        // Use findByMemberIds to look up the chat
        Optional<PersonalChat> chat = this.personalChatRepository.findByMemberIds(member1Id, member2Id);
        System.out.println("Looking for chat with member1Id: " + member1Id + ", member2Id: " + member2Id);
        if (chat.isPresent()) {
            chat.get().setSecretKey(secretKey);
            this.personalChatRepository.save(chat.get());
            System.out.println("Updated secret key for chat with _id: " + chat.get().getId());
            return ResponseEntity.ok().build();
        } else {
            System.out.println("Chat not found for member1Id: " + member1Id + ", member2Id: " + member2Id);
            return ResponseEntity.status(404).body("Chat not found");
        }
    }

    @GetMapping("/secret_key/{member1Id}/{member2Id}/")
    public ResponseEntity<?> getSecretKey(
            @PathVariable String member1Id,
            @PathVariable String member2Id) {
        // Use findByMemberIds to look up the chat
        Optional<PersonalChat> chat = this.personalChatRepository.findByMemberIds(member1Id, member2Id);
        System.out.println("Looking for chat with member1Id: " + member1Id + ", member2Id: " + member2Id);
        if (chat.isPresent()) {
            String secretKey = chat.get().getSecretKey();
            System.out.println("Found chat with _id: " + chat.get().getId() + ", secretKey: " + secretKey);
            this.personalChatRepository.save(chat.get());
            return ResponseEntity.ok(secretKey); // Return the secretKey in the response body
        } else {
            System.out.println("Chat not found for member1Id: " + member1Id + ", member2Id: " + member2Id);
            return ResponseEntity.status(404).body("Chat not found");
        }
    }
}