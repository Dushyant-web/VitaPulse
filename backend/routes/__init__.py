from .admin_requests import admin_requests_bp
from .admin_approve import admin_approve_bp

def register_routes(app):
    app.register_blueprint(admin_requests_bp)
    app.register_blueprint(admin_approve_bp)