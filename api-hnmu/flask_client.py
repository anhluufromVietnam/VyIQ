from flask import Flask, render_template_string, request, redirect, url_for
import requests

app = Flask(__name__)
API_BASE = "http://localhost:8000"

# HTML template đơn giản
HTML = """
<h2>Create Project</h2>
<form method="post" action="/create">
  Name: <input type="text" name="name"><br>
  Tag: <input type="text" name="tag"><br>
  Description: <input type="text" name="description"><br>
  <button type="submit">Create</button>
</form>

<h2>Upload File to Project</h2>
<form method="post" action="/upload" enctype="multipart/form-data">
  Project ID: <input type="number" name="project_id"><br>
  Type: 
    <select name="type">
      <option value="video">Video</option>
      <option value="doc">Document</option>
    </select><br>
  File: <input type="file" name="file"><br>
  <button type="submit">Upload</button>
</form>

<h2>All Projects</h2>
<ul>
  {% for project in projects %}
    <li>
      <b>ID {{ project['id'] }}</b> - {{ project['name'] }} 
      [<i>{{ project['tag'] }}</i>]
      <br>Description: {{ project['description'] }}
      <br>Video Path: {{ project['video_path'] }}
      <br>Doc Path: {{ project['document_path'] }}
    </li>
  {% endfor %}
</ul>
"""

@app.route("/")
def index():
    try:
        r = requests.get(f"{API_BASE}/projects")
        projects = r.json()
    except Exception as e:
        projects = []
    return render_template_string(HTML, projects=projects)

@app.route("/create", methods=["POST"])
def create_project():
    form_data = {
        "name": (None, request.form["name"]),
        "tag": (None, request.form["tag"]),
        "description": (None, request.form["description"]),
        "status": (None, "draft"),
        "accuracy": (None, "0.0"),
    }
    # dùng multipart/form-data
    requests.post(f"{API_BASE}/projects", files=form_data)
    return redirect(url_for("index"))

@app.route("/upload", methods=["POST"])
def upload():
    project_id = request.form["project_id"]
    ftype = request.form["type"]
    file = request.files["file"]

    if ftype == "video":
        endpoint = f"{API_BASE}/projects/{project_id}/upload_video"
    else:
        endpoint = f"{API_BASE}/projects/{project_id}/upload_doc"

    files = {"file": (file.filename, file.stream, file.mimetype)}
    requests.post(endpoint, files=files)
    return redirect(url_for("index"))

if __name__ == "__main__":
    app.run(port=5000, debug=True)
