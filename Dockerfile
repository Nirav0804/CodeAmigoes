FROM eclipse-temurin:21
LABEL mentainer = "codeamigos7@gmail.com"
WORKDIR /app
COPY target/CodeAmigos--Backend-0.0.1-SNAPSHOT.jar /app/CodeAmigos--Backend.jar
COPY .env .env
ENTRYPOINT ["java","-jar","CodeAmigos--Backend.jar"]