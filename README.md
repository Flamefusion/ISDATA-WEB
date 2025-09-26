# ISDATA - Ring Data ETL & Search Tool (Electron Edition)

## Description

ISDATA is a desktop application built with Electron that streamlines the process of collecting, processing, and analyzing manufacturing data for rings. It provides a user-friendly interface to migrate data from Google Sheets, store it in a PostgreSQL database, and then search, visualize, and generate reports based on that data.

This project is a conversion of the original ISDATA web application into a standalone desktop application using Electron, providing a more integrated and native experience.

## Tech Stack

-   **Electron:** For building the cross-platform desktop application.
-   **React:** For the user interface.
-   **Vite:** For the frontend build tooling.
-   **Tailwind CSS:** For styling the application.
-   **Flask:** For the backend API, compiled into a standalone executable.
-   **PyInstaller:** To package the Flask backend into a single executable (`backend.exe`).
-   **PostgreSQL:** As the database for storing the ring data.

## Architecture

### How it Works

The application consists of two main parts:

1.  **Frontend:** A React application that provides the user interface. It runs in an Electron `BrowserWindow`.
2.  **Backend:** A Flask application that provides a REST API for all the data operations. This is compiled into a `backend.exe` executable using PyInstaller.

When the Electron application starts, it also starts the `backend.exe` process. The React frontend then communicates with the Flask backend via HTTP requests to `http://localhost:5000`. Electron's IPC (Inter-Process Communication) is used to bridge the gap between the React frontend (renderer process) and the Electron main process, which can then make requests to the backend.

### GUI Overview

The application is designed with a simple and intuitive tab-based interface. Each tab corresponds to a specific function:

-   **Config:** Configure database and Google Sheets API connections.
-   **Migration:** Migrate data from Google Sheets to the PostgreSQL database.
-   **Preview:** Preview the data currently stored in the database.
-   **Search:** Perform advanced searches on the ring data.
-   **Report:** Generate daily production reports.
-   **Rejection Trends:** Analyze rejection trends over time.

### Frontend Components

The React frontend is built with a modular component architecture. Key components include:

-   `App.jsx`: The main application component that manages the overall layout and routing.
-   `ConfigTab.jsx`: Handles the configuration of database and Google Sheets connections.
-   `MigrationTab.jsx`: Manages the data migration process from Google Sheets.
-   `PreviewTab.jsx`: Displays the data from the database.
-   `SearchTab.jsx`: Provides a comprehensive search interface with various filters.
-   `ReportTab.jsx`: For generating and displaying daily production reports.
-   `RejectionTrendsTab.jsx`: For visualizing and analyzing rejection trends.

### API Endpoints & Connection

The Flask backend exposes a series of API endpoints that the Electron/React frontend consumes. The `electron.js` file handles the communication between the frontend and the backend. It uses `axios` to make HTTP requests to the Flask API running on `localhost:5000`.

Key API endpoints include:

-   `/api/db/test`: Test the database connection.
-   `/api/db/schema`: Create the database schema.
-   `/api/db/clear`: Clear the `rings` table.
-   `/api/data`: Get all rings data.
-   `/api/migrate`: Start the data migration from Google Sheets.
-   `/api/search`: Search for rings.
-   `/api/reports/daily`: Generate daily reports.
-   `/api/reports/rejection-trends`: Get rejection trends data.

## Local Setup and Build

### Prerequisites

-   Node.js and npm
-   Python 3.x and pip
-   PostgreSQL

### Local Development

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/your-username/isdata.git
    cd isdata
    ```

2.  **Backend Setup:**
    ```bash
    # Create and activate a virtual environment
    python -m venv .venv
    source .venv/bin/activate  # On Windows, use `.venv\Scripts\activate`

    # Install Python dependencies
    pip install -r requirements.txt

    # Set up environment variables
    cp .env.example .env
    ```
    Update the `.env` file with your PostgreSQL database credentials and the path to your Google Sheets service account JSON file.

3.  **Frontend Setup:**
    ```bash
    # Install Node.js dependencies
    npm install
    ```

4.  **Run the application:**
    ```bash
    npm run dev
    ```
    This will start the Electron application in development mode.

### Build Process

The build process is automated with the `build.py` script. This script performs the following steps:

1.  **Cleans up old build directories:** Deletes `backend`, `dist`, `release`, and `build` folders.
2.  **Builds the backend executable:** It uses `PyInstaller` to package the Flask application (`run.py` and the `app` directory) into a single executable file named `backend.exe`.
    ```bash
    pyinstaller --onefile run.py --name backend --paths .
    ```
3.  **Moves the backend executable:** The generated `backend.exe` is moved from the `dist` folder to a new `backend` folder in the project root. This is done so that Electron-builder can package it with the final application.
4.  **Builds the Electron application:** It runs `npm run build`, which uses `electron-builder` to package the React frontend and the `backend.exe` into a distributable installer for your platform.

To create a build, simply run:
```bash
python build.py
```
The final installer will be located in the `release` directory.

## Roadmap

Here is a roadmap for the future of Isdata:

-   **Cloud Database Hosting:**
    -   Host the PostgreSQL database on a cloud platform like Render.
    -   Implement user authentication with admin and non-admin roles. Admins will have full control over the database, while non-admins will have read-only access.
    -   Overhaul the "Config" tab, possibly moving it to a settings panel.

-   **Performance Improvements:**
    -   Improve the overall performance of the Electron application.
    -   Enhance code quality and maintainability.

-   **Charging Station Data Integration:**
    -   Integrate data from the "Charging Station" sheet to ensure data consistency. (Important)

-   **Homepage Dashboard:**
    -   Create a homepage with visually appealing charts and detailed data for the current month's performance.

-   **Scheduled Migrations:**
    -   Implement a feature to schedule automatic data migrations every 2-3 hours while the application is running.

-   **QC Person Yield Tracking:**
    -   A new page to track the overall yield per QC person. (Under consideration)

-   **Help & Documentation:**
    -   The help button will link to the project's GitHub repository, which will contain a comprehensive user manual.

-   **Batch PCB Tracking:**
    -   A page to track the status and count of PCBs for each batch. (Under consideration)

-   **Odoo Data Tracking:**
    -   A major feature to track Manufacturing Orders (MOs) from Odoo. This will include tracking received, completed, pending, accepted, and rejected quantities, as well as their locations. (MAJOR)

## License

Check the LICENSE file