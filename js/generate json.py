# Script generating json file to store geometry data
# for the 3Dengine JavaScript.

"""
JSON Structure:
-------------------------------------------------------------------------------
For rendering points:

[shape1(a), shape2(a)...]
 +--shape: [Id(n), name(s), type(s), render(b), load(b), *color(h)*, points(a)]
 |  +--points: [p1(a), p2(a)...]
 |  |  +--p: [*color(h)*, coords(a)]
 |  |  |  +--coords: [x(n), y(n), z(n)]

-------------------------------------------------------------------------------
For rendering edges:

[shape1(a), shape2(a)...]
 +--shape: [Id(n), name(s), type(s), render(b), load(b), *color(h)*, points(a), edges(a)]
 |  +--points: [p1(a), p2(a)...]
 |  |  +--p: [*color(h)*, coords(a)]
 |  |  |  +--coords: [x(n), y(n), z(n)]
 |  |
 |  +--edges: [e1, e2...]
 |  |  +--e: [*color(h)*, points(a)]
 |  |  |  +--points: [p1Index(n), p2Index(n)]

-------------------------------------------------------------------------------
For rendering faces:

[shape1(a), shape2(a)...]
 +--shape: [Id(n), name(s), type(s), *render(b)*, *load(b)*, *color(h)*, points(a), faces(a)]
 |  +--points: [p1(a), p2(a)...]
 |  |  +--p: [*color(h)*, coords(a)]
 |  |  |  +--coords: [x(n), y(n), z(n)]
 |  |
 |  +--faces: [f1, f2...]
 |  |  +--f: [*color(h)*, points(a)]
 |  |  |  +--points: [p1Index(n), p2Index(n), p3Index(n)]


legend:
    (n):number
    (s):string
    (a):array
    (b):bool
    (h):hex
    **: optional
