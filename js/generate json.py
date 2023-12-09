# Script generating json file to store geometry data
# for the 3Dengine JavaScript.

"""
JSON Structure:

legend:
    (n):number
    (s):string
    (a):array
    (b):bool
    (h):hex
    **: optional

-------------------------------------------------------------------------------
Full format:

[shape1(a), shape2(a)...]
 |
 +--shape: [Id(n), name(s), mode(s), render(b), position(a), rotation(a), points(a), faces(a), *color(h)*]
 |  |
 |  +--poistion: [x(n), y(n), z(n)]
 |  |
 |  +--rotation: [alpha(n), beta(n)]
 |  |
 |  +--points: [p1(a), p2(a)...]
 |  |  +--p: [coords(a), *color(h)*]
 |  |  |  +--coords: [x(n), y(n), z(n)]
 |  |
 |  +--edges: [e1(a), e2(a)...]
 |  |  +--e: [points(a), *color(h)*]
 |  |  |  +--points: [p1Index(n), p2Index(n)]
 |  |
 |  +--faces: [f1(a), f2(a)...]
 |  |  +--f: [points(a), *color(h)*]
 |  |  |  +--points: [p1Index(n), p2Index(n), p3Index(n)]

-------------------------------------------------------------------------------

Description:
- Id(n): shape unique identifier (gneraly it's its index in the list).
- name(s): name of he shape.
- mode(s): mode of rendering -> points("p"), edges("e"), faces("f")
    note: multiple render modes can be used at once.
- render(b): if the shape should be included in the render or ignored.
- rotation(a): shape's rottion as [alpha(yaw), beta(pitch)]
- position(a): shape's origin coords as [x, y, z].
- points(a): list of shape's vertices.
    note: rendered only if "p" is fount in mode(s).
    - p(a): list of a vertex coords as [x, y, z] and an optional color override
            from the shape's color.
- edges(a):list of a shape's edges.
    note: rendered only if "e" is fount in mode(s).
    - e(a): list of the two vertices making the edge as a list of their index
            in points(a) [index1(n), index2(n)] and an optional color override
            from the shape's color.
- face(a):list of a shape's faces (tiangles only).
    note: rendered only if "f" is fount in mode(s).
    - f(a): list of the three vertices making the tringular face as a list of
            their index in points(a) [index1(n), index2(n), index3(n)] and an
            optional color override from the shape's color.
        note: Only draws triangular faces.
- color(h): shape's points/edges/faces colors as hex value (#012345), if no
    color is given it defaults back to white.
"""

cube = {"Id" : 0,
        "name" : "cube",
        "mode" : "p",
        "render" : True,
        "position" : [0, 0, 0],
        "rotation" : [0, 0],
        "points" : [{"point" : [5,5,5],
                     "color" : "#F00000"},
                    {"point" : [5,-5,5],
                     "color" : "#0F0000"},
                    {"point" : [5,-5,-5],
                     "color" : "#00F000"},
                    {"point" : [5,5,-5],
                     "color" : "#000F00"},
                    {"point" : [-5,5,5],
                     "color" : "#F000FF"},
                    {"point" : [-5,-5,5],
                     "color" : "#0F00FF"},
                    {"point" : [-5,-5,-5],
                     "color" : "#00F0FF"},
                    {"point" : [-5,5,-5],
                     "color" : "#000FFF"}],
        
        "edges" : [{"edge" : [0,1],
                    "color" : "#00FF00"},
                   {"edge" : [1,2],
                    "color" : "#00FF00"},
                   {"edge" : [2,3],
                    "color" : "#00FF00"},
                   {"edge" : [3,0],
                    "color" : "#00FF00"},
                   {"edge" : [4,5],
                    "color" : "#00FF00"},
                   {"edge" : [5,6],
                    "color" : "#00FF00"},
                   {"edge" : [6,7],
                    "color" : "#00FF00"},
                   {"edge" : [7,4],
                    "color" : "#00FF00"},
                   {"edge" : [0,4],
                    "color" : "#00FF00"},
                   {"edge" : [1,5],
                    "color" : "#00FF00"},
                   {"edge" : [2,6],
                    "color" : "#00FF00"},
                   {"edge" : [3,7],
                    "color" : "#00FF00"}],
        
        "faces" : [{"front1" : [0, 1, 2], # Front face (+x)
                    "color" : "#0000FF"},
                   {"front2" : [2, 3, 0],
                    "color" : "#0000FF"},
                   
                   {"back1" : [4, 5, 6], # Back face (-x)
                    "color" : "#00FF00"},
                   {"back2" : [6, 7, 4],
                    "color" : "#00FF00"},
                   
                   {"top1" : [0, 1, 5], # Top face (+z)
                    "color" : "#FF0000"},
                   {"top2" : [5, 4, 0],
                    "color" : "#FF0000"},
                   
                   {"left1" : [1, 2, 5], # Left face (-y)
                    "color" : "#00FFFF"},
                   {"left2" : [5, 6, 1],
                    "color" : "#00FFFF"},
                   
                   {"right1" : [0, 4, 3], # Right face (+y)
                    "color" : "#FFFF00"},
                   {"right2" : [3, 7, 4],
                    "color" : "#FFFF00"},
                   
                   {"bottom1" : [2, 3, 7], # Bottom face (-Z)
                    "color" : "#FF00FF"},
                   {"bottom2" : [7, 6, 2],
                    "color" : "#FF00FF"}]
       }
