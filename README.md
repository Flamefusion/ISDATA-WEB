# ISDATA - Ring Data ETL & Search Tool

## Description

ISDATA is a full-stack web application designed to streamline the process of collecting, processing, and analyzing manufacturing data for rings. It provides a user-friendly interface to migrate data from Google Sheets, store it in a PostgreSQL database, and then search, visualize, and generate reports based on that data.

The application is built with a React frontend and a Flask backend, offering a robust and efficient solution for data management and quality control in a manufacturing environment.

## Features

- **Data Migration:** Seamlessly migrate data from Google Sheets to a PostgreSQL database with a single click. The migration process is streamed to the user, providing real-time feedback.
- **Data Preview:** Preview the data stored in the database to ensure data integrity.
- **Advanced Search:** Search for specific rings using a variety of filters, including serial numbers, manufacturing order numbers, dates, and more.
- **Daily Production Reports:** Generate comprehensive daily production reports with key metrics like total received, accepted, rejected, and yield.
- **Rejection Trends Analysis:** Track rejection trends over time to identify common issues and improve quality control.
- **Data Export:** Export search results and reports to CSV and Excel formats.
- **Database Management:** Create and clear the database schema directly from the application.
- **Connection Testing:** Test connections to both the Google Sheets API and the PostgreSQL database to ensure proper configuration.
- **Dark Mode:** A sleek dark mode for comfortable viewing in low-light environments.

## Technologies Used

**Frontend:**

- React
- Vite
- Tailwind CSS
- Framer Motion
- Lucide React (for icons)

**Backend:**

- Flask
- Python
- PostgreSQL
- Gunicorn

**Python Libraries:**

- `Flask`
- `Flask-CORS`
- `psycopg2-binary`
- `pandas`
- `gspread`
- `google-auth`
- `python-dotenv`
- `openpyxl`

## Setup and Installation

### Prerequisites

- Node.js and npm
- Python 3.x and pip
- PostgreSQL

### 1. Clone the repository

```bash
git clone https://github.com/your-username/isdata.git
cd isdata
```

### 2. Backend Setup

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

### 3. Frontend Setup

```bash
# Install Node.js dependencies
./setup.sh
```

### 4. Database Setup

1.  Make sure your PostgreSQL server is running.
2.  Create a new database with the name you specified in your `.env` file.
3.  Use the "Configuration" tab in the application to create the necessary database schema.

## Usage

1.  **Start the backend server:**

    ```bash
    python run.py
    ```

2.  **Start the frontend development server:**

    ```bash
    npm run dev
    ```

3.  Open your browser and navigate to `http://localhost:5173` (or the address provided by Vite).

## API Endpoints

The Flask backend provides the following API endpoints:

-   `POST /api/db/test`: Test the database connection.
-   `POST /api/db/schema`: Create the database schema.
-   `DELETE /api/db/clear`: Clear the `rings` table.
-   `GET /api/data`: Get all rings data from the database.
-   `POST /api/migrate`: Migrate data from Google Sheets to the database.
-   `POST /api/test_sheets_connection`: Test the connection to Google Sheets.
-   `POST /api/search`: Search for rings with various filters.
-   `GET /api/search/filters`: Get distinct values for search filters.
-   `POST /api/search/export`: Export search results to CSV.
-   `POST /api/reports/daily`: Generate a daily production report.
-   `POST /api/reports/export`: Export the daily report to CSV or Excel.
-   `POST /api/reports/rejection-trends`: Generate rejection trends data.
-   `POST /api/reports/rejection-trends/export`: Export rejection trends to CSV or Excel.

## Frontend Components

The React frontend is built with a modular component architecture:

-   `App.jsx`: The main application component that manages state and routing.
-   `ConfigTab.jsx`: The configuration tab for setting up database and Google Sheets connections.
-   `PreviewTab.jsx`: The data preview tab for viewing the data in the database.
-   `MigrationTab.jsx`: The migration tab for migrating data from Google Sheets.
-   `SearchTab.jsx`: The search tab for filtering and searching for rings.
-   `ReportTab.jsx`: The daily production report tab.
-   `RejectionTrendsTab.jsx`: The rejection trends analysis tab.
-   `CustomAlert.jsx`: A custom alert component for displaying success and error messages.
-   `SettingsPanel.jsx`: A settings panel for toggling dark mode and other application settings.
-   `MultiSelectMenu.jsx`: A reusable multi-select menu component.

## Contributing

Contributions are welcome! Please feel free to submit a pull request or open an issue for any bugs or feature requests.

## License

Copyright (c) 2025 FlameFusion

All rights reserved. This code is the intellectual property of FlameFusion.

**Personal Use:**

You are granted a non-exclusive, non-transferable, revocable license to use this code for personal, non-commercial purposes only. You may modify the code for your own personal use.

**Commercial Use:**

Commercial use of this code, in whole or in part, is strictly prohibited without the express written consent of FlameFusion. This includes, but is not limited to, selling, sublicensing, or distributing the code for any commercial purpose.

To request a commercial license, please contact FlameFusion.
