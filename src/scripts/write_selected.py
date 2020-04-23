# A handy script for extracting quads/tris made in blender
# into values that can be copied to javascript

import bpy
import json
import math
import os

C = bpy.context

DIR = os.path.dirname(os.path.abspath(__file__))
OBJECTS_VERTEX_FPATH = os.path.join(DIR, '../src/resources/objects/objects-vertices.js')
OBJECTS_INFO_PATH = os.path.join(DIR, '../src/resources/objects/objects-data.js')

def write_selected():
    # C = Convenience variables for bpy.context
    objs = C.selected_objects
    objs_verts_data = {}
    objs_info_data = {}

    for obj in objs:
        if obj.data is None or not hasattr(obj.data, 'polygons'):
            continue
        
        vertices = []
        indices = []
        
        for idx, vertex in enumerate(obj.data.vertices):
            vertices.append(list(map(lambda i: round(i, 3), vertex.co[0:3])))
        
        for i in range(len(obj.data.polygons)):
            indices.append(list(obj.data.polygons[i].vertices))

        # Print object loc rot scale
        obj_info = {}
        loc = obj.location
        rot = obj.rotation_euler
        scale = obj.scale
        obj_info["location"] = [loc[0], loc[1], loc[2]]

        # convert angle to degrees
        rad_to_deg = 180 / math.pi
        obj_info["rotation"] = [rot[0] * rad_to_deg, rot[1] * rad_to_deg, rot[2] * rad_to_deg]
        obj_info["scale"] = [scale[0], scale[1], scale[2]]

        # Write material data name, if any
        obj_materials = obj.material_slots.keys()
        if len(obj_materials) > 0:
            obj_info["material_name"] =  obj_materials[0]

        # If parent exists, make location relative to parent.
        # NOTE: This only works if all rotation and scale are 1.
        # Which makes the obj_info rotation and scale not usable.
        #
        # A better solution would be to write the inverse matrix transf of parent
        # at parent initialization.
        # But I don't think for this WS it would be necessary to compute that.
        if obj.parent:
            parent = obj.parent
            for i in range(3):
                obj_info["location"][i] -= parent.location[i]
            obj_info["parent"] = parent.name
        
        for i in range(len(obj_info["location"])):
            obj_info["location"][i] = round(obj_info["location"][i], 3)
        
        objs_info_data[obj.name] = obj_info
        objs_verts_data[obj.name] = {
            "vertices": vertices,
            "indices": indices
        }
    
    with open(OBJECTS_INFO_PATH, "w+") as outfile:
        outfile.write("var objects_info = " + json.dumps(objs_info_data))
    with open(OBJECTS_VERTEX_FPATH, "w+") as outfile:
        outfile.write("var objects_vertices = " + json.dumps(objs_verts_data))

write_selected()