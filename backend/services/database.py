import os
import sqlite3

def get_db_connection():
    """
    Establish and return a connection to the SQLite database.
    The database is located in the 'database' folder.
    """
    database_url = os.getenv('DATABASE_URL')  
    conn = sqlite3.connect(database_url.replace('sqlite:///', '')) 
    conn.row_factory = sqlite3.Row
    return conn