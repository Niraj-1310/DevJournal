from datetime import datetime
from flask_login import UserMixin
from app import login_manager, db
from flask import current_app
from itsdangerous import URLSafeTimedSerializer
import math

@login_manager.user_loader
def load_user(user_id):
    return User.query.get(int(user_id))

CATEGORY_COLOR_COUNT = 8

def category_color_class(category):
    """Deterministically map a category name to one of 8 accent classes."""
    if not category:
        return "cat-color-0"
    index = sum(ord(char) for char in category) % CATEGORY_COLOR_COUNT
    return f"cat-color-{index}"

# =========================================================
# POST ↔ TAG ASSOCIATION
# =========================================================

post_tags = db.Table(
    "post_tags",

    db.Column(
        "post_id",
        db.Integer,
        db.ForeignKey("post.id"),
        primary_key=True
    ),

    db.Column(
        "tag_id",
        db.Integer,
        db.ForeignKey("tag.id"),
        primary_key=True
    )
)

class User(UserMixin, db.Model):
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(20), unique=True, nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password_hash = db.Column(db.String(255), nullable=False)
    image_file = db.Column(db.String(150), nullable=False, default='default.jpg')
    bio = db.Column(db.Text, default="")
    github = db.Column(db.String(120), default="")
    linkedin = db.Column(db.String(120), default="")
    website = db.Column(db.String(120), default="")
    date_joined = db.Column(db.DateTime, default=datetime.now)

    posts = db.relationship('Post', backref='author', lazy=True)
    likes = db.relationship('Like', backref='user', lazy=True, cascade="all, delete-orphan")
    saved_posts = db.relationship(
        'SavedPost',
        backref='user',
        lazy=True,
        cascade="all, delete-orphan"
    )

    def get_reset_token(self):
        serializer = URLSafeTimedSerializer(
            current_app.config["SECRET_KEY"]
        )

        return serializer.dumps({
            "user_id": self.id,
            "password_hash": self.password_hash
        })


    @staticmethod
    def verify_reset_token(token, expires_sec=1800):
        serializer = URLSafeTimedSerializer(
            current_app.config["SECRET_KEY"]
        )

        try:
            data = serializer.loads(
                token,
                max_age=expires_sec
            )

            user_id = data.get("user_id")
            token_password_hash = data.get("password_hash")

        except Exception:
            return None

        user = db.session.get(User, user_id)

        if user is None:
            return None

        # Invalidate the token if the password has changed
        if user.password_hash != token_password_hash:
            return None

        return user

class Post(db.Model):
    id = db.Column(
        db.Integer,
        primary_key=True
    )

    title = db.Column(
        db.String(120),
        nullable=False
    )

    user_id = db.Column(
        db.Integer,
        db.ForeignKey('user.id'),
        nullable=False
    )

    category = db.Column(
        db.String(50),
        nullable=False
    )

    content = db.Column(
        db.Text,
        nullable=False
    )

    date_posted = db.Column(
        db.DateTime,
        nullable=False,
        default=datetime.now
    )

    views = db.Column(
        db.Integer,
        nullable=False,
        default=0
    )

    likes = db.relationship(
        'Like',
        backref='post',
        lazy=True,
        cascade="all, delete-orphan"
    )

    saved_posts = db.relationship(
        'SavedPost',
        backref='post',
        lazy=True,
        cascade="all, delete-orphan"
    )

    tags = db.relationship(
        'Tag',
        secondary=post_tags,
        back_populates='posts'
    )

    def __repr__(self):
        return f"Post('{self.title}', '{self.date_posted}')"

class Tag(db.Model):

    id = db.Column(
        db.Integer,
        primary_key=True
    )

    name = db.Column(
        db.String(50),
        unique=True,
        nullable=False
    )

    posts = db.relationship(
        "Post",
        secondary=post_tags,
        back_populates="tags"
    )

    def __repr__(self):
        return f"Tag('{self.name}')"

class Comment(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    content = db.Column(db.Text, nullable=False)
    date_posted = db.Column(db.DateTime, nullable=False, default=datetime.now)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    post_id = db.Column(db.Integer, db.ForeignKey('post.id'), nullable=False)
    author = db.relationship('User', backref='comments', lazy=True)
    post = db.relationship('Post', backref='comments', lazy=True)

    def __repr__(self):
        return f"Comment('{self.author.username}')"

class Like(db.Model):
    id = db.Column(db.Integer, primary_key=True)

    user_id = db.Column(db.Integer,
                        db.ForeignKey('user.id'),
                        nullable=False)

    post_id = db.Column(db.Integer,
                        db.ForeignKey('post.id'),
                        nullable=False)

    __table_args__ = (
        db.UniqueConstraint('user_id', 'post_id'),
    )

class SavedPost(db.Model):
    id = db.Column(db.Integer, primary_key=True)

    user_id = db.Column(
        db.Integer,
        db.ForeignKey("user.id"),
        nullable=False
    )

    post_id = db.Column(
        db.Integer,
        db.ForeignKey("post.id"),
        nullable=False
    )

    __table_args__ = (
        db.UniqueConstraint("user_id", "post_id"),
    )

class Notification(db.Model):
    id = db.Column(db.Integer, primary_key=True)

    user_id = db.Column(
        db.Integer,
        db.ForeignKey('user.id'),
        nullable=False
    )

    actor_id = db.Column(
        db.Integer,
        db.ForeignKey('user.id'),
        nullable=False
    )

    type = db.Column(db.String(50), nullable=False)

    post_id = db.Column(
        db.Integer,
        db.ForeignKey('post.id'),
        nullable=True
    )

    is_read = db.Column(
        db.Boolean,
        default=False,
        nullable=False
    )

    created_at = db.Column(
        db.DateTime,
        default=datetime.utcnow,
        nullable=False
    )

    user = db.relationship(
        'User',
        foreign_keys=[user_id],
        backref='notifications'
    )

    actor = db.relationship(
        'User',
        foreign_keys=[actor_id]
    )

    post = db.relationship(
        'Post',
        foreign_keys=[post_id]
    )