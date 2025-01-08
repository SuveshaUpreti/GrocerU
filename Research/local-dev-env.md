# Local Development Environment

- Because we are using a dynamic rendering (React) and a dynamic backend (API calls/database), we need to serve both the back & frontend locally while developing. This involves running a local Node.js server for the frontend and a Flask server for the backend.

- The goal of this document is to learn how to standardize our dependencies (Python, venv, Node, Flask, React) and create a local development environment that is consistent on all of our machines.

## Frontend:

- Create a separate directory for your React app (`/frontend`).
- Ensure each team member installs Node.js and npm or Yarn.

    ```bash
    npx create-react-app frontend 
    cd frontend
    npm start
    ```

- Use `.env` files for environment-specific variables like API URLs to easily switch between development and production environments.
- To allow communication with the Flask backend, configure your API calls using the Fetch API in React.

## Backend:

- In the root of your project, create a `/backend` directory for the Flask app.
- Set up a virtual environment:

    ```bash
    python3 -m venv venv
    source venv/bin/activate      # Mac
    .\venv\Scripts\activate        # Windows
    ```

- Install Flask dependencies:

    ```bash
    pip install Flask Flask-CORS
    ```

- Setup CORS in Flask for communication with the frontend:

    ```python
    from flask import Flask
    from flask_cors import CORS 
    app = Flask(__name__) 
    CORS(app)
    ```

- Run Flask server:

    ```bash
    export FLASK_APP=app.py 
    flask run
    ```

## OPTION: Use Docker to Standardize Local Environment

[Docker Tutorial](https://www.youtube.com/watch?v=gAkwW2tuIqE)

- I think we should use Docker for both ease of development and deployment. - Chloe

## Notes on Docker

- to pull containers from dockerhub: 

    ```bash
    docker-compose pull
    ```

- to run both containers: 

    ```bash
    docker-compose up
    ```

- to run just 1 container: 

    ```bash
    docker run -p 3000:3000 eggsiebacon/frontend:latest
    ```

- to stop containers: ^C

- If you need to make changes to the images:
    1. Modify docker-compose.yml
    - Remove 'image: eggsiebacon/frontend:latest' and 'image: eggsiebacon/backendend:latest' and replace with:

        ```bash
        build: 
            context: ./frontend 
            dockerfile: Dockerfile 
        ```

        ```bash
        build: 
            context: ./backend
            dockerfile: Dockerfile 
        ```
    2. Delete old containers and images from Docker desktop (can do this in the gui, you have to delete the   container before deleting the image)

    3. Build the images 

        ```bash
        build: 
            docker build -t eggsiebacon/frontend:latest ./frontend
        ```

        ```bash
        build: 
            docker build -t eggsiebacon/backend:latest ./backend
        ```
    4. Push to Dockerhub and let the team know so we can get your updated images
    
        ```bash
        docker push eggsiebacon/frontend:latest
        ```

        ```bash
        docker push eggsiebacon/backendend:latest
        ```

- to remove all existing containers: 

    ```bash
    docker-compose down
    ```




