package com.spring.codeamigosbackend.personalchat.controller;

import com.spring.codeamigosbackend.personalchat.dto.PersonalChatResponseDto;
import com.spring.codeamigosbackend.personalchat.model.Message;
import com.spring.codeamigosbackend.personalchat.repository.PersonalChatRepository;
import com.spring.codeamigosbackend.personalchat.service.PersonalChatService;
import com.spring.codeamigosbackend.personalchat.model.PersonalChat;
import com.spring.codeamigosbackend.registration.model.User;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Optional;

@RequiredArgsConstructor
@RestController
@RequestMapping("/api/v1/personal_chat")
@CrossOrigin(origins = "http://localhost:5173/", allowedHeaders = "*",allowCredentials = "true")
public class PersonalChatController {
    private final PersonalChatService personalChatService;
    private final PersonalChatRepository personalChatRepository;

    @PostMapping("/create_or_get_personal_chat/{member1Id}/{member2Id}")
    public ResponseEntity<?> createOrGetPersonalChat(@PathVariable String member1Id, @PathVariable String member2Id) {
        return ResponseEntity.ok(personalChatService.createOrGetPersonalChat(member1Id, member2Id));
    }

    @GetMapping("/{member1Id}/{member2Id}/messages")
    public ResponseEntity<?> getPersonalChatMessages(@PathVariable String member1Id, @PathVariable String member2Id,@RequestParam(value = "page", defaultValue = "0", required = false) int page,
                                                     @RequestParam(value = "size", defaultValue = "20", required = false) int size) {
        List<Message> messages = personalChatService.getPersonalChatMessages(member1Id,member2Id);
        if(messages == null || messages.isEmpty()) {
            return ResponseEntity.noContent().build();
        }
        return ResponseEntity.ok(messages);
    }

    @GetMapping("/all_personal_chats/{memberId}")
    public ResponseEntity<?> getAllPersonalChatsOfAMember(@PathVariable String memberId) {
        System.out.println("getAllPersonalChatsOfAMember");
        List<PersonalChatResponseDto> personalChats = personalChatService.getPersonalChatsOfaMember(memberId);
        if(personalChats == null || personalChats.isEmpty()) {
            return ResponseEntity.noContent().build();
        }
        return ResponseEntity.ok(personalChats);
    }

    @GetMapping("/all_messages/{member1Id}/{member2Id}")
    public ResponseEntity<?> getAllMessageOfAPersonalChat(@PathVariable String member1Id, @PathVariable String member2Id) {
        List<Message> messages = personalChatService.getAllMessagesOfAPersonalChat(member1Id,member2Id);
        if(messages == null || messages.isEmpty()) {
            return ResponseEntity.noContent().build();
        }
        return ResponseEntity.ok(messages);
    }

//    @PostMapping("/secret_key/{chatId}/")
//    public ResponseEntity<?> setSecretKey(@RequestBody String secretKey, @PathVariable String chatId) {
//        Optional<PersonalChat> chat = this.personalChatRepository.findById(chatId);
//        if (chat.isPresent()) {
//            chat.get().setSecretKey(secretKey);
//            this.personalChatRepository.save(chat.get());
//            return ResponseEntity.ok().build();
//        } else {
//            return ResponseEntity.status(404).body("Chat not found");
//        }
//    }
//
//    @GetMapping("/secret_key/{chatId}/")
//    public ResponseEntity<?> getSecretKey( @PathVariable String chatId) {
//        Optional<PersonalChat> chat = this.personalChatRepository.findById(chatId);
//        if (chat.isPresent()) {
//            String secretKey = chat.get().getSecretKey();
//            this.personalChatRepository.save(chat.get());
//            return ResponseEntity.ok().build();
//        } else {
//            return ResponseEntity.status(404).body("Chat not found");
//        }
//    }


}
