package com.spring.codeamigosbackend.personalchat.dto;


import com.spring.codeamigosbackend.personalchat.model.Message;
import lombok.Data;

import java.util.List;

@Data
public class PersonalChatSingleResponseDto {
    private String member1Name;
    private String member2Name;
    private List<Message> message;
}