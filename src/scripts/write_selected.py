# A handy script for extracting quads/tris made in blender
# into values that can be copied to javascript

import bpy
import json
import math
import os

import sys

C = bpy.context

DIR = os.path.join(bpy.path.abspath("//"), "../kode/src/resources/objects/")
DIR = os.path.normpath(DIR)
OBJECTS_VERTEX_FPATH = os.path.join(DIR, 'objects-vertices-simple.js')
OBJECTS_INFO_PATH = os.path.join(DIR, 'objects-data-simple.js')

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
        uv_coordinates = []
        
        for idx, vertex in enumerate(obj.data.vertices):
            vertices.append(list(map(lambda i: round(i, 3), vertex.co[0:3])))
        
        for i in range(len(obj.data.polygons)):
            indices.append(list(obj.data.polygons[i].vertices))
        
        uv_maps = obj.data.uv_layers
        uv_map_exists = len(uv_maps) >= 1
        
        if uv_map_exists:
            first_uv_map_key = uv_maps.keys()[0]
            uv_map = uv_maps[first_uv_map_key]
            coords = uv_map.data
            
            # Assume the UV map coords corresponds to information in indices
            
            for i in range(len(coords)):
                coord = list(map(lambda i: round(i, 3), coords[i].uv))
                uv_coordinates.append(coord)

        # Print object loc rot scale
        obj_info = {}
        loc = obj.location
        rot = obj.rotation_euler
        scale = obj.scale
        obj_info["position"] = [loc[0], loc[1], loc[2]]

        # convert angle to degrees
        rad_to_deg = 180 / math.pi
        obj_info["rotation"] = [rot[0] * rad_to_deg, rot[1] * rad_to_deg, rot[2] * rad_to_deg]
        obj_info["scale"] = [scale[0], scale[1], scale[2]]

        # Write material data name, if any
        obj_materials = obj.material_slots.keys()
        if len(obj_materials) > 0:
            obj_info["material_name"] =  obj_materials[0]

        # If parent exists, make position relative to parent.
        # NOTE: This only works if all rotation and scale are 1.
        # Which makes the obj_info rotation and scale not usable.
        #
        # A better solution would be to write the inverse matrix transf of parent
        # at parent initialization.
        # But I don't think for this WS it would be necessary to compute that.
        if obj.parent:
            parent = obj.parent
            for i in range(3):
                obj_info["position"][i] -= parent.location[i]
            obj_info["parent"] = parent.name
        
        for i in range(len(obj_info["position"])):
            obj_info["position"][i] = round(obj_info["position"][i], 3)
        
        objs_info_data[obj.name] = obj_info
        objs_verts_data[obj.name] = {
            "vertices": vertices,
            "indices": indices
        }
        if len(uv_coordinates) > 0:
            objs_verts_data[obj.name]["uv_coordinates"] = uv_coordinates
    
    with open(OBJECTS_INFO_PATH, "w+") as outfile:
        outfile.write("var objects_info = " + json.dumps(objs_info_data, sort_keys=True, indent=4))
    with open(OBJECTS_VERTEX_FPATH, "w+") as outfile:
        outfile.write("var objects_vertices = " + json.dumps(objs_verts_data))

write_selected()