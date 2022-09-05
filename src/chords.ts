import "./util";
import {mod} from "./util";

const key_names = [
    ["c", "b#"],
    ["c#", "db"],
    ["d"],
    ["d#", "eb"],
    ["e", "fb"],
    ["f", "e#"],
    ["f#", "gb"],
    ["g"],
    ["g#", "ab"],
    ["a"],
    ["a#", "bb"],
    ["b", "cb"]
];

type Chord = {
    offset: number,
    flavor: string,
    offset_base: number,
};

function get_offset(key_name: string) {
    key_name = key_name.toLowerCase();
    for (let i = 0; i < key_names.length; i++) {
        if (key_names[i].includes(key_name)) return i;
    }
    throw new Error("The key '" + key_name + "' could not be found.");
}

function get_key_name(offset: number) {
    return key_names[offset][0].toUpperCase();
}

function generate_chord(chord: Chord) {
    let s = get_key_name(chord.offset);
    s += chord.flavor;
    if (chord.offset_base !== -1) {
        s += "/" + get_key_name(chord.offset_base);
    }
    return s;
}

/* transforms the string representation of a chord
into a tuple (offset, flavor, offset_base)
example: G#maj7/F -> (8, "maj7", 5)
offset_base = -1 means that this value doesn't exist
*/
function parse_chord(s: string) {
    s = s.toLowerCase();
    let i = 1;
    if ((s.length > 1) && (s[1] === "#" || s[1] === "b")) {
        i = 2;
    }
    let key_name = s.slice(0, i);
    let offset = get_offset(key_name);

    let flavor = s.slice(i);
    let offset_base = -1;

    let slash_index = s.indexOf("/");
    if (slash_index !== -1) {
        flavor = s.slice(i, slash_index);
        let offset_key_name = s.slice(slash_index + 1);
        offset_base = get_offset(offset_key_name);
    }

    return {
        offset: offset,
        flavor: flavor,
        offset_base: offset_base,
    };
}

function shift(key: number, delta: number) {
    return mod(key + delta, key_names.length);
}

function shift_chord(chord: Chord, delta: number) {
    let offset_base = chord.offset_base;
    if (offset_base !== -1) {
        offset_base = shift(offset_base, delta)
    }
    let offset = shift(chord.offset, delta);
    return {
        offset: offset,
        flavor: chord.flavor,
        offset_base: offset_base
    };
}

export function parse_shift_all(chords: string[], delta: number) {
    return chords.map(c => generate_chord(shift_chord(parse_chord(c), delta)));
}

function compute_score(chords: string[], score_map: Map<string, number>) {
    chords = chords.map(c => c.toLowerCase());
    let sum = 0;
    for (let c of chords) {
        sum += score_map.get(c) || 0;
    }
    return sum;
}

export type CapoResult = {
    score: number,
    capo: number,
    chords: string[],
}

export function compute_best_shift(chords: string[], scoreMap: Map<string, number>): CapoResult[] {
    let scores = [];
    for (let delta = 0; delta < 12; delta++) {
        scores.push({
            delta: delta,
            score: compute_score(parse_shift_all(chords, delta), scoreMap)
        });
    }

    let capoResults = scores.map(r => ({
        score: r.score,
        capo: mod(-r.delta, 12),
        chords: parse_shift_all(chords, r.delta),
    }));

    capoResults.sort((a, b) => {
        // sort by score (desc)
        // if equal sort by capo (asc)
        return (b.score - a.score) || (a.capo - b.capo);
    })

    return capoResults;
}
