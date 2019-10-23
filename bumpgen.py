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
            r = Repo(repodir)
            # 1: request repo branches
            send(list(r.branches))
            # 2: select repo branch
            rb = receive(b)
            r.checkout(rb);
            # 3: request repo list from manifest
            send(list(glob('xml'));
            mf = receive(b)
            m = manifest(mf);
            send(list(m.repos))
            # while:
            #    4: select repo
                 mr = Repo(receive());
            #    5: request list of branches
                 list(mr.branches)
            #    6: select branch
                 mb = receive();
            #    7: request list of commits
                 list(mb.commit)
            #    8: select commit
                 mc = receive();
            #    9: add (repo-commit)
                 add([mr, mc]);

            # 10: add bump request
            print(dir(ws))
            message = ws.read_message()
            ws.send(message)
    return

if __name__ == '__main__':
    http_server = WSGIServer(('',5000), app, handler_class=WebSocketHandler)
    http_server.serve_forever()
