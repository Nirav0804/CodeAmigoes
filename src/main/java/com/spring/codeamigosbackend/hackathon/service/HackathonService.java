package com.spring.codeamigosbackend.hackathon.service;

import com.cloudinary.Cloudinary;
import com.spring.codeamigosbackend.geolocation.services.GeolocationService;
import com.spring.codeamigosbackend.hackathon.dto.HackathonDTO;

import com.spring.codeamigosbackend.hackathon.model.Hackathon;
import com.spring.codeamigosbackend.hackathon.model.HackathonRequest;
import com.spring.codeamigosbackend.hackathon.repository.HackathonRepository;
import com.spring.codeamigosbackend.hackathon.exception.ValidationException;
import com.spring.codeamigosbackend.hackathon.repository.HackathonRequestRepository;
import com.spring.codeamigosbackend.recommendation.models.UserFrameworkStats;
import com.spring.codeamigosbackend.recommendation.services.FrameworkAnalysisService;
import com.spring.codeamigosbackend.recommendation.utils.ApiException;
import com.spring.codeamigosbackend.registration.model.User;
import com.spring.codeamigosbackend.registration.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class HackathonService {
    private final HackathonRepository hackathonRepository;
    private final Cloudinary cloudinary;
    @Autowired
    private  GeolocationService  geolocationService;
    private final UserService userService;
    private final FrameworkAnalysisService frameworkAnalysisService;

    @Transactional
    public Hackathon createHackathon(HackathonDTO request) throws IOException {
        validateRequest(request);
        Hackathon hackathon = new Hackathon();

        hackathon.setLogo(request.getLogo());
        hackathon.setTitle(request.getTitle());
        hackathon.setOrganization(request.getOrganization());
        hackathon.setTheme(request.getTheme());
        hackathon.setMode(request.getMode());
        hackathon.setAbout(request.getAbout());
        hackathon.setLocation(request.getLocation());
        hackathon.setTechStacks(request.getTechStacks());
        List<Double> coordinates = this.geolocationService.getCoordinatesFromLocation(request.getLocation());
        hackathon.setLatitude(coordinates.get(0));
        hackathon.setLongitude(coordinates.get(1));

        if (request.getTeamSize() != null) {
            Hackathon.TeamSize teamSize = new Hackathon.TeamSize();
            teamSize.setMin(request.getTeamSize().getMin());
            teamSize.setMax(request.getTeamSize().getMax());
            hackathon.setTeamSize(teamSize);
        }

        Hackathon.RegistrationDates dates = new Hackathon.RegistrationDates();
        dates.setStart(request.getRegistrationDates().getStart());
        dates.setEnd(request.getRegistrationDates().getEnd());
        hackathon.setRegistrationDates(dates);
        hackathon.setCurrentTeamSize(1);
        Hackathon.HackathonDates hackathonDates = new Hackathon.HackathonDates();
        hackathonDates.setStart(request.getHackathonDates().getStart());
        hackathonDates.setEnd(request.getHackathonDates().getEnd());
        hackathon.setHackathonDates(hackathonDates);
        hackathon.setCreatedAt(LocalDateTime.now());
        hackathon.setUpdatedAt(LocalDateTime.now());
        hackathon.setCreatedBy(request.getCreatedBy());
        hackathon.setCreatedById(request.getCreatedById());

        return hackathonRepository.save(hackathon);
    }

    public List<Hackathon> getAllActiveHackathons() {
        return hackathonRepository.findByRegistrationDates_EndAfterOrderByRegistrationDates_StartAsc(
                LocalDateTime.now()
        );
    }

    public List<Hackathon> getPastHackathons() {
        return hackathonRepository.findByRegistrationDates_EndBeforeOrderByRegistrationDates_EndDesc(
                LocalDateTime.now()
        );
    }

    public List<Hackathon> getUpcomingHackathons() {
        return hackathonRepository.findByRegistrationDates_StartAfterOrderByRegistrationDates_StartAsc(
                LocalDateTime.now()
        );
    }

    public List<Hackathon> getOngoingHackathons() {
        LocalDateTime now = LocalDateTime.now();
        return hackathonRepository.findByRegistrationDates_StartBeforeAndRegistrationDates_EndAfterOrderByRegistrationDates_StartAsc(
                now, now
        );
    }

    private void validateRequest(HackathonDTO request) {
        if (request.getRegistrationDates().getEnd().isBefore(request.getRegistrationDates().getStart())) {
            throw new ValidationException("End date cannot be before start date");
        }
    }

    public Hackathon getHackathonById(String id) {
        return hackathonRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Hackathon not found with id: " + id));
    }

    //for testing
    public Map uploadImage(MultipartFile file) {
        try {
            Map data = this.cloudinary.uploader().upload(file.getBytes(), Map.of());
            return data;
        } catch (IOException e) {
            throw new RuntimeException("Failed to upload image to Cloudinary");
        }
    }

    public List<Hackathon> findNearbyHackathons(Double latitude, Double longitude) {
        return findNearbyHackathons(latitude, longitude, 100.0); // Default radius = 100 km
    }

    // Find all hackathons and use the haversine formula to find the nearby hackathons
    public List<Hackathon> findNearbyHackathons(Double latitude, Double longitude, Double radiusKm) {

        List<Hackathon> activeHackathons = this.getAllActiveHackathons();
        return activeHackathons.stream()
                .filter(h -> {
                    if (h.getLatitude() == null || h.getLongitude() == null) return false;
                    double distance = calculateDistance(latitude, longitude, h.getLatitude(), h.getLongitude());
                    return distance <= radiusKm;
                })
                .collect(Collectors.toList());
    }

    // Haversine formula
    private double calculateDistance(double lat1, double lon1, double lat2, double lon2) {
        double R = 6371; // Radius of Earth in kilometers
        double dLat = Math.toRadians(lat2 - lat1);
        double dLon = Math.toRadians(lon2 - lon1);
        double a =
                Math.sin(dLat / 2) * Math.sin(dLat / 2) +
                        Math.cos(Math.toRadians(lat1)) * Math.cos(Math.toRadians(lat2)) *
                                Math.sin(dLon / 2) * Math.sin(dLon / 2);
        double c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return R * c;
    }

    public List<ScoredHackathon> recommendHackathons(String username) {
        System.out.println("Hello");
        // Step 1: Get the user's framework stats
        UserFrameworkStats stats = this.frameworkAnalysisService.getUserFrameworkStats(username);
        if (stats == null || stats.getFrameworkUsage() == null || stats.getFrameworkUsage().isEmpty()) {
            System.out.println("No framework stats found for user:"+ username);
            return Collections.emptyList();
        }
        // Step 2: Extract frameworks the user is proficient in
        Map<String, Integer> frameworkUsage = stats.getFrameworkUsage();
        List<String> userFrameworks = new ArrayList<>(frameworkUsage.keySet());
        if (userFrameworks.isEmpty()) {
            System.out.println("No frameworks found in stats for user: {}"+ username);
            return Collections.emptyList();
        }

        List<Hackathon> hackathons = this.getAllActiveHackathons();
        // Normalize user frameworks to lowercase for case-insensitive matching
        List<String> normalizedUserFrameworks = userFrameworks.stream()
                .map(String::toLowerCase)
                .collect(Collectors.toList());
        System.out.println(hackathons);

        // Step 3   : Rank hackathons based on number of framework matches (primary) and proficiency score (secondary)
        List<ScoredHackathon> scoredHackathons = hackathons.stream()
                .map(hackathon -> {
                    int matchCount = countFrameworkMatches(hackathon, userFrameworks);
                    double proficiencyScore = calculateProficiencyScore(hackathon, frameworkUsage);
                    return new ScoredHackathon(hackathon, matchCount, proficiencyScore);
                })
                .sorted((h1, h2) -> {
                    // Primary sort: Number of matches (descending)
                    int matchCompare = Integer.compare(h2.getMatchCount(), h1.getMatchCount());
                    if (matchCompare != 0) {
                        return matchCompare;
                    }
                    // Secondary sort: Proficiency score (descending)
                    return Double.compare(h2.getProficiencyScore(), h1.getProficiencyScore());
                })
                .collect(Collectors.toList());
        return scoredHackathons.stream().filter(scoredHackathon -> scoredHackathon.getMatchCount() > 0).collect(Collectors.toList());
    }

    /**
     * Counts the number of frameworks in the hackathon's tech stack that match the user's frameworks.
     * @param hackathon The hackathon to evaluate
     * @param normalizedUserFrameworks List of frameworks the user is proficient in
     * @return Number of matching frameworks
     */
    private int countFrameworkMatches(Hackathon hackathon, List<String> normalizedUserFrameworks) {
        List<String> techStack = hackathon.getTechStacks();
        if (techStack == null || techStack.isEmpty()) {
            return 0;
        }
        // Normalize tech stack to lowercase for case-insensitive matching
        int matches = (int) techStack.stream()
                .map(String::toLowerCase)
                .filter(normalizedUserFrameworks::contains)
                .count();
        return (int) techStack.stream()
                .filter(normalizedUserFrameworks::contains)
                .count();
    }

    /**
     * Calculates a proficiency score for a hackathon based on the user's proficiency in its required tech stack.
     * @param hackathon The hackathon to score
     * @param frameworkUsage The user's framework usage stats
     * @return Average proficiency score for matched frameworks
     */
    private double calculateProficiencyScore(Hackathon hackathon, Map<String, Integer> frameworkUsage) {
        List<String> techStack = hackathon.getTechStacks();
        if (techStack == null || techStack.isEmpty()) {
            return 0.0;
        }

        double totalScore = 0.0;
        int matchedFrameworks = 0;

        for (String framework : techStack) {
            if (frameworkUsage.containsKey(framework)) {
                totalScore += frameworkUsage.get(framework);
                matchedFrameworks++;
            }
        }

        // Normalize the score by the number of matched frameworks
        return matchedFrameworks > 0 ? totalScore / matchedFrameworks : 0.0;
    }

    /**
     * Helper class to hold a hackathon, its match count, and proficiency score for ranking.
     */
    public static class ScoredHackathon {
        private  Hackathon hackathon;
        private  int matchCount;
        private  double proficiencyScore;

        public ScoredHackathon(Hackathon hackathon, int matchCount, double proficiencyScore) {
            this.hackathon = hackathon;
            this.matchCount = matchCount;
            this.proficiencyScore = proficiencyScore;
        }

        public Hackathon getHackathon() {
            return hackathon;
        }

        public int getMatchCount() {
            return matchCount;
        }

        public double getProficiencyScore() {
            return proficiencyScore;
        }
    }

}
