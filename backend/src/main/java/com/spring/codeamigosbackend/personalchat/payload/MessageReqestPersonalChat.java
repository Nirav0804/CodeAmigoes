package com.spring.codeamigosbackend.personalchat.payload;

import lombok.Data;

@Data
public class MessageReqestPersonalChat {
    private String sender;
    private String content;
}
