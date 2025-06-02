package com.spring.codeamigosbackend;

import com.spring.codeamigosbackend.config.LoadEnvConfig;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication
public class CodeAmigosBackendApplication {

	public static void main(String[] args) {
		LoadEnvConfig.load();
		SpringApplication.run(CodeAmigosBackendApplication.class, args);
	}

}
