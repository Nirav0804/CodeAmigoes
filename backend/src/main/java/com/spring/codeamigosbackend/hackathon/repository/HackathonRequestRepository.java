package com.spring.codeamigosbackend.hackathon.repository;

import com.spring.codeamigosbackend.hackathon.model.Hackathon;
import com.spring.codeamigosbackend.hackathon.model.HackathonRequest;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface HackathonRequestRepository extends MongoRepository<HackathonRequest, String> {
    List<HackathonRequest> findByCreatedBy(String createdBy);
    List<HackathonRequest> findByRequestedBy(String requestedBy);
    HackathonRequest getById(String id);
    List<HackathonRequest> findByHackathonId(String hackathonId);
}
