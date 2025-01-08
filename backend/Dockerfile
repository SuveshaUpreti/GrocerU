# backend/Dockerfile
# Use an official Python image for development
FROM python:3.10

# Set environment variables
ENV PYTHONDONTWRITEBYTECODE 1
ENV PYTHONUNBUFFERED 1
ENV FLASK_ENV development
ENV FLASK_APP app.py

# Set the working directory inside the container
WORKDIR /app

# Copy the requirements file to install dependencies
COPY requirements.txt .

RUN apt-get update && apt-get install -y sqlite3
# Install dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Copy the rest of the application code
COPY . .

# Expose the port that the Flask app runs on
EXPOSE 5000

# Start the Flask application
CMD ["sh", "-c", "python database/query_groceru.py && flask run --host=0.0.0.0"]