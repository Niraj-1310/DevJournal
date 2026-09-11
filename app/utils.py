import os
import secrets
from PIL import Image, UnidentifiedImageError
from app import app

def save_picture(form_picture):
    random_hex = secrets.token_hex(16)
    picture_filename = random_hex + ".jpg"

    picture_path = os.path.join(
        app.root_path,
        "static/profile_pics",
        picture_filename
    )

    output_size = (125, 125)

    try:
        image = Image.open(form_picture)

        if image.width > 5000 or image.height > 5000:
            raise ValueError("Image dimensions are too large.")

        # Fully verify that the uploaded file is a valid image.
        image.verify()

        # Re-open after verify(), because verify() leaves the
        # image object unusable for further processing.
        form_picture.seek(0)
        image = Image.open(form_picture)

        # Convert formats such as PNG/RGBA to RGB before
        # saving everything as JPEG.
        if image.mode in ("RGBA", "LA", "P"):
            background = Image.new("RGB", image.size, "white")
            if image.mode == "P":
                image = image.convert("RGBA")

            if image.mode == "RGBA":
                background.paste(image, mask=image.getchannel("A"))
                image = background
            else:
                image = image.convert("RGB")
        else:
            image = image.convert("RGB")

        image.thumbnail(output_size)

        image.save(
            picture_path,
            format="JPEG",
            quality=90,
            optimize=True
        )

    except (Image.UnidentifiedImageError, OSError, ValueError):
        raise ValueError("Invalid image file.")

    return picture_filename