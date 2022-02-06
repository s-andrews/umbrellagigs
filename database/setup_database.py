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


    # Create users
    with open("players.txt") as fh:
        for line in fh:
            sections=line.split("\t")
            player = {
                "first_name": sections[0],
                "last_name": sections[1],
                "email": sections[2],
                "section": sections[3],
                "is_dep": False,
                "is_admin": False,
                "password": bcrypt.hashpw("testing".encode("UTF-8"),bcrypt.gensalt()),
                "sessioncode": "",
                "reset_code": ""                
            }

            people.insert_one(player)

    # Create the admin users
    admin_emails = ["Carmen.Garlick@ocr.org.uk","l1sav@hotmail.co.uk","djb1013@googlemail.com","simon@proteo.me.uk"]

    for email in admin_emails:
        people.update_one({"email":email},{"$set": {"is_admin": True}})



    # Add some 
    # Make up a list of the regulars
    regular_search = people.find({"is_dep":False})

    regulars = []

    for regular in regular_search:
        regular["response"] = "No response"
        regulars.append(regular)
        
    with open("gigs.txt") as fh:
        for line in fh:
            sections=line.split("\t")
            gig = {
                "date": sections[0],
                "start_time": sections[1],
                "end_time": sections[2],
                "name": sections[3],
                "location": sections[4],
                "confirmed": sections[5] == "True",
                "players" : regulars
            }

            gigs.insert_one(gig)


if __name__ == "__main__":
    main()