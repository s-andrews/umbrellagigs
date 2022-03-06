from pymongo import MongoClient

client = MongoClient()
db = client.umbrellagigs_database
gigs = db.gigs_collection
people = db.people_collection