package com.spring.codeamigosbackend.subscription.repository;

import com.spring.codeamigosbackend.subscription.model.PaymentOrder;
import org.springframework.data.mongodb.repository.MongoRepository;

public interface PaymentOrderRepository extends MongoRepository<PaymentOrder, String> {
    public PaymentOrder findByOrderId(String orderId);
}
