from copy import copy
from itertools import cycle

__author__ = 'Ethan'
from random import *


def contruct_dict(keys, vals):
    return {key: val for key, val in zip(keys, vals)}


def get_notes(string):
    return contruct_dict(range(12), string.split())

# {0: 'A', 1: 'Bb', 2: 'B', 3: 'C', 4: 'Dd', 5: 'D', 6: 'Eb', 7: 'E', 8: 'F', 9: 'Gb', 10: 'G', 11: 'Ab'}
NOTES_FLAT = get_notes('A Bb B C Db D Eb E F Gb G Ab')

# {0: 'A', 1: 'A#', 2: 'B', 3: 'C', 4: 'C#', 5: 'D', 6: 'D#', 7: 'E', 8: 'F', 9: 'F#', 10: 'G', 11: 'G#'}
NOTES_SHARP = get_notes('A A# B C C# D D# E F F# G G#')

SCALES = (
    [0, 2, 4, 5, 7, 9, 11],
    [0, 1, 4, 5, 8, 9],
    [0, 1, 3, 4, 6, 7, 9, 10],
    [0, 2, 4, 6, 8, 10],
    [0, 2, 3, 5, 7, 8, 11],
    [0, 2, 4, 5, 7, 8, 11],
    [0, 2, 4, 6, 7, 9, 10],
    [0, 2, 4, 5, 7, 9, 11]
)

# index of scales and names
NAME_NOTES = contruct_dict('oct wt hmi hma ac dia'.split(), SCALES)

TOTAL_NUM_NOTES = 12

# number of times get_next_scale iterates before randomly choosing a new scale from SCALES
MAX_ITERS = 400

def peek(name):
    def wrapper1(func):
        def wrapper2(*args, **kargs):
            result = func(*args, **kargs)
            print(name, ':', args, kargs, '->', result)
            return result

        return wrapper2

    return wrapper1

@peek('intervals')
def intervals(scale):
    """
    :param scale:
    :return: list of intervals, numbered by half steps
    """
    iter_scale = cycle(scale)
    next(iter_scale)
    return [(next - prev) % TOTAL_NUM_NOTES
            for prev, next in zip(scale, iter_scale)]


def jumps(intervals):
    """
    :param scale:
    :return: True if all intervals less than minor third
    """
    return any([interval > 3 for interval in intervals])


def aug_2nd_specs(intervals):
    """
    :param scale:
    :return: True if all minor thirds have a half step on left and right
    """
    for i, interval in enumerate(intervals):
        if interval == 3:
            prev, next = (intervals[j % len(intervals)]
                          for j in (i - 1, i + 1))
            if prev != 1 or next != 1:
                return False
    return True


def min_2nd_specs(intervals):
    """
    :param scale:
    :return: True if no adjacent half steps
    """
    for i, interval in enumerate(intervals):
        if intervals[i - 1] == 1 and interval == 1:
            return False
    return True


def meets_specs(scale):
    intervals_ = intervals(scale)
    if not jumps(intervals_):
        if aug_2nd_specs(intervals_):
            if min_2nd_specs(intervals_):
                print(scale, 'is good')
                return True
    print(scale, 'is bad')
    return False


def sharp(scale, note):
    scale[note] += 1
    return scale


def flat(scale, note):
    scale[note] -= 1
    return scale


def split(scale, note):
    scale.append(scale[note] + 1)
    return flat(scale, note)


def merge(scale, note):
    scale.sort()
    del scale[note - 1]
    return sharp(scale, note - 1)


def fix_up(scale):
    scale = [note % TOTAL_NUM_NOTES for note in scale]
    root = randrange(len(scale))
    return scale[root:] + scale[:root]


def try_mods(mods, scale):
    note_to_modify = choice(range(len(scale)))
    for modification in mods:
        scale_copy = copy(scale)
        new_scale = set(modification(scale_copy, note_to_modify))
        if meets_specs(new_scale):
            return new_scale


def get_next_scale(scale):
    mods = [sharp, flat, split, merge]
    shuffle(mods)
    for _ in range(MAX_ITERS):
        new_scale = try_mods(mods, scale)
        if new_scale is not None:
            break
    if new_scale is None:
        return choice(SCALES)
    return fix_up(new_scale)


def display_notes_sharp(scale):
    return ' '.join(NOTES_SHARP[note] for note in scale)


def display_notes_flat(scale):
    return ' '.join(NOTES_FLAT[note] for note in scale)


def valid_display_type():
    pass


def get_valid_input(prompt, validation, prompt_on_fail=None, exception=Exception):
    """
    :param prompt: initial prompt for user input
    :param validation: dict of inputs with corresponding return values
    :return: value in index corresponding with input
    """
    if prompt_on_fail is None:
        prompt_on_fail = prompt
    print(prompt, end="")
    while True:
        user_input = input()
        try:
            return validation(user_input)
        except exception:
            print(prompt_on_fail, end="")


def display_validation(user_input):
    if user_input == 's':
        return display_notes_sharp
    elif user_input == 'f':
        return display_notes_flat
    else:
        raise ValueError


def run():
    display = get_valid_input(
        'Display notes in sharp or flat (type [s|f]: ',
        display_validation,
        'Please enter either "s" or "f": ',
        ValueError
    )
    scale = choice(SCALES)
    while True:
        assert meets_specs(scale)
        print(display(scale))
        input('Press Enter for next scale...')
        scale = get_next_scale(scale)


run()
