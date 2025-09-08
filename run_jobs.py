import time
from app.jobs import process_jobs

if __name__ == '__main__':
    while True:
        print("Checking for new jobs...")
        process_jobs()
        time.sleep(10)
