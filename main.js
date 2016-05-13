var h = require('virtual-dom/h');
var diff = require('virtual-dom/diff');
var patch = require('virtual-dom/patch');
var create_element = require('virtual-dom/create-element');
var main_loop = require('main-loop');

var scales = [
    [0, 2, 4, 5, 7, 9, 11],
    [0, 1, 4, 5, 8, 9],
    [0, 1, 3, 4, 6, 7, 9, 10],
    [0, 2, 4, 6, 8, 10],
    [0, 2, 3, 5, 7, 8, 11],
    [0, 2, 4, 5, 7, 8, 11],
    [0, 2, 4, 6, 7, 9, 10],
    [0, 2, 4, 5, 7, 9, 11]
];

var sharp_notes = [
'A','A\u266f','B','C','C\u266f','D','D\u266f','E','F','F\u266f','G','G\u266f'
];
var flat_notes  = [
'A','B\u266d','B','C','D\u266d','D','E\u266d','E','F','G\u266d','G','A\u266d'
];

var display_styles = {
    'Sharps': function(scale) {
        return scale.map(function(note) {
            return sharp_notes[note];
        }).join('\u3000');
    },
    'Flats': function(scale) {
        return scale.map(function(note) {
            return flat_notes[note];
        }).join('\u3000');
    }
};

function rand_range(a, b) {
    return (a + Math.random() * (b - a))|0;
}

function rand_choice(choices) {
    return choices[(Math.random() * choices.length)|0];
}

var scale_modifiers = {
    sharp: function(scale, note) {
        var new_scale = scale.slice();
        new_scale[mod(note, scale.length)] += 1;
        return new_scale;
    },

    flat: function(scale, note) {
        var new_scale = scale.slice();
        new_scale[mod(note, scale.length)] -= 1;
        return new_scale;
    },

    split: function(scale, note) {
        return scale.concat(scale[mod(note, scale.length)] + 1);
    },

    merge: function(scale, note) {
        var new_scale = scale.slice();
        new_scale.sort();
        new_scale.splice(mod(note - 1, scale.length), 1);
        return scale_modifiers.sharp(new_scale, note - 1);
    }
};

function fix_up(scale) {
    var new_scale = [];
    var root      = rand_range(0, scale.length);
    var seen      = {};

    for (var i = 0; i < scale.length; i++) {
        var note = scale[mod(i + root, scale.length)];

        if (seen[note]) {
            continue;
        }

        seen[note] = true;
        new_scale.push(mod(scale[mod(i + root, scale.length)], 12));
    }

    return new_scale;
}

function get_next_scale(scale) {
    for (var i = 0; i < 400; i++) {
        var note_to_modify = rand_range(0, scale.length);
        var modifier       = rand_choice(Object.keys(scale_modifiers));

        var new_scale = scale_modifiers[modifier](scale, note_to_modify);

        if (meets_specs(new_scale)) {
            var fixed = fix_up(new_scale);
            return fixed;
        }
    }

    return rand_choice(scales);
}

function get_intervals(scale) {
    var result = [];

    for (var i = 0; i < scale.length; i++) {
        result.push(mod(scale[mod(i + 1, scale.length)] - scale[i], 12));
    }

    return result;
}

function jumps(intervals) {
    for (var i = 0; i < intervals.length; i++) {
        if (intervals[i] > 3) {
            return true;
        }
    }

    return false;
}

function aug_2nd_specs(intervals) {
    for (var i = 0; i < intervals.length; i++) {
        if (intervals[i] === 3) {
            var prev = intervals[mod(i - 1, intervals.length)];
            var next = intervals[mod(i + 1, intervals.length)];

            if (prev !== 1 || next !== 1) {
                return false;
            }
        }
    }

    return true;
}

function mod(n, m) {
    while (n < 0) {
        n += m;
    }

    while (n >= m) {
        n -= m;
    }

    return n;
}

function min_2nd_specs(intervals) {
    for (var i = 0; i < intervals.length; i++) {
        if (intervals[mod(i - 1, intervals.length)] === 1 && intervals[i] === 1) {
            return false;
        }
    }

    return true;
}

function meets_specs(scale) {
    var intervals = get_intervals(scale);

    return !jumps(intervals) && aug_2nd_specs(intervals) && min_2nd_specs(intervals);
}

var initial_state = {
    display_style: 'Sharps',
    scale:         rand_choice(scales)
};

function new_scale() {
    loop.update({
        display_style: loop.state.display_style,
        scale:         get_next_scale(loop.state.scale)
    });
}

function change_display_style(e) {
    loop.update({
        display_style: e.target.value,
        scale:         loop.state.scale
    });
}

function render(state) {
    var scale = display_styles[state.display_style](state.scale);

    return h('div', [
        h('p', h('strong', 'Display style:')),
        h('div', Object.keys(display_styles).map(function(display_style) {
            return h('p', [
                h('input', {
                    type:    'radio',
                    name:    'display-style',
                    value:   display_style,
                    onclick: change_display_style,
                    checked: display_style === state.display_style,
                    id:      'radio-' + display_style
                }),
                h('label', {
                    htmlFor: 'radio-' + display_style
                }, display_style)
            ]);
        })),
        h('p', scale),
        h('button', {onclick: new_scale}, 'New scale')
    ]);
}

var loop = main_loop(initial_state, render, {
    create: require('virtual-dom/create-element'),
    diff: require('virtual-dom/diff'),
    patch: require('virtual-dom/patch')
});

document.body.appendChild(loop.target);

