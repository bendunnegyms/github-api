import requests
import sys
import json

def query(username):
    headers = {}
    url = 'https://api.github.com/users/' + username+ '/repos'
    r = requests.get(url, headers=headers)
    return r

if __name__ == "__main__":
    print(json.dumps(json.loads(query("bendunnegyms").text), indent= 2))