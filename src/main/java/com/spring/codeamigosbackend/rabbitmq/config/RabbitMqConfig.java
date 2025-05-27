package com.spring.codeamigosbackend.rabbitmq.config;

import io.github.cdimascio.dotenv.Dotenv;
import org.springframework.amqp.core.Binding;
import org.springframework.amqp.core.BindingBuilder;
import org.springframework.amqp.core.Queue;
import org.springframework.amqp.core.TopicExchange;
import org.springframework.amqp.rabbit.config.RetryInterceptorBuilder;
import org.springframework.amqp.rabbit.config.SimpleRabbitListenerContainerFactory;
import org.springframework.amqp.rabbit.connection.ConnectionFactory;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.amqp.support.converter.Jackson2JsonMessageConverter;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class RabbitMqConfig {
    private static final Dotenv dotenv = Dotenv.load();

    @Bean
    public Queue rabbitMqQueue(){
        return new Queue(dotenv.get("rabbitmq.queue"));
    }

    @Bean
    public TopicExchange topicExchange(){
        return new TopicExchange(dotenv.get("rabbitmq.exchange"));
    }

    //    Now bind the queue with the exchange using the routing key
    @Bean
    public Binding rabbitMqBinding(){
        return BindingBuilder
                .bind(rabbitMqQueue())
                .to(topicExchange())
                .with(dotenv.get("rabbitmq.routingKey"));

    }
    // We will also use the RabbitTemplate , ConnectionFactory and RabbitAdmin beans as well
    // Springboot automatically configures them (Autoconfiguration)
    // Thus no need to create it

    // If we want to deal with json then add convertor in the RabbitTemplate

    @Bean
    public Jackson2JsonMessageConverter jackson2JsonMessageConverter(){
        return new Jackson2JsonMessageConverter();
    }

    @Bean
    public RabbitTemplate rabbitTemplate(ConnectionFactory connectionFactory){
        RabbitTemplate rabbitTemplate = new RabbitTemplate(connectionFactory);
        rabbitTemplate.setMessageConverter(jackson2JsonMessageConverter());
        return rabbitTemplate;
    }

    // This is to make sure that when the factory creates the rabbitListener it makes sure that the
    // factory also has the same jackson2JsonConvertor to make sure that the msg is properly deserialized
    @Bean
    public SimpleRabbitListenerContainerFactory rabbitListenerContainerFactory(
            ConnectionFactory connectionFactory,
            Jackson2JsonMessageConverter converter) {
        SimpleRabbitListenerContainerFactory factory = new SimpleRabbitListenerContainerFactory();
        factory.setConnectionFactory(connectionFactory);
        factory.setMessageConverter(converter);
        // Added this for automatic error handling with 1s as inital time and then 2 s , 4s, till 10 as max interval
        factory.setAdviceChain(RetryInterceptorBuilder.stateless().maxAttempts(5).backOffOptions(1000,2.0,10000).build());
        return factory;
    }
}
