package com.spring.codeamigosbackend.registration.controller;

import com.spring.codeamigosbackend.OAuth2.util.EncryptionUtil;
import com.spring.codeamigosbackend.rabbitmq.producer.RabbitMqProducer;
import com.spring.codeamigosbackend.OAuth2.util.JwtUtil;
import com.spring.codeamigosbackend.recommendation.controllers.FrameworkController;
import com.spring.codeamigosbackend.recommendation.dtos.GithubScoreRequest;
import com.spring.codeamigosbackend.registration.model.User;
import com.spring.codeamigosbackend.registration.repository.UserRepository;
import com.spring.codeamigosbackend.registration.service.UserService;
import com.spring.codeamigosbackend.registration.exception.InvalidCredentialsException;
import com.spring.codeamigosbackend.subscription.model.PaymentOrder;
import com.spring.codeamigosbackend.subscription.repository.PaymentOrderRepository;
import com.razorpay.Order;
import com.razorpay.RazorpayException;
import com.razorpay.RazorpayClient;
import io.github.cdimascio.dotenv.Dotenv;
import io.jsonwebtoken.Claims;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpSession;
import org.apache.commons.codec.binary.Hex;
import org.json.JSONObject;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;
import jakarta.servlet.http.HttpServletResponse;  // For HttpServletResponse parameter
import jakarta.servlet.http.Cookie;                   // For creating and manipulating cookies
import org.springframework.http.ResponseEntity;     // For ResponseEntity return type
import org.springframework.web.bind.annotation.PostMapping;  // For @PostMapping annotation
import org.springframework.web.bind.annotation.RequestBody;  // For @RequestBody annotation


// Also import your User class and jwtUtil as per your project structure


@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
public class UserController {
    private static Dotenv dotenv = Dotenv.load();
    private static final String SECRET_KEY = dotenv.get("JWT_SECRET_KEY"); // Store in env variable
    private final UserService userService;
    private final FrameworkController frameworkController;
    private final PaymentOrderRepository paymentOrderRepository;
    private final JwtUtil jwtUtil;
    private final RabbitMqProducer rabbitMqProducer;

    private final UserRepository userRepository;

    @Value("${razorpay.webhook.secret}")
    private String webhookSecret;

    @Value("${razorpay.key_id}")
    private String key_id;

    @Value("${razorpay.key_secret}")
    private String key_secret;


    private String secret_key = "e905db59b4ed608f3df6625b18b22e497e22e0b02ea89f9f55edb8b2b88ab5221d4bb31f9035d521920225b39b55178abd444ee05d8aac8c86810bda17eb3efebce9ca439f4afad1925a6f8ca58e99291f2955ed142426022b795ca792559aff9b4a3fc45a37aeb299d7a2425dd6760ead76f72b7372b623c6ff9f80e871e6a20b05a8f60ed56230365a6a909bdbfd84546a7fa256112092366b45b426d89e830195adb442260db07a1b40d4d279da95b2506de0b69c56ec9a6a402d06d69b0e2c1b16fa4504211b0154ed93345593cc1fcb01ff4c05afe9da225423dfa857417716d559a93ff8227fc0a45f8bd95b9b09244d68b256697abb5678cee3ce612e"; // Store in env variable

    @GetMapping("/me")
    public ResponseEntity<?> getUsersDetailsFromCookie(HttpServletRequest request) {
        Cookie[] cookies = request.getCookies();
        System.out.println(cookies);
        String token = null;
        if (cookies != null) {
            for (Cookie cookie : cookies) {
                System.out.println("Name : " + cookie.getName());
                System.out.println("Value : " + cookie.getValue());
                if (cookie.getName().equals("jwtToken")) {
                    token = cookie.getValue();
                    break;
                }
            }
        }
        if (token == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }
        try{
            Claims claims = jwtUtil.validateToken(token);

            System.out.println(claims.get("username",String.class));
            String id = claims.get("id",String.class);
            String email = claims.get("email", String.class);
            String username = claims.get("username", String.class);
            String status = claims.get("status", String.class);

            Map<String, String> user = Map.of(
                    "id",id,
                    "email", email,
                    "username", username,
                    "status", status
            );

            return ResponseEntity.ok(user);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Invalid token");
        }
    }

    // Register endpoint
    @PostMapping("/register")
    public ResponseEntity<?> registerUser(@Valid @RequestBody User user, HttpServletResponse response) {
        try {
            System.out.println("In registerUser method");
            // Your existing user save/update logic
            Optional<User> existingUser = userRepository.findById(user.getId());
            User savedUser;
            User u = null;
            if (existingUser.isPresent()) {
                u = existingUser.get();
                u.setUsername(user.getUsername());
                u.setPassword(user.getPassword());
                u.setDisplayName(user.getDisplayName());
                u.setEmail(user.getEmail());
                u.setLeetcodeUsername(user.getLeetcodeUsername());
                u.setCodechefUsername(user.getCodechefUsername());
                // Save the public key from request
                System.out.println(user.getRsaPublicKey());
                u.setRsaPublicKey(user.getRsaPublicKey());
                savedUser = userRepository.save(u);
            } else {
                savedUser = userRepository.save(user);
            }

            // Generate JWT token
            String token = jwtUtil.generateToken(
                    savedUser.getId(),
                    savedUser.getUsername(),
                    savedUser.getEmail(),
                    savedUser.getStatus()
            );
            // Log JWT token to console
            System.out.println("Generated JWT Token: " + token);
            // Set JWT token as HttpOnly, Secure cookie with SameSite=Strict
            Cookie cookie = new Cookie("jwtToken", token);
            cookie.setHttpOnly(true);
            cookie.setSecure(true);  // only if HTTPS
            cookie.setPath("/");
            cookie.setMaxAge(86400);
            response.addCookie(cookie);
            System.out.println("Hello"+response.getHeader("Set-Cookie"));
            // Return user info (without token in body)
            GithubScoreRequest githubScoreRequest = new GithubScoreRequest();
            githubScoreRequest.setUsername(user.getUsername());
            githubScoreRequest.setEmail(user.getEmail());
            // Decrypt token when needed
            String decryptedToken = EncryptionUtil.decrypt(u.getGithubAccessToken(), SECRET_KEY);
            githubScoreRequest.setAccessToken(decryptedToken);
            System.out.println("decrepted github access token"+decryptedToken);
            rabbitMqProducer.sendUserToQueue(githubScoreRequest);
            return ResponseEntity.ok(savedUser);

        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(500).body("Server Error: " + e.getMessage());
        }
    }


    // Login endpoint .... No longer required
    @PostMapping("/login")
    public ResponseEntity<?> loginUser(@RequestBody User loginRequest) {
        try {
            User authenticatedUser = userService.authenticateUser(
                    loginRequest.getUsername(), loginRequest.getPassword()
            );
            return ResponseEntity.ok(authenticatedUser);
        } catch (InvalidCredentialsException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }
    @PostMapping("/logout")
    public ResponseEntity<?> logout(HttpServletRequest request, HttpServletResponse response) {
        // Clear SecurityContext
        SecurityContextHolder.clearContext();

        // Invalidate HTTP session if it exists
        HttpSession session = request.getSession(false);
        if (session != null) {
            session.invalidate();
        }

        // Expire the JWT cookie
        String expiredCookie = "jwtToken=; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=0";
        response.addHeader("Set-Cookie", expiredCookie);

        return ResponseEntity.ok("Logged out successfully");
    }

    // Get user details
    @GetMapping("/{username}")
    public ResponseEntity<?> getUserDetails(@PathVariable java.lang.String username) {
        try {
            User user = userService.getUserByUsername(username);
            //System.out.println(user);
            return ResponseEntity.ok(user);
        } catch (Exception e) {
            return ResponseEntity.status(404).body("User not found.");
        }
    }

    @GetMapping("/all")
    public ResponseEntity<?> getAllUsers() {
        List<User> users = userService.getAllUsers();
        return ResponseEntity.ok(users);
    }

    @PutMapping("/{username}")
    public ResponseEntity<?> updateUserByUsername(@RequestBody User user, @PathVariable java.lang.String username) {
        User user1=userService.updateUser(user, username);
        if(user1==null) {
            return ResponseEntity.badRequest().body("User not found.");
        }
        return ResponseEntity.ok(user1);
    }

    @PostMapping("/create_order")
    @ResponseBody
    public String createOrder(@RequestBody Map<String, String> data) throws RazorpayException {

        System.out.println( "Order created successfully");

        int amt = Integer.parseInt(data.get("amount").toString());
        var client = new RazorpayClient(key_id,key_secret);
        //RazorpayClient("Key_id","key_secret");

        JSONObject ob = new JSONObject();
        ob.put("amount", amt*100);
        ob.put("currency", "INR");
        ob.put("receipt", "order_RC_123456789");


        // Creating order
        Order order = client.orders.create(ob);
        System.out.println(order);

        // save this order into database...
        PaymentOrder paymentOrder = new PaymentOrder();
        paymentOrder.setAmount(order.get("amount")+"");
        paymentOrder.setOrderId(order.get("id")); // correct key
        paymentOrder.setStatus("created");
        paymentOrder.setUserId(data.get("userId").toString());

        Optional<User> user = userRepository.findById(data.get("userId").toString());
        if(user.isPresent()) {
            user.get().setStatus("created");
            userRepository.save(user.get());
        }

        paymentOrderRepository.save(paymentOrder);

        return order.toString(); // Return order details

    }

    @PostMapping("/update_order")
    public ResponseEntity<?> updateOrder(@RequestBody Map<String, Object> data,HttpServletResponse response) throws RazorpayException {

        PaymentOrder paymentOrder =  paymentOrderRepository.findByOrderId(data.get("order_id").toString());
        paymentOrder.setPaymentId(data.get("payment_id").toString());
        paymentOrder.setStatus(data.get("status").toString());
        Optional<User> user = userRepository.findById(data.get("userId").toString());
        if (user.isPresent()) {
            User updatedUser = user.get();
            updatedUser.setStatus("paid");
            userRepository.save(updatedUser);

            // Generate new JWT token with updated status
            String newToken = jwtUtil.generateToken(
                    updatedUser.getId(),
                    updatedUser.getUsername(),
                    updatedUser.getEmail(),
                    updatedUser.getStatus() // now "paid"
            );
            // Log JWT token to console
            System.out.println("updated JWT Token: " + newToken);
            // Set the new JWT token as a cookie
            String cookieValue = "jwtToken=" + newToken
                    + "; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=86400";
            response.addHeader("Set-Cookie", cookieValue);
        }
        paymentOrder.setUserId(data.get("userId").toString());
        paymentOrderRepository.save(paymentOrder);

        System.out.println(data);
        return ResponseEntity.ok(Map.of("msg","updated status successfully"));
    }

    @GetMapping("/get_status/{username}")
    public ResponseEntity<?> getUserStatus(@PathVariable String username) {
        User user = userService.getUserByUsername(username);
        return ResponseEntity.ok(Map.of("status", user.getStatus()));
    }

    @PostMapping("/webhook")
    public ResponseEntity<String> handleWebhook(HttpServletRequest request) {
        try {
            String payload = request.getReader().lines().collect(Collectors.joining(System.lineSeparator()));
            String signature = request.getHeader("X-Razorpay-Signature");

            if (!verifySignature(payload, signature, webhookSecret)) {
                return ResponseEntity.status(400).body("Invalid signature");
            }

            // Process webhook asynchronously in a new thread
            new Thread(() -> processWebhookPayload(payload)).start();

            // Return 200 OK immediately
            return ResponseEntity.ok("Webhook received");
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(500).body("Webhook error: " + e.getMessage());
        }
    }

    private void processWebhookPayload(String payload) {
        try {
            JSONObject webhookPayload = new JSONObject(payload);
            String paymentId = webhookPayload.getJSONObject("payload")
                    .getJSONObject("payment")
                    .getJSONObject("entity")
                    .getString("id");

            String orderId = webhookPayload.getJSONObject("payload")
                    .getJSONObject("payment")
                    .getJSONObject("entity")
                    .getString("order_id");

            PaymentOrder paymentOrder = paymentOrderRepository.findByOrderId(orderId);

            // Avoid duplicate update if already paid
            if (paymentOrder != null && !"paid".equalsIgnoreCase(paymentOrder.getStatus())) {
                paymentOrder.setPaymentId(paymentId);
                paymentOrder.setStatus("paid");
                paymentOrderRepository.save(paymentOrder);

                Optional<User> user = userRepository.findById(paymentOrder.getUserId());
                user.ifPresent(u -> {
                    u.setStatus("paid");
                    userRepository.save(u);
                });
            }
        } catch (Exception e) {
            e.printStackTrace();
        }
    }

    private boolean verifySignature(String payload, String actualSignature, String secret) {
        try {
            String computedSignature = hmacSHA256(payload, secret);
            return computedSignature.equals(actualSignature);
        } catch (Exception e) {
            e.printStackTrace();
            return false;
        }
    }

    private String hmacSHA256(String data, String secret) throws Exception {
        SecretKeySpec secretKey = new SecretKeySpec(secret.getBytes(), "HmacSHA256");
        Mac mac = Mac.getInstance("HmacSHA256");
        mac.init(secretKey);
        byte[] hash = mac.doFinal(data.getBytes());
        return new String(Hex.encodeHex(hash));
    }

    @GetMapping("/public_key/{githubUserName}")
    public ResponseEntity<?> getPublicKey(@PathVariable String githubUserName) {
        Optional<User> userOpt = userRepository.findByGithubUsername(githubUserName);
        if (userOpt.isPresent()) {
            return ResponseEntity.ok(userOpt.get().getRsaPublicKey());
        } else {
            return ResponseEntity.status(404).body("User not found");
        }
    }

    @GetMapping
    public String getCurrentUserId() {
        return this.userService.getCurrentUserId();
    }
}