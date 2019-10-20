import os
from flask import (
    Flask,
    request,
    render_template,
    send_from_directory
)

cdir=os.path.dirname(os.path.abspath(__file__))

from geventwebsocket.handler import WebSocketHandler
from gevent.pywsgi import WSGIServer

app = Flask(__name__, template_folder=".")

@app.route('/<path:path>')
def static_file(path):
    return send_from_directory(cdir, path)

@app.route('/api')
def api():
    if request.environ.get('wsgi.websocket'):
        ws = request.environ['wsgi.websocket']
        while True:
            # 1: request repo branches
            # 2: select repo branch
            # 3: request repo list from manifest
            # while:
            #    4: select repo
            #    5: request list of branches
            #    6: select branch
            #    7: request list of commits
            #    8: select commit
            #    9: add (repo-commit)
            # 10: add bump request
            print(dir(ws))
            message = ws.read_message()
            ws.send(message)
    return

if __name__ == '__main__':
    http_server = WSGIServer(('',5000), app, handler_class=WebSocketHandler)
    http_server.serve_forever()
