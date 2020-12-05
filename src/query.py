import requests
import sys
import json

def query(username):
    headers = {}
    url = 'https://api.github.com/users/' + username+ '/repos'
    r = requests.get(url, headers=headers)
    return r

def get_repo_by_name(name, r):

    repo_data = {}
    for entry in r:
        if entry.get("name") == name:
            repo_data = entry
            break

    return repo_data

def get_repo_commits(r):
    commits_url = r.get("commits_url")
    if commits_url.endswith('{/sha}'):
        commits_url = commits_url[:-6]
    commits_r = requests.get(commits_url, headers={})

    # print(json.dumps(json.loads(commits_r.text), indent = 4))
    return json.loads(commits_r.text)

def dagify_commits(r):
    # get latest commit, add as target with parent as source
    network_graph = {"nodes": [], "links": []}
    sha_data = []
    for commit in r:
        sha_data.append(commit.get("sha"))
    print(str(sha_data))
    nodes = []
    links = []
    for commit in r:
        # build node
        commit_as_dict = {"id": "", "author": "", "date": "", "message": ""}
        c_sha = commit.get("sha")
        commit_as_dict["id"] = c_sha
        c_data = commit.get("commit")
        commit_as_dict["author"] = c_data.get("author").get("name")
        commit_as_dict["date"] = c_data.get("author").get("date")
        commit_as_dict["message"] = c_data.get("message")
        nodes.append(commit_as_dict)

        #add links
        parents = commit.get("parents")
        for parent in parents:
            parent_sha = parent.get("sha")
            if parent.get("sha") in sha_data:
                link = {"source" : parent_sha, "target" : c_sha}
                links.append(link)
        
    network_graph["nodes"] = nodes
    network_graph["links"] = links
    print(json.dumps(network_graph, indent= 2))


if __name__ == "__main__":
    r = json.loads(query("bendunnegyms").text)
    repo_data = get_repo_by_name("SWENG-2", r)
    #print(json.dumps(repo_data, indent= 2))
    dagify_commits(get_repo_commits(repo_data))