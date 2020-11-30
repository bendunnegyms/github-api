# import tkinter as tk

# class 
# window = tk.Tk()
# window.geometry("800x600")
# window.mainloop()

from flask import Flask, render_template

app = Flask(__name__)

@app.route("/")
def index():
    return render_template("main.html")
