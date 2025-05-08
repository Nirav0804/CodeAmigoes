package com.spring.codeamigosbackend.hackathon.service;

import com.cloudinary.Cloudinary;
import com.spring.codeamigosbackend.geolocation.services.GeolocationService;
import com.spring.codeamigosbackend.hackathon.dto.HackathonDTO;

import com.spring.codeamigosbackend.hackathon.model.Hackathon;
import com.spring.codeamigosbackend.hackathon.model.HackathonRequest;
import com.spring.codeamigosbackend.hackathon.repository.HackathonRepository;
import com.spring.codeamigosbackend.hackathon.exception.ValidationException;
import com.spring.codeamigosbackend.hackathon.repository.HackathonRequestRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class HackathonService {
    private final HackathonRepository hackathonRepository;
    private final Cloudinary cloudinary;
    private final GeolocationService  geolocationService;

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

}
