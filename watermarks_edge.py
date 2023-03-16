import cv2 as cv
import glob
import numpy as np
import sys


# from test_data import *


def type_img(list_x: list, list_y: list) -> int:
    if list_x > list_y:
        return 1
    elif list_x < list_y:
        return 0
    else:
        return 0


def convert_function(path_img_: str, path_logo_: str, path_save_: str, location_: str, bias: str) -> None:
    bias = int(bias)

    img = cv.imdecode(np.fromfile(path_img_, dtype=np.uint8), cv.IMREAD_COLOR)

    logo = cv.imread(path_logo_)
    axis = type_img(img.shape[1], img.shape[0])
    ratio = img.shape[axis] / logo.shape[axis]
    if ratio < 3.7:
        logo = cv.resize(logo, (int(logo.shape[1] / 3.7), int(logo.shape[0] / 3.7)))

    rows_1, cols_1, channels_1 = img.shape
    rows_2, cols_2, channels_2 = logo.shape

    top_left_y = bias
    top_left_x = bias

    top_right_y = bias
    top_right_x = cols_1 - cols_2 - bias

    bottom_left_y = rows_1 - rows_2 - bias
    bottom_left_x = bias

    bottom_right_y = rows_1 - rows_2 - bias
    bottom_right_x = cols_1 - cols_2 - bias

    if location_ == '4':
        y = bottom_right_y
        x = bottom_right_x

    elif location_ == '1':
        y = top_left_y
        x = top_left_x

    elif location_ == '2':
        y = top_right_y
        x = top_right_x

    elif location_ == '3':
        y = bottom_left_y
        x = bottom_left_x

    else:
        y = bottom_right_y
        x = bottom_right_x

    rows_2 += y
    cols_2 += x

    roi = img[y:rows_2, x:cols_2]

    img2gray = cv.cvtColor(logo, cv.COLOR_BGR2GRAY)
    ret, mask = cv.threshold(img2gray, 10, 255, cv.THRESH_BINARY)
    mask_inv = cv.bitwise_not(mask)

    img_bg = cv.bitwise_and(roi, roi, mask=mask_inv)

    logo_fg = cv.bitwise_and(logo, logo, mask=mask)

    dst = cv.add(img_bg, logo_fg)
    img[y:rows_2, x:cols_2] = dst

    ext = '.' + path_save_.split('.')[-1]
    temp = cv.imencode(ext=ext, img=img)
    temp[1].tofile(path_save_)


def main():
    path_logo = arguments[1]
    path_folder_img = arguments[2]
    location = arguments[4]
    bias_ = arguments[5]

    folder = glob.glob(f'{path_folder_img}/*.*')

    for path_img in folder:
        name = path_img.split(r" \ ".strip())[-1]
        save_path = arguments[3]
        save_path = fr"{save_path}\logo_{name}"

        convert_function(path_img, path_logo, save_path, location, bias_)


if __name__ == '__main__':
    arguments = sys.argv
    # arguments = test_arguments
    main()
