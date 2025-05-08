package com.spring.codeamigosbackend.hackathon.repository;

import com.spring.codeamigosbackend.hackathon.model.Hackathon;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.data.mongodb.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

public interface HackathonRepository extends MongoRepository<Hackathon, String> {
    Optional<Hackathon> findById(String id);
    List<Hackathon> findByRegistrationDates_EndAfterOrderByRegistrationDates_StartAsc(LocalDateTime now);
    List<Hackathon> findByRegistrationDates_StartBeforeAndRegistrationDates_EndAfterOrderByRegistrationDates_StartAsc(LocalDateTime now, LocalDateTime now1);
    List<Hackathon> findByRegistrationDates_StartAfterOrderByRegistrationDates_StartAsc(LocalDateTime now);
    List<Hackathon> findByRegistrationDates_EndBeforeOrderByRegistrationDates_EndDesc(LocalDateTime now);


}
