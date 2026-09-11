from flask_wtf import FlaskForm
from wtforms import StringField, TextAreaField, SubmitField, EmailField, PasswordField, BooleanField
from wtforms.validators import DataRequired, Length, Email, EqualTo, ValidationError
from app.models import User
from flask_login import current_user
from flask_wtf.file import FileField, FileAllowed
from urllib.parse import urlparse

def validate_profile_url(form, field):
    if not field.data:
        return

    parsed_url = urlparse(field.data.strip())

    if parsed_url.scheme not in ("http", "https") or not parsed_url.netloc:
        raise ValidationError(
            "Please enter a valid URL starting with http:// or https://."
        )

class RegistrationForm(FlaskForm):
    username = StringField('Username', validators=[DataRequired(), Length(min=2, max=20)])
    email = EmailField('Email', validators=[DataRequired(), Email()])
    password = PasswordField('Password', validators=[DataRequired(), Length(min=8, max=255)])
    confirm_password = PasswordField('Confirm Password', validators=[DataRequired(), EqualTo('password')])
    submit = SubmitField('Sign Up')

    def validate_username(self, username):
        user = User.query.filter_by(username=username.data).first()
        if user:
            raise ValidationError('That username is already taken. Please choose a different one.')

    def validate_email(self, email):
        user = User.query.filter_by(email=email.data).first()
        if user:
            raise ValidationError('That email is already registered. Please choose a different one.')

class LoginForm(FlaskForm):
    email = EmailField('Email', validators=[DataRequired(), Email()])
    password = PasswordField('Password', validators=[DataRequired(), Length(min=8, max=255)])
    remember = BooleanField('Remember Me')
    submit = SubmitField('Login')

class UpdateAccountForm(FlaskForm):
    username = StringField('Username', validators=[DataRequired(), Length(min=5, max=20)])
    email = EmailField('Email', validators=[DataRequired(), Email()])
    picture = FileField('Update Profile Picture', validators=[FileAllowed(['jpg', 'png', 'jpeg'])])

    bio = TextAreaField("Bio")

    github = StringField(
        "GitHub Profie",
        validators=[validate_profile_url]
    )

    linkedin = StringField(
        "LinkedIn Profile",
        validators=[validate_profile_url]
    )

    website = StringField(
        "Portfolio Website",
        validators=[validate_profile_url]
    )
    
    submit = SubmitField('Save Changes')

    def validate_username(self, username):
        if username.data != current_user.username:
            user = User.query.filter_by(username=username.data).first()
            if user:
                raise ValidationError('That username is already taken. Please choose a different one.')

    def validate_email(self, email):
        if email.data != current_user.email:
            user = User.query.filter_by(email=email.data).first()
            if user:
                raise ValidationError('That email is already registered. Please choose a different one.')

class PostForm(FlaskForm):
    title = StringField('Title', validators=[DataRequired(), Length(min=5, max=120)])
    category = StringField('Category', validators=[DataRequired(), Length(min=3, max=50)])
    tags = StringField('Tags', validators=[Length(max=300)], description='Separate tags with commas')
    content = TextAreaField('Content', validators=[DataRequired(), Length(min=20)])
    submit = SubmitField('Publish')

class CommentForm(FlaskForm):
    content = TextAreaField('Comment', validators=[DataRequired(), Length(min=1, max=500)])
    submit = SubmitField('Post Comment')