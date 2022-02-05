#!/usr/bin/env python3
import json
import bcrypt
from pymongo import MongoClient

def main():
    # Set up the database connection
    client = MongoClient()
    db = client.umbrellagigs_database
    global gigs
    global people
    gigs = db.gigs_collection
    people = db.people_collection

    # Remove everything so we're starting fresh
    people.delete_many({})
    gigs.delete_many({})

    # Create an admin user
    admin = {
        "first_name": "Simon",
        "last_name": "Andrews",
        "email": "simon.andrews@babraham.ac.uk",
        "section": "Saxes",
        "is_dep": False,
        "is_admin": True,
        "password": bcrypt.hashpw("testing".encode("UTF-8"),bcrypt.gensalt()),
        "sessioncode": "",
        "reset_code": ""
    }

    people.insert_one(admin)

if __name__ == "__main__":
    main()