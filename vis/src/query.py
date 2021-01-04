import requests
import sys
import json
import os
import io
import shutil
import markdown


def query(username):
    headers = {}
    url = 'https://api.github.com/users/' + username + '/repos'
    r = requests.get(url, headers=headers,  auth=(
        'bendunnegyms', ''))
    # print(json.dumps(json.loads(r.text), indent= 4))
    return r


def get_repo_by_name(name, r):
    repo_data = {}
    for entry in r:
        if entry.get("name") == name:
            repo_data = entry
            break
    # print(json.dumps(repo_data, indent= 2))
    return repo_data


def get_repo_commits(r):
    commits_url = r.get("commits_url")
    # print(commits_url)
    if commits_url.endswith('{/sha}'):
        commits_url = commits_url[:-6]
    commits_url += "?page="
    commits_r_t = []
    for x in range(2):
        commits_url_t = "{url}{index}".format(url=commits_url, index=x+1)
        # print(commits_url_t)
        commits_r = requests.get(commits_url_t, headers={}, auth=(
            'bendunnegyms', ''))
        # print(json.dumps(json.loads(commits_r.text), indent= 4))
        if len(json.loads(commits_r.text)) == 0:
            break
        commits_r_t.extend(json.loads(commits_r.text))

    # print(json.dumps(commits_r_t, indent = 4))
    return commits_r_t


def format_date(date):
    f = date.split("T")
    time = f[1].split("Z")[0]
    res = "{date} - {time}".format(date=f[0], time=time)
    return res


def dagify_commits(r):
    # get latest commit, add as target with parent as source
    network_graph = {"nodes": [], "links": []}
    sha_data = []
    for commit in r:
        sha_data.append(commit.get("sha"))

    nodes = []
    links = []
    first = True
    for commit in r:
        # build node
        commit_as_dict = {"id": "", "date": "", "metadata": ""}
        c_sha = commit.get("sha")
        commit_as_dict["id"] = c_sha
        c_data = commit.get("commit")
        c_author = c_data.get("author").get("name")
        c_date = c_data.get("author").get("date")
        c_date = format_date(c_date)
        c_message = c_data.get("message")
        day = c_date.split(" ")[0]
        if first:
            day += " - LATEST"
        commit_as_dict["date"] = day
        metadata = "Message: {message} \nDate: {c_date} \nAuthor: {c_author}".format(
            message=c_message, c_date=c_date, c_author=c_author)
        if first:
            metadata += "\nLATEST COMMIT"
            first = False
        commit_as_dict["metadata"] = metadata
        nodes.append(commit_as_dict)

        # add links
        parents = commit.get("parents")
        for parent in parents:
            parent_sha = parent.get("sha")
            if parent.get("sha") in sha_data:
                link = {"source": parent_sha, "target": c_sha}
                links.append(link)

    network_graph["nodes"] = nodes
    network_graph["links"] = links
    # print(json.dumps(network_graph, indent= 2))
    with open("../vis/data/network_graph.json", "w") as fp:
        json.dump(network_graph, fp)


def bar_chart_data(r):
    bar_chart_graph_t = {}
    bar_chart_graph = []
    for commit in r:
        c_data = commit.get("commit")
        author = c_data.get("author").get("name")
        if author not in bar_chart_graph_t:
            bar_chart_graph_t[author] = {"author": author, "commits": 1}
        else:
            (bar_chart_graph_t[author])["commits"] += 1

    for entry in bar_chart_graph_t:
        bar_chart_graph.append(bar_chart_graph_t.get(entry))

    # print(bar_chart_graph)
    with open("../vis/data/bar_chart_data.json", "w") as fp:
        json.dump(bar_chart_graph, fp)


def get_readme(git_username, repo_name):
    headers = {}
    url = "https://raw.githubusercontent.com/" + \
        git_username + "/" + repo_name + "/master/README.md"
    r = requests.get(url, headers=headers, auth=(
        'bendunnegyms', ''))

    try:
        with open("../vis/data/readme.html", "w") as fp:
            fp.write(markdown.markdown(r.text))
    except:
        with open("../vis/data/readme.html", "x") as fp:
            fp.write(markdown.markdown(r.text))


def language_data(username, repo):
    headers = {}
    url = 'https://api.github.com/repos/' + username + '/' + repo + '/languages'
    r = requests.get(url, headers=headers,  auth=(
        'bendunnegyms', ''))
    #    print(json.dumps(json.loads(r.text), indent= 4))

    lang_dict = json.loads(r.text)
    total_loc = 0
    for key in lang_dict:
        total_loc += lang_dict[key]

    langs_by_percentage = {}
    for key in lang_dict:
        loc = lang_dict[key]
        perc = round((loc/total_loc)*100, 2)
        langs_by_percentage[key] = perc

    print(langs_by_percentage)
    file_exist_check(langs_by_percentage, "../vis/data/langs.json")


def file_exist_check(dict_t, pathname):
    try:
        with open(pathname, "w") as fp:
            json.dump(dict_t, fp)
    except:
        with open(pathname, "x") as fp:
            json.dump(dict_t, fp)

def get_user_activity(username):
    headers = {}
    url = 'https://api.github.com/users/' + username + "/events"
    r = requests.get(url, headers=headers, auth=(
        'bendunnegyms', ''))
    print(json.dumps(json.loads(r.text), indent=2))


def get_user_avatar(username):
    image_url = "https://avatars.githubusercontent.com/" + username
    
    filename = "../vis/data/avatar.jpg"

    # Open the url image, set stream to True, this will return the stream content.
    r = requests.get(image_url, stream=True)

    # Check if the image was retrieved successfully
    if r.status_code == 200:
        # Set decode_content value to True, otherwise the downloaded image file's size will be zero.
        r.raw.decode_content = True

        # Open a local file with wb ( write binary ) permission.
        with open(filename, 'wb') as f:
            shutil.copyfileobj(r.raw, f)

        print('Image sucessfully Downloaded: ', filename)
    else:
        print('Image Couldn\'t be retreived')


def loads_data(request_data):

    if request_data["status"] == "name_and_repo":
        git_user = request_data["name"]
        git_repo = request_data["repo"]

        # print(git_repo, " ", git_user)
        r = json.loads(query(git_user).text)
        repo_data = get_repo_by_name(git_repo, r)
        repo_commits_data = get_repo_commits(repo_data)
        dagify_commits(repo_commits_data)
        bar_chart_data(repo_commits_data)
        language_data(git_user, git_repo)
        get_readme(git_user, git_repo)
        # add more stuff here for bar chart data

    elif request_data["status"] == "name_only":
        git_user = request_data["name"]
        get_user_activity(git_user)
        get_user_avatar(git_user)
        




def rate_limit_test():
    headers = {}
    url = 'https://api.github.com/rate_limit'
    r = requests.get(url, headers=headers, auth=(
        'bendunnegyms', ''))
    print(json.dumps(json.loads(r.text), indent=2))
    api_r = json.loads(r.text)
    out = api_r["resources"]["core"]["remaining"]
    return out

def test_token(usr, token):
    
    headers = {}
    url = 'https://api.github.com/applications/:client_id/tokens/:token'
    r = requests.get(url, headers=headers, auth=(
        usr, token))


if __name__ == "__main__":
    rate_limit_test()
    # get_user_activity("bendunnegyms")
    # get_user_avatar("OwenB523")
    # language_data("bendunnegyms", "SWENG-2")
    #r = json.loads(query("bendunnegyms").text)
    #repo_data = get_repo_by_name("SWENG-2", r)
    #repo_commits_data = get_repo_commits(repo_data)
    # get_readme("bendunnegyms","SWENG-2")
    # dagify_commits(get_repo_commits(repo_data))
