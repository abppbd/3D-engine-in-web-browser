# Script generating json file to store geometry data
# for the 3Dengine JavaScript.

"""
JSON Structure:
For rendering points:

[shape1(a), shape2(a)...]
+-shape: [Id(n), name(s), *color(h)*, type(s), points(a)]
| +-points: [p1(a), p2(a)...]
| | +-p: [*color(h)*, coords(a)]
| | | +-coords: [x(n), y(n), z(n)]



[shape1(a), shape2(a)...]
 V
 [Id(n), name(s), *color(h)*, type(s), points(a)]
                                       v--------
                               [p1(a), p2(a)...]
                                v----
                     [*color(h)*, coords(a)]
                                  v--------
                          [x(n), y(n), z(n)]

-------------------------------------------------------------------------------
For rendering edges:

[shape1(a), shape2(a)...]
 V
 [Id(n), name(s), *color(h)*, type(s), points(a), edges]
                                       v--------  v----
                       [p1(a), p2(a)...]          [e1(a), e2(a), e3(a)...]
                        v----                      v----
  [*color(h)*, coords(a)]                   [*color(h)*, points(s)]
               v--------                                 v-----
       [x(n), y(n), z(n)]                               "p1-p2"
                                                        (points index)





legend:
    (n):number
    (s):string
    (a):array
    (b):bool
    (h):hex
    **: optional
