# Use a lightweight Python image
FROM python:3.10-slim

# Set working directory
WORKDIR /app

# Copy code and model
COPY . /app

# Install dependencies
# RUN pip install --no-cache-dir -r requirements.txt
RUN pip install -r requirements.txt


# Expose the port your app will run on
EXPOSE 5000

# # Run the Flask app
# CMD ["python", "run.py"]

CMD ["gunicorn", "run:app", "--bind", "0.0.0.0:8000"]
