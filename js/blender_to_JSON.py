"""
Generate a JSON file from objects in scene with each vertex & their coords,
each edges with the vertices they connect & each faces with the vertices they
connect as well as the color
"""

geometry = []

def generateDict(name, mode="pe", render=True, position=(0,0,0), rotation=(0,0)):
    myDict = {"Id" : len(geometry),
              "name" : str(name),
              "mode" : mode,
              "isRendered" : render,
              
              }
for obj in bpy.context.selected_objects:
    # Loop over every selected objects
    pass
