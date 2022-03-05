#!/usr/bin/env python3
from distutils.sysconfig import get_makefile_filename
import bcrypt
import random
from pymongo import MongoClient
from bson.json_util import dumps
from bson.objectid import ObjectId
import cgi
import cgitb
cgitb.enable()

def main():
    # Set up the database connection
    client = MongoClient()
    db = client.umbrellagigs_database
    global gigs
    global people
    gigs = db.gigs_collection
    people = db.people_collection
    
    form = cgi.FieldStorage()

    if not "action" in form:
        send_response(False,"No Action")
        return

    if form["action"].value == "login":
        process_login(form["email"].value,form["password"].value)

    elif form["action"].value == "validate_session":
        validate_session(form["session"].value)

    else:
        # Everything else needs validation so let's check that first
        person = checksession(form["session"].value)
        if person is None:
            send_response(False,"Unknown session")
        
        elif form["action"].value == "list_gigs":
            list_gigs(person)

        elif form["action"].value == "answer_gig":
            answer_gig(person,form["gig_id"].value,form["answer"].value)


def send_response(success,message):
    if success:
        print("Content-type: text/plain; charset=utf-8\n\nSuccess: "+message, end="")
    else:
        print("Content-type: text/plain; charset=utf-8\n\nFail: "+message, end="")

def send_json(data):
    print("Content-type: text/json; charset=utf-8\n\n"+dumps(data))


def answer_gig(person,gig_oid,answer):
    gig = gigs.find_one({"_id":ObjectId(gig_oid)})
    for player in gig["players"]:
        if player["_id"] == person["_id"]:
            player["response"] = answer

    gigs.update_one({"_id":ObjectId(gig_oid)},{"$set":{"players":gig["players"]}})


    send_response(True,"")

def new_user(person,form):

    if not person["is_admin"]:
        send_response(False,"Only Admins can make new users")

    new_user = {
        "first_name": form["first_name"].value,
        "last_name": form["last_name"].value,
        "email": form["email"].value,
        "instrument": form["instrument"].value,
        "admin": False,
        "password": bcrypt.hashpw(form["password"].value.encode("UTF-8"),bcrypt.gensalt()),
        "sessioncode": None,
        "reset_code": None
    }

    people.insert_one(new_user)

    send_response(True,"")
    

def list_gigs(person):
    gig_list = gigs.find({})

    relevant_gigs = []

    if person["is_admin"]:
        relevant_gigs = gig_list

    else:
        for gig in gig_list:
            players = []
            for player in players:
                if player["_id"] == person["_id"]:
                    players.append(player)
        
            if players:
                gig["players"] = players
                relevant_gigs.append(gig)

    send_json(relevant_gigs)


def process_login (email,password):
    person = people.find_one({"email":email})

    # Check the password
    if bcrypt.checkpw(password.encode("UTF-8"),person["password"]):
        sessioncode = generate_id(20)
        people.update_one({"email":email},{"$set":{"sessioncode": sessioncode}})

        send_response(True,sessioncode)
    else:
        send_response(False,"Incorrect login")

def validate_session(sessioncode):
    person = checksession(sessioncode)

    if person is None:
        send_response(False,"")
        return
    
    send_response(True,person["first_name"]+" "+person["last_name"]+"\t"+str(person["_id"])+"\t"+str(person["is_admin"]))

def checksession (sessioncode):
    person = people.find_one({"sessioncode":sessioncode})

    if person:
        return person

    return None


def new_gig(person,form):
    """
    Creates a new event and puts it into the database
    """
    # Make up a list of the regulars
    regular_search = people.find({"is_dep":False})

    regulars = []

    for regular in regular_search:
        regular["response"] = "No response"
        regulars.append(regular)
        
    gig = {
        "date": form["date"].value,
        "start_time": form["start_time"].value,
        "end_time": form["end_time"].value,
        "name": form["name"].value,
        "location": form["location"].value,
        "confirmed": form["confirmed"].value == "True",
        "players" : regulars
    }

    gigs.insert_one(gig)

    send_response(True,"")


def generate_id(size):
    """
    Generic function used for creating IDs
    """
    letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ"

    code = ""

    for _ in range(size):
        code += random.choice(letters)

    return code




if __name__ == "__main__":
    main()