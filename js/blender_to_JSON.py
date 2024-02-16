"""
/!\: Activate the System Console to confirm file overwrite (locks blender):
     Menu Bar -> Window -> Toggle System Console


This script is meant to be run in the Blender' python environment.

Generate a JSON file from objects in the scene with each vertex & their coords,
each edges & faces with the vertices'index making them and the color for each
face.

The produced output can be feed to a JavaScript program for 3D rendering.

/!\: Add & apply triangulate modifier to every mesh in the scene if rendering
     in face mode! Otherwise only part of the faces will be rendered. The JS
     program can only handle triangles.
"""


import bpy
from bpy import context
from math import degrees
from pprint import pprint as pprint
from json import dumps
from os.path import dirname



def generate_dict(ID, name, mode="pef", render=True, position=(0,0,0),
                  rotation=(0,0), points=[], edges=[], faces=[],
                  color="#000000"):
    # Generate a dict with every parameters

    my_dict = {
        "Id" : ID,
        "name" : str(name),
        "mode" : mode,
        "isRendered" : render,
        "position" : position,
        "rotation" : rotation,
        "points" : points,
        "edges" : edges,
        "faces" : faces,
        "color" : color}

    return my_dict


def get_point_dict(point, color="#000000"):
    # From point coords to dict.
    v_dict = {"point" : tuple(point.co), # Get vertex coords as a list.
              "color" : color}
    return v_dict


def get_edge_dict(edge, color="#000000"):
    # From edge keys to dict.
    e_dict = {"edge" : edge,
              "color" : color}
    return e_dict


def get_face_dict(face, color="#000000"):
    # From face vertices index to dict.
    f_dict = {"face" : face,
              "color" : color}
    return f_dict


def get_face_color(face): # face: list of the face vertices' index.
    print("TODO: Get face color from UV map")
    return "#0000FF" # r:0, g:0, b:255


def make_vertex_list(obj):
    # Creates a list of dicts with every point coords & color.

    # Get list of vertex local pos (rel to obj).
    vertices = obj.data.vertices

    # List of dict with points coords & color.
    vertex_list = []

    for v in vertices:
        # For every vertex in the mesh object.
        vertex = get_point_dict(point=v) # Dict with coords & color.
        vertex_list.append(vertex)

    return vertex_list


def make_edge_list(obj):
    # Creates a list of dicts with every edge keys & color.

    # Get list of edges_keys
    # (tuples with the index of the vertices making the edge).
    edges = obj.data.edge_keys

    # List of dict with edge keys & color.
    edge_list = []

    for e in edges:
        # For every edge in the mesh object.
        edge = get_edge_dict(edge=e) # Dict w/ keys & color.
        edge_list.append(edge)

    return edge_list


def make_face_list(obj):
    # Creates a list of dicts with every face's vertices & color.

    # Get list of face's vertices
    # (tuples with the index of the vertices making the face).
    faces = [tuple(p.vertices) for p in obj.data.polygons]

    # List of dict with edge keys & color.
    face_list = []

    for index, f in enumerate(faces):
        # For every edge in the mesh object.
        color = get_face_color(obj.data.polygons[index])
        face = get_face_dict(face=f, color=color) # Dict w/ keys & color.
        face_list.append(face)

    return face_list


def confirm_overwrite(overwrite_data, file_path):
    # Ask the user if the selecte overwrite file is the correct one.

    print(f"\nThe data in {file_path} will be overwriten by:\n")
    pprint(overwrite_data)
    user_input = input("\nDo you wish to continue (y/n)? ")

    if user_input == "y":
        # User wishes to overwrite.
        return True
    else:
        # User did not confirm overwrite.
        print("No confirmation.")
        return False


def write_to_JSON(data, file_path):
    if confirm_overwrite(data, file_path):
        with open(file_path, "w") as json_file:
            json_str = dumps(data) # Dict to json str.
            json_file.write(json_str) # Write to file
            print("Data outputed to file.")


def main(mode="pef", color="#000000", file_path=None):
    # Main function.

    geometry = []

    for index, obj in enumerate(bpy.context.scene.objects):
        # Loop over every selected objects

        if obj.type == "MESH":
            # If current object is a mesh (w/ vert, edges & faces)

            # Get object's data.
            ID = len(geometry)
            name = obj.name
            position = tuple(obj.location) # Get position as a list.
            rotation = (degrees(obj.rotation_euler[2]),
                        degrees(obj.rotation_euler[1]))

            print(ID, name, position, rotation)

            # Get vertices' data.
            vertices = make_vertex_list(obj=obj)
            print(f"\n Vertices of {name}:")
            pprint(vertices)

            # Get edges' data.
            edges = make_edge_list(obj=obj)
            print(f"\n Edges of {name}:")
            pprint(edges)

            # Get faces' data.
            faces = make_face_list(obj=obj)
            print(f"\n Faces of {name}:")
            pprint(faces)
            print()

            # Initiate dict.
            mesh = generate_dict(ID=ID,
                                 name=name,
                                 mode="pef",
                                 render=True,
                                 position=position,
                                 rotation=rotation,
                                 points=vertices,
                                 edges=edges,
                                 faces=faces,
                                 color=color)

            # Add the mesh to the list of geometry
            geometry.append(mesh)

    pprint(geometry)
    print()

    if file_path:
        # If a file name/directory was given, dump data in the file.
        write_to_JSON(geometry, file_path=file_path)

    return geometry



if __name__ == "__main__":
    # Target file to dump the geometry data.
    filepath = bpy.data.filepath
    directory = dirname(filepath)
    file_path = directory + "\\geometry.json"
    
    # What part of the mesh to render
    # p: render vertices
    # e: render edges
    # f: render faces
    render_mode = "pe"

    EXIT = main(mode=render_mode, file_path=file_path)
