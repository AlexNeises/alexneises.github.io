---
title: Python Watermarks
---
~~~ python
from PIL import Image

def create_watermark(image_path, final_image_path, watermark, hires=False):
    main = Image.open(image_path)
    mark = Image.open(watermark)
    mark = mark.rotate(30, expand=1)
    mask = mark.convert('L').point(lambda x: min(x, 25))
    mark.putalpha(mask)
    mark_width, mark_height = mark.size
    main_width, main_height = main.size
    aspect_ratio = mark_width / mark_height
    new_mark_width = main_width * 0.4
    mark.thumbnail((new_mark_width, new_mark_width / aspect_ratio), Image.ANTIALIAS)
    tmp_img = Image.new('RGBA', main.size)
    for i in xrange(0, tmp_img.size[0], mark.size[0]):
        for j in xrange(0, tmp_img.size[1], mark.size[1]):
            main.paste(mark, (i, j), mark)
    if not hires:
        main.thumbnail((758, 1000), Image.ANTIALIAS)
        main.save(final_image_path, 'JPEG', quality=75)
    else:
        main.thumbnail((2048, 2048), Image.ANTIALIAS)
        main.save(final_image_path, 'JPEG', quality=85)

if __name__ == '__main__':
    create_watermark('main_image.jpg', 'main_with_watermark.jpg', 'watermark.png', True)
~~~