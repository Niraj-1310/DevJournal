import os
from flask import render_template, redirect, url_for, request, abort, flash, jsonify, current_app
from app import app, mail
from app.models import Post, Tag, db, User, Comment, Like, SavedPost, Notification
from app.forms import PostForm, RegistrationForm, LoginForm, UpdateAccountForm, CommentForm
from werkzeug.security import generate_password_hash, check_password_hash
from flask_login import login_user, logout_user, login_required, current_user
from app.utils import save_picture
from sqlalchemy import or_
from flask_mail import Message
from urllib.parse import urlparse, urljoin

@app.context_processor
def inject_notification_count():
    if current_user.is_authenticated:
        unread_notifications = Notification.query.filter_by(
            user_id=current_user.id,
            is_read=False
        ).count()
    else:
        unread_notifications = 0

    return {
        "unread_notifications_count": unread_notifications
    }

import re
from markupsafe import Markup, escape


@app.template_filter("highlight")
def highlight_search(text, query):
    if not text or not query:
        return escape(text or "")

    escaped_text = escape(str(text))
    escaped_query = re.escape(query)

    highlighted = re.sub(
        f"({escaped_query})",
        r'<mark class="search-highlight">\1</mark>',
        str(escaped_text),
        flags=re.IGNORECASE
    )

    return Markup(highlighted)

def process_post_tags(post, tags_text):
    post.tags.clear()

    if not tags_text:
        return

    tag_names = [
        tag.strip().lower()
        for tag in tags_text.split(",")
        if tag.strip()
    ]

    # Remove duplicates while preserving order
    tag_names = list(dict.fromkeys(tag_names))

    for tag_name in tag_names:
        tag = Tag.query.filter_by(name=tag_name).first()

        if not tag:
            tag = Tag(name=tag_name)
            db.session.add(tag)

        post.tags.append(tag)

def is_safe_url(target):
    if not target:
        return False

    ref_url = urlparse(request.host_url)
    test_url = urlparse(urljoin(request.host_url, target))

    return (
        test_url.scheme in ("http", "https")
        and ref_url.netloc == test_url.netloc
    )

# Home Routes
@app.route("/")
@app.route("/home")
def home():
    page = request.args.get("page", 1, type=int)

    # Latest posts
    posts = (
        Post.query
        .order_by(Post.date_posted.desc())
        .paginate(page=page, per_page=5)
    )

    all_posts = Post.query.all()

    trending_posts = []

    for item in all_posts:
        like_count = len(item.likes)
        comment_count = len(item.comments)

        score = (
            (like_count * 3)
            + (comment_count * 2)
        )

        trending_posts.append({
            "post": item,
            "score": score,
            "likes": like_count,
            "comments": comment_count
        })

    trending_posts.sort(
        key=lambda item: (
            item["score"],
            item["likes"],
            item["comments"],
            item["post"].date_posted
        ),
        reverse=True
    )

    trending_posts = trending_posts[:5]

    return render_template(
        "home.html",
        posts=posts,
        trending_posts=trending_posts
    )

@app.route("/about")
def about():
    return render_template('about.html')

# Post Routes
@app.route("/post/<int:post_id>", methods=["GET", "POST"])
def post(post_id):
    post = Post.query.get_or_404(post_id)

    if request.method == "GET":
        post.views = (post.views or 0) + 1
        db.session.commit()

    form = CommentForm()

    related_posts = []

    if post.category:
        related_posts = (
            Post.query
            .filter(
                Post.category == post.category,
                Post.id != post.id
            )
            .order_by(Post.date_posted.desc())
            .limit(4)
            .all()
        )

    return render_template(
        "post.html",
        title=post.title,
        post=post,
        form=form,
        related_posts=related_posts
    )

@app.route("/new_post", methods=['GET', 'POST'])
@login_required
def new_post():
    form = PostForm()

    if form.validate_on_submit():
        new_post = Post(
            title=form.title.data,
            category=form.category.data,
            content=form.content.data,
            author=current_user
        )

        db.session.add(new_post)

        process_post_tags(
            new_post,
            form.tags.data
        )

        db.session.commit()

        flash(
            "Your post has been created!",
            "success"
        )

        return redirect(
            url_for(
                "post",
                post_id=new_post.id
            )
        )

    return render_template(
        "new_post.html",
        form=form
    )

@app.route("/post/<int:post_id>/edit", methods=["GET", "POST"])
@login_required
def edit_post(post_id):
    post = db.session.get(Post, post_id)

    if post is None:
        abort(404)

    if post.author != current_user:
        abort(403)

    from_dashboard = request.args.get(
        "from_dashboard"
    ) == "1"

    form = PostForm()

    if form.validate_on_submit():

        post.title = form.title.data
        post.category = form.category.data
        post.content = form.content.data

        process_post_tags(
            post,
            form.tags.data
        )

        db.session.commit()

        flash(
            "Post updated successfully!",
            "success"
        )

        if from_dashboard:
            return redirect(
                url_for(
                    "post",
                    post_id=post.id,
                    from_dashboard="1"
                )
            )

        return redirect(
            url_for(
                "post",
                post_id=post.id
            )
        )

    if request.method == "GET":

        form.title.data = post.title
        form.category.data = post.category
        form.content.data = post.content

        form.tags.data = ", ".join(
            tag.name for tag in post.tags
        )

    return render_template(
        "edit_post.html",
        post=post,
        form=form
    )

@app.route("/post/<int:post_id>/delete", methods=["POST"])
@login_required
def delete_post(post_id):

    post = db.session.get(Post, post_id)

    if post is None:
            abort(404)

    if post.author != current_user:
        abort(403)

    db.session.delete(post)
    db.session.commit()

    flash("Your post has been deleted!", "success")

    return redirect(url_for("home"))

# Authentication Routes
@app.route("/register", methods=['GET', 'POST'])
def register():
    form = RegistrationForm()

    if form.validate_on_submit():
        hashed_password = generate_password_hash(form.password.data)
        new_user = User(
            username=form.username.data,
            email=form.email.data,
            password_hash=hashed_password
        )

        db.session.add(new_user)
        db.session.commit()

        flash('Your account has been created!', 'success')
        return redirect(url_for("home"))
    return render_template('register.html', title="Register", form=form)

@app.route("/login", methods=["GET", "POST"])
def login():
    form = LoginForm()

    if form.validate_on_submit():
        user = User.query.filter_by(email = form.email.data).first()

        if user and check_password_hash(user.password_hash, form.password.data):
            login_user(user, remember=form.remember.data)
            
            flash("You have been logged in Successfully!", "success")
            return redirect(url_for("home"))

        else:
            flash("Login unsuccessful. Please check your email and password.", "danger")
    return render_template('login.html', title="Login", form=form)

@app.route("/forgot-password", methods=["GET", "POST"])
def forgot_password():
    if current_user.is_authenticated:
        return redirect(url_for("home"))

    if request.method == "POST":
        email = request.form.get("email", "").strip()

        user = User.query.filter_by(email=email).first()

        if user:
            token = user.get_reset_token()

            reset_url = url_for(
                "reset_password",
                token=token,
                _external=True
            )

            msg = Message(
                "DevJournal Password Reset",
                sender=app.config["MAIL_USERNAME"],
                recipients=[user.email]
            )

            msg.body = f"""Hello {user.username},

You requested a password reset for your DevJournal account.

Reset your password using this link:

{reset_url}

This link will expire in 30 minutes.

If you did not request this, you can safely ignore this email.

DevJournal
"""

            mail.send(msg)

        flash(
            "If an account with that email exists, a password reset link has been sent.",
            "info"
        )

        return redirect(url_for("login"))

    return render_template("forgot_password.html")

@app.route("/reset-password/<token>", methods=["GET", "POST"])
def reset_password(token):
    if current_user.is_authenticated:
        return redirect(url_for("home"))

    user = User.verify_reset_token(token)

    if user is None:
        flash(
            "That reset link is invalid or has expired.",
            "danger"
        )
        return redirect(url_for("forgot_password"))

    if request.method == "POST":
        password = request.form.get("password", "")
        confirm_password = request.form.get("confirm_password", "")

        if len(password) < 8:
            flash(
                "Password must be at least 8 characters long.",
                "danger"
            )
            return redirect(
                url_for("reset_password", token=token)
            )

        if password != confirm_password:
            flash(
                "Passwords do not match.",
                "danger"
            )
            return redirect(
                url_for("reset_password", token=token)
            )

        user.password_hash = generate_password_hash(password)
        db.session.commit()

        flash(
            "Your password has been reset successfully. You can now log in.",
            "success"
        )

        return redirect(url_for("login"))

    return render_template(
        "reset_password.html",
        token=token
    )

@app.route("/logout", methods=["POST"])
@login_required
def logout():
    logout_user()
    flash("You have been logged out.", "info")
    return redirect(url_for("home"))

# Account Routes
@app.route("/account", methods=["GET", "POST"])
@login_required
def account():

    form = UpdateAccountForm()

    from_dashboard = request.args.get("from_dashboard") == "1"
    return_url = (
        request.args.get("return_url")
        if is_safe_url(request.args.get("return_url"))
        else url_for("home")
    )

    if form.validate_on_submit():

        if form.picture.data:
            try:
                picture_file = save_picture(form.picture.data)
                current_user.image_file = picture_file

            except ValueError:
                flash(
                    "The uploaded image is invalid. Please choose a valid JPG, PNG, or JPEG image.",
                    "danger"
                )

                return render_template(
                    "account.html",
                    title="Account",
                    form=form,
                    image_file=url_for(
                        "static",
                        filename="profile_pics/" + (
                            current_user.image_file or "default.jpg"
                        )
                    ),
                    from_dashboard=from_dashboard,
                    return_url=return_url
                )

        current_user.username = form.username.data
        current_user.email = form.email.data
        current_user.bio = form.bio.data
        current_user.github = form.github.data
        current_user.linkedin = form.linkedin.data
        current_user.website = form.website.data

        db.session.commit()

        flash("Your account has been updated!", "success")

        return redirect(
            url_for(
                "account",
                from_dashboard="1",
                return_url=return_url,
                updated="1"
            )
        )

    elif request.method == "GET":

        form.username.data = current_user.username
        form.email.data = current_user.email
        form.bio.data = current_user.bio
        form.github.data = current_user.github
        form.linkedin.data = current_user.linkedin
        form.website.data = current_user.website

    profile_folder = os.path.join(
        current_app.root_path,
        "static",
        "profile_pics"
    )

    image_filename = current_user.image_file

    image_path = os.path.join(
        profile_folder,
        image_filename
    )

    if not os.path.exists(image_path):
        image_filename = "default.jpg"

    image_file = url_for(
        "static",
        filename="profile_pics/" + image_filename
    )

    return render_template(
        "account.html",
        title="Account",
        form=form,
        image_file=image_file,
        from_dashboard=from_dashboard,
        return_url=return_url
    )

# User Routes
@app.route("/user/<string:username>")
def user_posts(username):
    page = request.args.get('page', 1, type=int)
    user = User.query.filter_by(username=username).first_or_404()
    posts = Post.query.filter_by(author=user).order_by(Post.date_posted.desc()).paginate(page=page, per_page=5)

    total_posts = len(user.posts) if hasattr(user.posts, "count") else len(user.posts)
    total_comments = sum(len(post.comments) for post in user.posts)
    total_likes = sum(len(post.likes) for post in user.posts)
    
    return render_template('user_posts.html', 
                            posts=posts, 
                            user=user, 
                            total_posts=total_posts, 
                            total_comments=total_comments, 
                            total_likes=total_likes
                        )          

# Search Routes
@app.route("/search")
def search():
    query = request.args.get("q", "").strip()
    page = request.args.get("page", 1, type=int)

    if query:
        search_term = f"%{query}%"

        posts = Post.query.filter(
            db.or_(
                Post.title.ilike(search_term),
                Post.content.ilike(search_term),
                Post.category.ilike(search_term)
            )
        ).order_by(
            db.case(
                (Post.title.ilike(query), 1),       # Exact title
                (Post.title.ilike(search_term), 2), # Title contains term
                (Post.category.ilike(search_term), 3), # Category contains term
                else_=4
            ),
            Post.date_posted.desc()
        ).paginate(
            page=page,
            per_page=5
        )
    else:
        posts = Post.query.order_by(
            Post.date_posted.desc()
        ).paginate(
            page=page,
            per_page=5
        )

    return render_template(
        "search.html",
        posts=posts,
        query=query
    )
    
# Comment Routes
@app.route("/post/<int:post_id>/comment", methods=["POST"])
@login_required
def add_comment(post_id):
    post = Post.query.get_or_404(post_id)
    form = CommentForm()

    if not form.validate_on_submit():
        return redirect(url_for("post", post_id=post.id))

    comment = Comment(
        content=form.content.data,
        author=current_user,
        post=post
    )

    db.session.add(comment)

    if post.author != current_user:
        notification = Notification(
            user_id=post.author.id,
            actor_id=current_user.id,
            type="comment",
            post_id=post.id
        )

        db.session.add(notification)

    db.session.commit()

    flash("Your comment has been posted!", "success")

    return redirect(url_for("post", post_id=post.id))

@app.route("/comment/<int:comment_id>/delete", methods=["POST"])
@login_required
def delete_comment(comment_id):

    comment = Comment.query.get_or_404(comment_id)

    if comment.author != current_user:
        abort(403)

    post_id = comment.post.id

    db.session.delete(comment)
    db.session.commit()

    flash("Comment deleted successfully!", "success")

    return redirect(url_for("post", post_id=post_id))

@app.route("/comment/<int:comment_id>/edit", methods=["GET", "POST"])
@login_required
def edit_comment(comment_id):

    from_post = request.args.get("from_post") == "1"
    comment = db.session.get(Comment, comment_id)

    if comment is None:
        abort(404)

    if comment.author != current_user:
        abort(403)

    form = CommentForm()

    if form.validate_on_submit():

        comment.content = form.content.data

        db.session.commit()

        flash("Comment updated successfully!", "success")

        return redirect(url_for("post", post_id=comment.post_id, from_comment_edit="1"))

    if request.method == "GET":
        form.content.data = comment.content

    return render_template(
        "edit_comment.html",
        comment=comment,
        form=form
    )

@app.route("/post/<int:post_id>/like", methods=["POST"])
@login_required
def like_post(post_id):
    post = Post.query.get_or_404(post_id)

    like = Like.query.filter_by(
        user_id=current_user.id,
        post_id=post.id
    ).first()

    if like:
        db.session.delete(like)
        liked = False
    else:
        like = Like(
            user_id=current_user.id,
            post_id=post.id
        )
        db.session.add(like)
        liked = True

    if post.author != current_user:
        notification = Notification(
            user_id=post.author.id,
            actor_id=current_user.id,
            type='like',
            post_id=post.id
        )

        db.session.add(notification)

    db.session.commit()

    if request.headers.get("X-Requested-With") == "XMLHttpRequest":
        return jsonify({
            "liked": liked,
            "likes": len(post.likes)
        })

    return redirect(
        request.referrer
        if is_safe_url(request.referrer)
        else url_for("home")
    )

@app.route('/notifications')
@login_required
def notifications():
    notifications = (
        Notification.query
        .filter_by(user_id=current_user.id)
        .order_by(Notification.created_at.desc())
        .all()
    )

    return render_template(
        'notifications.html',
        notifications=notifications
    )

@app.route("/notifications/count")
@login_required
def notification_count():
    count = Notification.query.filter_by(
        user_id=current_user.id,
        is_read=False
    ).count()

    return jsonify({
        "count": count
    })


@app.route('/notifications/<int:notification_id>/read', methods=['POST'])
@login_required
def mark_notification_read(notification_id):
    notification = Notification.query.get_or_404(notification_id)

    # Security check — users can only modify their own notifications
    if notification.user_id != current_user.id:
        abort(403)

    notification.is_read = True
    db.session.commit()

    return jsonify({
        'success': True
    })


@app.route('/notifications/read-all', methods=['POST'])
@login_required
def mark_all_notifications_read():
    Notification.query.filter_by(
        user_id=current_user.id,
        is_read=False
    ).update({
        'is_read': True
    })

    db.session.commit()

    return jsonify({
        'success': True
    })

@app.route("/dashboard")
@login_required
def dashboard():

    from_account = request.args.get("from_account") == "1"
    return_url = (
        request.args.get("return_url")
        if is_safe_url(request.args.get("return_url"))
        else url_for("home")
    )
    from_post = request.args.get("from_post") == "1"
    safe_referrer = (
        request.referrer
        if is_safe_url(request.referrer)
        else url_for("home")
    )

    posts = Post.query.filter_by(author=current_user)\
                      .order_by(Post.date_posted.desc())\
                      .limit(5)\
                      .all()

    top_viewed_posts = (
        Post.query
        .filter_by(author=current_user)
        .order_by(
            Post.views.desc(),
            Post.date_posted.desc()
        )
        .limit(5)
        .all()
    )

    total_posts = len(current_user.posts)

    total_likes = Like.query.join(Post).filter(
        Post.user_id == current_user.id
    ).count()

    total_comments = Comment.query.join(Post).filter(
        Post.user_id == current_user.id
    ).count()

    total_views = sum(post.views or 0 for post in current_user.posts)

    # Profile image fallback
    profile_folder = os.path.join(
        current_app.root_path,
        "static",
        "profile_pics"
    )

    image_filename = current_user.image_file

    image_path = os.path.join(
        profile_folder,
        image_filename
    )

    if not os.path.exists(image_path):
        image_filename = "default.jpg"

    image_file = url_for(
        "static",
        filename="profile_pics/" + image_filename
    )

    return render_template(
        "dashboard.html",
        title="Dashboard",
        posts=posts,
        total_posts=total_posts,
        total_likes=total_likes,
        total_comments=total_comments,
        total_views=total_views,
        top_viewed_posts=top_viewed_posts,
        image_file=image_file,
        from_account=from_account,
        return_url=return_url,
        from_post=from_post,
        safe_referrer=safe_referrer
    )

@app.route("/post/<int:post_id>/save", methods=["POST"])
@login_required
def save_post(post_id):

    post = Post.query.get_or_404(post_id)

    saved = SavedPost.query.filter_by(
        user_id=current_user.id,
        post_id=post.id
    ).first()

    if saved:
        db.session.delete(saved)
        is_saved = False
    else:
        db.session.add(
            SavedPost(
                user_id=current_user.id,
                post_id=post.id
            )
        )
        is_saved = True

    db.session.commit()

    if request.headers.get("X-Requested-With") == "XMLHttpRequest":
        return jsonify({
            "saved": is_saved
        })

    return redirect(url_for("post", post_id=post.id))

@app.route("/saved-posts")
@login_required
def saved_posts():

    saved = (
        SavedPost.query
        .filter_by(user_id=current_user.id)
        .order_by(SavedPost.id.desc())
        .all()
    )

    return render_template(
        "saved_posts.html",
        saved=saved
    )

@app.route("/category/<string:category>")
def category_posts(category):
    posts = Post.query.filter_by(category=category)\
        .order_by(Post.date_posted.desc())\
        .paginate(page=request.args.get("page", 1, type=int), per_page=5)

    return render_template("category_posts.html", posts=posts, category=category)

@app.route("/tag/<string:tag_name>")
def tag_posts(tag_name):
    tag = Tag.query.filter_by(
        name=tag_name.lower()
    ).first_or_404()

    posts = (
        Post.query
        .join(Post.tags)
        .filter(Tag.id == tag.id)
        .order_by(Post.date_posted.desc())
        .paginate(
            page=request.args.get(
                "page",
                1,
                type=int
            ),
            per_page=5
        )
    )

    return render_template(
        "tag_posts.html",
        posts=posts,
        tag=tag
    )

# Error Handlers
@app.errorhandler(403)
def forbidden_error(error):
    return render_template('403.html'), 403

@app.errorhandler(404)
def page_not_found(error):
    return render_template("404.html"), 404

@app.errorhandler(500)
def internal_server_error(error):
    db.session.rollback()
    return render_template("500.html"), 500