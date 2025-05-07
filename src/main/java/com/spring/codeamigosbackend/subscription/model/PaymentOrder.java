package com.spring.codeamigosbackend.subscription.model;

import com.spring.codeamigosbackend.registration.model.User;
import lombok.Data;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

@Data
@Document(collection = "orders")
public class PaymentOrder {
    @Id
    private String id;

    private String orderId;
    private String amount;
    private String status;
    private String paymentId;

    private String userId;

}
