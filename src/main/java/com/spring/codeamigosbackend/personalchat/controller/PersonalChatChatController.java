package com.spring.codeamigosbackend.personalchat.controller;



import com.spring.codeamigosbackend.personalchat.model.Message;
import com.spring.codeamigosbackend.personalchat.model.PersonalChat;

import com.spring.codeamigosbackend.personalchat.payload.MessageReqestPersonalChat;
import com.spring.codeamigosbackend.personalchat.repository.PersonalChatRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.messaging.handler.annotation.DestinationVariable;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.messaging.handler.annotation.SendTo;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDateTime;
import java.util.Optional;

@RequiredArgsConstructor
@RestController
@CrossOrigin("*")
public class PersonalChatChatController {
    private final PersonalChatRepository personalChatRepository;

    @MessageMapping("/personal_chat/send_message/{member1Id}/{member2Id}")
    @SendTo("/api/v1/topic/personal_chat/{member1Id}/{member2Id}")
    public Message sendMessage(
            @DestinationVariable String member1Id,
            @DestinationVariable String member2Id,
            @Payload
            MessageReqestPersonalChat messageRequest) {  // Extract payload correctly

        System.out.println("Inside sendMessage");
        System.out.println("member1Id: " + member1Id);
        System.out.println("member2Id: " + member2Id);
        System.out.println("Received message content: " + messageRequest);

        if (member1Id == null || member2Id == null || member1Id.isEmpty() || member2Id.isEmpty()) {
            throw new RuntimeException("Invalid member IDs");
        }

        Optional<PersonalChat> personalChat = personalChatRepository.findByMemberIds(member1Id, member2Id);
        if (personalChat.isEmpty()) {
            throw new RuntimeException("Personal chat not found");
        }

        Message message = new Message();
        message.setContent(messageRequest.getContent());
        message.setTimestamp(LocalDateTime.now());
        message.setSender(messageRequest.getSender());

        personalChat.get().getMessages().add(message);
        personalChatRepository.save(personalChat.get());

        return message;
    }
}