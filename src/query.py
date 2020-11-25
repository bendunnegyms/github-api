import requests
import sys
import json

def query(username):
    headers = {}
    url = 'https://api.github.com/users/' + username+ '/repos'
    r = requests.get(url, headers=headers)
    print(json.dumps(json.loads(r.text), indent= 2))
    

query("bendunnegyms")