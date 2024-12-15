#!/usr/bin/python3
from PIL import Image

# Create a new image with 1x1 pixel
image = Image.new('RGB', (1, 1), color = 'white')

# Save the image
image.save('image.png')

