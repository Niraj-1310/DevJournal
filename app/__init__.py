import mimetypes
mimetypes.add_type('application/javascript', '.js')

from flask import Flask
from flask_sqlalchemy import SQLAlchemy
from flask_login import LoginManager
from flask_migrate import Migrate
from flask_mail import Mail
from flask_wtf.csrf import CSRFProtect

app = Flask(__name__)

app.config.from_object('config.Config')

mail = Mail(app)

db = SQLAlchemy(app)
migrate = Migrate(app, db)

csrf = CSRFProtect(app)

print("CSRF HEADERS CONFIG:", app.config.get('WTF_CSRF_HEADERS'))

@app.after_request
def add_security_headers(response):
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "SAMEORIGIN"
    response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"

    return response

login_manager = LoginManager()
login_manager.init_app(app)
login_manager.login_view = "login"
login_manager.login_message_category = "info"

import mimetypes
mimetypes.add_type('application/javascript', '.js')

from flask import Flask
from flask_sqlalchemy import SQLAlchemy
from flask_login import LoginManager
from flask_migrate import Migrate
from flask_mail import Mail
from flask_wtf.csrf import CSRFProtect

app = Flask(__name__)

app.config.from_object('config.Config')

mail = Mail(app)

db = SQLAlchemy(app)
migrate = Migrate(app, db)

csrf = CSRFProtect(app)

print("CSRF HEADERS CONFIG:", app.config.get('WTF_CSRF_HEADERS'))

@app.after_request
def add_security_headers(response):
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "SAMEORIGIN"
    response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"

    return response

login_manager = LoginManager()
login_manager.init_app(app)
login_manager.login_view = "login"
login_manager.login_message_category = "info"

from app.models import category_color_class

app.jinja_env.globals['category_color_class'] = category_color_class

from app import routes